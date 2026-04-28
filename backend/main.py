import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from models.database import Base, engine, SessionLocal
from api.routes import files, transcriptions, benchmarks, exports

os.makedirs("uploads", exist_ok=True)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Voice AI Transcript Evaluator",
    description="Benchmark and compare STT models with WER, CER, latency, and cost metrics.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(transcriptions.router, prefix="/api/transcriptions", tags=["transcriptions"])
app.include_router(benchmarks.router, prefix="/api/benchmarks", tags=["benchmarks"])
app.include_router(exports.router, prefix="/api/exports", tags=["exports"])


@app.get("/api/health", tags=["system"])
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/api/stats", tags=["system"])
def stats():
    from models.database import AudioFile, Transcription, BenchmarkRun
    db = SessionLocal()
    try:
        return {
            "total_files": db.query(AudioFile).count(),
            "total_transcriptions": db.query(Transcription).count(),
            "completed": db.query(Transcription).filter(Transcription.status == "completed").count(),
            "running": db.query(Transcription).filter(Transcription.status == "running").count(),
            "benchmarks": db.query(BenchmarkRun).count(),
        }
    finally:
        db.close()
