import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User & { hospitalId?: string; doctorId?: string };
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  validatePhoneNumber: (phone: string) => { valid: boolean; formatted: string; error?: string };
  checkPhoneDuplicate: (phone: string, role: UserRole) => Promise<boolean>;
}

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function loadHospitalForUser(userId: string, role: UserRole): Promise<{ hospitalId?: string; doctorId?: string }> {
  try {
    if (role === 'admin') {
      const { data } = await supabase.from('admin_hospital_map').select('hospital_id').eq('admin_user_id', userId).maybeSingle();
      return { hospitalId: data?.hospital_id };
    }
    if (role === 'doctor') {
      const { data } = await supabase.from('doctor_user_map').select('doctor_id, hospital_id').eq('demo_user_id', userId).maybeSingle();
      return { hospitalId: data?.hospital_id, doctorId: data?.doctor_id };
    }
    if (role === 'patient') {
      const { data } = await supabase.from('hospitals').select('id').eq('name', 'Apollo Hospitals Vizag').maybeSingle();
      return { hospitalId: data?.id };
    }
  } catch { /* non-fatal */ }
  return {};
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(User & { hospitalId?: string; doctorId?: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = localStorage.getItem('healthcare-user');
      if (!saved) { if (!cancelled) setIsLoading(false); return; }
      try {
        const parsed = JSON.parse(saved);
        const mapping = await loadHospitalForUser(parsed.id, parsed.role);
        const merged = { ...parsed, ...mapping };
        if (!cancelled) { setUser(merged); localStorage.setItem('healthcare-user', JSON.stringify(merged)); }
      } catch {
        localStorage.removeItem('healthcare-user');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    console.log('[AuthContext] Starting login', { email });
    await new Promise(r => setTimeout(r, 400));
    const lowerEmail = email.toLowerCase();

    // 1. Hospital admin
    const { data: admin, error: adminErr } = await supabase
      .from('hospital_admins')
      .select('id, hospital_id, full_name, email, mobile_number, password_hash, status')
      .eq('email', lowerEmail).maybeSingle();
    if (adminErr) throw adminErr;
    if (admin) {
      if (admin.status !== 'ACTIVE') throw new Error('Your admin account is ' + admin.status.toLowerCase() + '. Please contact support.');
      if (admin.password_hash !== btoa(password)) throw new Error('Invalid email or password');
      const adminUser = {
        id: admin.id, email: admin.email, name: admin.full_name,
        phone: admin.mobile_number, role: 'admin' as UserRole,
        language: 'en', createdAt: new Date().toISOString(), hospitalId: admin.hospital_id,
      };
      setUser(adminUser);
      localStorage.setItem('healthcare-user', JSON.stringify(adminUser));
      return;
    }

    // 3. Registered patient
    const { data: patient, error: patientErr } = await supabase
      .from('registered_patients')
      .select('id, name, email, phone, password_hash, status')
      .eq('email', lowerEmail).maybeSingle();
    if (patientErr) throw patientErr;
    if (patient) {
      if (patient.status !== 'ACTIVE') throw new Error('Your account has been suspended. Please contact support.');
      if (patient.password_hash !== btoa(password)) throw new Error('Invalid email or password');
      const patientUser = {
        id: patient.id, email: patient.email, name: patient.name,
        phone: patient.phone, role: 'patient' as UserRole,
        language: 'en', createdAt: new Date().toISOString(),
      };
      setUser(patientUser);
      localStorage.setItem('healthcare-user', JSON.stringify(patientUser));
      return;
    }

    // 4. Registered doctor
    const { data: dbDoctor, error: doctorErr } = await supabase
      .from('doctors')
      .select('id, name, email, phone, approval_status, hospital_id, password_hash')
      .eq('email', lowerEmail).maybeSingle();
    if (doctorErr) throw doctorErr;
    if (dbDoctor) {
      const st = dbDoctor.approval_status || 'PENDING_APPROVAL';
      if (st === 'PENDING_APPROVAL') throw new Error('Your account is awaiting hospital administrator approval.');
      if (st === 'REJECTED') throw new Error('Your registration was rejected. Please contact the hospital administrator.');
      if (st === 'SUSPENDED') throw new Error('Your account has been suspended. Please contact the hospital administrator.');
      const hash = (dbDoctor as any).password_hash;
      if (hash && hash !== btoa(password)) throw new Error('Invalid email or password');
      if (!hash) throw new Error('Account approved. Please use the credentials provided by your administrator.');
      const doctorUser = {
        id: dbDoctor.id, email: dbDoctor.email, name: dbDoctor.name,
        phone: dbDoctor.phone || '', role: 'doctor' as UserRole,
        language: 'en', createdAt: new Date().toISOString(),
        hospitalId: dbDoctor.hospital_id, doctorId: dbDoctor.id,
      };
      setUser(doctorUser);
      localStorage.setItem('healthcare-user', JSON.stringify(doctorUser));
      return;
    }

    throw new Error('Invalid email or password');
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('healthcare-user');
    supabase.auth.signOut().catch(() => {});
  }, []);

  const validatePhoneNumber = useCallback((phone: string): { valid: boolean; formatted: string; error?: string } => {
    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!cleanPhone) return { valid: false, formatted: '', error: 'Phone number is required.' };
    if (!cleanPhone.startsWith('+')) return { valid: false, formatted: '', error: 'Phone number must include country code (e.g., +91 9876543210).' };
    if (!E164_REGEX.test(cleanPhone)) return { valid: false, formatted: '', error: 'Invalid phone number format. Use E.164 format (e.g., +91 9876543210).' };
    return { valid: true, formatted: cleanPhone };
  }, []);

  const checkPhoneDuplicate = useCallback(async (phone: string, role: UserRole): Promise<boolean> => {
    const cleanPhone = phone.replace(/[\s-]/g, '');
    try {
      if (role === 'patient') {
        const { data } = await supabase.from('registered_patients').select('id').eq('phone', cleanPhone).maybeSingle();
        return !!data;
      } else if (role === 'doctor') {
        const { data } = await supabase.from('doctors').select('id').eq('phone', cleanPhone).maybeSingle();
        return !!data;
      } else if (role === 'hospital_admin') {
        const { data } = await supabase.from('hospital_admins').select('id').eq('mobile_number', cleanPhone).maybeSingle();
        return !!data;
      }
    } catch (err) {
      console.error('[AuthContext] Error checking phone duplicate:', err);
    }
    return false;
  }, []);

  return (
    <AuthContext.Provider value={{
      user: user as any,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      validatePhoneNumber,
      checkPhoneDuplicate,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
