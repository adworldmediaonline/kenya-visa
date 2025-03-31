'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  PlusCircle,
  Trash2,
  Loader2,
  Edit2,
  CheckCircle,
  CalendarIcon,
} from 'lucide-react';

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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFormContext } from '@/providers/FormProvider';
import { visaApi } from '@/lib/api/endpoints';

// Define the schema for additional applicant
const additionalApplicantSchema = z.object({
  // Personal Info fields
  givenName: z.string().min(1, 'Given name is required'),
  surname: z.string().min(1, 'Surname is required'),
  citizenship: z.string().min(1, 'Citizenship is required'),
  gender: z.string().min(1, 'Gender is required'),
  countryOfBirth: z.string().min(1, 'Country of birth is required'),
  dateOfBirth: z.date({ required_error: 'Date of birth is required' }),
  placeOfBirth: z.string().min(1, 'Place of birth is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  occupation: z.string().min(1, 'Occupation is required'),
  streetAddress: z.string().min(1, 'Street address is required'),
  addressCity: z.string().min(1, 'City is required'),
  addressCountry: z.string().min(1, 'Country is required'),

  // Passport Info fields
  passportType: z.string().min(1, 'Passport type is required'),
  passportNumber: z.string().min(1, 'Passport number is required'),
  passportIssueDate: z.date({ required_error: 'Issue date is required' }),
  passportExpiryDate: z.date({ required_error: 'Expiry date is required' }),
  passportIssuingCountry: z.string().min(1, 'Issuing country is required'),
  passportIssuingAuthority: z.string().min(1, 'Issuing authority is required'),
});

type AdditionalApplicantFormValues = z.infer<typeof additionalApplicantSchema>;

// Add a type for applicant
interface ApplicantInfo {
  personalInfo: {
    givenName: string;
    surname: string;
    citizenship: string;
    gender: string;
    countryOfBirth: string;
    dateOfBirth: string;
    placeOfBirth: string;
    email: string;
    phoneNumber: string;
    occupation: string;
    streetAddress: string;
    addressCity: string;
    addressCountry: string;
    [key: string]: unknown;
  };
  passportInfo: {
    passportType: string;
    passportNumber: string;
    passportIssueDate: string;
    passportExpiryDate: string;
    passportIssuingCountry: string;
    passportIssuingAuthority: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export default function AdditionalApplicantsForm() {
  const {
    formId,
    updateFormData,
    markStepCompleted,
    setCurrentStep,
    completedSteps,
  } = useFormContext();

  const [showApplicantForm, setShowApplicantForm] = useState(false);
  const [editingApplicantIndex, setEditingApplicantIndex] = useState<
    number | null
  >(null);

  // Fetch existing additional applicants
  const {
    data: additionalApplicants,
    isLoading: isLoadingApplicants,
    refetch: refetchApplicants,
  } = useQuery({
    queryKey: ['additional-applicants', formId],
    queryFn: async () => {
      if (!formId) throw new Error('Form ID is required');
      const response = await visaApi.getAdditionalApplicants(formId);
      return (response.data as ApplicantInfo[]) || [];
    },
    enabled: !!formId,
  });

  // Initialize the form
  const form = useForm<AdditionalApplicantFormValues>({
    resolver: zodResolver(additionalApplicantSchema),
    defaultValues: {
      givenName: '',
      surname: '',
      citizenship: '',
      gender: '',
      countryOfBirth: '',
      dateOfBirth: undefined,
      placeOfBirth: '',
      email: '',
      phoneNumber: '',
      occupation: '',
      streetAddress: '',
      addressCity: '',
      addressCountry: '',
      passportType: 'Ordinary',
      passportNumber: '',
      passportIssueDate: undefined,
      passportExpiryDate: undefined,
      passportIssuingCountry: '',
      passportIssuingAuthority: '',
    },
  });

  // Add/Update applicant mutation
  const addApplicantMutation = useMutation({
    mutationFn: async (values: AdditionalApplicantFormValues) => {
      if (!formId) throw new Error('Form ID is required');

      // Format dates for API
      const formattedValues = {
        ...values,
        dateOfBirth: values.dateOfBirth.toISOString(),
        passportIssueDate: values.passportIssueDate.toISOString(),
        passportExpiryDate: values.passportExpiryDate.toISOString(),
      };

      if (editingApplicantIndex !== null) {
        // Update existing applicant
        await visaApi.updateAdditionalApplicant(
          formId,
          editingApplicantIndex,
          formattedValues
        );
      } else {
        // Add new applicant
        await visaApi.addAdditionalApplicant(formId, formattedValues);
      }

      return formId;
    },
    onSuccess: async () => {
      form.reset();
      setShowApplicantForm(false);
      setEditingApplicantIndex(null);
      await refetchApplicants();

      // Mark step as completed if at least one applicant has been added
      if (!completedSteps.includes('additional-applicants')) {
        markStepCompleted('additional-applicants');
      }
    },
    onError: error => {
      console.error('Error adding/updating applicant:', error);
      alert('There was an error processing your request. Please try again.');
    },
  });

  // Remove applicant mutation
  const removeApplicantMutation = useMutation({
    mutationFn: async (index: number) => {
      if (!formId) throw new Error('Form ID is required');
      await visaApi.removeAdditionalApplicant(formId, index);
      return formId;
    },
    onSuccess: async () => {
      await refetchApplicants();
    },
    onError: error => {
      console.error('Error removing applicant:', error);
      alert('There was an error removing the applicant. Please try again.');
    },
  });

  // Handle form submission
  const onSubmit = (values: AdditionalApplicantFormValues) => {
    addApplicantMutation.mutate(values);
  };

  // Edit an existing applicant
  const handleEditApplicant = (applicant: ApplicantInfo, index: number) => {
    setEditingApplicantIndex(index);

    // Format dates from ISO string to Date objects
    const formValues = {
      ...applicant.personalInfo,
      ...applicant.passportInfo,
      dateOfBirth: new Date(applicant.personalInfo.dateOfBirth),
      passportIssueDate: new Date(applicant.passportInfo.passportIssueDate),
      passportExpiryDate: new Date(applicant.passportInfo.passportExpiryDate),
    };

    form.reset(formValues);
    setShowApplicantForm(true);
  };

  // Handle remove applicant
  const handleRemoveApplicant = (index: number) => {
    if (confirm('Are you sure you want to remove this applicant?')) {
      removeApplicantMutation.mutate(index);
    }
  };

  // Navigate to next step
  const handleContinue = () => {
    // Even if no applicants were added, we mark the step as completed
    if (!completedSteps.includes('additional-applicants')) {
      markStepCompleted('additional-applicants');
    }

    // Update form data in context
    updateFormData('additional-applicants', {
      hasAdditionalApplicants:
        (additionalApplicants && additionalApplicants.length > 0) || false,
    });

    // Move to review step
    setCurrentStep('review');
  };

  // Render a compact view of an applicant
  const renderApplicantCard = (applicant: ApplicantInfo, index: number) => {
    if (!applicant.personalInfo || !applicant.passportInfo) return null;

    const personalInfo = applicant.personalInfo;
    const passportInfo = applicant.passportInfo;

    return (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              {personalInfo.givenName} {personalInfo.surname}
            </CardTitle>
            <Badge>{index + 1}</Badge>
          </div>
          <CardDescription>
            {personalInfo.citizenship} • Passport: {passportInfo.passportNumber}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <span className="font-medium">Date of Birth:</span>{' '}
              {format(new Date(personalInfo.dateOfBirth), 'PPP')}
            </div>
            <div>
              <span className="font-medium">Gender:</span> {personalInfo.gender}
            </div>
            <div>
              <span className="font-medium">Email:</span> {personalInfo.email}
            </div>
            <div>
              <span className="font-medium">Phone:</span>{' '}
              {personalInfo.phoneNumber}
            </div>
            <div className="sm:col-span-2">
              <span className="font-medium">Address:</span>{' '}
              {personalInfo.streetAddress}, {personalInfo.addressCity},{' '}
              {personalInfo.addressCountry}
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditApplicant(applicant, index)}
            disabled={
              addApplicantMutation.isPending ||
              removeApplicantMutation.isPending
            }
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleRemoveApplicant(index)}
            disabled={
              addApplicantMutation.isPending ||
              removeApplicantMutation.isPending
            }
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
        </CardFooter>
      </Card>
    );
  };

  if (isLoadingApplicants) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Additional Applicants</h2>
        <p className="text-muted-foreground">
          Add any additional applicants that will be traveling with you
        </p>
      </div>

      {/* List of added applicants */}
      {additionalApplicants && additionalApplicants.length > 0 && (
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-medium flex items-center">
            Added Applicants
            <Badge className="ml-2">{additionalApplicants.length}</Badge>
          </h3>
          <div>
            {additionalApplicants.map((applicant, index) =>
              renderApplicantCard(applicant, index)
            )}
          </div>
        </div>
      )}

      {/* Add applicant button or form */}
      {!showApplicantForm ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/50">
          <Button
            className="flex items-center gap-2"
            onClick={() => setShowApplicantForm(true)}
            disabled={addApplicantMutation.isPending}
          >
            <PlusCircle className="h-5 w-5" />
            Add New Applicant
          </Button>

          <p className="mt-4 text-sm text-muted-foreground text-center">
            If you don&apos;t have additional applicants, you can proceed to the
            next step.
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingApplicantIndex !== null
                ? 'Edit Applicant'
                : 'Add New Applicant'}
            </CardTitle>
            <CardDescription>
              Please provide the required information for this applicant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                id="applicant-form"
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Personal Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Given Name */}
                    <FormField
                      control={form.control}
                      name="givenName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Given Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Given name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Surname */}
                    <FormField
                      control={form.control}
                      name="surname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Surname</FormLabel>
                          <FormControl>
                            <Input placeholder="Surname" {...field} />
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
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={date => date > new Date()}
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
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Citizenship */}
                    <FormField
                      control={form.control}
                      name="citizenship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Citizenship</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Country of citizenship"
                              {...field}
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
                            <Input placeholder="Country of birth" {...field} />
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
                            <Input placeholder="City of birth" {...field} />
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
                            <Input
                              type="email"
                              placeholder="Email address"
                              {...field}
                            />
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
                            <Input placeholder="Phone number" {...field} />
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

                    {/* Street Address */}
                    <FormField
                      control={form.control}
                      name="streetAddress"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Street address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* City */}
                    <FormField
                      control={form.control}
                      name="addressCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Country */}
                    <FormField
                      control={form.control}
                      name="addressCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Passport Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Passport Type */}
                    <FormField
                      control={form.control}
                      name="passportType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passport Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select passport type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Ordinary">Ordinary</SelectItem>
                              <SelectItem value="Diplomatic">
                                Diplomatic
                              </SelectItem>
                              <SelectItem value="Service">Service</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Passport Number */}
                    <FormField
                      control={form.control}
                      name="passportNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passport Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Passport number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Passport Issue Date */}
                    <FormField
                      control={form.control}
                      name="passportIssueDate"
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
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={date => date > new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Passport Expiry Date */}
                    <FormField
                      control={form.control}
                      name="passportExpiryDate"
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
                            <PopoverContent className="w-auto p-0">
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

                    {/* Issuing Country */}
                    <FormField
                      control={form.control}
                      name="passportIssuingCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issuing Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Issuing Authority */}
                    <FormField
                      control={form.control}
                      name="passportIssuingAuthority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issuing Authority</FormLabel>
                          <FormControl>
                            <Input placeholder="Authority" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                setShowApplicantForm(false);
                setEditingApplicantIndex(null);
                form.reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="applicant-form"
              disabled={addApplicantMutation.isPending}
            >
              {addApplicantMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingApplicantIndex !== null ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  {editingApplicantIndex !== null ? 'Update' : 'Add'} Applicant
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('passport-info')}
        >
          Previous
        </Button>
        <Button
          type="button"
          onClick={handleContinue}
          disabled={addApplicantMutation.isPending}
        >
          {additionalApplicants && additionalApplicants.length > 0 ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Continue with {additionalApplicants.length} Additional Applicant
              {additionalApplicants.length !== 1 ? 's' : ''}
            </>
          ) : (
            'Continue without Additional Applicants'
          )}
        </Button>
      </div>
    </div>
  );
}
