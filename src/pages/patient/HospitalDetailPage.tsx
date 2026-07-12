import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Star, Shield, Globe, ChevronRight, Stethoscope } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { NeumorphCard } from '../../components/ui/NeumorphCard';
import { useHospitals } from '../../hooks/useHospitals';
import { useDoctors } from '../../hooks/useDoctors';
import { useHospitalDepartments } from '../../hooks/useHospitalDepartments';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export function HospitalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { hospitals, loading: hospitalsLoading } = useHospitals();
  const { doctors, loading: doctorsLoading } = useDoctors(id);
  const { info: deptInfo } = useHospitalDepartments(id ? [id] : []);

  const hospital = hospitals.find(h => h.id === id);

  if (hospitalsLoading || doctorsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-text-secondary">Hospital not found</p>
      </div>
    );
  }

  const departments = hospital.departments || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative rounded-3xl overflow-hidden mb-8 h-64 sm:h-80 bg-gradient-to-br from-primary/30 to-secondary/30">
          {hospital.images && hospital.images.length > 0 ? (
            <img src={hospital.images[0]} alt={hospital.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Shield className="w-24 h-24 text-primary/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              {hospital.emergency_available && (
                <span className="px-3 py-1 rounded-full bg-danger/90 text-white text-xs font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  24/7 Emergency
                </span>
              )}
              <span className="px-3 py-1 rounded-full bg-white/90 text-text-primary text-xs font-medium flex items-center gap-1">
                <Star className="w-3 h-3 text-warning fill-warning" />
                {hospital.rating || 0} ({hospital.review_count || 0} reviews)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{hospital.name}</h1>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <NeumorphCard>
            <h2 className="text-lg font-bold text-text-primary mb-4">About</h2>
            <p className="text-sm text-text-secondary leading-relaxed">{hospital.about || 'No description available.'}</p>
          </NeumorphCard>

          <NeumorphCard>
            <h2 className="text-lg font-bold text-text-primary mb-4">{t('hospital.specialties')}</h2>
            <div className="flex flex-wrap gap-2">
              {hospital.specialties?.map((spec, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg bg-primary/5 text-primary text-sm font-medium">
                  {spec}
                </span>
              ))}
            </div>
          </NeumorphCard>

          <NeumorphCard>
            <h2 className="text-lg font-bold text-text-primary mb-4">{t('hospital.departments')}</h2>
            {(() => {
              const di = id ? deptInfo[id] : null;
              if (di && di.departments.length > 0) {
                return (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {di.departments.map((d) => (
                      <div key={d.name} className="p-3 rounded-xl bg-surface shadow-neumorph-inset">
                        <h4 className="font-semibold text-text-primary text-sm">{d.name}</h4>
                        <p className="text-xs text-text-secondary mt-1">{d.specialist_count} Specialist{d.specialist_count === 1 ? '' : 's'}</p>
                      </div>
                    ))}
                  </div>
                );
              }
              return (
                <p className="text-sm text-text-secondary text-center py-6">No departments available</p>
              );
            })()}
          </NeumorphCard>

          {/* Doctors */}
          {doctors.length > 0 && (
            <NeumorphCard>
              <h2 className="text-lg font-bold text-text-primary mb-4">Doctors at {hospital.name}</h2>
              <div className="space-y-3">
                {doctors.map(doc => (
                  <Link key={doc.id} to={`/doctors/${doc.id}`}>
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-surface shadow-neumorph-inset hover:shadow-neumorph transition-all">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                        {doc.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-text-primary text-sm">{doc.name}</h4>
                        <p className="text-xs text-text-secondary">{doc.specialization} · {doc.experience || 0} yrs</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-secondary" />
                    </div>
                  </Link>
                ))}
              </div>
            </NeumorphCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <NeumorphCard>
            <h3 className="text-base font-bold text-text-primary mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{hospital.address}</span>
              </div>
              {hospital.phone && (
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>{hospital.phone}</span>
                </div>
              )}
              {hospital.email && (
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>{hospital.email}</span>
                </div>
              )}
              {hospital.website && (
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <Globe className="w-4 h-4 text-primary" />
                  <span>{hospital.website}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <Clock className="w-4 h-4 text-primary" />
                <span>{hospital.open_hours}</span>
              </div>
            </div>
          </NeumorphCard>

          <NeumorphCard>
            <h3 className="text-base font-bold text-text-primary mb-4">{t('hospital.facilities')}</h3>
            <div className="flex flex-wrap gap-2">
              {hospital.facilities?.map((f, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-secondary/10 text-emerald-600 text-xs font-medium">
                  {f}
                </span>
              ))}
            </div>
          </NeumorphCard>

          <Link to="/appointments/book">
            <button className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-xl transition-all">
              <Stethoscope className="w-4 h-4 inline mr-2" />
              Book Appointment
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
