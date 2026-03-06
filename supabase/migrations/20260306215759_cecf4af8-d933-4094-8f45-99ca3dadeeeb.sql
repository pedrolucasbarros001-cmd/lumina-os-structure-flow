ALTER TABLE public.units ADD COLUMN IF NOT EXISTS business_type text DEFAULT 'independent';
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS logistics_type text DEFAULT 'local';