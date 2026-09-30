# Machine Learning & Explainable AI (SHAP) Pipeline

## 1. Preventing Spatial Autocorrelation Leakage
In geospatial machine learning, random train-test splitting (e.g. standard K-Fold) produces severe over-optimistic performance estimates due to spatial autocorrelation between adjacent grid cells (Tobler's First Law of Geography).

SpringAI-GIS enforces **Spatial Block Cross-Validation (SpatialGroupKFold)**:
- Training, validation, and test sets are partitioned into geographically separated watershed zones or spatial blocks with minimum buffer distance ($d_{buffer} \ge 3\text{ km}$).
- Evaluation metrics reflect real-world generalization to unmeasured sub-basins.

## 2. Feature Engineering Matrix
1. **Elevation** (m)
2. **Slope** (degrees, 0-90)
3. **Aspect Cosine** (North-South orientation component)
4. **Plan & Profile Curvature** (divergent vs convergent flow)
5. **Drainage Density** (km/km²)
6. **Distance to Drainage** (m)
7. **Topographic Wetness Index (TWI)**: $\ln(a / \tan\beta)$
8. **Rainfall Annual** (mm)
9. **Rainfall Seasonality / CV**
10. **Lineament Density** (km/km²)
11. **Distance to Fault/Thrust** (m)
12. **Soil Permeability** (mm/hr)
13. **LULC Infiltration Index**

## 3. Explainability with SHAP (SHapley Additive exPlanations)
Every predicted cell and spring recharge score yields exact local feature attributions:
- Positive factors increasing recharge potential (e.g., dense fracture lineaments, gentle plateau slope, high rainfall).
- Negative factors diminishing recharge potential (e.g., steep runoff cliffs >35°, high settlement fraction, impermeable bedrock).
- Disclaimers displayed alongside predictions: "Indicative recommendation — requires field/hydrogeological verification."
