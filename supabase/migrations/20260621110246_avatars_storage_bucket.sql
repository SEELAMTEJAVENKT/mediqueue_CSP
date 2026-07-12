INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars');
CREATE POLICY "avatars_authenticated_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "avatars_authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');
