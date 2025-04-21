import MainLayout from '@/components/layout/MainLayout';
import HeroBanner from '@/components/home/HeroBanner';
import EligibleCountries from '@/components/home/EligibleCountries';
import MustVisitDestinations from '@/components/home/MustVisitDestinations';
import VisaProcess from '@/components/home/VisaProcess';
import AboutEgypt from '@/components/home/AboutEgypt';

export default function HomePage() {
  return (
    <MainLayout>
      <HeroBanner />
      <AboutEgypt />
      <MustVisitDestinations />
      <VisaProcess />
      <EligibleCountries />
    </MainLayout>
  );
}
