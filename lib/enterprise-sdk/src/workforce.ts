import { EnterpriseClient, type ApiResponse } from "./index";

export interface WorkforceIntelligenceParams {
  region?: string;
  industry?: string;
  metricType?: string;
}

export interface WorkforceForecastParams {
  role?: string;
  region?: string;
  horizon?: string;
}

export interface WorkforceFlowsParams {
  source?: string;
  destination?: string;
  timeRange?: string;
}

declare module "./index" {
  interface EnterpriseClient {
    getWorkforceIntelligence(params?: WorkforceIntelligenceParams): Promise<ApiResponse<any>>;
    getWorkforceForecasts(params?: WorkforceForecastParams): Promise<ApiResponse<any>>;
    getWorkforceFlows(params?: WorkforceFlowsParams): Promise<ApiResponse<any>>;
  }
}

EnterpriseClient.prototype.getWorkforceIntelligence = async function (params) {
  return this.request<any>("/enterprise-api/v1/workforce/intelligence", params as any);
};

EnterpriseClient.prototype.getWorkforceForecasts = async function (params) {
  return this.request<any>("/enterprise-api/v1/workforce/forecasts", params as any);
};

EnterpriseClient.prototype.getWorkforceFlows = async function (params) {
  return this.request<any>("/enterprise-api/v1/workforce/flows", params as any);
};
