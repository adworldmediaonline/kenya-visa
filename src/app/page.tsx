import MainLayout from '@/components/layout/MainLayout';
import HeroBanner from '@/components/home/HeroBanner';
import EligibleCountries from '@/components/home/EligibleCountries';
import MustVisitDestinations from '@/components/home/MustVisitDestinations';
import AboutKenya from '@/components/home/AboutKenya';
import VisaProcess from '@/components/home/VisaProcess';

export default function HomePage() {
  return (
    <MainLayout>
      <HeroBanner />
      <AboutKenya />
      <MustVisitDestinations />
      <VisaProcess />
      <EligibleCountries />
    </MainLayout>
  );
}
