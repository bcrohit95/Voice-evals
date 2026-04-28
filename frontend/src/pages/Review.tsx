import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, RefreshCw } from "lucide-react";
import { FILES, TRANSCRIPTIONS } from "../api/client";
import type { AudioFile, Transcription, DiffToken } from "../types";
import AudioPlayer from "../components/AudioPlayer";
import TranscriptDiff from "../components/TranscriptDiff";
import ConfidenceHeatmap from "../components/ConfidenceHeatmap";
import MetricsCard from "../components/MetricsCard";

type Tab = "diff" | "heatmap" | "speakers";

export default function ReviewPage() {
  const [fileId, setFileId] = useState<number | null>(null);
  const [transcriptionId, setTranscriptionId] = useState<number | null>(null);
  const [seekTo, setSeekTo] = useState<number | undefined>();
  const [gtEdit, setGtEdit] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("diff");
  const qc = useQueryClient();

  const { data: files = [] } = useQuery<AudioFile[]>({
    queryKey: ["files"],
    queryFn: FILES.list,
  });

  const selectedFile = files.find((f) => f.id === fileId);

  const { data: transcriptions = [] } = useQuery<Transcription[]>({
    queryKey: ["transcriptions", fileId],
    queryFn: () => TRANSCRIPTIONS.forFile(fileId!),
    enabled: !!fileId,
  });

  const completedTranscriptions = transcriptions.filter((t) => t.status === "completed");
  const selectedT = completedTranscriptions.find((t) => t.id === transcriptionId);

  const { data: diffData } = useQuery<{ diff: DiffToken[] }>({
    queryKey: ["diff", transcriptionId],
    queryFn: () => TRANSCRIPTIONS.diff(transcriptionId!),
    enabled: !!transcriptionId && !!selectedFile?.ground_truth,
  });

  const gtMut = useMutation({
    mutationFn: ({ id, gt }: { id: number; gt: string }) =>
      FILES.updateGroundTruth(id, gt),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["files"] });
      qc.invalidateQueries({ queryKey: ["diff", transcriptionId] });
    },
  });

  const recalcMut = useMutation({
    mutationFn: () => TRANSCRIPTIONS.recalculate(transcriptionId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transcriptions", fileId] }),
  });

  const currentGt = gtEdit ?? selectedFile?.ground_truth ?? "";
  const words = selectedT?.word_level_data ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold">Review Transcription</h1>

      {/* Selectors */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">Audio File</label>
          <select
            value={fileId ?? ""}
            onChange={(e) => {
              const id = Number(e.target.value) || null;
              setFileId(id);
              setTranscriptionId(null);
              setGtEdit(null);
            }}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">Select a file...</option>
            {files.map((f) => (
              <option key={f.id} value={f.id}>
                {f.original_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">Transcription Model</label>
          <select
            value={transcriptionId ?? ""}
            onChange={(e) => setTranscriptionId(Number(e.target.value) || null)}
            disabled={!fileId}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          >
            <option value="">Select model run...</option>
            {completedTranscriptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.model_provider}/{t.model_name} —{" "}
                {t.wer !== null ? `WER ${(t.wer * 100).toFixed(1)}%` : "no GT"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {fileId && (
        <AudioPlayer fileId={fileId} seekTo={seekTo} onTimeUpdate={() => {}} />
      )}

      {selectedT && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricsCard label="WER" value={selectedT.wer} format="percent" colorize />
            <MetricsCard label="CER" value={selectedT.cer} format="percent" colorize />
            <MetricsCard label="MER" value={selectedT.mer} format="percent" colorize />
            <MetricsCard label="Latency" value={selectedT.latency_seconds} format="seconds" />
          </div>

          {/* Ground truth editor */}
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Ground Truth</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    gtMut.mutate({ id: fileId!, gt: currentGt });
                    setGtEdit(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium transition-colors"
                >
                  <Save className="w-3 h-3" /> Save & Refresh
                </button>
                {selectedFile?.ground_truth && (
                  <button
                    onClick={() => recalcMut.mutate()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Recalculate
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={currentGt}
              onChange={(e) => setGtEdit(e.target.value)}
              placeholder="Enter ground truth transcript..."
              className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-sm resize-none h-20"
            />
          </div>

          {/* Tab selector */}
          <div className="flex gap-1 bg-gray-800 rounded-xl p-1 w-fit">
            {(["diff", "heatmap", "speakers"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === t ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-100"
                }`}
              >
                {t === "diff" ? "Word Diff" : t === "heatmap" ? "Confidence Heatmap" : "Speaker Diarization"}
              </button>
            ))}
          </div>

          {tab === "diff" && (
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <h2 className="font-semibold mb-3">Word-Level Diff</h2>
              {!selectedFile?.ground_truth ? (
                <p className="text-sm text-yellow-400">
                  Add a ground truth above to see the diff.
                </p>
              ) : diffData?.diff ? (
                <TranscriptDiff
                  tokens={diffData.diff}
                  wordData={words as any}
                  onWordClick={(start) => setSeekTo(start)}
                />
              ) : (
                <p className="text-sm text-gray-500">Loading diff...</p>
              )}
            </div>
          )}

          {tab === "heatmap" && (
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <h2 className="font-semibold mb-3">Confidence Heatmap</h2>
              {words.length > 0 ? (
                <ConfidenceHeatmap
                  words={words as any}
                  onWordClick={(start) => setSeekTo(start)}
                />
              ) : (
                <p className="text-sm text-gray-500">
                  No word-level confidence data available for this model.
                </p>
              )}
            </div>
          )}

          {tab === "speakers" && (
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <h2 className="font-semibold mb-3">Speaker Diarization</h2>
              {selectedT.speaker_labels && selectedT.speaker_labels.length > 0 ? (
                <div className="space-y-2">
                  {selectedT.speaker_labels.map((s: any, i: number) => (
                    <div
                      key={i}
                      className="flex gap-3 p-3 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => setSeekTo(s.start)}
                    >
                      <span className="text-xs font-bold text-indigo-400 w-16 flex-shrink-0">
                        Speaker {s.speaker}
                      </span>
                      <span className="text-xs text-gray-500 w-20 flex-shrink-0">
                        {s.start.toFixed(1)}s – {s.end.toFixed(1)}s
                      </span>
                      <span className="text-sm">{s.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No speaker diarization data. Supported by Deepgram and AssemblyAI.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {fileId && completedTranscriptions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No completed transcriptions for this file. Run transcriptions on the Run page.
        </div>
      )}
    </div>
  );
}
