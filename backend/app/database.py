from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Get the absolute path to the database file
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "roadmap_app.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# Create database directory if it doesn't exist
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False  # SQL logging disabled for cleaner output
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency for DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create all tables
def init_db():
    from app.models import User, ComprehensiveRoadmap, QuizAttempt, QuizTemplate
    Base.metadata.create_all(bind=engine)

# Initialize tables when this module is imported
init_db()
