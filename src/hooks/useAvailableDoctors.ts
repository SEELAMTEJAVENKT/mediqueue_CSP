import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Doctor } from './useDoctors';

export interface AvailableDoctor extends Doctor {
  hospital_name: string | null;
  available_slot_count: number;
}

/**
 * Returns only doctors that satisfy ALL of:
 *  - approval_status IN ('APPROVED','ACTIVE')
 *  - status = 'active'
 *  - hospital.status = 'ACTIVE'
 *  - has at least one time_slots row where status = 'AVAILABLE'
 *
 * Real-time: refreshes automatically when doctors, hospitals, or time_slots change
 * (doctor approved, doctor deactivated, slots created, slots booked, hospital inactivated).
 */
export function useAvailableDoctors() {
  const [doctors, setDoctors] = useState<AvailableDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supaError } = await supabase
        .from('doctors')
        .select(`
          *,
          hospitals ( id, name, status ),
          time_slots ( id, status, is_booked, is_locked )
        `)
        .in('approval_status', ['APPROVED', 'ACTIVE'])
        .eq('status', 'active');

      if (supaError) throw supaError;

      const isAvailable = (s: any) =>
        s.status === 'AVAILABLE' || (!s.status && !s.is_booked && !s.is_locked);

      const filtered: AvailableDoctor[] = (data || [])
        .filter((d: any) => {
          if (!d.hospitals || d.hospitals.status !== 'ACTIVE') return false;
          return (d.time_slots || []).some(isAvailable);
        })
        .map((d: any) => {
          const { hospitals, time_slots, ...doctorFields } = d;
          const available_slot_count = (time_slots || []).filter(isAvailable).length;
          return {
            ...doctorFields,
            hospital_name: hospitals?.name ?? null,
            available_slot_count,
          } as AvailableDoctor;
        });

      setDoctors(filtered);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();

    const channel = supabase
      .channel('available-doctors-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, () => fetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hospitals' }, () => fetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_slots' }, () => fetch())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetch]);

  return { doctors, loading, error, refetch: fetch };
}
