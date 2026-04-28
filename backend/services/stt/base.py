from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class WordInfo:
    word: str
    start: float
    end: float
    confidence: float


@dataclass
class TranscriptionResult:
    transcript: str
    words: List[WordInfo]
    latency_seconds: float
    cost_usd: float
    model_provider: str
    model_name: str
    speaker_labels: Optional[List[dict]] = field(default=None)
    duration_seconds: Optional[float] = field(default=None)


class STTAdapter(ABC):
    @abstractmethod
    async def transcribe(
        self, file_path: str, duration_seconds: Optional[float] = None
    ) -> TranscriptionResult:
        pass

    @property
    @abstractmethod
    def cost_per_minute(self) -> float:
        pass

    def calculate_cost(self, duration_seconds: float) -> float:
        return (duration_seconds / 60.0) * self.cost_per_minute
