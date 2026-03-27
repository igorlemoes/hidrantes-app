-- =====================================================
-- Supabase SQL Setup for Hidrantes App
-- Run this in: Supabase Dashboard > SQL Editor
-- =====================================================

-- =====================================================
-- 1. Create the hidrantes table
-- =====================================================
CREATE TABLE IF NOT EXISTS hidrantes (
    id TEXT PRIMARY KEY,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    city TEXT,
    photo_url TEXT,
    status TEXT DEFAULT 'bom' CHECK (status IN ('otimo', 'bom', 'regular', 'pessimo', 'inativo')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT
);

-- =====================================================
-- 2. Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE hidrantes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. RLS Policies for PUBLIC read, AUTH for write
-- =====================================================

-- Anyone can view all hidrantes (public access)
DROP POLICY IF EXISTS "Anyone can view all hidrantes" ON hidrantes;
CREATE POLICY "Anyone can view all hidrantes"
    ON hidrantes FOR SELECT
    TO public
    USING (true);

-- Only authenticated users can insert hidrantes
DROP POLICY IF EXISTS "Authenticated users can insert hidrantes" ON hidrantes;
CREATE POLICY "Authenticated users can insert hidrantes"
    ON hidrantes FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Only authenticated users can update hidrantes
DROP POLICY IF EXISTS "Authenticated users can update all hidrantes" ON hidrantes;
CREATE POLICY "Authenticated users can update all hidrantes"
    ON hidrantes FOR UPDATE
    TO authenticated
    USING (true);

-- Only authenticated users can delete hidrantes
DROP POLICY IF EXISTS "Authenticated users can delete all hidrantes" ON hidrantes;
CREATE POLICY "Authenticated users can delete all hidrantes"
    ON hidrantes FOR DELETE
    TO authenticated
    USING (true);

-- =====================================================
-- 4. Storage bucket for photos
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'hidrantes-photos', 
    'hidrantes-photos', 
    true, 
    5242880,  -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. Storage RLS Policies
-- =====================================================

-- Anyone can view photos
DROP POLICY IF EXISTS "Public read access to photos" ON storage.objects;
CREATE POLICY "Public read access to photos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'hidrantes-photos');

-- Authenticated users can upload photos
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'hidrantes-photos');

-- Authenticated users can update photos
DROP POLICY IF EXISTS "Authenticated users can update photos" ON storage.objects;
CREATE POLICY "Authenticated users can update photos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'hidrantes-photos');

-- Authenticated users can delete photos
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'hidrantes-photos');

-- =====================================================
-- 6. Create indexes for better query performance
-- =====================================================
CREATE INDEX idx_hidrantes_status ON hidrantes(status);
CREATE INDEX idx_hidrantes_city ON hidrantes(city);
CREATE INDEX idx_hidrantes_created_at ON hidrantes(created_at DESC);

-- =====================================================
-- Notes:
-- =====================================================
-- - Table: hidrantes - stores all fire hydrant data
-- - Columns:
--   - id: Unique identifier
--   - latitude/longitude: GPS coordinates
--   - address: Optional street address
--   - notes: Optional observations
--   - photo_url: URL to photo in storage
--   - status: 'otimo', 'bom', 'regular', 'pessimo', or 'inativo'
--   - created_at: Creation timestamp
--   - updated_at: Last update timestamp
--   - updated_by: Email of user who last updated
-- 
-- - Storage: hidrantes-photos bucket for hydrant photos
-- - Access: Public can view, authenticated users can modify
-- =====================================================
