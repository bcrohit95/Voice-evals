"""
Seed the database with realistic demo data — no API keys required.
Run from the backend/ directory with the virtualenv active:
    python seed_demo.py
"""
import math
import os
import struct
import sys
import wave
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from models.database import AudioFile, Base, BenchmarkRun, SessionLocal, Transcription, engine
from services.metrics_engine import compute_metrics

os.makedirs("uploads", exist_ok=True)
Base.metadata.create_all(bind=engine)


def make_wav(path: str, duration: float = 5.0, sample_rate: int = 16000) -> None:
    n = int(sample_rate * duration)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        data = b"".join(
            struct.pack("<h", int(32767 * 0.3 * math.sin(2 * math.pi * 440 * i / sample_rate)))
            for i in range(n)
        )
        wf.writeframes(data)


SAMPLES = [
    {
        "file": "demo_001.wav",
        "name": "customer_support_001.wav",
        "gt": "thank you for calling our support line how can i help you today",
        "dur": 4.2,
    },
    {
        "file": "demo_002.wav",
        "name": "podcast_excerpt_002.wav",
        "gt": "artificial intelligence is transforming the way we interact with technology",
        "dur": 5.8,
    },
    {
        "file": "demo_003.wav",
        "name": "meeting_recording_003.wav",
        "gt": "lets schedule a follow up meeting for next tuesday afternoon",
        "dur": 3.5,
    },
]

# (transcript, latency_seconds)
RESULTS: dict = {
    "deepgram/nova-2": {
        "demo_001.wav": ("thank you for calling our support line how can i help you today", 1.24),
        "demo_002.wav": ("artificial intelligence is transforming the way we interact with technology", 1.87),
        "demo_003.wav": ("let us schedule a follow up meeting for next tuesday afternoon", 1.12),
    },
    "deepgram/nova-3": {
        "demo_001.wav": ("thank you for calling our support line how can i help you today", 1.31),
        "demo_002.wav": ("artificial intelligence is transforming the way we interact with technology", 1.94),
        "demo_003.wav": ("lets schedule a follow up meeting for next tuesday afternoon", 1.19),
    },
    "openai/whisper-1": {
        "demo_001.wav": ("thank you for calling our support line how can i help you today", 3.21),
        "demo_002.wav": ("artificial intelligence is transforming the way we interact with technology", 4.12),
        "demo_003.wav": ("let schedule a follow up meeting for next tuesday afternoon", 2.98),
    },
    "assemblyai/best": {
        "demo_001.wav": ("thank you for calling our support line how can i help you today", 8.45),
        "demo_002.wav": ("artificial intelligence is transforming the way interact with technology", 9.23),
        "demo_003.wav": ("lets schedule follow up meeting for next tuesday afternoon", 7.89),
    },
    "assemblyai/nano": {
        "demo_001.wav": ("thank you calling our support line how can i help you today", 4.11),
        "demo_002.wav": ("artificial intelligence is transforming way we interact with technology", 4.87),
        "demo_003.wav": ("lets schedule a follow up meeting next tuesday afternoon", 3.62),
    },
}

COSTS_PER_MIN = {
    "deepgram/nova-2": 0.0043,
    "deepgram/nova-3": 0.0059,
    "openai/whisper-1": 0.006,
    "assemblyai/best": 0.012,
    "assemblyai/nano": 0.0065,
}

