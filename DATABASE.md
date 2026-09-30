# Database Architecture & PostGIS Schema Specification

## 1. Engine & Extensions
- **RDBMS**: PostgreSQL 16
- **Spatial Extensions**: PostGIS 3.4, PostGIS Raster, PostGIS Topology
- **Default Storage SRID**: EPSG:4326 (WGS84 Geodetic)
- **Calculation Projection**: Dynamic UTM Zone transformation (e.g. EPSG:32643 for NW Himalaya) for planar length and area calculations.

## 2. Core Relational Entities

### `springs_spring`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `spring_code` | VARCHAR(64) | Unique, Indexed |
| `name` | VARCHAR(255) | Name of the spring |
| `location` | GEOMETRY(Point, 4326) | PostGIS spatial Point (Lon/Lat), GIST indexed |
| `elevation` | DOUBLE PRECISION | Meters above Mean Sea Level |
| `spring_type` | VARCHAR(32) | Fracture, Contact, Karst, Depression, Fault |
| `geological_formation` | VARCHAR(255) | Rock strata unit |
| `aquifer_type` | VARCHAR(48) | Unconfined, Confined, Semi-confined |
| `strike_deg` | DOUBLE PRECISION | Strike azimuth (0-360) |
| `dip_deg` | DOUBLE PRECISION | Bedding dip angle (0-90) |
| `dip_direction` | VARCHAR(16) | Strike quadrant (NE, SW, etc.) |
| `average_discharge` | DOUBLE PRECISION | Liters Per Minute (LPM) |
| `status` | VARCHAR(32) | Active, Drying, Critical, Revived |

### `springs_discharge_measurement`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `spring_id` | UUID (FK) | Reference to `springs_spring.id` |
| `measurement_date` | DATE | Date of measurement (B-Tree indexed) |
| `discharge_lpm` | DOUBLE PRECISION | Discharge rate in LPM |
| `season` | VARCHAR(32) | Monsoon, Summer, Post-Monsoon, Winter |
| `measurement_method` | VARCHAR(64) | Weir, Bucket timing, Flowmeter |
| `observer` | VARCHAR(120) | Observer identifier |

### `recharge_springshed_polygon`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `spring_id` | UUID (FK) | Target spring |
| `geometry` | GEOMETRY(Polygon, 4326) | GIST spatial index |
| `area_hectares` | DOUBLE PRECISION | Planar area computed in projected CRS |
| `delineation_method` | VARCHAR(32) | Terrain, Hydrogeology, ML, Ensemble |
| `confidence` | VARCHAR(16) | High, Medium, Low |
| `model_version` | VARCHAR(32) | Model version tag |

### `interventions_recommendation`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `spring_id` | UUID (FK) | Target spring |
| `intervention_type` | VARCHAR(64) | Contour Trench, Check Dam, Recharge Pit |
| `locations` | GEOMETRY(MultiPoint, 4326) | Recommended civil intervention nodes |
| `suitability_score` | DOUBLE PRECISION | Range 0.0 - 1.0 |
| `specifications` | TEXT | Engineering dimensions |
| `estimated_gain_lpm`| DOUBLE PRECISION | Expected discharge increment |

### `field_observations`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `spring_id` | UUID (FK) | Target spring |
| `gps_location` | GEOMETRY(Point, 4326) | Recorded device location |
| `gps_accuracy_m` | DOUBLE PRECISION | Horizontal dilution of precision (m) |
| `measured_flow_lpm` | DOUBLE PRECISION | Flow measured on site |
| `validation_status` | VARCHAR(32) | Approved, Pending Review, Rejected |
| `reviewer_notes` | TEXT | Review remarks |

## 3. Spatial Indexing Strategy
```sql
-- R-Tree Spatial Indexes on geometries
CREATE INDEX idx_springs_location ON springs_spring USING GIST (location);
CREATE INDEX idx_recharge_polygon ON recharge_springshed_polygon USING GIST (geometry);
CREATE INDEX idx_field_observations_gps ON field_observations USING GIST (gps_location);

-- Temporal Indexes for time-series queries
CREATE INDEX idx_discharge_spring_date ON springs_discharge_measurement (spring_id, measurement_date DESC);
```
