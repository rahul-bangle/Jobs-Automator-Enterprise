import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { useAppState } from '../context/useAppState.jsx';

function CampaignPage() {
  const { state, actions } = useAppState();
  const [form, setForm] = useState(state.campaign);
  const [saved, setSaved] = useState(false);
  const currentForm = form ?? state.campaign;

  if (!currentForm) return null;

  const updateField = (key, value) => {
    setSaved(false);
    setForm((previous) => ({ ...(previous ?? currentForm), [key]: value }));
  };

  const toggleRole = (role) => {
    setSaved(false);
    setForm((previous) => ({
      ...(previous ?? currentForm),
      targetRoles: (previous ?? currentForm).targetRoles.includes(role)
        ? (previous ?? currentForm).targetRoles.filter((item) => item !== role)
        : [...(previous ?? currentForm).targetRoles, role],
    }));
  };

  const toggleWorkMode = (mode) => {
    setSaved(false);
    setForm((previous) => ({
      ...(previous ?? currentForm),
      workModes: (previous ?? currentForm).workModes.includes(mode)
        ? (previous ?? currentForm).workModes.filter((item) => item !== mode)
        : [...(previous ?? currentForm).workModes, mode],
    }));
  };

  const onSave = async (event) => {
    event.preventDefault();
    await actions.saveCampaign(currentForm);
    setSaved(true);
  };

  const roles = ['Fresher Product Manager', 'Assistant Product Manager', 'Associate Product Manager'];
  const workModes = ['Remote', 'Hybrid', 'Onsite'];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Campaign config"
        title="Targeting and Relevance Controls"
        description="Lock the PM role family, trust thresholds, and reusable answers before scaling imports or application prep."
      />

      <form onSubmit={onSave} className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="text-sm font-medium text-slate-700">Campaign name</label>
            <input value={currentForm.name} onChange={(event) => updateField('name', event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white" />
          </div>

          <div>
            <div className="text-sm font-medium text-slate-700">Role targets</div>
            <div className="mt-3 flex flex-wrap gap-3">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    currentForm.targetRoles.includes(role)
                      ? 'border-blue-200 bg-blue-50 text-blue-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm text-slate-500 cursor-pointer">
              <input type="checkbox" checked={currentForm.adjacentRolesEnabled} onChange={(event) => updateField('adjacentRolesEnabled', event.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              Include adjacent PM roles like Product Analyst or Product Ops.
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Preferred locations</label>
              <textarea value={currentForm.preferredLocations} onChange={(event) => updateField('preferredLocations', event.target.value)} rows="4" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Excluded companies</label>
              <textarea value={currentForm.excludedCompanies} onChange={(event) => updateField('excludedCompanies', event.target.value)} rows="4" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white" />
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-slate-700">Work mode preferences</div>
            <div className="mt-3 flex flex-wrap gap-3">
              {workModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => toggleWorkMode(mode)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    currentForm.workModes.includes(mode)
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="text-sm font-medium text-slate-700">Trust threshold</label>
            <input type="range" min="40" max="95" value={currentForm.trustThreshold} onChange={(event) => updateField('trustThreshold', Number(event.target.value))} className="mt-3 w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            <div className="mt-2 text-sm text-slate-500">{currentForm.trustThreshold} minimum score</div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Relevance threshold</label>
            <input type="range" min="40" max="95" value={currentForm.relevanceThreshold} onChange={(event) => updateField('relevanceThreshold', Number(event.target.value))} className="mt-3 w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            <div className="mt-2 text-sm text-slate-500">{currentForm.relevanceThreshold} minimum score</div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Work authorization</label>
            <textarea value={currentForm.workAuthorization} onChange={(event) => updateField('workAuthorization', event.target.value)} rows="4" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white" />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Standard answers</label>
            <textarea value={currentForm.standardAnswers} onChange={(event) => updateField('standardAnswers', event.target.value)} rows="5" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white" />
          </div>

          <button type="submit" className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 shadow-lg shadow-blue-900/10">
            Save campaign configuration
          </button>
          {saved ? <div className="text-sm font-medium text-emerald-600 text-center">Campaign settings saved successfully.</div> : null}
        </section>
      </form>
    </div>
  );
}

export default CampaignPage;
