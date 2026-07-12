import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ApprovalRequest {
  id: string;
  doctor_id: string;
  hospital_id: string;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  rejection_reason: string | null;
  created_at: string;
  // joined from doctors
  doctor_name: string;
  doctor_email: string;
  doctor_id_code: string | null;
  specialist_type: string;
  department: string | null;
  qualification: string | null;
  experience: number | null;
  medical_license_number: string | null;
  mobile_number: string | null;
}

export function useApprovalRequests(hospitalId?: string) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from('doctor_approval_requests')
        .select(`
          id, doctor_id, hospital_id, requested_at, reviewed_by, reviewed_at,
          status, rejection_reason, created_at,
          doctors (
            name, email, doctor_id_code, specialization, department,
            qualification, experience, medical_license_number, mobile_number
          )
        `)
        .order('requested_at', { ascending: false });

      if (hospitalId) q = q.eq('hospital_id', hospitalId);

      const { data, error: err } = await q;
      if (err) throw err;

      const mapped: ApprovalRequest[] = (data || []).map((r: any) => ({
        id: r.id,
        doctor_id: r.doctor_id,
        hospital_id: r.hospital_id,
        requested_at: r.requested_at,
        reviewed_by: r.reviewed_by,
        reviewed_at: r.reviewed_at,
        status: r.status,
        rejection_reason: r.rejection_reason,
        created_at: r.created_at,
        doctor_name: r.doctors?.name || '—',
        doctor_email: r.doctors?.email || '—',
        doctor_id_code: r.doctors?.doctor_id_code || null,
        specialist_type: r.doctors?.specialization || '—',
        department: r.doctors?.department || null,
        qualification: r.doctors?.qualification || null,
        experience: r.doctors?.experience ?? null,
        medical_license_number: r.doctors?.medical_license_number || null,
        mobile_number: r.doctors?.mobile_number || null,
      }));

      setRequests(mapped);
    } catch (e: any) {
      setError(e.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => { fetch(); }, [fetch]);

  const approve = useCallback(async (requestId: string, reviewedBy: string, doctorId: string) => {
    const { error: e1 } = await supabase
      .from('doctor_approval_requests')
      .update({ status: 'APPROVED', reviewed_by: reviewedBy, reviewed_at: new Date().toISOString() })
      .eq('id', requestId);
    if (e1) throw e1;

    const { error: e2 } = await supabase
      .from('doctors')
      .update({ approval_status: 'APPROVED', approved_by: reviewedBy, approved_at: new Date().toISOString(), status: 'active' })
      .eq('id', doctorId);
    if (e2) throw e2;

    // Notify doctor
    await supabase.from('notifications').insert({
      user_id: doctorId,
      title: 'Registration Approved',
      message: 'Your registration has been approved. You can now access your dashboard.',
      type: 'system',
      is_read: false,
    });

    await fetch();
  }, [fetch]);

  const reject = useCallback(async (requestId: string, reviewedBy: string, doctorId: string, reason: string) => {
    const { error: e1 } = await supabase
      .from('doctor_approval_requests')
      .update({ status: 'REJECTED', reviewed_by: reviewedBy, reviewed_at: new Date().toISOString(), rejection_reason: reason })
      .eq('id', requestId);
    if (e1) throw e1;

    const { error: e2 } = await supabase
      .from('doctors')
      .update({ approval_status: 'REJECTED', rejection_reason: reason })
      .eq('id', doctorId);
    if (e2) throw e2;

    // Notify doctor
    await supabase.from('notifications').insert({
      user_id: doctorId,
      title: 'Registration Rejected',
      message: 'Your registration request was rejected. Please contact the hospital administrator.',
      type: 'system',
      is_read: false,
    });

    await fetch();
  }, [fetch]);

  return { requests, loading, error, refetch: fetch, approve, reject };
}
