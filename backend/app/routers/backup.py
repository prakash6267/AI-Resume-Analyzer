import os
import json
import logging
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db, engine, is_connected_to_mysql
from app.models import User, SavedResume, ATSHistory, BackupRecord
from app.auth import get_current_user

logger = logging.getLogger("resumeai.router.backup")
router = APIRouter(prefix="/api/backup", tags=["Database & Software Backup"])

@router.post("/create")
async def create_backup(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a full software & database snapshot (users, resumes, audit histories, configs).
    """
    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"proresume_backup_{timestamp_str}.json"
    backup_path = settings.BACKUPS_DIR / filename

    # Fetch all records
    users = db.query(User).all()
    resumes = db.query(SavedResume).all()
    ats_records = db.query(ATSHistory).all()

    backup_payload = {
        "metadata": {
            "created_at": datetime.utcnow().isoformat(),
            "created_by": current_user.email,
            "version": "2.5.0",
            "database_engine": "MySQL" if is_connected_to_mysql else "SQLite",
            "total_users": len(users),
            "total_resumes": len(resumes),
            "total_ats_audits": len(ats_records)
        },
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "password_hash": u.password_hash,
                "full_name": u.full_name,
                "role": u.role,
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
            for u in users
        ],
        "saved_resumes": [
            {
                "id": r.id,
                "user_id": r.user_id,
                "title": r.title,
                "target_role": r.target_role,
                "template_id": r.template_id,
                "ats_score": r.ats_score,
                "resume_data": r.resume_data,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None
            }
            for r in resumes
        ],
        "ats_history": [
            {
                "id": a.id,
                "user_id": a.user_id,
                "resume_id": a.resume_id,
                "filename": a.filename,
                "target_role": a.target_role,
                "score": a.score,
                "report_data": a.report_data,
                "created_at": a.created_at.isoformat() if a.created_at else None
            }
            for a in ats_records
        ]
    }

    content_bytes = json.dumps(backup_payload, indent=2).encode("utf-8")
    with open(backup_path, "wb") as f:
        f.write(content_bytes)

    # Save to Backup Records table
    record_counts_str = f"{len(users)} users, {len(resumes)} resumes, {len(ats_records)} audits"
    backup_rec = BackupRecord(
        filename=filename,
        backup_type="full",
        size_bytes=len(content_bytes),
        record_counts=record_counts_str
    )
    db.add(backup_rec)
    db.commit()
    db.refresh(backup_rec)

    logger.info(f"Created database snapshot backup: {filename} ({len(content_bytes)} bytes)")

    return {
        "message": "Full database and software backup archive generated successfully!",
        "backup": backup_rec.to_dict(),
        "summary": record_counts_str
    }

@router.get("/list")
async def list_backups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(BackupRecord).order_by(BackupRecord.created_at.desc()).all()

    # Also check filesystem for any existing manual files
    disk_backups = []
    if settings.BACKUPS_DIR.exists():
        for file in settings.BACKUPS_DIR.glob("*.json"):
            disk_backups.append({
                "filename": file.name,
                "size_bytes": file.stat().st_size,
                "modified": datetime.fromtimestamp(file.stat().st_mtime).isoformat()
            })

    return {
        "database_engine": "MySQL" if is_connected_to_mysql else "SQLite",
        "backups": [r.to_dict() for r in records],
        "files_on_disk": disk_backups
    }

@router.get("/download/{filename}")
async def download_backup_file(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    safe_name = os.path.basename(filename)
    file_path = settings.BACKUPS_DIR / safe_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Requested backup archive file was not found.")

    return FileResponse(
        path=file_path,
        filename=safe_name,
        media_type="application/json"
    )

@router.post("/restore")
async def restore_backup(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="Only valid .json backup archives can be restored.")

    try:
        content = await file.read()
        data = json.loads(content.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON backup archive format: {e}")

    restored_users = 0
    restored_resumes = 0
    restored_audits = 0

    # 1. Restore users
    for u_data in data.get("users", []):
        existing = db.query(User).filter(User.email == u_data["email"]).first()
        if not existing:
            new_u = User(
                email=u_data["email"],
                password_hash=u_data["password_hash"],
                full_name=u_data.get("full_name", ""),
                role=u_data.get("role", "user")
            )
            db.add(new_u)
            restored_users += 1
    db.commit()

    # 2. Restore resumes
    for r_data in data.get("saved_resumes", []):
        new_r = SavedResume(
            user_id=r_data.get("user_id", current_user.id),
            title=r_data.get("title", "Restored Resume"),
            target_role=r_data.get("target_role", ""),
            template_id=r_data.get("template_id", "classic"),
            ats_score=r_data.get("ats_score", 0),
            resume_data=r_data.get("resume_data", "{}")
        )
        db.add(new_r)
        restored_resumes += 1
    db.commit()

    # 3. Restore ATS records
    for a_data in data.get("ats_history", []):
        new_a = ATSHistory(
            user_id=a_data.get("user_id", current_user.id),
            resume_id=a_data.get("resume_id"),
            filename=a_data.get("filename", "restored.pdf"),
            target_role=a_data.get("target_role", ""),
            score=a_data.get("score", 0),
            report_data=a_data.get("report_data", "{}")
        )
        db.add(new_a)
        restored_audits += 1
    db.commit()

    logger.info(f"Restore completed: {restored_users} users, {restored_resumes} resumes, {restored_audits} audits.")

    return {
        "message": "Database and software state restored successfully!",
        "stats": {
            "restored_users": restored_users,
            "restored_resumes": restored_resumes,
            "restored_audits": restored_audits
        }
    }
