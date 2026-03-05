-- Migration: CRM enhancements for clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS preferences TEXT,
ADD COLUMN IF NOT EXISTS addresses JSONB DEFAULT '[]'::jsonb;

-- Client Photos table for Gallery
CREATE TABLE IF NOT EXISTS public.client_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for client_photos
ALTER TABLE public.client_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Unit owners can manage client photos" ON public.client_photos 
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.clients c JOIN public.units u ON u.id = c.unit_id WHERE c.id = client_id AND u.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.clients c JOIN public.units u ON u.id = c.unit_id WHERE c.id = client_id AND u.owner_id = auth.uid()));
