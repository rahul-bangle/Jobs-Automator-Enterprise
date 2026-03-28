import React from 'react';
import { X, BookOpen, Rocket, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

const GrowthHubModal = ({ isOpen, onClose, growthData, jobTitle }) => {
  if (!isOpen) return null;

  const { learnings = [], projects = [], skill_gaps = [] } = growthData || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white border border-[var(--outline-variant)] rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-10 border-b border-[var(--outline-variant)] flex justify-between items-start bg-[var(--surface-container-low)]/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[var(--primary)] text-white">
                <Zap size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">Growth Matrix</span>
            </div>
            <h2 className="text-4xl font-black text-[var(--on-background)] tracking-tighter leading-tight">
              Bridge the Gap: <span className="text-[var(--primary)]">{jobTitle}</span>
            </h2>
            <p className="mt-3 text-[var(--secondary)] font-bold uppercase tracking-widest text-[8px] opacity-40">Autonomous Skill Synthesis & Roadmap</p>
          </div>
          <button 
            onClick={onClose}
            className="p-4 rounded-2xl hover:bg-[var(--surface-container-high)] text-[var(--secondary)] transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          
          <section>
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="text-[var(--tertiary)]" size={24} />
              <h3 className="text-xl font-black tracking-tight">Identified Synthesis Gaps</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(skill_gaps.length > 0 ? skill_gaps : ['No significant gaps found! Keep going.']).map((gap, i) => (
                <div key={i} className="px-5 py-2.5 rounded-xl bg-[var(--surface-container-low)] text-[var(--on-background)] text-xs font-black uppercase tracking-widest border border-[var(--outline-variant)]">
                  {gap}
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Learning Roadmap */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="text-amber-500" size={24} />
              <h3 className="text-xl font-bold text-slate-900">High-Priority Learnings</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {learnings.map((item, i) => (
                <div key={i} className="group p-5 rounded-2xl border border-slate-200 bg-white hover:border-amber-300 hover:shadow-lg transition-all cursor-default">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3">
                    {i + 1}
                  </div>
                  <p className="text-slate-800 font-bold leading-snug">{item}</p>
                  <div className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Research Topic <ChevronRight size={12} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <Rocket className="text-[var(--primary)]" size={24} />
              <h3 className="text-xl font-black tracking-tight">Proof-of-Work Blueprints</h3>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {projects.map((proj, i) => (
                <div key={i} className="p-8 rounded-[2rem] bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)] transition-all relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[var(--primary)] opacity-20 group-hover:opacity-100 transition-opacity" />
                  <h4 className="text-lg font-black mb-2">{proj.title}</h4>
                  <p className="text-[var(--secondary)] text-sm leading-relaxed mb-6 italic opacity-70">"{proj.description}"</p>
                  <div className="flex flex-wrap gap-2">
                    {proj.tech_stack?.map((tech, j) => (
                      <span key={j} className="text-[9px] px-3 py-1 rounded-lg bg-white font-black uppercase tracking-widest border border-[var(--outline-variant)]">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-10 border-t border-[var(--outline-variant)] bg-[var(--surface-container-low)] flex justify-between items-center">
          <p className="text-[9px] text-[var(--secondary)] font-black uppercase tracking-[0.2em] opacity-30">Synthesized via Groq Llama 3 • Precision AI</p>
          <button 
            onClick={onClose}
            className="px-12 py-4 bg-[var(--on-background)] text-white rounded-2xl font-black text-xs tracking-[0.2em] uppercase hover:scale-105 transition-all shadow-xl"
          >
            Activate Roadmap
          </button>
        </div>
      </div>
    </div>
  );
};

export default GrowthHubModal;
