-- Update appointment_status enum with cockpit statuses
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'in_workshop';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'order_part';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'waiting_part';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'to_price';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'unpaid';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'finished';
