import React, { useState, useEffect } from 'react';
import { SpringEntity, FieldObservation, UserProfile } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { offlineSyncManager, QueuedObservation } from '../services/offlineSync';
import {
  Camera,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  ShieldCheck,
  Wifi,
  WifiOff,
  RefreshCw,
  HardDrive,
  CloudUpload,
  AlertTriangle,
  Sparkles,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

interface FieldValidationModuleProps {
  springs: SpringEntity[];
  user: UserProfile;
  onRefreshAllSprings: () => void;
}

export const FieldValidationModule: React.FC<FieldValidationModuleProps> = ({
  springs,
  user,
  onRefreshAllSprings
}) => {
  const [observations, setObservations] = useState<FieldObservation[]>([]);
  const [queuedObs, setQueuedObs] = useState<QueuedObservation[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // New observation form state
  const [targetSpringId, setTargetSpringId] = useState(springs[0]?.id || '');
  const [measuredDischarge, setMeasuredDischarge] = useState('12.5');
  const [gpsAccuracy, setGpsAccuracy] = useState('2.1');
  const [strikeDipMeasured, setStrikeDipMeasured] = useState('130° Strike / 26° NE Dip');
  const [geologyNotes, setGeologyNotes] = useState('Bedding strike measured at 135°, clear joint trace seepage.');
  const [waterCondition, setWaterCondition] = useState('Clear');
  const [sanitaryRisk, setSanitaryRisk] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [flowVisible, setFlowVisible] = useState<boolean>(true);
  const [interventionStatus, setInterventionStatus] = useState('No obstruction, vegetative fence intact.');
  const [comments, setComments] = useState('Observed stable baseflow; community requested additional contour trench on upper terrace.');
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // Smart Field Assistant (Gemini Vision) state
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [aiVisionResult, setAiVisionResult] = useState<any | null>(null);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        triggerPhotoAnalysis(base64, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoadSampleOutcrop = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 250;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 400, 250);
      grad.addColorStop(0, '#334155');
      grad.addColorStop(0.5, '#475569');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 250);

      // Bedding strata lines
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.5;
      for (let y = 30; y < 250; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y + 15);
        ctx.lineTo(400, y - 15);
        ctx.stroke();
      }

      // Orthogonal joint fractures
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(110, 20);
      ctx.lineTo(140, 230);
      ctx.moveTo(250, 15);
      ctx.lineTo(280, 225);
      ctx.stroke();

      // Clear seepage water patch
      ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.fillRect(125, 120, 35, 70);
    }
    const sampleBase64 = canvas.toDataURL('image/jpeg');
    setPhotoPreview(sampleBase64);
    triggerPhotoAnalysis(sampleBase64, 'image/jpeg');
  };

  const triggerPhotoAnalysis = async (base64: string, mimeType: string = 'image/jpeg') => {
    const currentSpring = springs.find(s => s.id === targetSpringId);
    setAnalyzingPhoto(true);
    try {
      const res = await api.analyzeOutcropPhoto(base64, mimeType, {
        name: currentSpring?.name,
        district: currentSpring?.district,
        geologicalFormation: currentSpring?.geologicalFormation
      });
      if (res.success && res.data) {
        setAiVisionResult(res.data);
        
        // 1. Lithology Auto-Fill
        const lithologyText = res.data.lithology || 'Fractured bedrock';
        const aiNotes = res.data.ai_assistance_notes || res.data.suggestedNotes;
        setGeologyNotes(aiNotes ? `${lithologyText}. ${aiNotes}` : lithologyText);

        // 2. Water Condition Auto-Fill
        const clarity = res.data.water_clarity || res.data.waterClarity || 'Clear';
        setWaterCondition(clarity);

        // 3. Sanitary Risk Auto-Fill
        if (res.data.sanitary_risk) {
          const risk = res.data.sanitary_risk;
          if (risk === 'Low' || risk === 'Medium' || risk === 'High') {
            setSanitaryRisk(risk);
          }
        }

        // 4. Flow Visibility
        if (typeof res.data.flow_visible === 'boolean') {
          setFlowVisible(res.data.flow_visible);
        }

        // 5. Intervention Status (if suggested)
        const intervention = res.data.recommended_intervention || res.data.recommendedIntervention;
        if (intervention) {
          setInterventionStatus(intervention);
        }

        setSyncFeedback(`✨ Smart Field Assistant: Auto-filled Lithology (${lithologyText}), Water (${clarity}), Risk (${res.data.sanitary_risk || 'Medium'})`);
        setTimeout(() => setSyncFeedback(null), 5000);
      }
    } catch (err: any) {
      console.warn('Failed to analyze photo with AI vision:', err.message);
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  // Update offline cache of springs whenever springs load
  useEffect(() => {
    if (springs.length > 0) {
      offlineSyncManager.cacheSprings(springs);
    }
  }, [springs]);

  // Sync state & network listeners
  useEffect(() => {
    const updateSyncState = () => {
      setIsOnline(offlineSyncManager.isOnline());
      setIsSimulatedOffline(offlineSyncManager.getSimulatedOffline());
      setQueuedObs(offlineSyncManager.getQueuedObservations());
    };

    updateSyncState();
    const unsub = offlineSyncManager.subscribe(updateSyncState);

    // Auto-sync when network reconnects
    const handleOnline = () => {
      console.log('🌐 Network restored: attempting background sync of offline field data...');
      handleTriggerSync();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      unsub();
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const fetchObservations = async () => {
    try {
      setLoading(true);
      const res = await api.getFieldValidations();
      if (res.success) {
        setObservations(res.data);
      }
    } catch (err) {
      console.warn('Failed to load observations from server (using offline mode):', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObservations();

    const unsubNew = socketService.onValidationNew((newObs) => {
      setObservations(prev => [newObs, ...prev.filter(o => o.id !== newObs.id)]);
      onRefreshAllSprings();
    });

    const unsubUpd = socketService.onValidationUpdated((updatedObs) => {
      setObservations(prev => prev.map(o => o.id === updatedObs.id ? updatedObs : o));
      onRefreshAllSprings();
    });

    return () => {
      unsubNew();
      unsubUpd();
    };
  }, []);

  const handleToggleOfflineMode = () => {
    const nextState = !isSimulatedOffline;
    offlineSyncManager.setSimulatedOffline(nextState);
    setSyncFeedback(
      nextState
        ? '⚠️ Field Offline Mode enabled. Validations will be stored on local device.'
        : '⚡ Online mode restored. Connecting to Central GIS Gateway...'
    );
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handleTriggerSync = async () => {
    if (!offlineSyncManager.isOnline()) {
      setSyncFeedback('Cannot sync while device is in Offline Mode.');
      setTimeout(() => setSyncFeedback(null), 3000);
      return;
    }

    setIsSyncing(true);
    try {
      const { syncedCount, failedCount } = await offlineSyncManager.syncQueue(api.submitFieldValidation);
      if (syncedCount > 0) {
        setSyncFeedback(`✅ Successfully synchronized ${syncedCount} field observation(s) to Central GIS.`);
        fetchObservations();
        onRefreshAllSprings();
        offlineSyncManager.clearSyncedObservations();
      } else if (failedCount > 0) {
        setSyncFeedback(`⚠️ ${failedCount} observation(s) failed to sync. Check network and retry.`);
      } else {
        setSyncFeedback('All field observations are already synchronized.');
      }
    } catch (err: any) {
      setSyncFeedback(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  const handleSubmitObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSpringId) return;

    const selectedSpring = springs.find(s => s.id === targetSpringId);
    setSubmitting(true);

    const payload = {
      springId: targetSpringId,
      discharge: parseFloat(measuredDischarge),
      gpsAccuracyM: parseFloat(gpsAccuracy),
      geologyNotes,
      waterCondition,
      interventionStatus,
      comments,
      sanitaryRisk,
      flowVisible,
      strikeDipMeasured
    };

    // If device is offline or in simulated remote field mode, queue locally
    if (!offlineSyncManager.isOnline()) {
      offlineSyncManager.saveObservationOffline({
        ...payload,
        springName: selectedSpring?.name || targetSpringId,
        village: selectedSpring?.village || 'Unknown Village',
        district: selectedSpring?.district || 'Unknown District',
        observer: user.name,
        role: user.role,
        photosCount: 2
      });

      setSubmitting(false);
      setShowSubmitModal(false);
      setSyncFeedback('💾 Observation saved to local device cache. Will sync automatically once connected.');
      setTimeout(() => setSyncFeedback(null), 5000);
      return;
    }

    // Attempt direct online submission with automatic fallback to offline queue on failure
    try {
      const res = await api.submitFieldValidation(payload);

      if (res.success) {
        setShowSubmitModal(false);
        fetchObservations();
        onRefreshAllSprings();
        setSyncFeedback('✅ Field observation submitted and broadcasted via real-time gateway.');
        setTimeout(() => setSyncFeedback(null), 4000);
      } else {
        throw new Error(res.error?.message || 'Server rejected submission');
      }
    } catch (err: any) {
      console.warn('Network error during submission. Falling back to offline queue:', err.message);
      offlineSyncManager.saveObservationOffline({
        ...payload,
        springName: selectedSpring?.name || targetSpringId,
        village: selectedSpring?.village || 'Unknown Village',
        district: selectedSpring?.district || 'Unknown District',
        observer: user.name,
        role: user.role,
        photosCount: 2
      });
      setShowSubmitModal(false);
      setSyncFeedback('⚠️ Network error encountered: Observation saved safely in local offline queue.');
      setTimeout(() => setSyncFeedback(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewDecision = async (obsId: string, status: 'Approved' | 'Rejected') => {
    setReviewingId(obsId);
    try {
      const res = await api.reviewFieldValidation(obsId, status, `Reviewed by ${user.name} (${user.role})`);
      if (res.success) {
        fetchObservations();
        onRefreshAllSprings();
      }
    } catch (err) {
      console.error('Failed to update review:', err);
    } finally {
      setReviewingId(null);
    }
  };

  const canReview = user.role === 'Administrator' || user.role === 'Hydrogeologist';
  const pendingQueueCount = queuedObs.filter(o => o.syncStatus === 'pending' || o.syncStatus === 'failed').length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-slate-100">
      {/* Top Header with Ground-Truthing & Offline Mobility Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>PHASE 3 FIELD MOBILITY</span>
            <span>·</span>
            <span>OFFLINE LOCAL CACHE & SYNC ENGINE</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Field Validation & Mobile Ground-Truthing Registry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Designed for remote Himalayan valleys. Supports offline data logging with automatic batch sync on reconnection.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Offline Mode Toggle Button */}
          <button
            onClick={handleToggleOfflineMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
              isSimulatedOffline
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle simulated Himalayan offline environment"
          >
            {isSimulatedOffline ? <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isSimulatedOffline ? 'Simulated Offline Mode' : 'Online Mode'}</span>
          </button>

          {/* Sync Button */}
          {pendingQueueCount > 0 && (
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing || !isOnline}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
                isOnline
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                  : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Queue ({pendingQueueCount})</span>
            </button>
          )}

          {/* New Observation Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>New Field Observation</span>
          </button>
        </div>
      </div>

      {/* Sync Feedback Alert */}
      {syncFeedback && (
        <div className="p-3 bg-slate-900 border border-cyan-500/40 rounded text-xs font-mono flex items-center justify-between text-cyan-300 shadow-lg animate-fadeIn">
          <span>{syncFeedback}</span>
          <button onClick={() => setSyncFeedback(null)} className="text-slate-400 hover:text-white text-xs ml-3">✕</button>
        </div>
      )}

      {/* Connectivity Status & Protocol Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className={`p-3.5 rounded border flex items-center gap-3 ${
          isOnline ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
        }`}>
          {isOnline ? <Wifi className="w-5 h-5 text-emerald-400 shrink-0" /> : <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />}
          <div>
            <div className="font-semibold text-white">
              {isOnline ? 'Real-Time GIS Gateway Connected' : 'Offline Field Mode (Remote Valley)'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isOnline ? 'Live bidirectional WebSockets active' : 'Observations cached in local device storage'}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded border bg-slate-900 border-slate-800 text-slate-300 flex items-center gap-3">
          <HardDrive className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="font-semibold text-white">Local Device Storage</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {springs.length} springs cached · {pendingQueueCount} pending sync
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded border bg-slate-900 border-slate-800 text-slate-300 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
          <div>
            <div className="font-semibold text-white">Scientific State Machine</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Field Obs → Hydrogeologist Review → Model Retraining
            </div>
          </div>
        </div>
      </div>

      {/* Queued Offline Observations Section (If Any) */}
      {queuedObs.length > 0 && (
        <div className="space-y-3 bg-amber-950/10 border border-amber-500/30 rounded p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudUpload className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-amber-300">
                Locally Cached Field Observations ({queuedObs.length})
              </h2>
            </div>
            {isOnline && (
              <button
                onClick={handleTriggerSync}
                disabled={isSyncing}
                className="text-xs px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded font-semibold transition-colors"
              >
                {isSyncing ? 'Syncing...' : 'Sync All to Central Server'}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {queuedObs.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-950/80 border border-amber-500/20 rounded flex items-center justify-between text-xs font-mono"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">{item.id}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-200 font-sans font-semibold">{item.springName || item.springId}</span>
                    <span className="text-slate-400 font-sans text-[11px]">({item.village}, {item.district})</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Discharge: <span className="text-cyan-400 font-bold">{item.discharge} LPM</span> | GPS: ±{item.gpsAccuracyM}m | Logged: {new Date(item.createdAt).toLocaleTimeString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    item.syncStatus === 'synced'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : item.syncStatus === 'syncing'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {item.syncStatus === 'synced' ? 'Synced' : (item.syncStatus === 'syncing' ? 'Syncing...' : 'Pending Sync')}
                  </span>

                  <button
                    onClick={() => offlineSyncManager.removeQueuedObservation(item.id)}
                    className="text-slate-500 hover:text-red-400 text-xs px-1.5"
                    title="Remove local cached observation"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Field Observations Registry Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            Central GIS Field Observations ({observations.length})
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">
            {canReview ? 'Review Permissions Active' : 'Read/Submit Mode'}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Loading field observation registry...
          </div>
        ) : (
          <div className="space-y-3">
            {observations.map((obs) => {
              const isApproved = obs.validationStatus === 'Approved';
              const isRejected = obs.validationStatus === 'Rejected';
              const isPending = obs.validationStatus === 'Pending Review';

              return (
                <div
                  key={obs.id}
                  className="p-4 bg-slate-900 border border-slate-800 rounded space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-semibold">{obs.id}</span>
                      <span className="text-slate-500">·</span>
                      <span className="font-semibold text-slate-200">
                        {obs.springName || obs.springId}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        ({obs.village}, {obs.district})
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-400 text-[11px]">{obs.date}</span>
                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          isApproved ? 'text-emerald-400' : (isRejected ? 'text-red-400' : 'text-amber-400')
                        }`}
                      >
                        {isApproved && <CheckCircle className="w-3.5 h-3.5" />}
                        {isRejected && <XCircle className="w-3.5 h-3.5" />}
                        {isPending && <Clock className="w-3.5 h-3.5" />}
                        <span>{obs.validationStatus}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800/80 font-mono">
                    <div>
                      <span className="text-slate-500 block font-sans">DISCHARGE</span>
                      <span className="text-cyan-400 font-bold">{obs.discharge} LPM</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-sans">GPS ACCURACY</span>
                      <span className="text-slate-200">±{obs.gpsAccuracyM} m</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-sans">SURVEYOR</span>
                      <span className="text-slate-200">{obs.observer} ({obs.role})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-sans">PHOTOS</span>
                      <span className="text-slate-200">{obs.photosCount} geotagged</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-slate-300">
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 pb-1">
                      {obs.sanitaryRisk && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          obs.sanitaryRisk === 'Low' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' :
                          obs.sanitaryRisk === 'High' ? 'bg-red-950 text-red-400 border-red-500/30' :
                          'bg-amber-950 text-amber-400 border-amber-500/30'
                        }`}>
                          Sanitary Risk: {obs.sanitaryRisk}
                        </span>
                      )}
                      {obs.strikeDipMeasured && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                          📐 Strike/Dip: {obs.strikeDipMeasured}
                        </span>
                      )}
                      {obs.flowVisible !== undefined && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {obs.flowVisible ? '💧 Surface Flow Visible' : '⭕ No Surface Flow'}
                        </span>
                      )}
                    </div>
                    <div><strong>Geological Field Notes:</strong> {obs.geologyNotes}</div>
                    <div><strong>Water Quality:</strong> {obs.waterCondition}</div>
                    <div><strong>Intervention Status:</strong> {obs.interventionStatus}</div>
                    {obs.comments && <div className="text-slate-400 italic">"{obs.comments}"</div>}
                  </div>

                  {/* Actions for Hydrogeologist / Admin */}
                  {canReview && isPending && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleReviewDecision(obs.id, 'Rejected')}
                        disabled={reviewingId === obs.id}
                        className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs transition-colors"
                      >
                        Reject Observation
                      </button>
                      <button
                        onClick={() => handleReviewDecision(obs.id, 'Approved')}
                        disabled={reviewingId === obs.id}
                        className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-semibold transition-colors"
                      >
                        Approve for Model Retraining
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Observation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">
                  {isOnline ? 'Log Field Observation' : 'Log Offline Field Observation'}
                </h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                isOnline ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950 text-amber-400 border border-amber-500/30'
              }`}>
                {isOnline ? 'Online Sync' : 'Device Storage Cache'}
              </span>
            </div>

            {/* Scientific Defensibility Notice */}
            <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/30 rounded text-[11px] text-cyan-200 flex items-start gap-2">
              <span className="text-base leading-none">🔬</span>
              <div className="space-y-0.5">
                <span className="font-semibold text-cyan-300 block">Scientific Defensibility Protocol</span>
                <p className="text-slate-300 text-[11px] leading-tight">
                  Strike/Dip and exact LPM are strictly <strong>field-entered and instrument-derived</strong> (Brunton compass & flowmeter). Gemini Vision assists by auto-screening visual lithology, water clarity, and sanitary hazards.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitObservation} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Target Spring Orifice</label>
                <select
                  value={targetSpringId}
                  onChange={e => setTargetSpringId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                >
                  {(springs.length > 0 ? springs : offlineSyncManager.getCachedSprings()).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id}) — {s.village}, {s.district}
                    </option>
                  ))}
                </select>
              </div>

              {/* Smart Field Assistant - Gemini Vision Integration */}
              <div className="p-3 bg-slate-950 border border-cyan-500/40 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Smart Field Assistant (Gemini Vision)</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                    gemini-2.0-flash
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-dashed border-slate-700 hover:border-cyan-500/50 rounded cursor-pointer transition-colors text-slate-300 text-xs">
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Take / Upload Photograph</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleLoadSampleOutcrop}
                    disabled={analyzingPhoto}
                    className="px-2.5 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded text-[11px] font-semibold transition-colors shrink-0"
                  >
                    Sample Himalayan Outcrop
                  </button>
                </div>

                {analyzingPhoto && (
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-[11px] py-1">
                    <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                    <span>Gemini Vision extracting Lithology, Water Condition & Sanitary Risk...</span>
                  </div>
                )}

                {photoPreview && (
                  <div className="flex items-start gap-3 pt-1 border-t border-slate-800">
                    <img
                      src={photoPreview}
                      alt="Field Outcrop"
                      className="w-20 h-16 object-cover rounded border border-slate-700 shrink-0"
                    />

                    {aiVisionResult ? (
                      <div className="flex-1 space-y-2">
                        {/* 3 Auto-Filled Visual Indicators */}
                        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                          <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                            <span className="text-slate-500 block text-[9px] font-sans">1. LITHOLOGY</span>
                            <span className="font-semibold text-cyan-300 truncate block">
                              {aiVisionResult.lithology || 'Quartzite'}
                            </span>
                          </div>
                          <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                            <span className="text-slate-500 block text-[9px] font-sans">2. WATER COND.</span>
                            <span className="font-semibold text-emerald-300 truncate block">
                              {aiVisionResult.water_clarity || aiVisionResult.waterClarity || 'Clear'}
                            </span>
                          </div>
                          <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                            <span className="text-slate-500 block text-[9px] font-sans">3. SANITARY RISK</span>
                            <span className={`font-semibold truncate block ${
                              (aiVisionResult.sanitary_risk || sanitaryRisk) === 'Low' ? 'text-emerald-400' :
                              (aiVisionResult.sanitary_risk || sanitaryRisk) === 'High' ? 'text-red-400' : 'text-amber-400'
                            }`}>
                              {aiVisionResult.sanitary_risk || sanitaryRisk}
                            </span>
                          </div>
                        </div>

                        {/* Visual Flow & Confidence */}
                        <div className="flex flex-wrap items-center gap-2 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            Confidence: {((aiVisionResult.confidence ?? 0.78) * 100).toFixed(0)}%
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                            Flow Visible: {aiVisionResult.flow_visible ? 'True' : 'False'}
                          </span>
                          {aiVisionResult.estimated_flow && (
                            <span className="text-slate-400">
                              Visual screening: ~{aiVisionResult.estimated_flow} LPM
                            </span>
                          )}
                          <span className="text-emerald-400 ml-auto font-medium">✓ Field Form Auto-Filled</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 py-2">
                        Photo ready. Running Gemini Vision multimodal analysis...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 1: Instrument-Derived Measurements (Field Physical Data) */}
              <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
                    Instrument-Derived Measurements
                  </span>
                  <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded">
                    Field Physical Verification
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-0.5 text-[11px]">
                      Measured Flow (LPM) <span className="text-cyan-400 text-[10px]">*Bucket / Flowmeter</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={measuredDischarge}
                      onChange={e => setMeasuredDischarge(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-100 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-0.5 text-[11px]">
                      Bedding Strike & Dip <span className="text-cyan-400 text-[10px]">*Brunton Compass</span>
                    </label>
                    <input
                      type="text"
                      value={strikeDipMeasured}
                      onChange={e => setStrikeDipMeasured(e.target.value)}
                      placeholder="e.g. 130° Strike / 26° NE Dip"
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-100 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5 text-[11px]">GPS Accuracy (±m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={gpsAccuracy}
                    onChange={e => setGpsAccuracy(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-100 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Section 2: AI-Assisted Auto-Filled Form Fields */}
              <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
                    Visual Field Form (AI Auto-Filled)
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">
                    Gemini Vision Assisted
                  </span>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5 text-[11px]">
                    Lithology & Strata Notes <span className="text-emerald-400 text-[10px]">(Auto-Filled)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={geologyNotes}
                    onChange={e => setGeologyNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-100 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-0.5 text-[11px]">
                      Water Condition <span className="text-emerald-400 text-[10px]">(Auto-Filled)</span>
                    </label>
                    <select
                      value={waterCondition}
                      onChange={e => setWaterCondition(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-100 text-xs"
                    >
                      <option value="Clear">Clear</option>
                      <option value="Slightly Turbid">Slightly Turbid</option>
                      <option value="Turbid / Sediment-laden">Turbid / Sediment-laden</option>
                      <option value="Algal Tint / Organic Film">Algal Tint / Organic Film</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-0.5 text-[11px]">
                      Sanitary Hazard Risk <span className="text-emerald-400 text-[10px]">(Auto-Filled)</span>
                    </label>
                    <select
                      value={sanitaryRisk}
                      onChange={e => setSanitaryRisk(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-100 text-xs"
                    >
                      <option value="Low">Low Risk (Undisturbed / Vegetated)</option>
                      <option value="Medium">Medium Risk (Proximity to Grazing/Farming)</option>
                      <option value="High">High Risk (Settlement / Open Drainage)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs">
                    <input
                      type="checkbox"
                      checked={flowVisible}
                      onChange={e => setFlowVisible(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400"
                    />
                    <span>Active surface water discharge visible at outcrop</span>
                  </label>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5 text-[11px]">Intervention Status</label>
                  <input
                    type="text"
                    value={interventionStatus}
                    onChange={e => setInterventionStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-100 text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5 text-[11px]">Field Comments</label>
                  <textarea
                    rows={2}
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-100 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {submitting
                      ? 'Submitting...'
                      : isOnline
                      ? 'Submit Verification'
                      : 'Save Offline to Device'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
