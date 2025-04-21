'use client';

import MultiStepForm from './MultiStepForm';
import FormProvider, { useFormContext } from '@/providers/FormProvider';
import QueryProvider from '@/providers/QueryProvider';

// Main visa application component with wrapped providers
export default function VisaApplication() {
  return (
    <QueryProvider>
      <FormProvider>
        <VisaApplicationContent />
      </FormProvider>
    </QueryProvider>
  );
}

// Content component that needs access to context
function VisaApplicationContent() {
  const { currentStep } = useFormContext();

  // Title is constant for the application
  const title = 'Apply for Egypt Visa';

  // Description is dynamic based on current step
  let description =
    'Complete your application by filling out all required information.';

  if (currentStep === 'visa-details') {
    description = 'Start your application by providing visa details.';
  } else if (currentStep === 'arrival-info') {
    description = 'Provide information about your arrival in Ethiopia.';
  } else if (currentStep === 'personal-info') {
    description = 'Enter your personal information.';
  } else if (currentStep === 'passport-info') {
    description = 'Enter your passport details.';
  } else if (currentStep === 'additional-applicants') {
    description = 'Add or manage additional applicants traveling with you.';
  } else if (currentStep === 'declaration') {
    description = 'Review your application before submission.';
  } else if (currentStep === 'review') {
    description = 'Review your application before submission.';
  } else if (currentStep === 'attachments') {
    description = 'Upload required documents.';
  }

  return <MultiStepForm title={title} description={description} />;
}
