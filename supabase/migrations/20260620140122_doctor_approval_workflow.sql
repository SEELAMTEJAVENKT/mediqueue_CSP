-- Add approval_status to doctors
ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (approval_status IN ('PENDING_APPROVAL','APPROVED','ACTIVE','REJECTED','SUSPENDED')),
  ADD COLUMN IF NOT EXISTS medical_license_number text,
  ADD COLUMN IF NOT EXISTS doctor_id_code text,
  ADD COLUMN IF NOT EXISTS mobile_number text,
  ADD COLUMN IF NOT EXISTS approved_by text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Set existing doctors to ACTIVE
UPDATE doctors SET approval_status = 'ACTIVE' WHERE approval_status = 'ACTIVE';

-- Doctor approval requests table
CREATE TABLE IF NOT EXISTS doctor_approval_requests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id      uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  hospital_id    uuid NOT NULL REFERENCES hospitals(id),
  requested_at   timestamptz NOT NULL DEFAULT now(),
  reviewed_by    text,
  reviewed_at    timestamptz,
  status         text NOT NULL DEFAULT 'PENDING_APPROVAL'
    CHECK (status IN ('PENDING_APPROVAL','APPROVED','REJECTED')),
  rejection_reason text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE doctor_approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dar_select" ON doctor_approval_requests
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "dar_insert" ON doctor_approval_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "dar_update" ON doctor_approval_requests
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "dar_delete" ON doctor_approval_requests
  FOR DELETE TO anon, authenticated USING (true);

-- Index for fast lookup by hospital
CREATE INDEX IF NOT EXISTS idx_dar_hospital ON doctor_approval_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_dar_status   ON doctor_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_dar_doctor   ON doctor_approval_requests(doctor_id);
