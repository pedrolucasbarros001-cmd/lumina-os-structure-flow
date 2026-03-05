-- Phase 0: Database Refactoring & Core
-- Enums updates
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'in_transit';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'arrived';

-- Units updates
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS lat NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS lng NUMERIC(11, 8);

-- Mobility settings updates
ALTER TABLE public.mobility_settings
ADD COLUMN IF NOT EXISTS coverage_radius_km NUMERIC(10,2) NOT NULL DEFAULT 15.0;

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  image_url TEXT,
  brand TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Unit owners can manage products" ON public.products FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND owner_id = auth.uid()));
CREATE POLICY "Public can read active products of published units" ON public.products FOR SELECT TO anon USING (is_active = true AND EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND is_published = true));

-- Sales table (Caixa/Financeiro)
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'mbway', 'other')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {type: 'service'|'product'|'delivery', name, price, quantity}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Unit owners can manage sales" ON public.sales FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND owner_id = auth.uid()));

-- Team Shifts
CREATE TABLE IF NOT EXISTS public.team_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  day_of_week VARCHAR(3) NOT NULL CHECK (day_of_week IN ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')),
  is_working BOOLEAN NOT NULL DEFAULT true,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_member_id, day_of_week)
);

ALTER TABLE public.team_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Unit owners can manage team shifts" ON public.team_shifts FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.team_members tm JOIN public.units u ON u.id = tm.unit_id WHERE tm.id = team_member_id AND u.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.team_members tm JOIN public.units u ON u.id = tm.unit_id WHERE tm.id = team_member_id AND u.owner_id = auth.uid()));

-- Team Commissions
CREATE TABLE IF NOT EXISTS public.team_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL UNIQUE REFERENCES public.team_members(id) ON DELETE CASCADE,
  service_commission_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  product_commission_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.team_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Unit owners can manage team commissions" ON public.team_commissions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.team_members tm JOIN public.units u ON u.id = tm.unit_id WHERE tm.id = team_member_id AND u.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.team_members tm JOIN public.units u ON u.id = tm.unit_id WHERE tm.id = team_member_id AND u.owner_id = auth.uid()));

-- Invitations (Pending workers)
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(unit_id, user_id)
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Unit owners can read invitations" ON public.invitations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND owner_id = auth.uid()));
CREATE POLICY "Unit owners can update invitations" ON public.invitations FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND owner_id = auth.uid()));
CREATE POLICY "Users can insert their own invitations" ON public.invitations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own invitations" ON public.invitations FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Appointments updates
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Set triggers
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_team_shifts_updated_at BEFORE UPDATE ON public.team_shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_team_commissions_updated_at BEFORE UPDATE ON public.team_commissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
