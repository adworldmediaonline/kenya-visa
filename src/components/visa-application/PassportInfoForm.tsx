'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useFormContext } from '@/providers/FormProvider';
import { visaApi } from '@/lib/api/endpoints';

// Define the form schema with Zod
const passportInfoSchema = z.object({
  passportNumber: z.string().min(1, 'Passport number is required'),
  issueDate: z.date({
    required_error: 'Issue date is required',
  }),
  expiryDate: z
    .date({
      required_error: 'Expiry date is required',
    })
    .refine(date => date > new Date(), {
      message: 'Expiry date must be in the future',
    }),
  issuingCountry: z.string().min(1, 'Issuing country is required'),
  birthplace: z.string().min(1, 'Birthplace is required'),
});

type PassportInfoFormValues = z.infer<typeof passportInfoSchema>;

export default function PassportInfoForm() {
  const {
    formId,
    updateFormData,
    markStepCompleted,
    setCurrentStep,
    completedSteps,
  } = useFormContext();

  // Initialize the form
  const form = useForm<PassportInfoFormValues>({
    resolver: zodResolver(passportInfoSchema),
    defaultValues: {
      passportNumber: '',
      issueDate: undefined,
      expiryDate: undefined,
      issuingCountry: '',
      birthplace: '',
    },
  });

  // Determine if this is an update operation
  const isUpdate = !!formId && completedSteps.includes('passport-info');

  console.log('PassportInfoForm - formId:', formId);
  console.log('PassportInfoForm - completedSteps:', completedSteps);
  console.log('PassportInfoForm - isUpdate:', isUpdate);

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
    console.log('PassportInfoForm - applicationData:', applicationData);
    if (applicationData && applicationData.passportInfo) {
      const passportInfo = applicationData.passportInfo;
      console.log('Resetting form with data:', passportInfo);

      // Use setTimeout to ensure the reset happens after the form is fully initialized
      setTimeout(() => {
        form.reset({
          passportNumber: passportInfo.passportNumber || '',
          issueDate: passportInfo.issueDate
            ? new Date(passportInfo.issueDate)
            : undefined,
          expiryDate: passportInfo.expiryDate
            ? new Date(passportInfo.expiryDate)
            : undefined,
          issuingCountry: passportInfo.issuingCountry || '',
          birthplace: passportInfo.birthplace || '',
        });
      }, 0);
    }
  }, [applicationData, form]);

  // Define the submit mutation
  const mutation = useMutation({
    mutationFn: async (values: PassportInfoFormValues) => {
      if (!formId) {
        throw new Error('Form ID is required');
      }

      // Convert dates to ISO strings for the API
      const formattedValues = {
        ...values,
        issueDate: values.issueDate.toISOString(),
        expiryDate: values.expiryDate.toISOString(),
      };

      if (isUpdate) {
        // Update existing data
        return await visaApi.updatePassportInfo(formId, formattedValues);
      } else {
        // Create new data
        return await visaApi.createPassportInfo(formId, formattedValues);
      }
    },
    onSuccess: () => {
      // Update form data in context
      updateFormData('passport-info', form.getValues());
      // Mark step as completed
      markStepCompleted('passport-info');
      // Move to next step
      setCurrentStep('review');
    },
  });

  // Handle form submission
  function onSubmit(values: PassportInfoFormValues) {
    if (!formId) {
      alert('No form ID found. Please complete the previous steps first.');
      return;
    }

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
          <h2 className="text-2xl font-semibold">Passport Information</h2>
          <p className="text-muted-foreground">
            Please provide your passport details
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Passport Number */}
          <FormField
            control={form.control}
            name="passportNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passport Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter passport number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Issuing Country */}
          <FormField
            control={form.control}
            name="issuingCountry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issuing Country</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Country that issued passport"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Issue Date */}
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Issue Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      disabled={date => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Expiry Date */}
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Expiry Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      disabled={date => date <= new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Birthplace */}
          <FormField
            control={form.control}
            name="birthplace"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Birthplace</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Place of birth as shown in passport"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep('personal-info')}
          >
            Previous
          </Button>
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
