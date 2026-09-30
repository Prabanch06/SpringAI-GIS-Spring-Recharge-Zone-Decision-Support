# SpringAI-GIS: User Guide & Operational Manual

## 1. Introduction
Welcome to **SpringAI-GIS**, the decision support platform for scientific springshed management and recharge intervention planning.

## 2. Role-Based Navigation

### Administrator
1. **User & System Governance**: Use the top bar role switcher to access administrative functions.
2. **Audit & Provenance**: Click the **Audit** button in the header to view immutable chronological logs of all spring registrations, springshed delineations, and priority recalculations.
3. **Registering Springs**: Click **Register Spring** to add newly mapped springs with geodetic coordinates, lithological formations, and discharge dynamics.

### Hydrogeologist / Technical Expert
1. **Delineating Springsheds**:
   - Navigate to the **Recharge Zones** tab.
   - Choose between *Ensemble*, *Hydrogeological Rule-Based*, *Terrain-Based*, or *Spatial ML* methods.
   - Click **Execute Delineation** to immediately recalculate the probable boundary and view area in hectares.
2. **Reviewing Field Ground-Truthing**:
   - Navigate to the **Field Validation** tab.
   - Review pending field observations submitted by field officers.
   - Click **Approve for Model Retraining** or **Reject Observation** with technical remarks.
3. **Generating Technical Dossiers**:
   - In the **Springs** or **GIS Map** view, select a spring and click **Generate Technical Dossier Report**.
   - Print or save as PDF using the browser print dialog.

### GIS Analyst
1. **Spatial Exploration**:
   - Open the **GIS Map** tab.
   - Use the **Layers** menu to toggle Springs, Springshed polygons, Fault Lineaments, D8 Drainage Streams, and Suggested Interventions.
   - Switch basemaps between *Dark Carto*, *Topographic*, and *Satellite DEM*.
2. **Geodetic Measurement**:
   - Click **Measure** on the map toolbar.
   - Click two or more points on the map to compute true geodetic distances in meters/kilometers.

### Field Officer
1. **Submitting Observations**:
   - Navigate to the **Field Validation** tab.
   - Click **New Field Observation**.
   - Select the target spring, record measured discharge (LPM), GPS accuracy (±m), water condition, and geological bedding notes.
   - Click **Submit Verification**. The submission enters the review queue for hydrogeological approval.

### Researcher / Viewer
1. **Model Governance**:
   - Navigate to the **Model Registry** tab to inspect Spatial Block GroupKFold validation metrics (ROC-AUC, F1, RMSE) and training datasets.
2. **MCDA Priority Simulation**:
   - Navigate to the **Interventions** tab.
   - Adjust policy weights (Recharge, Revival, Water Stress, Community, Suitability, Risk) and click **Recalculate Priorities** to test alternative priority scenarios.
