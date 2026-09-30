"""
Hydrogeological Intervention Recommendation & Priority Scoring Engine.
Generates indicative engineering interventions with suitability criteria and multi-criteria priority ranking.
"""
from typing import Dict, Any, List

class InterventionEngine:
    @staticmethod
    def generate_recommendations(spring_data: Dict[str, Any], terrain_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        slope = terrain_data.get('slope_deg', 18.0)
        lineament_density = terrain_data.get('lineament_density', 3.5)
        elevation = spring_data.get('elevation', 1600.0)
        lat = spring_data['latitude']
        lng = spring_data['longitude']
        
        recommendations = []
        
        # 1. Contour Trench recommendation (suitable for moderate slopes 10-25deg)
        if 8.0 <= slope <= 28.0:
            recommendations.append({
                "id": "INT-CT-01",
                "type": "Staggered Contour Trenches",
                "suitability_score": 0.88,
                "priority": "High",
                "suggested_locations": [
                    {"lat": round(lat + 0.0035, 5), "lng": round(lng - 0.0018, 5), "elevation": round(elevation + 65, 1), "notes": "Upper slope ridge bench"}
                ],
                "hydrogeological_rationale": "Interrupts high-velocity sheet runoff across moderate slopes, retaining moisture in the upper fracture zone.",
                "dimension_spec": "0.5m width x 0.5m depth x 5m length at 10m horizontal intervals",
                "estimated_infiltration_gain_lpm": 8.5,
                "status": "Recommended"
            })
            
        # 2. Check Dam recommendation (stream channel with suitable catchment)
        recommendations.append({
            "id": "INT-CD-02",
            "type": "Gabion / Loose Boulder Check Dam",
            "suitability_score": 0.82,
            "priority": "High",
            "suggested_locations": [
                {"lat": round(lat + 0.0022, 5), "lng": round(lng + 0.0012, 5), "elevation": round(elevation + 30, 1), "notes": "First-order drainage gulley channel"}
            ],
            "hydrogeological_rationale": "Traps seasonal streamflow in ephemeral drainage channels, allowing sustained baseflow infiltration without impounding silt.",
            "dimension_spec": "1.2m crest height, 6m span with central overflow notch",
            "estimated_infiltration_gain_lpm": 12.0,
            "status": "Recommended"
        })

        # 3. Recharge Pit / Infiltration Shaft (fractured rock zone)
        if lineament_density > 2.0:
            recommendations.append({
                "id": "INT-RP-03",
                "type": "Subsurface Recharge Pit with Gravel Pack",
                "suitability_score": 0.79,
                "priority": "Medium",
                "suggested_locations": [
                    {"lat": round(lat + 0.0048, 5), "lng": round(lng - 0.0030, 5), "elevation": round(elevation + 85, 1), "notes": "Intersecting joint fracture trace"}
                ],
                "hydrogeological_rationale": "Bypasses low-permeability topsoil to inject surface runoff directly into jointed rock fracture conduits.",
                "dimension_spec": "2m diameter x 3m depth, graded gravel & coarse sand filter media",
                "estimated_infiltration_gain_lpm": 6.2,
                "status": "Recommended"
            })

        # 4. Springhead Protection Buffer
        recommendations.append({
            "id": "INT-SB-04",
            "type": "Springhead Protection Box & Vegetative Fencing",
            "suitability_score": 0.95,
            "priority": "Critical",
            "suggested_locations": [
                {"lat": round(lat, 5), "lng": round(lng, 5), "elevation": round(elevation, 1), "notes": "Spring eye immediate orifice"}
            ],
            "hydrogeological_rationale": "Prevents anthropogenic contamination, fecal coliform ingress, and trampling by livestock around the discharge eye.",
            "dimension_spec": "50m radius bio-fencing perimeter with indigenous deep-rooting species",
            "estimated_infiltration_gain_lpm": 3.0,
            "status": "Recommended"
        })

        return recommendations

class PriorityScoringEngine:
    @staticmethod
    def calculate_priority(
        recharge_potential: float,
        spring_revival_potential: float,
        water_stress: float,
        community_importance: float,
        intervention_suitability: float,
        risk: float,
        weights: Dict[str, float] = None
    ) -> Dict[str, Any]:
        if weights is None:
            weights = {
                "w_recharge": 0.25,
                "w_revival": 0.20,
                "w_water_stress": 0.20,
                "w_community": 0.15,
                "w_suitability": 0.10,
                "w_risk": 0.10
            }
            
        score = (
            weights['w_recharge'] * recharge_potential +
            weights['w_revival'] * spring_revival_potential +
            weights['w_water_stress'] * water_stress +
            weights['w_community'] * community_importance +
            weights['w_suitability'] * intervention_suitability -
            weights['w_risk'] * risk
        )
        normalized_score = float(round(max(0.0, min(1.0, score)), 3))
        
        tier = "Critical Priority" if normalized_score >= 0.75 else ("High Priority" if normalized_score >= 0.55 else "Moderate Priority")
        return {
            "priority_score": normalized_score,
            "priority_tier": tier,
            "weights_used": weights,
            "formula": "Priority = w1*Recharge + w2*Revival + w3*WaterStress + w4*Community + w5*Suitability - w6*Risk"
        }
