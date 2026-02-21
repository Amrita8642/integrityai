from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="student")  # student | educator
    created_at = Column(DateTime, default=datetime.utcnow)

    assignments = relationship("Assignment", back_populates="user", cascade="all, delete-orphan")
    policies = relationship("Policy", back_populates="educator", cascade="all, delete-orphan")


class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), default="Untitled Assignment")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="assignments")
    drafts = relationship("Draft", back_populates="assignment", cascade="all, delete-orphan")


class Draft(Base):
    __tablename__ = "drafts"
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    content = Column(Text, nullable=False)
    similarity_score = Column(Float, nullable=True)
    ai_probability = Column(Float, nullable=True)
    risk_level = Column(String(20), nullable=True)  # Low | Medium | High
    learning_score = Column(Integer, nullable=True)
    reflection_text = Column(Text, nullable=True)
    feedback = Column(Text, nullable=True)
    improvement_tips = Column(Text, nullable=True)
    missing_citations = Column(Text, nullable=True)
    language = Column(String(10), default="en")
    created_at = Column(DateTime, default=datetime.utcnow)

    assignment = relationship("Assignment", back_populates="drafts")
    files = relationship("File", back_populates="draft", cascade="all, delete-orphan")


class File(Base):
    __tablename__ = "files"
    id = Column(Integer, primary_key=True, index=True)
    draft_id = Column(Integer, ForeignKey("drafts.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)
    extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    draft = relationship("Draft", back_populates="files")


class Policy(Base):
    __tablename__ = "policies"
    id = Column(Integer, primary_key=True, index=True)
    educator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    similarity_threshold = Column(Float, default=30.0)
    min_drafts = Column(Integer, default=2)
    created_at = Column(DateTime, default=datetime.utcnow)

    educator = relationship("User", back_populates="policies")
