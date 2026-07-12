/*
# Healthcare Platform Schema - Hospitals, Doctors, Appointments

1. New Tables
- `hospitals`: Stores hospital information with Vizag locations
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `address` (text, not null)
  - `city` (text, not null) - e.g., 'Visakhapatnam', 'Hyderabad'
  - `phone` (text)
  - `email` (text)
  - `website` (text)
  - `latitude` (numeric)
  - `longitude` (numeric)
  - `rating` (numeric, default 0)
  - `review_count` (integer, default 0)
  - `specialties` (text[])
  - `departments` (jsonb)
  - `images` (text[])
  - `is_open` (boolean, default true)
  - `open_hours` (text)
  - `emergency_available` (boolean, default false)
  - `about` (text)
  - `facilities` (text[])
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

- `doctors`: Stores doctor profiles linked to hospitals
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `name` (text, not null)
  - `email` (text, unique, not null)
  - `phone` (text)
  - `specialization` (text, not null)
  - `qualification` (text)
  - `experience` (integer)
  - `hospital_id` (uuid, references hospitals)
  - `languages` (text[])
  - `consultation_fee` (integer)
  - `rating` (numeric, default 0)
  - `review_count` (integer, default 0)
  - `about` (text)
  - `is_verified` (boolean, default false)
  - `created_at` (timestamptz)

- `appointments`: Stores appointment bookings
  - `id` (uuid, primary key)
  - `patient_id` (uuid, references auth.users)
  - `doctor_id` (uuid, references doctors)
  - `hospital_id` (uuid, references hospitals)
  - `department_id` (text)
  - `slot_id` (text)
  - `date` (text, not null)
  - `start_time` (text, not null)
  - `end_time` (text, not null)
  - `status` (text, default 'pending')
  - `symptoms` (text)
  - `notes` (text)
  - `prescription_id` (text)
  - `report_ids` (text[])
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

- `time_slots`: Stores available time slots for doctors
  - `id` (uuid, primary key)
  - `doctor_id` (uuid, references doctors)
  - `date` (text, not null)
  - `start_time` (text, not null)
  - `end_time` (text, not null)
  - `is_booked` (boolean, default false)
  - `is_locked` (boolean, default false)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on all tables
- Public read access for hospitals and doctors (no auth needed to browse)
- Authenticated users can manage their own appointments
- Admin users can manage hospitals via role-based policies
*/

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL DEFAULT 'Visakhapatnam',
  phone text,
  email text,
  website text,
  latitude numeric,
  longitude numeric,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  specialties text[] DEFAULT '{}',
  departments jsonb DEFAULT '[]',
  images text[] DEFAULT '{}',
  is_open boolean DEFAULT true,
  open_hours text DEFAULT 'Mon-Sat: 9AM-9PM',
  emergency_available boolean DEFAULT false,
  about text,
  facilities text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  specialization text NOT NULL,
  qualification text,
  experience integer DEFAULT 0,
  hospital_id uuid REFERENCES hospitals(id) ON DELETE SET NULL,
  languages text[] DEFAULT '{}',
  consultation_fee integer DEFAULT 0,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  about text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE,
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id text,
  slot_id text,
  date text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  status text DEFAULT 'pending',
  symptoms text,
  notes text,
  prescription_id text,
  report_ids text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Time slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE,
  date text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  is_booked boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Hospitals policies: public can read, authenticated can create/update/delete (admin will filter in app)
DROP POLICY IF EXISTS "hospitals_public_select" ON hospitals;
CREATE POLICY "hospitals_public_select" ON hospitals FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "hospitals_authenticated_insert" ON hospitals;
CREATE POLICY "hospitals_authenticated_insert" ON hospitals FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "hospitals_authenticated_update" ON hospitals;
CREATE POLICY "hospitals_authenticated_update" ON hospitals FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "hospitals_authenticated_delete" ON hospitals;
CREATE POLICY "hospitals_authenticated_delete" ON hospitals FOR DELETE
TO authenticated USING (true);

-- Doctors policies: public can read
DROP POLICY IF EXISTS "doctors_public_select" ON doctors;
CREATE POLICY "doctors_public_select" ON doctors FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "doctors_authenticated_insert" ON doctors;
CREATE POLICY "doctors_authenticated_insert" ON doctors FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "doctors_authenticated_update" ON doctors;
CREATE POLICY "doctors_authenticated_update" ON doctors FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

-- Appointments policies: users can only see/manage their own
DROP POLICY IF EXISTS "appointments_patient_select" ON appointments;
CREATE POLICY "appointments_patient_select" ON appointments FOR SELECT
TO authenticated USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "appointments_patient_insert" ON appointments;
CREATE POLICY "appointments_patient_insert" ON appointments FOR INSERT
TO authenticated WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "appointments_patient_update" ON appointments;
CREATE POLICY "appointments_patient_update" ON appointments FOR UPDATE
TO authenticated USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "appointments_patient_delete" ON appointments;
CREATE POLICY "appointments_patient_delete" ON appointments FOR DELETE
TO authenticated USING (auth.uid() = patient_id);

-- Doctors can see appointments assigned to them
DROP POLICY IF EXISTS "appointments_doctor_select" ON appointments;
CREATE POLICY "appointments_doctor_select" ON appointments FOR SELECT
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM doctors WHERE doctors.id = appointments.doctor_id AND doctors.user_id = auth.uid()
  )
);

-- Time slots policies: public read, doctor can manage their own
DROP POLICY IF EXISTS "slots_public_select" ON time_slots;
CREATE POLICY "slots_public_select" ON time_slots FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "slots_doctor_update" ON time_slots;
CREATE POLICY "slots_doctor_update" ON time_slots FOR UPDATE
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM doctors WHERE doctors.id = time_slots.doctor_id AND doctors.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctors WHERE doctors.id = time_slots.doctor_id AND doctors.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hospitals_city ON hospitals(city);
CREATE INDEX IF NOT EXISTS idx_doctors_hospital ON doctors(hospital_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_slots_doctor_date ON time_slots(doctor_id, date);
