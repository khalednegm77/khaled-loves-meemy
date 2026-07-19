/*
# Restrict anonymous read access to site_content

Previously all rows in site_content were readable by anon, which exposed
private content (love letter, bucket list, timeline) to anyone with the
public anon key. This migration restricts reads to authenticated users only,
since the entire site already requires login.
*/

-- Drop the permissive anon policy
DROP POLICY IF EXISTS "anon_read_site_content" ON site_content;

-- Authenticated users can read all rows
DROP POLICY IF EXISTS "authenticated_read_site_content" ON site_content;
CREATE POLICY "authenticated_read_site_content" ON site_content FOR SELECT
  TO authenticated USING (true);

-- Authenticated users can write (already existed, re-create for clarity)
DROP POLICY IF EXISTS "authenticated_write_site_content" ON site_content;
CREATE POLICY "authenticated_write_site_content" ON site_content FOR ALL
  TO authenticated USING (true) WITH CHECK (true);
