from fastapi import FastAPI # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore

from app.auth.routes import router as auth_router
from app.routes.roadmap import router as roadmap_router
from app.routes.quizzes import router as quizzes_router
from app.database import Base, engine

# Initialize DB tables
Base.metadata.create_all(bind=engine)

# FastAPI App
app = FastAPI(title="Roadmap Learning System")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth")
app.include_router(roadmap_router, prefix="/api/roadmap")
app.include_router(quizzes_router, prefix="/api/quizzes")

# Health Check
@app.get("/")
def health_check():
    return {"status": "ok", "message": "API is running"}
