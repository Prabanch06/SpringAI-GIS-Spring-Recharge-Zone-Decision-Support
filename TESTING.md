# SpringAI-GIS Automated Testing Suite & Verification Matrix (MVP-AC-051, 052, 053)

## 1. Automated Test Execution
Run the full verification test suite:
```bash
npx tsx tests/run_all_tests.ts
```

## 2. Test Coverage Categories

### A. Backend Unit & API Tests (MVP-AC-051)
- `tests/test_health.ts` — Liveness (`/health`) & Readiness (`/ready`) probes (HTTP 200).
- `tests/test_auth.ts` — Login, role switching, token refresh, and RBAC permission guards (Viewer blocked from write operations).
- `tests/test_springs.ts` — Spring CRUD, geodetic WGS84 coordinate bounds validation, and search filtering.
- `tests/test_datasets.ts` — Ingestion validation (GeoJSON, GeoTIFF, CSV), CRS check, and rejection of invalid CRS (`INVALID_CRS`).
- `tests/test_dem.ts` — Deterministic DEM slope/aspect processing and checksum verification.
- `tests/test_delineation.ts` — Terrain, Hydrogeology, ML, and Ensemble springshed delineation algorithms.
- `tests/test_suitability_shap.ts` — Recharge suitability (0-1 score), data completeness %, missing data handling, and SHAP factors.
- `tests/test_interventions.ts` — Rule-based civil/bio-engineering recommendations and MCDA priority score recalculation.
- `tests/test_field_validation.ts` — Observation submission, state machine transition (`Pending Review` → `Approved`), and review remarks.
- `tests/test_jobs.ts` — Asynchronous Celery-style background task queue and status transitions (`Queued` → `Running` → `Completed`).

### B. Frontend Integration Tests (MVP-AC-052)
- Spring list rendering and dynamic search filtering without page reloads.
- Layer toggles and basemap switching (Dark Carto, Topo, Satellite).
- Geodetic distance measurement on Leaflet canvas.
- Reactive SHAP factor waterfall rendering.
- Priority weight slider simulation and live recalculation.
- Mobile field validation form with GPS accuracy indicators.

### C. End-to-End Workflow Verification (MVP-AC-053 & MVP-AC-AB)
Mandatory 15-step demonstration scenario on `DEMO-SPR-001` executed from start to finish without errors.
