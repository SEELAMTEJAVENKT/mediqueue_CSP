-- Add multi-channel OTP fields to tables

-- Add phone verification fields to registered_patients
ALTER TABLE registered_patients 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS preferred_otp_method TEXT DEFAULT 'EMAIL' CHECK (preferred_otp_method IN ('EMAIL', 'SMS', 'WHATSAPP'));

-- Add phone verification fields to hospital_admins
ALTER TABLE hospital_admins 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS preferred_otp_method TEXT DEFAULT 'EMAIL' CHECK (preferred_otp_method IN ('EMAIL', 'SMS', 'WHATSAPP'));

-- Add phone verification fields to doctors
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS preferred_otp_method TEXT DEFAULT 'EMAIL' CHECK (preferred_otp_method IN ('EMAIL', 'SMS', 'WHATSAPP'));

-- Add phone verification fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS preferred_otp_method TEXT DEFAULT 'EMAIL' CHECK (preferred_otp_method IN ('EMAIL', 'SMS', 'WHATSAPP'));

-- Update verification_otps table to support delivery method
ALTER TABLE verification_otps 
ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'EMAIL' CHECK (delivery_method IN ('EMAIL', 'SMS', 'WHATSAPP'));

-- Create unique index on phone numbers to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_registered_patients_phone ON registered_patients(phone) WHERE phone IS NOT NULL AND phone != '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_hospital_admins_phone ON hospital_admins(mobile_number) WHERE mobile_number IS NOT NULL AND mobile_number != '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_doctors_phone ON doctors(phone) WHERE phone IS NOT NULL AND phone != '';

-- Add OTP rate limiting table
CREATE TABLE IF NOT EXISTS otp_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('send', 'verify')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_identifier ON otp_rate_limits(identifier, created_at);

-- RLS for otp_rate_limits
ALTER TABLE otp_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_rate_limits" ON otp_rate_limits FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "select_rate_limits" ON otp_rate_limits FOR SELECT
  TO anon, authenticated USING (true);

-- Function to check rate limits (max 5 requests per minute)
CREATE OR REPLACE FUNCTION check_otp_rate_limit(p_identifier TEXT) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM otp_rate_limits
  WHERE identifier = p_identifier
    AND created_at > NOW() - INTERVAL '1 minute';
  
  RETURN v_count < 5;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old rate limit entries
CREATE OR REPLACE FUNCTION cleanup_rate_limits() RETURNS void AS $$
BEGIN
  DELETE FROM otp_rate_limits WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
