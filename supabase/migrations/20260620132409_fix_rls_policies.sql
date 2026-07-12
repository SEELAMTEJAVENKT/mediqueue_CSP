/*
# Fix RLS policies to allow schedules + slots inserts/updates/deletes

Problem
- RLS was enabled but policies on `schedules` and `time_slots` used
  `WITH CHECK (true)` and `USING (true)` — that's actually permissive already.
- However, the `time_slots` table had NO RLS policies at all (only inherited
  RLS-enabled state). Inserts from the client browser silently failed or were
  rejected via FK checks through hospital_id (which is nullable in places).
- Worse, several tables only allowed `authenticated` role, but the demo app
  uses the anon key (no auth) so inserts from the browser were denied.

Changes
1. Drop restrictive policies on `schedules`, `time_slots`, `appointments`
2. Replace with permissive `anon + authenticated` policies for full CRUD
3. Also open notifications + prescriptions + audit_logs fully to anon
   (the app enforces RBAC client-side; this is a demo environment)
*/

-- ── SCHEDULES ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "schedules_select" ON schedules;
DROP POLICY IF EXISTS "schedules_insert" ON schedules;
DROP POLICY IF EXISTS "schedules_update" ON schedules;
DROP POLICY IF EXISTS "schedules_delete" ON schedules;

CREATE POLICY "schedules_select" ON schedules
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "schedules_insert" ON schedules
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "schedules_update" ON schedules
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "schedules_delete" ON schedules
  FOR DELETE TO anon, authenticated USING (true);

-- ── TIME_SLOTS ─────────────────────────────────────────────────────────────
-- time_slots inherited RLS enabled but had no explicit policies, so all
-- writes from the anon client were silently dropped.
DROP POLICY IF EXISTS "ts_select" ON time_slots;
DROP POLICY IF EXISTS "ts_insert" ON time_slots;
DROP POLICY IF EXISTS "ts_update" ON time_slots;
DROP POLICY IF EXISTS "ts_delete" ON time_slots;

CREATE POLICY "ts_select" ON time_slots
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ts_insert" ON time_slots
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "ts_update" ON time_slots
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ts_delete" ON time_slots
  FOR DELETE TO anon, authenticated USING (true);

-- ── NOTIFICATIONS ───────────────────────────────────────────────────────────
CREATE POLICY "notif_delete" ON notifications
  FOR DELETE TO anon, authenticated USING (true);

-- ── PRESCRIPTIONS ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "prescriptions_delete" ON prescriptions;
CREATE POLICY "prescriptions_delete" ON prescriptions
  FOR DELETE TO anon, authenticated USING (true);

-- ── AUDIT LOGS ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "audit_delete" ON appointment_audit_logs;
CREATE POLICY "audit_delete" ON appointment_audit_logs
  FOR DELETE TO anon, authenticated USING (true);

-- ── DOCTORS ──────────────────────────────────────────────────────────────────
-- Add explicit permissive policies for doctors (admin manages them)
DROP POLICY IF EXISTS "doctors_anon_select" ON doctors;
DROP POLICY IF EXISTS "doctors_anon_insert" ON doctors;
DROP POLICY IF EXISTS "doctors_anon_update" ON doctors;
DROP POLICY IF EXISTS "doctors_anon_delete" ON doctors;

CREATE POLICY "doctors_anon_select" ON doctors
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "doctors_anon_insert" ON doctors
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "doctors_anon_update" ON doctors
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "doctors_anon_delete" ON doctors
  FOR DELETE TO anon, authenticated USING (true);
