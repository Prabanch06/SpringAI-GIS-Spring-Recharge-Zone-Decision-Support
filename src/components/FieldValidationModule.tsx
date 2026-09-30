import React, { useState, useEffect } from 'react';
import { SpringEntity, FieldObservation, UserProfile } from '../types';
import { api } from '../services/api';
import { Camera, MapPin, CheckCircle, XCircle, Clock, Send, ShieldCheck } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // New observation state
  const [targetSpringId, setTargetSpringId] = useState(springs[0]?.id || '');
  const [measuredDischarge, setMeasuredDischarge] = useState('12.5');
  const [gpsAccuracy, setGpsAccuracy] = useState('2.1');
  const [geologyNotes, setGeologyNotes] = useState('Bedding strike measured at 135°, clear joint trace seepage.');
  const [waterCondition, setWaterCondition] = useState('Clear and potable');
  const [interventionStatus, setInterventionStatus] = useState('No obstruction, vegetative fence intact.');
  const [comments, setComments] = useState('Observed stable baseflow; community requested additional contour trench on upper terrace.');
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const fetchObservations = async () => {
    try {
      setLoading(true);
      const res = await api.getFieldValidations();
      if (res.success) {
        setObservations(res.data);
      }
    } catch (err) {
      console.error('Failed to load observations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObservations();
  }, []);

  const handleSubmitObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSpringId) return;

    setSubmitting(true);
    try {
      const res = await api.submitFieldValidation({
        springId: targetSpringId,
        discharge: parseFloat(measuredDischarge),
        gpsAccuracyM: parseFloat(gpsAccuracy),
        geologyNotes,
        waterCondition,
        interventionStatus,
        comments
      });

      if (res.success) {
        setShowSubmitModal(false);
        fetchObservations();
        onRefreshAllSprings();
      }
    } catch (err) {
      console.error('Failed to submit validation:', err);
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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>GROUND-TRUTHING WORKFLOW</span>
            <span>·</span>
            <span>DATA PROVENANCE & CALIBRATION</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Field Validation & Observation Registry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Scientific state machine: Field Observation → Technical Hydrogeological Review → Model Retraining Pool.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded transition-colors"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>New Field Observation</span>
        </button>
      </div>

      {/* Workflow Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded p-4 text-xs">
        <div className="font-semibold text-slate-200 mb-2">Scientific Validation Protocol</div>
        <div className="flex items-center justify-between text-slate-400 font-mono text-[11px] overflow-x-auto gap-4">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center font-bold">1</span>
            <span>AI Probable Prediction</span>
          </div>
          <span>→</span>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-5 h-5 rounded-full bg-amber-950 border border-amber-500 flex items-center justify-center font-bold">2</span>
            <span>Field GPS Survey</span>
          </div>
          <span>→</span>
          <div className="flex items-center gap-1.5 text-purple-400">
            <span className="w-5 h-5 rounded-full bg-purple-950 border border-purple-500 flex items-center justify-center font-bold">3</span>
            <span>Hydrogeologist Review</span>
          </div>
          <span>→</span>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center font-bold">4</span>
            <span>Approved Training Pool</span>
          </div>
        </div>
      </div>

      {/* Field Observations Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            Submitted Field Observations ({observations.length})
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
                        className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded text-xs transition-colors"
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

      {/* Modal for Submitting New Field Observation */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-5 space-y-4 text-xs text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-white">Record Mobile Field Verification</h2>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitObservation} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Target Spring</label>
                <select
                  value={targetSpringId}
                  onChange={e => setTargetSpringId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                >
                  {springs.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.id} — {s.name} ({s.village})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Measured Flow (LPM)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={measuredDischarge}
                    onChange={e => setMeasuredDischarge(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">GPS Accuracy (±m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={gpsAccuracy}
                    onChange={e => setGpsAccuracy(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Geological & Strata Observations</label>
                <textarea
                  rows={2}
                  value={geologyNotes}
                  onChange={e => setGeologyNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Water Condition</label>
                  <input
                    type="text"
                    value={waterCondition}
                    onChange={e => setWaterCondition(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Intervention Status</label>
                  <input
                    type="text"
                    value={interventionStatus}
                    onChange={e => setInterventionStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Field Comments</label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 text-xs"
                />
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
                  <span>{submitting ? 'Submitting...' : 'Submit Verification'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
