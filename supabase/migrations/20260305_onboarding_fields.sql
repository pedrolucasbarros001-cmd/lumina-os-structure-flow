-- Migration: Onboarding fields for units

ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS business_type TEXT CHECK (business_type IN ('solo', 'team'));

ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS logistics_type TEXT CHECK (logistics_type IN ('unit', 'home', 'hybrid'));

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1;
