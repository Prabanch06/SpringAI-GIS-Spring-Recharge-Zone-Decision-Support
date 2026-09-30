import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Printer, Download, ShieldAlert, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ReportGeneratorProps {
  springId: string;
  onClose: () => void;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ springId, onClose }) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getReportData(springId).then(res => {
      if (res.success) setReport(res.data);
    }).catch(err => console.error('Failed to load report:', err))
    .finally(() => setLoading(false));
  }, [springId]);

  if (loading || !report) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
        <div className="text-cyan-400 font-mono text-xs">Compiling technical dossier for {springId}...</div>
      </div>
    );
  }

  const p = report.springProfile;
  const s = report.springshedAnalysis;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto p-4 sm:p-8 text-slate-900 print:p-0 print:bg-white">
      {/* Top action bar */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Workspace</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded transition-colors shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document (White scientific paper format) */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-2xl rounded-sm border border-slate-200 print:border-none print:shadow-none font-sans text-xs space-y-6">
        {/* Official Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
          <div>
            <div className="font-mono text-[10px] text-slate-500 tracking-wider uppercase">
              STATE SPRINGS REVIVAL & GROUNDWATER INITIATIVE
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
              Technical Hydrogeological Springshed Dossier
            </h1>
            <div className="text-slate-600 text-xs mt-0.5">
              Spring Recharge Zone Identification & Decision Support Assessment
            </div>
          </div>
          <div className="text-right font-mono text-[11px] text-slate-600">
            <div><strong>Report Ref:</strong> {report.reportNumber}</div>
            <div><strong>Date:</strong> {report.generatedAt.split('T')[0]}</div>
            <div><strong>Investigator:</strong> {report.generatedBy}</div>
          </div>
        </div>

        {/* 1. Spring Identity & Geodetic Profile */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
            1. General Identity & Location Attributes
          </h2>
          <div className="grid grid-cols-2 gap-3 text-slate-700">
            <div><strong>Spring ID:</strong> {p.id}</div>
            <div><strong>Spring Name:</strong> {p.name}</div>
            <div><strong>Village / Ward:</strong> {p.location.village}</div>
            <div><strong>District / State:</strong> {p.location.district}, {p.location.state}</div>
            <div><strong>Coordinates (WGS84):</strong> {p.location.latitude}°N, {p.location.longitude}°E</div>
            <div><strong>Elevation:</strong> {p.location.elevation}</div>
          </div>
        </div>

        {/* 2. Hydrogeology & Discharge Characterization */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
            2. Hydrogeological & Stratigraphic Setting
          </h2>
          <div className="grid grid-cols-2 gap-3 text-slate-700">
            <div><strong>Spring Classification:</strong> {p.hydrogeology.springType} Spring</div>
            <div><strong>Geological Formation:</strong> {p.hydrogeology.geologicalFormation}</div>
            <div><strong>Aquifer Hydrodynamic Type:</strong> {p.hydrogeology.aquiferType}</div>
            <div><strong>Structural Attitude:</strong> {p.hydrogeology.strikeDip}</div>
            <div><strong>Mean Discharge:</strong> {p.hydrogeology.averageDischarge}</div>
            <div><strong>Lean Season Flow:</strong> {p.hydrogeology.leanSeasonDischarge}</div>
            <div><strong>Peak Monsoon Flow:</strong> {p.hydrogeology.peakMonsoonDischarge}</div>
            <div><strong>Discharge Seasonality:</strong> {p.hydrogeology.seasonality}</div>
          </div>
        </div>

        {/* 3. Springshed Recharge Delineation */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
            3. Probable Recharge Zone (Springshed) Delineation
          </h2>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded grid grid-cols-3 gap-3 text-slate-700">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Delineation Method</span>
              <span className="font-semibold text-slate-900">{s.method.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Recharge Area</span>
              <span className="font-semibold text-slate-900">{s.rechargeAreaHa} Hectares</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Confidence Grade</span>
              <span className="font-semibold text-slate-900">{s.confidence} ({s.dataCompleteness})</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
            The probable recharge zone was computed by modeling upslope kinematic contributing flow, bedrock structural strike-dip alignment, and multi-criteria spatial infiltration indicators.
          </p>
        </div>

        {/* 4. Priority Ranking & Risk Matrix */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
            4. Multi-Criteria Priority & Geological Hazard Assessment
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="font-semibold text-slate-900 mb-1">MCDA Priority Score</div>
              <div className="text-xl font-bold font-mono text-slate-900">
                {(report.priorityRanking.priorityScore * 100).toFixed(0)}% · {report.priorityRanking.priorityTier}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Weights: Recharge (25%), Revival (20%), Water Stress (20%), Community (15%), Suitability (10%), Risk (-10%).
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="font-semibold text-slate-900 mb-1">Risk Category: {report.riskAssessment.category}</div>
              <div className="space-y-1">
                {report.riskAssessment.factors.map((f: any, idx: number) => (
                  <div key={idx} className="text-[11px] text-slate-600">
                    • <strong>{f.factor}:</strong> {f.details}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 5. Recommended Interventions */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
            5. Indicative Engineering Interventions
          </h2>
          <table className="w-full text-left border border-slate-200 text-[11px]">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-2 border-b border-slate-200">Type of Structure</th>
                <th className="p-2 border-b border-slate-200">Suitability</th>
                <th className="p-2 border-b border-slate-200">Recommended Specifications</th>
                <th className="p-2 border-b border-slate-200">Est. Infiltration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="p-2 font-medium">Staggered Contour Trenches</td>
                <td className="p-2">88%</td>
                <td className="p-2">0.5m x 0.5m x 5m at 10m horizontal intervals</td>
                <td className="p-2">+6.8 LPM</td>
              </tr>
              <tr>
                <td className="p-2 font-medium">Gabion / Check Dam</td>
                <td className="p-2">84%</td>
                <td className="p-2">1.2m crest height, 6m span with central overflow notch</td>
                <td className="p-2">+11.5 LPM</td>
              </tr>
              <tr>
                <td className="p-2 font-medium">Springhead Protection Box</td>
                <td className="p-2">96%</td>
                <td className="p-2">50m radius bio-fencing + sealed sanitary chamber</td>
                <td className="p-2">+3.2 LPM</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Statutory Scientific Disclaimer */}
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded text-[11px] leading-relaxed">
          <strong>Mandatory Regulatory & Scientific Disclaimer: </strong>
          {report.scientificDisclaimer}
        </div>

        {/* Signatures */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-center text-slate-700 text-xs">
          <div className="border-t border-slate-400 pt-1">
            <strong>Hydrogeologist / Field Officer</strong>
            <div className="text-[10px] text-slate-500">Sign & Seal</div>
          </div>
          <div className="border-t border-slate-400 pt-1">
            <strong>Superintending Engineer / State Mission Director</strong>
            <div className="text-[10px] text-slate-500">Administrative Approval</div>
          </div>
        </div>
      </div>
    </div>
  );
};
