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
        <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
          <h2 className="text-xl font-semibold text-white">Runtime switches</h2>
          <div className="mt-5 space-y-4">
            {[
              ['supabaseConfigured', 'Supabase configured'],
              ['sqliteFallbackEnabled', 'SQLite fallback enabled'],
              ['autoOpenManualSteps', 'Auto-open manual steps on failure'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-sm text-slate-200">
                <span>{label}</span>
                <input type="checkbox" checked={settings[key]} onChange={() => toggle(key)} />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
          <h2 className="text-xl font-semibold text-white">Backend contract notes</h2>
          <ul className="mt-5 space-y-3 text-sm text-slate-300">
            <li>• Frontend contracts are database-agnostic and already frozen around service-layer methods.</li>
            <li>• Supabase is the primary backend target when credentials exist.</li>
            <li>• SQLite stays available as a free local fallback for offline testing and zero-cost runs.</li>
            <li>• Unsupported job sources should route to review/manual workflow, not blind submission.</li>
            <li>• Final application submission must always respect explicit approval state.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default SettingsPage;
