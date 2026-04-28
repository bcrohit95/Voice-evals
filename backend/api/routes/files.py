import os
import uuid
import wave
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from models.database import AudioFile, get_db
from models.schemas import AudioFileResponse, AudioFileUpdate

router = APIRouter()
UPLOADS_DIR = "uploads"


def _wav_info(path: str):
    try:
        with wave.open(path, "rb") as wf:
            rate = wf.getframerate()
            duration = wf.getnframes() / float(rate)
            return int(rate), float(duration)
    except Exception:
        return None, None


@router.post("/upload", response_model=List[AudioFileResponse])
async def upload_files(
    files: List[UploadFile] = File(...),
    batch_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    results = []
    for upload in files:
        name = upload.filename or ""
        if not name.lower().endswith(".wav"):
            raise HTTPException(400, f"Only WAV files accepted: {name}")

        fid = str(uuid.uuid4())
        stored = f"{fid}.wav"
        path = os.path.join(UPLOADS_DIR, stored)

        content = await upload.read()
        with open(path, "wb") as f:
            f.write(content)

        rate, duration = _wav_info(path)

        db_file = AudioFile(
            filename=stored,
            original_name=name,
            file_path=path,
            duration_seconds=duration,
            sample_rate=rate,
            file_size_bytes=len(content),
            batch_id=batch_id or fid[:8],
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        results.append(db_file)

    return results


@router.get("", response_model=List[AudioFileResponse])
def list_files(db: Session = Depends(get_db)):
    return db.query(AudioFile).order_by(AudioFile.created_at.desc()).all()


@router.get("/{file_id}", response_model=AudioFileResponse)
def get_file(file_id: int, db: Session = Depends(get_db)):
    f = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not f:
        raise HTTPException(404, "File not found")
    return f


@router.get("/{file_id}/audio")
def stream_audio(file_id: int, db: Session = Depends(get_db)):
    f = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not f:
        raise HTTPException(404, "File not found")
    if not os.path.exists(f.file_path):
        raise HTTPException(404, "Audio missing from disk")
    return FileResponse(f.file_path, media_type="audio/wav", filename=f.original_name)


@router.put("/{file_id}/ground-truth")
def update_ground_truth(
    file_id: int, body: AudioFileUpdate, db: Session = Depends(get_db)
):
    f = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not f:
        raise HTTPException(404, "File not found")
    f.ground_truth = body.ground_truth
    db.commit()
    return {"status": "ok", "id": file_id}


@router.delete("/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db)):
    f = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not f:
        raise HTTPException(404, "File not found")
    try:
        if os.path.exists(f.file_path):
            os.remove(f.file_path)
    except OSError:
        pass
    db.delete(f)
    db.commit()
    return {"status": "deleted", "id": file_id}
