import os
import uuid
import shutil
import cv2

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db import get_db
from models import EmotionLog
from config import UPLOAD_FOLDER
from utils.face_detector import detect_face
from utils.image_processing import preprocess_image
from utils.metrics import calculate_confidence
from ai_model import predict_emotion

router = APIRouter()

ACTIVE_SESSIONS = {}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "bmp"]


def get_extension(filename: str):
    if not filename or "." not in filename:
        return "jpg"

    ext = filename.split(".")[-1].lower()

    if ext in ALLOWED_EXTENSIONS:
        return ext

    return "jpg"


def normalize_scores(scores: dict):
    fixed = {
        "angry_score": None,
        "disgust_score": None,
        "fear_score": None,
        "happy_score": None,
        "neutral_score": None,
        "sad_score": None,
        "surprised_score": None,
    }

    if not scores:
        return fixed

    for key, value in scores.items():
        k = str(key).lower()

        if "angry" in k:
            fixed["angry_score"] = value
        elif "disgust" in k:
            fixed["disgust_score"] = value
        elif "fear" in k:
            fixed["fear_score"] = value
        elif "happy" in k:
            fixed["happy_score"] = value
        elif "neutral" in k:
            fixed["neutral_score"] = value
        elif "sad" in k:
            fixed["sad_score"] = value
        elif "surprise" in k or "surprised" in k:
            fixed["surprised_score"] = value

    return fixed


@router.post("/predict")
async def predict_image(
    file: UploadFile = File(...),
    detection_type: str = Query("upload"),
    session_id: str | None = Query(None),
    db: Session = Depends(get_db)
):
    file_extension = get_extension(file.filename)

    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Định dạng ảnh không hợp lệ. Hãy chọn JPG, JPEG, PNG, WEBP hoặc BMP."
        )

    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        print("Save image error:", e)
        raise HTTPException(
            status_code=500,
            detail="Không lưu được ảnh upload."
        )

    img = cv2.imread(file_path)

    if img is None:
        raise HTTPException(
            status_code=400,
            detail="Không đọc được ảnh. Hãy thử ảnh JPG hoặc PNG khác."
        )

    try:
        face = detect_face(img)
    except Exception as e:
        print("Face detection error:", e)
        raise HTTPException(
            status_code=400,
            detail="Phát hiện khuôn mặt thất bại."
        )

    if face is None:
        raise HTTPException(
            status_code=400,
            detail="Không phát hiện được khuôn mặt. Hãy chọn ảnh rõ mặt hơn."
        )

    try:
        processed_image = preprocess_image(face)
        emotion, confidence, scores = predict_emotion(processed_image)
    except Exception as e:
        print("Model predict error:", e)
        raise HTTPException(
            status_code=500,
            detail=f"Model AI xử lý thất bại: {str(e)}"
        )

    confidence_percent = calculate_confidence(confidence)
    image_url = f"/uploads/{filename}"

    result_data = {
        "emotion": emotion,
        "confidence": confidence_percent,
        "scores": scores,
        "image_url": image_url,
        "detection_type": detection_type
    }

    fixed_scores = normalize_scores(scores)

    try:
        log = EmotionLog(
            image_url=image_url,
            emotion=emotion,
            confidence=confidence_percent,
            angry_score=fixed_scores["angry_score"],
            disgust_score=fixed_scores["disgust_score"],
            fear_score=fixed_scores["fear_score"],
            happy_score=fixed_scores["happy_score"],
            neutral_score=fixed_scores["neutral_score"],
            sad_score=fixed_scores["sad_score"],
            surprised_score=fixed_scores["surprised_score"],
            detection_type=detection_type
        )

        db.add(log)
        db.commit()
    except Exception as e:
        db.rollback()
        print("Database log error:", e)
        result_data["db_warning"] = "Nhận diện thành công nhưng không lưu được lịch sử."

    if session_id:
        ACTIVE_SESSIONS[session_id] = {
            "status": "completed",
            "data": result_data
        }

        return {
            "status": "success",
            "message": "Đã truyền dữ liệu về PC thành công!",
            "data": result_data
        }

    return result_data


@router.get("/session/{session_id}")
def check_session(session_id: str):
    if session_id in ACTIVE_SESSIONS:
        return ACTIVE_SESSIONS[session_id]

    return {
        "status": "pending",
        "data": None
    }


@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    logs = (
        db.query(EmotionLog)
        .order_by(EmotionLog.created_at.desc())
        .all()
    )

    return [
        {
            "id": str(log.id),
            "image_url": log.image_url,
            "emotion": log.emotion,
            "confidence": log.confidence,
            "detection_type": log.detection_type,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]


@router.delete("/history")
def delete_history(db: Session = Depends(get_db)):
    try:
        # Xóa dữ liệu trong database
        db.query(EmotionLog).delete()
        db.commit()

        # Xóa toàn bộ ảnh đã lưu trong backend/uploads
        if os.path.exists(UPLOAD_FOLDER):
            for filename in os.listdir(UPLOAD_FOLDER):
                file_path = os.path.join(UPLOAD_FOLDER, filename)

                if os.path.isfile(file_path):
                    os.remove(file_path)

        # Xóa session mobile/webcam tạm trong RAM
        ACTIVE_SESSIONS.clear()

        return {
            "status": "success",
            "message": "Đã xóa toàn bộ lịch sử ảnh."
        }

    except Exception as e:
        db.rollback()
        print("Delete history error:", e)
        raise HTTPException(
            status_code=500,
            detail="Không xóa được lịch sử ảnh."
        )
@router.delete("/history/{log_id}")
def delete_history_item(log_id: str, db: Session = Depends(get_db)):
    try:
        try:
            parsed_id = uuid.UUID(log_id)
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="ID lịch sử không hợp lệ."
            )

        log = db.query(EmotionLog).filter(EmotionLog.id == parsed_id).first()

        if not log:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy lịch sử cần xóa."
            )

        image_url = log.image_url

        # Xóa bản ghi trong database
        db.delete(log)
        db.commit()

        # Xóa file ảnh trong thư mục uploads
        if image_url:
            filename = os.path.basename(image_url)
            file_path = os.path.join(UPLOAD_FOLDER, filename)

            if os.path.isfile(file_path):
                os.remove(file_path)

        return {
            "status": "success",
            "message": "Đã xóa lịch sử ảnh này."
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        print("Delete history item error:", e)
        raise HTTPException(
            status_code=500,
            detail="Không xóa được lịch sử ảnh này."
        )