'use client';

import MainLayout from '@/components/layout/MainLayout';
import { visaApi } from '@/lib/api/endpoints';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Search, CheckCircle, XCircle, Clock, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function StatusPage() {
    const [applicationId, setApplicationId] = useState('');
    const [email, setEmail] = useState('');

    const { mutate: checkStatus, data, isPending, isError, error } = useMutation({
        mutationFn: visaApi.checkApplicationStatus,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        checkStatus({ applicationId, email });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'REJECTED':
                return <XCircle className="h-5 w-5 text-red-600" />;
            default:
                return <Clock className="h-5 w-5 text-yellow-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return "bg-green-100 text-green-800 hover:bg-green-100";
            case 'REJECTED':
                return "bg-red-100 text-red-800 hover:bg-red-100";
            default:
                return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
        }
    };

    return (
        <MainLayout
            title="Check Application Status - Ethiopia e-Visa Portal"
            description="Track the status of your Ethiopia e-Visa application online."
        >
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-green-800">Check Application Status</h1>
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
                                className="w-full bg-green-600 hover:bg-green-700"
                                disabled={isPending}
                            >
                                {isPending ? (
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
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainLayout>
    );
}
