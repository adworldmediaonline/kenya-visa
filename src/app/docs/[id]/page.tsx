'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { visaApi } from '@/lib/api/endpoints';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import MainLayout from '@/components/layout/MainLayout';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Define visa type interface
interface VisaType {
    name: string;
    validities: Array<{ type: string; price: number }>;
    attachments: string[];
}

// Define document status interface
interface DocumentStatus {
    isUploaded: boolean;
    isUploading: boolean;
    error: string | null;
    progress: number;
    url: string | null;
}

// Define applicant type
interface Applicant {
    id: string;
    type: 'primary' | 'additional';
    index?: number;
    name: string;
}

/* eslint-disable react-hooks/exhaustive-deps */

export default function AttachmentsForm() {
    const params = useParams();
    const formId = params.id as string;
    const [requiredDocuments, setRequiredDocuments] = useState<string[]>([]);

    // Track document status per applicant
    const [documentStatusMap, setDocumentStatusMap] = useState<
        Record<string, Record<string, DocumentStatus>>
    >({
        primary: {},
    });

    const [uploadsComplete, setUploadsComplete] = useState(false);
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant>({
        id: 'primary',
        type: 'primary',
        name: 'Primary Applicant',
    });
    const [applicants, setApplicants] = useState<Applicant[]>([
        { id: 'primary', type: 'primary', name: 'Primary Applicant' },
    ]);

    // Helper function to update a specific applicant's document status
    const updateDocumentStatus = useCallback(
        (applicantId: string, updates: Record<string, DocumentStatus>) => {
            setDocumentStatusMap(prev => {
                const updated = { ...prev };
                if (!updated[applicantId]) {
                    updated[applicantId] = {};
                }

                updated[applicantId] = {
                    ...updated[applicantId],
                    ...updates,
                };

                return updated;
            });
        },
        []
    );

    // Fetch application data to get visa type and additional applicants
    const { data: applicationData, isLoading: isLoadingApplication } = useQuery({
        queryKey: ['visa-application', formId],
        queryFn: async () => {
            if (!formId) return null;
            return await visaApi.getVisaApplication(formId);
        },
        enabled: !!formId,
    });

    // Setup applicants list when application data is loaded
    useEffect(() => {
        if (!applicationData) return;

        const newApplicants: Applicant[] = [
            {
                id: 'primary', type: 'primary', name: `${applicationData?.personalInfo?.givenName || ''} ${applicationData?.personalInfo?.surname || ''}` || 'Primary Applicant'
            },
        ];

        // Add additional applicants if they exist
        if (applicationData.additionalApplicants?.length > 0) {
            applicationData.additionalApplicants.forEach(
                (
                    data: {
                        personalInfo: {
                            givenName: string;
                            surname: string;
                        };
                    },
                    index: number
                ) => {
                    const applicantId = `additional- ${index}`;
                    newApplicants.push({
                        id: applicantId,
                        type: 'additional',
                        index,
                        name:
                            `${data?.personalInfo?.givenName || ''} ${data?.personalInfo?.surname || ''
                                } `.trim() || `Additional Applicant ${index + 1} `,
                    });
                }
            );
        }

        // Update applicants list
        setApplicants(newApplicants);

        // Initialize document status map for all applicants in one batch update
        setDocumentStatusMap(prev => {
            const updated = { ...prev };
            newApplicants.forEach(applicant => {
                if (!updated[applicant.id]) {
                    updated[applicant.id] = {};
                }
            });
            return updated;
        });
    }, [applicationData]);

    // Fetch visa types and prices to get required documents
    const { data: visaTypesData } = useQuery({
        queryKey: ['visa-types'],
        queryFn: () => visaApi.getVisaTypes(),
    });

    // Fetch existing documents for selected applicant
    const { data: existingDocuments, refetch: refetchDocuments } = useQuery({
        queryKey: [
            'documents',
            formId,
            selectedApplicant.type,
            selectedApplicant.index,
        ],
        queryFn: async () => {
            if (!formId) return null;
            try {
                // For additional applicants, include index parameter
                if (
                    selectedApplicant.type === 'additional' &&
                    selectedApplicant.index !== undefined
                ) {
                    return await visaApi.getDocuments(
                        formId,
                        selectedApplicant.type,
                        selectedApplicant.index
                    );
                }
                // For primary applicant
                return await visaApi.getDocuments(formId);
            } catch (error) {
                const err = error as { response?: { data?: { message?: string } } };
                if (
                    err.response?.data?.message ===
                    'No documents found for this application'
                ) {
                    return {
                        success: false,
                        message: 'No documents found for this application',
                        data: { documents: {} },
                    };
                }
                throw error;
            }
        },
        enabled: !!formId,
    });

    // Initialize document status based on required documents
    useEffect(() => {
        if (
            !applicationData?.visaDetails?.visaType ||
            !visaTypesData?.visaTypes ||
            !applicants.length
        )
            return;

        const visaType = applicationData.visaDetails.visaType;
        const visaTypeData = visaTypesData.visaTypes.find(
            (type: VisaType) => type.name === visaType
        );

        if (visaTypeData) {
            const documents = visaTypeData.attachments || [];
            setRequiredDocuments(documents);

            // Initialize all applicants' document statuses in one batch update
            setDocumentStatusMap(prev => {
                const updated = { ...prev };

                applicants.forEach(applicant => {
                    if (!updated[applicant.id]) {
                        updated[applicant.id] = {};
                    }

                    const applicantDocuments = updated[applicant.id];
                    documents.forEach((doc: string) => {
                        if (!applicantDocuments[doc]) {
                            applicantDocuments[doc] = {
                                isUploaded: false,
                                isUploading: false,
                                error: null,
                                progress: 0,
                                url: null,
                            };
                        }
                    });
                });

                return updated;
            });
        }
    }, [applicationData, visaTypesData, applicants]);

    // Update document status based on existing documents
    useEffect(() => {
        if (!existingDocuments) return;

        // Handle case when no documents are found (success: false)
        if (
            existingDocuments.success === false ||
            (existingDocuments.data && existingDocuments.data.success === false)
        ) {
            console.log('No existing documents found or error occurred');
            return;
        }

        if (existingDocuments?.data?.documents && requiredDocuments.length > 0) {
            const currentApplicantId = selectedApplicant.id;

            setDocumentStatusMap(prev => {
                const updated = { ...prev };
                if (!updated[currentApplicantId]) {
                    updated[currentApplicantId] = {};
                }

                const updatedStatus = { ...updated[currentApplicantId] };

                // Map document names to the keys in the documents object
                console.log('existing documents', existingDocuments.data.documents);
                Object.entries(existingDocuments.data.documents).forEach(
                    ([key, value]) => {
                        // Find the matching required document by normalizing the key
                        const matchingDoc = requiredDocuments.find(
                            (doc: string) =>
                                doc.toLowerCase().replace(/\s+/g, '') ===
                                key.toLowerCase().replace(/\s+/g, '')
                        );

                        if (
                            matchingDoc &&
                            value &&
                            typeof value === 'object' &&
                            'secure_url' in value &&
                            value.secure_url
                        ) {
                            updatedStatus[matchingDoc] = {
                                isUploaded: true,
                                isUploading: false,
                                error: null,
                                progress: 100,
                                url: value.secure_url as string,
                            };
                        }
                    }
                );

                // Only update if there's actually a change
                if (
                    JSON.stringify(updated[currentApplicantId]) !==
                    JSON.stringify(updatedStatus)
                ) {
                    updated[currentApplicantId] = updatedStatus;
                }

                return updated;
            });

            // Check documents upload status in a separate effect to avoid circular dependencies
        }
    }, [existingDocuments, requiredDocuments, selectedApplicant.id]);

    // Separate effect to check upload status to avoid circular dependencies
    useEffect(() => {
        if (
            !requiredDocuments.length ||
            !selectedApplicant.id ||
            !documentStatusMap[selectedApplicant.id]
        ) {
            return;
        }

        const currentApplicantDocs = documentStatusMap[selectedApplicant.id];
        const allUploaded = requiredDocuments.every(
            (doc: string) => currentApplicantDocs[doc]?.isUploaded
        );

        // Only update state if the value has changed
        if (allUploaded !== uploadsComplete) {
            setUploadsComplete(allUploaded);
        }
    }, [documentStatusMap, requiredDocuments, selectedApplicant.id]);

    // Handle file upload
    const handleFileUpload = useCallback(
        async (documentType: string, file: File) => {
            if (!formId || !applicationData?.visaDetails?.visaType) {
                toast.error('Missing application data required for upload');
                return;
            }

            const currentApplicantId = selectedApplicant.id;

            // Update document status to uploading
            updateDocumentStatus(currentApplicantId, {
                [documentType]: {
                    ...(documentStatusMap[currentApplicantId]?.[documentType] || {}),
                    isUploading: true,
                    error: null,
                    progress: 0,
                },
            });

            try {
                // Create form data for upload
                const formData = new FormData();
                formData.append('image', file);
                formData.append('applicationId', formId);
                formData.append('documentType', documentType);
                formData.append('visaType', applicationData.visaDetails.visaType);

                // Add applicant type and index if applicable
                formData.append('applicantType', selectedApplicant.type);
                if (
                    selectedApplicant.type === 'additional' &&
                    selectedApplicant.index !== undefined
                ) {
                    formData.append(
                        'additionalApplicantIndex',
                        selectedApplicant.index.toString()
                    );
                }

                // Upload file
                const response = await visaApi.uploadDocument(formData);

                console.log('Upload response:', JSON.stringify(response, null, 2));

                // Convert the document type to camelCase to match backend storage
                const camelCaseDocType = documentType
                    .split(/\s+/)
                    .map((word, index) => {
                        if (index === 0) return word.toLowerCase();
                        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                    })
                    .join('');

                let secureUrl = '';

                // Enhanced debugging and response handling
                console.log('Full response structure:', response);

                if (response.data?.fileInfo?.secure_url) {
                    secureUrl = response.data.fileInfo.secure_url;
                    console.log('Found secure_url in fileInfo:', secureUrl);
                } else if (
                    response.data?.documents &&
                    response.data.documents[camelCaseDocType]?.secure_url
                ) {
                    secureUrl = response.data.documents[camelCaseDocType].secure_url;
                    console.log('Found secure_url in documents object:', secureUrl);
                } else if (response.data?.data?.fileInfo?.secure_url) {
                    // Check for nested data object
                    secureUrl = response.data.data.fileInfo.secure_url;
                    console.log('Found secure_url in nested data.fileInfo:', secureUrl);
                } else if (
                    response.data?.data?.documents &&
                    response.data.data.documents[camelCaseDocType]?.secure_url
                ) {
                    // Check for nested documents
                    secureUrl = response.data.data.documents[camelCaseDocType].secure_url;
                    console.log('Found secure_url in nested data.documents:', secureUrl);
                } else if (
                    typeof response.data === 'string' &&
                    response.data.includes('secure_url')
                ) {
                    // Try to parse if response.data is a string that includes secure_url
                    try {
                        const parsedData = JSON.parse(response.data);
                        if (parsedData.secure_url) {
                            secureUrl = parsedData.secure_url;
                            console.log('Found secure_url in parsed string data:', secureUrl);
                        }
                    } catch (e) {
                        console.error('Error parsing response.data as JSON:', e);
                    }
                } else {
                    // Fallback: try to find any secure_url in the response
                    const responseStr = JSON.stringify(response);
                    const urlMatch = responseStr.match(/"secure_url":"([^"]+)"/);
                    if (urlMatch && urlMatch[1]) {
                        secureUrl = urlMatch[1];
                        console.log('Found secure_url using regex match:', secureUrl);
                    } else {
                        // Instead of an error, just log a warning since uploads are working
                        console.warn(
                            'Could not find secure_url in response, but upload appears successful'
                        );
                        console.log(
                            'Response data for debugging:',
                            JSON.stringify(response, null, 2)
                        );

                        // Since the upload is working, set a placeholder URL
                        secureUrl = '#'; // Use empty hash as placeholder
                    }
                }

                // Update document status with the URL if found
                updateDocumentStatus(currentApplicantId, {
                    [documentType]: {
                        isUploaded: true,
                        isUploading: false,
                        error: null,
                        progress: 100,
                        url: secureUrl,
                    },
                });

                // Refetch documents to update the list
                await refetchDocuments();

                toast.success(`${documentType} uploaded successfully`);
            } catch (error) {
                console.error(`Error uploading ${documentType}: `, error);
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : `Failed to upload ${documentType} `;

                updateDocumentStatus(currentApplicantId, {
                    [documentType]: {
                        ...(documentStatusMap[currentApplicantId]?.[documentType] || {}),
                        isUploading: false,
                        error: errorMessage,
                        progress: 0,
                    },
                });

                toast.error(errorMessage);
            }
        },
        [
            formId,
            applicationData,
            refetchDocuments,
            selectedApplicant,
            documentStatusMap,
            updateDocumentStatus,
        ]
    );

    // Handle applicant change to avoid unnecessary state updates
    const handleApplicantChange = useCallback((applicant: Applicant) => {
        setSelectedApplicant(applicant);
        // Reset upload complete state when changing applicant
        setUploadsComplete(false);
    }, []);

    if (isLoadingApplication) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading application data...</span>
            </div>
        );
    }

    if (!applicationData?.visaDetails?.visaType) {
        return (
            <MainLayout>
                <div className="container mx-auto py-10">
                    <div className="max-w-3xl mx-auto">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                No Visa Application found for this application Id : {formId}. Please check the application Id and try again.
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>
            </MainLayout>
        );
    }

    // Get current applicant's document status
    const currentDocumentStatus = documentStatusMap[selectedApplicant.id] || {};

    return (
        <MainLayout>
            <div className="container mx-auto py-10">
                <div className="max-w-3xl mx-auto">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold">Required Documents for <span className='text-blue-700'>Application ID : {formId}</span></h2>
                            <p className="text-muted-foreground">
                                Please upload the following documents to complete your application for{' '}
                                {applicationData.visaDetails.visaType}
                            </p>
                        </div>

                        {applicationData.paymentStatus === "paid" ? (
                            <>
                                {/* Applicant selector */}
                                {applicants.length > 1 && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-medium mb-2">Select Applicant</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {applicants.map(applicant => (
                                                <Button
                                                    key={applicant.id}
                                                    variant={
                                                        selectedApplicant.id === applicant.id ? 'default' : 'outline'
                                                    }
                                                    onClick={() => handleApplicantChange(applicant)}
                                                    className="mb-2"
                                                >
                                                    {applicant.name}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {requiredDocuments.length === 0 ? (
                                    <Alert>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <AlertTitle>Loading</AlertTitle>
                                        <AlertDescription>
                                            Loading required documents for your visa type...
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <div className="space-y-6">
                                        {requiredDocuments.map(document => (
                                            <Card key={document}>
                                                <CardHeader>
                                                    <CardTitle>{document}</CardTitle>
                                                    <CardDescription>
                                                        Upload a clear scan or photo of your {document.toLowerCase()}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    {!currentDocumentStatus[document]?.isUploaded ? (
                                                        <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-md">
                                                            <div className="space-y-2 text-center">
                                                                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                                                                <div className="text-sm">
                                                                    <label
                                                                        htmlFor={`file - ${document} -${selectedApplicant.id} `}
                                                                        className="relative cursor-pointer rounded-md font-medium text-primary"
                                                                    >
                                                                        <span>Upload a file</span>
                                                                        <input
                                                                            id={`file - ${document} -${selectedApplicant.id} `}
                                                                            name={`file - ${document} -${selectedApplicant.id} `}
                                                                            type="file"
                                                                            className="sr-only"
                                                                            onChange={e => {
                                                                                if (e.target.files && e.target.files[0]) {
                                                                                    handleFileUpload(document, e.target.files[0]);
                                                                                }
                                                                            }}
                                                                            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                                                                            disabled={
                                                                                currentDocumentStatus[document]?.isUploading
                                                                            }
                                                                        />
                                                                    </label>
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        PNG, JPG, WebP, or PDF up to 10MB
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 rounded-md bg-muted">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <CheckCircle className="h-5 w-5 text-blue-500" />
                                                                    <span>File uploaded successfully</span>
                                                                </div>
                                                            </div>
                                                            {currentDocumentStatus[document]?.url && (
                                                                <a
                                                                    href={currentDocumentStatus[document]?.url || '#'}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm text-blue-500 hover:underline mt-2 inline-block"
                                                                >
                                                                    View uploaded file
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}

                                                    {currentDocumentStatus[document]?.isUploading && (
                                                        <div className="mt-4">
                                                            <Progress
                                                                value={currentDocumentStatus[document]?.progress || 0}
                                                                className="h-2"
                                                            />
                                                            <p className="text-sm text-center mt-1">
                                                                Uploading... Please wait
                                                            </p>
                                                        </div>
                                                    )}

                                                    {currentDocumentStatus[document]?.error && (
                                                        <Alert variant="destructive" className="mt-2">
                                                            <AlertCircle className="h-4 w-4" />
                                                            <AlertTitle>Error</AlertTitle>
                                                            <AlertDescription>
                                                                {currentDocumentStatus[document].error}
                                                            </AlertDescription>
                                                        </Alert>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}

                                <Alert
                                    className={
                                        uploadsComplete
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-amber-50 border-amber-200'
                                    }
                                >
                                    {uploadsComplete ? (
                                        <>
                                            <CheckCircle className="h-4 w-4 text-blue-500" />
                                            <AlertTitle className="text-blue-700">
                                                All documents uploaded
                                            </AlertTitle>
                                            <AlertDescription className="text-blue-600">
                                                You have successfully uploaded all required documents for{' '}
                                                {selectedApplicant.name}.
                                                {applicants.length > 1 &&
                                                    ' Please ensure all applicants have uploaded their documents.'}
                                            </AlertDescription>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="h-4 w-4 text-amber-500" />
                                            <AlertTitle className="text-amber-700">
                                                Upload all required documents
                                            </AlertTitle>
                                            <AlertDescription className="text-amber-600">
                                                Please upload all required documents for {selectedApplicant.name}{' '}
                                                before proceeding.
                                                {applicants.length > 1 &&
                                                    ' All applicants must upload their documents.'}
                                            </AlertDescription>
                                        </>
                                    )}
                                </Alert>
                            </>
                        ) :
                            <div>
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>
                                        Payment For this application is not completed. Please complete the payment to proceed.

                                        <Button variant="default" className="my-2">
                                            <Link href={`/payment/${formId}`}>
                                                Pay Now
                                            </Link>
                                        </Button>
                                    </AlertDescription>
                                </Alert>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
