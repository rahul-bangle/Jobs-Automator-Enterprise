import React from 'react';
import { X, BookOpen, Rocket, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

const GrowthHubModal = ({ isOpen, onClose, growthData, jobTitle }) => {
  if (!isOpen) return null;

  const { learnings = [], projects = [], skill_gaps = [] } = growthData || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white/90 border border-white/20 rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-gradient-to-r from-pro-blue/5 to-transparent">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-pro-blue/10 text-pro-blue">
                <Zap size={18} />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-pro-blue">Growth Phase</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Bridge the Gap for <span className="text-pro-blue">{jobTitle}</span>
            </h2>
            <p className="mt-2 text-slate-500 font-medium">AI-generated roadmap to turn your profile into a 100% match.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          
          {/* Section 1: Skill Gaps */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="text-rose-500" size={24} />
              <h3 className="text-xl font-bold text-slate-900">Identified Gaps</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(skill_gaps.length > 0 ? skill_gaps : ['No significant gaps found! Keep going.']).map((gap, i) => (
                <div key={i} className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-bold shadow-sm">
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

          {/* Section 3: Suggested Projects */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Rocket className="text-pro-blue" size={24} />
              <h3 className="text-xl font-bold text-slate-900">Proof-of-Work Projects</h3>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {projects.map((proj, i) => (
                <div key={i} className="p-6 rounded-3xl border border-pro-blue/20 bg-pro-blue/5 hover:bg-pro-blue/10 transition-all border-dashed">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{proj.title}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">{proj.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {proj.tech_stack?.map((tech, j) => (
                      <span key={j} className="text-[10px] px-2 py-1 rounded-md bg-white border border-pro-blue/10 text-pro-blue font-bold uppercase tracking-tight">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <p className="text-xs text-slate-400 font-medium">Analysis generated via Groq (Llama 3.3 70B) • Adaptive Intel</p>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm tracking-widest uppercase hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            Got it, Let's Build
          </button>
        </div>
      </div>
    </div>
  );
};

export default GrowthHubModal;
