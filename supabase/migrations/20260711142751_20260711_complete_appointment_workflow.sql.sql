-- Add rejection_reason column to appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Update book_appointment_slot RPC to write audit log and notifications
CREATE OR REPLACE FUNCTION public.book_appointment_slot(
  p_slot_id uuid,
  p_patient_id text,
  p_patient_name text,
  p_patient_phone text,
  p_symptoms text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_slot time_slots%ROWTYPE;
  v_appt_id uuid;
  v_doctor_id uuid;
  v_hospital_id uuid;
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
    v_slot.doctor_id, v_slot.hospital_id, v_slot.id::text, v_slot.date,
    v_slot.start_time, v_slot.end_time,
    'pending', p_symptoms, p_patient_id, p_patient_name, p_patient_phone
  )
  RETURNING id, doctor_id, hospital_id INTO v_appt_id, v_doctor_id, v_hospital_id;

  -- Write audit log
  INSERT INTO appointment_audit_logs (appointment_id, old_status, new_status, changed_by, notes)
  VALUES (v_appt_id, NULL, 'pending', p_patient_id, 'Appointment booked');

  -- Notify doctor
  INSERT INTO notifications (user_id, hospital_id, title, message, type, appointment_id)
  SELECT m.demo_user_id, v_hospital_id, 'New Appointment Request',
    'Appointment booked by ' || p_patient_name || ' for ' || v_slot.date || ' at ' || v_slot.start_time || '.',
    'appointment', v_appt_id
  FROM doctor_user_map m
  WHERE m.doctor_id = v_doctor_id;

  -- Notify hospital admins
  INSERT INTO notifications (user_id, hospital_id, title, message, type, appointment_id)
  SELECT m.admin_user_id, v_hospital_id, 'New Appointment Created',
    'New appointment for ' || v_slot.date || ' at ' || v_slot.start_time || '.',
    'system', v_appt_id
  FROM admin_hospital_map m
  WHERE m.hospital_id = v_hospital_id;

  -- Notify patient
  INSERT INTO notifications (user_id, hospital_id, title, message, type, appointment_id)
  VALUES (p_patient_id, v_hospital_id, 'Appointment Booked',
    'Your appointment for ' || v_slot.date || ' at ' || v_slot.start_time || ' is pending doctor approval.',
    'appointment', v_appt_id);

  RETURN v_appt_id;
END;
$function$;

