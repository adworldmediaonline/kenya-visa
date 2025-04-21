'use client';

import { Card } from '@/components/ui/card';
import { useFormContext } from '@/providers/FormProvider';
import VisaDetailsForm from './VisaDetailsForm';
import ArrivalInfoForm from './ArrivalInfoForm';
import PersonalInfoForm from './PersonalInfoForm';
import PassportInfoForm from './PassportInfoForm';
import AdditionalApplicantsForm from './AdditionalApplicantsForm';
import ReviewForm from './ReviewForm';
import AttachmentsForm from './AttachmentsForm';
import PaymentForm from './PaymentForm';
import ConfirmationPage from './ConfirmationPage';
import DeclarationForm from './DeclarationForm';

interface MultiStepFormProps {
  title: string;
  description: string;
}

export default function MultiStepForm({
  title,
  description,
}: MultiStepFormProps) {
  const { currentStep } = useFormContext();

  const steps = [
    { id: 'visa-details', label: 'Visa Details' },
    { id: 'arrival-info', label: 'Arrival Information' },
    { id: 'personal-info', label: 'Personal Information' },
    { id: 'passport-info', label: 'Passport Information' },
    { id: 'additional-applicants', label: 'Additional Applicants' },
    { id: 'declaration', label: 'Declaration' },
    { id: 'review', label: 'Review' },
    { id: 'attachments', label: 'Attachments' },
    // { id: 'payment', label: 'Payment' },
    // { id: 'confirmation', label: 'Confirmation' },
  ];

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${index === steps.length - 1 ? '' : 'flex-1'
                  }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep === step.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/30 text-muted-foreground'
                    }`}
                >
                  {index + 1}
                </div>
                <span className="text-xs mt-1 text-center hidden sm:block">
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          <div className="relative flex h-2 mt-2">
            {steps.slice(0, -1).map((_, index) => (
              <div
                key={index}
                className={`flex-1 ${steps.findIndex(s => s.id === currentStep) > index
                  ? 'bg-primary'
                  : 'bg-muted'
                  }`}
              />
            ))}
          </div>
        </div>

        <Card className="p-6">
          {currentStep === 'visa-details' && <VisaDetailsForm />}
          {currentStep === 'arrival-info' && <ArrivalInfoForm />}
          {currentStep === 'personal-info' && <PersonalInfoForm />}
          {currentStep === 'passport-info' && <PassportInfoForm />}
          {currentStep === 'additional-applicants' && (
            <AdditionalApplicantsForm />
          )}
          {currentStep === 'declaration' && <DeclarationForm />}
          {currentStep === 'review' && <ReviewForm />}
          {currentStep === 'attachments' && <AttachmentsForm />}
          {currentStep === 'payment' && <PaymentForm />}
          {currentStep === 'confirmation' && <ConfirmationPage />}
        </Card>
      </div>
    </div>
  );
}
