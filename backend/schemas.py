from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Auth
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "student"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

# Assignment
class AssignmentCreate(BaseModel):
    title: str = "Untitled Assignment"

class AssignmentOut(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime
    class Config:
        from_attributes = True

# Draft
class DraftCreate(BaseModel):
    assignment_id: int
    content: str
    reflection_text: Optional[str] = None
    language: str = "en"

class DraftOut(BaseModel):
    id: int
    assignment_id: int
    content: str
    similarity_score: Optional[float]
    ai_probability: Optional[float]
    risk_level: Optional[str]
    learning_score: Optional[int]
    reflection_text: Optional[str]
    feedback: Optional[str]
    improvement_tips: Optional[str]
    missing_citations: Optional[str]
    language: str
    created_at: datetime
    class Config:
        from_attributes = True

class IntegrityCheckRequest(BaseModel):
    draft_id: int
    language: str = "en"

class IntegrityResult(BaseModel):
    similarity_score: float
    ai_probability: float
    risk_level: str
    learning_score: int
    feedback: str
    improvement_tips: str
    missing_citations: str

# File
class FileOut(BaseModel):
    id: int
    draft_id: int
    filename: str
    file_type: str
    extracted_text: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

# Policy
class PolicyCreate(BaseModel):
    similarity_threshold: float = 30.0
    min_drafts: int = 2

class PolicyOut(BaseModel):
    id: int
    educator_id: int
    similarity_threshold: float
    min_drafts: int
    class Config:
        from_attributes = True
