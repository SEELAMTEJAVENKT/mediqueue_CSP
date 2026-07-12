import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Stethoscope, User, CalendarDays, Clock, ChevronRight, ChevronLeft,
  CheckCircle, AlertTriangle, FileText, Loader2, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { NeumorphCard } from '../../components/ui/NeumorphCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { useHospitals } from '../../hooks/useHospitals';
import { useDoctors } from '../../hooks/useDoctors';
import { useTimeSlots } from '../../hooks/useTimeSlots';
import { useAppointments } from '../../hooks/useAppointments';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const steps = [
  { id: 'hospital', label: 'Select Hospital', icon: Building2 },
  { id: 'department', label: 'Department', icon: Stethoscope },
  { id: 'doctor', label: 'Select Doctor', icon: User },
  { id: 'date', label: 'Choose Date', icon: CalendarDays },
  { id: 'slot', label: 'Time Slot', icon: Clock },
  { id: 'confirm', label: 'Confirm', icon: CheckCircle },
];

export function BookAppointmentPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { hospitals, loading: hospitalsLoading } = useHospitals();
  const { doctors, loading: doctorsLoading, fetchDoctors } = useDoctors(undefined, true);
  const { createAppointment } = useAppointments();
  const { user } = useAuth();
  const patientId = user?.id || 'p1';
  const patientName = user?.name || 'Patient';

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Fetch doctors when hospital changes
  useEffect(() => {
    if (selectedHospital) {
      fetchDoctors();
    }
  }, [selectedHospital, fetchDoctors]);

  const hospital = hospitals.find(h => h.id === selectedHospital);

  // Filter doctors by selected hospital and department
  const hospitalDoctors = useMemo(() => {
    return doctors.filter(d => {
      // Must belong to the selected hospital
      if (d.hospital_id !== selectedHospital) return false;

      // Must have approval_status as APPROVED or ACTIVE
      if (!['APPROVED', 'ACTIVE'].includes(d.approval_status || '')) return false;

      // Must have status as 'active'
      if (d.status !== 'active') return false;

      // If department is selected, filter by it
      if (selectedDepartment) {
        const hosp = hospitals.find(h => h.id === selectedHospital);
        const deptObj = (hosp?.departments || []).find((dep: any) => dep.id === selectedDepartment);
        if (deptObj && d.specialization) {
          // Match specialization to department name
          const specLower = d.specialization.toLowerCase();
          const deptLower = deptObj.name.toLowerCase();
          if (!specLower.includes(deptLower) && !deptLower.includes(specLower)) {
            // Check if department field matches
            if (d.department && !d.department.toLowerCase().includes(deptLower)) {
              return false;
            }
          }
        }
      }
      return true;
    });
  }, [doctors, selectedHospital, selectedDepartment, hospitals]);
  const doctor = doctors.find(d => d.id === selectedDoctor);

  const { slots, loading: slotsLoading } = useTimeSlots(selectedDoctor, selectedDate);

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!selectedHospital;
      case 1: return !!selectedDepartment;
      case 2: return !!selectedDoctor;
      case 3: return !!selectedDate;
      case 4: return !!selectedSlot;
      default: return true;
    }
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Confirm booking via atomic RPC — prevents double-booking under concurrent requests
      try {
        setBookingError('');
        const slot = slots.find(s => s.id === selectedSlot);
        if (!slot || !doctor || !hospital) return;

        const { data: apptId, error: rpcError } = await supabase.rpc('book_appointment_slot', {
          p_slot_id: selectedSlot,
          p_patient_id: patientId,
          p_patient_name: patientName,
          p_patient_phone: user?.phone || null,
          p_symptoms: symptoms || null,
        });

        if (rpcError) {
          const msg = String(rpcError.message || '');
          if (msg.includes('Slot Already Allocated')) {
            setBookingError('Slot Already Allocated — this time slot was just booked by someone else. Please select a different slot.');
            setSelectedSlot('');
            setCurrentStep(4);
          } else {
            throw new Error(msg);
          }
          return;
        }
        if (!apptId) {
          setBookingError('Slot Already Allocated — please select a different slot.');
          setSelectedSlot('');
          setCurrentStep(4);
          return;
        }

        setConfirmed(true);
        setTimeout(() => navigate('/appointments'), 2000);
      } catch (err: any) {
        setBookingError(err.message || 'Failed to book appointment');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  if (confirmed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Appointment Confirmed!</h2>
          <p className="text-text-secondary">Redirecting to your appointments...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Book Appointment</h1>
        <p className="text-text-secondary mt-1">Follow the steps to book your consultation</p>
      </motion.div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 -z-10" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-primary to-primary-dark -z-10 transition-all duration-500"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = i <= currentStep;
            const isCurrent = i === currentStep;
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/30'
                    : isActive
                    ? 'bg-primary/20 text-primary'
                    : 'bg-surface shadow-neumorph text-text-secondary'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-text-secondary'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {bookingError && (
        <div className="mb-4 p-3 rounded-xl bg-danger/10 text-danger text-sm text-center">
          {bookingError}
        </div>
      )}

      {/* Step Content */}
      <NeumorphCard>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-text-primary">{t('appointment.selectHospital')}</h3>
                {hospitalsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                    <p className="text-text-secondary text-sm">Loading hospitals...</p>
                  </div>
                ) : hospitals.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 text-text-secondary/40 mx-auto mb-3" />
                    <p className="text-text-primary font-medium">No hospitals available</p>
                    <p className="text-text-secondary text-sm mt-1">Please check back later.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {hospitals.map(h => (
                      <button
                        key={h.id}
                        onClick={() => { setSelectedHospital(h.id); setSelectedDepartment(''); setSelectedDoctor(''); }}
                        className={`p-4 rounded-2xl text-left transition-all ${
                          selectedHospital === h.id
                            ? 'bg-primary/10 ring-2 ring-primary/30 shadow-neumorph-inset'
                            : 'bg-surface shadow-neumorph hover:shadow-neumorph-hover'
                        }`}
                      >
                        <h4 className="font-semibold text-text-primary">{h.name}</h4>
                        <p className="text-xs text-text-secondary mt-1">{h.address}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-xs text-primary font-medium">{(h.departments || []).length || 6} departments</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentStep === 1 && hospital && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-text-primary">{t('appointment.selectDepartment')}</h3>
                {(hospital.departments || []).length === 0 ? (
                  <div className="text-center py-12">
                    <Stethoscope className="w-12 h-12 text-text-secondary/40 mx-auto mb-3" />
                    <p className="text-text-primary font-medium">No departments available</p>
                    <p className="text-text-secondary text-sm mt-1">Please select another hospital.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {(hospital.departments || []).map((dept: any) => (
                      <button
                        key={dept.id}
                        onClick={() => { setSelectedDepartment(dept.id); setSelectedDoctor(''); }}
                        className={`p-4 rounded-2xl text-left transition-all ${
                          selectedDepartment === dept.id
                            ? 'bg-primary/10 ring-2 ring-primary/30 shadow-neumorph-inset'
                            : 'bg-surface shadow-neumorph hover:shadow-neumorph-hover'
                        }`}
                      >
                        <h4 className="font-semibold text-text-primary">{dept.name}</h4>
                        <p className="text-xs text-text-secondary mt-1">{dept.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-text-primary">{t('appointment.selectDoctor')}</h3>
                {doctorsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                    <p className="text-text-secondary text-sm">Loading doctors...</p>
                  </div>
                ) : hospitalDoctors.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-12 h-12 text-text-secondary/40 mx-auto mb-3" />
                    <p className="text-text-primary font-medium">No doctors available</p>
                    <p className="text-text-secondary text-sm mt-1">
                      {selectedDepartment
                        ? 'No doctors found for this department. Try another department.'
                        : 'No approved doctors found in this hospital.'}
                    </p>
                    <p className="text-xs text-text-secondary mt-4">
                      Tip: Select "All Departments" to see all available doctors.
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {hospitalDoctors.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDoctor(doc.id)}
                        className={`p-4 rounded-2xl text-left transition-all ${
                          selectedDoctor === doc.id
                            ? 'bg-primary/10 ring-2 ring-primary/30 shadow-neumorph-inset'
                            : 'bg-surface shadow-neumorph hover:shadow-neumorph-hover'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold shadow-md">
                            {doc.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-text-primary truncate">Dr. {doc.name}</h4>
                            <p className="text-xs text-text-secondary">{doc.specialization}</p>
                            <p className="text-xs text-text-secondary">{doc.experience || 0} years experience</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                          <p className="text-sm text-primary font-bold">₹{doc.consultation_fee || 0}</p>
                          <span className="text-xs text-success font-medium bg-success/10 px-2 py-1 rounded-full">Available</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-text-primary">{t('appointment.selectDate')}</h3>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 14 }).map((_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const dateStr = date.toISOString().split('T')[0];
                    const isSelected = selectedDate === dateStr;
                    const isToday = i === 0;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`p-3 rounded-xl text-center transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/30'
                            : 'bg-surface shadow-neumorph hover:shadow-neumorph-hover text-text-primary'
                        }`}
                      >
                        <span className="text-xs font-medium">{date.toLocaleDateString('en', { weekday: 'short' })}</span>
                        <p className="text-lg font-bold">{date.getDate()}</p>
                        {isToday && <span className="text-[10px]">Today</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-text-primary">{t('appointment.selectSlot')}</h3>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {slots.map(slot => {
                      const booked = slot.is_booked || slot.is_locked;
                      return (
                        <button
                          key={slot.id}
                          onClick={() => !booked ? setSelectedSlot(slot.id) : undefined}
                          disabled={!!booked}
                          title={booked ? t('appointment.slotAllocated') : `Book ${slot.start_time}`}
                          className={`p-3 rounded-xl text-center transition-all relative ${
                            selectedSlot === slot.id
                              ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/30'
                              : booked
                              ? 'bg-danger/10 text-danger cursor-not-allowed opacity-70'
                              : 'bg-surface shadow-neumorph hover:shadow-neumorph-hover text-text-primary'
                          }`}
                        >
                          <span className="text-sm font-semibold block">{slot.start_time}</span>
                          {booked && <span className="text-[9px] block mt-0.5">Allocated</span>}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-10 h-10 text-text-secondary mx-auto mb-3" />
                    <p className="text-text-secondary">No slots available for this date</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">{t('appointment.symptoms')} (Optional)</label>
                  <textarea
                    rows={3}
                    value={symptoms}
                    onChange={e => setSymptoms(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm resize-none"
                    placeholder="Describe your symptoms..."
                  />
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-text-primary">Confirm Appointment</h3>
                <div className="space-y-3 p-4 rounded-xl bg-surface shadow-neumorph-inset">
                  <SummaryRow icon={Building2} label="Hospital" value={hospital?.name || ''} />
                  <SummaryRow icon={Stethoscope} label="Department" value={(hospital?.departments || []).find((d: any) => d.id === selectedDepartment)?.name || ''} />
                  <SummaryRow icon={User} label="Doctor" value={doctor?.name || ''} />
                  <SummaryRow icon={CalendarDays} label="Date" value={selectedDate} />
                  <SummaryRow icon={Clock} label="Time" value={slots.find(s => s.id === selectedSlot)?.start_time || ''} />
                  {symptoms && <SummaryRow icon={FileText} label="Symptoms" value={symptoms} />}
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 text-warning text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Please arrive 15 minutes before your appointment</span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <GradientButton onClick={handleNext} disabled={!canProceed()}>
            {currentStep === steps.length - 1 ? 'Confirm Appointment' : 'Continue'}
            <ChevronRight className="w-4 h-4" />
          </GradientButton>
        </div>
      </NeumorphCard>
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-text-secondary" />
      <span className="text-sm text-text-secondary w-24">{label}</span>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  );
}
