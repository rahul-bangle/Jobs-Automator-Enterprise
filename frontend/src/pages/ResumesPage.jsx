import React, { useState, useRef } from 'react';
import { FileText, Upload, CheckCircle2, AlertCircle, Sparkles, Wand2, ShieldCheck, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_BASE = "http://localhost:8001/api/v2";

const ResumesPage = () => {
  const [activeProfile, setActiveProfile] = useState({
    name: "Rahul's Master Profile",
    lastUpdated: "2 mins ago",
    skills: ["React", "Node.js", "Python", "SQLModel", "FastAPI"],
    experience: "5+ Years",
    completeness: 85
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE}/resumes/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data) {
        // Update local state with parsed data if needed
        setActiveProfile(prev => ({
          ...prev,
          lastUpdated: "Just now",
          completeness: 95 // Arbitrary update for feedback
        }));
        alert("Resume imported and parsed successfully!");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to import resume. Please check the backend console.");
    } finally {
      setIsUploading(false);
    }
  };

  const onFileSelect = (e) => {
    const file = e.target.files[0];
    handleFileUpload(file);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 no-scrollbar">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".pdf,.json,.txt"
        onChange={onFileSelect}
      />
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Master Profile</h1>
          <p className="text-slate-500 font-medium">Your global identity for all autonomous applications.</p>
        </div>
        <div className="p-1 px-4 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-black tracking-widest uppercase flex items-center gap-2">
          <ShieldCheck size={14} /> System Verified
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left: Active Profile Status */}
        <div className="xl:col-span-2 space-y-8">
          <div className="pro-glass-card p-10 bg-white/60 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileText size={120} />
            </div>
            
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-pro-blue to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-pro-blue/20">
                  <FileText size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{activeProfile.name}</h2>
                  <p className="text-slate-500 font-medium text-sm">Last Synced: {activeProfile.lastUpdated}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-pro-blue">{activeProfile.completeness}%</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profile Health</div>
              </div>
            </div>

            <div className="flex gap-4 mb-10">
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pro-blue to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${activeProfile.completeness}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Key Tech</div>
                <div className="text-slate-900 font-bold">{activeProfile.skills[0]} + {activeProfile.skills.length - 1}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Experience</div>
                <div className="text-slate-900 font-bold">{activeProfile.experience}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
                <div className="text-emerald-600 font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Tailor-Ready
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Parser</div>
                <div className="text-slate-900 font-bold">Reactive v2.1</div>
              </div>
            </div>
          </div>

          {/* Skill Matrix */}
          <div className="pro-glass-card p-10 bg-slate-900 text-white relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <Sparkles className="text-amber-400" size={24} />
                Extracted Skill Matrix
              </h3>
              <button className="p-2 px-6 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-xs font-black uppercase tracking-widest border border-white/10">
                Refresh Analysis
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {activeProfile.skills.map(skill => (
                <div key={skill} className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 hover:border-white/20 transition-all cursor-default">
                  {skill}
                </div>
              ))}
              <div className="px-5 py-2.5 rounded-2xl border border-white/10 border-dashed text-white/40 font-medium italic">
                + Detecting 12 more...
              </div>
            </div>
          </div>
        </div>

        {/* Right: Import Zone */}
        <div className="space-y-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`pro-glass-card p-10 border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center group h-full min-h-[400px]
              ${isDragging ? 'border-pro-blue bg-pro-blue/5 scale-[0.98]' : 'border-slate-200 bg-white hover:border-pro-blue/50 hover:bg-slate-50'}
              ${isUploading ? 'opacity-50 pointer-events-none' : ''}
            `}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { 
              e.preventDefault(); 
              setIsDragging(false); 
              const file = e.dataTransfer.files[0];
              handleFileUpload(file);
            }}
          >
            <div className="w-24 h-24 rounded-full bg-pro-blue/5 flex items-center justify-center text-pro-blue mb-6 group-hover:scale-110 group-hover:bg-pro-blue/10 transition-all">
              {isUploading ? <Loader2 size={40} className="animate-spin" /> : <Upload size={40} />}
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              {isUploading ? 'Parsing Resume...' : 'Import Profile'}
            </h3>
            <p className="text-slate-500 font-medium mb-8 max-w-[200px] mx-auto text-sm">
              Drag & drop your <span className="text-pro-blue">JSON</span> or <span className="text-pro-blue">PDF</span> resume to refresh your master profile.
            </p>
            <button 
              disabled={isUploading}
              className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm tracking-[0.2em] uppercase hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-3"
            >
              {isUploading && <Loader2 size={16} className="animate-spin" />}
              {isUploading ? 'Please Wait' : 'Browse Files'}
            </button>
          </div>

          <div className="p-6 rounded-[2.5rem] bg-amber-50 border border-amber-100 flex gap-4">
            <div className="text-amber-500 pt-1">
              <AlertCircle size={24} strokeWidth={3} />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm">AI Notice</h4>
              <p className="text-amber-700/80 text-xs font-medium leading-relaxed mt-1">
                Importing a new resume will reset existing tailoring historical data for this specific campaign focus.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ResumesPage;
