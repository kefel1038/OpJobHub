import { EnterpriseClient, type ApiResponse } from "./index";

export interface EconomicSignalParams {
  signalType?: string;
  limit?: number;
}

declare module "./index" {
  interface EnterpriseClient {
    getEconomicSignals(params?: EconomicSignalParams): Promise<ApiResponse<any>>;
  }
}

EnterpriseClient.prototype.getEconomicSignals = async function (params) {
  return this.request<any>("/enterprise-api/v1/economic/signals", params as any);
};
