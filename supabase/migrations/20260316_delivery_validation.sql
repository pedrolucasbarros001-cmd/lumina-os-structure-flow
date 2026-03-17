-- Migration: Delivery Coverage Validation
-- Description: Add function to validate if appointment location is within unit's delivery coverage
-- Created: 2026-03-16

-- 1. Create function to check if coordinates are within coverage radius
-- This uses the Haversine formula to calculate distance between two points
CREATE OR REPLACE FUNCTION public.is_within_coverage_radius(
  unit_id UUID,
  customer_lat FLOAT,
  customer_lon FLOAT
)
RETURNS BOOLEAN
LANGUAGE pl/pgSQL
STABLE
AS $$
DECLARE
  v_unit_lat FLOAT;
  v_unit_lon FLOAT;
  v_coverage_radius_km FLOAT;
  v_distance_km FLOAT;
BEGIN
  -- Get unit coordinates and coverage radius
  SELECT 
    u.coordinates->'lat'::text,
    u.coordinates->'lon'::text,
    m.coverage_radius_km
  INTO v_unit_lat, v_unit_lon, v_coverage_radius_km
  FROM public.units u
  LEFT JOIN public.mobility_settings m ON m.unit_id = u.id
  WHERE u.id = unit_id;
  
  -- If no coordinates or radius, allow delivery
  IF v_unit_lat IS NULL OR v_unit_lon IS NULL OR v_coverage_radius_km IS NULL THEN
    RETURN true;
  END IF;
  
  -- Calculate distance using Haversine formula
  -- This is an approximate calculation (good enough for ~100km radius)
  v_distance_km := 
    6371 * 2 * ASIN(SQRT(
      POWER(SIN(RADIANS((customer_lat - v_unit_lat) / 2)), 2) +
      COS(RADIANS(v_unit_lat)) * COS(RADIANS(customer_lat)) *
      POWER(SIN(RADIANS((customer_lon - v_unit_lon) / 2)), 2)
    ));
  
  -- Return true if within radius
  RETURN v_distance_km <= v_coverage_radius_km;
END;
$$;

-- 2. Create function to validate appointment delivery feasibility
CREATE OR REPLACE FUNCTION public.validate_delivery_appointment(
  unit_id UUID,
  appointment_type VARCHAR,
  customer_address_lat FLOAT,
  customer_address_lon FLOAT
)
RETURNS TABLE(is_valid BOOLEAN, reason VARCHAR)
LANGUAGE pl/pgSQL
STABLE
AS $$
DECLARE
  v_logistics_type VARCHAR;
  v_within_radius BOOLEAN;
  v_coverage_radius_km FLOAT;
  v_distance_km FLOAT;
BEGIN
  -- Check if unit exists
  IF NOT EXISTS (SELECT 1 FROM public.units WHERE id = unit_id) THEN
    RETURN QUERY SELECT false::BOOLEAN, 'Unidade não encontrada'::VARCHAR;
    RETURN;
  END IF;
  
  -- Get unit logistics type
  SELECT logistics_type INTO v_logistics_type
  FROM public.units
  WHERE id = unit_id;
  
  -- If appointment is not home delivery, no validation needed
  IF appointment_type != 'home' THEN
    RETURN QUERY SELECT true::BOOLEAN, 'OK - Não é delivery'::VARCHAR;
    RETURN;
  END IF;
  
  -- If unit doesn't accept home visits, reject
  IF v_logistics_type = 'unit' THEN
    RETURN QUERY SELECT false::BOOLEAN, 'Unidade não faz entregas ao domicílio'::VARCHAR;
    RETURN;
  END IF;
  
  -- If unit is home or hybrid, check coverage radius
  SELECT is_within_coverage_radius(unit_id, customer_address_lat, customer_address_lon)
  INTO v_within_radius;
  
  IF NOT v_within_radius THEN
    RETURN QUERY SELECT false::BOOLEAN, 'Localização fora do raio de cobertura'::VARCHAR;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true::BOOLEAN, 'OK - Dentro do raio de cobertura'::VARCHAR;
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.is_within_coverage_radius(UUID, FLOAT, FLOAT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_delivery_appointment(UUID, VARCHAR, FLOAT, FLOAT) TO authenticated, service_role;

-- 4. Add delivery validation RLS policy
-- Prevent creating appointments outside coverage radius
CREATE OR REPLACE FUNCTION public.validate_appointment_delivery()
RETURNS TRIGGER AS $$
DECLARE
  v_is_valid BOOLEAN;
BEGIN
  -- Only validate delivery appointments
  IF NEW.type = 'home' AND NEW.coordinates IS NOT NULL THEN
    SELECT is_valid INTO v_is_valid
    FROM public.validate_delivery_appointment(
      NEW.unit_id,
      NEW.type,
      (NEW.coordinates->'lat'::text)::FLOAT,
      (NEW.coordinates->'lon'::text)::FLOAT
    );
    
    IF NOT v_is_valid THEN
      RAISE EXCEPTION 'Localização fora do raio de cobertura';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to appointments table (if not already exists)
DROP TRIGGER IF EXISTS trigger_validate_appointment_delivery ON public.appointments;
CREATE TRIGGER trigger_validate_appointment_delivery
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.validate_appointment_delivery();

-- 5. Create index on coordinates for geographic queries
CREATE INDEX IF NOT EXISTS idx_appointments_coordinates 
ON public.appointments USING GiST(coordinates)
WHERE type = 'home';

-- 6. Add comment
COMMENT ON FUNCTION public.is_within_coverage_radius(UUID, FLOAT, FLOAT)
IS 'Checks if customer coordinates are within unit coverage radius using Haversine formula. Returns true if within range.';

COMMENT ON FUNCTION public.validate_delivery_appointment(UUID, VARCHAR, FLOAT, FLOAT)
IS 'Validates if a delivery appointment is feasible for a unit. Returns is_valid boolean and reason message.';
