import React, { useState } from 'react';
import { SpringEntity } from '../types';
import { Search, Filter, Mountain, Droplets, ChevronRight } from 'lucide-react';

interface SpringsListProps {
  springs: SpringEntity[];
  selectedSpring: SpringEntity | null;
  onSelectSpring: (spring: SpringEntity) => void;
  onSelectTab: (tab: string) => void;
}

export const SpringsList: React.FC<SpringsListProps> = ({
  springs,
  selectedSpring,
  onSelectSpring,
  onSelectTab
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredSprings = springs.filter(s => {
    const matchesSearch =
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.geologicalFormation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.district.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || s.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === 'ALL' || s.springType.toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-100">
      {/* Search and Filters */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-white">
            Spring Inventory ({filteredSprings.length})
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">
            Total {springs.length} registered
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by ID, name, village, formation..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Drying">Drying</option>
              <option value="Critical">Critical</option>
              <option value="Revived">Revived</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="Fracture">Fracture</option>
              <option value="Contact">Contact</option>
              <option value="Karst">Karst</option>
              <option value="Depression">Depression</option>
            </select>
          </div>
        </div>
      </div>

      {/* Spring List Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {filteredSprings.map(spring => {
          const isSelected = selectedSpring?.id === spring.id;

          let statusColor = 'text-cyan-400';
          if (spring.status === 'Critical') statusColor = 'text-red-400 font-semibold';
          else if (spring.status === 'Drying') statusColor = 'text-amber-400';
          else if (spring.status === 'Revived') statusColor = 'text-emerald-400';

          return (
            <div
              key={spring.id}
              onClick={() => onSelectSpring(spring)}
              className={`p-3.5 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-slate-800/80 border-l-2 border-cyan-400'
                  : 'hover:bg-slate-850 hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono text-cyan-400 font-semibold">{spring.id}</span>
                <span className="text-[10px] font-mono text-amber-400/90 bg-slate-950 px-1.5 py-0.5 rounded border border-amber-500/30">
                  {spring.datasetCategory || 'DEMO / SYNTHETIC DATA'}
                </span>
              </div>

              <div className="text-xs font-semibold text-slate-100 leading-snug line-clamp-1 mb-1">
                {spring.name}
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between mb-2">
                <span>{spring.village} · {spring.district}</span>
                <span>{spring.springType}</span>
              </div>

              <div className="grid grid-cols-3 gap-1 text-[11px] font-mono text-slate-300 bg-slate-950/40 p-1.5 rounded border border-slate-800/60">
                <div>
                  <span className="text-[9px] text-slate-500 block font-sans">FLOW</span>
                  <span className="tabular-nums font-semibold">{spring.averageDischarge} <span className="text-[9px] text-slate-500">LPM</span></span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block font-sans">ELEV</span>
                  <span className="tabular-nums font-semibold">{spring.elevation} <span className="text-[9px] text-slate-500">m</span></span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block font-sans">PRIORITY</span>
                  <span className="tabular-nums font-semibold text-amber-400">
                    {(spring.priorityScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredSprings.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            No springs matched the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};
