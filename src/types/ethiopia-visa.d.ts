export interface Document {
    secure_url?: string;
    public_id?: string;
    fileName?: string;
    uploadedAt: string;
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

export interface PersonalInfo {
    _id: string;
    formId: string;
    givenName: string;
    surname: string;
    citizenship: string;
    gender: string;
    countryOfBirth: string;
    dateOfBirth: string;
    placeOfBirth: string;
    email: string;
    phoneNumber: string;
    occupation: string;
    streetAddress: string;
    addressCity: string;
    addressCountry: string;
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
    passportIssuingAuthority: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
    id?: string;
}

export interface ArrivalInfo {
    _id: string;
    formId: string;
    arrivalDate: string;
    departureCountry: string;
    departureCity: string;
    airline: string;
    flightNumber: string;
    accommodationType: string;
    accommodationName: string;
    accommodationCity: string;
    accommodationStreetAddress: string;
    accommodationTelephone: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export interface VisaDetails {
    _id: string;
    formId: string;
    visaType: string;
    visaValidity: string;
    companyReferenceNumber: string;
    visaFee: number;
    attachments: Attachment[];
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export interface AdditionalApplicant {
    personalInfo: PersonalInfo;
    passportInfo: PassportInfo;
    _id: string;
    documents: Documents;
    id: string;
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

export interface VisaApplication {
    _id: string;
    emailAddress: string;
    lastExitUrl: string;
    paymentStatus: string;
    paymentId: string;
    paymentDate: string;
    paymentAmount: number;
    paymentMethod: string;
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
    documents: Documents;
    govRefDetails?: GovRefDetails,
    isComplete: boolean;
    id: string;
}


export interface Attachment {
    fileName: string;
    fileUrl: string;
    fileType: string;
}