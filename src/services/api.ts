import { SpringEntity, UserProfile, UserRole, PriorityWeights, FieldObservation, ModelMetadata, AuditLogItem, InterventionRecommendation, GeospatialDataset, BackgroundJob, TerrainProcessingResult } from '../types';

const BASE_URL = '/api/v1';

export const api = {
  // Health probes
  async getHealth(): Promise<any> {
    const res = await fetch('/health');
    return res.json();
  },

  async getReady(): Promise<any> {
    const res = await fetch('/ready');
    return res.json();
  },

  // Auth
  async login(username: string, password: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },

  async getMe(): Promise<{ success: boolean; user: UserProfile }> {
    const res = await fetch(`${BASE_URL}/auth/me`);
    return res.json();
  },

  async switchRole(role: UserRole): Promise<{ success: boolean; user: UserProfile }> {
    const res = await fetch(`${BASE_URL}/auth/switch-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    return res.json();
  },

  // Springs
  async getSprings(params?: { search?: string; status?: string; springType?: string }): Promise<{ success: boolean; count: number; data: SpringEntity[] }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.springType) query.append('springType', params.springType);

    const res = await fetch(`${BASE_URL}/springs?${query.toString()}`);
    return res.json();
  },

  async getSpringById(id: string): Promise<{ success: boolean; data: SpringEntity }> {
    const res = await fetch(`${BASE_URL}/springs/${id}`);
    return res.json();
  },

  async createSpring(payload: Partial<SpringEntity>): Promise<{ success: boolean; data: SpringEntity }> {
    const res = await fetch(`${BASE_URL}/springs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async logDischarge(springId: string, payload: { date: string; discharge: number; season: string; method?: string }): Promise<any> {
    const res = await fetch(`${BASE_URL}/springs/${springId}/discharge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Delineation
  async runDelineation(springId: string, method: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/recharge-zones/delineate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ springId, method })
    });
    return res.json();
  },

  // Suitability & Missing Data
  async getSuitability(springId: string, simulateIncompleteData: boolean = false): Promise<any> {
    const res = await fetch(`${BASE_URL}/suitability/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ springId, simulateIncompleteData })
    });
    return res.json();
  },

  // Interventions & Priority
  async getInterventions(springId: string): Promise<{ success: boolean; data: InterventionRecommendation[] }> {
    const res = await fetch(`${BASE_URL}/interventions/recommendations/${springId}`);
    return res.json();
  },

  async recalculatePriority(weights: PriorityWeights): Promise<any> {
    const res = await fetch(`${BASE_URL}/interventions/recalculate-priority`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weights })
    });
    return res.json();
  },

  // Field Validations
  async getFieldValidations(): Promise<{ success: boolean; data: FieldObservation[] }> {
    const res = await fetch(`${BASE_URL}/field-validations`);
    return res.json();
  },

  async submitFieldValidation(payload: {
    springId: string;
    discharge: number;
    gpsAccuracyM: number;
    geologyNotes: string;
    waterCondition: string;
    interventionStatus: string;
    comments: string;
  }): Promise<any> {
    const res = await fetch(`${BASE_URL}/field-validations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async reviewFieldValidation(obsId: string, status: 'Approved' | 'Rejected' | 'Needs Review', reviewComments?: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/field-validations/${obsId}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewComments })
    });
    return res.json();
  },

  // Datasets Ingestion & Validation (MVP-AC-008, MVP-AC-009)
  async getDatasets(): Promise<{ success: boolean; count: number; data: GeospatialDataset[] }> {
    const res = await fetch(`${BASE_URL}/datasets`);
    return res.json();
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
    const res = await fetch(`${BASE_URL}/datasets/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // DEM Terrain Processing (MVP-AC-012, MVP-AC-014)
  async processDem(demId: string, elevationBase?: number): Promise<{ success: boolean; data: TerrainProcessingResult }> {
    const res = await fetch(`${BASE_URL}/terrain/process-dem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demId, elevationBase })
    });
    return res.json();
  },

  // Background Asynchronous Jobs (MVP-AC-047, MVP-AC-048)
  async getJobs(): Promise<{ success: boolean; count: number; data: BackgroundJob[] }> {
    const res = await fetch(`${BASE_URL}/jobs`);
    return res.json();
  },

  async getJobById(jobId: string): Promise<{ success: boolean; data: BackgroundJob }> {
    const res = await fetch(`${BASE_URL}/jobs/${jobId}`);
    return res.json();
  },

  async submitJob(taskType: string, params?: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/jobs/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskType, params })
    });
    return res.json();
  },

  // Model Registry & Audit
  async getModels(): Promise<{ success: boolean; data: ModelMetadata[] }> {
    const res = await fetch(`${BASE_URL}/models`);
    return res.json();
  },

  async getAuditLogs(): Promise<{ success: boolean; data: AuditLogItem[] }> {
    const res = await fetch(`${BASE_URL}/audit-logs`);
    return res.json();
  },

  async getReportData(springId: string): Promise<{ success: boolean; data: any }> {
    const res = await fetch(`${BASE_URL}/reports/${springId}`);
    return res.json();
  }
};
