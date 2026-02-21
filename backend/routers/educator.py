from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from utils.jwt import require_educator, get_current_user
import models, schemas

router = APIRouter()

@router.get("/submissions")
def get_submissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_educator),
):
    students = db.query(models.User).filter(models.User.role == "student").all()
    result = []
    for student in students:
        assignments = db.query(models.Assignment).filter(models.Assignment.user_id == student.id).all()
        for assignment in assignments:
            drafts = db.query(models.Draft).filter(models.Draft.assignment_id == assignment.id).all()
            for draft in drafts:
                result.append({
                    "student_name": student.name,
                    "student_email": student.email,
                    "assignment_title": assignment.title,
                    "draft_id": draft.id,
                    "similarity_score": draft.similarity_score,
                    "ai_probability": draft.ai_probability,
                    "risk_level": draft.risk_level,
                    "learning_score": draft.learning_score,
                    "created_at": draft.created_at,
                })
    return result

@router.get("/students")
def get_students(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_educator),
):
    students = db.query(models.User).filter(models.User.role == "student").all()
    result = []
    for student in students:
        drafts = (
            db.query(models.Draft)
            .join(models.Assignment)
            .filter(models.Assignment.user_id == student.id, models.Draft.learning_score.isnot(None))
            .all()
        )
        avg_score = sum(d.learning_score for d in drafts) / len(drafts) if drafts else None
        result.append({
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "total_drafts": len(drafts),
            "avg_learning_score": avg_score,
        })
    return result

@router.post("/policy", response_model=schemas.PolicyOut)
def set_policy(
    data: schemas.PolicyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_educator),
):
    existing = db.query(models.Policy).filter(models.Policy.educator_id == current_user.id).first()
    if existing:
        existing.similarity_threshold = data.similarity_threshold
        existing.min_drafts = data.min_drafts
        db.commit()
        db.refresh(existing)
        return existing
    policy = models.Policy(
        educator_id=current_user.id,
        similarity_threshold=data.similarity_threshold,
        min_drafts=data.min_drafts,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy

@router.get("/policy", response_model=schemas.PolicyOut)
def get_policy(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_educator),
):
    policy = db.query(models.Policy).filter(models.Policy.educator_id == current_user.id).first()
    if not policy:
        policy = models.Policy(educator_id=current_user.id)
        db.add(policy)
        db.commit()
        db.refresh(policy)
    return policy
