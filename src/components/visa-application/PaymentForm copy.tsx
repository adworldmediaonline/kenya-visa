'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import Script from 'next/script';

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
import {
    visaApi,
    CreatePaymentOrderRequest,
    VerifyPaymentRequest,
} from '@/lib/api/endpoints';

// Define payment status type
type PaymentStatus = 'idle' | 'loading' | 'success' | 'error';

// Define types for API responses
interface OrderData {
    key: string;
    amount: number;
    currency: string;
    orderId: string;
}

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

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
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);

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

    // Create payment order mutation
    const createOrderMutation = useMutation({
        mutationFn: (data: CreatePaymentOrderRequest) =>
            visaApi.createPaymentOrder(data),
        onSuccess: (orderData: OrderData) => {
            // Initialize Razorpay checkout with the order data
            initializeRazorpay(orderData);
        },
        onError: (error: Error) => {
            console.error('Payment initialization error:', error);
            setPaymentStatus('error');
            setPaymentError(error.message || 'Failed to initialize payment');
        },
    });

    // Verify payment mutation
    const verifyPaymentMutation = useMutation({
        mutationFn: (data: VerifyPaymentRequest) => visaApi.verifyPayment(data),
        onSuccess: () => {
            setPaymentStatus('success');
            // After successful payment, move to the next step or show confirmation
            setTimeout(() => {
                setCurrentStep('confirmation');
            }, 2000);
        },
        onError: (error: Error) => {
            console.error('Payment verification error:', error);
            setPaymentStatus('error');
            setPaymentError(
                'Payment verification failed. Please contact support.'
            );
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

    interface RazorpayOptions {
        key: string;
        amount: number;
        currency: string;
        name: string;
        description: string;
        order_id: string;
        handler: (response: RazorpayResponse) => void;
        prefill: {
            name: string;
            email: string;
            contact: string;
        };
        theme: {
            color: string;
        };
        modal: {
            ondismiss: () => void;
        };
    }

    const initializeRazorpay = (orderData: OrderData) => {
        // Initialize Razorpay checkout
        const options: RazorpayOptions = {
            key: orderData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
            amount: orderData.amount * 100, // Razorpay expects amount in paise
            currency: orderData.currency || 'USD',
            name: 'Ethiopia Visa Services',
            description: 'Visa Application Fee',
            order_id: orderData.orderId,
            handler: function (response: RazorpayResponse) {
                handlePaymentSuccess(response);
            },
            prefill: {
                name: `${applicationData?.personalInfo?.givenName || ''} ${applicationData?.personalInfo?.surname || ''}`,
                email:
                    applicationData?.personalInfo?.email || applicationData?.emailAddress || '',
                contact: applicationData?.personalInfo?.phoneNumber || '',
            },
            theme: {
                color: '#078930', // Ethiopia blue
            },
            modal: {
                ondismiss: function () {
                    setPaymentStatus('idle');
                },
            },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
    };

    const handlePayment = async () => {
        if (!formId || !razorpayLoaded) return;

        setPaymentStatus('loading');
        setPaymentError(null);

        // Create payment order using mutation
        createOrderMutation.mutate({
            formId,
        });
    };

    const handlePaymentSuccess = async (paymentResponse: RazorpayResponse) => {
        // Verify payment using mutation
        verifyPaymentMutation.mutate({
            formId: formId!,
            paymentId: paymentResponse.razorpay_payment_id,
            orderId: paymentResponse.razorpay_order_id,
            signature: paymentResponse.razorpay_signature,
        });
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
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                onLoad={() => setRazorpayLoaded(true)}
            />

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
                    {paymentStatus === 'success' ? (
                        <Alert className="bg-blue-50 border-blue-200">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <AlertTitle className="text-blue-800">
                                Payment Successful
                            </AlertTitle>
                            <AlertDescription className="text-blue-700">
                                Your payment has been processed successfully. Redirecting to
                                confirmation page...
                            </AlertDescription>
                        </Alert>
                    ) : paymentStatus === 'error' ? (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Payment Failed</AlertTitle>
                            <AlertDescription>
                                {paymentError ||
                                    'There was an error processing your payment. Please try again.'}
                            </AlertDescription>
                        </Alert>
                    ) : null}

                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handlePayment}
                        disabled={
                            paymentStatus === 'loading' ||
                            paymentStatus === 'success' ||
                            !razorpayLoaded ||
                            createOrderMutation.isPending ||
                            verifyPaymentMutation.isPending
                        }
                    >
                        {paymentStatus === 'loading' ||
                            createOrderMutation.isPending ||
                            verifyPaymentMutation.isPending ? (
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
                    onClick={() => setCurrentStep('attachments')}
                >
                    Back to Attachments
                </Button>
            </div>
        </div>
    );
}
