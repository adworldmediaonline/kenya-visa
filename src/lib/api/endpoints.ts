import apiClient from "./api_client";

export interface ApplicationStatusRequest {
  applicationId: string;
  email: string;
}

export interface ApplicationStatusResponse {
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSING";
  applicationId: string;
  applicantName: string;
  submissionDate: string;
  estimatedCompletionDate?: string;
  additionalInfo?: string;
}

export const visaApi = {
  // Check application status
  checkApplicationStatus: async (
    data: ApplicationStatusRequest
  ): Promise<ApplicationStatusResponse> => {
    const response = await apiClient.post("/check-status", data);
    return response.data;
  },

  getVisaTypes: async () => {
    const response = await apiClient.get("/visa-types/prices");
    return response.data;
  },
};
