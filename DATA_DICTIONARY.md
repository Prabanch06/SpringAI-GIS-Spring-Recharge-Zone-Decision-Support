# SpringAI-GIS Data Dictionary (MVP-AC-062)

## 1. Spring Entity (`springs_spring`)
| Field | Type | Description | Unit | Required/Optional | CRS | Example |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(64) | Unique Spring alphanumeric identifier | None | Required | N/A | `DEMO-SPR-001` |
| `name` | VARCHAR(255) | Official or local spring name | None | Required | N/A | `Bhimtal Valley Fracture Spring` |
| `latitude` | FLOAT | Geodetic latitude coordinate | Decimal degrees | Required | EPSG:4326 | `29.3512` |
| `longitude`| FLOAT | Geodetic longitude coordinate | Decimal degrees | Required | EPSG:4326 | `79.5623` |
| `elevation`| FLOAT | Height above Mean Sea Level | Meters (m) | Required | EPSG:4326 | `1420.0` |
| `spring_type`| ENUM | Hydrogeological classification | None | Required | N/A | `Fracture` |
| `geological_formation`| VARCHAR(255) | Rock strata and lithological member | None | Required | N/A | `Krol Formation (Dolomite/Shale)` |
| `aquifer_type`| VARCHAR(64) | Hydrodynamic confinement state | None | Required | N/A | `Unconfined Fractured Bedrock` |
| `strike_deg` | FLOAT | Strike azimuth relative to true north | Degrees (0–360) | Optional | N/A | `130.0` |
| `dip_deg` | FLOAT | Bedding dip angle from horizontal | Degrees (0–90) | Optional | N/A | `26.0` |
| `dip_direction`| VARCHAR(8) | Dip quadrant | None | Optional | N/A | `NE` |
| `average_discharge`| FLOAT | Annual mean discharge yield | Liters/Minute (LPM) | Required | N/A | `16.4` |
| `min_discharge` | FLOAT | Summer lean season baseflow | Liters/Minute (LPM) | Required | N/A | `4.2` |
| `max_discharge` | FLOAT | Peak monsoon discharge | Liters/Minute (LPM) | Required | N/A | `38.5` |
| `seasonality` | ENUM | Perennial, Seasonal, or Ephemeral | None | Required | N/A | `Perennial` |
| `status` | ENUM | Active, Drying, Critical, Revived | None | Required | N/A | `Drying` |

## 2. Discharge Measurement (`springs_discharge_measurement`)
| Field | Type | Description | Unit | Required/Optional | CRS | Example |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(64) | Unique measurement log ID | None | Required | N/A | `HD-01` |
| `spring_id` | VARCHAR(64) | Target spring reference | None | Required | N/A | `DEMO-SPR-001` |
| `date` | DATE | Observation date (YYYY-MM-DD) | Date | Required | N/A | `2026-03-24` |
| `discharge` | FLOAT | Instantaneous measured discharge | Liters/Minute (LPM) | Required | N/A | `5.1` |
| `season` | ENUM | Summer, Monsoon, Post-Monsoon, Winter | None | Required | N/A | `Summer` |
| `method` | VARCHAR(64) | Weir, Bucket timing, Flowmeter | None | Required | N/A | `Electromagnetic Flowmeter` |
| `observer` | VARCHAR(120) | Registered officer name | None | Required | N/A | `H. Joshi (Field Officer)` |

## 3. Geospatial Raster & Vector Layers (`geospatial_datasets`)
| Dataset | Field | Type | Description | Unit | Required/Optional | CRS | Example |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DEM` | `elevation` | Float32 | Surface digital elevation raster | Meters (m) | Required | EPSG:32644 | `1645.2 m` |
| `Slope` | `slope_deg` | Float32 | Terrain slope angle | Degrees (0–90) | Required | EPSG:32644 | `18.6°` |
| `Aspect` | `aspect_deg`| Float32 | Downslope facing direction | Degrees (0–360) | Required | EPSG:32644 | `45.0° (NE)` |
| `Rainfall` | `annual_mm` | Float32 | Annual cumulative precipitation | Millimeters (mm) | Required | EPSG:4326 | `1680 mm` |
| `Lineaments`| `density` | Float32 | Fracture length per unit area | km / km² | Optional | EPSG:4326 | `4.2 km/km²` |
| `Drainage` | `order` | Integer | Strahler stream channel order | Order (1–5) | Required | EPSG:4326 | `2` |
| `LULC` | `class` | String | Land-use land-cover category | Class string | Required | EPSG:4326 | `Oak/Pine Forest` |
