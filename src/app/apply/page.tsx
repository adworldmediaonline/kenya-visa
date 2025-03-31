import MainLayout from '@/components/layout/MainLayout';
import VisaApplication from '@/components/visa-application/VisaApplication';

export default function ApplyPage() {
  return (
    <MainLayout
      title="Apply for Ethiopia Visa - Official e-Visa Portal"
      description="Complete your Ethiopia e-Visa application online. Quick, easy and secure process."
    >
      <VisaApplication />
    </MainLayout>
  );
}
