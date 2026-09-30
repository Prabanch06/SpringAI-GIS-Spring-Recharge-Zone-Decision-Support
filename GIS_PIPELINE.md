# GIS & Spatial Data Pipeline Specification

## 1. Input Datasets & Validation
SpringAI-GIS ingests vector and raster datasets across 6 hydrogeological dimensions:
1. **Digital Elevation Model (DEM)**: 12.5m - 30m resolution (SRTM/ALOS/CartoDEM)
2. **Geology & Lithology**: Rock formation, lithology, dip and strike orientation
3. **Structural Lineaments & Faults**: Regional fracture corridors and thrust planes
4. **Hydrology & Drainage**: Stream order, flow paths, drainage density
5. **Climatic Isohyets**: Annual mean rainfall and seasonal precipitation variability
6. **Land-Use/Land-Cover (LULC)**: Sentinel-2 based 10m LULC classifications

### Geodetic Integrity
- **Storage Standard**: WGS84 (EPSG:4326) geometry format.
- **Computation Standard**: Projected Coordinate Systems (e.g. UTM Zone 43N / EPSG:32643 or Zone 44N / EPSG:32644) for accurate planar length, buffer, slope, and area calculations in meters and hectares.
- **Rule**: Never calculate slopes, drainage areas, or buffer distances in degrees.

## 2. Springshed Delineation Approaches
- **Terrain-Based (D8 / MFD Flow Tracing)**:
  Traces upslope contributing cells using steepness gradient and ridge bounds.
- **Hydrogeological Rule-Based**:
  Constrains recharge capture to the updip strike-dip quadrant and intersecting permeable bedding planes.
- **Ensemble Synthesis**:
  Computes geometric union and intersection weighting between topographical runoff and structural rock permeability.
