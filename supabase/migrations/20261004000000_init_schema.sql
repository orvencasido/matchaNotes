-- Migration: 20261004000000_init_schema.sql
-- Description: MatchaNotes Core Schema & Storage Setup
-- Tables: notes, note_attachments, vault_items, vault_config
-- Storage: note-media bucket with owner-only RLS

-- ---------------------------------------------------------------------------
-- 1. Helper Functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 2. Table: notes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  is_pinned boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger for notes.updated_at
DROP TRIGGER IF EXISTS set_notes_updated_at ON public.notes;
CREATE TRIGGER set_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Policies for notes
DROP POLICY IF EXISTS "Users can select own notes" ON public.notes;
CREATE POLICY "Users can select own notes"
  ON public.notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notes" ON public.notes;
CREATE POLICY "Users can insert own notes"
  ON public.notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
CREATE POLICY "Users can update own notes"
  ON public.notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;
CREATE POLICY "Users can delete own notes"
  ON public.notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for notes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_pinned_updated ON public.notes(user_id, is_pinned DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON public.notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_category ON public.notes(user_id, category);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON public.notes USING GIN (tags);

-- ---------------------------------------------------------------------------
-- 3. Table: note_attachments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.note_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.note_attachments ENABLE ROW LEVEL SECURITY;

-- Policies for note_attachments
DROP POLICY IF EXISTS "Users can select own attachments" ON public.note_attachments;
CREATE POLICY "Users can select own attachments"
  ON public.note_attachments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own attachments" ON public.note_attachments;
CREATE POLICY "Users can insert own attachments"
  ON public.note_attachments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own attachments" ON public.note_attachments;
CREATE POLICY "Users can update own attachments"
  ON public.note_attachments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own attachments" ON public.note_attachments;
CREATE POLICY "Users can delete own attachments"
  ON public.note_attachments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for note_attachments
CREATE INDEX IF NOT EXISTS idx_note_attachments_note_id ON public.note_attachments(note_id);
CREATE INDEX IF NOT EXISTS idx_note_attachments_user_id ON public.note_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_note_attachments_created_at ON public.note_attachments(created_at DESC);

-- ---------------------------------------------------------------------------
-- 4. Table: vault_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vault_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Account',
  encrypted_payload text NOT NULL,
  iv text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger for vault_items.updated_at
DROP TRIGGER IF EXISTS set_vault_items_updated_at ON public.vault_items;
CREATE TRIGGER set_vault_items_updated_at
  BEFORE UPDATE ON public.vault_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;

-- Policies for vault_items
DROP POLICY IF EXISTS "Users can select own vault items" ON public.vault_items;
CREATE POLICY "Users can select own vault items"
  ON public.vault_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own vault items" ON public.vault_items;
CREATE POLICY "Users can insert own vault items"
  ON public.vault_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own vault items" ON public.vault_items;
CREATE POLICY "Users can update own vault items"
  ON public.vault_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own vault items" ON public.vault_items;
CREATE POLICY "Users can delete own vault items"
  ON public.vault_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for vault_items
CREATE INDEX IF NOT EXISTS idx_vault_items_user_id ON public.vault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_items_user_category ON public.vault_items(user_id, category);
CREATE INDEX IF NOT EXISTS idx_vault_items_updated_at ON public.vault_items(updated_at DESC);

-- ---------------------------------------------------------------------------
-- 5. Table: vault_config
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vault_config (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  salt text NOT NULL,
  verifier_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vault_config ENABLE ROW LEVEL SECURITY;

-- Policies for vault_config
DROP POLICY IF EXISTS "Users can select own vault config" ON public.vault_config;
CREATE POLICY "Users can select own vault config"
  ON public.vault_config FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own vault config" ON public.vault_config;
CREATE POLICY "Users can insert own vault config"
  ON public.vault_config FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own vault config" ON public.vault_config;
CREATE POLICY "Users can update own vault config"
  ON public.vault_config FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own vault config" ON public.vault_config;
CREATE POLICY "Users can delete own vault config"
  ON public.vault_config FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. Storage Bucket: note-media
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'note-media',
  'note-media',
  false,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf'];

-- Storage RLS Policies for note-media bucket
DROP POLICY IF EXISTS "Users can read own note media" ON storage.objects;
CREATE POLICY "Users can read own note media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'note-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can insert own note media" ON storage.objects;
CREATE POLICY "Users can insert own note media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'note-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own note media" ON storage.objects;
CREATE POLICY "Users can update own note media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'note-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'note-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own note media" ON storage.objects;
CREATE POLICY "Users can delete own note media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'note-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
