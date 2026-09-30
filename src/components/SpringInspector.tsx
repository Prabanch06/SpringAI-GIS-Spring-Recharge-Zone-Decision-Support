import React, { useState } from 'react';
import { SpringEntity } from '../types';
import { Activity, Droplets, Mountain, Compass, ShieldAlert, Plus, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface SpringInspectorProps {
  spring: SpringEntity;
  onRefreshSpring: (updated: SpringEntity) => void;
  onOpenReport: (springId: string) => void;
}

export const SpringInspector: React.FC<SpringInspectorProps> = ({
  spring,
  onRefreshSpring,
  onOpenReport
}) => {
  const [showLogForm, setShowLogForm] = useState(false);
  const [newDischarge, setNewDischarge] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSeason, setNewSeason] = useState('Summer');
  const [newMethod, setNewMethod] = useState('V-Notch Weir');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);

  const handleLogDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDischarge) return;
    setIsSubmitting(true);
    try {
      const res = await api.logDischarge(spring.id, {
        date: newDate,
        discharge: parseFloat(newDischarge),
        season: newSeason,
        method: newMethod
      });
      if (res.success && res.updatedSpring) {
        onRefreshSpring(res.updatedSpring);
        setShowLogForm(false);
        setNewDischarge('');
        setLogSuccess(true);
        setTimeout(() => setLogSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to log discharge:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute SVG chart coordinates for historical discharge
  const history = spring.historicalDischarge || [];
  const maxDischargeVal = Math.max(...history.map(h => h.discharge), 10);
  const chartHeight = 120;
  const chartWidth = 360;
  const padding = 24;

  const points = history.map((rec, index) => {
    const x = padding + (index / Math.max(history.length - 1, 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (rec.discharge / maxDischargeVal) * (chartHeight - padding * 2);
    return { x, y, ...rec };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, curr, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '')
    : '';

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100 overflow-y-auto">
      {/* Header section */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-mono text-xs text-cyan-400 font-semibold">{spring.id}</span>
          <span className="text-xs text-slate-400">
            {spring.seasonality} · {spring.status}
          </span>
        </div>
        <h2 className="text-base font-bold text-white tracking-tight leading-snug">
          {spring.name}
        </h2>
        <div className="text-xs text-slate-400 mt-1">
          {spring.village} · {spring.district}, {spring.state}
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 space-y-6">
        {/* Core Hydrogeological Metrics (tabular-nums) */}
        <div>
          <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
            Discharge & Hydrogeology
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-950/40 border border-slate-800/80 rounded">
              <span className="text-slate-400 block text-[11px]">Current Avg Flow</span>
              <span className="text-lg font-bold font-mono text-white tabular-nums">
                {spring.averageDischarge}
              </span>
              <span className="text-[10px] text-slate-400 ml-1 font-mono">LPM</span>
            </div>

            <div className="p-2.5 bg-slate-950/40 border border-slate-800/80 rounded">
              <span className="text-slate-400 block text-[11px]">Elevation</span>
              <span className="text-lg font-bold font-mono text-white tabular-nums">
                {spring.elevation}
              </span>
              <span className="text-[10px] text-slate-400 ml-1 font-mono">m MSL</span>
            </div>

            <div className="p-2.5 bg-slate-950/40 border border-slate-800/80 rounded">
              <span className="text-slate-400 block text-[11px]">Summer Lean Flow</span>
              <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                {spring.minDischarge}
              </span>
              <span className="text-[10px] text-slate-400 ml-1 font-mono">LPM</span>
            </div>

            <div className="p-2.5 bg-slate-950/40 border border-slate-800/80 rounded">
              <span className="text-slate-400 block text-[11px]">Monsoon Peak Flow</span>
              <span className="text-base font-bold font-mono text-cyan-400 tabular-nums">
                {spring.maxDischarge}
              </span>
              <span className="text-[10px] text-slate-400 ml-1 font-mono">LPM</span>
            </div>
          </div>
        </div>

        {/* Provenance & Data Completeness (MVP-AC-016, MVP-AC-024, MVP-AC-054) */}
        <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
              {spring.datasetCategory || 'DEMO / SYNTHETIC / TEST DATA'}
            </span>
            <span className="font-mono text-cyan-400 font-semibold text-[11px]">
              Completeness: {spring.dataCompleteness}%
            </span>
          </div>
          {spring.missingDatasets && spring.missingDatasets.length > 0 && (
            <div className="text-[10px] text-slate-400 border-t border-slate-800/60 pt-1">
              <span className="text-slate-500">Missing Inputs (Not Fabricated): </span>
              <span className="text-slate-300 font-mono">{spring.missingDatasets.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Geological Strata & Structural setting */}
        <div className="text-xs space-y-2 border-t border-slate-800 pt-4">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
            Lithology & Structure
          </h3>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Spring Type</span>
            <span className="text-slate-200 font-medium">{spring.springType}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Formation</span>
            <span className="text-slate-200 font-medium text-right max-w-[200px] truncate" title={spring.geologicalFormation}>
              {spring.geologicalFormation}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Aquifer Type</span>
            <span className="text-slate-200 font-medium">{spring.aquiferType}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Bedding Strike / Dip</span>
            <span className="text-slate-200 font-mono font-medium">
              {spring.strike}° Strike · {spring.dip}° {spring.dipDirection} Dip
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Coordinates</span>
            <span className="text-slate-200 font-mono">
              {spring.latitude.toFixed(4)}°N, {spring.longitude.toFixed(4)}°E
            </span>
          </div>
        </div>

        {/* Historical Discharge Time-Series Chart */}
        <div className="border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Discharge Dynamics (LPM)
            </h3>
            <button
              onClick={() => setShowLogForm(!showLogForm)}
              className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Log Reading</span>
            </button>
          </div>

          {logSuccess && (
            <div className="p-2 mb-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Discharge observation recorded successfully.</span>
            </div>
          )}

          {/* Inline Discharge Logging Form */}
          {showLogForm && (
            <form onSubmit={handleLogDischarge} className="p-3 mb-3 bg-slate-950 border border-slate-800 rounded space-y-2.5 text-xs">
              <div className="font-semibold text-slate-200">Record Field Discharge</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Discharge (LPM)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 14.5"
                    value={newDischarge}
                    onChange={e => setNewDischarge(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Season</label>
                  <select
                    value={newSeason}
                    onChange={e => setNewSeason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-slate-200"
                  >
                    <option value="Summer">Summer (Lean)</option>
                    <option value="Monsoon">Monsoon (Peak)</option>
                    <option value="Post-Monsoon">Post-Monsoon</option>
                    <option value="Winter">Winter</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Method</label>
                  <select
                    value={newMethod}
                    onChange={e => setNewMethod(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-slate-200"
                  >
                    <option value="V-Notch Weir">V-Notch Weir</option>
                    <option value="Calibrated Bucket Timing">Bucket Timing</option>
                    <option value="Electromagnetic Flowmeter">Electromagnetic Flowmeter</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLogForm(false)}
                  className="px-2.5 py-1 text-slate-400 hover:text-slate-200 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded text-xs transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Observation'}
                </button>
              </div>
            </form>
          )}

          {/* SVG Discharge Trend Chart */}
          <div className="bg-slate-950 border border-slate-800 rounded p-2">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-28 overflow-visible">
              {/* Grid lines */}
              <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#334155" strokeDasharray="3,3" opacity="0.4" />
              <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#334155" strokeDasharray="3,3" opacity="0.4" />
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#475569" opacity="0.6" />

              {/* Sparkline curve */}
              {pathD && (
                <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}

              {/* Data points */}
              {points.map((pt, i) => (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="3.5"
                    fill={pt.season === 'Monsoon' ? '#38bdf8' : (pt.season === 'Summer' ? '#f59e0b' : '#10b981')}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                </g>
              ))}
            </svg>

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1 px-1">
              <span>{history[0]?.date || 'Past'}</span>
              <span className="flex items-center gap-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Monsoon</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Summer</span>
              </span>
              <span>{history[history.length - 1]?.date || 'Current'}</span>
            </div>
          </div>
        </div>

        {/* Water Quality & Hydrochemistry */}
        <div className="border-t border-slate-800 pt-4 text-xs">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
            Hydrochemical Quality
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2 bg-slate-950 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-400 block font-sans">pH Value</span>
              <span className="text-slate-100 font-bold">{spring.waterQuality.pH}</span>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-400 block font-sans">EC (µS/cm)</span>
              <span className="text-slate-100 font-bold">{spring.waterQuality.ec}</span>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-400 block font-sans">TDS (mg/L)</span>
              <span className="text-slate-100 font-bold">{spring.waterQuality.tds}</span>
            </div>
          </div>
        </div>

        {/* Risk Assessment & High-Risk Flag (MVP-AC-029, MVP-AC-030, MVP-AC-031) */}
        <div className="border-t border-slate-800 pt-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Terrain & Geological Hazard Risk
            </h3>
            <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
              spring.risk.category === 'Critical' || spring.risk.category === 'High'
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : (spring.risk.category === 'Moderate' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40')
            }`}>
              {spring.risk.category.toUpperCase()} RISK ({(spring.risk.score * 100).toFixed(0)}%)
            </span>
          </div>

          {(spring.risk.category === 'High' || spring.risk.category === 'Critical') && (
            <div className="p-2 bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] rounded flex items-center gap-1.5 font-medium">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>HIGH HAZARD FLAG: Engineering interventions require slope stability clearance.</span>
            </div>
          )}

          <div className="space-y-1 text-[11px] text-slate-400">
            {spring.risk.factors.map((rf, idx) => (
              <div key={idx} className="bg-slate-950 p-2 rounded border border-slate-800/60">
                <span className="font-semibold text-slate-200">{rf.factor}: </span>
                <span>{rf.details}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button: Technical Report Dossier */}
        <div className="border-t border-slate-800 pt-4 pb-2">
          <button
            onClick={() => onOpenReport(spring.id)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-medium text-xs rounded border border-slate-700 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Technical Dossier Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
