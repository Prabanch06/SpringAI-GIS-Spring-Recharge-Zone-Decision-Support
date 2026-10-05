import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { ShieldCheck, Plus, History, Radio, Users, ChevronDown, Sparkles } from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext';

interface HeaderProps {
  user: UserProfile;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onSwitchRole: (role: UserRole) => void;
  onOpenRegister: () => void;
  onOpenAudit: () => void;
  onOpenCopilot: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentTab,
  onSelectTab,
  onSwitchRole,
  onOpenRegister,
  onOpenAudit,
  onOpenCopilot,
}) => {
  const { isConnected, onlineCount, onlineUsers } = useRealtime();
  const [showUsersDropdown, setShowUsersDropdown] = useState(false);

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
    <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-950 text-slate-100 z-30 select-none">
      {/* Zone 1: Single-element brand wordmark & Realtime Status */}
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

        {/* Real-time Status Badge with dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUsersDropdown(!showUsersDropdown)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
              isConnected
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-amber-950/80 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
            }`}
            title={isConnected ? 'Real-time WebSocket & Redis sync operational' : 'Connecting to real-time gateway...'}
          >
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            </span>
            <span className="hidden sm:inline">{isConnected ? 'Live' : 'Connecting'}</span>
            <span className="text-[10px] opacity-80 flex items-center gap-0.5">
              <Users className="w-2.5 h-2.5 ml-0.5" />
              {onlineCount}
            </span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {showUsersDropdown && (
            <div 
              className="absolute left-0 mt-2 w-72 bg-slate-900/95 border border-slate-700/80 rounded-lg shadow-2xl p-3 z-50 backdrop-blur-md"
              onMouseLeave={() => setShowUsersDropdown(false)}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-semibold text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Active Live Sessions ({onlineCount})</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Sync Active</span>
              </div>

              <div className="mt-2 space-y-2 max-h-56 overflow-y-auto text-xs">
                {onlineUsers.length > 0 ? (
                  onlineUsers.map((u, i) => (
                    <div key={u.socketId || i} className="flex items-start justify-between bg-slate-950/60 p-2 rounded border border-slate-800/80">
                      <div>
                        <div className="font-medium text-slate-200">{u.user.name}</div>
                        <div className="text-[10px] text-cyan-400 font-mono">{u.user.role}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded capitalize">
                        {u.currentTab}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-center py-2 text-xs">
                    You are connected to the live session bus.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
          onClick={onOpenCopilot}
          title="Open AI Geo-Copilot (GenAI Natural Language Query)"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900/90 border border-cyan-500/40 rounded transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Geo-Copilot</span>
        </button>

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
