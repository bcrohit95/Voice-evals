import os
from .base import STTAdapter
from .deepgram_adapter import DeepgramAdapter
from .whisper_adapter import WhisperAdapter
from .assemblyai_adapter import AssemblyAIAdapter

AVAILABLE_MODELS = [
    "deepgram/nova-2",
    "deepgram/nova-3",
    "openai/whisper-1",
    "assemblyai/best",
    "assemblyai/nano",
]

_FACTORIES = {
    "deepgram/nova-2": lambda: DeepgramAdapter(os.getenv("DEEPGRAM_API_KEY", ""), "nova-2"),
    "deepgram/nova-3": lambda: DeepgramAdapter(os.getenv("DEEPGRAM_API_KEY", ""), "nova-3"),
    "openai/whisper-1": lambda: WhisperAdapter(os.getenv("OPENAI_API_KEY", ""), "whisper-1"),
    "assemblyai/best": lambda: AssemblyAIAdapter(os.getenv("ASSEMBLYAI_API_KEY", ""), "best"),
    "assemblyai/nano": lambda: AssemblyAIAdapter(os.getenv("ASSEMBLYAI_API_KEY", ""), "nano"),
}


def get_adapter(provider: str, model: str) -> STTAdapter:
    key = f"{provider}/{model}"
    if key not in _FACTORIES:
        raise ValueError(f"Unknown model '{key}'. Available: {AVAILABLE_MODELS}")
    return _FACTORIES[key]()


def list_available_models():
    return AVAILABLE_MODELS
