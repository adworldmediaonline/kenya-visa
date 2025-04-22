'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, AlertCircle, CreditCard, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFormContext } from '@/providers/FormProvider';
import { visaApi } from '@/lib/api/endpoints';

// Define payment status type
type PaymentStatus = 'idle' | 'loading' | 'success' | 'error' | 'paid';

interface VisaTypeData {
    name: string;
    validities: Array<{ type: string; price: number }>;
    attachments: string[];
}

interface ApplicationData {
    visaDetails?: {
        visaType: string;
        visaValidity: string;
    };
    personalInfo?: {
        givenName: string;
        surname: string;
        email: string;
        phoneNumber: string;
    };
    paymentStatus?: string;
    emailAddress?: string;
    additionalApplicants?: ApplicantInfo[];
}

interface ApplicantInfo {
    givenName: string;
    surname: string;
    email: string;
    phoneNumber: string;
}

interface PaymentDetails {
    feePerApplicant: number;
    totalFee: number;
}

export default function PaymentForm() {
    const { formId, setCurrentStep } = useFormContext();
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
    const [paymentError, setPaymentError] = useState<string | null>(null);

    // Fetch visa types to get pricing information
    const { data: visaTypesData } = useQuery({
        queryKey: ['visaTypesAndPrices'],
        queryFn: visaApi.getVisaTypes,
    });

    // Fetch the application data to get payment amount
    const { data: applicationData, isLoading: isLoadingApplication } = useQuery<ApplicationData | null>({
        queryKey: ['visa-application', formId],
        queryFn: async () => {
            if (!formId) return null;
            try {
                const response = await visaApi.getVisaApplication(formId);
                return response;
            } catch (error) {
                console.error('Error fetching application:', error);
                return null;
            }
        },
        enabled: !!formId,
    });

    useEffect(() => {
        if (applicationData && applicationData.paymentStatus === 'paid') {
            setPaymentStatus('paid');
        }
    }, [applicationData]);

    // Create Stripe session mutation
    const createStripeSessionMutation = useMutation({
        mutationFn: (data: { formId: string }) => visaApi.createStripeSession(data),
        onSuccess: (data) => {
            // Redirect to Stripe checkout page
            console.log('Stripe session created:', data);
            if (data?.data && data?.data?.session_url) {
                window.location.href = data?.data?.session_url;
            } else {
                setPaymentStatus('error');
                setPaymentError('Failed to create payment session');
            }
        },
        onError: (error: Error) => {
            console.error('Stripe session creation error:', error);
            setPaymentStatus('error');
            setPaymentError(error.message || 'Failed to initialize payment');
        },
    });

    // Calculate payment amount based on visa type, validity and number of applicants
    const calculatePaymentDetails = (): PaymentDetails => {
        if (!applicationData || !applicationData.visaDetails || !visaTypesData) {
            return { feePerApplicant: 0, totalFee: 0 };
        }

        const { visaType, visaValidity } = applicationData.visaDetails;

        // Find the selected visa type and validity price from visaTypesData
        const selectedVisaTypeData = visaTypesData.visaTypes?.find(
            (type: VisaTypeData) => type.name === visaType
        );

        if (!selectedVisaTypeData) {
            console.error('Selected visa type not found:', visaType);
            return { feePerApplicant: 0, totalFee: 0 };
        }

        const selectedValidity = selectedVisaTypeData.validities.find(
            (validity: { type: string; price: number }) => validity.type === visaValidity
        );

        if (!selectedValidity) {
            console.error('Selected validity not found:', visaValidity);
            return { feePerApplicant: 0, totalFee: 0 };
        }

        // Get the visa fee per applicant
        const feePerApplicant = selectedValidity.price;

        // Count total number of applicants (primary + additional)
        const additionalApplicants = applicationData.additionalApplicants || [];
        const totalApplicants =
            1 +
            (Array.isArray(additionalApplicants) ? additionalApplicants.length : 0);

        const totalFee = feePerApplicant * totalApplicants;

        console.log('Payment calculation:', {
            visaType,
            visaValidity,
            feePerApplicant,
            totalApplicants,
            totalFee,
        });

        return {
            feePerApplicant: feePerApplicant,
            totalFee,
        };
    };

    const handlePayment = async () => {
        if (!formId) return;

        setPaymentStatus('loading');
        setPaymentError(null);

        // Create Stripe payment session
        createStripeSessionMutation.mutate({ formId });
    };

    if (isLoadingApplication) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-ethiopia-blue" />
                <span className="ml-2 text-lg">Loading payment information...</span>
            </div>
        );
    }

    if (!applicationData) {
        return (
            <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Unable to load your application data. Please go back and ensure all
                    sections are completed.
                </AlertDescription>
            </Alert>
        );
    }

    // Get visa details for display
    const visaDetails = applicationData.visaDetails || { visaType: '', visaValidity: '' };
    const additionalApplicants = applicationData.additionalApplicants || [];
    const totalApplicants =
        1 + (Array.isArray(additionalApplicants) ? additionalApplicants.length : 0);

    // Calculate payment details
    const { feePerApplicant, totalFee } = calculatePaymentDetails();

    // Fallback to default values if calculation fails
    const displayFeePerApplicant = feePerApplicant || 5000;
    const displayTotalFee =
        totalFee || displayFeePerApplicant * totalApplicants;

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Payment</h2>
                <p className="text-muted-foreground">
                    Complete your visa application by paying the processing fee
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Visa Application Fee</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-4">
                            <span>
                                Visa Fee per Applicant ({visaDetails?.visaType} -{' '}
                                {visaDetails?.visaValidity})
                            </span>
                            <span>${displayFeePerApplicant.toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between items-center border-b pb-4">
                            <span>Primary Applicant</span>
                            <span>${displayFeePerApplicant.toLocaleString()}</span>
                        </div>

                        {Array.isArray(additionalApplicants) &&
                            additionalApplicants.length > 0 && (
                                <div className="flex justify-between items-center border-b pb-4">
                                    <span>
                                        Additional Applicants ({additionalApplicants.length})
                                    </span>
                                    <span>
                                        ${(additionalApplicants.length * displayFeePerApplicant).toLocaleString()}
                                    </span>
                                </div>
                            )}

                        <div className="flex justify-between items-center pt-2 font-bold">
                            <span>Total Amount</span>
                            <span>${displayTotalFee.toLocaleString()}</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    {paymentStatus === 'error' && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Payment Failed</AlertTitle>
                            <AlertDescription>
                                {paymentError ||
                                    'There was an error processing your payment. Please try again.'}
                            </AlertDescription>
                        </Alert>
                    )}

                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handlePayment}
                        disabled={
                            paymentStatus === 'loading' ||
                            paymentStatus === 'paid' ||
                            createStripeSessionMutation.isPending
                        }
                    >
                        {paymentStatus === "paid" ? (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Payment Already Successful
                            </>
                        ) : paymentStatus === 'loading' || createStripeSessionMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Pay ${displayTotalFee.toLocaleString()}
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>

            <div className="flex justify-between pt-6">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep('review')}
                >
                    Review Application
                </Button>

                <Button
                    variant="default"
                    onClick={() => setCurrentStep('attachments')}
                >
                    Attach Documents
                </Button>
            </div>
        </div>
    );
}
