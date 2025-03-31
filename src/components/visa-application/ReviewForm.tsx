'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFormContext } from '@/providers/FormProvider';
import { visaApi } from '@/lib/api/endpoints';

// Define FormStep type here to match the type in FormProvider
type FormStep =
  | 'visa-details'
  | 'arrival-info'
  | 'personal-info'
  | 'additional-applicants'
  | 'passport-info'
  | 'additional-applicants'
  | 'review'
  | 'attachments';

type SectionKey =
  | 'visaDetails'
  | 'arrivalInfo'
  | 'personalInfo'
  | 'passportInfo'
  | 'additionalApplicants';

// Use a record type instead of any
type ApplicationData = Record<string, Record<string, unknown>>;

// Helper function to safely display values
const safeDisplay = (value: unknown): string => {
  if (value === null || value === undefined) return 'Not provided';
  return String(value);
};

export default function ReviewForm() {
  const { formId, setCurrentStep, isCompleted } = useFormContext();

  const [expandedSections, setExpandedSections] = useState<
    Record<SectionKey, boolean>
  >({
    visaDetails: true,
    arrivalInfo: true,
    personalInfo: true,
    passportInfo: true,
    additionalApplicants: true,
  });

  // Fetch the application data
  const { data: applicationData, isLoading: isLoadingApplication } = useQuery({
    queryKey: ['visa-application', formId],
    queryFn: async () => {
      if (!formId) return null;
      try {
        const response = await visaApi.getVisaApplication(formId);
        return response as ApplicationData;
      } catch (error) {
        console.error('Error fetching application:', error);
        return null;
      }
    },
    enabled: !!formId,
  });

  // Mutation for submitting the application
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!formId) throw new Error('No application ID found');
      return await visaApi.submitApplication(formId);
    },
  });

  // Toggle section expansion
  const toggleSection = (section: SectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Go to specific step for editing
  const handleEdit = (step: FormStep) => {
    setCurrentStep(step);
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString || dateString === 'Not provided') return 'Not provided';
    try {
      return format(new Date(dateString), 'PPP');
    } catch {
      return dateString;
    }
  };

  // Render status for each section
  const renderSectionStatus = (section: SectionKey) => {
    const stepMapping: Record<SectionKey, FormStep> = {
      visaDetails: 'visa-details',
      arrivalInfo: 'arrival-info',
      personalInfo: 'personal-info',
      passportInfo: 'passport-info',
      additionalApplicants: 'additional-applicants',
    };

    const step = stepMapping[section];

    if (isCompleted[step]) {
      return (
        <Badge className="ml-auto flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3" />
          Complete
        </Badge>
      );
    }

    return (
      <Badge className="ml-auto flex items-center gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100">
        <AlertCircle className="h-3 w-3" />
        Incomplete
      </Badge>
    );
  };

  if (isLoadingApplication) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">
          Loading your application information...
        </span>
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

  const { emailAddress, visaDetails, arrivalInfo, personalInfo, passportInfo } =
    applicationData;

  // Check if a specific step is completed
  const isStepCompleted = (step: FormStep): boolean => {
    return !!isCompleted[step];
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Review Your Application</h2>
        <p className="text-muted-foreground">
          Please review all information before submitting your visa application
        </p>
      </div>

      {/* Visa Details Section */}
      <Card>
        <CardHeader
          className="pb-3 cursor-pointer"
          onClick={() => toggleSection('visaDetails')}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <CardTitle>Visa Details</CardTitle>
              {renderSectionStatus('visaDetails')}
            </div>
            <Button variant="ghost" size="icon">
              {expandedSections.visaDetails ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </CardHeader>
        {expandedSections.visaDetails && visaDetails && (
          <>
            <CardContent className="pb-3">
              <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Email Address
                  </dt>
                  <dd className="mt-1 text-sm">{safeDisplay(emailAddress)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Visa Type
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(visaDetails.visaType)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Visa Validity
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(visaDetails.visaValidity)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Company Reference
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(visaDetails.companyReferenceNumber)}
                  </dd>
                </div>
              </dl>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit('visa-details')}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Visa Details
              </Button>
            </CardFooter>
          </>
        )}
      </Card>

      {/* Arrival Information Section */}
      <Card>
        <CardHeader
          className="pb-3 cursor-pointer"
          onClick={() => toggleSection('arrivalInfo')}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <CardTitle>Arrival Information</CardTitle>
              {renderSectionStatus('arrivalInfo')}
            </div>
            <Button variant="ghost" size="icon">
              {expandedSections.arrivalInfo ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </CardHeader>
        {expandedSections.arrivalInfo && arrivalInfo && (
          <>
            <CardContent className="pb-3">
              <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Arrival Date
                  </dt>
                  <dd className="mt-1 text-sm">
                    {formatDate(safeDisplay(arrivalInfo.arrivalDate))}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Departure Country
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(arrivalInfo.departureCountry)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Departure City
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(arrivalInfo.departureCity)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Airline</dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(arrivalInfo.airline)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Flight Number
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(arrivalInfo.flightNumber)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Accommodation Type
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(arrivalInfo.accommodationType)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Accommodation Name
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(arrivalInfo.accommodationName)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Accommodation City
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(arrivalInfo.accommodationCity)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">
                    Accommodation Address
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(arrivalInfo.accommodationStreetAddress)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Accommodation Phone
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(arrivalInfo.accommodationTelephone)}
                  </dd>
                </div>
              </dl>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit('arrival-info')}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Arrival Information
              </Button>
            </CardFooter>
          </>
        )}
      </Card>

      {/* Personal Information Section */}
      <Card>
        <CardHeader
          className="pb-3 cursor-pointer"
          onClick={() => toggleSection('personalInfo')}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <CardTitle>Personal Information</CardTitle>
              {renderSectionStatus('personalInfo')}
            </div>
            <Button variant="ghost" size="icon">
              {expandedSections.personalInfo ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </CardHeader>
        {expandedSections.personalInfo && personalInfo && (
          <>
            <CardContent className="pb-3">
              <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Given Name
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(personalInfo.givenName)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Surname</dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(personalInfo.surname)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Date of Birth
                  </dt>
                  <dd className="mt-1 text-sm">
                    {formatDate(safeDisplay(personalInfo.dateOfBirth))}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Gender</dt>
                  <dd className="mt-1 text-sm capitalize">
                    {safeDisplay(personalInfo.gender)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Citizenship
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(personalInfo.citizenship)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Country of Birth
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(personalInfo.countryOfBirth)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Place of Birth
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(personalInfo.placeOfBirth)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(personalInfo.email)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Phone Number
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(personalInfo.phoneNumber)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Occupation
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(personalInfo.occupation)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">
                    Street Address
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(personalInfo.streetAddress)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">City</dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(personalInfo.addressCity)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Country</dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(personalInfo.addressCountry)}
                  </dd>
                </div>
              </dl>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit('personal-info')}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Personal Information
              </Button>
            </CardFooter>
          </>
        )}
      </Card>

      {/* Passport Information Section */}
      <Card>
        <CardHeader
          className="pb-3 cursor-pointer"
          onClick={() => toggleSection('passportInfo')}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <CardTitle>Passport Information</CardTitle>
              {renderSectionStatus('passportInfo')}
            </div>
            <Button variant="ghost" size="icon">
              {expandedSections.passportInfo ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </CardHeader>
        {expandedSections.passportInfo && passportInfo && (
          <>
            <CardContent className="pb-3">
              <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Passport Type
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(passportInfo.passportType)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Passport Number
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(passportInfo.passportNumber)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Issue Date
                  </dt>
                  <dd className="mt-1 text-sm">
                    {formatDate(safeDisplay(passportInfo.passportIssueDate))}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Expiry Date
                  </dt>
                  <dd className="mt-1 text-sm">
                    {formatDate(safeDisplay(passportInfo.passportExpiryDate))}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Issuing Country
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(passportInfo.passportIssuingCountry)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Issuing Authority
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(passportInfo.passportIssuingAuthority)}
                  </dd>
                </div>
              </dl>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit('passport-info')}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Passport Information
              </Button>
            </CardFooter>
          </>
        )}
      </Card>

      {/* Additional Applicants Section */}
      {applicationData.additionalApplicants && (
        <Card>
          <CardHeader
            className="pb-3 cursor-pointer"
            onClick={() => toggleSection('additionalApplicants')}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <CardTitle>Additional Applicants</CardTitle>
                <Badge className="ml-auto flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-100">
                  <CheckCircle className="h-3 w-3" />
                  {Array.isArray(applicationData.additionalApplicants)
                    ? applicationData.additionalApplicants.length
                    : 0}{' '}
                  Applicant
                  {Array.isArray(applicationData.additionalApplicants) &&
                  applicationData.additionalApplicants.length !== 1
                    ? 's'
                    : ''}
                </Badge>
              </div>
              <Button variant="ghost" size="icon">
                {expandedSections.additionalApplicants ? (
                  <ChevronUp />
                ) : (
                  <ChevronDown />
                )}
              </Button>
            </div>
          </CardHeader>
          {expandedSections.additionalApplicants &&
            applicationData.additionalApplicants &&
            Array.isArray(applicationData.additionalApplicants) &&
            applicationData.additionalApplicants.length > 0 && (
              <>
                <CardContent className="pb-3">
                  {Array.isArray(applicationData.additionalApplicants) &&
                  applicationData.additionalApplicants.length > 0 ? (
                    applicationData.additionalApplicants.map(
                      (
                        applicant: Record<string, Record<string, unknown>>,
                        index: number
                      ) => (
                        <div
                          key={index}
                          className="mb-6 border-b pb-6 last:border-b-0 last:pb-0"
                        >
                          <h4 className="text-lg font-semibold mb-3">
                            Applicant {index + 1}:{' '}
                            {safeDisplay(applicant.personalInfo.givenName)}{' '}
                            {safeDisplay(applicant.personalInfo.surname)}
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">
                                Personal Information
                              </h5>
                              <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-4">
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">
                                    Date of Birth
                                  </dt>
                                  <dd className="mt-1 text-sm">
                                    {formatDate(
                                      safeDisplay(
                                        applicant.personalInfo.dateOfBirth
                                      )
                                    )}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">
                                    Gender
                                  </dt>
                                  <dd className="mt-1 text-sm capitalize">
                                    {safeDisplay(applicant.personalInfo.gender)}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">
                                    Citizenship
                                  </dt>
                                  <dd className="mt-1 text-sm">
                                    {safeDisplay(
                                      applicant.personalInfo.citizenship
                                    )}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">
                                    Country of Birth
                                  </dt>
                                  <dd className="mt-1 text-sm">
                                    {safeDisplay(
                                      applicant.personalInfo.countryOfBirth
                                    )}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">
                                    Place of Birth
                                  </dt>
                                  <dd className="mt-1 text-sm">
                                    {safeDisplay(
                                      applicant.personalInfo.placeOfBirth
                                    )}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">
                                    Email
                                  </dt>
                                  <dd className="mt-1 text-sm">
                                    {safeDisplay(applicant.personalInfo.email)}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">
                                    Phone Number
                                  </dt>
                                  <dd className="mt-1 text-sm">
                                    {safeDisplay(
                                      applicant.personalInfo.phoneNumber
                                    )}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">
                                    Occupation
                                  </dt>
                                  <dd className="mt-1 text-sm">
                                    {safeDisplay(
                                      applicant.personalInfo.occupation
                                    )}
                                  </dd>
                                </div>
                                <div className="sm:col-span-2">
                                  <dt className="text-sm font-medium text-gray-500">
                                    Address
                                  </dt>
                                  <dd className="mt-1 text-sm">
                                    {safeDisplay(
                                      applicant.personalInfo.streetAddress
                                    )}
                                    ,
                                    {safeDisplay(
                                      applicant.personalInfo.addressCity
                                    )}
                                    ,
                                    {safeDisplay(
                                      applicant.personalInfo.addressCountry
                                    )}
                                  </dd>
                                </div>
                              </dl>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">
                                Passport Information
                              </h5>
                              <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-4">
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">
                                    Passport Type
                                  </dt>
                                  <dd className="mt-1 text-sm">
                                    {safeDisplay(
                                      applicant.passportInfo.passportType
                                    )}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">
                                    Passport Number
                                  </dt>
                                  <dd className="mt-1 text-sm">
                                    {safeDisplay(
                                      applicant.passportInfo.passportNumber
                                    )}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">
                                    Issue Date
                                  </dt>
                                  <dd className="mt-1 text-sm">
                                    {formatDate(
                                      safeDisplay(
                                        applicant.passportInfo.passportIssueDate
                                      )
                                    )}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">
                                    Expiry Date
                                  </dt>
                                  <dd className="mt-1 text-sm">
                                    {formatDate(
                                      safeDisplay(
                                        applicant.passportInfo
                                          .passportExpiryDate
                                      )
                                    )}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">
                                    Issuing Country
                                  </dt>
                                  <dd className="mt-1 text-sm">
                                    {safeDisplay(
                                      applicant.passportInfo
                                        .passportIssuingCountry
                                    )}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">
                                    Issuing Authority
                                  </dt>
                                  <dd className="mt-1 text-sm">
                                    {safeDisplay(
                                      applicant.passportInfo
                                        .passportIssuingAuthority
                                    )}
                                  </dd>
                                </div>
                              </dl>
                            </div>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-muted-foreground text-center py-4">
                      No additional applicants added for this application.
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit('additional-applicants')}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    {Array.isArray(applicationData.additionalApplicants) &&
                    applicationData.additionalApplicants.length > 0
                      ? 'Edit Additional Applicants'
                      : 'Add Additional Applicants'}
                  </Button>
                </CardFooter>
              </>
            )}
        </Card>
      )}

      {/* Declaration and Submission Section */}
      <Card>
        <CardHeader>
          <CardTitle>Declaration</CardTitle>
          <CardDescription>
            Please read the following declaration before submitting your
            application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <p>
              I hereby declare that the information provided in this application
              is true, complete and accurate to the best of my knowledge.
            </p>
            <p>
              I understand that providing false or misleading information may
              result in my application being rejected or my visa being
              cancelled.
            </p>
            <p>
              I understand that submission of this application does not
              guarantee approval and additional documentation may be requested.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
          <Alert className="w-full">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Ready to submit?</AlertTitle>
            <AlertDescription>
              Please ensure all sections are complete and accurate before
              submitting your application.
            </AlertDescription>
          </Alert>

          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={() => handleEdit('additional-applicants')}
            >
              Previous
            </Button>

            <Button
              onClick={() => submitMutation.mutate()}
              disabled={
                submitMutation.isPending ||
                !isStepCompleted('passport-info') ||
                !isStepCompleted('attachments')
              }
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
