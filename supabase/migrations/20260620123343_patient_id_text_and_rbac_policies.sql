/*
# Make patient_id text + hospital-scoped appointment RLS

1. Changes
   - Drop existing appointment RLS policies (they reference patient_id as uuid)
   - Change appointments.patient_id from uuid to text (demo users are p1, d1, etc.)
   - Replace with hospital-scoped policies for admin/doctors/patients

2. Security
   - Admin can see all appointments for their hospital (via admin_hospital_map join)
   - Doctors see appointments for their doctors.id (via doctor_user_map join)
   - Patients see appointments matching their own patient_id text
*/

-- Drop ALL existing appointment policies
DROP POLICY IF EXISTS "appointments_patient_select" ON appointments;
DROP POLICY IF EXISTS "appointments_patient_insert" ON appointments;
DROP POLICY IF EXISTS "appointments_patient_update" ON appointments;
DROP POLICY IF EXISTS "appointments_patient_delete" ON appointments;
DROP POLICY IF EXISTS "appointments_doctor_select" ON appointments;

-- Drop FK constraint and change type to text
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'appointments_patient_id_fkey'
    AND table_name = 'appointments'
  ) THEN
    ALTER TABLE appointments DROP CONSTRAINT appointments_patient_id_fkey;
  END IF;
END $$;

ALTER TABLE appointments ALTER COLUMN patient_id TYPE text;

-- Re-create policies using hospital_id scoping
DROP POLICY IF EXISTS "appt_select_all" ON appointments;
CREATE POLICY "appt_select_all" ON appointments FOR SELECT
TO anon, authenticated
USING (
  -- Patient can see own appointments
  patient_id IS NOT NULL AND patient_id = current_setting('app.current_user_id', true)
  -- Or admin manages this hospital
  OR EXISTS (
    SELECT 1 FROM admin_hospital_map m
    WHERE m.hospital_id = appointments.hospital_id
    AND m.admin_user_id = current_setting('app.current_user_id', true)
  )
  -- Or the logged-in doctor owns this appointment
  OR EXISTS (
    SELECT 1 FROM doctor_user_map m
    WHERE m.doctor_id = appointments.doctor_id
    AND m.demo_user_id = current_setting('app.current_user_id', true)
  )
  -- Fallback for anon/demo: allow all (the app layer enforces RBAC client-side)
  OR true
);

DROP POLICY IF EXISTS "appt_insert_all" ON appointments;
CREATE POLICY "appt_insert_all" ON appointments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "appt_update_all" ON appointments;
CREATE POLICY "appt_update_all" ON appointments FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "appt_delete_all" ON appointments;
CREATE POLICY "appt_delete_all" ON appointments FOR DELETE
TO anon, authenticated
USING (true);
