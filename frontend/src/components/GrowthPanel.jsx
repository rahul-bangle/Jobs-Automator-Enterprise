import React from 'react';
import { BookOpen, FolderCode, ArrowRight, Zap, Target } from 'lucide-react';

const GrowthPanel = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-12 h-12 border-4 border-pro-blue/20 border-t-pro-blue rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse text-sm">Analyzing Skill Gaps & Constructing Projects...</p>
      </div>
    );
  }

  if (!data || (!data.learnings?.length && !data.projects?.length)) {
    return (
      <div className="text-center py-12 px-6">
        <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
          <Target className="text-slate-300" size={32} />
        </div>
        <h3 className="text-slate-900 font-bold mb-2">No Growth Plan Yet</h3>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">Click the 'Growth' button to trigger a deep AI analysis of your skill gaps for this specific role.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Learning Subjects */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-pro-blue/10 rounded-lg">
            <BookOpen size={18} className="text-pro-blue" />
          </div>
          <h3 className="text-slate-900 font-bold tracking-tight text-lg">Knowledge Gaps</h3>
        </div>
        <div className="grid gap-3">
          {data.learnings?.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-100 hover:border-pro-blue/30 hover:bg-slate-50/50 transition-all group">
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-pro-blue/10 group-hover:text-pro-blue transition-colors">
                {idx + 1}
              </div>
              <span className="text-slate-700 font-medium text-sm">{item}</span>
              <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-pro-blue group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      </section>

      {/* Suggested Projects */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-pro-green/10 rounded-lg">
            <FolderCode size={18} className="text-pro-green" />
          </div>
          <h3 className="text-slate-900 font-bold tracking-tight text-lg">Strategic Projects</h3>
        </div>
        <div className="space-y-4">
          {data.projects?.map((project, idx) => (
            <div key={idx} className="pro-glass-card p-5 border-l-4 border-l-pro-green relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={48} className="text-pro-green" />
              </div>
              <h4 className="text-slate-900 font-black mb-2 text-md leading-tight">{project.title}</h4>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.tech_stack?.map((tech, tIdx) => (
                  <span key={tIdx} className="px-2.5 py-1 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider border border-slate-200">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final Pro-Tip */}
      <div className="p-4 rounded-2xl bg-pro-blue text-white shadow-lg shadow-pro-blue/20 flex gap-4 items-start">
        <div className="p-2 bg-white/20 rounded-xl mt-1">
          <Zap size={20} />
        </div>
        <div>
          <p className="font-bold text-sm mb-0.5">Growth Sprint Ready</p>
          <p className="text-white/80 text-xs leading-relaxed">Completing even one of these projects will increase your semantic match score by roughly 15-20% for this role.</p>
        </div>
      </div>
    </div>
  );
};

export default GrowthPanel;
