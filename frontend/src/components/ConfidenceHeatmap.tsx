interface WordConf {
  word: string;
  confidence: number;
  start: number;
}

interface Props {
  words: WordConf[];
  onWordClick?: (start: number) => void;
}

function confColor(c: number): string {
  if (c >= 0.9) return "bg-green-700/60 text-green-200";
  if (c >= 0.7) return "bg-yellow-700/60 text-yellow-200";
  if (c >= 0.5) return "bg-orange-700/60 text-orange-200";
  return "bg-red-800/60 text-red-300";
}

export default function ConfidenceHeatmap({ words, onWordClick }: Props) {
  if (!words.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-3 text-xs">
        {[
          { cls: "bg-green-700/60 text-green-200", label: "≥ 90%" },
          { cls: "bg-yellow-700/60 text-yellow-200", label: "70–90%" },
          { cls: "bg-orange-700/60 text-orange-200", label: "50–70%" },
          { cls: "bg-red-800/60 text-red-300", label: "< 50%" },
        ].map((l) => (
          <span key={l.label} className={`px-2 py-0.5 rounded ${l.cls}`}>
            {l.label}
          </span>
        ))}
      </div>
      <div className="text-sm leading-8 font-mono bg-gray-900 rounded-xl p-4">
        {words.map((w, i) => (
          <span
            key={i}
            className={`${confColor(w.confidence)} px-0.5 rounded mr-1 cursor-pointer hover:ring-1 hover:ring-indigo-400`}
            title={`Confidence: ${(w.confidence * 100).toFixed(1)}% @ ${w.start.toFixed(2)}s`}
            onClick={() => onWordClick?.(w.start)}
          >
            {w.word}
          </span>
        ))}
      </div>
    </div>
  );
}
