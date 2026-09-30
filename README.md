# SpringAI-GIS

> **AI-Powered Spring Recharge Zone Identification & Decision Support System**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.x-61dafb.svg)](https://react.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-brightgreen.svg)](https://leafletjs.com/)
[![GeoDjango](https://img.shields.io/badge/GeoDjango-PostGIS-0c4b33.svg)](https://docs.djangoproject.com/en/5.0/ref/contrib/gis/)
[![Python](https://img.shields.io/badge/Python-3.12%2B-blue.svg)](https://www.python.org/)

---

## 1. Overview
**SpringAI-GIS** is a production-ready geospatial artificial intelligence (GeoAI) platform engineered for state groundwater authorities, hydrogeologists, GIS analysts, researchers, and field officers.

It automates the identification and delineation of **Probable Spring Recharge Zones (Springsheds)**, computes machine learning recharge suitability with SHAP factor explainability, calculates indicative civil and bio-engineering interventions (staggered contour trenches, check dams, recharge pits, spring boxes), simulates multi-criteria decision analysis (MCDA) priority scoring, manages mobile field verification observations, and enforces scientific data provenance.

### Core Scientific Distinction
- **Recharge Potential vs. Confirmed Recharge Zone**: All AI delineations are strictly labeled as **"Probable Recharge Zone / Recharge Suitability"** until confirmed by field geological ground-truthing, discharge monitoring, and isotopic tracer verification.

---

## 2. Quick Start & Local Development

### Prerequisites
- Node.js 20+ (with npm)
- Docker & Docker Compose (optional for PostgreSQL/PostGIS & Redis)

### Running the Full-Stack Application
```bash
# 1. Clone the repository
git clone https://github.com/organization/springai-gis.git
cd springai-gis

# 2. Install dependencies
npm install

# 3. Start the fullstack development server
npm run dev
```

Visit `http://localhost:3000` in your web browser.

---

## 3. Technology Architecture

### Frontend
- **Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **GIS Cartography**: Leaflet 1.9.4 with support for Carto Dark, Topographic, and Satellite DEM imagery
- **Data Visualizations**: High-density SVG sparklines, discharge time-series dynamics, and SHAP factor attribution waterfalls

### Backend Services
- **Fullstack Runtime**: Express fullstack server with REST API at `/api/v1/`
- **Enterprise Reference Implementation**: Python 3.12+, Django 5, Django REST Framework, GeoDjango, GDAL, PostGIS, Celery, and Redis (`/backend/`)
- **Machine Learning**: Spatial Block GroupKFold Cross-Validation, XGBoost, Random Forest, SHAP TreeExplainer (`/ml/`)

---

## 4. Key Platform Features

1. **Interactive GIS Multi-Layer Map**:
   - Geodetic CRS: WGS84 (EPSG:4326) with projected UTM metric calculations.
   - Vectors: Springs, Delineated Springsheds, Fault Lineaments, D8 Drainage Streams, Suggested Interventions.
   - GIS Tools: Multi-basemap switcher, Geodetic distance measurement, Cursor coordinate & elevation HUD.

2. **Springshed Delineation Engine**:
   - Four distinct hydrogeological methodologies:
     1. *Terrain-based* (D8 flow accumulation & ridge division)
     2. *Hydrogeological rule-based* (Strike/dip structural recharge corridor)
     3. *Machine learning probabilistic field*
     4. *Ensemble multi-criteria synthesis*

3. **Explainable AI (SHAP Factor Attribution)**:
   - Quantifies individual positive and negative hydrogeological features (lineament density, rainfall, slope gradient, forest cover, fault proximity) for every spring.

4. **Intervention Recommendations & MCDA Priority Simulator**:
   - Automated site identification for contour trenches, check dams, recharge shafts, and springhead buffers.
   - Interactive policy weight simulator:
     `Priority = w1·Recharge + w2·Revival + w3·WaterStress + w4·Community + w5·Suitability - w6·Risk`

5. **Field Ground-Truthing Workflow**:
   - Mobile-ready field inspection logging: GPS coordinates, accuracy (±m), flow rate (LPM), geology notes, photo counts, and sanitary condition.
   - Review workflow: Field Officer → Hydrogeologist Review → Model Retraining Pool.

6. **Technical Hydrogeological Dossier Reports**:
   - One-click generation of official government-ready dossiers with printable layout (`window.print()`).

---

## 5. Docker Production Deployment

```bash
# Build and run containers
docker-compose up --build -d

# Verify services
docker-compose ps
```

Services started:
- `web`: Node/Express fullstack application on `:3000`
- `postgres`: PostgreSQL 16 with PostGIS 3.4 on `:5432`
- `redis`: Redis 7 on `:6379`
- `celery_worker`: Background spatial raster tasks

---

## 6. Project Documentation Index
- [ARCHITECTURE.md](ARCHITECTURE.md) — System architecture, RBAC, and data flow
- [DATABASE.md](DATABASE.md) — Relational schema & PostGIS spatial model
- [GIS_PIPELINE.md](GIS_PIPELINE.md) — Spatial ingestion, CRS handling, and delineation
- [ML_PIPELINE.md](ML_PIPELINE.md) — Spatial Cross-Validation, feature matrix, and SHAP
- [API.md](API.md) — REST API endpoint documentation (`/api/v1/`)
- [MODEL_CARD.md](MODEL_CARD.md) — Model governance and validation metrics
- [FIELD_VALIDATION.md](FIELD_VALIDATION.md) — Ground-truthing protocol and review states
- [SECURITY.md](SECURITY.md) — Security policies and data protection
- [TESTING.md](TESTING.md) — Automated testing matrix
- [USER_GUIDE.md](USER_GUIDE.md) — Step-by-step role-based user manual

---

## 7. License
Distributed under the Apache 2.0 License.
