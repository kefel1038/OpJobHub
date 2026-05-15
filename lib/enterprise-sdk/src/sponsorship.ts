import { EnterpriseClient, type ApiResponse } from "./index";

export interface SponsorshipIntelligenceParams {
  source?: string;
  destination?: string;
}

declare module "./index" {
  interface EnterpriseClient {
    getSponsorshipIntelligence(params?: SponsorshipIntelligenceParams): Promise<ApiResponse<any>>;
    getMarketBalance(params?: { role?: string; region?: string }): Promise<ApiResponse<any>>;
    getEcosystemMetrics(): Promise<ApiResponse<any>>;
    getEmployerIntelligence(params?: { employerId?: number; industry?: string; region?: string }): Promise<ApiResponse<any>>;
    getPlatformIntelligence(params?: {
      includeWorkforce?: boolean; includeMigration?: boolean; includeSkills?: boolean;
      includeRisks?: boolean; includeEconomic?: boolean; region?: string;
    }): Promise<ApiResponse<any>>;
  }
}

EnterpriseClient.prototype.getSponsorshipIntelligence = async function (params) {
  return this.request<any>("/enterprise-api/v1/sponsorship/intelligence", params as any);
};

EnterpriseClient.prototype.getMarketBalance = async function (params) {
  return this.request<any>("/enterprise-api/v1/market/balance", params as any);
};

EnterpriseClient.prototype.getEcosystemMetrics = async function () {
  return this.request<any>("/enterprise-api/v1/ecosystem/metrics");
};

EnterpriseClient.prototype.getEmployerIntelligence = async function (params) {
  return this.request<any>("/enterprise-api/v1/employer/intelligence", params as any);
};

EnterpriseClient.prototype.getPlatformIntelligence = async function (params) {
  return this.request<any>("/enterprise-api/v1/platform/intelligence", params as any);
};
