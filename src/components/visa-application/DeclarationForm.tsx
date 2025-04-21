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
    FormMessage
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Define who is paying options
const payingOptions = [
    'By the applicant himself/herself',
    'By a sponsor (host, company, organization)',
];

// Define host types
const hostTypes = [
    'Tourist Company',
    'Hotel',
    'Individual',
    'Company',
    'Organization',
];

// Define the form schema with Zod
const declarationSchema = z.object({
    visitedBefore: z.boolean(),
    dateFrom: z.date().optional().nullable(),
    dateTo: z.date().optional().nullable(),
    whereStayed: z.string().optional(),
    deportedFromEgyptOrOtherCountry: z.boolean(),
    deportedDateFrom: z.date().optional().nullable(),
    deportedDateTo: z.date().optional().nullable(),
    whoIsPaying: z.string().min(1, 'Please select who is paying'),
    // Host information
    hostType: z.string().optional(),
    hostName: z.string().optional(),
    hostPhoneNumber: z.string().optional(),
    hostEmail: z.string().email().optional(),
    hostAddress: z.string().optional(),
}).refine(data => {
    // If visited before is true, require date fields and where stayed
    if (data.visitedBefore === true) {
        return !!data.dateFrom && !!data.dateTo && !!data.whereStayed;
    }
    return true;
}, {
    message: "Please provide details about your previous visit",
    path: ["dateFrom"]
}).refine(data => {
    // If deported is true, require deportation date fields
    if (data.deportedFromEgyptOrOtherCountry === true) {
        return !!data.deportedDateFrom && !!data.deportedDateTo;
    }
    return true;
}, {
    message: "Please provide deportation details",
    path: ["deportedDateFrom"]
}).refine(data => {
    // If paying by sponsor, require host information
    if (data.whoIsPaying === 'By a sponsor (host, company, organization)') {
        return !!data.hostType && !!data.hostName && !!data.hostPhoneNumber;
    }
    return true;
}, {
    message: "Host information is required when sponsor is paying",
    path: ["hostType"]
});

type DeclarationFormValues = z.infer<typeof declarationSchema>;

