-- Registered patients (email+password auth)
CREATE TABLE IF NOT EXISTS registered_patients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  email           text NOT NULL UNIQUE,
  phone           text NOT NULL,
  password_hash   text NOT NULL,
  status          text NOT NULL DEFAULT 'ACTIVE',
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE registered_patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rp_all" ON registered_patients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_registered_patients_email ON registered_patients(email);

-- Medical reports (linked to appointments or uploaded manually)
CREATE TABLE IF NOT EXISTS medical_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      text NOT NULL,
  appointment_id  uuid REFERENCES appointments(id) ON DELETE SET NULL,
  doctor_id       uuid REFERENCES doctors(id) ON DELETE SET NULL,
  hospital_id     uuid REFERENCES hospitals(id) ON DELETE SET NULL,
  title           text NOT NULL,
  report_type     text NOT NULL DEFAULT 'lab_report',
  file_name       text,
  file_url        text,
  notes           text,
  health_status   text DEFAULT 'normal',
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE medical_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mr_select" ON medical_reports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "mr_insert" ON medical_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "mr_update" ON medical_reports FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_medical_reports_patient ON medical_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_appointment ON medical_reports(appointment_id);
