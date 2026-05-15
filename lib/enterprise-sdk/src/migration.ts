import { EnterpriseClient, type ApiResponse } from "./index";

export interface MigrationIntelligenceParams {
  source?: string;
  destination?: string;
  corridor?: string;
}

export interface MigrationForecastParams {
  source?: string;
  destination?: string;
  corridor?: string;
}

declare module "./index" {
  interface EnterpriseClient {
    getMigrationIntelligence(params?: MigrationIntelligenceParams): Promise<ApiResponse<any>>;
    getMigrationForecasts(params?: MigrationForecastParams): Promise<ApiResponse<any>>;
  }
}

EnterpriseClient.prototype.getMigrationIntelligence = async function (params) {
  return this.request<any>("/enterprise-api/v1/migration/intelligence", params as any);
};

EnterpriseClient.prototype.getMigrationForecasts = async function (params) {
  return this.request<any>("/enterprise-api/v1/migration/forecasts", params as any);
};
