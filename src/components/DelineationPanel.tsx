import React, { useState } from 'react';
import { SpringEntity } from '../types';
import { Layers, Compass, AlertTriangle, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

interface DelineationPanelProps {
  spring: SpringEntity;
  onUpdateSpring: (updated: SpringEntity) => void;
}

export const DelineationPanel: React.FC<DelineationPanelProps> = ({
  spring,
  onUpdateSpring
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>(spring.delineationMethod);
  const [isRunning, setIsRunning] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const handleRunDelineation = async () => {
    setIsRunning(true);
    setResultMsg(null);
    try {
      const res = await api.runDelineation(spring.id, selectedMethod);
      if (res.success && res.data) {
        const updatedSpring: SpringEntity = {
          ...spring,
          delineationMethod: res.data.method,
          delineatedPolygon: res.data.polygon,
          rechargeAreaHa: res.data.areaHa,
          confidence: res.data.confidence
        };
        onUpdateSpring(updatedSpring);
        setResultMsg(`Recharge zone delineated using ${selectedMethod.replace('_', ' ')}.`);
        setTimeout(() => setResultMsg(null), 4000);
      }
    } catch (err) {
      console.error('Failed to run delineation:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const methods = [
    {
      id: 'ensemble',
      name: 'Ensemble Multi-Criteria Synthesis (Recommended)',
      desc: 'Integrates upslope D8 flow routing with strike-dip structural rock planes and ML infiltration probability.',
      confidence: 'High',
      typicalArea: '44 - 55 ha'
    },
    {
      id: 'hydrogeological_rule',
      name: 'Hydrogeological Rule-Based Corridor',
      desc: 'Constrained strictly to up-dip recharge catchment following strike azimuth and bedding dip angle.',
      confidence: 'High',
      typicalArea: '36 - 48 ha'
    },
    {
      id: 'terrain_based',
      name: 'Terrain-Based Catchment (D8 Flow Accumulation)',
      desc: 'Delineates purely from surface digital elevation models (DEM) and drainage dividing ridges.',
      confidence: 'Medium',
      typicalArea: '40 - 65 ha'
    },
    {
      id: 'ml_based',
      name: 'Spatial ML Probabilistic Classifier',
      desc: 'Random Forest model trained on lineament density, soil permeability, TWI, and forest canopy.',
      confidence: 'High',
      typicalArea: '38 - 50 ha'
    }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-slate-100">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
          <span>SPRINGSHED DELINEATION ENGINE</span>
          <span>·</span>
          <span>TARGET: {spring.id}</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Probable Recharge Zone Identification
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Delineate groundwater recharge capture boundaries for {spring.name} ({spring.village}, {spring.district}).
        </p>
      </div>

      {/* Mandatory Scientific Disclaimer Banner */}
      <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded flex items-start gap-3 text-xs text-amber-200">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 font-semibold block mb-0.5">
            Hydrogeological Scientific Standard
          </strong>
          All AI and geospatial boundaries represent <strong>Probable Recharge Zones</strong>. Delineated areas require field validation (structural geological ground-truthing, tracer tests, and discharge observation) by a qualified hydrogeologist before final engineering civil works.
        </div>
      </div>

      {/* Delineation Output Card */}
      <div className="bg-slate-900 border border-slate-800 rounded p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Current Springshed Summary</h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Active Method: <span className="font-mono text-cyan-400 font-medium">{spring.delineationMethod.replace('_', ' ')}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Model Confidence</span>
            <span className="text-xs font-semibold text-emerald-400 font-mono">
              {spring.confidence} ({spring.dataCompleteness}% Completeness)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded">
            <span className="text-slate-400 block text-[11px]">Recharge Area</span>
            <span className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
              {spring.rechargeAreaHa}
            </span>
            <span className="text-[10px] text-slate-400 ml-1 font-mono">Hectares</span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded">
            <span className="text-slate-400 block text-[11px]">Square Kilometers</span>
            <span className="text-lg font-bold font-mono text-white tabular-nums">
              {(spring.rechargeAreaHa * 0.01).toFixed(3)}
            </span>
            <span className="text-[10px] text-slate-400 ml-1 font-mono">km²</span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded">
            <span className="text-slate-400 block text-[11px]">Suitability Index</span>
            <span className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
              {(spring.rechargeSuitability * 100).toFixed(0)}%
            </span>
            <span className="text-[10px] text-slate-400 ml-1 font-mono">Score</span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded">
            <span className="text-slate-400 block text-[11px]">Bedding Strike / Dip</span>
            <span className="text-sm font-bold font-mono text-slate-200 tabular-nums">
              {spring.strike}° / {spring.dip}° {spring.dipDirection}
            </span>
          </div>
        </div>
      </div>

      {/* Select Delineation Algorithm */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Select Delineation Methodology</h2>
        <div className="space-y-2">
          {methods.map(m => {
            const isSelected = selectedMethod === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setSelectedMethod(m.id)}
                className={`p-3.5 rounded border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-800/80 border-cyan-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="delineation_method"
                      checked={isSelected}
                      onChange={() => setSelectedMethod(m.id)}
                      className="accent-cyan-400"
                    />
                    <span className="font-semibold text-slate-100">{m.name}</span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">
                    Expected: {m.typicalArea}
                  </span>
                </div>
                <p className="text-slate-400 text-xs ml-5 leading-relaxed">
                  {m.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action CTA */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-slate-400">
          Selected method will immediately recalculate boundary geometry and update the GIS viewport.
        </div>
        <button
          onClick={handleRunDelineation}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Recalculating...' : 'Execute Delineation'}</span>
        </button>
      </div>

      {resultMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{resultMsg}</span>
        </div>
      )}
    </div>
  );
};
