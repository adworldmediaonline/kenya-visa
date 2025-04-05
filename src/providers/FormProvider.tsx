'use client';

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

export type FormStep =
  | 'visa-details'
  | 'arrival-info'
  | 'personal-info'
  | 'passport-info'
  | 'additional-applicants'
  | 'review'
  | 'attachments'
  | 'payment'
  | 'confirmation';

export interface FormData {
  [key: string]: unknown;
}

interface FormContextType {
  currentStep: FormStep;
  setCurrentStep: (step: FormStep) => void;
  formId: string | null;
  setFormId: (id: string) => void;
  emailAddress: string;
  setEmailAddress: (email: string) => void;
  formData: FormData;
  updateFormData: (stepName: string, data: unknown) => void;
  isCompleted: Record<FormStep, boolean>;
  markStepCompleted: (step: FormStep) => void;
  completedSteps: FormStep[];
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
}

export default function FormProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState<FormStep>('visa-details');
  const [formId, setFormId] = useState<string | null>(null);
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({});
  const [isCompleted, setIsCompleted] = useState<Record<FormStep, boolean>>({
    'visa-details': false,
    'arrival-info': false,
    'personal-info': false,
    'passport-info': false,
    'additional-applicants': false,
    review: false,
    attachments: false,
    payment: false,
    confirmation: false,
  });

  // Debug state changes
  useEffect(() => {
    const completedSteps = Object.entries(isCompleted)
      .filter(([, completed]) => completed)
      .map(([step]) => step as FormStep);

    console.log('FormProvider - formId:', formId);
    console.log('FormProvider - completedSteps:', completedSteps);
    console.log('FormProvider - isCompleted:', isCompleted);
  }, [formId, isCompleted]);

  // Load form state from localStorage on initial mount
  useEffect(() => {
    try {
      const savedFormId = localStorage.getItem('ethiopiaFormId');
      const savedEmailAddress = localStorage.getItem('ethiopiaEmailAddress');
      const savedFormData = localStorage.getItem('ethiopiaFormData');
      const savedStepCompletion = localStorage.getItem(
        'ethiopiaStepCompletion'
      );
      const savedCurrentStep = localStorage.getItem(
        'ethiopiaCurrentStep'
      ) as FormStep | null;

      console.log('Loading from localStorage:', {
        savedFormId,
        savedEmailAddress,
        savedFormData,
        savedStepCompletion,
        savedCurrentStep,
      });

      if (savedFormId) setFormId(savedFormId);
      if (savedEmailAddress) setEmailAddress(savedEmailAddress);
      if (savedFormData) setFormData(JSON.parse(savedFormData));
      if (savedStepCompletion) setIsCompleted(JSON.parse(savedStepCompletion));
      if (savedCurrentStep) setCurrentStep(savedCurrentStep);
    } catch (error) {
      console.error('Error loading form state from localStorage:', error);
      // Clear potentially corrupted data
      localStorage.removeItem('ethiopiaFormData');
      localStorage.removeItem('ethiopiaStepCompletion');
    }
  }, []);

  // Save form state to localStorage whenever it changes
  useEffect(() => {
    try {
      if (formId) {
        localStorage.setItem('ethiopiaFormId', formId);
        console.log('FormProvider - Saved formId to localStorage:', formId);
      }
      if (emailAddress)
        localStorage.setItem('ethiopiaEmailAddress', emailAddress);
      localStorage.setItem('ethiopiaFormData', JSON.stringify(formData));
      localStorage.setItem(
        'ethiopiaStepCompletion',
        JSON.stringify(isCompleted)
      );
      localStorage.setItem('ethiopiaCurrentStep', currentStep);

      console.log('Saving to localStorage:', {
        formId,
        emailAddress,
        formData,
        isCompleted,
        currentStep,
      });
    } catch (error) {
      console.error('Error saving form state to localStorage:', error);
    }
  }, [formId, emailAddress, formData, isCompleted, currentStep]);

  const updateFormData = (stepName: string, data: unknown) => {
    console.log(`FormProvider - updateFormData for step ${stepName}:`, data);
    setFormData(prev => ({
      ...prev,
      [stepName]: data,
    }));
  };

  const markStepCompleted = (step: FormStep) => {
    console.log(`FormProvider - markStepCompleted: ${step}`);
    setIsCompleted(prev => ({
      ...prev,
      [step]: true,
    }));
  };

  // Helper function to ensure formId is set
  const setFormIdWithValidation = (id: string) => {
    console.log('FormProvider - setFormId called with:', id);
    if (!id) {
      console.error('Attempted to set empty formId');
      return;
    }
    setFormId(id);
    localStorage.setItem('ethiopiaFormId', id);
  };

  return (
    <FormContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        formId,
        setFormId: setFormIdWithValidation,
        emailAddress,
        setEmailAddress,
        formData,
        updateFormData,
        isCompleted,
        markStepCompleted,
        completedSteps: Object.entries(isCompleted)
          .filter(([, completed]) => completed)
          .map(([step]) => step as FormStep),
      }}
    >
      {children}
    </FormContext.Provider>
  );
}
