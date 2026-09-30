import React, { useEffect, useState } from 'react';
import { SpringEntity, InterventionRecommendation, PriorityWeights } from '../types';
import { api } from '../services/api';
import { Sliders, Wrench, ShieldAlert, CheckCircle2, RefreshCw, MapPin } from 'lucide-react';

interface InterventionsSimulatorProps {
  spring: SpringEntity;
  onRefreshAllSprings: () => void;
}

export const InterventionsSimulator: React.FC<InterventionsSimulatorProps> = ({
  spring,
  onRefreshAllSprings
}) => {
  const [interventions, setInterventions] = useState<InterventionRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  // Weights state
  const [weights, setWeights] = useState<PriorityWeights>({
    wRecharge: 0.25,
    wRevival: 0.20,
    wWaterStress: 0.20,
    wCommunity: 0.15,
    wSuitability: 0.10,
    wRisk: 0.10
  });

  const [isRecalculating, setIsRecalculating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getInterventions(spring.id).then(res => {
      if (isMounted && res.success) {
        setInterventions(res.data);
      }
    }).catch(err => {
      console.error('Failed to load interventions:', err);
    }).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, [spring.id]);

  const handleWeightChange = (key: keyof PriorityWeights, val: number) => {
    setWeights(prev => ({ ...prev, [key]: val }));
  };

  const handleRecalculatePriorities = async () => {
    setIsRecalculating(true);
    setSuccessMsg(null);
    try {
      const res = await api.recalculatePriority(weights);
      if (res.success) {
        setSuccessMsg(`Priorities successfully updated across all springs with current MCDA weights.`);
        onRefreshAllSprings();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Failed to recalculate priority:', err);
    } finally {
      setIsRecalculating(false);
    }
  };

  const totalWeights = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-slate-100">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
          <span>DECISION SUPPORT SYSTEM</span>
          <span>·</span>
          <span>INTERVENTIONS & PRIORITY SCORING</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Recommended Civil & Bio-Engineering Interventions
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Site-specific recharge measures for {spring.name} based on slope, lineaments, drainage order, and risk profile.
        </p>
      </div>

      {/* Mandatory Scientific Disclaimer Banner */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded flex items-center gap-2.5 text-xs text-amber-200">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Indicative recommendation</strong> — requires field hydrogeological verification and detailed engineering design before execution.
        </span>
      </div>

      {/* Interventions List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white">
          Proposed Hydrogeological Interventions ({interventions.length})
        </h2>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Loading intervention recommendations...
          </div>
        ) : (
          <div className="space-y-3">
            {interventions.map((rec) => (
              <div
                key={rec.id}
                className="p-4 bg-slate-900 border border-slate-800 rounded space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 font-semibold">{rec.id}</span>
                    <h3 className="font-semibold text-slate-100 text-sm">{rec.type}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-400">
                      Priority: {rec.priority}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="font-mono text-emerald-400">
                      Suitability: {(rec.suitabilityScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed">
                  {rec.hydrogeologicalRationale}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800/70">
                  <div>
                    <span className="text-slate-500 block">Engineering Specifications</span>
                    <span className="text-slate-300 font-mono">{rec.specifications}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Est. Discharge Infiltration Yield</span>
                    <span className="text-cyan-400 font-mono font-bold">
                      +{rec.estimatedInfiltrationGainLpm} LPM expected baseflow gain
                    </span>
                  </div>
                </div>

                {/* Suggested coordinates */}
                <div className="text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300 mr-2">Proposed Locations:</span>
                  {rec.suggestedCoordinates.map((coord, ci) => (
                    <span key={ci} className="font-mono bg-slate-800/80 px-2 py-0.5 rounded mr-2 text-slate-300">
                      {coord.lat.toFixed(4)}°N, {coord.lng.toFixed(4)}°E ({coord.elevation}m) — {coord.rationale}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Priority Scoring MCDA Weight Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">
                Multi-Criteria Decision Analysis (MCDA) Scoring Weights
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure policy priority weights. Formula: <code className="font-mono text-cyan-400 text-[11px]">Priority = w1·Recharge + w2·Revival + w3·WaterStress + w4·Community + w5·Suitability - w6·Risk</code>
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Sum of Weights</span>
            <span className="text-xs font-mono font-bold text-slate-200">
              {totalWeights.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-300">Recharge Potential (w1)</span>
              <span className="font-mono text-cyan-400 font-bold">{weights.wRecharge.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.50"
              step="0.05"
              value={weights.wRecharge}
              onChange={e => handleWeightChange('wRecharge', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-300">Spring Revival Urgency (w2)</span>
              <span className="font-mono text-cyan-400 font-bold">{weights.wRevival.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.50"
              step="0.05"
              value={weights.wRevival}
              onChange={e => handleWeightChange('wRevival', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-300">Local Water Stress (w3)</span>
              <span className="font-mono text-cyan-400 font-bold">{weights.wWaterStress.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.50"
              step="0.05"
              value={weights.wWaterStress}
              onChange={e => handleWeightChange('wWaterStress', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-300">Community Importance (w4)</span>
              <span className="font-mono text-cyan-400 font-bold">{weights.wCommunity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.50"
              step="0.05"
              value={weights.wCommunity}
              onChange={e => handleWeightChange('wCommunity', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-300">Intervention Suitability (w5)</span>
              <span className="font-mono text-cyan-400 font-bold">{weights.wSuitability.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.50"
              step="0.05"
              value={weights.wSuitability}
              onChange={e => handleWeightChange('wSuitability', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-300">Hazard/Risk Deduction (w6)</span>
              <span className="font-mono text-red-400 font-bold">{weights.wRisk.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.50"
              step="0.05"
              value={weights.wRisk}
              onChange={e => handleWeightChange('wRisk', parseFloat(e.target.value))}
              className="w-full accent-red-400 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            Applying weights updates priority rankings across all {spring.name} and system springs.
          </div>
          <button
            onClick={handleRecalculatePriorities}
            disabled={isRecalculating}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>{isRecalculating ? 'Recalculating...' : 'Recalculate Priorities'}</span>
          </button>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
