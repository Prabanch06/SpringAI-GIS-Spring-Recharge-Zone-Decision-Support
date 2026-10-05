import React, { useState } from 'react';
import { SpringEntity } from '../types';
import { api } from '../services/api';
import {
  Sparkles,
  X,
  Send,
  MapPin,
  Compass,
  Layers,
  ArrowRight,
  ShieldAlert,
  Droplets,
  HelpCircle,
  Cpu,
  Bot
} from 'lucide-react';

interface GeoCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  springs: SpringEntity[];
  onSelectSpring: (spring: SpringEntity) => void;
  onSelectTab: (tab: string) => void;
}

interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  matchedSprings?: SpringEntity[];
  suggestedInterventions?: string[];
  suggestedFollowUp?: string[];
  engine?: string;
  timestamp: string;
}

export const GeoCopilotModal: React.FC<GeoCopilotModalProps> = ({
  isOpen,
  onClose,
  springs,
  onSelectSpring,
  onSelectTab
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your SpringAI Geo-Copilot. You can ask me natural questions about mountain springshed revival, critical drying springs, geological strata, or recharge interventions in the Himalayas.',
      suggestedFollowUp: [
        'Critical drying springs in Almora',
        'Springs with discharge below 5 LPM',
        'Sites requiring gabion check dams',
        'Highest recharge suitability (> 0.85)'
      ],
      engine: 'gemini-2.0-flash',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || query).trim();
    if (!q || loading) return;

    const userMsg: CopilotMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.queryGeoCopilot(q, { springsCount: springs.length });
      if (res.success && res.data) {
        const matched = springs.filter(s => res.data.matchedSpringIds.includes(s.id));

        const aiMsg: CopilotMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: res.data.answer,
          matchedSprings: matched,
          suggestedInterventions: res.data.suggestedInterventions,
          suggestedFollowUp: res.data.suggestedFollowUp,
          engine: res.data.engine,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err: any) {
      const errorMsg: CopilotMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Error processing query: ${err.message}. Please try a different question or select a preset prompt below.`,
        suggestedFollowUp: ['Critical drying springs in Almora', 'Springs with discharge below 5 LPM'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSpringCard = (spring: SpringEntity) => {
    onSelectSpring(spring);
    onSelectTab('map');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col h-[640px] max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Copilot Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-blue-500/30 border border-cyan-500/40 text-cyan-300">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm tracking-tight">SpringAI Geo-Copilot</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  GenAI Powered
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Natural Language to GIS Querying & Hydrogeological Decision Support
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-xl p-3.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-cyan-600 text-slate-950 font-medium'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 shadow-md'
                }`}
              >
                {/* Engine Badge for Assistant */}
                {msg.sender === 'assistant' && (
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800/80 text-[10px] font-mono text-cyan-400">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>{msg.engine && (msg.engine.includes('gemini') || msg.engine.includes('flash')) ? `Google Gemini (${msg.engine})` : 'Spatial Hydrogeological Engine'}</span>
                    </span>
                    <span className="text-slate-500">{msg.timestamp}</span>
                  </div>
                )}

                <p className="whitespace-pre-line">{msg.text}</p>

                {/* Matched Springs Cards */}
                {msg.matchedSprings && msg.matchedSprings.length > 0 && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-semibold text-slate-300 block">
                      Matching Springs Inventory ({msg.matchedSprings.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.matchedSprings.map(s => (
                        <div
                          key={s.id}
                          onClick={() => handleSelectSpringCard(s)}
                          className="p-2.5 rounded bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-cyan-500/50 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-cyan-400 group-hover:text-cyan-300 font-mono">{s.id}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                              s.status === 'Critical' ? 'bg-red-950 text-red-400' : 'bg-amber-950 text-amber-400'
                            }`}>
                              {s.status}
                            </span>
                          </div>
                          <div className="font-semibold text-white text-xs mt-0.5 truncate">{s.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {s.village}, {s.district} · {s.averageDischarge} LPM
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-cyan-400">
                            <span>Suitability: {(s.rechargeSuitability * 100).toFixed(0)}%</span>
                            <span className="flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                              Map <ArrowRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Interventions */}
                {msg.suggestedInterventions && msg.suggestedInterventions.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block mb-1">
                      Recommended Civil Recharge Structures:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedInterventions.map((intv, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 text-slate-300"
                        >
                          {intv}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Follow-up Prompts */}
              {msg.suggestedFollowUp && msg.suggestedFollowUp.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[88%]">
                  {msg.suggestedFollowUp.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(chip)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-cyan-300 hover:text-white transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 w-fit">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Analyzing hydrogeological data across mountain basins...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask anything: 'Find critical springs in Almora with low flow'..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
