-- Migration: Staff Blocked Time Management
-- Description: Allow staff to block time periods when they are unavailable
-- Created: 2026-03-16

-- 1. Create staff_blocked_time table
CREATE TABLE IF NOT EXISTS public.staff_blocked_time (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  title VARCHAR(255) NOT NULL, -- e.g., "Pausa", "Almoco", "Ferias", "Doença"
  description TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly' (for future use)
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT team_member_unit_match CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.id = team_member_id AND tm.unit_id = unit_id
    )
  )
);

-- 2. Enable RLS
ALTER TABLE public.staff_blocked_time ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Owners can view blocked time for their unit's staff
CREATE POLICY "Unit owners can view staff blocked time"
ON public.staff_blocked_time
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM units u
    WHERE u.id = unit_id AND u.owner_id = auth.uid()
  )
);

-- Staff can view their own blocked time
CREATE POLICY "Staff can view their own blocked time"
ON public.staff_blocked_time
FOR SELECT
TO authenticated
USING (
  team_member_id IN (
    SELECT id FROM team_members tm
    WHERE tm.user_id = auth.uid()
  )
);

-- Owners can create blocked time for their unit's staff
CREATE POLICY "Owners can create blocked time for staff"
ON public.staff_blocked_time
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM units u
    WHERE u.id = unit_id AND u.owner_id = auth.uid()
  )
);

-- Staff can create blocked time for themselves
CREATE POLICY "Staff can create their own blocked time"
ON public.staff_blocked_time
FOR INSERT
TO authenticated
WITH CHECK (
  team_member_id IN (
    SELECT id FROM team_members tm
    WHERE tm.user_id = auth.uid()
  )
);

-- Owners can update blocked time for their unit
CREATE POLICY "Owners can update blocked time for their unit"
ON public.staff_blocked_time
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM units u
    WHERE u.id = unit_id AND u.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM units u
    WHERE u.id = unit_id AND u.owner_id = auth.uid()
  )
);

-- Staff can update their own blocked time
CREATE POLICY "Staff can update their own blocked time"
ON public.staff_blocked_time
FOR UPDATE
TO authenticated
USING (
  team_member_id IN (
    SELECT id FROM team_members tm
    WHERE tm.user_id = auth.uid()
  )
)
WITH CHECK (
  team_member_id IN (
    SELECT id FROM team_members tm
    WHERE tm.user_id = auth.uid()
  )
);

-- Owners can delete blocked time for their unit
CREATE POLICY "Owners can delete blocked time for their unit"
ON public.staff_blocked_time
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM units u
    WHERE u.id = unit_id AND u.owner_id = auth.uid()
  )
);

-- Staff can delete their own blocked time
CREATE POLICY "Staff can delete their own blocked time"
ON public.staff_blocked_time
FOR DELETE
TO authenticated
USING (
  team_member_id IN (
    SELECT id FROM team_members tm
    WHERE tm.user_id = auth.uid()
  )
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_blocked_time_team_member_id 
ON public.staff_blocked_time(team_member_id);

CREATE INDEX IF NOT EXISTS idx_staff_blocked_time_unit_id 
ON public.staff_blocked_time(unit_id);

CREATE INDEX IF NOT EXISTS idx_staff_blocked_time_date_range 
ON public.staff_blocked_time(start_time, end_time)
WHERE status = 'active';

-- 5. Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_staff_blocked_time_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_staff_blocked_time_updated_at
BEFORE UPDATE ON public.staff_blocked_time
FOR EACH ROW
EXECUTE FUNCTION public.update_staff_blocked_time_updated_at();

-- 6. Predefined block reasons for UI dropdown
CREATE TABLE IF NOT EXISTS public.staff_block_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL,
  color_hex VARCHAR(7) DEFAULT '#fb923c', -- Default orange
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_reason_per_unit UNIQUE(unit_id, reason)
);

-- Insert default block reasons for new units
CREATE OR REPLACE FUNCTION public.create_default_block_reasons()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.staff_block_reasons (unit_id, reason, color_hex) VALUES
    (NEW.id, 'Pausa', '#fca5a5'),      -- red
    (NEW.id, 'Almoço', '#fbbf24'),     -- amber
    (NEW.id, 'Formação', '#60a5fa'),   -- blue
    (NEW.id, 'Férias', '#34d399'),     -- emerald
    (NEW.id, 'Doença', '#f472b6'),     -- pink
    (NEW.id, 'Manutenção', '#a78bfa'); -- purple
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_default_block_reasons
AFTER INSERT ON public.units
FOR EACH ROW
EXECUTE FUNCTION public.create_default_block_reasons();

-- 7. RLS for block reasons
ALTER TABLE public.staff_block_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Unit owners can manage block reasons"
ON public.staff_block_reasons
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM units u
    WHERE u.id = unit_id AND u.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM units u
    WHERE u.id = unit_id AND u.owner_id = auth.uid()
  )
);

-- Staff can view block reasons for their unit
CREATE POLICY "Staff can view block reasons"
ON public.staff_block_reasons
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff_blocked_time sbt
    JOIN units u ON u.id = sbt.unit_id
    WHERE u.id = unit_id AND sbt.team_member_id IN (
      SELECT id FROM team_members tm WHERE tm.user_id = auth.uid()
    )
  )
);

COMMENT ON TABLE public.staff_blocked_time 
IS 'Periods when staff is unavailable (breaks, vacations, illness, etc). These are hidden from public booking availability.';

COMMENT ON TABLE public.staff_block_reasons 
IS 'Predefined reasons for blocking time, customizable per unit with associated colors for UI.';
