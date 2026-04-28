import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, CartesianGrid, Legend,
} from "recharts";
import { FILES, TRANSCRIPTIONS, STATS } from "../api/client";
import type { AudioFile, Transcription } from "../types";

interface StatCard {
  label: string;
  value: string | number;
}

function StatCard({ label, value }: StatCard) {
  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: STATS.get, refetchInterval: 10_000 });
  const { data: trend = [] } = useQuery({ queryKey: ["trend"], queryFn: TRANSCRIPTIONS.trend, refetchInterval: 10_000 });
  const { data: files = [] } = useQuery<AudioFile[]>({ queryKey: ["files"], queryFn: FILES.list });

  // Aggregate per model
  const modelStats = new Map<string, { wer: number[]; lat: number[]; cost: number[] }>();
  for (const row of trend as any[]) {
    if (!modelStats.has(row.model)) modelStats.set(row.model, { wer: [], lat: [], cost: [] });
    const m = modelStats.get(row.model)!;
    if (row.wer !== null) m.wer.push(row.wer);
    if (row.latency !== null) m.lat.push(row.latency);
    if (row.cost !== null) m.cost.push(row.cost);
  }

  const leaderboard = Array.from(modelStats.entries())
    .map(([model, v]) => ({
      model: model.split("/")[1] || model,
      fullModel: model,
      avgWer: v.wer.length ? v.wer.reduce((a, b) => a + b) / v.wer.length : null,
      avgLat: v.lat.length ? v.lat.reduce((a, b) => a + b) / v.lat.length : null,
      avgCost: v.cost.length ? v.cost.reduce((a, b) => a + b) / v.cost.length : null,
      runs: v.wer.length,
    }))
    .sort((a, b) => (a.avgWer ?? 999) - (b.avgWer ?? 999));

  const scatterData = leaderboard
    .filter((r) => r.avgLat !== null && r.avgCost !== null)
    .map((r) => ({ name: r.model, lat: +(r.avgLat!.toFixed(2)), cost: +(r.avgCost! * 1000).toFixed(4) }));

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Files" value={stats?.total_files ?? "—"} />
        <StatCard label="Transcriptions" value={stats?.total_transcriptions ?? "—"} />
        <StatCard label="Completed" value={stats?.completed ?? "—"} />
        <StatCard label="Benchmarks" value={stats?.benchmarks ?? "—"} />
      </div>

      {leaderboard.length === 0 && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center text-gray-500">
          No completed transcriptions yet. Run some transcriptions to see metrics here.
        </div>
      )}

      {leaderboard.length > 0 && (
        <>
          {/* WER Leaderboard */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
            <h2 className="font-semibold">WER Leaderboard</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={leaderboard} layout="vertical" margin={{ left: 20, right: 40 }}>
                <XAxis type="number" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} domain={[0, "dataMax + 0.05"]} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis type="category" dataKey="model" tick={{ fill: "#e5e7eb", fontSize: 12 }} width={120} />
                <Tooltip formatter={(v: number) => `${(v * 100).toFixed(2)}%`} contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8 }} />
                <Bar dataKey="avgWer" name="Avg WER" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Latency chart */}
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
              <h2 className="font-semibold">Avg Latency (s)</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={leaderboard}>
                  <XAxis dataKey="model" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(2)}s`} contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8 }} />
                  <Bar dataKey="avgLat" name="Latency" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cost chart */}
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
              <h2 className="font-semibold">Avg Cost ($/run)</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={leaderboard}>
                  <XAxis dataKey="model" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={(v) => `$${v.toFixed(4)}`} />
                  <Tooltip formatter={(v: number) => `$${v.toFixed(5)}`} contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8 }} />
                  <Bar dataKey="avgCost" name="Cost" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary table */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h2 className="font-semibold">Model Summary</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Model</th>
                  <th className="px-4 py-3 text-right">Avg WER</th>
                  <th className="px-4 py-3 text-right">Avg CER</th>
                  <th className="px-4 py-3 text-right">Avg Latency</th>
                  <th className="px-4 py-3 text-right">Avg Cost</th>
                  <th className="px-4 py-3 text-right">Runs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {leaderboard.map((row, i) => (
                  <tr key={row.fullModel} className={`hover:bg-gray-800/40 ${i === 0 ? "text-green-300" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs">{row.fullModel}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.avgWer !== null ? `${(row.avgWer * 100).toFixed(2)}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-400">—</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-400">
                      {row.avgLat !== null ? `${row.avgLat.toFixed(2)}s` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-400">
                      {row.avgCost !== null ? `$${row.avgCost.toFixed(5)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                      {row.runs}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
