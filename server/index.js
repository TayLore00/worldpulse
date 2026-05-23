const express = require("express");
const cors = require("cors");
const https = require("https");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Cache storage
let cache = {
  articles: [],
  lastFetched: null,
};

const CACHE_DURATION = 15 * 60 * 1000;
const GDELT_URL =
  "https://api.gdeltproject.org/api/v2/doc/doc?query=world&mode=artlist&maxrecords=250&format=json&sourcelang=english";

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve({ ok: res.statusCode === 200, status: res.statusCode, json: () => JSON.parse(data) });
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

async function fetchGDELT() {
  console.log("Fetching from GDELT...");
  try {
    const res = await httpsGet(GDELT_URL);
    if (!res.ok) {
      console.error("GDELT returned status:", res.status);
      return null;
    }
    const data = res.json();
    if (!data.articles || data.articles.length === 0) {
      console.error("GDELT returned no articles");
      return null;
    }
    console.log(`Fetched ${data.articles.length} articles from GDELT`);
    return data.articles
      .filter((a) => a.title && a.url && a.sourcecountry)
      .map((a, i) => ({
        id: `${i}-${Date.now()}`,
        headline: a.title,
        summary: "",
        url: a.url,
        source: a.domain || "Unknown",
        published_at: a.seendate || "",
        category: "world",
        country: a.sourcecountry || "",
        image_url: a.socialimage || "",
      }));
  } catch (err) {
    console.error("GDELT fetch error:", err.message);
    return null;
  }
}

async function refreshCache() {
  const articles = await fetchGDELT();
  if (articles && articles.length > 0) {
    cache.articles = articles;
    cache.lastFetched = new Date();
    console.log(`Cache updated at ${cache.lastFetched.toISOString()}`);
  }
}

app.get("/api/news", async (req, res) => {
  const now = Date.now();
  const cacheAge = cache.lastFetched
    ? now - cache.lastFetched.getTime()
    : Infinity;

  if (cache.articles.length > 0 && cacheAge < CACHE_DURATION) {
    console.log(`Serving ${cache.articles.length} articles from cache`);
    return res.json({
      articles: cache.articles,
      lastFetched: cache.lastFetched,
      fromCache: true,
    });
  }

  await refreshCache();

  if (cache.articles.length > 0) {
    return res.json({
      articles: cache.articles,
      lastFetched: cache.lastFetched,
      fromCache: false,
    });
  }

  return res.status(503).json({
    error: "Unable to fetch news at this time. Please try again shortly.",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    cacheSize: cache.articles.length,
    lastFetched: cache.lastFetched,
  });
});

app.listen(PORT, async () => {
  console.log(`WorldPulse server running on http://localhost:${PORT}`);
  await refreshCache();
  setInterval(refreshCache, CACHE_DURATION);
});