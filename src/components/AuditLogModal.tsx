import React, { useEffect, useState } from 'react';
import { AuditLogItem } from '../types';
import { api } from '../services/api';
import { History, ShieldCheck, Database, Calendar } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getAuditLogs().then(res => {
        if (res.success) setLogs(res.data);
      }).catch(err => console.error('Failed to load audit logs:', err))
      .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-3xl w-full p-6 text-xs text-slate-200 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">System Audit & Provenance Trail</h2>
              <div className="text-[11px] text-slate-400">
                Immutable chronological log of all predictions, validations, and administrative actions
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading audit trail...</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 font-semibold">{log.action}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-300 font-medium">{log.entity}</span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <p className="text-slate-300 text-xs">
                  {log.details}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-800/50">
                  <span>User: <strong className="text-slate-400">{log.user}</strong> ({log.role})</span>
                  <span>Model: <strong className="text-cyan-400">{log.modelVersion}</strong></span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
