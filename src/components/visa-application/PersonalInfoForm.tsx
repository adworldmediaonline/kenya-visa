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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useFormContext } from '@/providers/FormProvider';
import { visaApi } from '@/lib/api/endpoints';
// country dropdown
import { CountryDropdown } from '@/components/ui/country-dropdown';
// phone input
import { isValidPhoneNumber } from 'react-phone-number-input';
import { PhoneInput } from '../ui/phone-input';

// Define gender options
const genderOptions = ['Male', 'Female', 'Other'];

// Define marital status options
const maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed'];

// Define the form schema with Zod
const personalInfoSchema = z.object({
  givenName: z.string().min(1, 'First name is required'),
  surname: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.date({
    required_error: 'Date of birth is required',
  }),
  gender: z.string().min(1, 'Gender is required'),
  maritalStatus: z.string().min(1, 'Marital status is required'),
  citizenship: z
    .string({
      required_error: 'Please select a citizenship',
    })
    .min(1, 'Please select a citizenship'),
  countryOfBirth: z
    .string({
      required_error: 'Please select a country of birth',
    })
    .min(1, 'Please select a country of birth'),
  placeOfBirth: z.string().min(1, 'Place of birth is required'),
  email: z.string().email('Please enter a valid email'),
  phoneNumber: z
    .string()
    .refine(isValidPhoneNumber, { message: 'Invalid phone number' }),
  occupation: z.string().min(1, 'Occupation is required'),
});

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;

export default function PersonalInfoForm() {
  console.log('PersonalInfoForm rendering started');

  const {
    formId,
    emailAddress,
    updateFormData,
    markStepCompleted,
    setCurrentStep,
    completedSteps,
  } = useFormContext();

  console.log('FormContext values:', { formId, emailAddress, completedSteps });

  // Check for missing formId and redirect if needed
  useEffect(() => {
    if (!formId) {
      console.error(
        'FormId is missing in PersonalInfoForm, redirecting to first step'
      );
      // If no formId, go back to the first step
      setCurrentStep('visa-details');
    }
  }, [formId, setCurrentStep]);

  // Initialize the form
  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      givenName: '',
      surname: '',
      dateOfBirth: undefined,
      gender: '',
      maritalStatus: '',
      citizenship: '',
      countryOfBirth: '',
      placeOfBirth: '',
      email: '',
      phoneNumber: '',
      occupation: '',
    },
  });

  console.log('Form initialized');

  // Determine if this is an update operation
  const isUpdate = !!formId && completedSteps.includes('personal-info');

  console.log('PersonalInfoForm - formId:', formId);
  console.log('PersonalInfoForm - completedSteps:', completedSteps);
  console.log('PersonalInfoForm - isUpdate:', isUpdate);

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
    console.log('PersonalInfoForm - applicationData:', applicationData);
    if (applicationData && applicationData.personalInfo) {
      const personalInfo = applicationData.personalInfo;
      console.log('Resetting form with data:', personalInfo);

      // Use setTimeout to ensure the reset happens after the form is fully initialized
      setTimeout(() => {
        form.reset({
          givenName: personalInfo.givenName || '',
          surname: personalInfo.surname || '',
          dateOfBirth: personalInfo.dateOfBirth
            ? new Date(personalInfo.dateOfBirth)
            : undefined,
          gender: personalInfo.gender || '',
          maritalStatus: personalInfo.maritalStatus || '',
          citizenship: personalInfo.citizenship || '',
          countryOfBirth: personalInfo.countryOfBirth || '',
          placeOfBirth: personalInfo.placeOfBirth || '',
          email: personalInfo.email || '',
          phoneNumber: personalInfo.phoneNumber || '',
          occupation: personalInfo.occupation || '',
        });
      }, 0);
    }
  }, [applicationData, form]);

  // Define the submit mutation
  const mutation = useMutation({
    mutationFn: async (values: PersonalInfoFormValues) => {
      if (!formId) {
        throw new Error('Form ID is required');
      }

      // Convert the date to ISO string for the API
      const formattedValues = {
        ...values,
        dateOfBirth: values.dateOfBirth.toISOString(),
      };

      if (isUpdate) {
        // Update existing data
        return await visaApi.updatePersonalInfo(formId, formattedValues);
      } else {
        // Create new data
        return await visaApi.createPersonalInfo(formId, formattedValues);
      }
    },
    onSuccess: () => {
      // Update form data in context
      updateFormData('personal-info', form.getValues());
      // Mark step as completed
      markStepCompleted('personal-info');
      // Move to next step
      setCurrentStep('passport-info');
    },
  });

  // Handle form submission
  function onSubmit(values: PersonalInfoFormValues) {
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
          <h2 className="text-2xl font-semibold">Personal Information</h2>
          <p className="text-muted-foreground">
            Please provide your personal details
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Given Name (First Name) */}
          <FormField
            control={form.control}
            name="givenName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Given Name</FormLabel>
                <FormControl>
                  <Input placeholder="First name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Surname (Last Name) */}
          <FormField
            control={form.control}
            name="surname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Surname</FormLabel>
                <FormControl>
                  <Input placeholder="Last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date of Birth */}
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of Birth</FormLabel>
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
                      variant="dob"
                      selected={field.value}
                      onSelect={field.onChange}
                      defaultMonth={field.value || new Date(2000, 0)}
                      fromYear={1920}
                      toYear={new Date().getFullYear()}
                      disabled={date =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Gender */}
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {genderOptions.map(option => (
                      <SelectItem key={option} value={option.toLowerCase()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Marital Status */}
          <FormField
            control={form.control}
            name="maritalStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marital Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select marital status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {maritalStatusOptions.map(option => (
                      <SelectItem key={option} value={option.toLowerCase()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Citizenship (Nationality) */}
          <FormField
            control={form.control}
            name="citizenship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Citizenship</FormLabel>
                <FormControl>
                  <CountryDropdown
                    placeholder="Select citizenship"
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

          {/* Country of Birth */}
          <FormField
            control={form.control}
            name="countryOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country of Birth</FormLabel>
                <FormControl>
                  <CountryDropdown
                    placeholder="Select country of birth"
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

          {/* Place of Birth */}
          <FormField
            control={form.control}
            name="placeOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Place of Birth</FormLabel>
                <FormControl>
                  <Input placeholder="Place of birth" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone Number */}
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <PhoneInput placeholder="Enter a phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Occupation */}
          <FormField
            control={form.control}
            name="occupation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Occupation</FormLabel>
                <FormControl>
                  <Input placeholder="Occupation" {...field} />
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
            onClick={() => setCurrentStep('arrival-info')}
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
