import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, CheckSquare, Square, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { FILES, TRANSCRIPTIONS } from "../api/client";
import type { AudioFile, Transcription } from "../types";

const MODELS = [
  { id: "deepgram/nova-2", label: "Deepgram Nova-2", cost: "$0.0043/min" },
  { id: "deepgram/nova-3", label: "Deepgram Nova-3", cost: "$0.0059/min" },
  { id: "openai/whisper-1", label: "OpenAI Whisper-1", cost: "$0.006/min" },
  { id: "assemblyai/best", label: "AssemblyAI Best", cost: "$0.012/min" },
  { id: "assemblyai/nano", label: "AssemblyAI Nano", cost: "$0.0065/min" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    pending: { cls: "bg-gray-700 text-gray-300", icon: <Loader2 className="w-3 h-3" /> },
    running: { cls: "bg-blue-900/60 text-blue-300 animate-pulse", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    completed: { cls: "bg-green-900/60 text-green-300", icon: <CheckCircle className="w-3 h-3" /> },
    failed: { cls: "bg-red-900/60 text-red-300", icon: <AlertCircle className="w-3 h-3" /> },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>
      {s.icon} {status}
    </span>
  );
}

export default function RunPage() {
  const [selFiles, setSelFiles] = useState<Set<number>>(new Set());
  const [selModels, setSelModels] = useState<Set<string>>(new Set(["deepgram/nova-2"]));
  const [results, setResults] = useState<Transcription[]>([]);
  const qc = useQueryClient();

  const { data: files = [] } = useQuery<AudioFile[]>({
    queryKey: ["files"],
    queryFn: FILES.list,
  });

  const { data: liveResults = results, refetch } = useQuery<Transcription[]>({
    queryKey: ["run-results", results.map((r) => r.id).join(",")],
    queryFn: async () => {
      const arr = await Promise.all(
        results.map((r) =>
          TRANSCRIPTIONS.get(r.id).catch(() => r)
        )
      );
      return arr;
    },
    enabled: results.some((r) => r.status === "pending" || r.status === "running"),
    refetchInterval: 3_000,
  });

  const runMut = useMutation({
    mutationFn: () =>
      TRANSCRIPTIONS.run(Array.from(selFiles), Array.from(selModels)),
    onSuccess: (data) => {
      setResults(data);
      qc.invalidateQueries({ queryKey: ["files"] });
    },
  });

  const toggleFile = (id: number) =>
    setSelFiles((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleModel = (id: string) =>
    setSelModels((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const activeResults = liveResults.length ? liveResults : results;
  const running = activeResults.some((r) => r.status === "pending" || r.status === "running");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Run Transcriptions</h1>
        <p className="text-sm text-gray-400 mt-1">
          Select files and models, then run all combinations in parallel.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Files */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-3">
          <h2 className="font-semibold text-sm text-gray-300">
            Audio Files{" "}
            <span className="text-indigo-400">({selFiles.size} selected)</span>
          </h2>
          {files.length === 0 && (
            <p className="text-sm text-gray-500">No files uploaded yet. Go to Upload first.</p>
          )}
          {files.map((f) => {
            const sel = selFiles.has(f.id);
            return (
              <button
                key={f.id}
                onClick={() => toggleFile(f.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                  sel ? "bg-indigo-900/40 border border-indigo-600" : "bg-gray-800 border border-transparent hover:border-gray-600"
                }`}
              >
                {sel ? (
                  <CheckSquare className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm truncate">{f.original_name}</p>
                  <p className="text-xs text-gray-500">
                    {f.duration_seconds
                      ? `${Math.floor(f.duration_seconds / 60)}:${String(Math.floor(f.duration_seconds % 60)).padStart(2, "0")}`
                      : "—"}{" "}
                    · {f.ground_truth ? "GT ✓" : "No GT"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Models */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-3">
          <h2 className="font-semibold text-sm text-gray-300">
            STT Models{" "}
            <span className="text-indigo-400">({selModels.size} selected)</span>
          </h2>
          {MODELS.map((m) => {
            const sel = selModels.has(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggleModel(m.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                  sel ? "bg-indigo-900/40 border border-indigo-600" : "bg-gray-800 border border-transparent hover:border-gray-600"
                }`}
              >
                {sel ? (
                  <CheckSquare className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm">{m.label}</p>
                  <p className="text-xs text-gray-500">{m.cost}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => runMut.mutate()}
          disabled={selFiles.size === 0 || selModels.size === 0 || runMut.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
        >
          {runMut.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Run {selFiles.size * selModels.size || ""} Transcription
          {selFiles.size * selModels.size !== 1 ? "s" : ""}
        </button>
        <p className="text-sm text-gray-500">
          {selFiles.size} file{selFiles.size !== 1 ? "s" : ""} × {selModels.size} model
          {selModels.size !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Live results */}
      {activeResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Results</h2>
            {running && (
              <span className="text-xs text-blue-400 animate-pulse flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Processing...
              </span>
            )}
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Model</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">WER</th>
                  <th className="px-4 py-3 text-right">Latency</th>
                  <th className="px-4 py-3 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {activeResults.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-800/40">
                    <td className="px-4 py-3 font-mono text-xs">
                      {t.model_provider}/{t.model_name}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                      {t.error_message && (
                        <p className="text-xs text-red-400 mt-1 truncate max-w-xs" title={t.error_message}>
                          {t.error_message}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {t.wer !== null ? `${(t.wer * 100).toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-400">
                      {t.latency_seconds !== null ? `${t.latency_seconds.toFixed(2)}s` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-400">
                      {t.cost_usd !== null ? `$${t.cost_usd.toFixed(5)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
