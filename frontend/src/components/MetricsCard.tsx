interface Props {
  label: string;
  value: number | null | undefined;
  format?: "percent" | "seconds" | "dollar" | "raw";
  colorize?: boolean;
}

function display(value: number | null | undefined, format: Props["format"]) {
  if (value === null || value === undefined) return "—";
  switch (format) {
    case "percent":
      return `${(value * 100).toFixed(1)}%`;
    case "seconds":
      return `${value.toFixed(2)}s`;
    case "dollar":
      return `$${value.toFixed(5)}`;
    default:
      return value.toFixed(4);
  }
}

function color(value: number | null | undefined, colorize: boolean) {
  if (!colorize || value === null || value === undefined) return "text-white";
  if (value < 0.1) return "text-green-400";
  if (value < 0.3) return "text-yellow-400";
  return "text-red-400";
}

export default function MetricsCard({ label, value, format = "percent", colorize = false }: Props) {
  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color(value, colorize)}`}>
        {display(value, format)}
      </p>
    </div>
  );
}
