
-- Create unit-assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('unit-assets', 'unit-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own unit folder
CREATE POLICY "Owners can upload unit assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'unit-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.units WHERE owner_id = auth.uid()
  )
);

-- Allow authenticated users to update their own unit assets
CREATE POLICY "Owners can update unit assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'unit-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.units WHERE owner_id = auth.uid()
  )
);

-- Allow authenticated users to delete their own unit assets
CREATE POLICY "Owners can delete unit assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'unit-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.units WHERE owner_id = auth.uid()
  )
);

-- Public read access for unit assets
CREATE POLICY "Public can read unit assets"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'unit-assets');
