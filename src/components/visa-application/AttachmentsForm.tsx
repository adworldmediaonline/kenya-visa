'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFormContext } from '@/providers/FormProvider';
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

export default function AttachmentsForm() {
  const { formId, setCurrentStep, updateFormData, markStepCompleted } =
    useFormContext();
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([]);
  const [documentStatus, setDocumentStatus] = useState<
    Record<string, DocumentStatus>
  >({});
  const [uploadsComplete, setUploadsComplete] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant>({
    id: 'primary',
    type: 'primary',
    name: 'Primary Applicant',
  });
  const [applicants, setApplicants] = useState<Applicant[]>([
    { id: 'primary', type: 'primary', name: 'Primary Applicant' },
  ]);

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
      { id: 'primary', type: 'primary', name: 'Primary Applicant' },
    ];

    // Add additional applicants if they exist
    if (applicationData.additionalApplicants?.length > 0) {
      applicationData.additionalApplicants.forEach(
        (
          applicant: {
            givenName?: string;
            surname?: string;
          },
          index: number
        ) => {
          newApplicants.push({
            id: `additional-${index}`,
            type: 'additional',
            index,
            name:
              `${applicant.givenName || ''} ${
                applicant.surname || ''
              }`.trim() || `Additional Applicant ${index + 1}`,
          });
        }
      );
    }

    setApplicants(newApplicants);
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
    if (!applicationData?.visaDetails?.visaType || !visaTypesData?.visaTypes)
      return;

    const visaType = applicationData.visaDetails.visaType;
    const visaTypeData = visaTypesData.visaTypes.find(
      (type: VisaType) => type.name === visaType
    );

    if (visaTypeData) {
      const documents = visaTypeData.attachments || [];
      setRequiredDocuments(documents);

      // Initialize document status
      const initialStatus: Record<string, DocumentStatus> = {};
      documents.forEach((doc: string) => {
        initialStatus[doc] = {
          isUploaded: false,
          isUploading: false,
          error: null,
          progress: 0,
          url: null,
        };
      });
      setDocumentStatus(initialStatus);
    }
  }, [applicationData, visaTypesData]);

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
      const updatedStatus = { ...documentStatus };

      // Map document names to the keys in the documents object
      console.log('existing documents', existingDocuments.data.documents);
      Object.entries(existingDocuments.data.documents).forEach(
        ([key, value]) => {
          // Find the matching required document by normalizing the key
          const matchingDoc = requiredDocuments.find(
            doc =>
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

      setDocumentStatus(updatedStatus);

      // Check if all required documents are uploaded
      const allUploaded = requiredDocuments.every(
        doc => updatedStatus[doc]?.isUploaded
      );
      setUploadsComplete(allUploaded);
    }
  }, [existingDocuments, requiredDocuments]);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (documentType: string, file: File) => {
      if (!formId || !applicationData?.visaDetails?.visaType) {
        toast.error('Missing application data required for upload');
        return;
      }

      // Update document status to uploading
      setDocumentStatus(prev => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          isUploading: true,
          error: null,
          progress: 0,
        },
      }));

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

        if (response.data?.fileInfo?.secure_url) {
          secureUrl = response.data.fileInfo.secure_url;
          console.log('Found secure_url in fileInfo:', secureUrl);
        } else {
          console.log(
            'Looking for document in camelCase format:',
            camelCaseDocType
          );
          // Check if the documents object contains our camelCase key
          if (
            response.data?.documents &&
            response.data.documents[camelCaseDocType]
          ) {
            secureUrl = response.data.documents[camelCaseDocType].secure_url;
            console.log('Found secure_url in documents object:', secureUrl);
          } else {
            console.error('No secure_url found in response');
            console.log(
              'Full response data:',
              JSON.stringify(response.data, null, 2)
            );
          }
        }

        // Update document status with the URL if found
        setDocumentStatus(prev => ({
          ...prev,
          [documentType]: {
            isUploaded: true,
            isUploading: false,
            error: null,
            progress: 100,
            url: secureUrl,
          },
        }));

        // Refetch documents to update the list
        await refetchDocuments();

        toast.success(`${documentType} uploaded successfully`);
      } catch (error) {
        console.error(`Error uploading ${documentType}:`, error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to upload ${documentType}`;

        setDocumentStatus(prev => ({
          ...prev,
          [documentType]: {
            ...prev[documentType],
            isUploading: false,
            error: errorMessage,
            progress: 0,
          },
        }));

        toast.error(errorMessage);
      }
    },
    [formId, applicationData, refetchDocuments, selectedApplicant]
  );

  // Handle form submission
  const handleContinue = useCallback(() => {
    if (uploadsComplete) {
      // Update form data and mark step as completed
      updateFormData('attachments', { completed: true });
      markStepCompleted('attachments');
      setCurrentStep('review');
    } else {
      toast.error('Please upload all required documents before continuing');
    }
  }, [uploadsComplete, updateFormData, markStepCompleted, setCurrentStep]);

  // Handle applicant change
  const handleApplicantChange = (applicant: Applicant) => {
    // Reset document status when changing applicants
    setDocumentStatus({});
    setUploadsComplete(false);
    setSelectedApplicant(applicant);
  };

  // Check if all required documents are uploaded when document status changes
  useEffect(() => {
    if (requiredDocuments.length > 0) {
      const allUploaded = requiredDocuments.every(
        doc => documentStatus[doc]?.isUploaded
      );

      // Only update state if the value has changed
      if (allUploaded !== uploadsComplete) {
        setUploadsComplete(allUploaded);
      }
    }
  }, [documentStatus, requiredDocuments]);

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
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load visa application data. Please go back to previous steps
          and ensure all information is complete.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Required Documents</h2>
        <p className="text-muted-foreground">
          Please upload the following documents to complete your application for{' '}
          {applicationData.visaDetails.visaType}
        </p>
      </div>

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
                {!documentStatus[document]?.isUploaded ? (
                  <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-md">
                    <div className="space-y-2 text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="text-sm">
                        <label
                          htmlFor={`file-${document}-${selectedApplicant.id}`}
                          className="relative cursor-pointer rounded-md font-medium text-primary"
                        >
                          <span>Upload a file</span>
                          <input
                            id={`file-${document}-${selectedApplicant.id}`}
                            name={`file-${document}-${selectedApplicant.id}`}
                            type="file"
                            className="sr-only"
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(document, e.target.files[0]);
                              }
                            }}
                            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                            disabled={documentStatus[document]?.isUploading}
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
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>File uploaded successfully</span>
                      </div>
                    </div>
                    {documentStatus[document]?.url && (
                      <a
                        href={documentStatus[document]?.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline mt-2 inline-block"
                      >
                        View uploaded file
                      </a>
                    )}
                  </div>
                )}

                {documentStatus[document]?.isUploading && (
                  <div className="mt-4">
                    <Progress
                      value={documentStatus[document]?.progress || 0}
                      className="h-2"
                    />
                    <p className="text-sm text-center mt-1">
                      Uploading... Please wait
                    </p>
                  </div>
                )}

                {documentStatus[document]?.error && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {documentStatus[document].error}
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
            ? 'bg-green-50 border-green-200'
            : 'bg-amber-50 border-amber-200'
        }
      >
        {uploadsComplete ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">
              All documents uploaded
            </AlertTitle>
            <AlertDescription className="text-green-600">
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

      <div className="flex justify-between pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('additional-applicants')}
        >
          Previous
        </Button>
        <Button onClick={handleContinue} disabled={!uploadsComplete}>
          Continue to Review
        </Button>
      </div>
    </div>
  );
}
