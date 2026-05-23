export interface NewsArticle {
  id: string;
  category: string;
  country: string;
  headline: string;
  source: string;
  summary: string;
  url: string;
  image_url: string;
  published_at: string;
  fetched_at: string;
}

export interface MapMarker {
  id: string;
  longitude: number;
  latitude: number;
  article: NewsArticle;
}

export type Category =
  | "all"
  | "world"
  | "politics"
  | "conflict"
  | "science"
  | "disaster"
  | "technology";
