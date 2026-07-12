/*
# Add hashed OTP storage column to verification_otps

## Purpose
Move OTP storage from plaintext to a SHA-256 hashed value so that even if the
verification_otps table is exposed, the actual OTP codes cannot be recovered.
This is the first step of a backend-only OTP delivery flow (SMTP via a Supabase
Edge Function).

## Changes
1. New column on `verification_otps`:
   - `otp_hash` (text, nullable) — SHA-256 hex digest of the 6-digit OTP.
     The legacy `otp` column stays in place for backward compatibility of any
     rows created before this change; the new edge function populates ONLY
     `otp_hash` and leaves `otp` null.
2. Indexes:
   - Composite index on (email, purpose, is_used) to speed up verification
     lookups which were already used in client code.
3. TTL cleanup helper:
   - Non-transactional marker note: expired rows are invalidated lazily by the
     edge function (UPDATE is_used = true WHERE expires_at < now() AND is_used
     = false). No scheduled job is added here on purpose.

## Security
- Existing RLS policies on verification_otps remain unchanged (the table is
  already accessible to anon/authenticated for the OTP flow). No new policies
  are needed because the row is inserted server-side by the edge function using
  the service role key and read/updated by the frontend anon key as before.
- No destructive column/type changes. The existing `otp` text column is kept;
  we do NOT drop it. Per data-safety rules, only additive, non-destructive DDL.
*/

ALTER TABLE verification_otps
  ADD COLUMN IF NOT EXISTS otp_hash text;

-- Composite index to speed up the common verification lookup:
-- SELECT ... WHERE email = ? AND purpose = ? AND is_used = false
CREATE INDEX IF NOT EXISTS verification_otps_email_purpose_unused_idx
  ON verification_otps (email, purpose, is_used);
