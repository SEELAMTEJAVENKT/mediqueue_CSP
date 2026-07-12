-- Patient-friendly medical report fields
ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS diagnosis text;
ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS plain_explanation text;
ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS symptoms_observed text;
ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS doctor_findings text;
ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS lab_results jsonb;
ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS recommended_actions text;
ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS follow_up_instructions text;
ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS follow_up_date text;
ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS ai_summary text;

-- RLS policies: patients see only their own reports; doctors see their assigned patients' reports;
-- hospital admins see analytics only (SELECT) for their hospital.
DROP POLICY IF EXISTS "medical_reports_select_own_patient" ON medical_reports;
CREATE POLICY "medical_reports_select_own_patient" ON medical_reports
  FOR SELECT TO authenticated
  USING (
    patient_id = (select auth.uid()::text)
    OR doctor_id IN (SELECT id FROM doctors WHERE email = (select email from auth.users where id = auth.uid()))
    OR hospital_id IN (SELECT hospital_id FROM hospital_admins WHERE email = (select email from auth.users where id = auth.uid()))
  );

DROP POLICY IF EXISTS "medical_reports_insert_own_patient" ON medical_reports;
CREATE POLICY "medical_reports_insert_own_patient" ON medical_reports
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "medical_reports_update_own_patient" ON medical_reports;
CREATE POLICY "medical_reports_update_own_patient" ON medical_reports
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);
