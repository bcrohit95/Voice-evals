import time
from typing import Optional

from .base import STTAdapter, TranscriptionResult, WordInfo


class DeepgramAdapter(STTAdapter):
    COSTS = {"nova-2": 0.0043, "nova-3": 0.0059}

    def __init__(self, api_key: str, model: str = "nova-2"):
        if not api_key:
            raise ValueError("DEEPGRAM_API_KEY not set")
        self.api_key = api_key
        self.model = model

    async def transcribe(
        self, file_path: str, duration_seconds: Optional[float] = None
    ) -> TranscriptionResult:
        try:
            from deepgram import DeepgramClient, PrerecordedOptions
        except ImportError:
            raise ImportError("Run: pip install deepgram-sdk")

        client = DeepgramClient(self.api_key)
        start = time.perf_counter()

        with open(file_path, "rb") as f:
            audio_data = f.read()

        options = PrerecordedOptions(
            model=self.model,
            smart_format=True,
            punctuate=True,
            diarize=True,
            utterances=True,
            language="en",
        )

        response = await client.listen.asyncprerecorded.v("1").transcribe_file(
            {"buffer": audio_data}, options
        )
        latency = time.perf_counter() - start

        alt = response.results.channels[0].alternatives[0]
        words = [
            WordInfo(
                word=w.word,
                start=float(w.start),
                end=float(w.end),
                confidence=float(w.confidence),
            )
            for w in (alt.words or [])
        ]

        audio_dur = float(getattr(response.metadata, "duration", 0) or 0)
        if duration_seconds and not audio_dur:
            audio_dur = duration_seconds

        speaker_labels = None
        if hasattr(response.results, "utterances") and response.results.utterances:
            speaker_labels = [
                {
                    "speaker": u.speaker,
                    "start": float(u.start),
                    "end": float(u.end),
                    "text": u.transcript,
                }
                for u in response.results.utterances
            ]

        return TranscriptionResult(
            transcript=alt.transcript,
            words=words,
            latency_seconds=latency,
            cost_usd=self.calculate_cost(audio_dur),
            model_provider="deepgram",
            model_name=self.model,
            speaker_labels=speaker_labels,
            duration_seconds=audio_dur,
        )

    @property
    def cost_per_minute(self) -> float:
        return self.COSTS.get(self.model, 0.0043)
