import { VisaApplication } from '@/types/ethiopia-visa';
import { FormData, FormStep } from './FormProvider';

// Function to integrate API data into your form state
export function integrateApiDataIntoFormState(apiData: VisaApplication) {
    // Extract the formId
    const formId = apiData._id;

    // Extract email address
    const emailAddress = apiData.emailAddress;

    // Determine current step based on the lastExitUrl or application status
    let currentStep: FormStep = 'visa-details';

    if (apiData.lastExitUrl === 'payment') {
        currentStep = 'payment';
    } else if (apiData.lastExitUrl === 'attachments') {
        currentStep = 'attachments';
    } else if (apiData.paymentStatus === 'paid') {
        currentStep = 'confirmation';
    } else if (apiData.applicationStatus === 'submitted') {
        currentStep = 'payment';
    } else if (apiData.lastExitUrl === 'review') {
        currentStep = 'review';
    } else if (apiData.lastExitUrl === 'additional-applicants') {
        currentStep = 'additional-applicants';
    } else if (apiData.lastExitUrl === 'passport-info') {
        currentStep = 'passport-info';
    } else if (apiData.lastExitUrl === 'personal-info') {
        currentStep = 'personal-info';
    } else if (apiData.lastExitUrl === 'arrival-info') {
        currentStep = 'arrival-info';
    } else if (apiData.lastExitUrl === 'visa-details') {
        currentStep = 'visa-details';
    }

    // Map API data to form data structure
    const formData: FormData = {
        'visa-details': apiData.visaDetails ? {
            visaType: apiData.visaDetails.visaType,
            visaValidity: apiData.visaDetails.visaValidity,
            visaFee: apiData.visaDetails.visaFee
        } : {},

        'arrival-info': apiData.arrivalInfo ? {
            arrivalDate: apiData.arrivalInfo.arrivalDate,
            departureDate: apiData.arrivalInfo.departureDate,
            travellingFrom: apiData.arrivalInfo.travellingFrom,
        } : {},

        'personal-info': apiData.personalInfo ? {
            givenName: apiData.personalInfo.givenName,
            surname: apiData.personalInfo.surname,
            citizenship: apiData.personalInfo.citizenship,
            gender: apiData.personalInfo.gender,
            countryOfBirth: apiData.personalInfo.countryOfBirth,
            dateOfBirth: apiData.personalInfo.dateOfBirth,
            placeOfBirth: apiData.personalInfo.placeOfBirth,
            email: apiData.personalInfo.email,
            phoneNumber: apiData.personalInfo.phoneNumber,
            occupation: apiData.personalInfo.occupation,
            maritalStatus: apiData.personalInfo.maritalStatus,
        } : {},

        'passport-info': apiData.passportInfo ? {
            passportType: apiData.passportInfo.passportType,
            passportNumber: apiData.passportInfo.passportNumber,
            passportIssueDate: apiData.passportInfo.passportIssueDate,
            passportExpiryDate: apiData.passportInfo.passportExpiryDate,
            passportIssuingCountry: apiData.passportInfo.passportIssuingCountry
        } : {},

        'additional-applicants': {
            additionalApplicants: apiData.additionalApplicants || [],
            noOfVisa: apiData.noOfVisa || 1
        },

        'attachments': apiData.documents ? {
            documents: apiData.documents.documents || {},
            isComplete: apiData.documents.isComplete || false
        } : {},

        'payment': {
            paymentStatus: apiData.paymentStatus || 'pending'
        },

        'review': {
            applicationStatus: apiData.applicationStatus || 'draft'
        },

        'confirmation': {
            isComplete: apiData.isComplete || false
        }
    };

    // Determine which steps are completed
    const isCompleted = {
        'visa-details': !!apiData.visaDetails,
        'arrival-info': !!apiData.arrivalInfo,
        'personal-info': !!apiData.personalInfo,
        'passport-info': !!apiData.passportInfo,
        'additional-applicants': !!apiData.additionalApplicants,
        'declaration': !!apiData.declaration,
        'review': apiData.applicationStatus === 'submitted',
        'attachments': apiData.documents && apiData.documents.isComplete,
        'payment': apiData.paymentStatus === 'completed',
        'confirmation': !!apiData.isComplete
    };

    return {
        formId,
        emailAddress,
        currentStep,
        formData,
        isCompleted
    };
}

// Usage in your FormProvider component
export function initializeFormProviderWithApiData(apiData: VisaApplication) {
    const { formId, emailAddress, currentStep, formData, isCompleted } = integrateApiDataIntoFormState(apiData);

    // Also save to localStorage for persistence
    localStorage.setItem('kenyaFormId', formId);
    localStorage.setItem('kenyaEmailAddress', emailAddress);
    localStorage.setItem('kenyaFormData', JSON.stringify(formData));
    localStorage.setItem('kenyaStepCompletion', JSON.stringify(isCompleted));
    localStorage.setItem('kenyaCurrentStep', currentStep);

    console.log('Form state initialized from API data:', {
        formId,
        emailAddress,
        currentStep,
        formData,
        isCompleted
    });
}