WORD_DATA = [
    {"word": "thank", "start": 0.10, "end": 0.30, "confidence": 0.99},
    {"word": "you", "start": 0.31, "end": 0.50, "confidence": 0.99},
    {"word": "for", "start": 0.51, "end": 0.65, "confidence": 0.97},
    {"word": "calling", "start": 0.66, "end": 0.92, "confidence": 0.98},
    {"word": "our", "start": 0.93, "end": 1.10, "confidence": 0.95},
    {"word": "support", "start": 1.11, "end": 1.50, "confidence": 0.99},
    {"word": "line", "start": 1.51, "end": 1.80, "confidence": 0.99},
    {"word": "how", "start": 2.00, "end": 2.20, "confidence": 0.97},
    {"word": "can", "start": 2.21, "end": 2.40, "confidence": 0.96},
    {"word": "i", "start": 2.41, "end": 2.50, "confidence": 0.99},
    {"word": "help", "start": 2.51, "end": 2.80, "confidence": 0.99},
    {"word": "you", "start": 2.81, "end": 2.95, "confidence": 0.99},
    {"word": "today", "start": 2.96, "end": 3.40, "confidence": 0.97},
]

SPEAKER_LABELS = [
    {"speaker": "A", "start": 0.0, "end": 2.1, "text": "thank you for calling our support line"},
    {"speaker": "B", "start": 2.2, "end": 4.2, "text": "how can i help you today"},
]


def seed() -> None:
    db = SessionLocal()

    # Wipe existing demo data
    db.query(Transcription).delete()
    db.query(BenchmarkRun).delete()
    db.query(AudioFile).delete()
    db.commit()

    file_map: dict[str, AudioFile] = {}
    for s in SAMPLES:
        path = os.path.join("uploads", s["file"])
        make_wav(path, duration=s["dur"])
        af = AudioFile(
            filename=s["file"],
            original_name=s["name"],
            file_path=path,
            duration_seconds=s["dur"],
            sample_rate=16000,
            file_size_bytes=int(s["dur"] * 16000 * 2 + 44),
            batch_id="demo",
            ground_truth=s["gt"],
        )
        db.add(af)
        db.commit()
        db.refresh(af)
        file_map[s["file"]] = af

    offset = 0
    transcription_ids: list[int] = []
    for model_str, file_results in RESULTS.items():
        provider, model = model_str.split("/", 1)
        for fname, (text, latency) in file_results.items():
            af = file_map[fname]
            dur = next(s["dur"] for s in SAMPLES if s["file"] == fname)
            cost = (dur / 60.0) * COSTS_PER_MIN.get(model_str, 0.005)
            metrics = compute_metrics(text, af.ground_truth or "")
            word_data = WORD_DATA if fname == "demo_001.wav" else None
            speaker_data = SPEAKER_LABELS if fname == "demo_001.wav" and provider != "openai" else None

            t = Transcription(
                audio_file_id=af.id,
                model_provider=provider,
                model_name=model,
                transcript_text=text,
                word_level_data=word_data,
                speaker_labels=speaker_data,
                latency_seconds=latency,
                cost_usd=cost,
                wer=metrics.get("wer"),
                cer=metrics.get("cer"),
                mer=metrics.get("mer"),
                wil=metrics.get("wil"),
                status="completed",
                created_at=datetime.utcnow() - timedelta(minutes=offset),
            )
            db.add(t)
            db.commit()
            db.refresh(t)
            transcription_ids.append(t.id)
            offset += 3

    # Benchmark run
    br = BenchmarkRun(
        name="Demo Benchmark — All Models vs All Files",
        model_names=list(RESULTS.keys()),
        file_ids=[af.id for af in file_map.values()],
        status="completed",
        total_transcriptions=len(transcription_ids),
        completed_transcriptions=len(transcription_ids),
        created_at=datetime.utcnow() - timedelta(hours=1),
        completed_at=datetime.utcnow() - timedelta(minutes=50),
    )
    db.add(br)
    db.commit()
    db.refresh(br)

    for tid in transcription_ids:
        t = db.query(Transcription).filter(Transcription.id == tid).first()
        if t:
            t.benchmark_run_id = br.id
    db.commit()
    db.close()

    print("✓ Demo data seeded!")
    print(f"  {len(SAMPLES)} audio files")
    print(f"  {len(transcription_ids)} transcriptions ({len(RESULTS)} models × {len(SAMPLES)} files)")
    print(f"  1 benchmark run")


if __name__ == "__main__":
    seed()
