from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile
from sqlalchemy.orm import Session
from database import get_db
from utils.jwt import get_current_user
from services.file_service import extract_document
import models, schemas

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/upload/{draft_id}")
async def upload_file(
    draft_id: int,
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Upload a document, extract its text, store it, and update the parent draft.
    Returns full extraction metadata so the frontend can render the editable editor.
    """
    # ── Auth check ────────────────────────────────────────────────
    draft = (
        db.query(models.Draft)
        .join(models.Assignment)
        .filter(
            models.Draft.id == draft_id,
            models.Assignment.user_id == current_user.id,
        )
        .first()
    )
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    # ── Size guard ────────────────────────────────────────────────
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum allowed size is 10 MB.",
        )

    # ── Extract ───────────────────────────────────────────────────
    try:
        result = extract_document(content, file.filename or "upload")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while reading the file. Please try again.",
        )

    # ── Persist file record ───────────────────────────────────────
    file_record = models.File(
        draft_id=draft_id,
        filename=file.filename,
        file_type=result.file_type,
        extracted_text=result.text,
    )
    db.add(file_record)

    # Update draft content so integrity check uses extracted text
    draft.content = result.text
    db.commit()
    db.refresh(file_record)

    return {
        "id": file_record.id,
        "draft_id": file_record.draft_id,
        "filename": file_record.filename,
        "file_type": file_record.file_type,
        "extracted_text": file_record.extracted_text,
        "page_count": result.page_count,
        "scanned": result.scanned,
        "warning": result.warning,
        "created_at": file_record.created_at,
    }
