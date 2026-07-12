import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface HospitalDeptInfo {
  hospital_id: string;
  department_count: number;
  departments: { name: string; specialist_count: number }[];
}

/**
 * Returns per-hospital department summary, counting only approved/active doctors.
 *   department_count = COUNT(DISTINCT doctor.department)
 *   departments[] = per department: name + count of doctors in that department
 */
export function useHospitalDepartments(hospitalIds: string[] = []) {
  const [info, setInfo] = useState<Record<string, HospitalDeptInfo>>({});
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (hospitalIds.length === 0) {
      setInfo({});
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('hospital_id, department')
        .in('hospital_id', hospitalIds)
        .in('approval_status', ['APPROVED', 'ACTIVE'])
        .eq('status', 'active');

      if (error) throw error;

      const byHospital: Record<string, HospitalDeptInfo> = {};
      (data || []).forEach((row: any) => {
        const hid = row.hospital_id;
        if (!hid) return;
        if (!byHospital[hid]) byHospital[hid] = { hospital_id: hid, department_count: 0, departments: [] };
        const info = byHospital[hid];
        const deptName = (row.department || 'General').trim();
        let dept = info.departments.find(d => d.name === deptName);
        if (!dept) {
          dept = { name: deptName, specialist_count: 0 };
          info.departments.push(dept);
          info.department_count = info.departments.length;
        }
        dept.specialist_count++;
      });
      setInfo(byHospital);
    } catch {
      setInfo({});
    } finally {
      setLoading(false);
    }
  }, [hospitalIds.join(',')]);

  useEffect(() => {
    fetch();

    // Real-time: department counts update when a doctor is approved,
    // department changes, or a doctor is deactivated.
    const channel = supabase
      .channel('hospital-departments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, () => fetch())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetch]);

  return { info, loading, refetch: fetch };
}
