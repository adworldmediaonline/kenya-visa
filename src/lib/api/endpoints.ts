import apiClient from './api_client';

export interface ApplicationStatusRequest {
  applicationId: string;
  email: string;
}

export interface ApplicationStatusResponse {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING';
  applicationId: string;
  applicantName: string;
  submissionDate: string;
  estimatedCompletionDate?: string;
  additionalInfo?: string;
}

// Visa details interfaces
export interface VisaDetailsRequest {
  emailAddress: string;
  visaType: string;
  visaValidity: string;
  companyReferenceNumber?: string;
}

export interface VisaDetailsResponse {
  application: {
    _id: string;
  };
  details: VisaDetailsRequest;
}

// Arrival info interfaces
export interface ArrivalInfoRequest {
  formId: string;
  travellingFrom: string;
  arrivalDate: string;
  departureDate: Date;
}

// Personal info interfaces
export interface PersonalInfoData {
  firstName: string;
  lastName: string;
  dateOfBirth: string | Date;
  gender: string;
  nationality: string;
  countryOfBirth: string;
  cityOfBirth: string;
  occupation: string;
  phoneNumber: string;
  address: string;
}

// Passport info interfaces
export interface PassportInfoData {
  passportType: string;
  passportNumber: string;
  passportIssueDate: string | Date;
  passportExpiryDate: string | Date;
  passportIssuingCountry: string;
  passportIssuingAuthority: string;
}

export interface CreatePaymentOrderRequest {
  formId: string;
}

export interface CreatePaymentOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
  key: string;
}

export interface VerifyPaymentRequest {
  formId: string;
  paymentId: string;
  orderId: string;
  signature: string;
}

// Declaration info interfaces
export interface DeclarationInfoData {
  visitedBefore: boolean;
  dateFrom?: Date | string | null;
  dateTo?: Date | string | null;
  whereStayed?: string;
  deportedFromEgyptOrOtherCountry: boolean;
  deportedDateFrom?: Date | string | null;
  deportedDateTo?: Date | string | null;
  whoIsPaying: string;
  hostType?: string;
  hostName?: string;
  hostPhoneNumber?: string;
  hostEmail?: string;
  hostAddress?: string;
}

