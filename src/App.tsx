import { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import NewsPanel from "./components/NewsPanel";
import { getCoords } from "./lib/coordinates";
import { classifyArticle } from "./lib/categories";
import type { NewsArticle, MapMarker, Category } from "./types/news";

const REFRESH_INTERVAL = 5 * 60 * 1000;

async function fetchFromNewsAPI(): Promise<NewsArticle[]> {
  const apiKey = import.meta.env.VITE_NEWS_API_KEY;
  const url = `/newsapi/v2/top-headlines?language=en&pageSize=100&apiKey=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.articles) return [];
  return data.articles
    .filter((a: any) => a.title && a.url)
    .map((a: any, i: number) => ({
      id: String(i),
      headline: a.title,
      summary: a.description || "",
      url: a.url,
      source: a.source?.name || "Unknown",
      published_at: a.publishedAt,
      category: a.category || "world",
      country: a.source?.name || "World",
      image_url: a.urlToImage || "",
    }));
}

export default function App() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(
    null
  );
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNews = useCallback(async () => {
    try {
      const articles = await fetchFromNewsAPI();
      if (articles.length > 0) {
        setArticles(articles);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch news:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshNews = useCallback(async () => {
    try {
      const articles = await fetchFromNewsAPI();
      if (articles.length > 0) {
        setArticles(articles);
        setLastUpdated(new Date());
      }
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(refreshNews, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNews, refreshNews]);

  useEffect(() => {
    const filtered =
      activeCategory === "all"
        ? articles
        : articles.filter((a) => {
            const displayCategory = classifyArticle(
              a.headline,
              a.summary,
              a.category
            );
            return displayCategory === activeCategory;
          });

    const newMarkers: MapMarker[] = [];
    const seen = new Set<string>();

    for (const article of filtered) {
      const coords = getCoords(article.country);
      if (!coords) continue;

      const key = `${article.country}-${article.headline}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const jitter = () => (Math.random() - 0.5) * 2;
      newMarkers.push({
        id: article.id,
        longitude: coords[0] + jitter(),
        latitude: coords[1] + jitter(),
        article,
      });
    }

    setMarkers(newMarkers);
  }, [articles, activeCategory]);

  const handleMarkerClick = useCallback((article: NewsArticle) => {
    setSelectedArticle(article);
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-950 overflow-hidden">
      <Navbar lastUpdated={lastUpdated} articleCount={markers.length} />

      <Sidebar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
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
          </div>
        </div>
      )}
    </div>
  );
}