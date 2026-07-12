import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MapPin, Clock, Award, ChevronRight, CalendarPlus, Stethoscope } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { NeumorphCard } from '../../components/ui/NeumorphCard';
import { useDoctor } from '../../hooks/useDoctors';
import { useHospitals } from '../../hooks/useHospitals';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { doctor, loading: doctorLoading } = useDoctor(id);
  const { hospitals } = useHospitals();

  const hospital = hospitals.find(h => h.id === doctor?.hospital_id);

  if (doctorLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-text-secondary">Doctor not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header Card */}
        <NeumorphCard className="mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0">
              {doctor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-text-primary">{doctor.name}</h1>
                {doctor.is_verified && (
                  <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                    <Award className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <p className="text-primary font-medium">{doctor.specialization}</p>
              <p className="text-sm text-text-secondary mt-1">{doctor.qualification}</p>

              <div className="flex flex-wrap items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-warning fill-warning" />
                  <span className="text-sm font-semibold text-text-primary">{doctor.rating || 0}</span>
                  <span className="text-xs text-text-secondary">({doctor.review_count || 0})</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-text-secondary">
                  <Clock className="w-4 h-4" />
                  <span>{doctor.experience || 0} {t('doctor.experience')}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-text-secondary">
                  <MapPin className="w-4 h-4" />
                  <span>{hospital?.name || 'Unknown Hospital'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <div className="text-right">
                <p className="text-2xl font-bold text-text-primary">₹{doctor.consultation_fee || 0}</p>
                <p className="text-xs text-text-secondary">{t('doctor.consultationFee')}</p>
              </div>
              <Link to="/appointments/book">
                <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-xl transition-all">
                  <CalendarPlus className="w-4 h-4 inline mr-2" />
                  {t('doctor.bookAppointment')}
                </button>
              </Link>
            </div>
          </div>
        </NeumorphCard>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <NeumorphCard>
            <h2 className="text-lg font-bold text-text-primary mb-3">About</h2>
            <p className="text-sm text-text-secondary leading-relaxed">{doctor.about || 'No description available.'}</p>
          </NeumorphCard>

          <NeumorphCard>
            <h2 className="text-lg font-bold text-text-primary mb-3">Languages</h2>
            <div className="flex flex-wrap gap-2">
              {doctor.languages?.map((lang, i) => (
                <span key={i} className="px-3 py-1 rounded-lg bg-primary/5 text-primary text-sm font-medium">
                  {lang}
                </span>
              ))}
            </div>
          </NeumorphCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <NeumorphCard>
            <h3 className="text-base font-bold text-text-primary mb-3">Hospital</h3>
            {hospital && (
              <Link to={`/hospitals/${hospital.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface shadow-neumorph-inset hover:shadow-neumorph transition-all">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{hospital.name}</p>
                    <p className="text-xs text-text-secondary">{hospital.address}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-secondary" />
                </div>
              </Link>
            )}
          </NeumorphCard>
        </div>
      </div>
    </div>
  );
}
