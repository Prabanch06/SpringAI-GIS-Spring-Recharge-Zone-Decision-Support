import React, { useState } from 'react';
import { SpringEntity } from '../types';
import { api } from '../services/api';
import { Mountain, MapPin, Droplets, Compass } from 'lucide-react';

interface SpringRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpringCreated: (spring: SpringEntity) => void;
}

export const SpringRegistrationModal: React.FC<SpringRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSpringCreated
}) => {
  const [name, setName] = useState('');
  const [state, setState] = useState('Uttarakhand');
  const [district, setDistrict] = useState('Nainital');
  const [village, setVillage] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [elevation, setElevation] = useState('1650');
  const [springType, setSpringType] = useState<'Fracture' | 'Depression' | 'Contact' | 'Fault-controlled' | 'Karst'>('Fracture');
  const [geologicalFormation, setGeologicalFormation] = useState('Krol Formation (Fractured Dolomite/Limestone)');
  const [aquiferType, setAquiferType] = useState('Unconfined Fractured Bedrock');
  const [strike, setStrike] = useState('130');
  const [dip, setDip] = useState('28');
  const [dipDirection, setDipDirection] = useState('NE');
  const [averageDischarge, setAverageDischarge] = useState('15.0');
  const [minDischarge, setMinDischarge] = useState('4.0');
  const [maxDischarge, setMaxDischarge] = useState('36.0');
  const [seasonality, setSeasonality] = useState<'Perennial' | 'Seasonal' | 'Ephemeral'>('Perennial');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setErrorMsg('Invalid latitude. Must be between -90 and 90 degrees.');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setErrorMsg('Invalid longitude. Must be between -180 and 180 degrees.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createSpring({
        name,
        state,
        district,
        village,
        latitude: lat,
        longitude: lng,
        elevation: parseFloat(elevation),
        springType,
        geologicalFormation,
        aquiferType,
        strike: parseFloat(strike),
        dip: parseFloat(dip),
        dipDirection,
        averageDischarge: parseFloat(averageDischarge),
        minDischarge: parseFloat(minDischarge),
        maxDischarge: parseFloat(maxDischarge),
        seasonality,
        status: 'Active'
      });

      if (res.success && res.data) {
        onSpringCreated(res.data);
        onClose();
      } else {
        setErrorMsg('Failed to register spring.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with GIS server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full p-6 text-xs text-slate-200 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white">Register Hydrogeological Spring</h2>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Standard Geodetic Registration · EPSG:4326 WGS84
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">✕</button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Information */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-200 border-b border-slate-800/80 pb-1">
              General Identity & Administrative Location
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Spring Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhara Churna Spring"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Village / Ward *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bhowali Upper"
                  value={village}
                  onChange={e => setVillage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">District *</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Geospatial Coordinates */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-200 border-b border-slate-800/80 pb-1">
              Geospatial Coordinates & Elevation (EPSG:4326)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Latitude (°N) *</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  placeholder="29.3645"
                  value={latitude}
                  onChange={e => setLatitude(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Longitude (°E) *</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  placeholder="79.5421"
                  value={longitude}
                  onChange={e => setLongitude(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Elevation (m MSL) *</label>
                <input
                  type="number"
                  required
                  placeholder="1650"
                  value={elevation}
                  onChange={e => setElevation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Geological Setting */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-200 border-b border-slate-800/80 pb-1">
              Hydrogeological & Structural Stratigraphy
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Spring Type</label>
                <select
                  value={springType}
                  onChange={e => setSpringType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                >
                  <option value="Fracture">Fracture / Joint Spring</option>
                  <option value="Contact">Lithological Contact Spring</option>
                  <option value="Karst">Karst / Solution Cavity Spring</option>
                  <option value="Depression">Depression Spring</option>
                  <option value="Fault-controlled">Fault-controlled Spring</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Aquifer Type</label>
                <input
                  type="text"
                  value={aquiferType}
                  onChange={e => setAquiferType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Geological Formation</label>
              <input
                type="text"
                value={geologicalFormation}
                onChange={e => setGeologicalFormation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Strike Azimuth (°)</label>
                <input
                  type="number"
                  min="0"
                  max="360"
                  value={strike}
                  onChange={e => setStrike(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Dip Angle (°)</label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={dip}
                  onChange={e => setDip(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Dip Direction</label>
                <input
                  type="text"
                  value={dipDirection}
                  onChange={e => setDipDirection(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Discharge Dynamics */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-200 border-b border-slate-800/80 pb-1">
              Discharge Dynamics & Seasonality
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Average Flow (LPM)</label>
                <input
                  type="number"
                  step="0.1"
                  value={averageDischarge}
                  onChange={e => setAverageDischarge(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Lean Flow (LPM)</label>
                <input
                  type="number"
                  step="0.1"
                  value={minDischarge}
                  onChange={e => setMinDischarge(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Monsoon Flow (LPM)</label>
                <input
                  type="number"
                  step="0.1"
                  value={maxDischarge}
                  onChange={e => setMaxDischarge(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Seasonality</label>
                <select
                  value={seasonality}
                  onChange={e => setSeasonality(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                >
                  <option value="Perennial">Perennial</option>
                  <option value="Seasonal">Seasonal</option>
                  <option value="Ephemeral">Ephemeral</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded transition-colors shadow"
            >
              {isSubmitting ? 'Registering Spring...' : 'Save & Register Spring'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
