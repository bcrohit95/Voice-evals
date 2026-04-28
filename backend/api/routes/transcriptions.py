from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from models.database import AudioFile, BenchmarkRun, SessionLocal, Transcription, get_db
from models.schemas import RunTranscriptionRequest, TranscriptionResponse
from services.diff_engine import compute_word_diff
from services.metrics_engine import compute_metrics
from services.stt import get_adapter, list_available_models

router = APIRouter()


async def _run_transcription(
    transcription_id: int,
    file_path: str,
    file_duration: Optional[float],
    provider: str,
    model: str,
    ground_truth: Optional[str],
):
    db = SessionLocal()
    try:
        t = db.query(Transcription).filter(Transcription.id == transcription_id).first()
        if not t:
            return
        t.status = "running"
        db.commit()

        adapter = get_adapter(provider, model)
        result = await adapter.transcribe(file_path, duration_seconds=file_duration)

        t.transcript_text = result.transcript
        t.word_level_data = [
            {"word": w.word, "start": w.start, "end": w.end, "confidence": w.confidence}
            for w in result.words
        ]
        t.speaker_labels = result.speaker_labels
        t.latency_seconds = result.latency_seconds
        t.cost_usd = result.cost_usd
        t.status = "completed"

        if ground_truth and result.transcript:
            m = compute_metrics(result.transcript, ground_truth)
            t.wer = m.get("wer")
            t.cer = m.get("cer")
            t.mer = m.get("mer")
            t.wil = m.get("wil")

        if t.benchmark_run_id:
            br = db.query(BenchmarkRun).filter(BenchmarkRun.id == t.benchmark_run_id).first()
            if br:
                br.completed_transcriptions += 1
                if br.completed_transcriptions >= br.total_transcriptions:
                    br.status = "completed"
                    br.completed_at = datetime.utcnow()

        db.commit()
    except Exception as exc:
        db2 = SessionLocal()
        try:
            t2 = db2.query(Transcription).filter(Transcription.id == transcription_id).first()
            if t2:
                t2.status = "failed"
                t2.error_message = str(exc)
                db2.commit()
        finally:
            db2.close()
    finally:
        db.close()


@router.post("/run", response_model=List[TranscriptionResponse])
async def run_transcriptions(
    request: RunTranscriptionRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    results = []
    for file_id in request.file_ids:
        af = db.query(AudioFile).filter(AudioFile.id == file_id).first()
        if not af:
            raise HTTPException(404, f"File {file_id} not found")

        for model_str in request.models:
            parts = model_str.split("/", 1)
            if len(parts) != 2:
                raise HTTPException(400, f"Invalid model format '{model_str}'. Use 'provider/model'")
            provider, model = parts

            t = Transcription(
                audio_file_id=file_id,
                model_provider=provider,
                model_name=model,
                status="pending",
            )
            db.add(t)
            db.commit()
            db.refresh(t)

            background_tasks.add_task(
                _run_transcription,
                t.id,
                af.file_path,
                af.duration_seconds,
                provider,
                model,
                af.ground_truth,
            )
            results.append(t)

    return results


@router.get("/models")
def get_models():
    return {"models": list_available_models()}


@router.get("/file/{file_id}", response_model=List[TranscriptionResponse])
def get_file_transcriptions(file_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Transcription)
        .filter(Transcription.audio_file_id == file_id)
        .order_by(Transcription.created_at.desc())
        .all()
    )


@router.get("/{transcription_id}", response_model=TranscriptionResponse)
def get_transcription(transcription_id: int, db: Session = Depends(get_db)):
    t = db.query(Transcription).filter(Transcription.id == transcription_id).first()
    if not t:
        raise HTTPException(404, "Transcription not found")
    return t


@router.get("/{transcription_id}/diff")
def get_diff(transcription_id: int, db: Session = Depends(get_db)):
    t = db.query(Transcription).filter(Transcription.id == transcription_id).first()
    if not t:
        raise HTTPException(404, "Not found")
    if not t.transcript_text:
        raise HTTPException(400, "No transcript available yet")

    af = db.query(AudioFile).filter(AudioFile.id == t.audio_file_id).first()
    if not af or not af.ground_truth:
        raise HTTPException(400, "No ground truth for this file")

    return {"diff": compute_word_diff(t.transcript_text, af.ground_truth)}


@router.put("/{transcription_id}/recalculate")
def recalculate(transcription_id: int, db: Session = Depends(get_db)):
    t = db.query(Transcription).filter(Transcription.id == transcription_id).first()
    if not t:
        raise HTTPException(404, "Not found")

    af = db.query(AudioFile).filter(AudioFile.id == t.audio_file_id).first()
    if not af or not af.ground_truth:
        raise HTTPException(400, "No ground truth")

    m = compute_metrics(t.transcript_text or "", af.ground_truth)
    t.wer = m.get("wer")
    t.cer = m.get("cer")
    t.mer = m.get("mer")
    t.wil = m.get("wil")
    db.commit()
    return {**m, "id": transcription_id}


@router.get("/history/trend")
def wer_trend(db: Session = Depends(get_db)):
    rows = (
        db.query(Transcription)
        .filter(Transcription.status == "completed", Transcription.wer != None)
        .order_by(Transcription.created_at.asc())
        .all()
    )
    return [
        {
            "id": t.id,
            "model": f"{t.model_provider}/{t.model_name}",
            "wer": t.wer,
            "latency": t.latency_seconds,
            "cost": t.cost_usd,
            "date": t.created_at.isoformat(),
        }
        for t in rows
    ]
