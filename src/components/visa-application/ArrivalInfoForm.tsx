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
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import {
  CalendarIcon,
  Loader2,
  Plane,
  Ship,
  Car
} from 'lucide-react';
import { useFormContext } from '@/providers/FormProvider';
import { visaApi } from '@/lib/api/endpoints';

// country dropdown
import { CountryDropdown } from '@/components/ui/country-dropdown';

// Define the form schema with Zod
const arrivalInfoSchema = z.object({
  // Arrival fields
  arrivalDate: z.date({
    required_error: 'Please select an arrival date',
  }),
  arrivingBy: z.enum(['By Air', 'By Sea', 'By Land'], {
    required_error: 'Please select how you are arriving',
  }),
  // Air arrival fields
  arrivalAirline: z.string().optional(),
  arrivalFlightNumber: z.string().optional(),
  arrivalAirPort: z.string().optional(),
  originCountry: z.string().optional(),
  // Sea arrival fields
  arrivalVesselName: z.string().optional(),
  arrivalSeaPort: z.string().optional(),
  // Land arrival fields
  landBorderCrossing: z.string().optional(),

  // Departure fields
  departureBy: z.enum(['By Air', 'By Sea', 'By Land'], {
    required_error: 'Please select how you are departing',
  }),
  // Air departure fields
  departureAirline: z.string().optional(),
  departureFlightNumber: z.string().optional(),
  departureAirPort: z.string().optional(),
  destinationCountry: z.string().optional(),
  // Sea departure fields
  departureVesselName: z.string().optional(),
  departureSeaPort: z.string().optional(),
  // Land departure fields
  departureLandBorderCrossing: z.string().optional(),

  // Accommodation fields
  accommodationName: z.string({
    required_error: 'Please enter accommodation name',
  }).min(1, 'Accommodation name is required'),
  accommodationFromDate: z.date({
    required_error: 'Please select accommodation start date',
  }),
  accommodationToDate: z.date({
    required_error: 'Please select accommodation end date',
  }),
}).refine(data => {
  // Validate air arrival fields
  if (data.arrivingBy === 'By Air') {
    return !!data.arrivalAirline && !!data.arrivalFlightNumber && !!data.arrivalAirPort && !!data.originCountry;
  }
  return true;
}, {
  message: "Missing required air arrival fields",
  path: ["arrivalAirline"],
}).refine(data => {
  // Validate sea arrival fields
  if (data.arrivingBy === 'By Sea') {
    return !!data.arrivalVesselName && !!data.arrivalSeaPort;
  }
  return true;
}, {
  message: "Missing required sea arrival fields",
  path: ["arrivalVesselName"],
}).refine(data => {
  // Validate land arrival fields
  if (data.arrivingBy === 'By Land') {
    return !!data.landBorderCrossing;
  }
  return true;
}, {
  message: "Missing required land arrival fields",
  path: ["landBorderCrossing"],
}).refine(data => {
  // Validate air departure fields
  if (data.departureBy === 'By Air') {
    return !!data.departureAirline && !!data.departureFlightNumber && !!data.departureAirPort && !!data.destinationCountry;
  }
  return true;
}, {
  message: "Missing required air departure fields",
  path: ["departureAirline"],
}).refine(data => {
  // Validate sea departure fields
  if (data.departureBy === 'By Sea') {
    return !!data.departureVesselName && !!data.departureSeaPort;
  }
  return true;
}, {
  message: "Missing required sea departure fields",
  path: ["departureVesselName"],
}).refine(data => {
  // Validate land departure fields
  if (data.departureBy === 'By Land') {
    return !!data.departureLandBorderCrossing;
  }
  return true;
}, {
  message: "Missing required land departure fields",
  path: ["departureLandBorderCrossing"],
}).refine(data => {
  // Validate accommodation dates
  return data.accommodationToDate > data.accommodationFromDate;
}, {
  message: "Accommodation end date must be after start date",
  path: ["accommodationToDate"],
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
      arrivalDate: new Date(),
      arrivingBy: 'By Air',
      departureBy: 'By Air',
      accommodationName: '',
      accommodationFromDate: new Date(),
      accommodationToDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    },
  });

  // Watch form values to conditionally render fields
  const arrivingBy = form.watch('arrivingBy');
  const departureBy = form.watch('departureBy');

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
          arrivalDate: arrivalInfo.arrivalDate ? new Date(arrivalInfo.arrivalDate) : new Date(),
          arrivingBy: arrivalInfo.arrivingBy || 'By Air',
          arrivalAirline: arrivalInfo.arrivalAirline || '',
          arrivalFlightNumber: arrivalInfo.arrivalFlightNumber || '',
          arrivalAirPort: arrivalInfo.arrivalAirPort || '',
          originCountry: arrivalInfo.originCountry || '',
          arrivalVesselName: arrivalInfo.arrivalVesselName || '',
          arrivalSeaPort: arrivalInfo.arrivalSeaPort || '',
          landBorderCrossing: arrivalInfo.landBorderCrossing || '',
          departureBy: arrivalInfo.departureBy || 'By Air',
          departureAirline: arrivalInfo.departureAirline || '',
          departureFlightNumber: arrivalInfo.departureFlightNumber || '',
          departureAirPort: arrivalInfo.departureAirPort || '',
          destinationCountry: arrivalInfo.destinationCountry || '',
          departureVesselName: arrivalInfo.departureVesselName || '',
          departureSeaPort: arrivalInfo.departureSeaPort || '',
          departureLandBorderCrossing: arrivalInfo.departureLandBorderCrossing || '',
          accommodationName: arrivalInfo.accommodationName || '',
          accommodationFromDate: arrivalInfo.accommodationFromDate ? new Date(arrivalInfo.accommodationFromDate) : new Date(),
          accommodationToDate: arrivalInfo.accommodationToDate ? new Date(arrivalInfo.accommodationToDate) : new Date(new Date().setDate(new Date().getDate() + 7)),
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
        arrivalDate: values.arrivalDate.toISOString(),
        accommodationFromDate: values.accommodationFromDate.toISOString(),
        accommodationToDate: values.accommodationToDate.toISOString(),
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
            Please provide details about your travel to Kenya
          </p>
        </div>

        {/* Arrival Section */}
        <div className="space-y-6 border p-4 rounded-lg">
          <h3 className="text-xl font-medium">Arrival Details</h3>

          {/* Arrival Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>

          {/* Arriving By */}
          <FormField
            control={form.control}
            name="arrivingBy"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Arriving By</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="By Air" />
                      </FormControl>
                      <FormLabel className="font-normal flex items-center">
                        <Plane className="mr-2 h-4 w-4" />
                        By Air
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="By Sea" />
                      </FormControl>
                      <FormLabel className="font-normal flex items-center">
                        <Ship className="mr-2 h-4 w-4" />
                        By Sea
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="By Land" />
                      </FormControl>
                      <FormLabel className="font-normal flex items-center">
                        <Car className="mr-2 h-4 w-4" />
                        By Land
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Conditional fields based on arrival method */}
          {arrivingBy === 'By Air' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="arrivalAirline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Airline</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter airline name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="arrivalFlightNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flight Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter flight number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="arrivalAirPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Arrival Airport</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter arrival airport" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="originCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin Country</FormLabel>
                    <FormControl>
                      <CountryDropdown
                        placeholder="Select origin country"
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
            </div>
          )}

          {arrivingBy === 'By Sea' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="arrivalVesselName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vessel Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter vessel name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="arrivalSeaPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sea Port</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter sea port" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {arrivingBy === 'By Land' && (
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="landBorderCrossing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Border Crossing Point</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter border crossing point" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* Departure Section */}
        <div className="space-y-6 border p-4 rounded-lg">
          <h3 className="text-xl font-medium">Departure Details</h3>

          {/* Departing By */}
          <FormField
            control={form.control}
            name="departureBy"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Departing By</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="By Air" />
                      </FormControl>
                      <FormLabel className="font-normal flex items-center">
                        <Plane className="mr-2 h-4 w-4" />
                        By Air
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="By Sea" />
                      </FormControl>
                      <FormLabel className="font-normal flex items-center">
                        <Ship className="mr-2 h-4 w-4" />
                        By Sea
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="By Land" />
                      </FormControl>
                      <FormLabel className="font-normal flex items-center">
                        <Car className="mr-2 h-4 w-4" />
                        By Land
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Conditional fields based on departure method */}
          {departureBy === 'By Air' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="departureAirline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Airline</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter airline name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="departureFlightNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flight Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter flight number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="departureAirPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departure Airport</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter departure airport" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destinationCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Country</FormLabel>
                    <FormControl>
                      <CountryDropdown
                        placeholder="Select destination country"
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
            </div>
          )}

          {departureBy === 'By Sea' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="departureVesselName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vessel Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter vessel name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="departureSeaPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sea Port</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter sea port" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {departureBy === 'By Land' && (
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="departureLandBorderCrossing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Border Crossing Point</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter border crossing point" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* Accommodation Section */}
        <div className="space-y-6 border p-4 rounded-lg">
          <h3 className="text-xl font-medium">Accommodation Details</h3>

          <div className="grid grid-cols-1 gap-6">
            <FormField
              control={form.control}
              name="accommodationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accommodation Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter hotel or accommodation name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="accommodationFromDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>From Date</FormLabel>
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

            <FormField
              control={form.control}
              name="accommodationToDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>To Date</FormLabel>
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
                        disabled={date => date < form.getValues().accommodationFromDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
