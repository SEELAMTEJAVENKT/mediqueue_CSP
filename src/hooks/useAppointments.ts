import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface Appointment {
  id: string;
  patient_id: string | null;
  doctor_id: string | null;
  hospital_id: string | null;
  department_id: string | null;
  slot_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  status: string | null;
  symptoms: string | null;
  notes: string | null;
  prescription_id: string | null;
  report_ids: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  rejection_reason?: string | null;

  // Lifecycle tracking fields
  arrival_time?: string | null;
  consultation_start?: string | null;
  consultation_end?: string | null;
  waiting_time_minutes?: number | null;
  consultation_duration_minutes?: number | null;
  queue_position?: number | null;
  patient_name?: string | null;
  patient_phone?: string | null;
}

export function useAppointments(filter?: { hospitalId?: string; doctorId?: string; patientId?: string; date?: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchAppointments = useCallback(async () => {
    if (!hasFetchedRef.current) setLoading(true);
    setError(null);
    try {
      let query = supabase.from('appointments').select('*');
      if (filter?.hospitalId) query = query.eq('hospital_id', filter.hospitalId);
      if (filter?.doctorId) query = query.eq('doctor_id', filter.doctorId);
      if (filter?.patientId) query = query.eq('patient_id', filter.patientId);
      if (filter?.date) query = query.eq('date', filter.date);
      const { data, error: supaError } = await query.order('created_at', { ascending: false });

      if (supaError) throw supaError;
      setAppointments((data as Appointment[]) || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch appointments');
    } finally {
      hasFetchedRef.current = true;
      setLoading(false);
    }
  }, [filter?.hospitalId, filter?.doctorId, filter?.patientId, filter?.date]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Real-time polling every 5 seconds
  const lastFetchRef = useRef(0);
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastFetchRef.current >= 4000) {
        lastFetchRef.current = now;
        fetchAppointments();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchAppointments]);

  const createAppointment = useCallback(async (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: supaError } = await supabase
        .from('appointments')
        .insert(appointment as any)
        .select()
        .single();

      if (supaError) throw supaError;
      setAppointments(prev => [data as Appointment, ...prev]);

      // Also lock the corresponding time slot
      if (appointment.slot_id) {
        await supabase
          .from('time_slots')
          .update({ is_booked: true, is_locked: true } as any)
          .eq('id', appointment.slot_id);
      }

      // Write audit log
      await supabase.from('appointment_audit_logs').insert({
        appointment_id: (data as Appointment).id,
        old_status: null,
        new_status: appointment.status || 'pending',
        changed_by: appointment.patient_id,
        notes: 'Appointment booked',
      } as any);

      // Notify doctor + admin
      const hospitalId = appointment.hospital_id;
      if (appointment.doctor_id) {
        const { data: doc } = await supabase
          .from('doctor_user_map')
          .select('demo_user_id')
          .eq('doctor_id', appointment.doctor_id)
          .maybeSingle();
        if (doc?.demo_user_id) {
          await supabase.from('notifications').insert({
            user_id: doc.demo_user_id,
            hospital_id: hospitalId as any,
            title: 'New Appointment',
            message: `Appointment booked for ${appointment.date} at ${appointment.start_time}.`,
            type: 'appointment',
            appointment_id: (data as Appointment).id,
          } as any);
        }
      }
      if (hospitalId) {
        const { data: admins } = await supabase
          .from('admin_hospital_map')
          .select('admin_user_id')
          .eq('hospital_id', hospitalId);
        if (admins && admins.length > 0) {
          const notifs = admins.map(a => ({
            user_id: a.admin_user_id,
            hospital_id: hospitalId as any,
            title: 'New Appointment Created',
            message: `Appointment booked for ${appointment.date} at ${appointment.start_time}.`,
            type: 'system',
            appointment_id: (data as Appointment).id,
          }));
          await supabase.from('notifications').insert(notifs as any);
        }
      }
      if (appointment.patient_id) {
        await supabase.from('notifications').insert({
          user_id: appointment.patient_id,
          hospital_id: hospitalId as any,
          title: 'Appointment Confirmed',
          message: `Your appointment on ${appointment.date} at ${appointment.start_time} is confirmed.`,
          type: 'appointment',
          appointment_id: (data as Appointment).id,
        } as any);
      }

      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create appointment');
    }
  }, []);

  /**
   * Status transition with audit log + side effects:
   * - arrive -> queue_position assigned, lock slot
   * - start -> consultation_start set
   * - complete -> consultation_end, waiting_time, duration computed
   * - cancel -> slot released
   */
  const transitionAppointment = useCallback(async (id: string, newStatus: string) => {
    const prev = appointments;
    setAppointments(p => p.map(a => a.id === id ? { ...a, status: newStatus, updated_at: new Date().toISOString() } : a));
    try {
      const { error } = await supabase.rpc('transition_appointment_status', {
        p_appointment_id: id,
        p_new_status: newStatus,
      });
      if (error) throw error;
      await fetchAppointments();
    } catch (err: any) {
      setAppointments(prev);
      throw new Error(err.message || 'Failed to update appointment status');
    }
  }, [appointments, fetchAppointments]);

  // Backward-compatible wrapper
  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
    try {
      const { data, error: supaError } = await supabase
        .from('appointments')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (supaError) throw supaError;
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...(data as Appointment) } : a));
      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update appointment');
    }
  }, []);

  const approveAppointment = useCallback(async (id: string) => {
    const prev = appointments;
    setAppointments(p => p.map(a => a.id === id ? { ...a, status: 'confirmed', updated_at: new Date().toISOString() } : a));
    try {
      const { error } = await supabase.rpc('approve_appointment', { p_appointment_id: id });
      if (error) throw error;
      await fetchAppointments();
    } catch (err: any) {
      setAppointments(prev);
      throw new Error(err.message || 'Failed to approve appointment');
    }
  }, [appointments, fetchAppointments]);

  const rejectAppointment = useCallback(async (id: string, reason: string) => {
    const prev = appointments;
    setAppointments(p => p.map(a => a.id === id ? { ...a, status: 'rejected', rejection_reason: reason, updated_at: new Date().toISOString() } : a));
    try {
      const { error } = await supabase.rpc('reject_appointment', {
        p_appointment_id: id,
        p_rejection_reason: reason,
      });
      if (error) throw error;
      await fetchAppointments();
    } catch (err: any) {
      setAppointments(prev);
      throw new Error(err.message || 'Failed to reject appointment');
    }
  }, [appointments, fetchAppointments]);

  return { appointments, loading, error, fetchAppointments, createAppointment, transitionAppointment, updateAppointment, approveAppointment, rejectAppointment };
}
