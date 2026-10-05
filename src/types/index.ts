export type UserRole = 
  | 'Administrator' 
  | 'Hydrogeologist' 
  | 'GIS Analyst' 
  | 'Field Officer' 
  | 'Researcher' 
  | 'Viewer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  permissions?: string[];
  token?: string;
}

export interface DischargeRecord {
  id: string;
  date: string;
  discharge: number; // LPM
  season: 'Monsoon' | 'Post-Monsoon' | 'Winter' | 'Summer';
  method: string;
  observer: string;
}

export interface FieldObservation {
  id: string;
  springId?: string;
  springName?: string;
  village?: string;
  district?: string;
  state?: string;
  date: string;
  observer: string;
  role: string;
  discharge: number;
  gpsAccuracyM: number;
  geologyNotes: string;
  waterCondition: string;
  sanitaryRisk?: 'Low' | 'Medium' | 'High' | string;
  flowVisible?: boolean;
  strikeDipMeasured?: string;
  interventionStatus: string;
  validationStatus: 'Approved' | 'Pending Review' | 'Rejected' | 'Needs Review';
  comments: string;
  photosCount: number;
  syncStatus?: 'synced' | 'pending' | 'syncing' | 'failed';
}

export interface ShapFactor {
  factor: string;
  impact: number;
  direction: 'positive' | 'negative';
  value: string;
  explanation: string;
}

export interface RiskFactor {
  factor: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  details: string;
}

export interface SpringEntity {
  id: string;
  name: string;
  state: string;
  district: string;
  village: string;
  latitude: number;
  longitude: number;
  elevation: number;
  springType: 'Fracture' | 'Depression' | 'Contact' | 'Fault-controlled' | 'Karst';
  geologicalFormation: string;
  aquiferType: string;
  strike: number;
  dip: number;
  dipDirection: string;
  averageDischarge: number;
  minDischarge: number;
  maxDischarge: number;
  monsoonDischarge: number;
  summerDischarge: number;
  seasonality: 'Perennial' | 'Seasonal' | 'Ephemeral';
  status: 'Active' | 'Drying' | 'Critical' | 'Revived';
  datasetCategory?: 'DEMO / SYNTHETIC / TEST DATA' | 'FIELD / VERIFIED DATA';
  availableDatasets?: string[];
  missingDatasets?: string[];
  waterQuality: {
    pH: number;
    ec: number;
    tds: number;
    turbidity: number;
    nitrate: number;
    coliform: string;
  };
  spatialContext: {
    slopeDeg: number;
    aspectDeg: number;
    drainageDensity: number;
    twi: number;
    annualRainfallMm: number;
    lineamentDensity: number;
    distToFaultM: number;
    soilPermeabilityMmHr: number;
    lulcClass: string;
    existingStructuresCount: number;
  };
  risk: {
    score: number;
    category: 'Low' | 'Moderate' | 'High' | 'Critical';
    factors: RiskFactor[];
  };
  priorityScore: number;
  priorityTier: 'Critical' | 'High' | 'Moderate' | 'Low';
  rechargeSuitability: number;
  delineationMethod: 'terrain_based' | 'hydrogeological_rule' | 'ml_based' | 'ensemble';
  delineatedPolygon: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  rechargeAreaHa: number;
  confidence: 'High' | 'Medium' | 'Low';
  dataCompleteness: number;
  historicalDischarge: DischargeRecord[];
  fieldObservations: FieldObservation[];
}

export interface InterventionRecommendation {
  id: string;
  type: string;
  suitabilityScore: number;
  status: string;
  priority: string;
  locationsCount: number;
  suggestedCoordinates: Array<{
    lat: number;
    lng: number;
    elevation: number;
    rationale: string;
  }>;
  hydrogeologicalRationale: string;
  specifications: string;
  estimatedInfiltrationGainLpm: number;
  disclaimer: string;
}

export interface PriorityWeights {
  wRecharge: number;
  wRevival: number;
  wWaterStress: number;
  wCommunity: number;
  wSuitability: number;
  wRisk: number;
}

export interface ModelMetadata {
  id: string;
  version: string;
  name: string;
  algorithm: string;
  status: string;
  trainingDatasetVersion: string;
  featuresCount: number;
  spatialCvRocAuc: number;
  f1Score: number;
  rmse: number;
  trainedAt: string;
  approvedBy: string;
  spatialValidationStrategy: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  entity: string;
  details: string;
  modelVersion: string;
}

export interface GeospatialDataset {
  id: string;
  name: string;
  type: 'GeoJSON' | 'GeoTIFF' | 'CSV';
  category: 'DEM' | 'Geology' | 'Drainage' | 'Rainfall' | 'LULC' | 'Lineaments' | 'Soil';
  source: string;
  crs: string;
  resolutionM?: number;
  extent: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  featureCount?: number;
  fileSizeBytes: number;
  uploadedBy: string;
  uploadDate: string;
  version: string;
  qualityStatus: 'Validated' | 'Processing' | 'Rejected';
  provenanceTag: 'DEMO / SYNTHETIC / TEST DATA' | 'FIELD / VERIFIED DATA';
  validationErrors?: string[];
}

export interface BackgroundJob {
  id: string;
  taskType: string;
  status: 'Queued' | 'Running' | 'Completed' | 'Failed';
  progressPct: number;
  submittedBy: string;
  submittedAt: string;
  completedAt?: string;
  result?: any;
  error?: string;
}

export interface TerrainProcessingResult {
  demId: string;
  elevationMin: number;
  elevationMax: number;
  elevationMean: number;
  meanSlopeDeg: number;
  slopeClasses: {
    gentlePct: number;
    moderatePct: number;
    steepPct: number;
  };
  dominantAspect: string;
  flowAccumulationPeak: number;
  deterministicHash: string;
  spatialReference?: string;
}

export interface ActiveUserSession {
  socketId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    department: string;
  };
  currentTab: string;
  activeSpringId?: string;
  lastActive: string;
}
