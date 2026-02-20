from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Boolean, DateTime
from datetime import datetime
from app.database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)


class ComprehensiveRoadmap(Base):
    __tablename__ = "comprehensive_roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill = Column(String, index=True)
    timeframe = Column(String)
    current_knowledge = Column(String)
    target_level = Column(String)
    content = Column(JSON)          # Stores LLM-generated mermaid + descriptions
    nodes = Column(JSON, default=list)   # Graph structure nodes
    edges = Column(JSON, default=list)   # Graph structure edges
    node_desc = Column(JSON, default=dict)   # Node descriptions
    marked_nodes = Column(JSON, default=list)  # Completed node list
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="roadmaps")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    roadmap_id = Column(Integer, ForeignKey("comprehensive_roadmaps.id"))
    node_id = Column(String)
    attempts = Column(Integer, default=0)
    best_score = Column(Integer, nullable=True)
    best_total = Column(Integer, nullable=True)
    passed = Column(Boolean, default=False)
    quiz_json = Column(JSON, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="quiz_attempts")
    roadmap = relationship("ComprehensiveRoadmap", backref="quiz_attempts")


class QuizTemplate(Base):
    __tablename__ = "quiz_templates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    roadmap_id = Column(Integer, ForeignKey("comprehensive_roadmaps.id"))
    node_id = Column(String)
    quiz_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="quiz_templates")
    roadmap = relationship("ComprehensiveRoadmap", backref="quiz_templates")
