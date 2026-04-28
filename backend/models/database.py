from sqlalchemy import (
    create_engine, Column, Integer, String, Float,
    DateTime, Text, JSON, ForeignKey,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./voice_eval.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class AudioFile(Base):
    __tablename__ = "audio_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True, index=True)
    original_name = Column(String)
    file_path = Column(String)
    duration_seconds = Column(Float, nullable=True)
    sample_rate = Column(Integer, nullable=True)
    file_size_bytes = Column(Integer)
    batch_id = Column(String, nullable=True)
    ground_truth = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    transcriptions = relationship(
        "Transcription", back_populates="audio_file", cascade="all, delete-orphan"
    )


class Transcription(Base):
    __tablename__ = "transcriptions"

    id = Column(Integer, primary_key=True, index=True)
    audio_file_id = Column(Integer, ForeignKey("audio_files.id"))
    model_provider = Column(String)
    model_name = Column(String)
    transcript_text = Column(Text, nullable=True)
    word_level_data = Column(JSON, nullable=True)
    speaker_labels = Column(JSON, nullable=True)
    latency_seconds = Column(Float, nullable=True)
    cost_usd = Column(Float, nullable=True)
    wer = Column(Float, nullable=True)
    cer = Column(Float, nullable=True)
    mer = Column(Float, nullable=True)
    wil = Column(Float, nullable=True)
    status = Column(String, default="pending")
    error_message = Column(Text, nullable=True)
    benchmark_run_id = Column(Integer, ForeignKey("benchmark_runs.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    audio_file = relationship("AudioFile", back_populates="transcriptions")
    benchmark_run = relationship("BenchmarkRun", back_populates="transcriptions")


class BenchmarkRun(Base):
    __tablename__ = "benchmark_runs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    model_names = Column(JSON)
    file_ids = Column(JSON)
    status = Column(String, default="pending")
    total_transcriptions = Column(Integer, default=0)
    completed_transcriptions = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    transcriptions = relationship("Transcription", back_populates="benchmark_run")
