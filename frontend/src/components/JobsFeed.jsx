import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { Sparkles, Rocket, CheckSquare, Square } from 'lucide-react';
import JobCard from './JobCard';

const Row = ({ index, style, data }) => {
  const { jobs, selectedIds, onToggleSelect, onOptimize, onApply, onGrowth } = data;
  const itemsPerRow = 3;
  const startIndex = index * itemsPerRow;
  const rowJobs = jobs.slice(startIndex, startIndex + itemsPerRow);

  return (
    <div style={style} className="flex gap-6 px-4 pb-6">
      {rowJobs.map((job) => (
        <div key={job.id} className="flex-1 relative group min-w-0">
          {/* Selection Overlay */}
          <button 
            onClick={() => onToggleSelect(job.id)}
            className={`absolute top-4 left-4 z-20 p-2 rounded-xl border transition-all duration-300 ${
              selectedIds.includes(job.id) 
              ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-lg' 
              : 'bg-white/80 backdrop-blur-md border-[var(--outline-variant)] text-[var(--secondary)] opacity-10 group-hover:opacity-100 hover:text-[var(--primary)]'
            }`}
          >
            {selectedIds.includes(job.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </button>

          <JobCard 
            job={job} 
            onOptimize={() => onOptimize(job)}
            onApply={() => onApply(job)}
            onGrowth={() => onGrowth(job)}
          />
        </div>
      ))}
      {/* Fillers for empty slots in the last row */}
      {rowJobs.length < itemsPerRow && Array(itemsPerRow - rowJobs.length).fill(0).map((_, i) => (
        <div key={`filler-${i}`} className="flex-1" />
      ))}
    </div>
  );
};

export default function JobsFeed({ jobs, loading, selectedIds = [], onToggleSelect, onBatchApply, onOptimize, onApply, onGrowth }) {
  if (!loading && jobs.length === 0) {
    return (
      <div className="py-24 text-center space-y-6 rounded-[3rem] bg-[var(--surface-container-low)] border-none">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
          <Sparkles className="w-10 h-10 text-[var(--primary)]/20" />
        </div>
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-black tracking-tight text-[var(--on-background)]">Global Tech Discovery</h2>
          <p className="text-[var(--secondary)] text-xs mt-2 leading-relaxed font-bold uppercase tracking-widest opacity-40">
            Awaiting high-fidelity role synthesis...
          </p>
        </div>
      </div>
    );
  }

  const itemsPerRow = 3;
  const rowCount = Math.ceil(jobs.length / itemsPerRow);

  return (
    <div className="relative h-[800px]">
      {/* Batch Floating Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-[var(--on-background)] text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-8 border border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Selection Matrix</span>
            <span className="bg-[var(--primary)] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic">{selectedIds.length} Roles Active</span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <button 
            onClick={onBatchApply}
            className="flex items-center gap-2 group hover:scale-105 transition-transform"
          >
            <Rocket className="w-4 h-4 text-[var(--tertiary)] group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-black uppercase tracking-[0.1em]">Launch Autonomous Deployment</span>
          </button>
        </div>
      )}

      <List
        height={800}
        itemCount={rowCount}
        itemSize={480} // Approx JobCard + Gap height
        width="100%"
        className="no-scrollbar"
        itemData={{
          jobs,
          selectedIds,
          onToggleSelect,
          onOptimize,
          onApply,
          onGrowth
        }}
      >
        {Row}
      </List>
    </div>
  );
}
