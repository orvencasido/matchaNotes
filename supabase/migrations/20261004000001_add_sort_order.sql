-- Migration: Add sort_order to notes and vault_items for drag-and-drop reordering

ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS sort_order double precision DEFAULT EXTRACT(EPOCH FROM now());

ALTER TABLE public.vault_items 
ADD COLUMN IF NOT EXISTS sort_order double precision DEFAULT EXTRACT(EPOCH FROM now());

-- Backfill existing rows with creation epoch if sort_order is null
UPDATE public.notes 
SET sort_order = EXTRACT(EPOCH FROM created_at) 
WHERE sort_order IS NULL;

UPDATE public.vault_items 
SET sort_order = EXTRACT(EPOCH FROM created_at) 
WHERE sort_order IS NULL;

-- Composite indexes for ordering queries
CREATE INDEX IF NOT EXISTS idx_notes_user_sort_order 
ON public.notes(user_id, is_pinned DESC, sort_order ASC, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_vault_items_user_sort_order 
ON public.vault_items(user_id, sort_order ASC, updated_at DESC);
