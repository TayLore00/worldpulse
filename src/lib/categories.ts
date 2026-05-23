import type { Category } from "../types/news";

const DB_CATEGORY_MAP: Record<Category, string[]> = {
  all: ["general", "technology", "science", "politics"],
  world: ["general"],
  politics: ["politics"],
  conflict: ["general"],
  science: ["science"],
  disaster: ["general"],
  technology: ["technology"],
};

const CONFLICT_KEYWORDS = [
  "war",
  "conflict",
  "attack",
  "military",
  "troops",
  "bombing",
  "airstrike",
  "invasion",
  "ceasefire",
  "combat",
  "violence",
  "terrorism",
  "rebel",
  "insurgency",
  "nato",
  "missile",
  "weapons",
  "armed",
  "soldier",
  "battle",
];

const DISASTER_KEYWORDS = [
  "earthquake",
  "flood",
  "hurricane",
  "typhoon",
  "tornado",
  "wildfire",
  "tsunami",
  "volcano",
  "landslide",
  "drought",
  "cyclone",
  "disaster",
  "emergency",
  "evacuation",
  "rescue",
  "damage",
  "casualties",
  "death toll",
  "storm",
];

export function classifyArticle(headline: string, summary: string, dbCategory: string): Category {
  const text = `${headline} ${summary}`.toLowerCase();

  if (dbCategory === "technology") return "technology";
  if (dbCategory === "science") return "science";
  if (dbCategory === "politics") return "politics";

  if (CONFLICT_KEYWORDS.some((kw) => text.includes(kw))) return "conflict";
  if (DISASTER_KEYWORDS.some((kw) => text.includes(kw))) return "disaster";

  return "world";
}

export function getDbCategoriesForFilter(category: Category): string[] {
  return DB_CATEGORY_MAP[category];
}
