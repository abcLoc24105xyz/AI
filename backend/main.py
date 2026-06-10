from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes import router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SỬA DÒNG NÀY: Thêm prefix="/api" vào đây ông nhé
app.include_router(router, prefix="/api")

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)