export default function DeclarationForm() {
    console.log('DeclarationForm rendering started');

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
                'FormId is missing in DeclarationForm, redirecting to first step'
            );
            // If no formId, go back to the first step
            setCurrentStep('visa-details');
        }
    }, [formId, setCurrentStep]);

    // Initialize the form
    const form = useForm<DeclarationFormValues>({
        resolver: zodResolver(declarationSchema),
        defaultValues: {
            visitedBefore: false,
            dateFrom: null,
            dateTo: null,
            whereStayed: '',
            deportedFromEgyptOrOtherCountry: false,
            deportedDateFrom: null,
            deportedDateTo: null,
            whoIsPaying: '',
            hostType: '',
            hostName: '',
            hostPhoneNumber: '',
            hostEmail: '',
            hostAddress: '',
        },
    });

    console.log('Form initialized');

    // Watch form values to conditionally show fields
    const visitedBefore = form.watch('visitedBefore');
    const deportedFromEgyptOrOtherCountry = form.watch('deportedFromEgyptOrOtherCountry');
    const whoIsPaying = form.watch('whoIsPaying');

    // Determine if this is an update operation
    const isUpdate = !!formId && completedSteps.includes('declaration');

    console.log('DeclarationForm - formId:', formId);
    console.log('DeclarationForm - completedSteps:', completedSteps);
    console.log('DeclarationForm - isUpdate:', isUpdate);

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
        console.log('DeclarationForm - applicationData:', applicationData);
        if (applicationData && applicationData.declaration) {
            const declaration = applicationData.declaration;
            console.log('Resetting form with data:', declaration);

            // Use setTimeout to ensure the reset happens after the form is fully initialized
            setTimeout(() => {
                form.reset({
                    visitedBefore: declaration.visitedBefore || false,
                    dateFrom: declaration.dateFrom ? new Date(declaration.dateFrom) : null,
                    dateTo: declaration.dateTo ? new Date(declaration.dateTo) : null,
                    whereStayed: declaration.whereStayed || '',
                    deportedFromEgyptOrOtherCountry: declaration.deportedFromEgyptOrOtherCountry || false,
                    deportedDateFrom: declaration.deportedDateFrom ? new Date(declaration.deportedDateFrom) : null,
                    deportedDateTo: declaration.deportedDateTo ? new Date(declaration.deportedDateTo) : null,
                    whoIsPaying: declaration.whoIsPaying || '',
                    hostType: declaration.hostType || '',
                    hostName: declaration.hostName || '',
                    hostPhoneNumber: declaration.hostPhoneNumber || '',
                    hostEmail: declaration.hostEmail || '',
                    hostAddress: declaration.hostAddress || '',
                });
            }, 0);
        }
    }, [applicationData, form]);

    // Define the submit mutation
    const mutation = useMutation({
        mutationFn: async (values: DeclarationFormValues) => {
            if (!formId) {
                throw new Error('Form ID is required');
            }

            console.log('DeclarationForm - Submitting with formId:', formId);

            // Convert dates to ISO strings for the API
            const formattedValues = {
                ...values,
                dateFrom: values.dateFrom ? values.dateFrom.toISOString() : null,
                dateTo: values.dateTo ? values.dateTo.toISOString() : null,
                deportedDateFrom: values.deportedDateFrom ? values.deportedDateFrom.toISOString() : null,
                deportedDateTo: values.deportedDateTo ? values.deportedDateTo.toISOString() : null,
            };

            if (isUpdate) {
                // Update existing data
                return await visaApi.updateDeclaration(formId, formattedValues);
            } else {
                // Create new data
                return await visaApi.createDeclaration(formId, formattedValues);
            }
        },
        onSuccess: response => {
            console.log(
                'DeclarationForm - Submission successful, response:',
                response
            );

            // Update form data in context
            updateFormData('declaration', form.getValues());
            // Mark step as completed
            markStepCompleted('declaration');
            // Move to next step
            setCurrentStep('review');
        },
        onError: error => {
            console.error('DeclarationForm - Submission error:', error);
            alert(
                'An error occurred while saving your declaration information. Please try again.'
            );
        },
    });

    // Handle form submission
    function onSubmit(values: DeclarationFormValues) {
        console.log('Attempting to submit with values:', values);
        console.log('Form is valid:', form.formState.isValid);
        console.log('Form errors:', form.formState.errors);

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
                    <h2 className="text-2xl font-semibold">Declaration Information</h2>
                    <p className="text-muted-foreground">
                        Please provide information about your travel history and financial arrangements
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Previous Visit to Egypt */}
                    <div className="border p-4 rounded-md space-y-4">
                        <h3 className="text-lg font-medium">Previous Visits to Egypt</h3>

                        <FormField
                            control={form.control}
                            name="visitedBefore"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Have you visited Egypt before?</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={(value) => field.onChange(value === 'true')}
                                            defaultValue={field.value ? 'true' : 'false'}
                                            className="flex flex-row space-x-4"
                                        >
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="true" />
                                                </FormControl>
                                                <FormLabel className="font-normal">Yes</FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="false" />
                                                </FormControl>
                                                <FormLabel className="font-normal">No</FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {visitedBefore && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Date From */}
                                <FormField
                                    control={form.control}
                                    name="dateFrom"
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
                                                        selected={field.value || undefined}
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

                                {/* Date To */}
                                <FormField
                                    control={form.control}
                                    name="dateTo"
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
                                                        selected={field.value || undefined}
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

                                {/* Where Stayed */}
                                <FormField
                                    control={form.control}
                                    name="whereStayed"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Where did you stay?</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Hotel name, address, or location" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                    </div>

                    {/* Deportation History */}
                    <div className="border p-4 rounded-md space-y-4">
                        <h3 className="text-lg font-medium">Deportation History</h3>

                        <FormField
                            control={form.control}
                            name="deportedFromEgyptOrOtherCountry"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Have you ever been deported from Egypt or any other country?</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={(value) => field.onChange(value === 'true')}
                                            defaultValue={field.value ? 'true' : 'false'}
                                            className="flex flex-row space-x-4"
                                        >
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="true" />
                                                </FormControl>
                                                <FormLabel className="font-normal">Yes</FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="false" />
                                                </FormControl>
                                                <FormLabel className="font-normal">No</FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {deportedFromEgyptOrOtherCountry && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Deportation Date From */}
                                <FormField
                                    control={form.control}
                                    name="deportedDateFrom"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Deportation From Date</FormLabel>
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
                                                        selected={field.value || undefined}
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

                                {/* Deportation Date To */}
                                <FormField
                                    control={form.control}
                                    name="deportedDateTo"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Deportation To Date</FormLabel>
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
                                                        selected={field.value || undefined}
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
                            </div>
                        )}
                    </div>

                    {/* Financial Arrangements */}
                    <div className="border p-4 rounded-md space-y-4">
                        <h3 className="text-lg font-medium">Financial Arrangements</h3>

                        <FormField
                            control={form.control}
                            name="whoIsPaying"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Who is paying for travel and accommodation costs?</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select who is paying" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {payingOptions.map(option => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {whoIsPaying === 'By a sponsor (host, company, organization)' && (
                            <div className="space-y-4">
                                <h4 className="text-md font-medium">Host Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Host Type */}
                                    <FormField
                                        control={form.control}
                                        name="hostType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Host Type</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select host type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {hostTypes.map(type => (
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

                                    {/* Host Name */}
                                    <FormField
                                        control={form.control}
                                        name="hostName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Host Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter host name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Host Phone Number */}
                                    <FormField
                                        control={form.control}
                                        name="hostPhoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Host Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter host phone number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Host Email */}
                                    <FormField
                                        control={form.control}
                                        name="hostEmail"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Host Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter host email" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Host Address */}
                                    <FormField
                                        control={form.control}
                                        name="hostAddress"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>Host Address</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter host address" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-between pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep('additional-applicants')}
                    >
                        Previous
                    </Button>
                    <Button type="submit">
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
