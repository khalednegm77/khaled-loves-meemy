CREATE TABLE IF NOT EXISTS couple_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  partner_user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id <> partner_user_id)
);

CREATE TABLE IF NOT EXISTS kiss_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  sender_name text NOT NULL,
  receiver_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> receiver_id)
);

CREATE INDEX IF NOT EXISTS kiss_events_sender_idx ON kiss_events (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS kiss_events_receiver_idx ON kiss_events (receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS couple_members_user_idx ON couple_members (user_id);
CREATE INDEX IF NOT EXISTS couple_members_partner_idx ON couple_members (partner_user_id);

ALTER TABLE couple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiss_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "couple_members_authenticated_read" ON couple_members;
CREATE POLICY "couple_members_authenticated_read" ON couple_members
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "couple_members_authenticated_write" ON couple_members;
CREATE POLICY "couple_members_authenticated_write" ON couple_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR partner_user_id = auth.uid());

DROP POLICY IF EXISTS "couple_members_authenticated_update" ON couple_members;
CREATE POLICY "couple_members_authenticated_update" ON couple_members
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR partner_user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR partner_user_id = auth.uid());

DROP POLICY IF EXISTS "couple_members_anon_read" ON couple_members;
CREATE POLICY "couple_members_anon_read" ON couple_members
  FOR SELECT TO anon
  USING (false);

DROP POLICY IF EXISTS "kiss_events_authenticated_read" ON kiss_events;
CREATE POLICY "kiss_events_authenticated_read" ON kiss_events
  FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

DROP POLICY IF EXISTS "kiss_events_authenticated_insert" ON kiss_events;
CREATE POLICY "kiss_events_authenticated_insert" ON kiss_events
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND receiver_id IS NOT NULL
  );

DROP POLICY IF EXISTS "kiss_events_anon_read" ON kiss_events;
CREATE POLICY "kiss_events_anon_read" ON kiss_events
  FOR SELECT TO anon
  USING (false);

ALTER TABLE couple_members
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE kiss_events
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    RETURN;
  END IF;

  ALTER PUBLICATION supabase_realtime
    ADD TABLE IF NOT EXISTS public.kiss_events;

  ALTER PUBLICATION supabase_realtime
    ADD TABLE IF NOT EXISTS public.couple_members;
END $$;
