import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, MapPin, Clock, ChevronRight, Award } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { NeumorphCard } from '../ui/NeumorphCard';
import { useDoctors } from '../../hooks/useDoctors';
import { useHospitals } from '../../hooks/useHospitals';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';

export function DoctorsSection() {
  const { t } = useLanguage();
  const { doctors, loading, error } = useDoctors();
  const { hospitals } = useHospitals();

  const getHospitalName = (hospitalId: string | null) => {
    return hospitals.find(h => h.id === hospitalId)?.name || '';
  };

  if (loading) {
    return (
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSkeleton lines={4} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-4 rounded-xl bg-danger/10 text-danger text-center">{error}</div>
        </div>
      </section>
    );
  }

  const topDoctors = doctors.slice(0, 4);

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">
              Top Doctors
            </h2>
            <p className="text-text-secondary">
              Verified specialists with excellent patient reviews
            </p>
          </div>
          <Link
            to="/doctors"
            className="hidden sm:inline-flex items-center gap-1 text-primary font-medium hover:gap-2 transition-all"
          >
            {t('common.seeAll')}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topDoctors.map((doctor, i) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link to={`/doctors/${doctor.id}`}>
                <NeumorphCard className="group h-full">
                  {/* Avatar */}
                  <div className="relative mb-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-105 transition-transform">
                      {doctor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    {doctor.is_verified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success flex items-center justify-center shadow-md">
                        <Award className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors mb-1">
                    {doctor.name}
                  </h3>
                  <p className="text-sm text-primary font-medium mb-2">{doctor.specialization}</p>

                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <span className="text-sm font-semibold text-text-primary">{doctor.rating || 0}</span>
                    <span className="text-xs text-text-secondary">({doctor.review_count || 0})</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{getHospitalName(doctor.hospital_id)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Clock className="w-3 h-3" />
                      <span>{doctor.experience || 0} {t('doctor.experience')}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-text-primary">₹{doctor.consultation_fee || 0}</span>
                    <span className="text-xs text-primary font-medium group-hover:translate-x-1 transition-transform">
                      {t('common.bookNow')} →
                    </span>
                  </div>
                </NeumorphCard>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/doctors"
            className="inline-flex items-center gap-1 text-primary font-medium"
          >
            {t('common.seeAll')}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
