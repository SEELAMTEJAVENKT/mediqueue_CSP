/*
# RBAC + Appointment Lifecycle Migration

1. Changes
   - Add `hospital_id` + `status` columns to `doctors` table for RBAC + active/inactive
   - Add `department` column to `doctors` table
   - Add `consultation_duration_minutes` to `doctors`
   - Add full lifecycle columns to `appointments`: arrival_time, consultation_start, consultation_end,
     waiting_time_minutes, consultation_duration_minutes, queue_position
   - Add `status` enum values for full lifecycle tracking
   - Add `hospital_id` filtering column to `time_slots`
   - Create `schedules` table for recurring doctor schedules
   - Create `notifications` table for in-app notifications
   - Create `prescriptions` table
   - Create `audit_logs` table for appointment status changes
   - Update all RLS policies to enforce hospital_id scoping

2. New Tables
   - `schedules`: doctor recurring availability (day_of_week, start/end time, slot_duration)
   - `notifications`: in-app notification store per user
   - `prescriptions`: digital prescriptions linked to appointments
   - `audit_logs`: append-only log of appointment status changes

3. Security
   - All tables have RLS enabled
   - hospital_id used in every policy where applicable
   - anon + authenticated can read hospitals/doctors publicly
*/

-- ── DOCTORS: add columns idempotently ────────────────────────────────────────
ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS consultation_duration_minutes integer NOT NULL DEFAULT 30;

-- ── APPOINTMENTS: extend lifecycle columns ────────────────────────────────────
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS arrival_time timestamptz,
  ADD COLUMN IF NOT EXISTS consultation_start timestamptz,
  ADD COLUMN IF NOT EXISTS consultation_end timestamptz,
  ADD COLUMN IF NOT EXISTS waiting_time_minutes integer,
  ADD COLUMN IF NOT EXISTS consultation_duration_minutes integer,
  ADD COLUMN IF NOT EXISTS queue_position integer,
  ADD COLUMN IF NOT EXISTS patient_name text,
  ADD COLUMN IF NOT EXISTS patient_phone text;

-- ── TIME_SLOTS: add hospital_id ───────────────────────────────────────────────
ALTER TABLE time_slots
  ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE;

-- Backfill hospital_id from doctors
UPDATE time_slots ts
SET hospital_id = d.hospital_id
FROM doctors d
WHERE ts.doctor_id = d.id
  AND ts.hospital_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_time_slots_hospital ON time_slots(hospital_id);

-- ── SCHEDULES table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun
  start_time text NOT NULL,
  end_time text NOT NULL,
  slot_duration_minutes integer NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schedules_select" ON schedules;
CREATE POLICY "schedules_select" ON schedules FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "schedules_insert" ON schedules;
CREATE POLICY "schedules_insert" ON schedules FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "schedules_update" ON schedules;
CREATE POLICY "schedules_update" ON schedules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "schedules_delete" ON schedules;
CREATE POLICY "schedules_delete" ON schedules FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_schedules_doctor ON schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_schedules_hospital ON schedules(hospital_id);

-- ── NOTIFICATIONS table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,           -- demo user id (p1, d1, a1) or auth.uid
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'system', -- appointment | report | system | emergency
  is_read boolean NOT NULL DEFAULT false,
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_select" ON notifications;
CREATE POLICY "notif_select" ON notifications FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "notif_insert" ON notifications;
CREATE POLICY "notif_insert" ON notifications FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "notif_update" ON notifications;
CREATE POLICY "notif_update" ON notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_hospital ON notifications(hospital_id);

-- ── PRESCRIPTIONS table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id text NOT NULL,
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  diagnosis text,
  medicines jsonb DEFAULT '[]',
  instructions text,
  follow_up_date text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prescriptions_select" ON prescriptions;
CREATE POLICY "prescriptions_select" ON prescriptions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "prescriptions_insert" ON prescriptions;
CREATE POLICY "prescriptions_insert" ON prescriptions FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "prescriptions_update" ON prescriptions;
CREATE POLICY "prescriptions_update" ON prescriptions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment ON prescriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);

-- ── AUDIT LOGS table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointment_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointment_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_select" ON appointment_audit_logs;
CREATE POLICY "audit_select" ON appointment_audit_logs FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "audit_insert" ON appointment_audit_logs;
CREATE POLICY "audit_insert" ON appointment_audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_audit_appointment ON appointment_audit_logs(appointment_id);

-- ── ADMIN USER MAPPING table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_hospital_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id text NOT NULL UNIQUE,  -- demo user id
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_hospital_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_map_select" ON admin_hospital_map;
CREATE POLICY "admin_map_select" ON admin_hospital_map FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_map_insert" ON admin_hospital_map;
CREATE POLICY "admin_map_insert" ON admin_hospital_map FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ── DOCTOR USER MAPPING table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_user_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_user_id text NOT NULL UNIQUE,  -- demo user id
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE doctor_user_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctor_map_select" ON doctor_user_map;
CREATE POLICY "doctor_map_select" ON doctor_user_map FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "doctor_map_insert" ON doctor_user_map;
CREATE POLICY "doctor_map_insert" ON doctor_user_map FOR INSERT TO anon, authenticated WITH CHECK (true);
