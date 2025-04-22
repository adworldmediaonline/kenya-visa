'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { visaApi } from '@/lib/api/endpoints';

// Loading component to show while the main component is loading
const PaymentStatusLoading = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-md">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Loading Payment Status</h1>
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ethiopia-blue"></div>
                </div>
                <p className="mt-4 text-gray-600">Please wait...</p>
            </div>
        </div>
    </div>
);

// The main component that uses useSearchParams
const PaymentStatusContent = () => {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [paymentDetails, setPaymentDetails] = useState<{
        success: boolean;
        sessionId?: string;
        applicationId?: string;
    }>({
        success: false,
    });

    // Create a mutation for verifying the Stripe payment
    const verifyPaymentMutation = useMutation({
        mutationFn: (sessionId: string) => visaApi.verifyStripePayment({ sessionId }),
        onSuccess: (data) => {
            setPaymentDetails({
                success: true,
                sessionId: searchParams.get('session_id') || undefined,
                applicationId: data.applicationId || data._id,
            });
            setLoading(false);
            setTimeout(() => {
                localStorage.setItem('ethiopiaCurrentStep', 'attachments');
                window.location.href = '/apply'
            }, 5000);
        },
        onError: (error) => {
            console.error('Error verifying payment:', error);
            setPaymentDetails({
                success: false,
                sessionId: searchParams.get('session_id') || undefined,
            });
            setLoading(false);
        }
    });

    useEffect(() => {
        const success = searchParams.get('success') === 'true';
        const sessionId = searchParams.get('session_id');
        const canceled = searchParams.get('canceled') === 'true';

        // If payment was canceled, show error immediately
        if (canceled) {
            setPaymentDetails({
                success: false,
                sessionId: undefined,
            });
            setLoading(false);
            return;
        }

        // If we have a session ID, verify the payment with our backend
        if (sessionId) {
            verifyPaymentMutation.mutate(sessionId);
        } else {
            // No session ID, can't verify
            setPaymentDetails({
                success,
                sessionId: sessionId || undefined,
            });
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-md">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Processing Payment</h1>
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ethiopia-blue"></div>
                        </div>
                        <p className="mt-4 text-gray-600">Please wait while we verify your payment...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                {paymentDetails.success ? (
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <CheckCircle className="h-16 w-16 text-ethiopia-blue" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
                        <p className="text-gray-600 mb-6">
                            Your visa application has been submitted successfully and is now being processed.
                        </p>
                        {paymentDetails.applicationId && (
                            <p className="text-sm mb-4">
                                Application ID: <span className="font-semibold">{paymentDetails.applicationId}</span>
                            </p>
                        )}
                        <div className="mt-6">
                            <Link
                                href="/status"
                                className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Check Application Status
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <XCircle className="h-16 w-16 text-ethiopia-red" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Payment Unsuccessful</h1>
                        <p className="text-gray-600 mb-6">
                            Your payment was not completed successfully. Please try again or contact support if you believe this is an error.
                        </p>
                        {/* <div className="mt-6 space-y-3">
              <Link
                href="/visa-application"
                className="inline-block w-full px-6 py-3 bg-ethiopia-blue text-white font-medium rounded-md hover:bg-opacity-90 transition-colors"
              >
                Try Again
              </Link>
              <Link
                href="/contact"
                className="inline-block w-full px-6 py-3 border border-ethiopia-blue text-ethiopia-blue font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Contact Support
              </Link>
            </div> */}
                    </div>
                )}
            </div>
        </div>
    );
};

// Main component that wraps the content with Suspense
const PaymentStatus = () => {
    return (
        <Suspense fallback={<PaymentStatusLoading />}>
            <PaymentStatusContent />
        </Suspense>
    );
};

export default PaymentStatus;
