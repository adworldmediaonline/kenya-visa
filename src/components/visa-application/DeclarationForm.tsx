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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { useFormContext } from '@/providers/FormProvider';
import { visaApi } from '@/lib/api/endpoints';

// Define currencies for select dropdown
const currencies = [
    'USD', 'EUR', 'GBP', 'KES', 'AUD', 'CAD', 'CHF', 'JPY', 'CNY', 'AED', 'SGD',
    'INR', 'ZAR', 'NGN', 'EGP', 'MAD', 'TZS', 'UGX', 'RWF', 'BIF', 'ETB', 'Other'
];

// Define the form schema with Zod
const kenyaDeclarationSchema = z.object({
    tripFinanced: z.boolean(),
    convictedOfOffence: z.boolean(),
    deniedEntryToKenya: z.boolean(),
    previousTravelToKenya: z.boolean(),
    monetaryInstrument: z.boolean(),
    monetaryInstrumentName: z.string().optional(),
    monetaryInstrumentCurrency: z.string().optional(),
    amount: z.string().optional(),
}).refine(data => {
    // If monetaryInstrument is true, require the instrument details
    if (data.monetaryInstrument === true) {
        return !!data.monetaryInstrumentName && !!data.monetaryInstrumentCurrency && !!data.amount;
    }
    return true;
}, {
    message: "Please provide all monetary instrument details",
    path: ["monetaryInstrumentName"]
});

type KenyaDeclarationFormValues = z.infer<typeof kenyaDeclarationSchema>;

export default function KenyaDeclarationForm() {
    console.log('KenyaDeclarationForm rendering started');

    const {
        formId,
        updateFormData,
        markStepCompleted,
        setCurrentStep,
        completedSteps,
    } = useFormContext();

    console.log('FormContext values:', { formId, completedSteps });

    // Check for missing formId and redirect if needed
    useEffect(() => {
        if (!formId) {
            console.error(
                'FormId is missing in KenyaDeclarationForm, redirecting to first step'
            );
            // If no formId, go back to the first step
            setCurrentStep('visa-details');
        }
    }, [formId, setCurrentStep]);

    // Initialize the form
    const form = useForm<KenyaDeclarationFormValues>({
        resolver: zodResolver(kenyaDeclarationSchema),
        defaultValues: {
            tripFinanced: false,
            convictedOfOffence: false,
            deniedEntryToKenya: false,
            previousTravelToKenya: false,
            monetaryInstrument: false,
            monetaryInstrumentName: '',
            monetaryInstrumentCurrency: '',
            amount: '',
        },
    });

    console.log('Form initialized');

    // Watch form values to conditionally show fields
    const monetaryInstrument = form.watch('monetaryInstrument');

    // Determine if this is an update operation
    const isUpdate = !!formId && completedSteps.includes('declaration');

    console.log('KenyaDeclarationForm - formId:', formId);
    console.log('KenyaDeclarationForm - completedSteps:', completedSteps);
    console.log('KenyaDeclarationForm - isUpdate:', isUpdate);

    // Fetch the complete visa application if we have a formId
    const { data: applicationData, isLoading: isLoadingApplication } = useQuery({
        queryKey: ['kenya-visa-application', formId],
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
        console.log('KenyaDeclarationForm - applicationData:', applicationData);
        if (applicationData && applicationData.declaration) {
            const declaration = applicationData.declaration;
            console.log('Resetting form with data:', declaration);

            // Use setTimeout to ensure the reset happens after the form is fully initialized
            setTimeout(() => {
                form.reset({
                    tripFinanced: declaration.tripFinanced || false,
                    convictedOfOffence: declaration.convictedOfOffence || false,
                    deniedEntryToKenya: declaration.deniedEntryToKenya || false,
                    previousTravelToKenya: declaration.previousTravelToKenya || false,
                    monetaryInstrument: declaration.monetaryInstrument || false,
                    monetaryInstrumentName: declaration.monetaryInstrumentName || '',
                    monetaryInstrumentCurrency: declaration.monetaryInstrumentCurrency || '',
                    amount: declaration.amount?.toString() || ''
                });
            }, 0);
        }
    }, [applicationData, form]);

    // Define the submit mutation
    const mutation = useMutation({
        mutationFn: async (values: KenyaDeclarationFormValues) => {
            if (!formId) {
                throw new Error('Form ID is required');
            }

            console.log('KenyaDeclarationForm - Submitting with formId:', formId);

            // Format the data for the API
            const formattedValues = {
                formId,
                tripFinanced: values.tripFinanced,
                convictedOfOffence: values.convictedOfOffence,
                deniedEntryToKenya: values.deniedEntryToKenya,
                previousTravelToKenya: values.previousTravelToKenya,
                monetaryInstrument: values.monetaryInstrument,
                monetaryInstrumentName: values.monetaryInstrumentName || '',
                monetaryInstrumentCurrency: values.monetaryInstrumentCurrency || '',
                amount: values.amount ? parseFloat(values.amount) : undefined
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
                'KenyaDeclarationForm - Submission successful, response:',
                response
            );

            // Update form data in context
            updateFormData('declaration', form.getValues());
            // Mark step as completed
            markStepCompleted('declaration');
            // Move to next step
            setCurrentStep('payment');
        },
        onError: error => {
            console.error('KenyaDeclarationForm - Submission error:', error);
            alert(
                'An error occurred while saving your declaration information. Please try again.'
            );
        },
    });

    // Handle form submission
    function onSubmit(values: KenyaDeclarationFormValues) {
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
                    <h2 className="text-2xl font-semibold">Biosecurity & Legal Declaration</h2>
                    <p className="text-muted-foreground">
                        Please answer a few questions related to biosecurity, customs and law enforcement
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Travel Financing */}
                    <div className="border p-4 rounded-md space-y-4">
                        <h3 className="text-lg font-medium">Travel Financing</h3>

                        <FormField
                            control={form.control}
                            name="tripFinanced"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Is your trip financed by a third party, which is not your employer nor a government?</FormLabel>
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
                    </div>

                    {/* Legal History */}
                    <div className="border p-4 rounded-md space-y-4">
                        <h3 className="text-lg font-medium">Legal History</h3>

                        <FormField
                            control={form.control}
                            name="convictedOfOffence"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Have you ever been convicted of any offense in any country?</FormLabel>
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

                        <FormField
                            control={form.control}
                            name="deniedEntryToKenya"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Have you ever been denied entry to Kenya before?</FormLabel>
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

                        <FormField
                            control={form.control}
                            name="previousTravelToKenya"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Have you traveled to Kenya before?</FormLabel>
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
                    </div>

                    {/* Currency/Monetary Instruments */}
                    <div className="border p-4 rounded-md space-y-4">
                        <h3 className="text-lg font-medium">Currency & Monetary Instruments</h3>

                        <FormField
                            control={form.control}
                            name="monetaryInstrument"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Will you be bringing into Republic of Kenya currency or monetary instruments of a value greater than $10,000 or foreign equivalent?</FormLabel>
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

                        {monetaryInstrument && (
                            <div className="p-4 bg-slate-50 rounded-md">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="monetaryInstrumentName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Cash, Money Order, Traveller's Cheque" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="monetaryInstrumentCurrency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Currency</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select currency" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {currencies.map(currency => (
                                                            <SelectItem key={currency} value={currency}>
                                                                {currency}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Amount</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="Amount" {...field} />
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