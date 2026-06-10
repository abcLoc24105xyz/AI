import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATABASE_URL = os.getenv("DATABASE_URL")

MODEL_PATH = os.path.join(BASE_DIR, "model", "best_model.keras")

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

# Model best_model.keras của bạn nhận input: 48x48x1
IMAGE_SIZE = (48, 48)