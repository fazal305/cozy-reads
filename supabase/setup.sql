-- =============================================================
-- Cozy Reads — Supabase Database Setup
-- Run this in the Supabase SQL editor (Project > SQL Editor)
-- =============================================================

-- 1. Core reading goals table
CREATE TABLE IF NOT EXISTS public.reading_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    target_year INTEGER NOT NULL,
    books_challenge_type INTEGER NOT NULL DEFAULT 24
        CHECK (books_challenge_type IN (12, 24, 36, 48, 75, 100)),
    books_read_count INTEGER DEFAULT 0 CHECK (books_read_count >= 0),
    favorite_tropes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_year_combination UNIQUE (user_id, target_year)
);

-- 2. Row Level Security — every user sees only their own rows
ALTER TABLE public.reading_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "private_select" ON public.reading_goals;
CREATE POLICY "private_select" ON public.reading_goals
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "private_insert" ON public.reading_goals;
CREATE POLICY "private_insert" ON public.reading_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "private_update" ON public.reading_goals;
CREATE POLICY "private_update" ON public.reading_goals
    FOR UPDATE USING (auth.uid() = user_id);

-- 3. Auto-provision a goal row for every new signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.reading_goals (user_id, target_year, books_challenge_type)
    VALUES (
        NEW.id,
        EXTRACT(YEAR FROM NOW())::INTEGER,
        24
    )
    ON CONFLICT (user_id, target_year) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- Supabase Storage Setup (do this in the Dashboard UI)
-- =============================================================
-- 1. Go to Storage > New bucket
-- 2. Name it exactly: reading-assets
-- 3. Set it to PRIVATE (not public)
-- 4. Add the following RLS policy on the bucket:
--
-- Policy name: authenticated_read
-- Allowed operation: SELECT
-- USING expression: auth.role() = 'authenticated'
--
-- This means only signed-in users can request signed URLs.
-- The anon key alone cannot access the files.
-- =============================================================

-- =============================================================
-- Release 2: Visual Bookshelf & Scrapbook Diary
-- =============================================================

CREATE TABLE IF NOT EXISTS public.user_books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    author TEXT DEFAULT '',
    cover_url TEXT DEFAULT '',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) DEFAULT 5,
    summary TEXT DEFAULT '',
    quotes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_books_select" ON public.user_books;
CREATE POLICY "user_books_select" ON public.user_books
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_books_insert" ON public.user_books;
CREATE POLICY "user_books_insert" ON public.user_books
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_books_update" ON public.user_books;
CREATE POLICY "user_books_update" ON public.user_books
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_books_delete" ON public.user_books;
CREATE POLICY "user_books_delete" ON public.user_books
    FOR DELETE USING (auth.uid() = user_id);

-- Book covers: public bucket so covers load by URL. No SELECT policy, so
-- files can't be listed; users may only upload into their own folder.
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_covers_read" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_covers_insert" ON storage.objects;
CREATE POLICY "authenticated_covers_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================================
-- Release 3: Tabbed journal (TBR, bookshelf, full reviews)
-- Safe to re-run.
-- =============================================================

ALTER TABLE public.user_books
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'read'
        CHECK (status IN ('tbr', 'reading', 'read', 'dnf', 'wishlist')),
    ADD COLUMN IF NOT EXISTS genre TEXT,
    ADD COLUMN IF NOT EXISTS pages INTEGER CHECK (pages IS NULL OR pages > 0),
    ADD COLUMN IF NOT EXISTS format TEXT
        CHECK (format IN ('owned', 'gifted', 'borrowed', 'library', 'ebook', 'audiobook', 'arc')),
    ADD COLUMN IF NOT EXISTS start_date DATE,
    ADD COLUMN IF NOT EXISTS finish_date DATE,
    ADD COLUMN IF NOT EXISTS spice INTEGER CHECK (spice >= 0 AND spice <= 5),
    ADD COLUMN IF NOT EXISTS mood TEXT,
    ADD COLUMN IF NOT EXISTS review TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS review_done BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS favorite BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS tropes TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS series_name TEXT,
    ADD COLUMN IF NOT EXISTS series_number NUMERIC,
    ADD COLUMN IF NOT EXISTS season TEXT
        CHECK (season IN ('spring', 'summer', 'autumn', 'winter')),
    ADD COLUMN IF NOT EXISTS dnf_reason TEXT,
    ADD COLUMN IF NOT EXISTS dnf_progress TEXT,
    ADD COLUMN IF NOT EXISTS extra JSONB NOT NULL DEFAULT '{}'::jsonb;

-- TBR and wishlist books have no rating yet. The 1-5 check still applies.
ALTER TABLE public.user_books ALTER COLUMN rating DROP DEFAULT;
ALTER TABLE public.user_books ALTER COLUMN rating DROP NOT NULL;

CREATE INDEX IF NOT EXISTS user_books_user_status_idx
    ON public.user_books (user_id, status);

-- Generic per-user journal records. `kind` is namespaced by feature,
-- e.g. 'trackers.reading_log', 'extras.book_club', 'challenges.bingo'.
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    kind TEXT NOT NULL,
    entry_date DATE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS journal_entries_user_kind_idx
    ON public.journal_entries (user_id, kind);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_entries_select" ON public.journal_entries;
CREATE POLICY "journal_entries_select" ON public.journal_entries
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "journal_entries_insert" ON public.journal_entries;
CREATE POLICY "journal_entries_insert" ON public.journal_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "journal_entries_update" ON public.journal_entries;
CREATE POLICY "journal_entries_update" ON public.journal_entries
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "journal_entries_delete" ON public.journal_entries;
CREATE POLICY "journal_entries_delete" ON public.journal_entries
    FOR DELETE USING (auth.uid() = user_id);

-- Keep the update policy on reading_goals consistent with the others.
DROP POLICY IF EXISTS "private_update" ON public.reading_goals;
CREATE POLICY "private_update" ON public.reading_goals
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Shared updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON public.reading_goals;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.reading_goals
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.user_books;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_books
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.journal_entries;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.journal_entries
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- Release 4: Private book covers
-- Covers are served through short-lived signed URLs, so the bucket is
-- private and each user can only read or delete files in their own folder.
-- Safe to re-run.
-- =============================================================

UPDATE storage.buckets SET public = false WHERE id = 'covers';

DROP POLICY IF EXISTS "owner_covers_read" ON storage.objects;
CREATE POLICY "owner_covers_read" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "owner_covers_delete" ON storage.objects;
CREATE POLICY "owner_covers_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Old rows stored the public URL. Keep just the path ('covers:<path>').
UPDATE public.user_books
SET cover_url = regexp_replace(cover_url, '^https?://[^/]+/storage/v1/object/public/covers/', 'covers:')
WHERE cover_url ~ '^https?://[^/]+/storage/v1/object/public/covers/';
