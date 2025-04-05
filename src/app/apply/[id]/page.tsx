'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { visaApi } from '@/lib/api/endpoints';
import { initializeFormProviderWithApiData } from '@/providers/apiIntegration';
import MainLayout from '@/components/layout/MainLayout';
import { VisaApplication } from '@/types/ethiopia-visa';
import { Spinner } from '@/components/ui/spinner';

export default function ResumeApplicationPage() {
    const params = useParams();
    const router = useRouter();
    const formId = params.id as string;

    const { data: applicationData, isLoading, error } = useQuery<VisaApplication | null>({
        queryKey: ['visa-application', formId],
        queryFn: async () => {
            if (!formId) return null;
            try {
                const response = await visaApi.getVisaApplication(formId);
                return response;
            } catch (error) {
                console.error('Error fetching application:', error);
                throw error;
            }
        },
        enabled: !!formId,
        retry: 1,
    });

    useEffect(() => {
        if (applicationData) {
            // Initialize form provider with the fetched data
            initializeFormProviderWithApiData(applicationData);

            // Redirect to the main application page
            window.location.href = '/apply';
        }
    }, [applicationData]);

    if (error) {
        return (
            <MainLayout title="Application Error - Ethiopia Visa">
                <div className="container mx-auto py-16 px-4">
                    <div className="max-w-lg mx-auto text-center">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Application</h1>
                        <p className="mb-6 text-gray-700">
                            We couldn't retrieve your application. The application ID may be invalid or the application has expired.
                        </p>
                        <button
                            onClick={() => router.push('/apply')}
                            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                        >
                            Start New Application
                        </button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="Loading Application - Ethiopia Visa">
            <div className="container mx-auto py-20 px-4">
                <div className="max-w-lg mx-auto text-center">
                    <h1 className="text-2xl font-bold mb-6">Retrieving Your Application</h1>

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <Spinner size="lg" />
                            <p className="text-gray-600">
                                Please wait while we retrieve your application data...
                            </p>
                        </div>
                    )}

                    {!isLoading && !applicationData && (
                        <div>
                            <p className="mb-6 text-gray-700">
                                Application not found. The link may be expired or invalid.
                            </p>
                            <button
                                onClick={() => router.push('/apply')}
                                className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                            >
                                Start New Application
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
