import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import NewsPanel from "./components/NewsPanel";
import { getCoords, extractGeoText } from "./lib/coordinates";
import { classifyArticle } from "./lib/categories";
import type { NewsArticle, MapMarker, Category } from "./types/news";

const REFRESH_INTERVAL = 15 * 60 * 1000;

async function fetchFromGDELT(): Promise<NewsArticle[]> {
  const url = `/api/news`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.articles) return [];
    return data.articles;
  } catch {
    return [];
  }
}

function buildMarkers(
  articles: NewsArticle[],
  activeCategory: Category
): MapMarker[] {
  const filtered =
    activeCategory === "all"
      ? articles
      : articles.filter((a) => a.category === activeCategory);

  const newMarkers: MapMarker[] = [];
  const seen = new Set<string>();

  for (const article of filtered) {
    const geoText = extractGeoText({
      headline: article.headline,
      summary: article.summary,
      country: article.country,
      source: article.source,
    });

    const coords = getCoords(geoText);
    if (!coords) continue;

    const key = `${article.country}-${article.headline}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const jitter = () => (Math.random() - 0.5) * 1.5;

    newMarkers.push({
      id: article.id,
      longitude: coords[0] + jitter(),
      latitude: coords[1] + jitter(),
      article,
    });
  }

  return newMarkers;
}

export default function App() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNews = useCallback(async () => {
    setError(null);
    try {
      const fetched = await fetchFromGDELT();
      if (fetched.length > 0) {
        setArticles(fetched);
        setLastUpdated(new Date());
      } else {
        setError("No articles returned. Will retry automatically.");
      }
    } catch (err) {
      console.error("Failed to fetch news:", err);
      setError("Failed to load news. Will retry automatically.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    intervalRef.current = setInterval(fetchNews, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNews]);

  useEffect(() => {
    const built = buildMarkers(articles, activeCategory);
    setMarkers(built);
  }, [articles, activeCategory]);

  const handleMarkerClick = useCallback((article: NewsArticle) => {
    setSelectedArticle(article);
  }, []);

  const handleCategoryChange = useCallback((category: Category) => {
    setActiveCategory(category);
    setSelectedArticle(null);
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-950 overflow-hidden">
      <Navbar
        lastUpdated={lastUpdated}
        articleCount={markers.length}
      />

      <Sidebar
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <MapView
        markers={markers}
        onMarkerClick={handleMarkerClick}
        sidebarCollapsed={sidebarCollapsed}
        panelOpen={!!selectedArticle}
      />

      <NewsPanel
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading world news...</p>
            <p className="text-xs text-gray-600">Fetching from GDELT global database</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-950 border border-red-800 text-red-300 text-xs px-4 py-3 rounded-lg shadow-xl flex items-center gap-3">
          <span>⚠ {error}</span>
          <button
            onClick={fetchNews}
            className="underline hover:text-red-100 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}