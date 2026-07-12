-- Create verification_otps table for OTP management
CREATE TABLE IF NOT EXISTS verification_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('registration', 'forgot-password')),
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_verification_otps_email ON verification_otps(email);
CREATE INDEX IF NOT EXISTS idx_verification_otps_email_otp ON verification_otps(email, otp);

-- Add email verification fields to registered_patients
ALTER TABLE registered_patients 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'PENDING_VERIFICATION' CHECK (verification_status IN ('PENDING_VERIFICATION', 'VERIFIED'));

-- Add email verification fields to hospital_admins
ALTER TABLE hospital_admins 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'PENDING_VERIFICATION' CHECK (verification_status IN ('PENDING_VERIFICATION', 'VERIFIED'));

-- Add email verification fields to doctors
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'PENDING_VERIFICATION' CHECK (verification_status IN ('PENDING_VERIFICATION', 'VERIFIED'));

-- Add email verification fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'PENDING_VERIFICATION' CHECK (verification_status IN ('PENDING_VERIFICATION', 'VERIFIED'));

-- RLS policies for verification_otps
ALTER TABLE verification_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_verification_otps" ON verification_otps FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "select_own_verification_otps" ON verification_otps FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "update_verification_otps" ON verification_otps FOR UPDATE
  TO anon, authenticated USING (true);

-- Function to clean up expired OTPs (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps() RETURNS void AS $$
BEGIN
  DELETE FROM verification_otps WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
