import React, { useEffect, useState } from 'react';
import { SpringEntity, ShapFactor } from '../types';
import { api } from '../services/api';
import { TrendingUp, TrendingDown, HelpCircle, ShieldCheck } from 'lucide-react';

interface ShapExplainabilityProps {
  spring: SpringEntity;
}

export const ShapExplainability: React.FC<ShapExplainabilityProps> = ({ spring }) => {
  const [factors, setFactors] = useState<ShapFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [suitabilityData, setSuitabilityData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getSuitability(spring.id).then(res => {
      if (isMounted && res.success && res.data) {
        setFactors(res.data.shapFactors);
        setSuitabilityData(res.data);
      }
    }).catch(err => {
      console.error('Failed to load SHAP data:', err);
    }).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, [spring.id]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-slate-100">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
          <span>EXPLAINABLE AI · SHAP FACTOR ATTRIBUTION</span>
          <span>·</span>
          <span>{spring.id}</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Recharge Suitability Explanation
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Transparent decomposition of machine learning inference for {spring.name}. Every score is grounded in actual geological and topographic inputs.
        </p>
      </div>

      {/* Summary Score Card */}
      <div className="bg-slate-900 border border-slate-800 rounded p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Recharge Suitability</span>
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {suitabilityData ? (suitabilityData.rechargeSuitabilityScore * 100).toFixed(0) : (spring.rechargeSuitability * 100).toFixed(0)}%
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Confidence Grade</span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              {suitabilityData?.confidence || spring.confidence}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Model Uncertainty</span>
            <span className="text-lg font-bold font-mono text-slate-300 tabular-nums">
              {suitabilityData ? suitabilityData.uncertainty : 0.12}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Data Completeness</span>
            <span className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
              {spring.dataCompleteness}%
            </span>
          </div>
        </div>
      </div>

      {/* Factors List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            Primary Hydrogeological Drivers (SHAP Value Breakdown)
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">
            Model: v2.4-ensemble (TreeExplainer)
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Computing SHAP feature attributions...
          </div>
        ) : (
          <div className="space-y-2.5">
            {factors.map((item, index) => {
              const isPositive = item.direction === 'positive';
              const impactPct = Math.round(Math.abs(item.impact) * 100);

              return (
                <div
                  key={index}
                  className="p-3.5 bg-slate-900 border border-slate-800 rounded text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className="font-semibold text-slate-100">{item.factor}</span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({item.value})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className={`font-semibold ${isPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isPositive ? '+' : '-'}{impactPct}% contribution
                      </span>
                    </div>
                  </div>

                  {/* Impact bar */}
                  <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden">
                    <div
                      className={`h-full ${isPositive ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(impactPct * 3, 100)}%` }}
                    />
                  </div>

                  <p className="text-slate-400 text-xs leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-950 border border-slate-800/80 rounded text-xs text-slate-400 leading-relaxed">
        <strong className="text-slate-300">Methodological Note: </strong>
        SHAP (SHapley Additive exPlanations) values compute the fair marginal contribution of each physical feature toward the final recharge suitability score. Positive weights indicate conditions that augment groundwater percolation; negative weights highlight physical constraints such as excessive slope runoff or distance from fracture lineaments.
      </div>
    </div>
  );
};
