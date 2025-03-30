import MainLayout from '@/components/layout/MainLayout';
import HeroBanner from '@/components/home/HeroBanner';
import EligibleCountries from '@/components/home/EligibleCountries';
import MustVisitDestinations from '@/components/home/MustVisitDestinations';
import AboutEthiopia from '@/components/home/AboutEthiopia';
import VisaProcess from '@/components/home/VisaProcess';

export default function HomePage() {
  return (
    <MainLayout>
      <HeroBanner />
      <AboutEthiopia />
      <MustVisitDestinations />
      <VisaProcess />
      <EligibleCountries />
    </MainLayout>
  );
}
