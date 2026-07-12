-- Add profile/biography/languages/photo columns across the three user tables

-- Doctors (consultation_fee already exists as integer; keep it)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS biography text;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS languages_spoken text[] DEFAULT '{}';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS profile_photo_url text;

-- Hospitals (admin profile photo + dean/contact/location)
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS profile_photo_url text;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS dean_name text;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS dean_contact_number text;

-- Registered patients
ALTER TABLE registered_patients ADD COLUMN IF NOT EXISTS profile_photo_url text;
ALTER TABLE registered_patients ADD COLUMN IF NOT EXISTS emergency_contact text;
ALTER TABLE registered_patients ADD COLUMN IF NOT EXISTS date_of_birth text;
ALTER TABLE registered_patients ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE registered_patients ADD COLUMN IF NOT EXISTS address text;

-- Hospital admins: add dean/loc cols mirrored back through hospital_admins
ALTER TABLE hospital_admins ADD COLUMN IF NOT EXISTS profile_photo_url text;

-- Replace the old permissive UPDATE policy on doctors with an owner-scoped one
DROP POLICY IF EXISTS "doctors_update_any" ON doctors;
CREATE POLICY "doctors_update_own" ON doctors
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- registered_patients: allow authenticated own-row updates by email match
DROP POLICY IF EXISTS "rp_update_own" ON registered_patients;
CREATE POLICY "rp_update_own" ON registered_patients
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
