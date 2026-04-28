from datetime import datetime
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from models.database import AudioFile, BenchmarkRun, Transcription, get_db
from models.schemas import BenchmarkRunResponse, CreateBenchmarkRequest

router = APIRouter()


@router.post("", response_model=BenchmarkRunResponse)
async def create_benchmark(
    request: CreateBenchmarkRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    total = len(request.file_ids) * len(request.models)
    br = BenchmarkRun(
        name=request.name,
        model_names=request.models,
        file_ids=request.file_ids,
        status="running",
        total_transcriptions=total,
        completed_transcriptions=0,
    )
    db.add(br)
    db.commit()
    db.refresh(br)

    from api.routes.transcriptions import _run_transcription

    for file_id in request.file_ids:
        af = db.query(AudioFile).filter(AudioFile.id == file_id).first()
        if not af:
            continue
        for model_str in request.models:
            parts = model_str.split("/", 1)
            if len(parts) != 2:
                continue
            provider, model = parts
            t = Transcription(
                audio_file_id=file_id,
                model_provider=provider,
                model_name=model,
                status="pending",
                benchmark_run_id=br.id,
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

    db.refresh(br)
    return br


@router.get("", response_model=List[BenchmarkRunResponse])
def list_benchmarks(db: Session = Depends(get_db)):
    return db.query(BenchmarkRun).order_by(BenchmarkRun.created_at.desc()).all()


@router.get("/{benchmark_id}", response_model=BenchmarkRunResponse)
def get_benchmark(benchmark_id: int, db: Session = Depends(get_db)):
    br = db.query(BenchmarkRun).filter(BenchmarkRun.id == benchmark_id).first()
    if not br:
        raise HTTPException(404, "Benchmark not found")
    return br


@router.get("/{benchmark_id}/summary")
def benchmark_summary(benchmark_id: int, db: Session = Depends(get_db)):
    br = db.query(BenchmarkRun).filter(BenchmarkRun.id == benchmark_id).first()
    if not br:
        raise HTTPException(404, "Not found")

    rows = (
        db.query(Transcription)
        .filter(
            Transcription.benchmark_run_id == benchmark_id,
            Transcription.status == "completed",
        )
        .all()
    )

    stats: dict = {}
    for t in rows:
        key = f"{t.model_provider}/{t.model_name}"
        if key not in stats:
            stats[key] = {"wer": [], "lat": [], "cost": []}
        if t.wer is not None:
            stats[key]["wer"].append(t.wer)
        if t.latency_seconds is not None:
            stats[key]["lat"].append(t.latency_seconds)
        if t.cost_usd is not None:
            stats[key]["cost"].append(t.cost_usd)

    summary = []
    for key, v in stats.items():
        summary.append(
            {
                "model": key,
                "avg_wer": round(sum(v["wer"]) / len(v["wer"]), 4) if v["wer"] else None,
                "avg_latency": round(sum(v["lat"]) / len(v["lat"]), 3) if v["lat"] else None,
                "total_cost": round(sum(v["cost"]), 6) if v["cost"] else None,
                "samples": len(v["wer"]),
            }
        )
    summary.sort(key=lambda x: x["avg_wer"] if x["avg_wer"] is not None else 999)

    return {
        "id": br.id,
        "name": br.name,
        "status": br.status,
        "model_summary": summary,
        "total_files": len(br.file_ids),
        "total_models": len(br.model_names),
        "progress": f"{br.completed_transcriptions}/{br.total_transcriptions}",
    }
