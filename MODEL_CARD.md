# Model Card: SpringAI Recharge Suitability & Springshed Ensemble (v2.4-ensemble)

## Model Details
- **Developer**: Geospatial AI & Hydrogeological Systems Engineering Group
- **Model Version**: `v2.4-ensemble`
- **Model Type**: Multi-criteria ensemble integrating D8 kinematic flow accumulation, bedrock strike/dip structural conduits, and XGBoost probabilistic recharge classification.
- **Intended Use**: Decision support for delineating probable spring recharge zones and prioritizing water conservation civil interventions.

## Intended Users
- State Water Resource Departments
- Central Ground Water Authorities
- Hydrogeologists & Soil Engineers
- GIS Planners & Watershed Officers

## Training & Spatial Validation
- **Spatial Leakage Mitigation**: Evaluated with **Spatial Block GroupKFold (SpatialGroupKFold)** partitioning basins with a 3.0 km minimum spatial buffer.
- **Spatial CV ROC-AUC**: 0.892
- **F1 Score**: 0.864
- **Root Mean Squared Error (RMSE)**: 0.082

## Input Features (13 Dimension Matrix)
1. `elevation` (m MSL)
2. `slope_deg` (degrees)
3. `aspect_cos` (cosine of aspect orientation)
4. `curvature` (profile and planform)
5. `drainage_density` (km/km²)
6. `distance_to_drainage_m` (m)
7. `twi` (Topographic Wetness Index)
8. `rainfall_annual_mm` (mm/yr)
9. `rainfall_variability_cv` (coefficient of variation)
10. `lineament_density` (km/km²)
11. `distance_to_fault_m` (m)
12. `soil_permeability_mmhr` (mm/hr)
13. `lulc_forest_fraction` (fractional canopy)

## Explainability
- Evaluated via SHAP (SHapley Additive exPlanations) TreeExplainer.
- Exact local feature attributions quantify individual positive drivers (e.g. fracture lineament density, rainfall volume, canopy cover) and negative constraints (e.g. steep runoff slopes, distance from structural faults).

## Limitations & Ethical Considerations
- **Non-Guaranteed Hydrology**: Model delineations denote **Probable Recharge Zones**, not definitive subterranean aquifer bounds.
- **Mandatory Ground-Truthing**: Must be verified via structural field mapping, dye/isotope tracing, and geophysical survey before construction of physical water impoundment structures.
