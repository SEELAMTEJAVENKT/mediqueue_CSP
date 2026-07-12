-- Add status column to time_slots matching the slot lifecycle spec
ALTER TABLE time_slots ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'AVAILABLE';

-- Backfill status from is_booked / is_locked for any pre-existing rows
UPDATE time_slots
SET status = CASE
  WHEN is_booked THEN 'BOOKED'
  WHEN is_locked THEN 'RESCHEDULED'
  ELSE 'AVAILABLE'
END;

-- Atomic booking RPC: locks the slot row and prevents duplicate bookings
-- Returns the booked appointment's slot id on success, or NULL if already taken.
CREATE OR REPLACE FUNCTION book_appointment_slot(
  p_slot_id uuid,
  p_patient_id text,
  p_patient_name text,
  p_patient_phone text,
  p_symptoms text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_slot time_slots%ROWTYPE;
  v_appt_id uuid;
BEGIN
  -- Lock the slot row for the duration of the transaction
  SELECT * INTO v_slot
  FROM time_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot not found';
  END IF;

  IF v_slot.status <> 'AVAILABLE' OR v_slot.is_booked OR v_slot.is_locked THEN
    RAISE EXCEPTION 'Slot Already Allocated';
  END IF;

  -- Mark slot as booked/locked atomically
  UPDATE time_slots
  SET status = 'BOOKED', is_booked = true, is_locked = true
  WHERE id = p_slot_id;

  -- Create the appointment row
  INSERT INTO appointments (
    doctor_id, hospital_id, slot_id, date, start_time, end_time,
    status, symptoms, patient_id, patient_name, patient_phone
  )
  VALUES (
    v_slot.doctor_id, v_slot.hospital_id, v_slot.id, v_slot.date,
    v_slot.start_time, v_slot.end_time,
    'pending', p_symptoms, p_patient_id, p_patient_name, p_patient_phone
  )
  RETURNING id INTO v_appt_id;

  RETURN v_appt_id;
END;
$$;
