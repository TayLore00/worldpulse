import { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import NewsPanel from "./components/NewsPanel";
import { supabase } from "./lib/supabase";
import { getCoords } from "./lib/coordinates";
import { classifyArticle } from "./lib/categories";
import type { NewsArticle, MapMarker, Category } from "./types/news";

const REFRESH_INTERVAL = 5 * 60 * 1000;

async function queryCachedNews(category?: string): Promise<NewsArticle[]> {
  let query = supabase
    .from("news_cache")
    .select("*")
    .order("published_at", { ascending: false });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query.limit(200);
  if (error) {
    console.error("Supabase query error:", error);
    return [];
  }
  return (data as NewsArticle[]) || [];
}

async function triggerEdgeFunctionFetch(): Promise<void> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/news?action=fetch`;
  const res = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("Edge function fetch failed:", res.status, body);
  }
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
      // Step 1: Try reading from cache
      let cached = await queryCachedNews();

      // Step 2: If cache is empty, trigger edge function to populate it
      if (cached.length === 0) {
        try {
          await triggerEdgeFunctionFetch();
        } catch {
          console.error("Edge function trigger failed");
        }
        // Re-query after edge function populates data
        cached = await queryCachedNews();
      }

      if (cached.length > 0) {
        setArticles(cached);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch news:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Background refresh: re-trigger edge function + re-query cache
  const refreshNews = useCallback(async () => {
    try {
      await triggerEdgeFunctionFetch();
    } catch {
      // non-fatal
    }
    const cached = await queryCachedNews();
    if (cached.length > 0) {
      setArticles(cached);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(refreshNews, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNews, refreshNews]);

  // Filter articles and build markers
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
