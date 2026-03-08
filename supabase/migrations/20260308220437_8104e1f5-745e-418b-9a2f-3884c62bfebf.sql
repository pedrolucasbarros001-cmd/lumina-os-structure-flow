ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'en_route' AFTER 'confirmed';
ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'arrived' AFTER 'en_route';