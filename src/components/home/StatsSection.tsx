import { motion } from 'framer-motion';
import { Users, Stethoscope, Building2, CalendarCheck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { AnimatedCounter } from '../ui/AnimatedCounter';

const stats = [
  { icon: Users, value: 50000, suffix: '+', labelKey: 'stats.patients', color: 'from-primary to-primary-dark' },
  { icon: Stethoscope, value: 500, suffix: '+', labelKey: 'stats.doctors', color: 'from-secondary to-secondary-dark' },
  { icon: Building2, value: 100, suffix: '+', labelKey: 'stats.hospitals', color: 'from-warning to-orange-500' },
  { icon: CalendarCheck, value: 250000, suffix: '+', labelKey: 'stats.appointments', color: 'from-success to-emerald-600' },
];

export function StatsSection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.labelKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg mb-5`}>
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-sm text-text-secondary font-medium">{t(stat.labelKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
