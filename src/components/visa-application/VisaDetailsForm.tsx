'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFormContext } from '@/providers/FormProvider';
import { visaApi } from '@/lib/api/endpoints';
import { Loader2 } from 'lucide-react';

// Define the form schema with Zod
const visaDetailsSchema = z
  .object({
    emailAddress: z.string().email('Please enter a valid email address'),
    visaType: z.string().min(1, 'Please select a visa type'),
    visaValidity: z.string().min(1, 'Please select a visa validity')
  });

type VisaDetailsFormValues = z.infer<typeof visaDetailsSchema>;

export default function VisaDetailsForm() {
  const {
    emailAddress,
    formId,
    setEmailAddress,
    setFormId,
    updateFormData,
    markStepCompleted,
    setCurrentStep,
    completedSteps,
  } = useFormContext();

  // Initialize the form
  const form = useForm<VisaDetailsFormValues>({
    resolver: zodResolver(visaDetailsSchema),
    defaultValues: {
      emailAddress: emailAddress || '',
      visaType: '',
      visaValidity: ''
    },
  });

  // Fetch visa types and prices
  const { data: visaTypesData, isLoading: isLoadingVisaTypes } = useQuery({
    queryKey: ['visaTypesAndPrices'],
    queryFn: visaApi.getVisaTypes,
  });

  // Determine if this is an update operation
  const isUpdate = !!formId && completedSteps.includes('visa-details');

  console.log('VisaDetailsForm - formId:', formId);
  console.log('VisaDetailsForm - completedSteps:', completedSteps);
  console.log('VisaDetailsForm - isUpdate:', isUpdate);

  // Fetch the complete visa application if we have a formId
  const { data: applicationData, isLoading: isLoadingApplication } = useQuery({
    queryKey: ['visa-application', formId],
    queryFn: () => {
      if (!formId) throw new Error('Form ID is required');
      console.log('Fetching application data for formId:', formId);
      return visaApi.getVisaApplication(formId);
    },
    enabled: !!formId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update form values when application data is loaded
  useEffect(() => {
    console.log('VisaDetailsForm - applicationData:', applicationData);
    if (applicationData && applicationData.visaDetails) {
      const visaDetails = applicationData.visaDetails;
      console.log('Resetting form with data:', {
        emailAddress: applicationData.emailAddress || '',
        visaType: visaDetails.visaType || '',
        visaValidity: visaDetails.visaValidity || '',
        companyReferenceNumber: visaDetails.companyReferenceNumber || '',
      });

      // Use setTimeout to ensure the reset happens after the form is fully initialized
      setTimeout(() => {
        form.reset({
          emailAddress: applicationData.emailAddress || '',
          visaType: visaDetails.visaType || '',
          visaValidity: visaDetails.visaValidity || ''
        });
      }, 0);
    }
  }, [applicationData, form]);

  // Define the submit mutation
  const mutation = useMutation({
    mutationFn: async (values: VisaDetailsFormValues) => {
      if (isUpdate) {
        // Update existing visa details
        console.log(
          'VisaDetailsForm - Updating visa details with formId:',
          formId
        );
        const response = await visaApi.updateVisaDetails(formId!, values);
        return { application: { _id: formId }, details: response };
      } else {
        // Create new visa details
        console.log('VisaDetailsForm - Creating new visa details');
        const response = await visaApi.createVisaDetails(values);
        return response;
      }
    },
    onSuccess: (data: {
      application: { _id: string };
      details: VisaDetailsFormValues;
    }) => {
      // Store formId in context and localStorage
      console.log(
        'VisaDetailsForm - Mutation success, setting formId:',
        data.application._id
      );
      if (!data.application?._id) {
        console.error('VisaDetailsForm - No _id found in response:', data);
        return;
      }

      setFormId(data.application._id);
      // Update form data in context
      updateFormData('visa-details', form.getValues());
      // Mark step as completed
      markStepCompleted('visa-details');
      // Move to next step
      setCurrentStep('arrival-info');
    },
    onError: error => {
      console.error('VisaDetailsForm - Mutation error:', error);
      alert(
        'An error occurred while saving your visa details. Please try again.'
      );
    },
  });

  // Get the selected visa type to determine validities
  const selectedVisaType = form.watch('visaType');
  const selectedVisaTypeData = visaTypesData?.visaTypes?.find(
    (type: { name: string }) => type.name === selectedVisaType
  );

  // Update email in context when it changes in the form
  useEffect(() => {
    const subscription = form.watch(value => {
      if (value.emailAddress) {
        setEmailAddress(value.emailAddress);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, setEmailAddress, form]);

  // Handle form submission
  function onSubmit(values: VisaDetailsFormValues) {
    mutation.mutate(values);
  }

  // Show loading state while fetching existing data
  if (isLoadingApplication && isUpdate) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading your information...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Visa Details</h2>
          <p className="text-muted-foreground">
            Please provide your email address and select your visa type
          </p>
        </div>

        <FormField
          control={form.control}
          name="emailAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visaType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Visa Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isLoadingVisaTypes}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingVisaTypes ? 'Loading...' : 'Select visa type'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingVisaTypes ? (
                    <SelectItem value="loading" disabled>
                      Loading visa types...
                    </SelectItem>
                  ) : !visaTypesData?.visaTypes ||
                    visaTypesData.visaTypes.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      No visa types available
                    </SelectItem>
                  ) : (
                    visaTypesData.visaTypes.map((type: { name: string }) => (
                      <SelectItem key={type.name} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedVisaType && (
          <FormField
            control={form.control}
            name="visaValidity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visa Validity</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select visa validity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {selectedVisaTypeData?.validities.map(
                      (validity: { type: string; price: number }) => (
                        <SelectItem key={validity.type} value={validity.type}>
                          {validity.type} - ${validity.price}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? 'Submitting...'
              : isUpdate
                ? 'Update & Continue'
                : 'Next'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
