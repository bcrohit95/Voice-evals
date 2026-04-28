import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, Loader2, CheckSquare, Square, Download, ExternalLink } from "lucide-react";
import { FILES, BENCHMARKS } from "../api/client";
import type { AudioFile, BenchmarkRun } from "../types";

const MODELS = [
  { id: "deepgram/nova-2", label: "Deepgram Nova-2" },
  { id: "deepgram/nova-3", label: "Deepgram Nova-3" },
  { id: "openai/whisper-1", label: "OpenAI Whisper-1" },
  { id: "assemblyai/best", label: "AssemblyAI Best" },
  { id: "assemblyai/nano", label: "AssemblyAI Nano" },
];

function Progress({ completed, total }: { completed: number; total: number }) {
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{completed}/{total} transcriptions</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function BenchmarkPage() {
  const [name, setName] = useState("");
  const [selFiles, setSelFiles] = useState<Set<number>>(new Set());
  const [selModels, setSelModels] = useState<Set<string>>(new Set());
  const [activeBenchmark, setActiveBenchmark] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data: files = [] } = useQuery<AudioFile[]>({
    queryKey: ["files"],
    queryFn: FILES.list,
  });

  const { data: benchmarks = [] } = useQuery<BenchmarkRun[]>({
    queryKey: ["benchmarks"],
    queryFn: BENCHMARKS.list,
    refetchInterval: 5_000,
  });

  const { data: summary } = useQuery({
    queryKey: ["benchmark-summary", activeBenchmark],
    queryFn: () => BENCHMARKS.summary(activeBenchmark!),
    enabled: !!activeBenchmark,
    refetchInterval: 4_000,
  });

  const createMut = useMutation({
    mutationFn: () =>
      BENCHMARKS.create(
        name || `Benchmark ${new Date().toLocaleString()}`,
        Array.from(selFiles),
        Array.from(selModels)
      ),
    onSuccess: (data) => {
      setActiveBenchmark(data.id);
      qc.invalidateQueries({ queryKey: ["benchmarks"] });
    },
  });

  const toggle = <T,>(set: Set<T>, item: T): Set<T> => {
    const n = new Set(set);
    n.has(item) ? n.delete(item) : n.add(item);
    return n;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Benchmark Mode</h1>
        <p className="text-sm text-gray-400 mt-1">
          Run all selected files × models and compare results side by side.
        </p>
      </div>

      {/* Config */}
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Benchmark name (optional)"
          className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-sm"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-2">
              Files <span className="text-indigo-400">({selFiles.size})</span>
            </p>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {files.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelFiles((p) => toggle(p, f.id))}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-sm text-left transition-colors ${
                    selFiles.has(f.id)
                      ? "bg-indigo-900/40 border border-indigo-600"
                      : "bg-gray-800 border border-transparent hover:border-gray-600"
                  }`}
                >
                  {selFiles.has(f.id) ? (
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-gray-500" />
                  )}
                  <span className="truncate">{f.original_name}</span>
                </button>
              ))}
              {files.length === 0 && (
                <p className="text-sm text-gray-500 p-2">No files uploaded</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2">
              Models <span className="text-indigo-400">({selModels.size})</span>
            </p>
            <div className="space-y-1.5">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelModels((p) => toggle(p, m.id))}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-sm text-left transition-colors ${
                    selModels.has(m.id)
                      ? "bg-indigo-900/40 border border-indigo-600"
                      : "bg-gray-800 border border-transparent hover:border-gray-600"
                  }`}
                >
                  {selModels.has(m.id) ? (
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-gray-500" />
                  )}
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => createMut.mutate()}
          disabled={selFiles.size === 0 || selModels.size === 0 || createMut.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
        >
          {createMut.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Target className="w-4 h-4" />
          )}
          Run Benchmark ({selFiles.size * selModels.size} transcriptions)
        </button>
      </div>

      {/* Active benchmark summary */}
      {activeBenchmark && summary && (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{summary.name}</h2>
            <div className="flex gap-2">
              <a
                href={BENCHMARKS.exportCsv(activeBenchmark)}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition-colors"
              >
                <Download className="w-3 h-3" /> CSV
              </a>
              <a
                href={BENCHMARKS.exportJson(activeBenchmark)}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition-colors"
              >
                <Download className="w-3 h-3" /> JSON
              </a>
            </div>
          </div>

          <Progress
            completed={
              benchmarks.find((b) => b.id === activeBenchmark)?.completed_transcriptions ?? 0
            }
            total={
              benchmarks.find((b) => b.id === activeBenchmark)?.total_transcriptions ?? 1
            }
          />

          {summary.model_summary?.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-left">Model</th>
                    <th className="px-4 py-3 text-right">Avg WER</th>
                    <th className="px-4 py-3 text-right">Avg Latency</th>
                    <th className="px-4 py-3 text-right">Total Cost</th>
                    <th className="px-4 py-3 text-right">Samples</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {summary.model_summary.map((row: any, i: number) => (
                    <tr
                      key={row.model}
                      className={`hover:bg-gray-800/40 ${i === 0 ? "text-yellow-300" : ""}`}
                    >
                      <td className="px-4 py-3 text-center">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{row.model}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {row.avg_wer !== null ? `${(row.avg_wer * 100).toFixed(2)}%` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-400">
                        {row.avg_latency !== null ? `${row.avg_latency.toFixed(2)}s` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-400">
                        {row.total_cost !== null ? `$${row.total_cost.toFixed(5)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                        {row.samples}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Past benchmarks */}
      {benchmarks.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Past Benchmarks</h2>
          <div className="space-y-2">
            {benchmarks.map((b) => (
              <button
                key={b.id}
                onClick={() => setActiveBenchmark(b.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-colors ${
                  activeBenchmark === b.id
                    ? "border-indigo-600 bg-indigo-900/20"
                    : "border-gray-800 bg-gray-900 hover:border-gray-700"
                }`}
              >
                <div>
                  <p className="font-medium text-sm">{b.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {b.model_names.join(", ")} · {b.file_ids.length} file
                    {b.file_ids.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      b.status === "completed"
                        ? "bg-green-900/60 text-green-300"
                        : "bg-blue-900/60 text-blue-300 animate-pulse"
                    }`}
                  >
                    {b.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {b.completed_transcriptions}/{b.total_transcriptions}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
