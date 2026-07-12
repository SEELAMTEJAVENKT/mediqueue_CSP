import { motion } from 'framer-motion';
import { UserPlus, Search, Upload, CalendarCheck, HeartPulse, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const steps = [
  { icon: UserPlus, titleKey: 'howItWorks.step1', descKey: 'howItWorks.step1Desc', color: 'from-primary to-primary-dark' },
  { icon: Search, titleKey: 'howItWorks.step2', descKey: 'howItWorks.step2Desc', color: 'from-secondary to-secondary-dark' },
  { icon: Upload, titleKey: 'howItWorks.step3', descKey: 'howItWorks.step3Desc', color: 'from-warning to-orange-500' },
  { icon: CalendarCheck, titleKey: 'howItWorks.step4', descKey: 'howItWorks.step4Desc', color: 'from-success to-emerald-600' },
  { icon: HeartPulse, titleKey: 'howItWorks.step5', descKey: 'howItWorks.step5Desc', color: 'from-primary to-secondary' },
];

export function HowItWorksSection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 relative overflow-hidden">
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
            {t('howItWorks.title')}
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Get started with MediQueue in just a few simple steps
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-secondary/30 to-primary/20" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.titleKey}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative"
              >
                <div className="text-center">
                  {/* Step Number & Icon */}
                  <div className="relative inline-flex mb-6">
                    <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg shadow-primary/20`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-surface shadow-neumorph flex items-center justify-center text-sm font-bold text-primary">
                      {i + 1}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-text-primary mb-2">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {t(step.descKey)}
                  </p>
                </div>

                {/* Arrow - Mobile/Tablet */}
                {i < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center mt-4">
                    <ArrowRight className="w-5 h-5 text-primary/40 rotate-90 sm:rotate-0" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
