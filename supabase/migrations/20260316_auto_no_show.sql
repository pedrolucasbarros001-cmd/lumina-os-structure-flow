-- Migration: Auto No-Show Appointment Status
-- Description: Automatically mark appointments as no_show if they passed 15 minutes without being marked as completed/cancelled
-- Created: 2026-03-16

-- 1. Create a function to check and mark no-show appointments
CREATE OR REPLACE FUNCTION public.mark_expired_appointments_as_no_show()
RETURNS TABLE(updated_count int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count int;
BEGIN
  -- Mark appointments as no_show if:
  -- 1. Status is 'confirmed' or 'en_route'
  -- 2. Appointment datetime + duration has passed (with 15 min grace)
  -- 3. It's been more than 15 minutes since the appointment time
  
  UPDATE public.appointments
  SET 
    status = 'no_show',
    updated_at = NOW()
  WHERE
    status IN ('confirmed', 'en_route', 'arrived')
    AND (datetime + (duration || ' minutes')::interval) < NOW() - INTERVAL '15 minutes'
    AND status != 'completed'
    AND status != 'cancelled'
    AND status != 'no_show';
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_updated_count;
END;
$$;

-- 2. Grant permission to authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.mark_expired_appointments_as_no_show() TO authenticated, service_role;

-- 3. Add a comment to document the function
COMMENT ON FUNCTION public.mark_expired_appointments_as_no_show() 
IS 'Automatically marks appointments as no_show if they have expired by 15+ minutes. Called via scheduled job or on demand.';

-- 4. Create index for performance (query runs on large tables)
CREATE INDEX IF NOT EXISTS idx_appointments_status_datetime 
ON public.appointments(status, datetime DESC)
WHERE status IN ('confirmed', 'en_route', 'arrived');

-- 5. IMPORTANT: Schedule this to run via Supabase Cron
-- In Supabase Dashboard:
-- 1. Go to Project → Database → Extensions
-- 2. Enable "pg_cron" extension
-- 3. Go to SQL Editor and run:
--
-- SELECT cron.schedule(
--   'mark-no-show-appointments',        -- job name
--   '*/10 * * * *',                     -- every 10 minutes
--   'SELECT public.mark_expired_appointments_as_no_show();'
-- );
--
-- To view scheduled jobs:
-- SELECT * FROM cron.job;
--
-- To unschedule:
-- SELECT cron.unschedule('mark-no-show-appointments');
