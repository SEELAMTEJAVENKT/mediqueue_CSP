import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CalendarPlus, ScanLine, MapPin, Activity, Users, BarChart3 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { NeumorphCard } from '../ui/NeumorphCard';

const services = [
  {
    icon: CalendarPlus,
    titleKey: 'services.appointmentBooking',
    descKey: 'services.appointmentBookingDesc',
    path: '/appointments',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: ScanLine,
    titleKey: 'services.aiReportScanner',
    descKey: 'services.aiReportScannerDesc',
    path: '/reports',
    color: 'bg-secondary/20 text-emerald-600',
  },
  {
    icon: MapPin,
    titleKey: 'services.hospitalFinder',
    descKey: 'services.hospitalFinderDesc',
    path: '/hospitals',
    color: 'bg-warning/10 text-warning',
  },
  {
    icon: Activity,
    titleKey: 'services.symptomChecker',
    descKey: 'services.symptomCheckerDesc',
    path: '/symptom-checker',
    color: 'bg-danger/10 text-danger',
  },
  {
    icon: Users,
    titleKey: 'services.doctorDirectory',
    descKey: 'services.doctorDirectoryDesc',
    path: '/doctors',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: BarChart3,
    titleKey: 'services.healthDashboard',
    descKey: 'services.healthDashboardDesc',
    path: '/dashboard',
    color: 'bg-secondary/20 text-emerald-600',
  },
];

export function ServicesSection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            {t('services.title')}
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            {t('services.subtitle')}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={service.path}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link to={service.path}>
                <NeumorphCard className="h-full group">
                  <div className={`w-14 h-14 rounded-2xl ${service.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <service.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">
                    {t(service.titleKey)}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {t(service.descKey)}
                  </p>
                </NeumorphCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
