import React, { useState, useEffect } from 'react';
import { BackgroundJob, TerrainProcessingResult, UserProfile } from '../types';
import { api } from '../services/api';
import { Mountain, Play, RefreshCw, CheckCircle2, Clock, Activity, ShieldCheck } from 'lucide-react';

interface TerrainProcessorProps {
  user: UserProfile;
}

export const TerrainProcessor: React.FC<TerrainProcessorProps> = ({ user }) => {
  const [terrainResult, setTerrainResult] = useState<TerrainProcessingResult | null>(null);
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const [elevationBase, setElevationBase] = useState(1600);

  const fetchJobs = async () => {
    try {
      const res = await api.getJobs();
      if (res.success) setJobs(res.data);
    } catch (err) {
      console.error('Failed to load background jobs:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Run initial DEM calculation
    handleProcessDem();
  }, []);

  const handleProcessDem = async () => {
    setIsProcessing(true);
    try {
      const res = await api.processDem('DS-DEM-001', elevationBase);
      if (res.success && res.data) {
        setTerrainResult(res.data);
      }
    } catch (err) {
      console.error('Failed to process DEM:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQueueAsyncJob = async (taskType: string) => {
    if (user.role === 'Viewer') {
      alert("Role 'Viewer' has read-only access and cannot submit background jobs.");
      return;
    }
    setIsQueueing(true);
    try {
      const res = await api.submitJob(taskType, { demId: 'DS-DEM-001', elevationBase });
      if (res.success) {
        fetchJobs();
        // Polling status
        const interval = setInterval(async () => {
          const updated = await api.getJobs();
          if (updated.success) {
            setJobs(updated.data);
            const thisJob = updated.data.find(j => j.id === res.data.id);
            if (thisJob && (thisJob.status === 'Completed' || thisJob.status === 'Failed')) {
              clearInterval(interval);
            }
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to submit job:', err);
    } finally {
      setIsQueueing(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-slate-100">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
          <span>DEM & TERRAIN ENGINE (MVP-AC-012 / 013 / 014 / 047 / 048)</span>
          <span>·</span>
          <span>DETERMINISTIC SPATIAL PIPELINE</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Terrain Processing & Asynchronous Celery Jobs
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Extract deterministic elevation, slope gradient, aspect, and flow accumulation. Long-running raster operations run asynchronously.
        </p>
      </div>

      {/* Deterministic DEM Output Card */}
      <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">
              Deterministic DEM Processing Output (Horn 3x3 Gradient Filter)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Baseline MSL:</span>
            <input
              type="number"
              value={elevationBase}
              onChange={e => setElevationBase(Number(e.target.value))}
              className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-cyan-400 font-mono"
            />
            <button
              onClick={handleProcessDem}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded text-xs transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Compute</span>
            </button>
          </div>
        </div>

        {terrainResult && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <span className="text-slate-500 block text-[10px]">MIN ELEVATION</span>
                <span className="text-lg font-bold font-mono text-slate-100 tabular-nums">
                  {terrainResult.elevationMin} m
                </span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <span className="text-slate-500 block text-[10px]">MAX ELEVATION</span>
                <span className="text-lg font-bold font-mono text-slate-100 tabular-nums">
                  {terrainResult.elevationMax} m
                </span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <span className="text-slate-500 block text-[10px]">MEAN SLOPE GRADIENT</span>
                <span className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
                  {terrainResult.meanSlopeDeg}° Slope
                </span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <span className="text-slate-500 block text-[10px]">DOMINANT ASPECT</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {terrainResult.dominantAspect}
                </span>
              </div>
            </div>

            {/* Slope Distribution Bar */}
            <div className="p-3 bg-slate-950 border border-slate-800/80 rounded space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Slope Classification Breakdown (MVP-AC-012)</span>
                <span className="font-mono text-slate-500">CRS: {terrainResult.spatialReference}</span>
              </div>
              <div className="h-3 w-full bg-slate-900 rounded overflow-hidden flex">
                <div style={{ width: `${terrainResult.slopeClasses.gentlePct}%` }} className="bg-emerald-500" title="Gentle <8°" />
                <div style={{ width: `${terrainResult.slopeClasses.moderatePct}%` }} className="bg-cyan-500" title="Moderate 8-22°" />
                <div style={{ width: `${terrainResult.slopeClasses.steepPct}%` }} className="bg-amber-500" title="Steep >22°" />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Gentle (&lt;8°): {terrainResult.slopeClasses.gentlePct}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500" /> Moderate (8-22°): {terrainResult.slopeClasses.moderatePct}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Steep (&gt;22°): {terrainResult.slopeClasses.steepPct}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
              <span>Deterministic Checksum: <strong className="text-cyan-400">{terrainResult.deterministicHash}</strong></span>
              <span>Flow Peak: {terrainResult.flowAccumulationPeak} cells</span>
            </div>
          </div>
        )}
      </div>

      {/* Asynchronous Celery Jobs Engine (MVP-AC-047, MVP-AC-048) */}
      <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                Asynchronous Celery/Redis Job Queue (MVP-AC-047 / 048)
              </h2>
              <div className="text-[11px] text-slate-400">
                Non-blocking worker pool handling expensive raster clipping, flow accumulation, and batch retraining
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQueueAsyncJob('WATERSHED_DELINEATION')}
              disabled={isQueueing}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 font-medium text-xs rounded transition-colors"
            >
              + Queue Batch Delineation
            </button>
            <button
              onClick={() => handleQueueAsyncJob('MODEL_RETRAINING')}
              disabled={isQueueing}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded transition-colors"
            >
              + Launch Model Retraining
            </button>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-2.5">
          {jobs.map((job) => {
            const isCompleted = job.status === 'Completed';
            const isRunning = job.status === 'Running';
            const isQueued = job.status === 'Queued';

            return (
              <div
                key={job.id}
                className="p-3.5 bg-slate-950 border border-slate-800/80 rounded space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 font-bold">{job.id}</span>
                    <span className="text-slate-500">·</span>
                    <span className="font-semibold text-slate-200">{job.taskType}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className={`flex items-center gap-1 font-bold ${
                      isCompleted ? 'text-emerald-400' : (isRunning ? 'text-cyan-400 animate-pulse' : 'text-amber-400')
                    }`}>
                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isRunning && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      {isQueued && <Clock className="w-3.5 h-3.5" />}
                      <span>{job.status}</span>
                    </span>
                    <span className="text-slate-500">({job.progressPct}%)</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                    style={{ width: `${job.progressPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                  <span>Submitted by: {job.submittedBy}</span>
                  <span>{new Date(job.submittedAt).toLocaleTimeString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
