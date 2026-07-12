import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, Phone, Eye, EyeOff, Stethoscope,
  ArrowRight, ArrowLeft, Building2, BadgeCheck,
  ShieldCheck, MapPin, Hash, ChevronLeft,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { NeumorphCard } from '../../components/ui/NeumorphCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { supabase } from '../../lib/supabase';
import { UserRole } from '../../types';

const HOSPITAL_TYPES = [
  'Multi-Specialty', 'General', 'Super-Specialty',
  'Specialty Clinic', 'Teaching Hospital', 'Government',
  'Private', 'Charitable', 'Other',
];

interface Hospital { id: string; name: string; }

export function RegisterPage() {
  const { t } = useLanguage();
  const { isAuthenticated, user, isLoading, validatePhoneNumber, checkPhoneDuplicate } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('patient');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'doctor') navigate('/doctor', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  // Hospital Admin fields
  const [hospName, setHospName] = useState('');
  const [hospRegNo, setHospRegNo] = useState('');
  const [hospLicenseNo, setHospLicenseNo] = useState('');
  const [hospType, setHospType] = useState('');
  const [hospAddress, setHospAddress] = useState('');
  const [hospCity, setHospCity] = useState('');
  const [hospState, setHospState] = useState('');
  const [hospCountry, setHospCountry] = useState('India');
  const [hospPostal, setHospPostal] = useState('');
  const [hospEmail, setHospEmail] = useState('');
  const [hospPhone, setHospPhone] = useState('');

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Doctor-specific
  const [doctorIdCode, setDoctorIdCode] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experience, setExperience] = useState('');
  const [department, setDepartment] = useState('');
  const [specialistType, setSpecialistType] = useState('');
  const [qualification, setQualification] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);

  // doctor: 3 steps, hospital_admin: 2 steps, patient: 2 steps
  const totalSteps = role === 'doctor' ? 3 : 2;
  const isLastStep = step === totalSteps;

  useEffect(() => {
    if (role === 'doctor') {
      setHospitalsLoading(true);
      supabase
        .from('hospitals')
        .select('id, name')
        .eq('status', 'ACTIVE')
        .order('name')
        .then(({ data }) => {
          setHospitals((data as Hospital[]) || []);
          setHospitalsLoading(false);
        });
    }
  }, [role]);

  const selectedHospital = hospitals.find(h => h.id === selectedHospitalId);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRe = /^\+?[0-9]{10,15}$/;

  const validateField = (field: string): string => {
    switch (field) {
      case 'name': return name.trim() ? '' : 'Full name is required.';
      case 'email':
        if (!email.trim()) return 'Email is required.';
        if (!emailRe.test(email.trim())) return 'Enter a valid email address.';
        return '';
      case 'phone':
        if (!phone.trim()) return 'Mobile number is required.';
        if (!phoneRe.test(phone.trim())) return 'Enter a valid mobile number (10-15 digits).';
        return '';
      case 'password':
        if (!password) return 'Password is required.';
        if (password.length < 6) return 'Password must be at least 6 characters.';
        return '';
      case 'confirmPassword':
        if (!confirmPassword) return 'Please confirm your password.';
        if (password !== confirmPassword) return 'Passwords do not match.';
        return '';
      case 'doctorIdCode': return doctorIdCode.trim() ? '' : 'Doctor ID is required.';
      case 'licenseNumber': return licenseNumber.trim() ? '' : 'Medical License Number is required.';
      case 'qualification': return qualification.trim() ? '' : 'Qualification is required.';
      case 'experience':
        if (!experience) return 'Years of experience is required.';
        if (Number(experience) < 0) return 'Experience must be 0 or more.';
        return '';
      case 'department': return department.trim() ? '' : 'Department is required.';
      case 'specialistType': return specialistType ? '' : 'Specialist type is required.';
      case 'consultationFee':
        if (!consultationFee.trim()) return 'Consultation fee is required.';
        if (Number(consultationFee) <= 0) return 'Consultation fee must be greater than zero.';
        return '';
      case 'selectedHospitalId': return selectedHospitalId ? '' : 'Please select a hospital.';
      case 'hospName': return hospName.trim() ? '' : 'Hospital name is required.';
      case 'hospRegNo': return hospRegNo.trim() ? '' : 'Registration number is required.';
      case 'hospLicenseNo': return hospLicenseNo.trim() ? '' : 'License number is required.';
      case 'hospType': return hospType ? '' : 'Hospital type is required.';
      case 'hospAddress': return hospAddress.trim() ? '' : 'Address is required.';
      case 'hospCity': return hospCity.trim() ? '' : 'City is required.';
      case 'hospState': return hospState.trim() ? '' : 'State is required.';
      case 'hospCountry': return hospCountry.trim() ? '' : 'Country is required.';
      case 'hospPostal': return hospPostal.trim() ? '' : 'Postal code is required.';
      case 'hospEmail':
        if (!hospEmail.trim()) return 'Official email is required.';
        if (!emailRe.test(hospEmail.trim())) return 'Enter a valid email address.';
        return '';
      case 'hospPhone':
        if (!hospPhone.trim()) return 'Official contact number is required.';
        if (!phoneRe.test(hospPhone.trim())) return 'Enter a valid contact number.';
        return '';
      default: return '';
    }
  };

  const fieldListForStep = (s: number): string[] => {
    if (role === 'hospital_admin') {
      if (s === 1) return ['hospName','hospRegNo','hospLicenseNo','hospType','hospAddress','hospCity','hospState','hospCountry','hospPostal','hospEmail','hospPhone'];
      if (s === 2) return ['name','email','phone','password','confirmPassword'];
    }
    if (role === 'doctor') {
      if (s === 1) return ['name','email','phone','password','confirmPassword'];
      if (s === 2) return ['doctorIdCode','licenseNumber','qualification','experience','department','specialistType','consultationFee'];
      if (s === 3) return ['selectedHospitalId'];
    }
    // patient
    if (s === 1) return ['name','email','phone'];
    if (s === 2) return ['password','confirmPassword'];
    return [];
  };

  const errorsForStep = (s: number): Record<string, string> => {
    const errs: Record<string, string> = {};
    fieldListForStep(s).forEach(f => {
      const e = validateField(f);
      if (e) errs[f] = e;
    });
    return errs;
  };

  const setField = <T,>(setter: (v: T) => void, field: string, value: T) => {
    setter(value);
    if (fieldErrors[field]) {
      setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const checkDoctorIdUnique = async (): Promise<string> => {
    if (!doctorIdCode.trim() || !selectedHospitalId) return '';
    const { count } = await supabase
      .from('doctors').select('id', { count: 'exact', head: true })
      .eq('doctor_id_code', doctorIdCode.trim()).eq('hospital_id', selectedHospitalId);
    return count && count > 0 ? 'This Doctor ID is already taken in this hospital.' : '';
  };

  const checkLicenseUnique = async (): Promise<string> => {
    if (!licenseNumber.trim()) return '';
    const { count } = await supabase
      .from('doctors').select('id', { count: 'exact', head: true })
      .eq('medical_license_number', licenseNumber.trim());
    return count && count > 0 ? 'This Medical License Number is already registered.' : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all steps
    const allErrs: Record<string, string> = {};
    for (let s = 1; s <= totalSteps; s++) Object.assign(allErrs, errorsForStep(s));
    setFieldErrors(allErrs);
    if (Object.keys(allErrs).length > 0) {
      setError('Please complete all required fields before submitting.');
      return;
    }

    setError('');
    setLoading(true);

    const cleanPhone = phone.replace(/[\s-]/g, '');

    try {
      if (role === 'patient') {
        const { data: existingPatient } = await supabase
          .from('registered_patients').select('id').eq('email', email.toLowerCase()).maybeSingle();
        if (existingPatient) throw new Error('An account with this email already exists.');

        const phoneDup = await checkPhoneDuplicate(cleanPhone, role);
        if (phoneDup) throw new Error('An account with this mobile number already exists.');

        const { data: newPatient, error: patientErr } = await supabase
          .from('registered_patients')
          .insert({
            name,
            email: email.toLowerCase(),
            phone: cleanPhone,
            password_hash: btoa(password),
            status: 'ACTIVE',
            email_verified: true,
            phone_verified: false,
            verification_status: 'VERIFIED',
          })
          .select()
          .single();

        if (patientErr) throw patientErr;

        const patientUser = {
          id: newPatient.id,
          email: newPatient.email,
          name: newPatient.name,
          phone: newPatient.phone,
          role: 'patient',
          language: 'en',
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('healthcare-user', JSON.stringify(patientUser));
        navigate('/dashboard', { replace: true });

      } else if (role === 'doctor') {
        const { data: existingDoctor } = await supabase
          .from('doctors').select('id').eq('email', email.toLowerCase()).maybeSingle();
        if (existingDoctor) throw new Error('An account with this email already exists.');

        const phoneDup = await checkPhoneDuplicate(cleanPhone, role);
        if (phoneDup) throw new Error('An account with this mobile number already exists.');

        const { data: existingById } = await supabase
          .from('doctors').select('id')
          .eq('doctor_id_code', doctorIdCode).eq('hospital_id', selectedHospitalId).maybeSingle();
        if (existingById) throw new Error('This Doctor ID already exists in the selected hospital.');

        const { data: newDoctor, error: doctorErr } = await supabase
          .from('doctors')
          .insert({
            name,
            email: email.toLowerCase(),
            phone: cleanPhone,
            mobile_number: cleanPhone,
            password_hash: btoa(password),
            specialization: specialistType,
            department,
            qualification,
            consultation_fee: Number(consultationFee) || 0,
            experience: parseInt(experience) || 0,
            hospital_id: selectedHospitalId,
            doctor_id_code: doctorIdCode,
            medical_license_number: licenseNumber,
            approval_status: 'PENDING_APPROVAL',
            status: 'inactive',
            is_verified: false,
            email_verified: true,
            phone_verified: false,
            verification_status: 'VERIFIED',
            rating: 0,
            review_count: 0,
          })
          .select()
          .single();

        if (doctorErr) throw doctorErr;

        await supabase.from('doctor_approval_requests').insert({
          doctor_id: newDoctor.id,
          hospital_id: selectedHospitalId,
          status: 'PENDING_APPROVAL',
        });

        const { data: adminRow } = await supabase
          .from('hospital_admins').select('id')
          .eq('hospital_id', selectedHospitalId).eq('role', 'HOSPITAL_ADMIN').eq('status', 'ACTIVE').maybeSingle();

        if (adminRow?.id) {
          await supabase.from('notifications').insert({
            user_id: adminRow.id,
            title: 'New Doctor Registration Request',
            message: `Dr. ${name} has submitted a registration request for your hospital.`,
            type: 'system',
            is_read: false,
          });
        }

        // Show pending approval screen
        navigate('/register-success', { replace: true });
        // Navigate to a success info page via state on login page
        navigate('/login', {
          replace: true,
          state: { message: 'Registration submitted. You will be notified once your account is approved by the hospital administrator.' },
        });

      } else if (role === 'hospital_admin') {
        const checks = await Promise.all([
          supabase.from('hospitals').select('id').eq('name', hospName).maybeSingle(),
          supabase.from('hospitals').select('id').eq('registration_number', hospRegNo).maybeSingle(),
          supabase.from('hospitals').select('id').eq('license_number', hospLicenseNo).maybeSingle(),
          supabase.from('hospitals').select('id').eq('official_email', hospEmail).maybeSingle(),
          supabase.from('hospital_admins').select('id').eq('email', email.toLowerCase()).maybeSingle(),
          supabase.from('hospital_admins').select('id').eq('mobile_number', cleanPhone).maybeSingle(),
        ]);
        const msgs = [
          'Hospital name already exists.', 'Registration number already exists.',
          'License number already exists.', 'Official email already exists.',
          'Admin email already exists.', 'Mobile number already exists.',
        ];
        for (let i = 0; i < checks.length; i++) {
          if (checks[i].data) throw new Error(msgs[i]);
        }

        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: email.toLowerCase(),
          password,
          options: { data: { name, phone: cleanPhone, role: 'HOSPITAL_ADMIN' } },
        });
        if (signUpErr) throw signUpErr;
        const authUser = signUpData.user;
        if (!authUser) throw new Error('Sign-up failed. Please try again.');

        await supabase.from('profiles').insert({
          id: authUser.id,
          role: 'HOSPITAL_ADMIN',
          name,
          phone: cleanPhone,
          email_verified: true,
          verification_status: 'VERIFIED',
        });

        const { data: newHosp, error: hospErr } = await supabase
          .from('hospitals')
          .insert({
            name: hospName,
            registration_number: hospRegNo,
            license_number: hospLicenseNo,
            hospital_type: hospType,
            address: `${hospAddress}, ${hospCity}, ${hospState} ${hospPostal}`,
            city: hospCity,
            state: hospState,
            country: hospCountry,
            postal_code: hospPostal,
            official_email: hospEmail,
            official_contact_number: hospPhone,
            email: hospEmail,
            phone: hospPhone,
            status: 'ACTIVE',
            is_open: true,
            rating: 0,
            review_count: 0,
            latitude: 0,
            longitude: 0,
            created_by: authUser.id,
          })
          .select()
          .single();
        if (hospErr) throw hospErr;

        await supabase.from('profiles').update({ hospital_id: newHosp.id }).eq('id', authUser.id);

        const { data: newAdmin, error: adminErr } = await supabase
          .from('hospital_admins')
          .insert({
            hospital_id: newHosp.id,
            full_name: name,
            email: email.toLowerCase(),
            mobile_number: cleanPhone,
            password_hash: btoa(password),
            role: 'HOSPITAL_ADMIN',
            status: 'ACTIVE',
            email_verified: true,
            phone_verified: false,
            verification_status: 'VERIFIED',
          })
          .select()
          .single();
        if (adminErr) throw adminErr;

        const adminUser = {
          id: newAdmin.id,
          email: newAdmin.email,
          name: newAdmin.full_name,
          phone: newAdmin.mobile_number,
          role: 'admin',
          language: 'en',
          createdAt: new Date().toISOString(),
          hospitalId: newHosp.id,
        };
        localStorage.setItem('healthcare-user', JSON.stringify(adminUser));
        navigate('/admin', { replace: true });
      }
    } catch (err: any) {
      console.error('[Register] Registration error:', err);
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    const errs = errorsForStep(step);
    setFieldErrors(prev => ({ ...prev, ...errs }));
    if (Object.keys(errs).length > 0) {
      setError('Please complete all required fields before continuing.');
      return;
    }
    setError('');
    setStep(s => s + 1);
  };

  const back = () => { setError(''); setStep(s => Math.max(1, s - 1)); };

  const handleBackNavigation = () => {
    if (step > 1) {
      back();
    } else {
      if (window.history.length > 1) navigate(-1);
      else navigate('/login');
    }
  };

  const stepLabel = () => {
    if (role === 'hospital_admin') {
      if (step === 1) return 'Hospital Information';
      return 'Administrator Account';
    }
    if (role === 'doctor') {
      if (step === 1) return 'Personal Information';
      if (step === 2) return 'Professional Information';
      return 'Hospital Selection';
    }
    return step === 1 ? 'Personal Information' : 'Security';
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg relative"
      >
        <NeumorphCard className="space-y-6">
          {/* Back Navigation */}
          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleBackNavigation}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface shadow-neumorph text-text-secondary hover:text-text-primary text-sm font-medium transition-all"
              aria-label="Go Back"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/30 mb-4">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">{t('auth.register')}</h1>
            <p className="text-sm text-text-secondary mt-1">Create your MediQueue account</p>
          </div>

          {/* Role picker (step 1 only) */}
          {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">I am a</label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {([
                  { id: 'patient', label: 'Patient', icon: User },
                  { id: 'doctor', label: 'Doctor', icon: Stethoscope },
                  { id: 'hospital_admin', label: 'Hospital Admin', icon: ShieldCheck },
                ] as { id: UserRole; label: string; icon: any }[]).map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setRole(r.id); setStep(1); setError(''); }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all text-xs sm:text-sm font-medium ${
                      role === r.id
                        ? 'bg-primary/10 text-primary shadow-neumorph-inset ring-2 ring-primary/30'
                        : 'bg-surface shadow-neumorph text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <r.icon className="w-4 h-4" />
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < step ? 'bg-primary' : 'bg-slate-200'}`} />
            ))}
          </div>

          <p className="text-xs font-medium text-text-secondary -mt-2">
            Step {step} of {totalSteps} — {stepLabel()}
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-danger/10 text-danger text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">

              {/* Step 1: Personal Info (patient + doctor) */}
              {step === 1 && role !== 'hospital_admin' && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <Field label="Full Name" icon={<User className="w-4 h-4 text-text-secondary" />}>
                    <input type="text" required value={name} onChange={e => setField(setName, 'name', e.target.value)} placeholder="Dr. Priya Sharma" className={inputCls} />
                    {fieldErrors.name && <p className="text-xs text-danger mt-1">{fieldErrors.name}</p>}
                  </Field>
                  <Field label="Email Address" icon={<Mail className="w-4 h-4 text-text-secondary" />}>
                    <input type="email" required value={email} onChange={e => setField(setEmail, 'email', e.target.value)} placeholder="you@example.com" className={inputCls} />
                    {fieldErrors.email && <p className="text-xs text-danger mt-1">{fieldErrors.email}</p>}
                  </Field>
                  <Field label="Mobile Number" icon={<Phone className="w-4 h-4 text-text-secondary" />}>
                    <input type="tel" required value={phone} onChange={e => setField(setPhone, 'phone', e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
                    {fieldErrors.phone && <p className="text-xs text-danger mt-1">{fieldErrors.phone}</p>}
                  </Field>
                  {role === 'doctor' && (
                    <>
                      <Field label="Password" icon={<Lock className="w-4 h-4 text-text-secondary" />} rightAction={
                        <button type="button" onClick={() => setShowPassword(v => !v)} className="text-text-secondary hover:text-text-primary">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }>
                        <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setField(setPassword, 'password', e.target.value)} placeholder="Min 6 characters" className={inputCls} />
                        {fieldErrors.password && <p className="text-xs text-danger mt-1">{fieldErrors.password}</p>}
                      </Field>
                      <Field label="Confirm Password" icon={<Lock className="w-4 h-4 text-text-secondary" />}>
                        <input type="password" required value={confirmPassword} onChange={e => setField(setConfirmPassword, 'confirmPassword', e.target.value)} placeholder="Re-enter password" className={inputCls} />
                        {fieldErrors.confirmPassword && <p className="text-xs text-danger mt-1">{fieldErrors.confirmPassword}</p>}
                      </Field>
                    </>
                  )}
                </motion.div>
              )}

              {/* Step 2 (doctor): Professional Info */}
              {step === 2 && role === 'doctor' && (
                <motion.div key="step2d" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1.5">Doctor ID</label>
                      <input value={doctorIdCode} onChange={e => setField(setDoctorIdCode, 'doctorIdCode', e.target.value)} onBlur={async () => { const e = await checkDoctorIdUnique(); if (e) setFieldErrors(p => ({ ...p, doctorIdCode: e })); }} placeholder="e.g. APL-DOC-001" className={plainInputCls} required />
                      {fieldErrors.doctorIdCode && <p className="text-xs text-danger mt-1">{fieldErrors.doctorIdCode}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1.5">Medical License Number</label>
                      <input value={licenseNumber} onChange={e => setField(setLicenseNumber, 'licenseNumber', e.target.value)} onBlur={async () => { const e = await checkLicenseUnique(); if (e) setFieldErrors(p => ({ ...p, licenseNumber: e })); }} placeholder="e.g. MCI-2024-XXXXX" className={plainInputCls} required />
                      {fieldErrors.licenseNumber && <p className="text-xs text-danger mt-1">{fieldErrors.licenseNumber}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1.5">Years of Experience</label>
                      <input type="number" min="0" max="60" value={experience} onChange={e => setField(setExperience, 'experience', e.target.value)} placeholder="e.g. 8" className={plainInputCls} required />
                      {fieldErrors.experience && <p className="text-xs text-danger mt-1">{fieldErrors.experience}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1.5">Department</label>
                      <input value={department} onChange={e => setField(setDepartment, 'department', e.target.value)} placeholder="e.g. Cardiology" className={plainInputCls} required />
                      {fieldErrors.department && <p className="text-xs text-danger mt-1">{fieldErrors.department}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1.5">Specialist Type</label>
                    <select value={specialistType} onChange={e => setField(setSpecialistType, 'specialistType', e.target.value)} className={plainInputCls} required>
                      <option value="">Select specialist type</option>
                      <option value="General Physician">General Physician</option>
                      <option value="Cardiologist">Cardiologist</option>
                      <option value="Neurologist">Neurologist</option>
                      <option value="Pediatrician">Pediatrician</option>
                      <option value="Gynecologist">Gynecologist</option>
                      <option value="Dermatologist">Dermatologist</option>
                      <option value="ENT Specialist">ENT Specialist</option>
                      <option value="Orthopedic Surgeon">Orthopedic Surgeon</option>
                      <option value="Psychiatrist">Psychiatrist</option>
                      <option value="Ophthalmologist">Ophthalmologist</option>
                      <option value="Other">Other</option>
                    </select>
                    {fieldErrors.specialistType && <p className="text-xs text-danger mt-1">{fieldErrors.specialistType}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1.5">Qualification</label>
                    <input value={qualification} onChange={e => setField(setQualification, 'qualification', e.target.value)} placeholder="e.g. MBBS, MD (Cardiology)" className={plainInputCls} required />
                    {fieldErrors.qualification && <p className="text-xs text-danger mt-1">{fieldErrors.qualification}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1.5">Consultation Fee (INR) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-text-secondary">₹</span>
                      <input type="number" min="1" step="1" value={consultationFee} onChange={e => setField(setConsultationFee, 'consultationFee', e.target.value)} placeholder="e.g. 500" className={`${plainInputCls} pl-8`} required />
                      {fieldErrors.consultationFee && <p className="text-xs text-danger mt-1">{fieldErrors.consultationFee}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2 (patient): Password — handled above inline in step 1 for patient */}
              {step === 2 && role === 'patient' && (
                <motion.div key="step2p" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <Field label="Password" icon={<Lock className="w-4 h-4 text-text-secondary" />} rightAction={
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="text-text-secondary hover:text-text-primary">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }>
                    <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setField(setPassword, 'password', e.target.value)} placeholder="Min 6 characters" className={inputCls} />
                    {fieldErrors.password && <p className="text-xs text-danger mt-1">{fieldErrors.password}</p>}
                  </Field>
                  <Field label="Confirm Password" icon={<Lock className="w-4 h-4 text-text-secondary" />}>
                    <input type="password" required value={confirmPassword} onChange={e => setField(setConfirmPassword, 'confirmPassword', e.target.value)} placeholder="Re-enter password" className={inputCls} />
                    {fieldErrors.confirmPassword && <p className="text-xs text-danger mt-1">{fieldErrors.confirmPassword}</p>}
                  </Field>
                </motion.div>
              )}

              {/* Step 1 (hospital_admin): Hospital Info */}
              {step === 1 && role === 'hospital_admin' && (
                <motion.div key="step1ha" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Building2 className="w-5 h-5" />
                    <h3 className="text-sm font-semibold">Hospital Details</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1.5">Hospital Name</label>
                      <input value={hospName} onChange={e => setField(setHospName, 'hospName', e.target.value)} placeholder="e.g. City Care Hospital" className={plainInputCls} required />
                      {fieldErrors.hospName && <p className="text-xs text-danger mt-1">{fieldErrors.hospName}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1.5">Hospital Type</label>
                      <select value={hospType} onChange={e => setField(setHospType, 'hospType', e.target.value)} className={plainInputCls} required>
                        <option value="">Select type...</option>
                        {HOSPITAL_TYPES.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      {fieldErrors.hospType && <p className="text-xs text-danger mt-1">{fieldErrors.hospType}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1.5">Registration Number</label>
                      <input value={hospRegNo} onChange={e => setField(setHospRegNo, 'hospRegNo', e.target.value)} placeholder="e.g. REG-2024-00123" className={plainInputCls} required />
                      {fieldErrors.hospRegNo && <p className="text-xs text-danger mt-1">{fieldErrors.hospRegNo}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1.5">License Number</label>
                      <input value={hospLicenseNo} onChange={e => setField(setHospLicenseNo, 'hospLicenseNo', e.target.value)} placeholder="e.g. LIC-MED-98765" className={plainInputCls} required />
                      {fieldErrors.hospLicenseNo && <p className="text-xs text-danger mt-1">{fieldErrors.hospLicenseNo}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Address</label>
                    <input value={hospAddress} onChange={e => setField(setHospAddress, 'hospAddress', e.target.value)} placeholder="Street address" className={plainInputCls} required />
                    {fieldErrors.hospAddress && <p className="text-xs text-danger mt-1">{fieldErrors.hospAddress}</p>}
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1.5">City</label>
                      <input value={hospCity} onChange={e => setField(setHospCity, 'hospCity', e.target.value)} placeholder="e.g. Mumbai" className={plainInputCls} required />
                      {fieldErrors.hospCity && <p className="text-xs text-danger mt-1">{fieldErrors.hospCity}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1.5">State</label>
                      <input value={hospState} onChange={e => setField(setHospState, 'hospState', e.target.value)} placeholder="e.g. Maharashtra" className={plainInputCls} required />
                      {fieldErrors.hospState && <p className="text-xs text-danger mt-1">{fieldErrors.hospState}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1.5">Postal Code</label>
                      <input value={hospPostal} onChange={e => setField(setHospPostal, 'hospPostal', e.target.value)} placeholder="e.g. 400001" className={plainInputCls} required />
                      {fieldErrors.hospPostal && <p className="text-xs text-danger mt-1">{fieldErrors.hospPostal}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1.5">Country</label>
                    <input value={hospCountry} onChange={e => setField(setHospCountry, 'hospCountry', e.target.value)} placeholder="e.g. India" className={plainInputCls} required />
                    {fieldErrors.hospCountry && <p className="text-xs text-danger mt-1">{fieldErrors.hospCountry}</p>}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1.5"><Mail className="w-3 h-3 inline mr-1" /> Official Email</label>
                      <input type="email" value={hospEmail} onChange={e => setField(setHospEmail, 'hospEmail', e.target.value)} placeholder="info@hospital.com" className={plainInputCls} required />
                      {fieldErrors.hospEmail && <p className="text-xs text-danger mt-1">{fieldErrors.hospEmail}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1.5"><Phone className="w-3 h-3 inline mr-1" /> Official Contact Number</label>
                      <input type="tel" value={hospPhone} onChange={e => setField(setHospPhone, 'hospPhone', e.target.value)} placeholder="+91 98765 43210" className={plainInputCls} required />
                      {fieldErrors.hospPhone && <p className="text-xs text-danger mt-1">{fieldErrors.hospPhone}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2 (hospital_admin): Admin Account */}
              {step === 2 && role === 'hospital_admin' && (
                <motion.div key="step2ha" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck className="w-5 h-5" />
                    <h3 className="text-sm font-semibold">Administrator Account</h3>
                  </div>
                  <Field label="Full Name" icon={<User className="w-4 h-4 text-text-secondary" />}>
                    <input type="text" required value={name} onChange={e => setField(setName, 'name', e.target.value)} placeholder="Admin full name" className={inputCls} />
                    {fieldErrors.name && <p className="text-xs text-danger mt-1">{fieldErrors.name}</p>}
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1.5">Email Address</label>
                      <input type="email" required value={email} onChange={e => setField(setEmail, 'email', e.target.value)} placeholder="admin@hospital.com" className={plainInputCls} />
                      {fieldErrors.email && <p className="text-xs text-danger mt-1">{fieldErrors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1.5">Mobile Number</label>
                      <input type="tel" required value={phone} onChange={e => setField(setPhone, 'phone', e.target.value)} placeholder="+91 98765 43210" className={plainInputCls} />
                      {fieldErrors.phone && <p className="text-xs text-danger mt-1">{fieldErrors.phone}</p>}
                    </div>
                  </div>
                  <Field label="Password" icon={<Lock className="w-4 h-4 text-text-secondary" />} rightAction={
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="text-text-secondary hover:text-text-primary">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }>
                    <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setField(setPassword, 'password', e.target.value)} placeholder="Min 6 characters" className={inputCls} />
                    {fieldErrors.password && <p className="text-xs text-danger mt-1">{fieldErrors.password}</p>}
                  </Field>
                  <Field label="Confirm Password" icon={<Lock className="w-4 h-4 text-text-secondary" />}>
                    <input type="password" required value={confirmPassword} onChange={e => setField(setConfirmPassword, 'confirmPassword', e.target.value)} placeholder="Re-enter password" className={inputCls} />
                    {fieldErrors.confirmPassword && <p className="text-xs text-danger mt-1">{fieldErrors.confirmPassword}</p>}
                  </Field>
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-text-secondary leading-relaxed flex items-start gap-2">
                    <Hash className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>A unique hospital ID will be generated automatically and your admin account will be activated instantly. You will be signed in right after registration.</span>
                  </div>
                </motion.div>
              )}

              {/* Step 3 (doctor): Hospital Selection */}
              {step === 3 && role === 'doctor' && (
                <motion.div key="step3d" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Hospital Name
                    </label>
                    {hospitalsLoading ? (
                      <div className="h-11 rounded-xl bg-surface shadow-neumorph-inset animate-pulse" />
                    ) : (
                      <select value={selectedHospitalId} onChange={e => setSelectedHospitalId(e.target.value)} className={plainInputCls} required>
                        <option value="">Select a hospital...</option>
                        {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                    )}
                    {fieldErrors.selectedHospitalId && <p className="text-xs text-danger mt-1">{fieldErrors.selectedHospitalId}</p>}
                  </div>

                  {selectedHospital && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3">
                      <BadgeCheck className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-text-primary">{selectedHospital.name}</p>
                        <p className="text-xs text-text-secondary">Hospital ID: {selectedHospital.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </motion.div>
                  )}

                  <div className="p-4 rounded-xl bg-warning/5 border border-warning/20 text-xs text-text-secondary leading-relaxed">
                    <p className="font-semibold text-text-primary mb-1">What happens next?</p>
                    Your registration will be reviewed by the hospital administrator. You will receive a
                    notification once your account is approved and you can log in.
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={back}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface shadow-neumorph text-text-secondary hover:text-text-primary text-sm font-medium transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
              {!isLastStep ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <GradientButton type="submit" disabled={loading} className="flex-1 justify-center">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      {role === 'doctor'
                        ? 'Submit Registration'
                        : role === 'hospital_admin'
                          ? 'Register Hospital & Admin'
                          : t('auth.register')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </GradientButton>
              )}
            </div>
          </form>

          <div className="text-center">
            <p className="text-sm text-text-secondary">
              {t('auth.haveAccount')}{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </div>
        </NeumorphCard>
      </motion.div>
    </div>
  );
}

const inputCls = 'w-full pl-0 pr-0 py-0 bg-transparent border-none outline-none text-text-primary text-sm placeholder:text-text-secondary/50';
const plainInputCls = 'w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none focus:ring-2 focus:ring-primary/30 text-text-primary text-sm';

function Field({ label, icon, children, rightAction }: { label: string; icon?: React.ReactNode; children: React.ReactNode; rightAction?: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-2">{label}</label>
      <div className="relative flex items-center px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset gap-3">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <div className="flex-1">{children}</div>
        {rightAction && <span className="flex-shrink-0">{rightAction}</span>}
      </div>
    </div>
  );
}
