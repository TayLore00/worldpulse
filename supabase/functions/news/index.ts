import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const COUNTRY_CODES = [
  "us", "gb", "fr", "de", "ru", "cn", "jp", "in",
  "br", "au", "ca", "it", "es", "nl", "sa", "kr",
  "mx", "ng", "za", "eg",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "fetch";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === "fetch") {
      const apiKey = Deno.env.get("NEWS_API_KEY");
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "NEWS_API_KEY not configured" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      await supabase.from("news_cache").delete().lt("fetched_at", thirtyMinAgo);

      const categories = ["general", "technology", "science", "politics"];
      let totalFetched = 0;

      for (const category of categories) {
        const countries =
          category === "general"
            ? COUNTRY_CODES.slice(0, 10)
            : ["us", "gb", "de", "jp", "in"];

        for (const country of countries) {
          const apiCategory = category === "general" ? "general" : category;
          const newsUrl = `https://newsapi.org/v2/top-headlines?country=${country}&category=${apiCategory}&pageSize=5&apiKey=${apiKey}`;

          const response = await fetch(newsUrl);
          if (!response.ok) continue;

          const data = await response.json();
          if (!data.articles) continue;

          const rows = data.articles
            .filter((a: { title: string; url: string }) => a.title && a.title !== "[Removed]" && a.url)
            .map((a: { title: string; source: { name: string }; description: string | null; url: string; urlToImage: string | null; publishedAt: string }) => ({
              category,
              country,
              headline: a.title,
              source: a.source?.name || "Unknown",
              summary: a.description || "",
              url: a.url,
              image_url: a.urlToImage || "",
              published_at: a.publishedAt || new Date().toISOString(),
              fetched_at: new Date().toISOString(),
            }));

          if (rows.length > 0) {
            const { error } = await supabase.from("news_cache").insert(rows);
            if (!error) totalFetched += rows.length;
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, articles_cached: totalFetched }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestedCategory = url.searchParams.get("category") || "";
    let query = supabase.from("news_cache").select("*").order("published_at", { ascending: false });
    if (requestedCategory && requestedCategory !== "all") {
      query = query.eq("category", requestedCategory);
    }
    const { data, error } = await query.limit(200);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ articles: data || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
