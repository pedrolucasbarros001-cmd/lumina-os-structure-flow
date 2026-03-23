-- ============================================================================
-- Add location and commission fields to team_members
-- ============================================================================

BEGIN;

-- Add location fields to team_members if they don't exist
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS lat NUMERIC(10, 8);
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS lng NUMERIC(11, 8);
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5, 2) DEFAULT 0;

-- Update team_members to add modality (service type availability)
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS modality TEXT DEFAULT 'unit' CHECK (modality IN ('unit', 'home', 'hybrid'));

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_team_members_location ON public.team_members(lat, lng) 
WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Create index for active staff
CREATE INDEX IF NOT EXISTS idx_team_members_active ON public.team_members(unit_id, is_active) 
WHERE is_active = true;

COMMIT;

-- Mensagem de sucesso
SELECT 'Team members location and commission fields added successfully!' as status;
