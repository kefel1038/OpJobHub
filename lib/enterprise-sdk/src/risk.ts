import { EnterpriseClient, type ApiResponse } from "./index";

export interface RiskIntelligenceParams {
  riskType?: string;
  region?: string;
  industry?: string;
}

declare module "./index" {
  interface EnterpriseClient {
    getRiskIntelligence(params?: RiskIntelligenceParams): Promise<ApiResponse<any>>;
  }
}

EnterpriseClient.prototype.getRiskIntelligence = async function (params) {
  return this.request<any>("/enterprise-api/v1/risk/intelligence", params as any);
};
