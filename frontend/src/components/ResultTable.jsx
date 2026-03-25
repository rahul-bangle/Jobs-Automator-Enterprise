import React from 'react';
import { FixedSizeList as List } from 'react-window';
import JobCard from './JobCard';

const ResultTable = ({ data = [], onOptimize, onApply }) => {
  const Row = ({ index, style }) => {
    const job = data[index];
    if (!job) return null;

    return (
      <div style={style} className="px-4 pb-4">
        <JobCard 
          job={job} 
          onOptimize={onOptimize}
          onApply={onApply}
        />
      </div>
    );
  };

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col bg-deep-bg rounded-3xl overflow-hidden">
      <div className="flex-grow">
        <List
          height={600}
          itemCount={data.length}
          itemSize={340} // Consistent with JobCard height
          width="100%"
          className="no-scrollbar"
        >
          {Row}
        </List>
      </div>

      <div className="px-8 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-bold">
        <div className="flex gap-6">
          <span>Total Discovery: {data.length}</span>
          <span className="text-pro-blue">Processed: {data.filter(j => j.status === 'applied').length}</span>
        </div>
        <div className="italic">Pro Max Premium Infrastructure</div>
      </div>
    </div>
  );
};

export default ResultTable;
