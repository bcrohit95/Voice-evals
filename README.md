# Voice AI Transcript Evaluator

A full-stack tool to benchmark and compare Speech-to-Text (STT) models side by side.

## What it does
- Upload WAV audio files and run them through multiple STT models
- Measure accuracy using WER (Word Error Rate), CER, MER, and WIL
- Compare latency and cost across Deepgram, OpenAI Whisper, and AssemblyAI
- Visual word-level diff between transcript and ground truth
- Benchmark mode: run all files × all models in one click

## Quick Start (Demo — no API keys needed)
```bash
cd "claude projects/claude-voiceevals"
./start_demo.sh
```
Open http://localhost:5173

## With Real APIs
1. Copy `backend/.env.example` to `backend/.env`
2. Add your API keys
3. Run `./start.sh`

## Tech Stack
- **Backend:** Python 3.11 + FastAPI + SQLite
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Metrics:** jiwer (WER/CER/MER/WIL)
- **Audio:** WaveSurfer.js
- **Charts:** Recharts
