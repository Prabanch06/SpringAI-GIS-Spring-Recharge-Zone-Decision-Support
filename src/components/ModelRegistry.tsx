import React, { useEffect, useState } from 'react';
import { ModelMetadata } from '../types';
import { api } from '../services/api';
import { Cpu, CheckCircle2, ShieldCheck, Database, Award } from 'lucide-react';

export const ModelRegistry: React.FC = () => {
  const [models, setModels] = useState<ModelMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getModels().then(res => {
      if (res.success) setModels(res.data);
    }).catch(err => console.error('Failed to load models:', err))
    .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-slate-100">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
          <span>MLOPS & MODEL GOVERNANCE</span>
          <span>·</span>
          <span>SPATIAL CROSS-VALIDATION MATRIX</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Machine Learning Model Registry
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Audited hydrogeological models. Evaluated using Spatial Block GroupKFold to strictly prevent spatial autocorrelation leakage.
        </p>
      </div>

      {/* Spatial Cross-Validation Technical Architecture Box */}
      <div className="bg-slate-900 border border-slate-800 rounded p-4 text-xs space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Spatial Autocorrelation Leakage Prevention Standard</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          Standard random train/test splits overestimate model generalization by 30-40% due to geographic proximity between neighboring cells (Tobler's First Law). SpringAI-GIS enforces <strong>Spatial Block GroupKFold</strong> with a minimum 3.0 km buffer between training sub-watersheds and validation sub-basins.
        </p>
      </div>

      {/* Models Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading model registry...</div>
        ) : (
          models.map((mod) => {
            const isProd = mod.status === 'Production';

            return (
              <div
                key={mod.id}
                className={`p-4 bg-slate-900 rounded border text-xs space-y-3 ${
                  isProd ? 'border-cyan-500 shadow-md' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-cyan-400 font-bold text-sm">{mod.version}</span>
                    <span className="font-semibold text-slate-100 text-sm">{mod.name}</span>
                    {isProd && (
                      <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-[10px] font-mono font-bold">
                        ACTIVE PRODUCTION
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400 font-mono text-[11px]">
                    Status: <span className="text-slate-200 font-bold">{mod.status}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded border border-slate-800/80 font-mono">
                  <div>
                    <span className="text-slate-500 block font-sans text-[10px]">SPATIAL CV ROC-AUC</span>
                    <span className="text-emerald-400 text-base font-bold tabular-nums">
                      {mod.spatialCvRocAuc.toFixed(3)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans text-[10px]">F1 SCORE</span>
                    <span className="text-slate-200 text-base font-bold tabular-nums">
                      {mod.f1Score.toFixed(3)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans text-[10px]">SPATIAL RMSE</span>
                    <span className="text-slate-300 text-base font-bold tabular-nums">
                      {mod.rmse.toFixed(3)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans text-[10px]">INPUT FEATURES</span>
                    <span className="text-cyan-400 text-base font-bold tabular-nums">
                      {mod.featuresCount} Features
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-slate-300 text-[11px]">
                  <div><strong>Algorithm Architecture:</strong> {mod.algorithm}</div>
                  <div><strong>Validation Partitioning:</strong> {mod.spatialValidationStrategy}</div>
                  <div><strong>Training Dataset:</strong> <span className="font-mono text-slate-400">{mod.trainingDatasetVersion}</span> · Trained: {mod.trainedAt}</div>
                  <div><strong>Approved Authority:</strong> {mod.approvedBy}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
