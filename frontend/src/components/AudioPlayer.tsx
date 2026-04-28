import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, SkipBack } from "lucide-react";

interface Props {
  fileId: number;
  seekTo?: number;
  onTimeUpdate?: (t: number) => void;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ fileId, seekTo, onTimeUpdate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    setLoading(true);
    setPlaying(false);
    setCurrent(0);

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#4338CA",
      progressColor: "#818CF8",
      cursorColor: "#E0E7FF",
      height: 56,
      normalize: true,
      backend: "WebAudio",
    });

    ws.load(`/api/files/${fileId}/audio`);
    ws.on("ready", () => {
      setDuration(ws.getDuration());
      setLoading(false);
    });
    ws.on("audioprocess", (t) => {
      setCurrent(t);
      onTimeUpdate?.(t);
    });
    ws.on("finish", () => setPlaying(false));

    wsRef.current = ws;
    return () => {
      ws.destroy();
      wsRef.current = null;
    };
  }, [fileId]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || seekTo === undefined || duration === 0) return;
    ws.seekTo(Math.min(seekTo / duration, 1));
  }, [seekTo, duration]);

  const toggle = () => {
    wsRef.current?.playPause();
    setPlaying((p) => !p);
  };

  const restart = () => {
    wsRef.current?.seekTo(0);
    setCurrent(0);
  };

  return (
    <div className="bg-gray-800/60 rounded-xl p-4 space-y-3">
      {loading && (
        <div className="h-14 flex items-center justify-center text-sm text-gray-500 animate-pulse">
          Loading waveform...
        </div>
      )}
      <div ref={containerRef} className={loading ? "hidden" : ""} />
      <div className="flex items-center gap-3">
        <button
          onClick={restart}
          className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-gray-100 transition-colors"
          title="Restart"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={toggle}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {playing ? "Pause" : "Play"}
        </button>
        <span className="text-xs text-gray-400 font-mono ml-auto">
          {fmt(current)} / {fmt(duration)}
        </span>
      </div>
    </div>
  );
}
