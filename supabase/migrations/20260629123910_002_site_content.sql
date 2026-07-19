/*
# Site Content Table for Customizable Text

1. New Tables
- `site_content` - stores customizable text content for each section
  - `id` (uuid, primary key)
  - `section` (text, unique) - hero, counter, gallery, videos, reasons, closing
  - `content` (jsonb) - flexible content storage
  - `updated_at` (timestamp)

2. Security
- Enable RLS on `site_content`
- Allow read access for anon and authenticated (public site needs to read)
- Allow write access for authenticated users only

3. Initial Data
- Seed with default content matching current site text
*/

CREATE TABLE IF NOT EXISTS site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text UNIQUE NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_site_content" ON site_content;
CREATE POLICY "anon_read_site_content" ON site_content FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_write_site_content" ON site_content;
CREATE POLICY "authenticated_write_site_content" ON site_content FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Insert default content
INSERT INTO site_content (section, content) VALUES
  ('hero', jsonb_build_object(
    'subtitle', 'Our Love Story',
    'title1', 'khaled',
    'title2', 'amyy',
    'description', 'Two hearts, one beautiful story — written one ordinary, extraordinary day at a time.',
    'cta', 'See how long we''ve loved'
  )),
  ('counter', jsonb_build_object(
    'anniversary_date', '2025-10-20',
    'subtitle', 'Together since 20 October 2025',
    'title', 'Every second has been ours',
    'description', 'And the count keeps climbing — just like the way I fall for you a little more with each passing day.'
  )),
  ('gallery', jsonb_build_object(
    'subtitle', 'Moments we keep',
    'title', 'Our favorite memories'
  )),
  ('videos', jsonb_build_object(
    'subtitle', 'Moments in motion',
    'title', 'Our memories, alive',
    'description', 'Tap any clip to turn its sound on.'
  )),
  ('reasons', jsonb_build_object(
    'subtitle', 'From me to you',
    'title', 'Reasons I love you',
    'items', jsonb_build_array(
      jsonb_build_object('title', 'Your smile', 'text', 'It turns the most ordinary moments into the ones I never want to forget.'),
      jsonb_build_object('title', 'The way you listen', 'text', 'You make me feel heard, understood, and completely at home.'),
      jsonb_build_object('title', 'Your kindness', 'text', 'The gentle way you treat the world reminds me how lucky I am to be yours.'),
      jsonb_build_object('title', 'Our inside jokes', 'text', 'A whole language only we understand, built from a thousand little moments.'),
      jsonb_build_object('title', 'How you dream', 'text', 'Every plan we make for the future feels brighter because you''re in it.'),
      jsonb_build_object('title', 'Just being you', 'text', 'I could list a thousand reasons, but really it all comes down to this.')
    )
  )),
  ('closing', jsonb_build_object(
    'quote', 'In a sea of people, my eyes will always search for you.',
    'description', 'Thank you for every laugh, every hug, and every quiet moment in between. Here''s to us — today, on our anniversary, and for all the years still to come.',
    'signature', 'khaled & amyy',
    'tagline', 'Forever & always · 20.10.2025'
  ))
ON CONFLICT (section) DO NOTHING;