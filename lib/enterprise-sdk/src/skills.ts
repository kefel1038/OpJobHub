import { EnterpriseClient, type ApiResponse } from "./index";

export interface SkillEconomyParams {
  skill?: string;
  industry?: string;
  region?: string;
}

declare module "./index" {
  interface EnterpriseClient {
    getSkillEconomy(params?: SkillEconomyParams): Promise<ApiResponse<any>>;
  }
}

EnterpriseClient.prototype.getSkillEconomy = async function (params) {
  return this.request<any>("/enterprise-api/v1/skills/economy", params as any);
};
