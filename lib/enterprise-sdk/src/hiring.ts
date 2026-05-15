import { EnterpriseClient, type ApiResponse } from "./index";

export interface HiringPredictionParams {
  role?: string;
  industry?: string;
  region?: string;
}

declare module "./index" {
  interface EnterpriseClient {
    getHiringPredictions(params?: HiringPredictionParams): Promise<ApiResponse<any>>;
  }
}

EnterpriseClient.prototype.getHiringPredictions = async function (params) {
  return this.request<any>("/enterprise-api/v1/hiring/predictions", params as any);
};
