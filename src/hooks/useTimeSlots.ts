import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface TimeSlot {
  id: string;
  doctor_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean | null;
  is_locked: boolean | null;
  status: string;
}

export function useTimeSlots(doctorId?: string, date?: string) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    if (!doctorId || !date) { setSlots([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      // Fetch only AVAILABLE slots for patients — hide BOOKED, CANCELLED, COMPLETED, NO_SHOW
      const { data, error: supaError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('date', date)
        .eq('status', 'AVAILABLE')
        .order('start_time', { ascending: true });

      if (supaError) throw supaError;
      setSlots((data as TimeSlot[]) || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch slots');
    } finally {
      setLoading(false);
    }
  }, [doctorId, date]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const bookSlot = useCallback(async (slotId: string) => {
    try {
      const { error: supaError } = await supabase
        .from('time_slots')
        .update({ is_booked: true, is_locked: true, status: 'BOOKED' } as any)
        .eq('id', slotId)
        .or('status.eq.AVAILABLE,status.is.null');

      if (supaError) throw supaError;
      setSlots(prev => prev.map(s => s.id === slotId ? { ...s, is_booked: true, is_locked: true, status: 'BOOKED' } : s));
    } catch (err: any) {
      throw new Error(err.message || 'Slot Already Allocated');
    }
  }, []);

  return { slots, loading, error, fetchSlots, bookSlot };
}
