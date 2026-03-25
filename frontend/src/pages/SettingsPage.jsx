import PageHeader from '../components/PageHeader.jsx';
import { useAppState } from '../context/useAppState.jsx';

function SettingsPage() {
  const { state, actions } = useAppState();
  const settings = state.settings;

  if (!settings) return null;

  const toggle = (key) => actions.saveSettings({ [key]: !settings[key] });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Backend handoff" title="Settings and Integration Defaults" description="These controls document the intended backend operating mode: Supabase first, SQLite fallback, and manual approval before submission." />

      <div className="grid gap-6 xl:grid-cols-[0.85fr,1.15fr]">
        <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 backdrop-blur-md shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Runtime switches</h2>
          <div className="mt-5 space-y-4">
            {[
              ['supabaseConfigured', 'Supabase configured'],
              ['sqliteFallbackEnabled', 'SQLite fallback enabled'],
              ['autoOpenManualSteps', 'Auto-open manual steps on failure'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-4 text-sm font-medium text-slate-700 hover:bg-slate-100/50 transition cursor-pointer">
                <span>{label}</span>
                <input type="checkbox" checked={settings[key]} onChange={() => toggle(key)} className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 transition cursor-pointer" />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 backdrop-blur-md shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Backend contract notes</h2>
          <ul className="mt-5 space-y-4 text-sm font-medium text-slate-500 leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
              <span>Frontend contracts are database-agnostic and already frozen around service-layer methods.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
              <span>Supabase is the primary backend target when credentials exist.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
              <span>SQLite stays available as a free local fallback for offline testing and zero-cost runs.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
              <span>Unsupported job sources should route to review/manual workflow, not blind submission.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
              <span>Final application submission must always respect explicit approval state.</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default SettingsPage;
