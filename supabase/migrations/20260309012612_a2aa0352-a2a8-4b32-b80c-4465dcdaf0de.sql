-- Create staff_invitations table
CREATE TABLE public.staff_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  name text,
  role text DEFAULT 'Profissional',
  commission_rate numeric DEFAULT 0,
  token text UNIQUE NOT NULL,
  status text DEFAULT 'pending',
  invited_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

-- Add columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'owner',
ADD COLUMN IF NOT EXISTS invited_via text,
ADD COLUMN IF NOT EXISTS linked_unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL;

-- Add categories array to units
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';

-- Enable RLS on staff_invitations
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for staff_invitations
CREATE POLICY "Unit owners can manage invitations"
ON public.staff_invitations
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.units
  WHERE units.id = staff_invitations.unit_id
  AND units.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.units
  WHERE units.id = staff_invitations.unit_id
  AND units.owner_id = auth.uid()
));

CREATE POLICY "Anyone can read invitations by token"
ON public.staff_invitations
FOR SELECT
USING (true);

-- Index for token lookup
CREATE INDEX idx_staff_invitations_token ON public.staff_invitations(token);