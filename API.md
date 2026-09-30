# SpringAI-GIS REST API Specification (v1)

Base URL: `/api/v1`

## Endpoints

### 1. Authentication & Users
- `POST /api/v1/auth/login`
  - Body: `{ username, password }`
  - Returns: `{ token, user: { id, name, role, email, permissions } }`
- `GET /api/v1/auth/me`
  - Returns current user profile and role
- `POST /api/v1/auth/switch-role`
  - Body: `{ role: "Administrator" | "Hydrogeologist" | "GIS Analyst" | "Field Officer" | "Researcher" | "Viewer" }`
  - For testing and multi-role operations

### 2. Springs Management
- `GET /api/v1/springs`
  - Query params: `search`, `district`, `state`, `geology`, `status`, `min_discharge`, `spring_type`
  - Returns: Array of springs with full hydrogeological attributes
- `POST /api/v1/springs`
  - Body: Complete spring registration payload
- `GET /api/v1/springs/:id`
  - Returns specific spring with historical discharge, recharge zone, interventions, risk, and validation history
- `PUT /api/v1/springs/:id`
  - Update spring hydrogeological properties
- `GET /api/v1/springs/:id/discharge`
  - Historical discharge time series records
- `POST /api/v1/springs/:id/discharge`
  - Log new discharge measurement

### 3. Recharge Zone Delineation
- `POST /api/v1/recharge-zones/delineate`
  - Body: `{ springId, method: "terrain_based" | "hydrogeological_rule" | "ml_based" | "ensemble" }`
  - Returns: GeoJSON polygon, bounding area (ha/km²), confidence, algorithm notes

### 4. Suitability & ML Predictions
- `POST /api/v1/suitability/predict`
  - Body: `{ springId, modelVersion? }`
  - Returns: Suitability score, class probability, uncertainty, SHAP feature attributions

### 5. Interventions & Priority
- `GET /api/v1/interventions/recommendations/:springId`
  - Returns tailored civil/bio-engineering structures, locations, and hydraulic capacities
- `POST /api/v1/interventions/recalculate-priority`
  - Body: `{ weights: { wRecharge, wRevival, wWaterStress, wCommunity, wSuitability, wRisk } }`
  - Recalculates priority scores across all springs with audit tracking

### 6. Field Validation & Workflow
- `GET /api/v1/field-validations`
  - List of field submissions and review states
- `POST /api/v1/field-validations`
  - Submit field verification (GPS coordinates, discharge, photos, geology notes, review status)
- `PUT /api/v1/field-validations/:id/review`
  - Body: `{ status: "Approved" | "Rejected" | "Needs Review", reviewNotes }`

### 7. Model Registry & Governance
- `GET /api/v1/models`
  - List of model versions, training metadata, spatial CV metrics, and status

### 8. System Audit & Reports
- `GET /api/v1/audit-logs`
  - Chronological provenance audit trail
- `GET /api/v1/reports/:springId`
  - Structured technical dossier ready for PDF generation or print
