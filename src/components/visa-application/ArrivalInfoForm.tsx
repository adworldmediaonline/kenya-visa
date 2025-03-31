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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

// Define accommodation types
const accommodationTypes = [
  'Hotel',
  'Hostel',
  'Airbnb',
  'Family/Friend',
  'Business Accommodation',
  'Other',
];

// Define the form schema with Zod
const arrivalInfoSchema = z.object({
  arrivalDate: z.date({
    required_error: 'Please select an arrival date',
  }),
  departureCountry: z.string().min(1, 'Please enter departure country'),
  departureCity: z.string().min(1, 'Please enter departure city'),
  airline: z.string().optional(),
  flightNumber: z.string().optional(),
  accommodationType: z.string().min(1, 'Please select accommodation type'),
  accommodationName: z.string().min(1, 'Please enter accommodation name'),
  accommodationCity: z.string().min(1, 'Please enter accommodation city'),
  accommodationStreetAddress: z
    .string()
    .min(1, 'Please enter accommodation address'),
  accommodationTelephone: z
    .string()
    .min(1, 'Please enter accommodation telephone'),
});

type ArrivalInfoFormValues = z.infer<typeof arrivalInfoSchema>;

export default function ArrivalInfoForm() {
  console.log('ArrivalInfoForm rendering started');

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
      arrivalDate: new Date(),
      departureCountry: '',
      departureCity: '',
      airline: '',
      flightNumber: '',
      accommodationType: '',
      accommodationName: '',
      accommodationCity: '',
      accommodationStreetAddress: '',
      accommodationTelephone: '',
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
          arrivalDate: arrivalInfo.arrivalDate
            ? new Date(arrivalInfo.arrivalDate)
            : new Date(),
          departureCountry: arrivalInfo.departureCountry || '',
          departureCity: arrivalInfo.departureCity || '',
          airline: arrivalInfo.airline || '',
          flightNumber: arrivalInfo.flightNumber || '',
          accommodationType: arrivalInfo.accommodationType || '',
          accommodationName: arrivalInfo.accommodationName || '',
          accommodationCity: arrivalInfo.accommodationCity || '',
          accommodationStreetAddress:
            arrivalInfo.accommodationStreetAddress || '',
          accommodationTelephone: arrivalInfo.accommodationTelephone || '',
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

      // Convert the date to ISO string for the API
      const formattedValues = {
        ...values,
        formId: formId,
        arrivalDate: values.arrivalDate.toISOString(),
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
            Please provide details about your arrival in Ethiopia
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Departure Country */}
          <FormField
            control={form.control}
            name="departureCountry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Departure Country</FormLabel>
                <FormControl>
                  <Input placeholder="Country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Departure City */}
          <FormField
            control={form.control}
            name="departureCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Departure City</FormLabel>
                <FormControl>
                  <Input placeholder="City" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Airline (Optional) */}
          <FormField
            control={form.control}
            name="airline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Airline (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Airline name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Flight Number (Optional) */}
          <FormField
            control={form.control}
            name="flightNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Flight Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Flight number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Accommodation Type */}
          <FormField
            control={form.control}
            name="accommodationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Accommodation Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select accommodation type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accommodationTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Accommodation Name */}
          <FormField
            control={form.control}
            name="accommodationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Accommodation Name</FormLabel>
                <FormControl>
                  <Input placeholder="Hotel/hostel/place name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Accommodation City */}
          <FormField
            control={form.control}
            name="accommodationCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Accommodation City</FormLabel>
                <FormControl>
                  <Input placeholder="City" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Accommodation Street Address */}
          <FormField
            control={form.control}
            name="accommodationStreetAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Accommodation Address</FormLabel>
                <FormControl>
                  <Input placeholder="Street address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Accommodation Telephone */}
          <FormField
            control={form.control}
            name="accommodationTelephone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Accommodation Telephone</FormLabel>
                <FormControl>
                  <Input placeholder="Telephone number" {...field} />
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
