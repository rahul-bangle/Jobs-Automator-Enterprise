import React, { useState } from 'react';
import { Search, MapPin, Sparkles, Loader2, Zap } from 'lucide-react';
import JobCard from '../components/JobCard';
import DetailDrawer from '../components/DetailDrawer';
import GrowthPanel from '../components/GrowthPanel';
import { api } from '../services/api';

export default function DiscoveryPage() {
  const [query, setQuery] = useState('Full Stack Developer');
  const [location, setLocation] = useState('Hyderabad, Telangana, India');
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(`Searching Hyderabad Tech Hubs for "${query}"...`);
    try {
      const data = await api.discovery(query, location, limit);
      setResults(data.jobs || []);
      setStatus(`Scanning complete. Found ${data.discovered_count} relevant roles in Hyderabad.`);
    } catch (err) {
      console.error(err);
      setStatus('Operational error in Discovery Pipeline. Check backend logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async (jobId) => {
    setStatus(`Optimizing resume for job: ${jobId}...`);
    try {
      const data = await api.optimize(jobId);
      setStatus(`Optimization complete! Score: ${data.score}%`);
    } catch (err) {
      console.error(err);
      setStatus('Optimization failed.');
    }
  };

  const handleApply = async (jobId) => {
    setStatus(`Deploying application for job: ${jobId}...`);
    try {
      await api.apply(jobId);
      setStatus(`Deployment successful! Check History for audit logs.`);
    } catch (err) {
      console.error(err);
      setStatus('Deployment failed.');
    }
  };

  const handleGrowth = async (jobId) => {
    setStatus(`Analyzing tech gaps for job: ${jobId}...`);
    setLoading(true);
    try {
      const data = await api.generateGrowthPlan(jobId);
      setSelectedPlan(data.study_guide);
      setStatus(`Growth plan generated successfully!`);
    } catch (err) {
      console.error(err);
      setStatus('Growth plan generation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 no-scrollbar">
      {/* Search Header */}
      <div className="pro-glass-card p-8 bg-white/40">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-pro-blue/10 rounded-2xl">
            <Search className="w-6 h-6 text-pro-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Autonomous Discovery</h1>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Multi-site aggregation powered by JobSpy & Crawl4AI</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-pro-blue transition-colors" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Target Role (e.g. Product Manager)"
              className="w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-200 bg-white/80 focus:ring-4 focus:ring-pro-blue/10 focus:border-pro-blue outline-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>
          <div className="relative group">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-pro-blue transition-colors" />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-11 pr-10 py-4 rounded-2xl border border-slate-200 bg-white/80 focus:ring-4 focus:ring-pro-blue/10 focus:border-pro-blue outline-none transition-all font-medium appearance-none cursor-pointer hover:bg-white"
            >
              <option value="Hyderabad, Telangana, India">Hyderabad (All)</option>
              <option value="Hitech City, Hyderabad">Hitech City</option>
              <option value="Gachibowli, Hyderabad">Gachibowli</option>
              <option value="Madhapur, Hyderabad">Madhapur</option>
              <option value="Kondapur, Hyderabad">Kondapur</option>
              <option value="Banjara Hills, Hyderabad">Banjara Hills</option>
              <option value="Secunderabad">Secunderabad</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <button
            disabled={loading}
            className="bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 px-8 uppercase tracking-widest text-xs"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? 'Discovering...' : 'Launch Search'}
          </button>
        </form>

        {status && (
          <div className="mt-6 flex items-center gap-2 text-sm font-bold text-pro-blue bg-pro-blue/5 p-4 rounded-xl border border-pro-blue/10 animate-in fade-in zoom-in-95">
            <div className="w-2 h-2 rounded-full bg-pro-blue animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            {status}
          </div>
        )}
      </div>

      {/* Discovery Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
        {results.length > 0 ? (
          results.map((job) => (
            <JobCard 
              key={job.id} 
              job={job} 
              onOptimize={handleOptimize}
              onApply={handleApply}
              onGrowth={handleGrowth}
            />
          ))
        ) : !loading && (
          <div className="lg:col-span-2 xl:col-span-3 py-24 text-center space-y-6 rounded-[3rem] border-2 border-dashed border-slate-200/50 bg-white/20">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100">
              <Sparkles className="w-10 h-10 text-pro-blue/50" />
            </div>
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Premium Hyderabad Discovery</h2>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed font-medium">
                Aggregating high-fidelity roles from Hitech City, Gachibowli, and Madhapur. 
                Select your preferred tech hub to begin autonomous discovery.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
