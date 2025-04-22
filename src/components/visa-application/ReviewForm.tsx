'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  | 'declaration'
  | 'review'
  | 'attachments'
  | 'payment';

type SectionKey =
  | 'visaDetails'
  | 'arrivalInfo'
  | 'personalInfo'
  | 'passportInfo'
  | 'additionalApplicants'
  | 'declaration';

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
    visaDetails: false,
    arrivalInfo: false,
    personalInfo: false,
    passportInfo: false,
    additionalApplicants: false,
    declaration: false,
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
      declaration: 'declaration',
    };

    const step = stepMapping[section];

    if (isCompleted[step]) {
      return (
        <Badge className="ml-auto flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-100">
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

  const { emailAddress, visaDetails, arrivalInfo, personalInfo, passportInfo, declaration } =
    applicationData;

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
                    Reason for Travel
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(visaDetails.reasonForTravel)}
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
                {/* Arrival Details */}
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500 mb-2">
                    Arrival Details
                  </dt>
                </div>
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
                    Arriving By
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(arrivalInfo.arrivingBy)}
                  </dd>
                </div>

                {/* Air Arrival Details */}
                {arrivalInfo.arrivingBy === 'By Air' && (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Airline
                      </dt>
                      <dd className="mt-1 text-sm">
                        {safeDisplay(arrivalInfo.arrivalAirline)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Flight Number
                      </dt>
                      <dd className="mt-1 text-sm">
                        {safeDisplay(arrivalInfo.arrivalFlightNumber)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Arrival Airport
                      </dt>
                      <dd className="mt-1 text-sm">
                        {safeDisplay(arrivalInfo.arrivalAirPort)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Origin Country
                      </dt>
                      <dd className="mt-1 text-sm">
                        {safeDisplay(arrivalInfo.originCountry)}
                      </dd>
                    </div>
                  </>
                )}

                {/* Sea Arrival Details */}
                {arrivalInfo.arrivingBy === 'By Sea' && (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Vessel Name
                      </dt>
                      <dd className="mt-1 text-sm">
                        {safeDisplay(arrivalInfo.arrivalVesselName)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Sea Port
                      </dt>
                      <dd className="mt-1 text-sm">
                        {safeDisplay(arrivalInfo.arrivalSeaPort)}
                      </dd>
                    </div>
                  </>
                )}

                {/* Land Arrival Details */}
                {arrivalInfo.arrivingBy === 'By Land' && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Border Crossing Point
                    </dt>
                    <dd className="mt-1 text-sm">
                      {safeDisplay(arrivalInfo.landBorderCrossing)}
                    </dd>
                  </div>
                )}

                {/* Departure Details */}
                <div className="col-span-2 mt-4">
                  <dt className="text-sm font-medium text-gray-500 mb-2">
                    Departure Details
                  </dt>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Departing By
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(arrivalInfo.departureBy)}
                  </dd>
                </div>

                {/* Air Departure Details */}
                {arrivalInfo.departureBy === 'By Air' && (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Airline
                      </dt>
                      <dd className="mt-1 text-sm">
                        {safeDisplay(arrivalInfo.departureAirline)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Flight Number
                      </dt>
                      <dd className="mt-1 text-sm">
                        {safeDisplay(arrivalInfo.departureFlightNumber)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Departure Airport
                      </dt>
                      <dd className="mt-1 text-sm">
                        {safeDisplay(arrivalInfo.departureAirPort)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Destination Country
                      </dt>
                      <dd className="mt-1 text-sm">
                        {safeDisplay(arrivalInfo.destinationCountry)}
                      </dd>
                    </div>
                  </>
                )}

                {/* Sea Departure Details */}
                {arrivalInfo.departureBy === 'By Sea' && (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Vessel Name
                      </dt>
                      <dd className="mt-1 text-sm">
                        {safeDisplay(arrivalInfo.departureVesselName)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Sea Port
                      </dt>
                      <dd className="mt-1 text-sm">
                        {safeDisplay(arrivalInfo.departureSeaPort)}
                      </dd>
                    </div>
                  </>
                )}

                {/* Land Departure Details */}
                {arrivalInfo.departureBy === 'By Land' && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Border Crossing Point
                    </dt>
                    <dd className="mt-1 text-sm">
                      {safeDisplay(arrivalInfo.departureLandBorderCrossing)}
                    </dd>
                  </div>
                )}

                {/* Accommodation Details */}
                <div className="col-span-2 mt-4">
                  <dt className="text-sm font-medium text-gray-500 mb-2">
                    Accommodation Details
                  </dt>
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
                    From Date
                  </dt>
                  <dd className="mt-1 text-sm">
                    {formatDate(safeDisplay(arrivalInfo.accommodationFromDate))}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    To Date
                  </dt>
                  <dd className="mt-1 text-sm">
                    {formatDate(safeDisplay(arrivalInfo.accommodationToDate))}
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
                  <dt className="text-sm font-medium text-gray-500">Marital Status</dt>
                  <dd className="mt-1 text-sm capitalize">
                    {safeDisplay(personalInfo.maritalStatus)}
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
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Street Address
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(personalInfo.streetAddress)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    City
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(personalInfo.addressCity)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Country
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(personalInfo.addressCountry)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Emergency Contact Name
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(personalInfo.emergencyContactName)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Emergency Contact Phone
                  </dt>
                  <dd className="mt-1 text-sm">
                    {safeDisplay(personalInfo.emergencyContactPhone)}
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
      {applicationData?.additionalApplicants && (
        <Card>
          <CardHeader
            className="flex flex-row items-center justify-between cursor-pointer"
            onClick={() => toggleSection('additionalApplicants')}
          >
            <div className="space-y-1">
              <CardTitle>Additional Applicants</CardTitle>
            </div>
            <Button variant="ghost" size="icon">
              {expandedSections.additionalApplicants ? (
                <ChevronUp />
              ) : (
                <ChevronDown />
              )}
            </Button>
          </CardHeader>

          {expandedSections.additionalApplicants && (
            <>
              <CardContent>
                {Array.isArray(applicationData.additionalApplicants) &&
                  applicationData.additionalApplicants.length > 0 ? (
                  <div className="space-y-4">
                    {applicationData.additionalApplicants.map(
                      (applicant, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h3 className="font-medium mb-2">
                            Applicant {index + 1}:{' '}
                            {safeDisplay(applicant.personalInfo?.givenName)}{' '}
                            {safeDisplay(applicant.personalInfo?.surname)}
                          </h3>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-muted-foreground">
                              Date of Birth:
                            </div>
                            <div>
                              {formatDate(
                                safeDisplay(applicant.personalInfo?.dateOfBirth)
                              )}
                            </div>
                            <div className="text-muted-foreground">Gender:</div>
                            <div className="capitalize">
                              {safeDisplay(applicant.personalInfo?.gender)}
                            </div>
                            <div className="text-muted-foreground">
                              Citizenship:
                            </div>
                            <div>
                              {safeDisplay(applicant.personalInfo?.citizenship)}
                            </div>
                            <div className="text-muted-foreground">
                              Passport Number:
                            </div>
                            <div>
                              {safeDisplay(
                                applicant.passportInfo?.passportNumber
                              )}
                            </div>
                            <div className="text-muted-foreground">
                              Passport Expiry:
                            </div>
                            <div>
                              {formatDate(
                                safeDisplay(
                                  applicant.passportInfo?.passportExpiryDate
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-4">
                    No additional applicants added for this application.
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t p-4 flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleEdit('additional-applicants')}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
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

      {/* Declaration Section */}
      <Card>
        <CardHeader
          className="pb-3 cursor-pointer"
          onClick={() => toggleSection('declaration')}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <CardTitle>Declaration</CardTitle>
              {renderSectionStatus('declaration')}
            </div>
            <Button variant="ghost" size="icon">
              {expandedSections.declaration ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </CardHeader>
        {expandedSections.declaration && declaration && (
          <>
            <CardContent className="pb-3">
              <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Trip Financed by Third Party
                  </dt>
                  <dd className="mt-1 text-sm">
                    {typeof declaration.tripFinanced === 'boolean'
                      ? (declaration.tripFinanced ? 'Yes' : 'No')
                      : 'Not provided'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Convicted of Any Offense
                  </dt>
                  <dd className="mt-1 text-sm">
                    {typeof declaration.convictedOfOffence === 'boolean'
                      ? (declaration.convictedOfOffence ? 'Yes' : 'No')
                      : 'Not provided'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Denied Entry to Kenya Before
                  </dt>
                  <dd className="mt-1 text-sm">
                    {typeof declaration.deniedEntryToKenya === 'boolean'
                      ? (declaration.deniedEntryToKenya ? 'Yes' : 'No')
                      : 'Not provided'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Previous Travel to Kenya
                  </dt>
                  <dd className="mt-1 text-sm">
                    {typeof declaration.previousTravelToKenya === 'boolean'
                      ? (declaration.previousTravelToKenya ? 'Yes' : 'No')
                      : 'Not provided'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Bringing Monetary Instruments Over $10,000
                  </dt>
                  <dd className="mt-1 text-sm">
                    {typeof declaration.monetaryInstrument === 'boolean'
                      ? (declaration.monetaryInstrument ? 'Yes' : 'No')
                      : 'Not provided'}
                  </dd>
                </div>

                {declaration.monetaryInstrument === true && (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Monetary Instrument Type
                      </dt>
                      <dd className="mt-1 text-sm">
                        {safeDisplay(declaration.monetaryInstrumentName)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Currency
                      </dt>
                      <dd className="mt-1 text-sm">
                        {safeDisplay(declaration.monetaryInstrumentCurrency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Amount
                      </dt>
                      <dd className="mt-1 text-sm">
                        {safeDisplay(declaration.amount)}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit('declaration')}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Declaration Information
              </Button>
            </CardFooter>
          </>
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={() => handleEdit('declaration')}
        >
          Previous
        </Button>
        <Button onClick={() => setCurrentStep('payment')}>Proceed to Payment</Button>
      </div>
    </div>
  );
}
