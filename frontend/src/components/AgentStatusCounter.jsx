import React from 'react';
import { Shield, Brain, Send, Loader2, Layers } from 'lucide-react';

export default function AgentStatusCounter({ activeAgents = [], batchProgress = null }) {
  const agents = [
    { id: 'analyst', name: 'Analyst', icon: Brain, color: 'text-purple-500' },
    { id: 'tailor', name: 'Tailor', icon: Shield, color: 'text-pro-blue' },
    { id: 'closer', name: 'Closer', icon: Send, color: 'text-emerald-500' }
  ];

  const hasBatch = batchProgress !== null;

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
      {/* Batch Progress Bubble */}
      {hasBatch && (
        <div className="flex items-center gap-4 p-4 rounded-3xl border border-slate-200 bg-slate-900 text-white shadow-2xl animate-in slide-in-from-right-8">
          <div className="p-3 bg-white/10 rounded-2xl">
            <Layers className="w-5 h-5 text-pro-blue" />
          </div>
          <div className="pr-4 min-w-[120px]">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Batch Pipeline</p>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-black italic">{batchProgress.current} / {batchProgress.total}</span>
              <div className="flex-1 h-1 w-20 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-pro-blue transition-all duration-500" 
                  style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {agents.map((agent) => {
        const isActive = activeAgents.includes(agent.id);
        return (
          <div 
            key={agent.id}
            className={`flex items-center gap-3 p-3 rounded-2xl border bg-white/90 backdrop-blur-xl shadow-lg transition-all duration-500 ${
              isActive ? 'translate-x-0 opacity-100 border-pro-blue/20' : 'translate-x-full opacity-0 pointer-events-none border-slate-100'
            }`}
          >
            <div className={`p-2 rounded-xl bg-slate-50 ${agent.color}`}>
              <agent.icon className="w-4 h-4" />
            </div>
            <div className="pr-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{agent.name}</p>
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-pro-blue" />
                <span className="text-xs font-bold text-slate-700">Orchestrating...</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
