-- Migration: Customer Appointment Confirmation
-- Description: Add capability to send confirmation emails to customers 24h before appointment
-- Created: 2026-03-16

-- 1. Add confirmation_sent and reminder_sent columns to appointments
ALTER TABLE IF EXISTS public.appointments
ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS customer_confirmed BOOLEAN DEFAULT NULL, -- null = no response, true = confirmed, false = declined/skipped
ADD COLUMN IF NOT EXISTS customer_confirmed_at TIMESTAMP WITH TIME ZONE;

-- 2. Create confirmation_tokens table for customer confirmation links
CREATE TABLE IF NOT EXISTS public.appointment_confirmation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('confirm', 'reschedule', 'cancel')),
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.appointment_confirmation_tokens ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Customers can view their own confirmation tokens"
ON public.appointment_confirmation_tokens
FOR SELECT
TO authenticated
USING (
  appointment_id IN (
    SELECT id FROM appointments a
    WHERE a.client_id IN (
      SELECT id FROM clients c WHERE c.user_id = auth.uid()
    )
  )
);

CREATE POLICY "System can manage confirmation tokens"
ON public.appointment_confirmation_tokens
FOR ALL
TO service_role
USING (TRUE)
WITH CHECK (TRUE);

-- 5. Create function to generate confirmation token
CREATE OR REPLACE FUNCTION public.create_appointment_confirmation_token(
  appointment_id UUID,
  action VARCHAR
)
RETURNS TABLE(token VARCHAR, expires_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token VARCHAR;
BEGIN
  -- Generate random token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert token
  INSERT INTO appointment_confirmation_tokens (
    appointment_id,
    token,
    action,
    expires_at
  ) VALUES (
    appointment_id,
    v_token,
    action,
    NOW() + INTERVAL '24 hours'
  );
  
  RETURN QUERY SELECT v_token::VARCHAR, (NOW() + INTERVAL '24 hours');
END;
$$;

-- 6. Create function to send reminder 24h before
CREATE OR REPLACE FUNCTION public.send_appointment_reminders()
RETURNS TABLE(sent_count int, failed_count int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sent_count int := 0;
  v_failed_count int := 0;
  v_appt RECORD;
BEGIN
  -- Find appointments due for reminder (24h before, not yet sent)
  FOR v_appt IN 
    SELECT 
      a.id,
      a.datetime,
      a.client_id,
      c.email,
      c.phone,
      c.name,
      s.name as service_name,
      u.name as unit_name
    FROM appointments a
    JOIN clients c ON c.id = a.client_id
    JOIN services s ON s.id = a.service_id
    JOIN units u ON u.id = a.unit_id
    WHERE 
      a.datetime > NOW()
      AND a.datetime < NOW() + INTERVAL '24 hours 30 minutes'
      AND a.datetime > NOW() + INTERVAL '23 hours 30 minutes'
      AND a.status IN ('confirmed', 'pending_approval')
      AND a.reminder_sent_at IS NULL
      AND c.email IS NOT NULL
  LOOP
    -- Generate confirmation token
    INSERT INTO appointment_confirmation_tokens (
      appointment_id,
      token,
      action,
      expires_at
    ) VALUES (
      v_appt.id,
      encode(gen_random_bytes(32), 'hex'),
      'confirm',
      v_appt.datetime
    );
    
    -- Update reminder_sent_at
    UPDATE appointments SET reminder_sent_at = NOW()
    WHERE id = v_appt.id;
    
    v_sent_count := v_sent_count + 1;
    
    -- Note: Actual email sending should be done via edge function or external service
    -- This function just marks them for sending
  END LOOP;
  
  RETURN QUERY SELECT v_sent_count, v_failed_count;
END;
$$;

-- 7. Create function to handle customer confirmation
CREATE OR REPLACE FUNCTION public.confirm_appointment_by_token(
  token VARCHAR,
  confirmed BOOLEAN
)
RETURNS TABLE(success BOOLEAN, message VARCHAR, appointment_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appointment_id UUID;
  v_token_exists BOOLEAN;
  v_token_expired BOOLEAN;
BEGIN
  -- Find token
  SELECT 
    appointment_id,
    (expires_at < NOW()) as token_expired
  INTO v_appointment_id, v_token_expired
  FROM appointment_confirmation_tokens
  WHERE token = token AND used = false;
  
  IF v_appointment_id IS NULL THEN
    RETURN QUERY SELECT false::BOOLEAN, 'Token inválido ou expirado'::VARCHAR, NULL::UUID;
    RETURN;
  END IF;
  
  IF v_token_expired THEN
    RETURN QUERY SELECT false::BOOLEAN, 'Token expirado'::VARCHAR, NULL::UUID;
    RETURN;
  END IF;
  
  -- Mark token as used
  UPDATE appointment_confirmation_tokens
  SET used = true, used_at = NOW()
  WHERE token = token;
  
  -- Update appointment
  UPDATE appointments
  SET 
    customer_confirmed = confirmed,
    customer_confirmed_at = NOW()
  WHERE id = v_appointment_id;
  
  RETURN QUERY SELECT true::BOOLEAN, 'Confirmação registada'::VARCHAR, v_appointment_id;
END;
$$;

-- 8. Grant permissions
GRANT EXECUTE ON FUNCTION public.create_appointment_confirmation_token(UUID, VARCHAR) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_appointment_reminders() TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_appointment_by_token(VARCHAR, BOOLEAN) TO authenticated, anon;

-- 9. Create indexes
CREATE INDEX IF NOT EXISTS idx_appointment_confirmation_tokens_appointment_id 
ON public.appointment_confirmation_tokens(appointment_id);

CREATE INDEX IF NOT EXISTS idx_appointment_confirmation_tokens_token 
ON public.appointment_confirmation_tokens(token);

CREATE INDEX IF NOT EXISTS idx_appointments_datetime_status 
ON public.appointments(datetime, status)
WHERE reminder_sent_at IS NULL;

-- 10. Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_confirmation_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_confirmation_tokens_updated_at
BEFORE UPDATE ON public.appointment_confirmation_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_confirmation_tokens_updated_at();

-- 11. Add comments
COMMENT ON TABLE public.appointment_confirmation_tokens
IS 'Tokens for customers to confirm/decline/reschedule appointments via email links.';

COMMENT ON FUNCTION public.send_appointment_reminders()
IS 'Sends appointment reminders 24 hours before the appointment. Should be run via cron job every hour.';

COMMENT ON FUNCTION public.confirm_appointment_by_token(VARCHAR, BOOLEAN)
IS 'Processes customer confirmation via email token. Returns success status.';
