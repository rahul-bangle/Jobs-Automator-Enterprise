import React from 'react';
import { Shield, Brain, Send, Loader2, Layers } from 'lucide-react';

export default function AgentStatusCounter({ activeAgents = [], batchProgress = null }) {
  const agents = [
    { id: 'analyst', name: 'Analyst', icon: Brain, color: 'text-[var(--tertiary)]' },
    { id: 'tailor', name: 'Tailor', icon: Shield, color: 'text-[var(--primary)]' },
    { id: 'closer', name: 'Closer', icon: Send, color: 'text-[var(--secondary)]' }
  ];

  const hasBatch = batchProgress !== null;

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
      {/* Batch Progress Bubble */}
      {hasBatch && (
        <div className="flex items-center gap-4 p-4 rounded-3xl bg-[var(--on-background)] text-white shadow-2xl animate-in slide-in-from-right-8 border border-white/10">
          <div className="p-3 bg-white/10 rounded-2xl">
            <Layers className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div className="pr-4 min-w-[120px]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Batch Progress</p>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-black italic">{batchProgress.current} / {batchProgress.total}</span>
              <div className="flex-1 h-1 w-20 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--primary)] transition-all duration-500" 
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
            className={`flex items-center gap-3 p-3 rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl transition-all duration-500 border border-[var(--outline-variant)] ${
              isActive ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
            }`}
          >
            <div className={`p-2.5 rounded-xl bg-[var(--surface-container-low)] ${agent.color}`}>
              <agent.icon className="w-4 h-4" />
            </div>
            <div className="pr-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--secondary)] opacity-40">{agent.name}</p>
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-[var(--primary)] text-xs" />
                <span className="text-[10px] font-black uppercase tracking-tighter text-[var(--on-background)]">Synthesis in Progress...</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
