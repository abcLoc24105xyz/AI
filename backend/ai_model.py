import os
import numpy as np
import tensorflow as tf
from keras.models import load_model
from config import MODEL_PATH

# Tự động định vị file labels.npy sinh ra từ Colab để map nhãn chuẩn 100%
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LABELS_PATH = os.path.join(BASE_DIR, "model", "labels.npy")

print("==> Đang tải mô hình nhận diện cảm xúc...")
model = load_model(MODEL_PATH)

# Đồng bộ danh sách nhãn theo đúng thứ tự lúc train
if os.path.exists(LABELS_PATH):
    labels_dict = np.load(LABELS_PATH, allow_pickle=True).item()
    EMOTION_LABELS = [labels_dict[i] for i in sorted(labels_dict.keys())]
    print("✅ Đồng bộ nhãn thành công từ labels.npy:", EMOTION_LABELS)
else:
    print("⚠️ Không tìm thấy labels.npy, sử dụng danh sách nhãn mặc định.")
    from utils.labels import EMOTION_LABELS

def predict_emotion(img):
    # 1. Ép kiểu dữ liệu bắt buộc về np.float32 để tương thích Mixed Precision
    img_input = np.array(img, dtype=np.float32)

    # 2. XỬ LÝ LỖI DOUBLE NORMALIZATION
    # Do mô hình đã có layer Rescaling(1./255) bên trong, đầu vào cần ở dạng 0-255.
    # Nếu giá trị lớn nhất của ảnh <= 1.0, chứng tỏ hàm preprocess cũ đã chia 255.
    # Ta phải nhân ngược lại với 255.0 để khôi phục dải giá trị chuẩn.
    if np.max(img_input) <= 1.0:
        img_input = img_input * 255.0

    # 3. CHUẨN HÓA SHAPE ĐẦU VÀO (Đảm bảo luôn là 4D: [1, 96, 96, 1])
    if len(img_input.shape) == 2:  # Nếu chỉ có (96, 96)
        img_input = np.expand_dims(img_input, axis=(0, -1))
    elif len(img_input.shape) == 3:
        if img_input.shape[-1] != 1: # Nếu thiếu channel
            img_input = np.expand_dims(img_input, axis=-1)
        if img_input.shape[0] != 1:  # Nếu thiếu kích thước Batch
            img_input = np.expand_dims(img_input, axis=0)

    # 4. Thực hiện dự đoán
    prediction = model.predict(img_input, verbose=0)[0]

    emotion_index = np.argmax(prediction)
    emotion = EMOTION_LABELS[emotion_index]
    confidence = float(prediction[emotion_index])

    scores = {}
    for i, label in enumerate(EMOTION_LABELS):
        scores[f"{label}_score"] = float(prediction[i])

    return emotion, confidence, scores