-- Add status + registration fields to hospitals table
ALTER TABLE hospitals
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED')),
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS hospital_type text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS official_email text,
  ADD COLUMN IF NOT EXISTS official_contact_number text;

-- Uniqueness constraints
ALTER TABLE hospitals
  ADD CONSTRAINT hospitals_name_uk UNIQUE (name),
  ADD CONSTRAINT hospitals_registration_number_uk UNIQUE (registration_number),
  ADD CONSTRAINT hospitals_license_number_uk UNIQUE (license_number),
  ADD CONSTRAINT hospitals_official_email_uk UNIQUE (official_email);

-- Mark all existing hospitals ACTIVE
UPDATE hospitals SET status = 'ACTIVE' WHERE status IS NULL OR status = '';
UPDATE hospitals SET is_open = true WHERE is_open IS NULL;

-- Hospital Admins table for full self-registration workflow
CREATE TABLE IF NOT EXISTS hospital_admins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id     uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  full_name       text NOT NULL,
  email           text NOT NULL UNIQUE,
  mobile_number   text NOT NULL UNIQUE,
  password_hash   text NOT NULL,           -- simple hash placeholder; production should use Supabase Auth
  role            text NOT NULL DEFAULT 'HOSPITAL_ADMIN',
  status          text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE hospital_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ha_select" ON hospital_admins
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ha_insert" ON hospital_admins
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "ha_update" ON hospital_admins
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Only one primary HOSPITAL_ADMIN per hospital
CREATE UNIQUE INDEX IF NOT EXISTS hospital_admins_one_per_hospital_uk
  ON hospital_admins(hospital_id)
  WHERE role = 'HOSPITAL_ADMIN' AND status = 'ACTIVE';

-- Index for fast login lookup
CREATE INDEX IF NOT EXISTS idx_hospital_admins_email ON hospital_admins(email);
CREATE INDEX IF NOT EXISTS idx_hospitals_status ON hospitals(status);