export const visaApi = {
  // Check application status
  checkApplicationStatus: async (
    data: ApplicationStatusRequest
  ): Promise<ApplicationStatusResponse> => {
    const response = await apiClient.post('/check-status', data);
    return response.data;
  },

  // Get visa application by ID - includes all sections
  getVisaApplication: async (applicationId: string) => {
    try {
      const response = await apiClient.get(`/${applicationId}`);
      return response.data?.data;
    } catch (error: unknown) {
      const err = error as { message: string; response?: { status: number } };
      console.error('Error fetching visa application:', err.message);
      if (err.response?.status === 404) {
        return null; // Return null for not found
      }
      throw error; // Re-throw other errors
    }
  },

  getVisaTypes: async () => {
    const response = await apiClient.get('/visa-types/prices');
    return response.data;
  },

  // Visa details methods
  createVisaDetails: async (
    data: VisaDetailsRequest
  ): Promise<VisaDetailsResponse> => {
    const response = await apiClient.post('/visa-details', data);
    return response.data;
  },

  getVisaDetails: async (formId: string) => {
    try {
      const response = await apiClient.get(`/visa-details/${formId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { message: string; response?: { status: number } };
      console.error('Error fetching visa details:', err.message);
      if (err.response?.status === 404) {
        return null; // Return null for not found, so we can handle it gracefully
      }
      throw error; // Re-throw other errors
    }
  },

  updateVisaDetails: async (
    formId: string,
    data: Partial<VisaDetailsRequest>
  ) => {
    const response = await apiClient.put(`/visa-details/${formId}`, data);
    return response.data;
  },

  // Arrival info methods
  createArrivalInfo: async (data: ArrivalInfoRequest) => {
    console.log('API - createArrivalInfo called with data:', data);
    if (!data.formId) {
      console.error('No formId provided in ArrivalInfoRequest');
      throw new Error('Form ID is required for creating arrival information');
    }

    try {
      const response = await apiClient.post('/arrival-info', data);
      console.log('API - createArrivalInfo response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API - createArrivalInfo error:', error);
      throw error;
    }
  },

  getArrivalInfo: async (formId: string) => {
    try {
      const response = await apiClient.get(`/arrival-info/${formId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { message: string; response?: { status: number } };
      console.error('Error fetching arrival info:', err.message);
      if (err.response?.status === 404) {
        return null; // Return null for not found, so we can handle it gracefully
      }
      throw error; // Re-throw other errors
    }
  },

  updateArrivalInfo: async (
    formId: string,
    data: Partial<ArrivalInfoRequest>
  ) => {
    const response = await apiClient.put(`/arrival-info/${formId}`, data);
    return response.data;
  },

  // Personal info methods
  createPersonalInfo: async (
    formId: string,
    data: Partial<PersonalInfoData>
  ) => {
    console.log('API - createPersonalInfo called with formId:', formId);
    if (!formId) {
      console.error('No formId provided to createPersonalInfo');
      throw new Error('Form ID is required for creating personal information');
    }

    try {
      const response = await apiClient.post('/personal-info', {
        ...data,
        formId: formId,
      });
      console.log('API - createPersonalInfo response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API - createPersonalInfo error:', error);
      throw error;
    }
  },

  getPersonalInfo: async (formId: string) => {
    console.log('API - getPersonalInfo called with formId:', formId);
    if (!formId) {
      console.error('No formId provided to getPersonalInfo');
      return null;
    }

    try {
      const response = await apiClient.get(`/personal-info/${formId}`);
      console.log('API - getPersonalInfo response:', response.data);
      return response.data;
    } catch (error: unknown) {
      const err = error as { message: string; response?: { status: number } };
      console.error('Error fetching personal info:', err.message);
      if (err.response?.status === 404) {
        return null; // Return null for not found
      }
      throw error; // Re-throw other errors
    }
  },

  updatePersonalInfo: async (
    formId: string,
    data: Partial<PersonalInfoData>
  ) => {
    console.log('API - updatePersonalInfo called with formId:', formId);
    if (!formId) {
      console.error('No formId provided to updatePersonalInfo');
      throw new Error('Form ID is required for updating personal information');
    }

    try {
      const response = await apiClient.put(`/personal-info/${formId}`, data);
      console.log('API - updatePersonalInfo response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API - updatePersonalInfo error:', error);
      throw error;
    }
  },

  // Passport info methods
  createPassportInfo: async (
    formId: string,
    data: Partial<PassportInfoData>
  ) => {
    console.log('API - createPassportInfo called with formId:', formId);
    if (!formId) {
      console.error('No formId provided to createPassportInfo');
      throw new Error('Form ID is required for creating passport information');
    }

    try {
      const response = await apiClient.post('/passport-info', {
        ...data,
        formId: formId,
      });
      console.log('API - createPassportInfo response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API - createPassportInfo error:', error);
      throw error;
    }
  },

  getPassportInfo: async (formId: string) => {
    try {
      const response = await apiClient.get(`/passport-info/${formId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { message: string; response?: { status: number } };
      console.error('Error fetching passport info:', err.message);
      if (err.response?.status === 404) {
        return null; // Return null for not found
      }
      throw error; // Re-throw other errors
    }
  },

  updatePassportInfo: async (
    formId: string,
    data: Partial<PassportInfoData>
  ) => {
    const response = await apiClient.put(`/passport-info/${formId}`, data);
    return response.data;
  },

  // Submit the full application
  submitApplication: async (formId: string) => {
    console.log('API - submitApplication called with formId:', formId);
    if (!formId) {
      console.error('No formId provided to submitApplication');
      throw new Error('Form ID is required for submitting application');
    }

    try {
      const response = await apiClient.post(`/submit/${formId}`);
      console.log('API - submitApplication response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API - submitApplication error:', error);
      throw error;
    }
  },

  getAdditionalApplicants: async (formId: string) => {
    const response = await apiClient.get(`/additional-applicants/${formId}`);
    return response.data;
  },

  addAdditionalApplicant: async (
    formId: string,
    data: Record<string, unknown>
  ) => {
    const response = await apiClient.post(
      `/additional-applicants/${formId}`,
      data
    );
    return response.data;
  },

  updateAdditionalApplicant: async (
    formId: string,
    applicantIndex: number,
    data: Record<string, unknown>
  ) => {
    const response = await apiClient.put(
      `/additional-applicants/${formId}/${applicantIndex}`,
      data
    );
    return response.data;
  },

  removeAdditionalApplicant: async (formId: string, applicantIndex: number) => {
    const response = await apiClient.delete(
      `/additional-applicants/${formId}/${applicantIndex}`
    );
    return response.data;
  },

  // Declaration info methods
  createDeclaration: async (
    formId: string,
    data: Partial<DeclarationInfoData>
  ) => {
    console.log('API - createDeclaration called with formId:', formId);
    if (!formId) {
      console.error('No formId provided to createDeclaration');
      throw new Error('Form ID is required for creating declaration information');
    }

    try {
      const response = await apiClient.post('/declarations', {
        ...data,
        formId: formId,
      });
      console.log('API - createDeclaration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API - createDeclaration error:', error);
      throw error;
    }
  },

  getDeclaration: async (formId: string) => {
    console.log('API - getDeclaration called with formId:', formId);
    if (!formId) {
      console.error('No formId provided to getDeclaration');
      return null;
    }

    try {
      const response = await apiClient.get(`/declarations/${formId}`);
      console.log('API - getDeclaration response:', response.data);
      return response.data;
    } catch (error: unknown) {
      const err = error as { message: string; response?: { status: number } };
      console.error('Error fetching declaration info:', err.message);
      if (err.response?.status === 404) {
        return null; // Return null for not found
      }
      throw error; // Re-throw other errors
    }
  },

  updateDeclaration: async (
    formId: string,
    data: Partial<DeclarationInfoData>
  ) => {
    console.log('API - updateDeclaration called with formId:', formId);
    if (!formId) {
      console.error('No formId provided to updateDeclaration');
      throw new Error('Form ID is required for updating declaration information');
    }

    try {
      const response = await apiClient.put(`/declarations/${formId}`, data);
      console.log('API - updateDeclaration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API - updateDeclaration error:', error);
      throw error;
    }
  },

  // Document management methods
  uploadDocument: async (formData: FormData) => {
    try {
      const response = await apiClient.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  getDocuments: async (
    applicationId: string,
    applicantType: 'primary' | 'additional' = 'primary',
    additionalApplicantIndex?: number
  ) => {
    try {
      let url = `/documents/${applicationId}/${applicantType}`;
      if (
        applicantType === 'additional' &&
        additionalApplicantIndex !== undefined
      ) {
        url += `/${additionalApplicantIndex}`;
      }
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      const err = error as { message: string; response?: { status: number } };
      console.error('Error fetching documents:', err.message);
      if (err.response?.status === 404) {
        return null; // Return null for not found
      }
      throw error;
    }
  },

  deleteDocument: async (
    applicationId: string,
    documentType: string,
    applicantType: 'primary' | 'additional' = 'primary',
    additionalApplicantIndex?: number
  ) => {
    try {
      let url = `/documents/${applicationId}/${documentType}/${applicantType}`;
      if (
        applicantType === 'additional' &&
        additionalApplicantIndex !== undefined
      ) {
        url += `/${additionalApplicantIndex}`;
      }
      const response = await apiClient.delete(url);
      return response.data;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  createPaymentOrder: async (data: CreatePaymentOrderRequest): Promise<CreatePaymentOrderResponse> => {
    try {
      const response = await apiClient.post('/payments/create-order', data);
      console.log("Create Payement Order Response:", response.data);
      return response.data;
    } catch (error) {
      console.log("Create Payement Order Error:", error);
      console.error('Error creating payment order:', error);
      throw error;
    }
  },

  verifyPayment: async (data: VerifyPaymentRequest) => {
    try {
      const response = await apiClient.post('/payments/verify-payment', data);
      console.log("Verify Payment Response:", response.data);
      return response.data;
    } catch (error) {
      console.log("Verify Payment Error:", error);
      console.error('Error verifying payment:', error);
      throw error;
    }
  },

  createStripeSession: async (data: { formId: string }) => {
    try {
      const response = await apiClient.post('/payments/stripe-payment', data);
      console.log("Create Stripe Session Response:", response.data);
      return response.data;
    } catch (error) {
      console.log("Create Stripe Session Error:", error);
      console.error('Error creating Stripe session:', error);
      throw error;
    }
  },

  verifyStripePayment: async (data: { sessionId: string }) => {
    try {
      const response = await apiClient.post('/payments/stripe-verify-payment', data);
      console.log("Verify Stripe Payment Response:", response.data);
      return response.data;
    } catch (error) {
      console.log("Verify Stripe Payment Error:", error);
      console.error('Error verifying Stripe payment:', error);
      throw error;
    }
  },
};
