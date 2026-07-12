import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, MapPin, Phone, ChevronRight, Clock, Shield } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { NeumorphCard } from '../ui/NeumorphCard';
import { useHospitals } from '../../hooks/useHospitals';
import { useHospitalDepartments } from '../../hooks/useHospitalDepartments';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';

export function HospitalsSection() {
  const { t } = useLanguage();
  const { hospitals, loading, error } = useHospitals();
  const { info: deptInfo } = useHospitalDepartments(hospitals.map(h => h.id));

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

  const topHospitals = hospitals.slice(0, 3);

  return (
    <section className="py-20 relative">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
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
              Top Hospitals
            </h2>
            <p className="text-text-secondary">
              Leading healthcare institutions with world-class facilities
            </p>
          </div>
          <Link
            to="/hospitals"
            className="hidden sm:inline-flex items-center gap-1 text-primary font-medium hover:gap-2 transition-all"
          >
            {t('common.seeAll')}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topHospitals.map((hospital, i) => (
            <motion.div
              key={hospital.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link to={`/hospitals/${hospital.id}`}>
                <NeumorphCard className="group h-full overflow-hidden">
                  {/* Image */}
                  <div className="relative -mx-6 -mt-6 mb-5 h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                    {hospital.images && hospital.images.length > 0 ? (
                      <img
                        src={hospital.images[0]}
                        alt={hospital.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Shield className="w-16 h-16 text-primary/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {hospital.emergency_available && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-danger/90 text-white text-xs font-medium">
                        <Shield className="w-3 h-3" />
                        24/7 Emergency
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm">
                      <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                      <span className="text-xs font-bold text-text-primary">{hospital.rating || 0}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors mb-2">
                    {hospital.name}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">{hospital.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{hospital.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{hospital.open_hours}</span>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1.5">
                    {hospital.specialties?.slice(0, 3).map((spec, j) => (
                      <span
                        key={j}
                        className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                    {(hospital.specialties?.length || 0) > 3 && (
                      <span className="px-2.5 py-1 rounded-lg bg-surface text-text-secondary text-xs">
                        +{hospital.specialties!.length - 3}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-xs text-text-secondary">
                      {(() => {
                        const di = deptInfo[hospital.id];
                        const n = di?.department_count ?? 0;
                        return `${n} Department${n === 1 ? '' : 's'}`;
                      })()}
                    </span>
                  </div>
                </NeumorphCard>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/hospitals"
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
