import { motion } from 'framer-motion';
import { Star, Quote, MessageSquare } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { NeumorphCard } from '../ui/NeumorphCard';

export function TestimonialsSection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 relative">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            {t('testimonials.title')}
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Real stories from patients who transformed their healthcare experience
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <NeumorphCard className="h-full relative text-center py-16">
            <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/10" />
            <div className="w-20 h-20 mx-auto rounded-full bg-surface shadow-neumorph-inset flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No testimonials yet</h3>
            <p className="text-sm text-text-secondary max-w-xs mx-auto">
              Patient stories will appear here after appointments are completed and reviewed.
            </p>
            <div className="flex items-center justify-center gap-1 mt-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} className="w-4 h-4 text-slate-200" />
              ))}
            </div>
          </NeumorphCard>
        </motion.div>
      </div>
    </section>
  );
}
