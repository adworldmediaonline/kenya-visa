'use client';

import MainLayout from '@/components/layout/MainLayout';
import { visaApi } from '@/lib/api/endpoints';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Search, CheckCircle, XCircle, Clock, Info, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ApplicationData {
    lastExitUrl?: string;
    paymentStatus?: string;
    applicationStatus?: string;
    formId?: string;
}

export default function StatusPage() {
    const [applicationId, setApplicationId] = useState('');
    const [email, setEmail] = useState('');
    const router = useRouter();

    const { mutate: checkStatus, data, isPending, isError, error } = useMutation({
        mutationFn: visaApi.checkApplicationStatus,
    });

    const { mutate: fetchApplication, data: applicationData, isPending: isLoadingApplication } = useMutation({
        mutationFn: async () => {
            try {
                const response = await visaApi.getVisaApplication(applicationId);
                return response as ApplicationData;
            } catch (error) {
                console.error('Error fetching application:', error);
                throw new Error('Failed to fetch application details');
            }
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        checkStatus({ applicationId, email });
        fetchApplication();
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <CheckCircle className="h-5 w-5 text-blue-600" />;
            case 'REJECTED':
                return <XCircle className="h-5 w-5 text-red-600" />;
            default:
                return <Clock className="h-5 w-5 text-yellow-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return "bg-blue-100 text-blue-800 hover:bg-blue-100";
            case 'REJECTED':
                return "bg-red-100 text-red-800 hover:bg-red-100";
            default:
                return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
        }
    };

    const getContinueUrl = () => {
        if (!applicationData) return null;

        if (applicationData.lastExitUrl === 'payment') {
            return `/payment/${applicationId}`;
        } else if (applicationData.applicationStatus === "submitted" && applicationData.paymentStatus === "pending") {
            return `/payment/${applicationId}`;
        } else if (applicationData.lastExitUrl === 'attachments') {
            return `/docs/${applicationId}`;
        } else if (applicationData.lastExitUrl === 'review') {
            return `/apply/${applicationId}`;
        } else if (applicationData.lastExitUrl === 'additional-applicants') {
            return `/apply/${applicationId}`;
        } else if (applicationData.lastExitUrl === 'passport-info') {
            return `/apply/${applicationId}`;
        } else if (applicationData.lastExitUrl === 'personal-info') {
            return `/apply/${applicationId}`;
        } else if (applicationData.lastExitUrl === 'arrival-info') {
            return `/apply/${applicationId}`;
        } else if (applicationData.lastExitUrl === 'visa-details') {
            return `/apply/${applicationId}`;
        }

        return null;
    };

    const getButtonText = () => {
        if (!applicationData) return 'Continue Application';

        if (applicationData.lastExitUrl === 'payment') {
            return 'Make Payment';
        } else if (applicationData.applicationStatus === "submitted" && applicationData.paymentStatus === "pending") {
            return 'Make Payment';
        } else if (applicationData.lastExitUrl === 'attachments') {
            return 'Upload Documents';
        }

        return 'Continue Application';
    };

    const handleContinue = () => {
        const url = getContinueUrl();
        if (url) {
            router.push(url);
        }
    };

    return (
        <MainLayout
            title="Check Application Status - Ethiopia e-Visa Portal"
            description="Track the status of your Ethiopia e-Visa application online."
        >
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-blue-800">Check Application Status</h1>
                    <p className="text-gray-600 mt-2">Enter your application details to track your e-Visa status</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Application Status Lookup</CardTitle>
                        <CardDescription>
                            Please provide your Application ID and the email address used during application
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="applicationId">Application ID</Label>
                                <Input
                                    id="applicationId"
                                    value={applicationId}
                                    onChange={(e) => setApplicationId(e.target.value)}
                                    placeholder="Enter your application ID"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                disabled={isPending || isLoadingApplication}
                            >
                                {isPending || isLoadingApplication ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Checking Status
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        Check Status
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {isError && (
                    <Alert variant="destructive" className="mt-6">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            {(error as Error).message || 'Failed to check status. Please try again.'}
                        </AlertDescription>
                    </Alert>
                )}

                {data && (
                    <Card className="mt-8">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Application Status</CardTitle>
                                <Badge className={getStatusColor(data.status)} variant="outline">
                                    <span className="flex items-center gap-1">
                                        {getStatusIcon(data.status)}
                                        {data.status}
                                    </span>
                                </Badge>
                            </div>
                            <CardDescription>
                                Submitted on {new Date(data.submissionDate).toISOString().slice(0, 10)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Application ID</h3>
                                    <p className="mt-1 text-base font-semibold">{data.applicationId}</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Applicant Name</h3>
                                    <p className="mt-1 text-base font-semibold">{data.applicantName}</p>
                                </div>

                                {data.estimatedCompletionDate && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Estimated Completion</h3>
                                        <p className="mt-1 text-base font-semibold">
                                            {new Date(data.estimatedCompletionDate).toISOString().slice(0, 10)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {data.additionalInfo && (
                                <>
                                    <Separator className="my-6" />
                                    <div className="flex items-start gap-2">
                                        <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Additional Information</h3>
                                            <p className="mt-1">{data.additionalInfo}</p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Continue Application Button */}
                            {applicationData && data.status !== 'APPROVED' && data.status !== 'REJECTED' && (
                                <>
                                    <Separator className="my-6" />
                                    <div className="mt-4">
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Continue Your Application</h3>
                                        <Button
                                            onClick={handleContinue}
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                        >
                                            {getButtonText()}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Show continue application option even if status check fails but application data is found */}
                {!data && applicationData && (
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Application Found</CardTitle>
                            <CardDescription>
                                You can continue your application from where you left off
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={handleContinue}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                {getButtonText()}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainLayout>
    );
}
