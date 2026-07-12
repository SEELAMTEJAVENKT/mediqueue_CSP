import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Heart, CalendarDays, FileText, Globe, Bell, Mail, Save, CheckCircle,
  Loader2, Building2, ShieldCheck, Lock, MapPin, ChevronLeft,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { NeumorphCard } from '../../components/ui/NeumorphCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { Language } from '../../types';
import { supabase } from '../../lib/supabase';

const languages: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'te', label: 'Telugu' },
];

const inputCls = 'w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm';
const labelCls = 'block text-sm font-medium text-text-primary mb-2';

export function ProfilePage() {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'patient';
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'personal' | 'medical' | 'appointments' | 'reports' | 'settings'>('personal');
  const [profilePhoto, setProfilePhoto] = useState<string>('');

  // State per role
  const [patient, setPatient] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
    date_of_birth: '', gender: '', address: '', emergency_contact: '',
  });
  const [doctor, setDoctor] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
    qualification: '', experience: 0, consultation_fee: 0,
    biography: '', languages_spoken: [] as string[], profile_photo_url: '',
    // read-only:
    doctor_id_code: '', medical_license_number: '', hospital_name: '', specialization: '', department: '',
  });
  const [admin, setAdmin] = useState({
    name: user?.name || '', email: user?.email || '', mobile_number: user?.phone || '',
    password_hash: btoa(''),
    // hospital editable fields (the admin can edit these via their hospital):
    hospital_contact_number: '', dean_name: '', dean_contact_number: '',
    hospital_location: '', hospital_address: '', profile_photo_url: '',
    // read-only:
    hospital_name: '', hospital_id: '',
  });

  // Load real profile from Supabase
  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      if (role === 'patient') {
        const { data } = await supabase
          .from('registered_patients')
          .select('name,email,phone,date_of_birth,gender,address,emergency_contact,profile_photo_url')
          .eq('id', user.id)
          .maybeSingle();
        if (data) {
          setPatient(p => ({ ...p, ...(data as any) }));
          setProfilePhoto((data as any).profile_photo_url || '');
        }
      } else if (role === 'doctor') {
        const { data } = await supabase
          .from('doctors')
          .select(`
            name, email, phone, qualification, experience, consultation_fee, biography,
            languages_spoken, profile_photo_url, doctor_id_code, medical_license_number,
            department, specialization, hospital_id, hospitals ( name )
          `)
          .eq('id', user.doctorId || user.id)
          .maybeSingle();
        if (data) {
          const d = data as any;
          setDoctor({
            name: d.name || '', email: d.email || '', phone: d.phone || '',
            qualification: d.qualification || '', experience: d.experience || 0,
            consultation_fee: d.consultation_fee || 0, biography: d.biography || '',
            languages_spoken: d.languages_spoken || [], profile_photo_url: d.profile_photo_url || '',
            doctor_id_code: d.doctor_id_code || '', medical_license_number: d.medical_license_number || '',
            hospital_name: d.hospitals?.name || '', specialization: d.specialization || '',
            department: d.department || '',
          });
          setProfilePhoto(d.profile_photo_url || '');
        }
      } else if (role === 'admin') {
        const { data: adminRow } = await supabase
          .from('hospital_admins')
          .select('full_name, email, mobile_number, hospital_id, profile_photo_url')
          .eq('email', user.email)
          .maybeSingle();
        let hospital: any = null;
        if (adminRow?.hospital_id) {
          const { data: hosp } = await supabase
            .from('hospitals')
            .select('name, address, city, phone, profile_photo_url, dean_name, dean_contact_number')
            .eq('id', adminRow.hospital_id)
            .maybeSingle();
          hospital = hosp;
        }
        if (adminRow) {
          setAdmin(a => ({
            ...a,
            name: adminRow.full_name || '', email: adminRow.email || '',
            mobile_number: adminRow.mobile_number || '',
            profile_photo_url: adminRow.profile_photo_url || '',
            hospital_contact_number: hospital?.phone || '',
            dean_name: hospital?.dean_name || '',
            dean_contact_number: hospital?.dean_contact_number || '',
            hospital_location: hospital?.city || '',
            hospital_address: hospital?.address || '',
            hospital_name: hospital?.name || '',
            hospital_id: adminRow.hospital_id || '',
          }));
          setProfilePhoto(adminRow.profile_photo_url || hospital?.profile_photo_url || '');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    }
  }, [user, role]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setError('');
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${role}-avatars/${user.id}.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      setProfilePhoto(pub.publicUrl);
    } catch (err: any) {
      setError(err.message || 'Photo upload failed');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true); setError('');
    try {
      if (role === 'patient') {
        // user_id validation: only own row
        const { error: e } = await supabase
          .from('registered_patients')
          .update({
            name: patient.name, email: patient.email, phone: patient.phone,
            date_of_birth: patient.date_of_birth, gender: patient.gender,
            address: patient.address, emergency_contact: patient.emergency_contact,
            profile_photo_url: profilePhoto,
          })
          .eq('id', user.id);
        if (e) throw e;
      } else if (role === 'doctor') {
        // Restricted fields (doctor_id_code, medical_license_number, hospital_id, specialization) NOT updated.
        const { error: e } = await supabase
          .from('doctors')
          .update({
            name: doctor.name, email: doctor.email, phone: doctor.phone,
            qualification: doctor.qualification, experience: doctor.experience,
            consultation_fee: doctor.consultation_fee, biography: doctor.biography,
            languages_spoken: doctor.languages_spoken,
            profile_photo_url: profilePhoto,
            // Department change requires admin approval — flag for review
            ...(false ? { department: doctor.department } : {}),
          })
          .eq('id', user.doctorId || user.id);
        if (e) throw e;
      } else if (role === 'admin') {
        const { error: e1 } = await supabase
          .from('hospital_admins')
          .update({
            full_name: admin.name, email: admin.email, mobile_number: admin.mobile_number,
            profile_photo_url: profilePhoto,
          })
          .eq('email', user.email);
        if (e1) throw e1;
        if (admin.hospital_id) {
          const { error: e2 } = await supabase
            .from('hospitals')
            .update({
              phone: admin.hospital_contact_number,
              dean_name: admin.dean_name,
              dean_contact_number: admin.dean_contact_number,
              city: admin.hospital_location,
              address: admin.hospital_address,
              profile_photo_url: profilePhoto,
            })
            .eq('id', admin.hospital_id);
          if (e2) throw e2;
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'personal' as const, label: t('profile.personalDetails'), icon: User },
    { id: 'settings' as const, label: 'Settings', icon: Bell },
  ];

  // Handle back navigation
  const handleBackNavigation = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback to dashboard based on role
      if (role === 'admin') navigate('/admin');
      else if (role === 'doctor') navigate('/doctor');
      else navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Navigation */}
      <div className="mb-4">
        <button
          onClick={handleBackNavigation}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface shadow-neumorph text-text-secondary hover:text-text-primary text-sm font-medium transition-all"
          aria-label="Go Back"
          title="Go Back"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-6">{t('nav.profile')}</h1>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <NeumorphCard className="p-4 space-y-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary shadow-neumorph-inset'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </NeumorphCard>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <NeumorphCard>
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-success/10 text-success text-sm mb-4"
              >
                <CheckCircle className="w-4 h-4" />
                Profile updated successfully!
              </motion.div>
            )}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 text-danger text-sm mb-4">
                <ShieldCheck className="w-4 h-4" />
                {error}
              </div>
            )}

            {activeTab === 'personal' && (
              <div className="space-y-5">
                {/* Profile photo */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="avatar" className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {(user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-md">
                      <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                      <Save className="w-3 h-3 text-white" />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{user?.name}</p>
                    <p className="text-xs text-text-secondary capitalize">{role} account</p>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-text-primary">{t('profile.personalDetails')}</h2>

                {/* ============= PATIENT ============= */}
                {role === 'patient' && (
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>Full Name</label>
                      <input type="text" value={patient.name} onChange={e => setPatient({ ...patient, name: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Email Address</label>
                      <input type="email" value={patient.email} onChange={e => setPatient({ ...patient, email: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Mobile Number</label>
                      <input type="tel" value={patient.phone} onChange={e => setPatient({ ...patient, phone: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Date of Birth</label>
                      <input type="date" value={patient.date_of_birth || ''} onChange={e => setPatient({ ...patient, date_of_birth: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Gender</label>
                      <select value={patient.gender || ''} onChange={e => setPatient({ ...patient, gender: e.target.value })} className={inputCls}>
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Emergency Contact</label>
                      <input type="tel" value={patient.emergency_contact || ''} onChange={e => setPatient({ ...patient, emergency_contact: e.target.value })} placeholder="+91 98765 43210" className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Address</label>
                      <textarea rows={3} value={patient.address || ''} onChange={e => setPatient({ ...patient, address: e.target.value })} className={`${inputCls} resize-none`} />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-2 p-3 rounded-xl bg-surface/60 text-text-secondary text-xs">
                      <Lock className="w-3.5 h-3.5" /> Patient ID cannot be changed: <span className="font-mono">{user?.id}</span>
                    </div>
                  </div>
                )}

                {/* ============= DOCTOR ============= */}
                {role === 'doctor' && (
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>Full Name</label>
                      <input type="text" value={doctor.name} onChange={e => setDoctor({ ...doctor, name: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Email Address</label>
                      <input type="email" value={doctor.email} onChange={e => setDoctor({ ...doctor, email: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Mobile Number</label>
                      <input type="tel" value={doctor.phone} onChange={e => setDoctor({ ...doctor, phone: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Qualification</label>
                      <input type="text" value={doctor.qualification} onChange={e => setDoctor({ ...doctor, qualification: e.target.value })} placeholder="MBBS, MD" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Experience (years)</label>
                      <input type="number" min={0} value={doctor.experience} onChange={e => setDoctor({ ...doctor, experience: Number(e.target.value) })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Consultation Fee (₹)</label>
                      <input type="number" min={0} value={doctor.consultation_fee} onChange={e => setDoctor({ ...doctor, consultation_fee: Number(e.target.value) })} className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Biography</label>
                      <textarea rows={3} value={doctor.biography} onChange={e => setDoctor({ ...doctor, biography: e.target.value })} className={`${inputCls} resize-none`} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Languages Spoken (comma separated)</label>
                      <input
                        type="text"
                        value={doctor.languages_spoken.join(', ')}
                        onChange={e => setDoctor({ ...doctor, languages_spoken: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="English, Hindi, Telugu"
                        className={inputCls}
                      />
                    </div>

                    {/* Read-only fields */}
                    <ReadOnlyField label="Doctor ID" value={doctor.doctor_id_code} />
                    <ReadOnlyField label="Medical License Number" value={doctor.medical_license_number} />
                    <ReadOnlyField label="Assigned Hospital" value={doctor.hospital_name} icon={Building2} />
                    <ReadOnlyField label="Specialist Type" value={doctor.specialization} />
                    <div className="sm:col-span-2 flex items-center gap-2 p-3 rounded-xl bg-warning/10 text-warning text-xs">
                      <Lock className="w-3.5 h-3.5" /> Department changes require Hospital Admin approval.
                    </div>
                  </div>
                )}

                {/* ============= ADMIN ============= */}
                {role === 'admin' && (
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>Full Name</label>
                      <input type="text" value={admin.name} onChange={e => setAdmin({ ...admin, name: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Email Address</label>
                      <input type="email" value={admin.email} onChange={e => setAdmin({ ...admin, email: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Mobile Number</label>
                      <input type="tel" value={admin.mobile_number} onChange={e => setAdmin({ ...admin, mobile_number: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Hospital Contact Number</label>
                      <input type="tel" value={admin.hospital_contact_number} onChange={e => setAdmin({ ...admin, hospital_contact_number: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Dean Name</label>
                      <input type="text" value={admin.dean_name} onChange={e => setAdmin({ ...admin, dean_name: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Dean Contact Number</label>
                      <input type="tel" value={admin.dean_contact_number} onChange={e => setAdmin({ ...admin, dean_contact_number: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Hospital Location (City)</label>
                      <input type="text" value={admin.hospital_location} onChange={e => setAdmin({ ...admin, hospital_location: e.target.value })} className={inputCls} />
                    </div>
                    <ReadOnlyField label="Hospital Name" value={admin.hospital_name} icon={Building2} />
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Hospital Address</label>
                      <textarea rows={2} value={admin.hospital_address} onChange={e => setAdmin({ ...admin, hospital_address: e.target.value })} className={`${inputCls} resize-none`} />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-2 p-3 rounded-xl bg-surface/60 text-text-secondary text-xs">
                      <Lock className="w-3.5 h-3.5" /> Hospital ID cannot be changed: <span className="font-mono">{admin.hospital_id || '—'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-text-primary">{t('profile.notificationSettings')}</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface shadow-neumorph-inset">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">Push Notifications</p>
                        <p className="text-xs text-text-secondary">Receive alerts for appointments</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface shadow-neumorph-inset">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">Email Notifications</p>
                        <p className="text-xs text-text-secondary">Receive updates via email</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="text-sm font-bold text-text-primary mb-3">{t('profile.preferredLanguage')}</h3>
                  <div className="flex gap-3">
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          language === lang.code
                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                            : 'bg-surface shadow-neumorph text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <Globe className="w-4 h-4 inline mr-1" />
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button onClick={logout} className="text-sm text-danger hover:underline">Sign out</button>
                </div>
              </div>
            )}

            <div className="pt-4">
              <GradientButton onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
              </GradientButton>
            </div>
          </NeumorphCard>
        </div>
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Building2 }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface/60 shadow-neumorph-inset">
        {Icon && <Icon className="w-4 h-4 text-text-secondary" />}
        <span className="text-sm text-text-secondary flex-1 truncate">{value || '—'}</span>
        <Lock className="w-3.5 h-3.5 text-text-secondary" />
      </div>
    </div>
  );
}
