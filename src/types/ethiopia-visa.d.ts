export interface VisaApplication {
    _id: string;
    emailAddress: string;
    lastExitUrl: string;
    paymentStatus: string;
    paymentMethod: string;
    paymentId?: string;
    paymentDate: string;
    paymentAmount?: number;
    applicationStatus: string;
    noOfVisa: number;
    additionalApplicants: AdditionalApplicant[];
    createdAt: string;
    updatedAt: string;
    __v: number;
    visaDetails: VisaDetails;
    arrivalInfo: ArrivalInfo;
    personalInfo: PersonalInfo;
    passportInfo: PassportInfo;
    documents?: Documents;
    declaration?: Declaration;
    govRefDetails?: GovRefDetails;
    isComplete: boolean;
    id: string;
}

export interface AdditionalApplicant {
    documents: Documents | null;
    govRefDetails?: GovRefDetails;
    _id: string;
    id: string;
    personalInfo: PersonalInfo;
    passportInfo: PassportInfo;
}

export interface PersonalInfo {
    _id: string;
    formId: string;
    givenName: string;
    surname: string;
    citizenship: string;
    gender: string;
    maritalStatus: string;
    countryOfBirth: string;
    dateOfBirth: string;
    placeOfBirth: string;
    email: string;
    phoneNumber: string;
    occupation: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
    id?: string;
}

export interface PassportInfo {
    _id: string;
    formId: string;
    passportType: string;
    passportNumber: string;
    passportIssueDate: string;
    passportExpiryDate: string;
    passportIssuingCountry: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
    id?: string;
}

export interface VisaDetails {
    _id: string;
    formId: string;
    visaType: string;
    visaValidity: string;
    visaFee: number;
    attachments: Attachment[];
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export interface Attachment {
    fileName: string;
    fileUrl: string;
    fileType: string;
}

export interface ArrivalInfo {
    _id: string;
    formId: string;
    travellingFrom: string;
    arrivalDate: string;
    departureDate: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export interface Declaration {
    _id: string;
    formId: string;
    visitedBefore: boolean;
    dateFrom: string | null;
    dateTo: string | null;
    whereStayed: string | null;
    deportedFromEgyptOrOtherCountry: boolean;
    deportedDateFrom: string | null;
    deportedDateTo: string | null;
    whoIsPaying: string;
    hostType?: string;
    hostName?: string;
    hostPhoneNumber?: string;
    hostEmail?: string;
    hostAddress?: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export interface GovRefDetails {
    _id?: string;
    applicationId: string;
    govRefEmail: string;
    govRefNumber: string;
    comment: string;
    applicantType: 'primary' | 'additional';
    additionalApplicantIndex: number | null;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
}

export interface Documents {
    documents: {
        passport: Document;
        photo: Document;
        applicationLetter: Document;
        supportLetter: Document;
        invitationLetter: Document;
        invitingCompanyInfo: Document;
        registrationLicense: Document;
        businessLicense: Document;
        tinCertificate: Document;
        foreignInvestorEmployeeVisa: Document;
        acceptanceLetter: Document;
        bankStatement: Document;
        companyProfile: Document;
    };
    _id: string;
    visaApplicationId: string;
    applicantType: string;
    additionalApplicantIndex: number | null;
    isComplete: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
    id?: string;
}

export interface Document {
    secure_url?: string;
    public_id?: string;
    fileName?: string;
    uploadedAt: string;
}