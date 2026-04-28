import csv
import io
import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from models.database import AudioFile, BenchmarkRun, Transcription, get_db

router = APIRouter()


@router.get("/{benchmark_id}/csv")
def export_csv(benchmark_id: int, db: Session = Depends(get_db)):
    br = db.query(BenchmarkRun).filter(BenchmarkRun.id == benchmark_id).first()
    if not br:
        raise HTTPException(404, "Benchmark not found")

    rows = (
        db.query(Transcription, AudioFile)
        .join(AudioFile, Transcription.audio_file_id == AudioFile.id)
        .filter(Transcription.benchmark_run_id == benchmark_id)
        .all()
    )

    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(
        ["file", "model", "status", "wer", "cer", "mer", "wil",
         "latency_s", "cost_usd", "transcript", "ground_truth", "created_at"]
    )
    for t, af in rows:
        w.writerow(
            [
                af.original_name,
                f"{t.model_provider}/{t.model_name}",
                t.status,
                t.wer, t.cer, t.mer, t.wil,
                t.latency_seconds, t.cost_usd,
                t.transcript_text,
                af.ground_truth,
                t.created_at.isoformat() if t.created_at else "",
            ]
        )

    buf.seek(0)
    fname = f"benchmark_{benchmark_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={fname}"},
    )


@router.get("/{benchmark_id}/json")
def export_json(benchmark_id: int, db: Session = Depends(get_db)):
    br = db.query(BenchmarkRun).filter(BenchmarkRun.id == benchmark_id).first()
    if not br:
        raise HTTPException(404, "Benchmark not found")

    rows = (
        db.query(Transcription, AudioFile)
        .join(AudioFile, Transcription.audio_file_id == AudioFile.id)
        .filter(Transcription.benchmark_run_id == benchmark_id)
        .all()
    )

    payload = {
        "benchmark": {
            "id": br.id,
            "name": br.name,
            "models": br.model_names,
            "status": br.status,
            "created_at": br.created_at.isoformat() if br.created_at else None,
            "completed_at": br.completed_at.isoformat() if br.completed_at else None,
        },
        "results": [
            {
                "file": af.original_name,
                "model": f"{t.model_provider}/{t.model_name}",
                "status": t.status,
                "metrics": {"wer": t.wer, "cer": t.cer, "mer": t.mer, "wil": t.wil},
                "performance": {"latency_s": t.latency_seconds, "cost_usd": t.cost_usd},
                "transcript": t.transcript_text,
                "ground_truth": af.ground_truth,
                "word_data": t.word_level_data,
            }
            for t, af in rows
        ],
    }

    fname = f"benchmark_{benchmark_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    return StreamingResponse(
        iter([json.dumps(payload, indent=2)]),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={fname}"},
    )
