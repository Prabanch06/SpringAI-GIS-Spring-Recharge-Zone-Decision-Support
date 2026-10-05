import { SpringEntity, UserProfile, UserRole, PriorityWeights, FieldObservation, ModelMetadata, AuditLogItem, InterventionRecommendation, GeospatialDataset, BackgroundJob, TerrainProcessingResult } from '../types';

const BASE_URL = '/api/v1';

/**
 * Wrapper around fetch that throws on non-2xx responses.
 * Ensures the frontend never silently swallows 401/403/500 errors.
 */
async function fetchJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let errorBody: any;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = { error: { message: res.statusText } };
    }
    const message = errorBody?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
    const err = new Error(message) as Error & { status: number; body: any };
    err.status = res.status;
    err.body = errorBody;
    throw err;
  }
  return res.json();
}

export const api = {
  // Health probes
  async getHealth(): Promise<any> {
    return fetchJson('/health');
  },

  async getReady(): Promise<any> {
    return fetchJson('/ready');
  },

  // Auth
  async login(username: string, password: string): Promise<any> {
    return fetchJson(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
  },

  async getMe(): Promise<{ success: boolean; user: UserProfile }> {
    return fetchJson(`${BASE_URL}/auth/me`);
  },

  async switchRole(role: UserRole): Promise<{ success: boolean; user: UserProfile }> {
    return fetchJson(`${BASE_URL}/auth/switch-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
  },

  // Springs
  async getSprings(params?: { search?: string; status?: string; springType?: string }): Promise<{ success: boolean; count: number; data: SpringEntity[] }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.springType) query.append('springType', params.springType);

    return fetchJson(`${BASE_URL}/springs?${query.toString()}`);
  },

  async getSpringById(id: string): Promise<{ success: boolean; data: SpringEntity }> {
    return fetchJson(`${BASE_URL}/springs/${id}`);
  },

  async createSpring(payload: Partial<SpringEntity>): Promise<{ success: boolean; data: SpringEntity }> {
    return fetchJson(`${BASE_URL}/springs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async logDischarge(springId: string, payload: { date: string; discharge: number; season: string; method?: string }): Promise<any> {
    return fetchJson(`${BASE_URL}/springs/${springId}/discharge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  // Delineation
  async runDelineation(springId: string, method: string): Promise<any> {
    return fetchJson(`${BASE_URL}/recharge-zones/delineate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ springId, method })
    });
  },

  // Suitability & Missing Data
  async getSuitability(springId: string, simulateIncompleteData: boolean = false): Promise<any> {
    return fetchJson(`${BASE_URL}/suitability/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ springId, simulateIncompleteData })
    });
  },

  // Interventions & Priority
  async getInterventions(springId: string): Promise<{ success: boolean; data: InterventionRecommendation[] }> {
    return fetchJson(`${BASE_URL}/interventions/recommendations/${springId}`);
  },

  async recalculatePriority(weights: PriorityWeights): Promise<any> {
    return fetchJson(`${BASE_URL}/interventions/recalculate-priority`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weights })
    });
  },

  // Field Validations
  async getFieldValidations(): Promise<{ success: boolean; data: FieldObservation[] }> {
    return fetchJson(`${BASE_URL}/field-validations`);
  },

  async submitFieldValidation(payload: {
    springId: string;
    discharge: number;
    gpsAccuracyM: number;
    geologyNotes: string;
    waterCondition: string;
    interventionStatus: string;
    comments: string;
    sanitaryRisk?: 'Low' | 'Medium' | 'High' | string;
    flowVisible?: boolean;
    strikeDipMeasured?: string;
  }): Promise<any> {
    return fetchJson(`${BASE_URL}/field-validations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async reviewFieldValidation(obsId: string, status: 'Approved' | 'Rejected' | 'Needs Review', reviewComments?: string): Promise<any> {
    return fetchJson(`${BASE_URL}/field-validations/${obsId}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewComments })
    });
  },

  // Datasets Ingestion & Validation (MVP-AC-008, MVP-AC-009)
  async getDatasets(): Promise<{ success: boolean; count: number; data: GeospatialDataset[] }> {
    return fetchJson(`${BASE_URL}/datasets`);
  },

  async uploadDataset(payload: {
    name: string;
    type: 'GeoJSON' | 'GeoTIFF' | 'CSV';
    category: string;
    crs: string;
    rawContent?: any;
    source?: string;
    resolutionM?: number;
  }): Promise<any> {
    return fetchJson(`${BASE_URL}/datasets/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  // DEM Terrain Processing (MVP-AC-012, MVP-AC-014)
  async processDem(demId: string, elevationBase?: number): Promise<{ success: boolean; data: TerrainProcessingResult }> {
    return fetchJson(`${BASE_URL}/terrain/process-dem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demId, elevationBase })
    });
  },

  // Background Asynchronous Jobs (MVP-AC-047, MVP-AC-048)
  async getJobs(): Promise<{ success: boolean; count: number; data: BackgroundJob[] }> {
    return fetchJson(`${BASE_URL}/jobs`);
  },

  async getJobById(jobId: string): Promise<{ success: boolean; data: BackgroundJob }> {
    return fetchJson(`${BASE_URL}/jobs/${jobId}`);
  },

  async submitJob(taskType: string, params?: any): Promise<any> {
    return fetchJson(`${BASE_URL}/jobs/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskType, params })
    });
  },

  // Model Registry & Audit
  async getModels(): Promise<{ success: boolean; data: ModelMetadata[] }> {
    return fetchJson(`${BASE_URL}/models`);
  },

  async getAuditLogs(): Promise<{ success: boolean; data: AuditLogItem[] }> {
    return fetchJson(`${BASE_URL}/audit-logs`);
  },

  async getReportData(springId: string): Promise<{ success: boolean; data: any }> {
    return fetchJson(`${BASE_URL}/reports/${springId}`);
  },

  // GenAI Geo-Copilot & Multimodal Vision (MVP-AC-GENAI)
  async queryGeoCopilot(query: string, context?: any): Promise<{
    success: boolean;
    data: {
      answer: string;
      matchedSpringIds: string[];
      filterCriteria?: any;
      suggestedInterventions?: string[];
      suggestedFollowUp?: string[];
      engine: 'gemini-2.0-flash' | 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'spatial-hydrogeological-engine' | string;
    };
  }> {
    return fetchJson(`${BASE_URL}/ai/geo-copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, context })
    });
  },

  async analyzeOutcropPhoto(imageBase64: string, mimeType: string = 'image/jpeg', springContext?: any): Promise<{
    success: boolean;
    data: {
      lithology: string;
      water_clarity: string;
      sanitary_risk: 'Low' | 'Medium' | 'High' | string;
      flow_visible: boolean;
      estimated_flow?: number | null;
      confidence: number;
      ai_assistance_notes?: string;
      recommended_intervention?: string;
      scientific_disclaimer?: string;
      // Backward compatibility aliases
      waterClarity?: string;
      strikeDipEstimate?: string;
      fractureCondition?: string;
      recommendedIntervention?: string;
      suggestedNotes?: string;
      estimatedDischargeLpm?: number;
      engine?: string;
    };
  }> {
    return fetchJson(`${BASE_URL}/ai/analyze-outcrop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType, springContext })
    });
  }
};

