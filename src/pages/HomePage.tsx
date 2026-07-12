import { HeroSection } from '../components/home/HeroSection';
import { ServicesSection } from '../components/home/ServicesSection';
import { AIScannerSection } from '../components/home/AIScannerSection';
import { DoctorsSection } from '../components/home/DoctorsSection';
import { HospitalsSection } from '../components/home/HospitalsSection';
import { HowItWorksSection } from '../components/home/HowItWorksSection';
import { TestimonialsSection } from '../components/home/TestimonialsSection';
import { StatsSection } from '../components/home/StatsSection';
import { ContactSection } from '../components/home/ContactSection';

export function HomePage() {
  return (
    <div>
      <HeroSection />
      <ServicesSection />
      <AIScannerSection />
      <DoctorsSection />
      <HospitalsSection />
      <HowItWorksSection />
      <StatsSection />
      <TestimonialsSection />
      <ContactSection />
    </div>
  );
}
