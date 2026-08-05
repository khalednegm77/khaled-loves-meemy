/*
# Safe Place Pages Table

Stores emotionally honest conversations as beautiful book pages.
Each saved page is one chapter in the relationship story and remains
available for authenticated users until they delete it.
*/

CREATE TABLE IF NOT EXISTS safe_place_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  writer_name text NOT NULL,
  message text NOT NULL,
  emotion text NOT NULL,
  severity integer NOT NULL DEFAULT 1,
  needs text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'Waiting for Reply',
  favorite boolean NOT NULL DEFAULT false,
  resolved boolean NOT NULL DEFAULT false,
  conversation jsonb NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE safe_place_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_read_safe_place_pages" ON safe_place_pages;
CREATE POLICY "authenticated_read_safe_place_pages" ON safe_place_pages
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_write_safe_place_pages" ON safe_place_pages;
CREATE POLICY "authenticated_write_safe_place_pages" ON safe_place_pages
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "anon_read_safe_place_pages" ON safe_place_pages;
CREATE POLICY "anon_read_safe_place_pages" ON safe_place_pages
  FOR SELECT TO anon
  USING (false);
