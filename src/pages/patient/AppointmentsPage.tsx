import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CalendarPlus, CalendarDays, Clock, MapPin, Stethoscope,
  XCircle, RotateCcw, Download, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { NeumorphCard } from '../../components/ui/NeumorphCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { GradientButton } from '../../components/ui/GradientButton';
import { useAppointments } from '../../hooks/useAppointments';
import { useDoctors } from '../../hooks/useDoctors';
import { useHospitals } from '../../hooks/useHospitals';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { AppointmentStatus } from '../../types';

export function AppointmentsPage() {
  const { t } = useLanguage();
  const { appointments, loading, error, updateAppointment } = useAppointments();
  const { doctors } = useDoctors();
  const { hospitals } = useHospitals();
  const [filter, setFilter] = useState<AppointmentStatus | 'all'>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return appointments;
    return appointments.filter(a => a.status === filter);
  }, [appointments, filter]);

  const getDoctorName = (id: string | null) => doctors.find(d => d.id === id)?.name || 'Unknown';
  const getDoctorSpecialty = (id: string | null) => doctors.find(d => d.id === id)?.specialization || '';
  const getHospitalName = (id: string | null) => hospitals.find(h => h.id === id)?.name || 'Unknown';

  const filters: { value: AppointmentStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const handleCancel = async (id: string) => {
    try {
      await updateAppointment(id, { status: 'cancelled' });
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSkeleton lines={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="p-4 rounded-xl bg-danger/10 text-danger text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">{t('nav.appointments')}</h1>
            <p className="text-text-secondary mt-1">Manage your appointments</p>
          </div>
          <Link to="/appointments/book">
            <GradientButton>
              <CalendarPlus className="w-4 h-4" />
              Book New
            </GradientButton>
          </Link>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === f.value
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-surface shadow-neumorph text-text-secondary hover:text-text-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filtered.map((appt, i) => (
          <motion.div
            key={appt.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <NeumorphCard>
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Doctor Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-lg font-bold shadow-lg">
                    {getDoctorName(appt.doctor_id).split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-primary">{getDoctorName(appt.doctor_id)}</h3>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>{getDoctorSpecialty(appt.doctor_id)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{getHospitalName(appt.hospital_id)}</span>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-center gap-6 lg:justify-center">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <CalendarDays className="w-4 h-4" />
                    <span>{appt.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Clock className="w-4 h-4" />
                    <span>{appt.start_time} - {appt.end_time}</span>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3 lg:justify-end">
                  <StatusBadge status={appt.status as any} />
                  <div className="flex gap-2">
                    {appt.status === 'confirmed' && (
                      <>
                        <button className="p-2 rounded-lg bg-surface shadow-neumorph hover:shadow-neumorph-hover text-text-secondary hover:text-primary transition-all" title="Reschedule">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancel(appt.id)}
                          className="p-2 rounded-lg bg-surface shadow-neumorph hover:shadow-neumorph-hover text-text-secondary hover:text-danger transition-all"
                          title="Cancel"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {appt.status === 'completed' && (
                      <button className="p-2 rounded-lg bg-surface shadow-neumorph hover:shadow-neumorph-hover text-text-secondary hover:text-primary transition-all" title="Download Receipt">
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {appt.symptoms && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-text-secondary mt-0.5" />
                    <p className="text-sm text-text-secondary"><span className="font-medium">Symptoms:</span> {appt.symptoms}</p>
                  </div>
                </div>
              )}
            </NeumorphCard>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <p className="text-text-secondary mb-4">{t('common.noData')}</p>
          <Link to="/appointments/book">
            <GradientButton>
              <CalendarPlus className="w-4 h-4" />
              Book Appointment
            </GradientButton>
          </Link>
        </div>
      )}
    </div>
  );
}
