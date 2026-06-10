import uuid

from sqlalchemy import Column, String, Float, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from db import Base

class EmotionLog(Base):

    __tablename__ = "emotion_logs"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    image_url = Column(String)

    emotion = Column(String(30), nullable=False)

    confidence = Column(Float, nullable=False)

    angry_score = Column(Float)
    disgust_score = Column(Float)
    fear_score = Column(Float)
    happy_score = Column(Float)
    neutral_score = Column(Float)
    sad_score = Column(Float)
    surprised_score = Column(Float)

    detection_type = Column(String(20))

    created_at = Column(
        TIMESTAMP,
        server_default=func.now()
    )