-- Function to reject appointment with reason
CREATE OR REPLACE FUNCTION public.reject_appointment(
  p_appointment_id uuid,
  p_rejection_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_appt appointments%ROWTYPE;
BEGIN
  SELECT * INTO v_appt FROM appointments WHERE id = p_appointment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  -- Update appointment status
  UPDATE appointments
  SET status = 'rejected',
      rejection_reason = p_rejection_reason,
      updated_at = now()
  WHERE id = p_appointment_id;

  -- Release the slot
  IF v_appt.slot_id IS NOT NULL THEN
    UPDATE time_slots
    SET status = 'AVAILABLE', is_booked = false, is_locked = false
    WHERE id = v_appt.slot_id::uuid;
  END IF;

  -- Write audit log
  INSERT INTO appointment_audit_logs (appointment_id, old_status, new_status, changed_by, notes)
  VALUES (p_appointment_id, v_appt.status, 'rejected', v_appt.doctor_id, p_rejection_reason);

  -- Notify patient
  INSERT INTO notifications (user_id, hospital_id, title, message, type, appointment_id)
  VALUES (v_appt.patient_id, v_appt.hospital_id, 'Appointment Rejected',
    'Your appointment has been rejected. Reason: ' || p_rejection_reason,
    'appointment', p_appointment_id);
END;
$function$;

-- Function to approve appointment
CREATE OR REPLACE FUNCTION public.approve_appointment(
  p_appointment_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_appt appointments%ROWTYPE;
BEGIN
  SELECT * INTO v_appt FROM appointments WHERE id = p_appointment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  -- Update appointment status to confirmed
  UPDATE appointments
  SET status = 'confirmed',
      updated_at = now()
  WHERE id = p_appointment_id;

  -- Write audit log
  INSERT INTO appointment_audit_logs (appointment_id, old_status, new_status, changed_by, notes)
  VALUES (p_appointment_id, v_appt.status, 'confirmed', v_appt.doctor_id, 'Approved by doctor');

  -- Notify patient
  INSERT INTO notifications (user_id, hospital_id, title, message, type, appointment_id)
  VALUES (v_appt.patient_id, v_appt.hospital_id, 'Appointment Confirmed',
    'Your appointment on ' || v_appt.date || ' at ' || v_appt.start_time || ' has been confirmed by the doctor.',
    'appointment', p_appointment_id);
END;
$function$;

-- Function to transition appointment status with auto-calculated timing fields
CREATE OR REPLACE FUNCTION public.transition_appointment_status(
  p_appointment_id uuid,
  p_new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_appt appointments%ROWTYPE;
  v_queue_count integer;
BEGIN
  SELECT * INTO v_appt FROM appointments WHERE id = p_appointment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  -- Update status and timing fields
  IF p_new_status = 'arrived' OR p_new_status = 'in_queue' THEN
    UPDATE appointments
    SET status = p_new_status,
        arrival_time = now(),
        updated_at = now()
    WHERE id = p_appointment_id;

    -- Assign queue position if not set
    IF v_appt.queue_position IS NULL THEN
      SELECT count(*) INTO v_queue_count
      FROM appointments
      WHERE doctor_id = v_appt.doctor_id
        AND date = v_appt.date
        AND queue_position IS NOT NULL;

      UPDATE appointments
      SET queue_position = v_queue_count + 1
      WHERE id = p_appointment_id;
    END IF;

  ELSIF p_new_status = 'in_progress' THEN
    UPDATE appointments
    SET status = 'in_progress',
        consultation_start = now(),
        updated_at = now()
    WHERE id = p_appointment_id;

  ELSIF p_new_status = 'completed' THEN
    UPDATE appointments
    SET status = 'completed',
        consultation_end = now(),
        consultation_duration_minutes = CASE
          WHEN v_appt.consultation_start IS NOT NULL THEN
            EXTRACT(EPOCH FROM (now() - v_appt.consultation_start))::integer / 60
          ELSE NULL
        END,
        waiting_time_minutes = CASE
          WHEN v_appt.arrival_time IS NOT NULL AND v_appt.consultation_start IS NOT NULL THEN
            EXTRACT(EPOCH FROM (v_appt.consultation_start - v_appt.arrival_time))::integer / 60
          ELSE NULL
        END,
        updated_at = now()
    WHERE id = p_appointment_id;

  ELSIF p_new_status IN ('cancelled', 'no_show', 'rescheduled') THEN
    UPDATE appointments
    SET status = p_new_status,
        updated_at = now()
    WHERE id = p_appointment_id;

    -- Release the slot
    IF v_appt.slot_id IS NOT NULL THEN
      UPDATE time_slots
      SET status = 'AVAILABLE', is_booked = false, is_locked = false
      WHERE id = v_appt.slot_id::uuid;
    END IF;

  ELSE
    UPDATE appointments
    SET status = p_new_status,
        updated_at = now()
    WHERE id = p_appointment_id;
  END IF;

  -- Write audit log
  INSERT INTO appointment_audit_logs (appointment_id, old_status, new_status, changed_by, notes)
  VALUES (p_appointment_id, v_appt.status, p_new_status, v_appt.doctor_id, 'Status transition: ' || v_appt.status || ' -> ' || p_new_status);

  -- Notify patient
  INSERT INTO notifications (user_id, hospital_id, title, message, type, appointment_id)
  VALUES (v_appt.patient_id, v_appt.hospital_id,
    'Appointment ' || p_new_status,
    CASE p_new_status
      WHEN 'arrived' THEN 'You have been marked as arrived.'
      WHEN 'in_queue' THEN 'You are now in the queue.'
      WHEN 'in_progress' THEN 'Your consultation has started.'
      WHEN 'completed' THEN 'Your consultation has been completed.'
      WHEN 'cancelled' THEN 'Your appointment has been cancelled.'
      WHEN 'no_show' THEN 'Your appointment has been marked as no-show.'
      ELSE 'Your appointment status is now: ' || p_new_status
    END,
    'appointment', p_appointment_id);
END;
$function$;

-- Grant execute on new functions
GRANT EXECUTE ON FUNCTION public.reject_appointment(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_appointment(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transition_appointment_status(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_appointment_slot(uuid, text, text, text, text) TO anon, authenticated;
