import React, { useEffect, useState } from 'react';
import { GeospatialDataset, UserProfile } from '../types';
import { api } from '../services/api';
import { Database, UploadCloud, CheckCircle2, AlertTriangle, FileText, Globe } from 'lucide-react';

interface DatasetManagerProps {
  user: UserProfile;
}

export const DatasetManager: React.FC<DatasetManagerProps> = ({ user }) => {
  const [datasets, setDatasets] = useState<GeospatialDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'GeoJSON' | 'GeoTIFF' | 'CSV'>('GeoJSON');
  const [category, setCategory] = useState<'DEM' | 'Geology' | 'Drainage' | 'Rainfall' | 'LULC' | 'Lineaments' | 'Soil'>('Geology');
  const [crs, setCrs] = useState('EPSG:4326');
  const [source, setSource] = useState('Geological Survey of India (GSI) 1:50,000 Sheet');
  const [rawContent, setRawContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const res = await api.getDatasets();
      if (res.success) setDatasets(res.data);
    } catch (err) {
      console.error('Failed to load datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setUploading(true);

    try {
      const res = await api.uploadDataset({
        name,
        type,
        category,
        crs,
        source,
        rawContent: rawContent.trim() ? rawContent : undefined
      });

      if (res.success) {
        setSuccessMsg(`Dataset '${name}' passed validation and was ingested successfully (CRS: ${crs}).`);
        setShowUploadModal(false);
        fetchDatasets();
        // Reset form
        setName('');
        setRawContent('');
      } else {
        setErrorMsg(res.error?.message || 'Dataset validation failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with ingestion service.');
    } finally {
      setUploading(false);
    }
  };

  const isViewer = user.role === 'Viewer';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>SPATIAL DATA INGESTION ENGINE (MVP-AC-008 / 009 / 010)</span>
            <span>·</span>
            <span>CRS VALIDATION & METADATA</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Geospatial Datasets & Provenance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Validate, catalog, and ingest vector/raster hydrogeological layers with strict geodetic CRS verification.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          disabled={isViewer}
          className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-semibold transition-colors ${
            isViewer
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
          }`}
          title={isViewer ? 'Viewer role is read-only' : 'Upload dataset'}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload & Validate Dataset</span>
        </button>
      </div>

      {/* Dataset Label Banner */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>Data Provenance Standard: All development records are explicitly tagged as <strong>DEMO / SYNTHETIC / TEST DATA</strong>.</span>
        </div>
        <span className="font-mono text-slate-400 text-[11px]">
          Total Datasets: {datasets.length}
        </span>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Datasets Table */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading spatial dataset catalog...</div>
        ) : (
          datasets.map((ds) => (
            <div
              key={ds.id}
              className="p-4 bg-slate-900 border border-slate-800 rounded space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-400 font-semibold">{ds.id}</span>
                  <span className="text-slate-500">·</span>
                  <span className="font-bold text-slate-100 text-sm">{ds.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] bg-slate-950 border border-slate-800 text-amber-400 px-2 py-0.5 rounded">
                    {ds.provenanceTag}
                  </span>
                  <span className="font-mono text-[11px] text-emerald-400 font-bold">
                    {ds.qualityStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800/80 font-mono">
                <div>
                  <span className="text-slate-500 block font-sans">CATEGORY</span>
                  <span className="text-slate-200">{ds.category}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-sans">FORMAT</span>
                  <span className="text-cyan-400">{ds.type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-sans">COORDINATE SYSTEM</span>
                  <span className="text-slate-200">{ds.crs}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-sans">RESOLUTION / FEATURES</span>
                  <span className="text-slate-200">
                    {ds.resolutionM ? `${ds.resolutionM}m Grid` : `${ds.featureCount} Features`}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Source: <strong className="text-slate-300">{ds.source}</strong></span>
                <span>Uploaded: {ds.uploadDate.split('T')[0]} by {ds.uploadedBy}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-6 text-xs text-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-white">Upload & Validate Geospatial Layer</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Dataset Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Regional Thrust & Fault Lineaments GeoJSON"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Layer Type *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                  >
                    <option value="GeoJSON">GeoJSON Vector</option>
                    <option value="GeoTIFF">GeoTIFF Raster</option>
                    <option value="CSV">CSV with Coordinates</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Hydrogeological Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                  >
                    <option value="Geology">Geology & Bedrock</option>
                    <option value="DEM">DEM (Digital Elevation Model)</option>
                    <option value="Lineaments">Structural Lineaments</option>
                    <option value="Drainage">Drainage Streams</option>
                    <option value="Rainfall">Rainfall Isohyets</option>
                    <option value="LULC">Land-Use / Land-Cover</option>
                    <option value="Soil">Soil Permeability</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Coordinate Reference System *</label>
                  <select
                    value={crs}
                    onChange={e => setCrs(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 font-mono"
                  >
                    <option value="EPSG:4326">EPSG:4326 (WGS84 Geodetic)</option>
                    <option value="EPSG:32644">EPSG:32644 (UTM Zone 44N)</option>
                    <option value="EPSG:32643">EPSG:32643 (UTM Zone 43N)</option>
                    <option value="EPSG:3857">EPSG:3857 (Web Mercator)</option>
                    <option value="INVALID_CRS">INVALID_CRS (Test Validation Error)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Source / Acquisition Agency</label>
                  <input
                    type="text"
                    value={source}
                    onChange={e => setSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Optional Raw Content / GeoJSON payload</label>
                <textarea
                  rows={3}
                  placeholder='{"type": "FeatureCollection", "features": [...]}'
                  value={rawContent}
                  onChange={e => setRawContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded transition-colors"
                >
                  {uploading ? 'Validating...' : 'Validate & Ingest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
