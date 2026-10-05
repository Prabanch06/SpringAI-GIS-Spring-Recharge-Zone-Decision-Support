import React from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { Radio, X, CheckCircle2, MapPin, Activity, Bell } from 'lucide-react';

export const RealtimeToastStack: React.FC = () => {
  const { notifications, dismissNotification } = useRealtime();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => {
        let Icon = Bell;
        let colorClass = 'text-cyan-400 border-cyan-500/30 bg-slate-900/90';

        if (n.type === 'job') {
          Icon = CheckCircle2;
          colorClass = 'text-emerald-400 border-emerald-500/30 bg-slate-900/90';
        } else if (n.type === 'field') {
          Icon = MapPin;
          colorClass = 'text-amber-400 border-amber-500/30 bg-slate-900/90';
        } else if (n.type === 'spring') {
          Icon = Activity;
          colorClass = 'text-cyan-400 border-cyan-500/30 bg-slate-900/90';
        }

        return (
          <div
            key={n.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 ${colorClass}`}
          >
            <div className="p-1 rounded-md bg-slate-800/80 shrink-0">
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-slate-100 truncate">{n.title}</span>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">{n.timestamp}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-2">
                {n.message}
              </p>
            </div>

            <button
              onClick={() => dismissNotification(n.id)}
              className="text-slate-400 hover:text-slate-200 p-0.5 rounded shrink-0 transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
