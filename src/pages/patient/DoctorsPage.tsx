import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Star, MapPin, Clock, Filter, Award, X, Stethoscope, Building2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { NeumorphCard } from '../../components/ui/NeumorphCard';
import { useAvailableDoctors } from '../../hooks/useAvailableDoctors';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export function DoctorsPage() {
  const { t } = useLanguage();
  const { doctors, loading: doctorsLoading, error: doctorsError } = useAvailableDoctors();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [minExperience, setMinExperience] = useState(0);
  const [maxFee, setMaxFee] = useState(2000);

  const allSpecialties = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach(d => set.add(d.specialization));
    return Array.from(set).sort();
  }, [doctors]);

  const filtered = useMemo(() => {
    return doctors.filter(d => {
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
        (d.specialization || '').toLowerCase().includes(search.toLowerCase());
      const matchSpecialty = !selectedSpecialty || d.specialization === selectedSpecialty;
      const matchExperience = (d.experience || 0) >= minExperience;
      const matchFee = (d.consultation_fee || 0) <= maxFee;
      return matchSearch && matchSpecialty && matchExperience && matchFee;
    });
  }, [doctors, search, selectedSpecialty, minExperience, maxFee]);

  if (doctorsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSkeleton lines={4} />
      </div>
    );
  }

  if (doctorsError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-4 rounded-xl bg-danger/10 text-danger text-center">
          {doctorsError}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">{t('nav.doctors')}</h1>
        <p className="text-text-secondary mt-1">Find and book appointments with top specialists in Visakhapatnam</p>
      </motion.div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search doctors by name or specialty..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${
              showFilters ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-surface shadow-neumorph text-text-secondary hover:text-text-primary'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common.filter')}</span>
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 rounded-xl bg-surface shadow-neumorph space-y-4"
          >
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Specialization</label>
                <select
                  value={selectedSpecialty}
                  onChange={e => setSelectedSpecialty(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm"
                >
                  <option value="">All Specializations</option>
                  {allSpecialties.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Min Experience: {minExperience}+ yrs</label>
                <input
                  type="range" min="0" max="25" step="1"
                  value={minExperience}
                  onChange={e => setMinExperience(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Max Fee: ₹{maxFee}</label>
                <input
                  type="range" min="100" max="2000" step="50"
                  value={maxFee}
                  onChange={e => setMaxFee(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
            {(selectedSpecialty || minExperience > 0 || maxFee < 2000) && (
              <button
                onClick={() => { setSelectedSpecialty(''); setMinExperience(0); setMaxFee(2000); }}
                className="flex items-center gap-1 text-xs text-danger hover:underline"
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Results */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((doctor, i) => (
          <motion.div
            key={doctor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to={`/doctors/${doctor.id}`}>
              <NeumorphCard className="group h-full">
                <div className="relative mb-4">
                  {(doctor as any).profile_photo_url ? (
                    <img src={(doctor as any).profile_photo_url} alt={doctor.name} className="w-20 h-20 rounded-2xl object-cover shadow-lg group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-105 transition-transform">
                      {doctor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                  )}
                  {doctor.is_verified && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success flex items-center justify-center shadow-md">
                      <Award className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors mb-1">
                  {doctor.name}
                </h3>
                <div className="flex items-center gap-1.5 mb-2">
                  <Stethoscope className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm text-primary font-medium">{doctor.specialization}</span>
                </div>

                <div className="flex items-center gap-1 mb-3">
                  <Star className="w-4 h-4 text-warning fill-warning" />
                  <span className="text-sm font-semibold text-text-primary">{doctor.rating || 0}</span>
                  <span className="text-xs text-text-secondary">({doctor.review_count || 0} reviews)</span>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate">{(doctor as any).hospital_name || '—'}</span>
                  </div>
                  {doctor.department && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Stethoscope className="w-3 h-3" />
                      <span className="truncate">{doctor.department}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Clock className="w-3 h-3" />
                    <span>{doctor.experience || 0} years experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-success font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{(doctor as any).available_slot_count} available slot{(doctor as any).available_slot_count === 1 ? '' : 's'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
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

      {filtered.length === 0 && !doctorsLoading && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <p className="text-text-secondary">No doctors available at the moment.</p>
        </div>
      )}
    </div>
  );
}
