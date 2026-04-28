import time
from typing import Optional

from .base import STTAdapter, TranscriptionResult, WordInfo


class WhisperAdapter(STTAdapter):
    def __init__(self, api_key: str, model: str = "whisper-1"):
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set")
        self.api_key = api_key
        self.model = model

    async def transcribe(
        self, file_path: str, duration_seconds: Optional[float] = None
    ) -> TranscriptionResult:
        try:
            from openai import AsyncOpenAI
        except ImportError:
            raise ImportError("Run: pip install openai")

        client = AsyncOpenAI(api_key=self.api_key)
        start = time.perf_counter()

        with open(file_path, "rb") as f:
            response = await client.audio.transcriptions.create(
                model=self.model,
                file=f,
                response_format="verbose_json",
                timestamp_granularities=["word"],
            )

        latency = time.perf_counter() - start

        words = []
        if hasattr(response, "words") and response.words:
            for w in response.words:
                words.append(
                    WordInfo(
                        word=w.word,
                        start=float(w.start),
                        end=float(w.end),
                        confidence=0.0,
                    )
                )

        audio_dur = float(getattr(response, "duration", 0) or 0)
        if duration_seconds and not audio_dur:
            audio_dur = duration_seconds

        return TranscriptionResult(
            transcript=response.text,
            words=words,
            latency_seconds=latency,
            cost_usd=self.calculate_cost(audio_dur),
            model_provider="openai",
            model_name=self.model,
            duration_seconds=audio_dur,
        )

    @property
    def cost_per_minute(self) -> float:
        return 0.006
