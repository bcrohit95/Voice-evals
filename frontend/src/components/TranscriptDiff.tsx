import type { DiffToken } from "../types";

const STYLES: Record<string, string> = {
  correct: "text-gray-200",
  insertion: "bg-green-900/60 text-green-300 px-0.5 rounded",
  deletion: "bg-red-900/60 text-red-400 line-through px-0.5 rounded",
};

const LEGENDS = [
  { type: "correct", label: "Correct", cls: "bg-gray-700" },
  { type: "insertion", label: "Inserted (hypothesis only)", cls: "bg-green-900/60 text-green-300" },
  { type: "deletion", label: "Deleted (in reference, missing from hypothesis)", cls: "bg-red-900/60 text-red-400" },
];

interface Props {
  tokens: DiffToken[];
  wordData?: { word: string; start: number; end: number; confidence: number }[];
  onWordClick?: (start: number) => void;
}

export default function TranscriptDiff({ tokens, wordData, onWordClick }: Props) {
  const wordTimestamps: Record<string, number> = {};
  if (wordData) {
    wordData.forEach((w) => {
      wordTimestamps[w.word.toLowerCase()] = w.start;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-xs">
        {LEGENDS.map((l) => (
          <span key={l.type} className={`px-2 py-0.5 rounded ${l.cls}`}>
            {l.label}
          </span>
        ))}
      </div>
      <div className="text-sm leading-8 font-mono bg-gray-900 rounded-xl p-4">
        {tokens.map((tok, i) => {
          const ts = wordTimestamps[tok.word.toLowerCase()];
          const clickable = ts !== undefined && onWordClick;
          return (
            <span
              key={i}
              className={`${STYLES[tok.type] || ""} mr-1 ${clickable ? "cursor-pointer hover:ring-1 hover:ring-indigo-400 rounded" : ""}`}
              title={`${tok.type}${ts !== undefined ? ` @ ${ts.toFixed(2)}s` : ""}`}
              onClick={() => clickable && onWordClick(ts)}
            >
              {tok.word}
            </span>
          );
        })}
      </div>
    </div>
  );
}
