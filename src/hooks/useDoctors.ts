import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Doctor {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  specialization: string;
  qualification: string | null;
  department: string | null;
  experience: number | null;
  hospital_id: string | null;
  languages: string[] | null;
  consultation_fee: number | null;
  consultation_duration_minutes: number | null;
  rating: number | null;
  review_count: number | null;
  about: string | null;
  is_verified: boolean | null;
  status: string | null;
  approval_status: string | null;
  created_at: string | null;
}

export function useDoctors(hospitalId?: string, approvedOnly = false) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('doctors').select('*');
      if (hospitalId) query = query.eq('hospital_id', hospitalId);
      if (approvedOnly) {
        query = query.in('approval_status', ['APPROVED', 'ACTIVE']).eq('status', 'active');
      }
      const { data, error: supaError } = await query.order('rating', { ascending: false });
      if (supaError) throw supaError;
      setDoctors((data as Doctor[]) || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  }, [hospitalId, approvedOnly]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const createDoctor = useCallback(async (doctor: Partial<Doctor>) => {
    const { data, error: supaError } = await supabase
      .from('doctors').insert(doctor as any).select().single();
    if (supaError) throw new Error(supaError.message);
    setDoctors(prev => [...prev, data as Doctor]);
    return data;
  }, []);

  const updateDoctor = useCallback(async (id: string, updates: Partial<Doctor>) => {
    const { data, error: supaError } = await supabase
      .from('doctors').update(updates as any).eq('id', id).select().single();
    if (supaError) throw new Error(supaError.message);
    setDoctors(prev => prev.map(d => d.id === id ? { ...d, ...(data as Doctor) } : d));
    return data;
  }, []);

  const deleteDoctor = useCallback(async (id: string) => {
    const { error: supaError } = await supabase.from('doctors').delete().eq('id', id);
    if (supaError) throw new Error(supaError.message);
    setDoctors(prev => prev.filter(d => d.id !== id));
  }, []);

  return { doctors, loading, error, fetchDoctors, createDoctor, updateDoctor, deleteDoctor };
}

// Fetch doctors by a specific hospital ID (can be called dynamically)
export function useDoctorsByHospital(hospitalId: string | null) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hospitalId) {
      setDoctors([]);
      return;
    }

    const fetchDoctors = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: supaError } = await supabase
          .from('doctors')
          .select('*')
          .eq('hospital_id', hospitalId)
          .in('approval_status', ['APPROVED', 'ACTIVE'])
          .eq('status', 'active')
          .order('rating', { ascending: false });

        if (supaError) throw supaError;
        setDoctors((data as Doctor[]) || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch doctors');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [hospitalId]);

  return { doctors, loading, error };
}

export function useDoctor(id?: string) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctor = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error: supaError } = await supabase
        .from('doctors').select('*').eq('id', id).single();
      if (supaError) throw supaError;
      setDoctor(data as Doctor);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch doctor');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDoctor(); }, [fetchDoctor]);

  return { doctor, loading, error, fetchDoctor };
}
