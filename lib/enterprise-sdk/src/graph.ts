import { EnterpriseClient, type ApiResponse } from "./index";

export interface GraphQueryParams {
  query: string;
  limit?: number;
}

export interface GraphExploreParams {
  nodeType?: string;
  nodeId?: string;
  relationship?: string;
  direction?: string;
  depth?: number;
}

declare module "./index" {
  interface EnterpriseClient {
    queryGraph(params: GraphQueryParams): Promise<ApiResponse<any>>;
    exploreGraph(params?: GraphExploreParams): Promise<ApiResponse<any>>;
  }
}

EnterpriseClient.prototype.queryGraph = async function (params) {
  return this.request<any>("/enterprise-api/v1/graph/query", params as any);
};

EnterpriseClient.prototype.exploreGraph = async function (params) {
  return this.request<any>("/enterprise-api/v1/graph/explore", params as any);
};
