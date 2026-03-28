import React, { useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  Briefcase,
  FileUp,
  GraduationCap,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';

const API_BASE = 'http://localhost:8001/api/v2';

const pickSkills = (parsed) => {
  if (!parsed) return [];
  const fromFlat = Array.isArray(parsed.skills) ? parsed.skills : [];
  if (fromFlat.length) return fromFlat.map((item) => (typeof item === 'string' ? item : item?.name)).filter(Boolean);
  const nested = Array.isArray(parsed.sections?.skills?.items) ? parsed.sections.skills.items : [];
  return nested
    .map((item) => (typeof item === 'string' ? item : item?.name || item?.label || item?.value))
    .filter(Boolean);
};

const pickWork = (parsed) => {
  const workItems = Array.isArray(parsed?.sections?.work?.items) ? parsed.sections.work.items : [];
  return workItems.slice(0, 3);
};

const pickEducation = (parsed) => {
  const educationItems = Array.isArray(parsed?.sections?.education?.items) ? parsed.sections.education.items : [];
  return educationItems.slice(0, 2);
};

function ResumesPage() {
  const [masterResume, setMasterResume] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorText, setErrorText] = useState('');
  const fileInputRef = useRef(null);

  const parsed = masterResume?.parsed_json || {};
  const skills = useMemo(() => pickSkills(parsed), [parsed]);
  const workItems = useMemo(() => pickWork(parsed), [parsed]);
  const educationItems = useMemo(() => pickEducation(parsed), [parsed]);
  const basics = parsed?.basics || {};

  const isImported = !!masterResume;
  const completion = Math.min(100, Math.max(40, 45 + skills.length * 6 + workItems.length * 8 + educationItems.length * 6));

  const fetchMasterProfile = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/resumes/master`);
      if (data?.status === 'empty' || !data?.id) {
        setMasterResume(null);
        setErrorText(''); // Clear any generic connection errors if API is healthy but empty
        return;
      }
      setMasterResume(data);
      setErrorText('');
    } catch (error) {
      setErrorText('Failed to load profile data. Check backend connection.');
    }
  };

  React.useEffect(() => {
    fetchMasterProfile();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file || isUploading) return;
    setIsUploading(true);
    setErrorText('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await axios.post(`${API_BASE}/resumes/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchMasterProfile();
    } catch (error) {
      setErrorText('Resume import failed. Please verify API and file format.');
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = (event) => {
    const file = event.target.files?.[0];
    handleFileUpload(file);
  };

  const onDropFile = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    handleFileUpload(file);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-12">
      <input ref={fileInputRef} type="file" accept=".pdf,.json,.txt" className="hidden" onChange={onFileChange} />

      <header className="text-center">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Profile Intelligence</h1>
        <p className="mx-auto mt-2 max-w-2xl text-slate-600">
          Two-step flow: import your resume first, then review auto-fetched profile details.
        </p>
      </header>

      <div className="flex items-center justify-center gap-2">
        <span className={`h-2 w-2 rounded-full ${!isImported ? 'bg-indigo-600' : 'bg-slate-300'}`} />
        <span className={`h-2 w-2 rounded-full ${isImported ? 'bg-indigo-600' : 'bg-slate-300'}`} />
      </div>

      {!isImported ? (
        <section className="pro-glass-card rounded-[2.2rem] border border-slate-200 bg-white p-6 sm:p-10">
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-900">Secure Your Professional Identity</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              Import a PDF or JSON resume to initialize your global profile. Parsed details will be auto-fetched in the
              next screen.
            </p>
          </div>

          <div
            className={`mx-auto mt-8 flex min-h-[320px] max-w-3xl cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed p-10 text-center transition
              ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50/70 hover:border-indigo-300 hover:bg-indigo-50/40'}
              ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDropFile}
          >
            <div className="mb-5 rounded-2xl bg-indigo-100 p-5 text-indigo-700">
              {isUploading ? <Loader2 size={34} className="animate-spin" /> : <FileUp size={34} />}
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{isUploading ? 'Parsing Resume...' : 'Drag and Drop Your Resume'}</h3>
            <p className="mt-2 text-sm text-slate-500">Supported formats: PDF, JSON, TXT (max 10MB recommended)</p>
            <button
              type="button"
              disabled={isUploading}
              className="mt-7 rounded-2xl bg-indigo-600 px-7 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? 'Please wait...' : 'Browse Files'}
            </button>
          </div>

          <div className="mx-auto mt-8 flex max-w-3xl gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <AlertCircle className="mt-0.5 text-sky-700" size={18} />
            <p className="text-sm text-sky-900">
              AI Initialization Notice: importing a new resume overwrites your previous master profile and refreshes all
              parsed details.
            </p>
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.6fr,0.9fr]">
            <div className="pro-glass-card rounded-[2rem] border border-slate-200 bg-white p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700">
                    <UserRound size={26} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900">{basics.name || 'Imported Candidate'}</h2>
                    <p className="text-slate-600">
                      {basics.label || 'Role not detected'} {basics.location ? `• ${basics.location}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fetchMasterProfile}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600">Profile Strength</span>
                  <span className="font-bold text-indigo-700">{completion}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500" style={{ width: `${completion}%` }} />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</div>
                  <div className="mt-1 font-medium text-slate-800">{basics.email || 'Not detected'}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</div>
                  <div className="mt-1 font-medium text-slate-800">{basics.phone || 'Not detected'}</div>
                </div>
              </div>
            </div>

            <aside className="pro-glass-card rounded-[2rem] border border-slate-200 bg-white p-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                <ShieldCheck size={14} /> Imported
              </div>
              <h3 className="text-lg font-bold text-slate-900">Resume Snapshot</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">File</div>
                  <div className="font-medium">{masterResume.filename}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">Updated</div>
                  <div className="font-medium">{new Date(masterResume.updated_at).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">Skills Found</div>
                  <div className="font-medium">{skills.length}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Replace Resume
              </button>
            </aside>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="pro-glass-card rounded-[2rem] border border-slate-200 bg-white p-7">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
                <Briefcase size={20} className="text-indigo-700" /> Experience
              </h3>
              {workItems.length ? (
                <div className="space-y-3">
                  {workItems.map((item, idx) => (
                    <div key={`${item.name || item.position || 'work'}-${idx}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="font-semibold text-slate-900">{item.position || item.name || 'Role'}</div>
                      <div className="text-sm text-slate-600">{item.company || item.organization || 'Company not found'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No work experience extracted yet.</p>
              )}
            </div>

            <div className="pro-glass-card rounded-[2rem] border border-slate-200 bg-white p-7">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
                <GraduationCap size={20} className="text-indigo-700" /> Education
              </h3>
              {educationItems.length ? (
                <div className="space-y-3">
                  {educationItems.map((item, idx) => (
                    <div key={`${item.institution || item.school || 'edu'}-${idx}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="font-semibold text-slate-900">{item.institution || item.school || 'Institution'}</div>
                      <div className="text-sm text-slate-600">{item.studyType || item.degree || 'Degree not found'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No education data extracted yet.</p>
              )}
            </div>
          </div>

          <div className="pro-glass-card rounded-[2rem] border border-slate-200 bg-white p-7">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
              <Sparkles size={20} className="text-indigo-700" /> Skills
            </h3>
            {skills.length ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill} className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No skills extracted yet.</p>
            )}
          </div>
        </section>
      )}

      {errorText ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{errorText}</div>
      ) : null}
    </div>
  );
}

export default ResumesPage;
