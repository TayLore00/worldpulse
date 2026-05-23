import { X, ExternalLink, Clock, Tag, MapPin } from "lucide-react";
import type { NewsArticle } from "../types/news";

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-blue-500/15 text-blue-400",
  politics: "bg-amber-500/15 text-amber-400",
  technology: "bg-cyan-500/15 text-cyan-400",
  science: "bg-emerald-500/15 text-emerald-400",
};

const COUNTRY_NAMES: Record<string, string> = {
  us: "United States",
  gb: "United Kingdom",
  fr: "France",
  de: "Germany",
  ru: "Russia",
  cn: "China",
  jp: "Japan",
  in: "India",
  br: "Brazil",
  au: "Australia",
  ca: "Canada",
  it: "Italy",
  es: "Spain",
  nl: "Netherlands",
  sa: "Saudi Arabia",
  kr: "South Korea",
  mx: "Mexico",
  ng: "Nigeria",
  za: "South Africa",
  eg: "Egypt",
};

interface NewsPanelProps {
  article: NewsArticle | null;
  onClose: () => void;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function NewsPanel({ article, onClose }: NewsPanelProps) {
  if (!article) return null;

  const colorClass =
    CATEGORY_COLORS[article.category] || "bg-gray-500/15 text-gray-400";
  const countryName =
    COUNTRY_NAMES[article.country] || article.country.toUpperCase();

  return (
    <div className="fixed right-0 top-14 bottom-0 z-30 w-96 max-w-full bg-gray-900/98 backdrop-blur-md border-l border-gray-800 shadow-2xl shadow-black/40 animate-slide-in">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Story Detail
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Image */}
          {article.image_url && (
            <div className="rounded-lg overflow-hidden bg-gray-800">
              <img
                src={article.image_url}
                alt={article.headline}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          {/* Category + Country */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}
            >
              <Tag className="w-3 h-3" />
              {article.category}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-400">
              <MapPin className="w-3 h-3" />
              {countryName}
            </span>
          </div>

          {/* Headline */}
          <h3 className="text-lg font-semibold text-white leading-snug">
            {article.headline}
          </h3>

          {/* Source + Time */}
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="text-gray-300">{article.source}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(article.published_at)}
            </span>
          </div>

          {/* Summary */}
          {article.summary && (
            <p className="text-sm text-gray-400 leading-relaxed">
              {article.summary}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-800">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
          >
            Read Full Article
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
