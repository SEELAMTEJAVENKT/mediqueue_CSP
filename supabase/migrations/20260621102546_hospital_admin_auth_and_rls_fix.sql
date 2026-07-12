-- 1. Add created_by column to hospitals
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Create profiles table for Supabase Auth users
CREATE TABLE IF NOT EXISTS profiles (
  id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role      text NOT NULL DEFAULT 'patient',
  name      text,
  phone     text,
  hospital_id uuid REFERENCES hospitals(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 3. Drop old open hospitals RLS policies and replace with created_by-scoped ones
DROP POLICY IF EXISTS "hospitals_authenticated_insert" ON hospitals;
DROP POLICY IF EXISTS "hospitals_authenticated_update" ON hospitals;
DROP POLICY IF EXISTS "hospitals_authenticated_delete" ON hospitals;
DROP POLICY IF EXISTS "hospitals_public_select" ON hospitals;

-- Public SELECT (patients, doctors need to browse hospitals)
CREATE POLICY "hospitals_public_select" ON hospitals
  FOR SELECT TO anon, authenticated USING (true);

-- Only the creator can insert
CREATE POLICY "Authenticated users can create hospitals" ON hospitals
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Only the creator can update
CREATE POLICY "Users can update their hospital" ON hospitals
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Only the creator can delete
CREATE POLICY "Users can delete their hospital" ON hospitals
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- 4. hospital_admins: also allow authenticated inserts (needed post-signUp)
DROP POLICY IF EXISTS "ha_insert" ON hospital_admins;
CREATE POLICY "ha_insert" ON hospital_admins
  FOR INSERT TO authenticated WITH CHECK (true);
