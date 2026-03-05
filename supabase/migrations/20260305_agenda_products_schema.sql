-- Add duration_minutes to services (default 60)
ALTER TABLE services ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 60;

-- Add team_member_id and duration_minutes to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS team_member_id uuid REFERENCES team_members(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 60;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_ids text[] DEFAULT '{}';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS tip_amount numeric(10,2) DEFAULT 0;

-- Products table (ensure exists)
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  category text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can manage products" ON products;
CREATE POLICY "Owner can manage products" ON products
  FOR ALL USING (
    unit_id IN (SELECT id FROM units WHERE owner_id = auth.uid())
  ) WITH CHECK (
    unit_id IN (SELECT id FROM units WHERE owner_id = auth.uid())
  );

-- Updated at trigger for products
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add cover_image_url and logo_url to units (Google My Business style)
ALTER TABLE units ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE units ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE units ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE units ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE units ADD COLUMN IF NOT EXISTS whatsapp text;
