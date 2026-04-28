import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { TRANSCRIPTIONS } from "../api/client";

const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];

interface TrendRow {
  id: number;
  model: string;
  wer: number;
  latency: number | null;
  cost: number | null;
  date: string;
}

export default function HistoryPage() {
  const { data: trend = [], isLoading } = useQuery<TrendRow[]>({
    queryKey: ["trend"],
    queryFn: TRANSCRIPTIONS.trend,
    refetchInterval: 15_000,
  });

  const models = Array.from(new Set(trend.map((r) => r.model)));

  const chartData = trend.map((r, i) => ({
    idx: i + 1,
    date: new Date(r.date).toLocaleDateString(),
    model: r.model,
    wer: +(r.wer * 100).toFixed(2),
    latency: r.latency ? +r.latency.toFixed(2) : null,
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">History & Trends</h1>
        <p className="text-sm text-gray-400 mt-1">
          WER and latency trends across all completed transcription runs.
        </p>
      </div>

      {isLoading && <p className="text-gray-500 text-sm">Loading...</p>}

      {trend.length === 0 && !isLoading && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-16 text-center text-gray-500">
          No transcription history yet. Run transcriptions to see trends.
        </div>
      )}

      {trend.length > 0 && (
        <>
          {/* WER trend */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
            <h2 className="font-semibold">WER Trend (% — lower is better)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8 }}
                  formatter={(v: number) => `${v}%`}
                />
                <Legend />
                {models.map((m, i) => (
                  <Line
                    key={m}
                    type="monotone"
                    dataKey="wer"
                    data={chartData.filter((d) => d.model === m)}
                    name={m.split("/")[1] || m}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Latency trend */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
            <h2 className="font-semibold">Latency Trend (seconds)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={(v) => `${v}s`} />
                <Tooltip
                  contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8 }}
                  formatter={(v: number) => `${v}s`}
                />
                <Legend />
                {models.map((m, i) => (
                  <Line
                    key={m}
                    type="monotone"
                    dataKey="latency"
                    data={chartData.filter((d) => d.model === m)}
                    name={m.split("/")[1] || m}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Full history table */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h2 className="font-semibold">All Runs ({trend.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Model</th>
                    <th className="px-4 py-3 text-right">WER</th>
                    <th className="px-4 py-3 text-right">Latency</th>
                    <th className="px-4 py-3 text-right">Cost</th>
                    <th className="px-4 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {[...trend].reverse().map((r) => (
                    <tr key={r.id} className="hover:bg-gray-800/40">
                      <td className="px-4 py-3 text-gray-500 tabular-nums">#{r.id}</td>
                      <td className="px-4 py-3 font-mono text-xs">{r.model}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span
                          className={
                            r.wer < 0.1
                              ? "text-green-400"
                              : r.wer < 0.3
                              ? "text-yellow-400"
                              : "text-red-400"
                          }
                        >
                          {(r.wer * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-400">
                        {r.latency !== null ? `${r.latency.toFixed(2)}s` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-400">
                        {r.cost !== null ? `$${r.cost.toFixed(5)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 text-xs">
                        {new Date(r.date).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
