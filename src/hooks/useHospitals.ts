import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  review_count: number | null;
  specialties: string[] | null;
  departments: { id: string; name: string; description: string }[] | null;
  images: string[] | null;
  is_open: boolean | null;
  open_hours: string | null;
  emergency_available: boolean | null;
  about: string | null;
  facilities: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useHospitals(hospitalId?: string) {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('hospitals').select('*');
      if (hospitalId) query = query.eq('id', hospitalId);
      const { data, error: supaError } = await query.order('rating', { ascending: false });

      if (supaError) throw supaError;
      const mapped = (data || []).map((h: any) => ({
        ...h,
        departments: h.departments as Hospital['departments'],
      }));
      setHospitals(mapped);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch hospitals');
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  const createHospital = useCallback(async (hospital: Omit<Hospital, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const insertData = {
        name: hospital.name,
        address: hospital.address,
        city: hospital.city || 'Visakhapatnam',
        phone: hospital.phone,
        email: hospital.email,
        website: hospital.website,
        latitude: hospital.latitude,
        longitude: hospital.longitude,
        rating: hospital.rating || 0,
        review_count: hospital.review_count || 0,
        specialties: hospital.specialties || [],
        departments: hospital.departments || [],
        images: hospital.images || [],
        is_open: hospital.is_open ?? true,
        open_hours: hospital.open_hours || 'Mon-Sat: 9AM-9PM',
        emergency_available: hospital.emergency_available ?? false,
        about: hospital.about,
        facilities: hospital.facilities || [],
      };

      const { data, error: supaError } = await supabase
        .from('hospitals')
        .insert(insertData as any)
        .select()
        .single();

      if (supaError) throw supaError;
      const mapped = { ...(data as any), departments: (data as any).departments as Hospital['departments'] };
      setHospitals(prev => [...prev, mapped]);
      return mapped;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create hospital');
    }
  }, []);

  const updateHospital = useCallback(async (id: string, updates: Partial<Hospital>) => {
    try {
      const { data, error: supaError } = await supabase
        .from('hospitals')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (supaError) throw supaError;
      const mapped = { ...(data as any), departments: (data as any).departments as Hospital['departments'] };
      setHospitals(prev => prev.map(h => h.id === id ? mapped : h));
      return mapped;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update hospital');
    }
  }, []);

  const deleteHospital = useCallback(async (id: string) => {
    try {
      const { error: supaError } = await supabase
        .from('hospitals')
        .delete()
        .eq('id', id);

      if (supaError) throw supaError;
      setHospitals(prev => prev.filter(h => h.id !== id));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete hospital');
    }
  }, []);

  return {
    hospitals,
    loading,
    error,
    fetchHospitals,
    createHospital,
    updateHospital,
    deleteHospital,
  };
}
