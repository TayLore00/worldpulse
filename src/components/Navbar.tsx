import { Globe, Clock } from "lucide-react";

interface NavbarProps {
  lastUpdated: Date | null;
  articleCount: number;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function Navbar({ lastUpdated, articleCount }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 h-14 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-5">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15">
          <Globe className="w-5 h-5 text-emerald-400" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">
          WorldPulse
        </span>
        <span className="hidden sm:inline-flex items-center gap-1.5 ml-3 px-2.5 py-0.5 rounded-full bg-gray-800 text-xs text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {articleCount} stories live
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Clock className="w-3.5 h-3.5" />
        {lastUpdated ? (
          <span>
            Updated{" "}
            <span className="text-gray-300">{formatTime(lastUpdated)}</span>
          </span>
        ) : (
          <span className="text-gray-500">Loading...</span>
        )}
      </div>
    </nav>
  );
}
