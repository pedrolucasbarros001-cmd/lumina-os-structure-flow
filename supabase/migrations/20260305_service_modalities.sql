-- Migration: Add allows_home and allows_unit to services
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS allows_home BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS allows_unit BOOLEAN NOT NULL DEFAULT true;
