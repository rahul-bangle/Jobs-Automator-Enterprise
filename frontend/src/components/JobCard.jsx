import React from 'react';
import { MapPin, DollarSign, Building2, ExternalLink, Sparkles, Send, Globe, Zap } from 'lucide-react';

const JobCard = ({ job, onOptimize, onApply, onGrowth }) => {
  const {
    job_title,
    company_name,
    location,
    salary_extracted, 
    source_url, 
    site, 
    ats_score, 
    relevance_score,
    match_score 
  } = job;

  const getSourceIcon = (siteName) => {
    const s = siteName?.toLowerCase() || '';
    if (s.includes('linkedin')) return <span className="text-blue-500 font-bold">in</span>;
    if (s.includes('indeed')) return <span className="text-blue-600 font-bold">i</span>;
    if (s.includes('glassdoor')) return <span className="text-green-500 font-bold">g</span>;
    return <Globe size={14} className="text-slate-400" />;
  };

  const score = relevance_score || ats_score;
  const getScoreColor = (s) => {
    if (s >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (s >= 60) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  return (
    <div className="no-line-card group p-8 h-full flex flex-col justify-between relative bg-white overflow-hidden hover:shadow-2xl hover:shadow-blue-900/10 active:scale-[0.99] transition-all">
      {/* Active Selection Indicator */}
      <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[var(--primary)] rounded-r-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />

      {score > 0 && (
        <div className="absolute top-6 right-6">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="var(--surface-container-high)"
                strokeWidth="4"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="url(#matchGradient)"
                strokeWidth="4"
                strokeDasharray="175.9"
                strokeDashoffset={175.9 - (175.9 * score) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="matchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--tertiary)" />
                  <stop offset="100%" stopColor="var(--tertiary-container)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-black leading-none">{score}</span>
              <span className="text-[6px] font-black uppercase tracking-tighter opacity-40">Match</span>
            </div>
          </div>
        </div>
      )}
      <div>
        <div className="flex justify-between items-start mb-6 pr-20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--surface-container-low)] flex items-center justify-center text-[var(--primary)] font-black text-xl shadow-inner">
              {company_name?.charAt(0) || <Building2 size={24} />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[var(--on-background)] font-black group-hover:text-[var(--primary)] transition-colors text-xl line-clamp-2 leading-tight mb-1" title={job_title}>
                {job_title}
              </h3>
              <p className="text-[var(--secondary)] text-sm font-bold truncate opacity-60 uppercase tracking-widest">{company_name}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <div className="flex items-center gap-2 bg-[var(--surface-container-low)] p-2 px-4 rounded-xl w-fit">
            <MapPin size={14} className="text-[var(--secondary)] opacity-40" />
            <span className="text-[10px] text-[var(--on-background)] font-black uppercase tracking-widest">{location}</span>
          </div>
          <div className="flex items-center gap-2 bg-[var(--tertiary)]/5 p-2 px-4 rounded-xl w-fit border border-[var(--tertiary)]/10">
            <DollarSign size={14} className="text-[var(--tertiary)]" />
            <span className="text-[10px] text-[var(--tertiary)] font-black uppercase tracking-widest">{salary_extracted || 'Salary TBD'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between py-4 border-t border-[var(--outline-variant)]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 px-3 rounded-lg bg-[var(--surface-container-high)] flex items-center gap-2">
              {getSourceIcon(site)}
              <span className="text-[8px] text-[var(--secondary)] font-black uppercase tracking-widest">{site || 'Direct'}</span>
            </div>
          </div>
          
          <a 
            href={source_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[var(--primary)] font-black text-[10px] uppercase tracking-widest hover:underline"
          >
            Site Intel <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <div className="space-y-3 pt-6 border-t border-[var(--outline-variant)]">
        <div className="flex gap-3">
          <button 
            onClick={() => onOptimize?.(job.id)}
            className="flex-1 py-4 rounded-2xl bg-[var(--surface-container-low)] text-[var(--on-background)] font-black text-[10px] uppercase tracking-widest hover:bg-[var(--surface-container-high)] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={14} />
            Analyze
          </button>
          <button 
            onClick={() => onApply?.(job.id)}
            className="flex-1 py-4 rounded-2xl bg-[var(--primary)] text-white font-black text-[10px] uppercase tracking-widest hover:bg-[var(--primary-container)] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[var(--primary)]/20"
          >
            <Send size={14} />
            Deploy
          </button>
        </div>
        
        <button 
          onClick={() => onGrowth?.(job.id)}
          className="w-full py-3 rounded-2xl bg-[var(--tertiary)]/5 text-[var(--tertiary)] font-black text-[9px] uppercase tracking-[0.2em] hover:bg-[var(--tertiary)]/10 transition-all flex items-center justify-center gap-2"
        >
          <Zap size={12} />
          Unlock Growth Phase
        </button>
      </div>
    </div>
  );
};

export default JobCard;
