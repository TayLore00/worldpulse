/*
  # Create news_cache table

  1. New Tables
    - `news_cache`
      - `id` (uuid, primary key)
      - `category` (text, news category like world, politics, etc.)
      - `country` (text, 2-letter country code)
      - `headline` (text, article title)
      - `source` (text, news source name)
      - `summary` (text, article description/summary)
      - `url` (text, link to full article)
      - `image_url` (text, optional article image)
      - `published_at` (timestamptz, when article was published)
      - `fetched_at` (timestamptz, when we cached this article)
  2. Security
    - Enable RLS on `news_cache` table
    - Add policy for authenticated users to read cached news
    - Add policy for service role to insert/update cached news
  3. Indexes
    - Index on `category` for filter queries
    - Index on `fetched_at` for freshness queries
*/

CREATE TABLE IF NOT EXISTS news_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'general',
  country text NOT NULL DEFAULT '',
  headline text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  image_url text DEFAULT '',
  published_at timestamptz DEFAULT now(),
  fetched_at timestamptz DEFAULT now()
);

ALTER TABLE news_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached news"
  ON news_cache FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can insert news cache"
  ON news_cache FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can delete news cache"
  ON news_cache FOR DELETE
  TO service_role
  USING (true);

CREATE INDEX IF NOT EXISTS idx_news_cache_category ON news_cache (category);
CREATE INDEX IF NOT EXISTS idx_news_cache_fetched_at ON news_cache (fetched_at);
