import time
import asyncio
from typing import Optional

from .base import STTAdapter, TranscriptionResult, WordInfo


class AssemblyAIAdapter(STTAdapter):
    COSTS = {"best": 0.0120, "nano": 0.0065}

    def __init__(self, api_key: str, tier: str = "best"):
        if not api_key:
            raise ValueError("ASSEMBLYAI_API_KEY not set")
        self.api_key = api_key
        self.tier = tier

    async def transcribe(
        self, file_path: str, duration_seconds: Optional[float] = None
    ) -> TranscriptionResult:
        try:
            import assemblyai as aai
        except ImportError:
            raise ImportError("Run: pip install assemblyai")

        aai.settings.api_key = self.api_key
        speech_model = (
            aai.SpeechModel.best if self.tier == "best" else aai.SpeechModel.nano
        )
        config = aai.TranscriptionConfig(
            speaker_labels=True,
            speech_model=speech_model,
        )
        transcriber = aai.Transcriber()

        start = time.perf_counter()
        loop = asyncio.get_event_loop()
        transcript = await loop.run_in_executor(
            None, lambda: transcriber.transcribe(file_path, config=config)
        )
        latency = time.perf_counter() - start

        words = []
        if transcript.words:
            for w in transcript.words:
                words.append(
                    WordInfo(
                        word=w.text,
                        start=float(w.start) / 1000.0,
                        end=float(w.end) / 1000.0,
                        confidence=float(w.confidence or 0),
                    )
                )

        audio_dur = float(transcript.audio_duration or 0) / 1000.0
        if duration_seconds and not audio_dur:
            audio_dur = duration_seconds

        speaker_labels = None
        if transcript.utterances:
            speaker_labels = [
                {
                    "speaker": u.speaker,
                    "start": float(u.start) / 1000.0,
                    "end": float(u.end) / 1000.0,
                    "text": u.text,
                }
                for u in transcript.utterances
            ]

        return TranscriptionResult(
            transcript=transcript.text or "",
            words=words,
            latency_seconds=latency,
            cost_usd=self.calculate_cost(audio_dur),
            model_provider="assemblyai",
            model_name=self.tier,
            speaker_labels=speaker_labels,
            duration_seconds=audio_dur,
        )

    @property
    def cost_per_minute(self) -> float:
        return self.COSTS.get(self.tier, 0.0120)
