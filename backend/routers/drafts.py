from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from utils.jwt import get_current_user
from services.ai_service import run_integrity_check
import models, schemas

router = APIRouter()

@router.post("/", response_model=schemas.DraftOut)
def create_draft(
    data: schemas.DraftCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Verify assignment belongs to user
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == data.assignment_id,
        models.Assignment.user_id == current_user.id,
    ).first()
    if not assignment:
        # Auto-create assignment
        assignment = models.Assignment(user_id=current_user.id, title="Untitled Assignment")
        db.add(assignment)
        db.commit()
        db.refresh(assignment)

    draft = models.Draft(
        assignment_id=assignment.id,
        content=data.content,
        reflection_text=data.reflection_text,
        language=data.language,
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft

@router.post("/{draft_id}/check", response_model=schemas.DraftOut)
def run_check(
    draft_id: int,
    language: str = "en",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    draft = db.query(models.Draft).join(models.Assignment).filter(
        models.Draft.id == draft_id,
        models.Assignment.user_id == current_user.id,
    ).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    result = run_integrity_check(draft.content, language)
    
    draft.similarity_score = result["similarity_score"]
    draft.ai_probability = result["ai_probability"]
    draft.risk_level = result["risk_level"]
    draft.learning_score = result["learning_score"]
    draft.feedback = result["feedback"]
    draft.improvement_tips = result["improvement_tips"]
    draft.missing_citations = result["missing_citations"]
    draft.language = language
    db.commit()
    db.refresh(draft)
    return draft

@router.get("/assignment/{assignment_id}", response_model=list[schemas.DraftOut])
def list_drafts(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id,
        models.Assignment.user_id == current_user.id,
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return db.query(models.Draft).filter(models.Draft.assignment_id == assignment_id).order_by(models.Draft.created_at.desc()).all()

@router.get("/history/all", response_model=list[schemas.DraftOut])
def all_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Draft)
        .join(models.Assignment)
        .filter(models.Assignment.user_id == current_user.id)
        .order_by(models.Draft.created_at.desc())
        .limit(50)
        .all()
    )

@router.get("/{draft_id}", response_model=schemas.DraftOut)
def get_draft(
    draft_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    draft = db.query(models.Draft).join(models.Assignment).filter(
        models.Draft.id == draft_id,
        models.Assignment.user_id == current_user.id,
    ).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft
