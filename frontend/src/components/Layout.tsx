import { Link, useLocation } from "react-router-dom";
import {
  Upload, Play, BarChart2, Eye, Target, History, Mic2,
} from "lucide-react";

const NAV = [
  { path: "/upload", label: "Upload", icon: Upload },
  { path: "/run", label: "Run", icon: Play },
  { path: "/dashboard", label: "Dashboard", icon: BarChart2 },
  { path: "/review", label: "Review", icon: Eye },
  { path: "/benchmark", label: "Benchmark", icon: Target },
  { path: "/history", label: "History", icon: History },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <aside className="w-52 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2">
          <Mic2 className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-sm tracking-tight">VoiceEval</span>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <p className="text-xs text-gray-600 text-center">Voice AI Evaluator</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
