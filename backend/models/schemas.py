from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class AudioFileResponse(BaseModel):
    id: int
    filename: str
    original_name: str
    file_path: str
    duration_seconds: Optional[float] = None
    sample_rate: Optional[int] = None
    file_size_bytes: int
    batch_id: Optional[str] = None
    ground_truth: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AudioFileUpdate(BaseModel):
    ground_truth: str


class TranscriptionResponse(BaseModel):
    id: int
    audio_file_id: int
    model_provider: str
    model_name: str
    transcript_text: Optional[str] = None
    word_level_data: Optional[List[Any]] = None
    speaker_labels: Optional[List[Any]] = None
    latency_seconds: Optional[float] = None
    cost_usd: Optional[float] = None
    wer: Optional[float] = None
    cer: Optional[float] = None
    mer: Optional[float] = None
    wil: Optional[float] = None
    status: str
    error_message: Optional[str] = None
    benchmark_run_id: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class RunTranscriptionRequest(BaseModel):
    file_ids: List[int]
    models: List[str]


class BenchmarkRunResponse(BaseModel):
    id: int
    name: str
    model_names: List[str]
    file_ids: List[int]
    status: str
    total_transcriptions: int
    completed_transcriptions: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    transcriptions: List[TranscriptionResponse] = []

    model_config = {"from_attributes": True}


class CreateBenchmarkRequest(BaseModel):
    name: str
    file_ids: List[int]
    models: List[str]
