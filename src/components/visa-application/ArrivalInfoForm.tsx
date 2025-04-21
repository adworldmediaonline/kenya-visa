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

// country dropdown
import { CountryDropdown } from '@/components/ui/country-dropdown';

// Define the form schema with Zod
const arrivalInfoSchema = z.object({
  travellingFrom: z
    .string({
      required_error: 'Please select a country',
    })
    .min(1, 'Please select a country you are travelling from'),
  arrivalDate: z.date({
    required_error: 'Please select an arrival date',
  }),
  departureDate: z.date({
    required_error: 'Please select a departure date',
  }),
}).refine(data => {
  return data.departureDate > data.arrivalDate;
}, {
  message: "Departure date must be after arrival date",
  path: ["departureDate"],
});

type ArrivalInfoFormValues = z.infer<typeof arrivalInfoSchema>;

export default function ArrivalInfoForm() {
  const {
    formId,
    emailAddress,
    updateFormData,
    markStepCompleted,
    setCurrentStep,
    completedSteps,
  } = useFormContext();

  console.log('ArrivalInfoForm - FormContext values:', {
    formId,
    emailAddress,
    completedSteps,
  });

  // Initialize the form
  const form = useForm<ArrivalInfoFormValues>({
    resolver: zodResolver(arrivalInfoSchema),
    defaultValues: {
      travellingFrom: '',
      arrivalDate: new Date(),
      departureDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 7 days after arrival
    },
  });

  // Determine if this is an update operation
  const isUpdate = !!formId && completedSteps.includes('arrival-info');

  console.log('ArrivalInfoForm - formId:', formId);
  console.log('ArrivalInfoForm - completedSteps:', completedSteps);
  console.log('ArrivalInfoForm - isUpdate:', isUpdate);

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
    console.log('ArrivalInfoForm - applicationData:', applicationData);
    if (applicationData && applicationData.arrivalInfo) {
      const arrivalInfo = applicationData.arrivalInfo;
      console.log('Resetting form with data:', arrivalInfo);

      // Use setTimeout to ensure the reset happens after the form is fully initialized
      setTimeout(() => {
        form.reset({
          travellingFrom: arrivalInfo.travellingFrom || '',
          arrivalDate: arrivalInfo.arrivalDate
            ? new Date(arrivalInfo.arrivalDate)
            : new Date(),
          departureDate: arrivalInfo.departureDate
            ? new Date(arrivalInfo.departureDate)
            : new Date(new Date().setDate(new Date().getDate() + 7)),
        });
      }, 0);
    }
  }, [applicationData, form]);

  // Define the submission mutation
  const mutation = useMutation({
    mutationFn: async (values: ArrivalInfoFormValues) => {
      if (!formId) {
        throw new Error('Form ID is required');
      }

      console.log('ArrivalInfoForm - Submitting with formId:', formId);

      // Convert the dates to ISO string for the API
      const formattedValues = {
        ...values,
        formId: formId,
        arrivalDate: values.arrivalDate.toISOString()
      };

      if (isUpdate) {
        // Update existing data
        return await visaApi.updateArrivalInfo(formId, formattedValues);
      } else {
        // Create new data
        return await visaApi.createArrivalInfo(formattedValues);
      }
    },
    onSuccess: response => {
      console.log(
        'ArrivalInfoForm - Submission successful, response:',
        response
      );

      // Update form data in context
      updateFormData('arrival-info', form.getValues());
      // Mark step as completed
      markStepCompleted('arrival-info');
      // Move to next step
      setCurrentStep('personal-info');
    },
    onError: error => {
      console.error('ArrivalInfoForm - Submission error:', error);
      alert(
        'An error occurred while saving your arrival information. Please try again.'
      );
    },
  });

  // Handle form submission
  function onSubmit(values: ArrivalInfoFormValues) {
    if (!formId) {
      alert('No form ID found. Please complete the previous step first.');
      return;
    }

    mutation.mutate(values);
  }

  if (isLoadingApplication && completedSteps.includes('arrival-info')) {
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
          <h2 className="text-2xl font-semibold">Arrival Information</h2>
          <p className="text-muted-foreground">
            Please provide details about your travel to Egypt
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Travelling From */}
          <FormField
            control={form.control}
            name="travellingFrom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Travelling From</FormLabel>
                <FormControl>
                  <CountryDropdown
                    placeholder="Select country you are travelling from"
                    defaultValue={field.value}
                    onChange={country => {
                      field.onChange(country.name);
                    }}
                    name={field.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Arrival Date */}
          <FormField
            control={form.control}
            name="arrivalDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Arrival Date</FormLabel>
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
                      disabled={date => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Departure Date */}
          <FormField
            control={form.control}
            name="departureDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Departure Date</FormLabel>
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
                      disabled={date => date < form.getValues().arrivalDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep('visa-details')}
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
