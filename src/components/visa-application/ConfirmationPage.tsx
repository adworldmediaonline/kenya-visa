'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Printer, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFormContext } from '@/providers/FormProvider';
import { visaApi } from '@/lib/api/endpoints';

interface ApplicationData {
    personalInfo?: {
        givenName?: string;
        surname?: string;
        [key: string]: unknown;
    };
    visaDetails?: {
        visaType?: string;
        visaValidity?: string;
        [key: string]: unknown;
    };
    arrivalInfo?: {
        arrivalDate?: string;
        [key: string]: unknown;
    };
    additionalApplicants?: Array<{
        personalInfo?: {
            givenName?: string;
            surname?: string;
            [key: string]: unknown;
        };
        [key: string]: unknown;
    }>;
    [key: string]: unknown;
}

export default function ConfirmationPage() {
    const router = useRouter();
    const { formId } = useFormContext();

    // Add print styles when component mounts
    useEffect(() => {
        // Add a style tag to control what gets printed
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                body * {
                    visibility: hidden;
                }
                .print-section, .print-section * {
                    visibility: visible;
                }
                .print-section {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                }
                .no-print {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Fetch the application data
    const { data: applicationData, isLoading } = useQuery<ApplicationData | null>({
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

    const handlePrintConfirmation = () => {
        window.print();
    };

    const handleViewDashboard = () => {
        router.push('/status');
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">
                    Loading application information...
                </span>
            </div>
        );
    }

    if (!applicationData) {
        return (
            <Alert variant="destructive" className="mb-6">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Unable to load your application data. Please refresh the page or contact support.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <CheckCircle className="h-8 w-8 text-blue-600" />
                    <h2 className="text-2xl font-semibold">Application Submitted Successfully</h2>
                </div>
                <p className="text-muted-foreground">
                    Your visa application has been submitted and payment has been received. Please save your application reference for future inquiries.
                </p>
            </div>

            <Card className="print-section">
                <CardHeader>
                    <CardTitle>Application Summary</CardTitle>
                    <CardDescription>
                        Application Reference: <span className="font-medium">{formId}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Applicant</h3>
                                <p className="mt-1">
                                    {applicationData?.personalInfo?.givenName} {applicationData?.personalInfo?.surname}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Visa Type</h3>
                                <p className="mt-1 capitalize">
                                    {applicationData?.visaDetails?.visaType} Visa
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Visa Validity</h3>
                                <p className="mt-1">
                                    {applicationData?.visaDetails?.visaValidity}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Expected Arrival</h3>
                                <p className="mt-1">
                                    {applicationData?.arrivalInfo?.arrivalDate ?
                                        new Date(applicationData.arrivalInfo.arrivalDate).toLocaleDateString() :
                                        'Not specified'}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-md bg-blue-50 p-4 mt-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <CheckCircle className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">Payment Successful</h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <p>
                                            Your payment has been processed successfully. You will receive a confirmation email with your application details shortly.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {Array.isArray(applicationData.additionalApplicants) && applicationData.additionalApplicants.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Additional Applicants</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    {applicationData.additionalApplicants.map((applicant, index) => (
                                        <li key={index} className="text-sm">
                                            {applicant.personalInfo?.givenName} {applicant.personalInfo?.surname}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Next Steps</h3>
                            <ol className="list-decimal pl-5 space-y-2 text-sm">
                                <li>Check your email for a confirmation of your application.</li>
                                <li>Your visa application will be processed within 3-5 business days.</li>
                                <li>You will receive an email notification once your visa is approved.</li>
                                <li>You can check the status of your application anytime using your application reference number.</li>
                            </ol>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-3 no-print">
                    <Button variant="outline" size="sm" onClick={handlePrintConfirmation}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Confirmation
                    </Button>
                    <Button className="ml-auto" onClick={handleViewDashboard}>
                        View Status
                    </Button>
                </CardFooter>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 no-print">
                <div className="flex">
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <p>
                                Please keep your application reference number safe. You will need it for any inquiries regarding your visa application.
                            </p>
                            <p className="mt-2">
                                If you have any questions or need assistance, please contact our support team at <a href="mailto:support@euthopia.gov" className="underline">support@euthopia.gov</a> or call +1-234-567-8900.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
