import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { NeumorphCard } from '../ui/NeumorphCard';
import { GradientButton } from '../ui/GradientButton';

export function ContactSection() {
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

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
            {t('contact.title')}
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Have questions? We are here to help you with your healthcare journey
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <NeumorphCard className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-1">{t('contact.address')}</h3>
                <p className="text-sm text-text-secondary">Hyderabad, Telangana, India</p>
              </div>
            </NeumorphCard>

            <NeumorphCard className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-1">{t('contact.phone')}</h3>
                <p className="text-sm text-text-secondary">+91 40 1234 5678</p>
              </div>
            </NeumorphCard>

            <NeumorphCard className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-1">{t('contact.email')}</h3>
                <p className="text-sm text-text-secondary">support@mediqueue.com</p>
              </div>
            </NeumorphCard>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <NeumorphCard>
              {sent ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">Message Sent!</h3>
                  <p className="text-sm text-text-secondary">We will get back to you soon.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">{t('contact.name')}</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none focus:ring-2 focus:ring-primary/30 text-text-primary text-sm"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">{t('contact.email')}</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none focus:ring-2 focus:ring-primary/30 text-text-primary text-sm"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">{t('contact.phone')}</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none focus:ring-2 focus:ring-primary/30 text-text-primary text-sm"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">{t('contact.message')}</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none focus:ring-2 focus:ring-primary/30 text-text-primary text-sm resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>
                  <GradientButton type="submit" className="w-full justify-center">
                    <Send className="w-4 h-4" />
                    {t('contact.send')}
                  </GradientButton>
                </form>
              )}
            </NeumorphCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
