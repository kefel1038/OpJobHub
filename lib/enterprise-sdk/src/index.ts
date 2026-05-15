export interface EnterpriseClientConfig {
  baseUrl: string;
  apiKey: string;
}

export interface ExplainabilityMetadata {
  confidence: number;
  confidenceInterval?: { lower: number; upper: number };
  forecastHorizon?: string;
  reliability: string;
  dataFreshness: string;
  driftDetected: boolean;
  uncertaintyLevel: string;
  methodology: string;
  dataSources: string[];
  caveats: string[];
}

export interface ApiResponse<T> {
  data: T;
  explainability: ExplainabilityMetadata;
}

export class EnterpriseClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: EnterpriseClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
  }

  protected async request<T>(path: string, params?: Record<string, string | undefined>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) url.searchParams.set(key, value);
      }
    }
    const response = await fetch(url.toString(), {
      headers: { "x-api-key": this.apiKey },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new EnterpriseApiError(response.status, error.error ?? "Unknown error");
    }
    return response.json();
  }
}

export class EnterpriseApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "EnterpriseApiError";
  }
}

export * from "./workforce";
export * from "./migration";
export * from "./skills";
export * from "./graph";
export * from "./hiring";
export * from "./economic";
export * from "./risk";
export * from "./sponsorship";
