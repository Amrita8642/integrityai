from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from utils.jwt import get_current_user
import models, schemas

router = APIRouter()

@router.post("/", response_model=schemas.AssignmentOut)
def create_assignment(
    data: schemas.AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    assignment = models.Assignment(user_id=current_user.id, title=data.title)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment

@router.get("/", response_model=list[schemas.AssignmentOut])
def list_assignments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Assignment).filter(models.Assignment.user_id == current_user.id).all()

@router.get("/{assignment_id}", response_model=schemas.AssignmentOut)
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id,
        models.Assignment.user_id == current_user.id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment

@router.get("/{assignment_id}/auto-or-create", response_model=schemas.AssignmentOut)
def auto_or_create_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id,
        models.Assignment.user_id == current_user.id
    ).first()
    if not assignment:
        assignment = models.Assignment(user_id=current_user.id, title="Untitled Assignment")
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
    return assignment
