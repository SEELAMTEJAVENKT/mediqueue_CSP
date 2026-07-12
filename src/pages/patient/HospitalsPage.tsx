import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Filter, Phone, Clock, Shield, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { NeumorphCard } from '../../components/ui/NeumorphCard';
import { useHospitals } from '../../hooks/useHospitals';
import { useHospitalDepartments } from '../../hooks/useHospitalDepartments';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export function HospitalsPage() {
  const { t } = useLanguage();
  const { hospitals, loading, error } = useHospitals();
  const { info: deptInfo } = useHospitalDepartments(hospitals.map(h => h.id));
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [minRating, setMinRating] = useState(0);

  const allSpecialties = useMemo(() => {
    const set = new Set<string>();
    hospitals.forEach(h => h.specialties?.forEach(s => set.add(s)));
    return Array.from(set).sort();
  }, [hospitals]);

  const filtered = useMemo(() => {
    return hospitals.filter(h => {
      const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.address.toLowerCase().includes(search.toLowerCase());
      const matchSpecialty = !selectedSpecialty || h.specialties?.includes(selectedSpecialty);
      const matchRating = (h.rating || 0) >= minRating;
      return matchSearch && matchSpecialty && matchRating;
    });
  }, [hospitals, search, selectedSpecialty, minRating]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSkeleton lines={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-4 rounded-xl bg-danger/10 text-danger text-center">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">{t('nav.hospitals')}</h1>
        <p className="text-text-secondary mt-1">Find the best hospitals near you in Visakhapatnam</p>
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
              placeholder="Search hospitals..."
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
            className="p-4 rounded-xl bg-surface shadow-neumorph"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Specialty</label>
                <select
                  value={selectedSpecialty}
                  onChange={e => setSelectedSpecialty(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm"
                >
                  <option value="">All Specialties</option>
                  {allSpecialties.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Min Rating: {minRating > 0 ? minRating + '+' : 'Any'}</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={minRating}
                  onChange={e => setMinRating(parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
            {(selectedSpecialty || minRating > 0) && (
              <button
                onClick={() => { setSelectedSpecialty(''); setMinRating(0); }}
                className="mt-3 flex items-center gap-1 text-xs text-danger hover:underline"
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Results */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((hospital, i) => (
          <motion.div
            key={hospital.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to={`/hospitals/${hospital.id}`}>
              <NeumorphCard className="group h-full overflow-hidden">
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
                    <span className="text-xs text-text-secondary">({hospital.review_count || 0})</span>
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

                <div className="flex flex-wrap gap-1.5">
                  {hospital.specialties?.slice(0, 4).map((spec, j) => (
                    <span key={j} className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-medium">
                      {spec}
                    </span>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-text-secondary">
                    {(() => {
                      const di = deptInfo[hospital.id];
                      const n = di?.department_count ?? 0;
                      return `${n} Department${n === 1 ? '' : 's'}`;
                    })()}
                  </span>
                  <span className="text-xs text-primary font-medium group-hover:translate-x-1 transition-transform">
                    View Details →
                  </span>
                </div>
              </NeumorphCard>
            </Link>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <p className="text-text-secondary">{t('common.noData')}</p>
        </div>
      )}
    </div>
  );
}
