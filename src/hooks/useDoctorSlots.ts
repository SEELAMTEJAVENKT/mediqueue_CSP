import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface TimeSlot {
  id: string;
  doctor_id: string | null;
  hospital_id?: string | null;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean | null;
  is_locked: boolean | null;
  status: string;
  created_at: string | null;
}

export function useDoctorSlots(doctorId?: string) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    if (!doctorId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error: supaError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (supaError) throw supaError;
      setSlots((data as TimeSlot[]) || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch slots');
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const createSlot = useCallback(async (slot: Omit<TimeSlot, 'id' | 'created_at'>) => {
    try {
      const { data, error: supaError } = await supabase
        .from('time_slots')
        .insert(slot as any)
        .select()
        .single();

      if (supaError) throw supaError;
      setSlots(prev => [...prev, data as TimeSlot].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.start_time.localeCompare(b.start_time);
      }));
      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create slot');
    }
  }, []);

  const updateSlot = useCallback(async (id: string, updates: Partial<TimeSlot>) => {
    try {
      const { data, error: supaError } = await supabase
        .from('time_slots')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (supaError) throw supaError;
      setSlots(prev => prev.map(s => s.id === id ? { ...s, ...(data as TimeSlot) } : s));
      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update slot');
    }
  }, []);

  const deleteSlot = useCallback(async (id: string) => {
    try {
      const { error: supaError } = await supabase
        .from('time_slots')
        .delete()
        .eq('id', id);

      if (supaError) throw supaError;
      setSlots(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete slot');
    }
  }, []);

  const generateSlots = useCallback(async (doctorId: string, dates: string[], timeRanges: { start: string; end: string }[], duration: number = 30) => {
    try {
      const newSlots: Omit<TimeSlot, 'id' | 'created_at'>[] = [];

      for (const date of dates) {
        for (const range of timeRanges) {
          const [startHour, startMin] = range.start.split(':').map(Number);
          const [endHour, endMin] = range.end.split(':').map(Number);
          const startMins = startHour * 60 + startMin;
          const endMins = endHour * 60 + endMin;

          for (let current = startMins; current + duration <= endMins; current += duration) {
            const slotStart = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
            const slotEndMins = current + duration;
            const slotEnd = `${String(Math.floor(slotEndMins / 60)).padStart(2, '0')}:${String(slotEndMins % 60).padStart(2, '0')}`;

            // Check if slot already exists
            const exists = slots.some(s => s.date === date && s.start_time === slotStart && s.doctor_id === doctorId);
            if (!exists) {
              newSlots.push({
                doctor_id: doctorId,
                date,
                start_time: slotStart,
                end_time: slotEnd,
                is_booked: false,
                is_locked: false,
                status: 'AVAILABLE',
              });
            }
          }
        }
      }

      if (newSlots.length === 0) {
        return { created: 0, message: 'All slots already exist for selected dates' };
      }

      const { data, error: supaError } = await supabase
        .from('time_slots')
        .insert(newSlots as any)
        .select();

      if (supaError) throw supaError;
      setSlots(prev => [...prev, ...(data as TimeSlot[])].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.start_time.localeCompare(b.start_time);
      }));
      return { created: (data as TimeSlot[]).length, message: `${(data as TimeSlot[]).length} slots created` };
    } catch (err: any) {
      throw new Error(err.message || 'Failed to generate slots');
    }
  }, [slots]);

  const toggleSlotStatus = useCallback(async (id: string, field: 'is_booked' | 'is_locked') => {
    const slot = slots.find(s => s.id === id);
    if (!slot) return;
    const currentValue = slot[field];
    await updateSlot(id, { [field]: !currentValue } as Partial<TimeSlot>);
  }, [slots, updateSlot]);

  // Delete all slots for this doctor EXCEPT ones already locked to an appointment
  const deleteAllSlots = useCallback(async () => {
    try {
      const { error: supaError } = await supabase
        .from('time_slots')
        .delete()
        .eq('doctor_id', doctorId || '')
        .eq('is_booked', false);
      if (supaError) throw supaError;
      setSlots(prev => prev.filter(s => s.is_booked));
      return { deleted: true };
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete all slots');
    }
  }, [doctorId]);

  return {
    slots,
    loading,
    error,
    fetchSlots,
    createSlot,
    updateSlot,
    deleteSlot,
    generateSlots,
    toggleSlotStatus,
    deleteAllSlots,
  };
}
