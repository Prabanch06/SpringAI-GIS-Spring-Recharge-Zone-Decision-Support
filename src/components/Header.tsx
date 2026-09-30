import React from 'react';
import { UserProfile, UserRole } from '../types';
import { ShieldCheck, Plus, FileText, History } from 'lucide-react';

interface HeaderProps {
  user: UserProfile;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onSwitchRole: (role: UserRole) => void;
  onOpenRegister: () => void;
  onOpenAudit: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentTab,
  onSelectTab,
  onSwitchRole,
  onOpenRegister,
  onOpenAudit,
}) => {
  const roles: UserRole[] = [
    'Administrator',
    'Hydrogeologist',
    'GIS Analyst',
    'Field Officer',
    'Researcher',
    'Viewer'
  ];

  const navLinks = [
    { id: 'map', label: 'GIS Map' },
    { id: 'inventory', label: 'Springs' },
    { id: 'recharge', label: 'Recharge Zones' },
    { id: 'interventions', label: 'Interventions' },
    { id: 'validation', label: 'Field Validation' },
    { id: 'datasets', label: 'Datasets' },
    { id: 'terrain', label: 'DEM & Jobs' },
    { id: 'models', label: 'Model Registry' },
  ];

  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950 text-slate-100 z-30 select-none">
      {/* Zone 1: Single-element brand wordmark */}
      <div className="flex items-center gap-3">
        <a 
          href="#map" 
          onClick={(e) => { e.preventDefault(); onSelectTab('map'); }}
          className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors"
        >
          SpringAI-GIS
        </a>
        <span className="hidden sm:inline text-xs text-slate-500 font-mono">
          v2.4 · EPSG:4326
        </span>
      </div>

      {/* Zone 2: Clean text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
        {navLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => onSelectTab(link.id)}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentTab === link.id
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            {link.label}
          </button>
        ))}
      </nav>

      {/* Zone 3: Role Switcher & Primary Action */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenAudit}
          title="System Audit & Provenance Logs"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors"
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit</span>
        </button>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-slate-400 hidden sm:inline">Role:</span>
          <select
            value={user.role}
            onChange={(e) => onSwitchRole(e.target.value as UserRole)}
            className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            {roles.map((r) => (
              <option key={r} value={r} className="bg-slate-900 text-slate-100">
                {r}
              </option>
            ))}
          </select>
        </div>

        {user.role !== 'Viewer' && (
          <button
            onClick={onOpenRegister}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors whitespace-nowrap shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Spring</span>
          </button>
        )}
      </div>
    </header>
  );
};
