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
              ? 'bg-pro-blue border-pro-blue text-white shadow-lg' 
              : 'bg-white/80 backdrop-blur-md border-slate-200 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-pro-blue'
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
      <div className="py-24 text-center space-y-6 rounded-[3rem] border-2 border-dashed border-slate-200/50 bg-white/20">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100">
          <Sparkles className="w-10 h-10 text-pro-blue/50" />
        </div>
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Premium Hyderabad Discovery</h2>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed font-medium">
            Aggregating high-fidelity roles from Hitech City, Gachibowli, and Madhapur. 
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
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-8 border border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-widest opacity-60">Selection</span>
            <span className="bg-pro-blue px-3 py-1 rounded-full text-xs font-black italic">{selectedIds.length} Jobs</span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <button 
            onClick={onBatchApply}
            className="flex items-center gap-2 group"
          >
            <Rocket className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span className="text-sm font-black uppercase tracking-tighter">Launch Batch Pipeline</span>
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
