from pydantic import BaseModel
from typing import Optional

class EmotionResponse(BaseModel):

    emotion: str

    confidence: float

    angry_score: Optional[float]
    contempt_score: Optional[float]
    disgust_score: Optional[float]
    fear_score: Optional[float]
    happy_score: Optional[float]
    neutral_score: Optional[float]
    sad_score: Optional[float]
    surprised_score: Optional[float]

    image_url: Optional[str]