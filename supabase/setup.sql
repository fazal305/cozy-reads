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
