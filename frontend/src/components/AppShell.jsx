import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAppState } from '../context/useAppState.jsx';

const navigation = [
  { to: '/dashboard', label: 'Dashboard', hint: 'Ops overview', icon: '◫' },
  { to: '/campaign', label: 'Campaign', hint: 'Role targeting', icon: '◎' },
  { to: '/import', label: 'Bulk Import', hint: 'CSV/XLSX + URLs', icon: '↥' },
  { to: '/jobs', label: 'Jobs', hint: 'Inventory', icon: '▣' },
  { to: '/review', label: 'Review Queue', hint: 'Manual triage', icon: '◇' },
  { to: '/applications', label: 'Applications', hint: 'Approval queue', icon: '→' },
  { to: '/resumes', label: 'Resumes', hint: 'Variants', icon: '✦' },
  { to: '/submissions', label: 'Submissions', hint: 'History', icon: '◌' },
  { to: '/discovery', label: 'Discovery', hint: 'Auto Job Hunt', icon: '🔍' },
  { to: '/archive', label: 'Command Archive', hint: 'Autonomous Log', icon: '🛰️' },
  { to: '/settings', label: 'Settings', hint: 'Backend handoff', icon: '⚙' },
];

function AppShell() {
  const location = useLocation();
  const { derived, state } = useAppState();
  const title = navigation.find((item) => item.to === location.pathname)?.label ?? 'Job Automator';

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-slate-900">
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute left-[-12rem] top-[-8rem] h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute right-[-8rem] top-20 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-1/3 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />
      </div>
      <div className="relative flex min-h-screen">
        <aside className="hidden w-72 border-r border-slate-200/80 bg-white/70 backdrop-blur-xl xl:flex xl:flex-col">
          <div className="border-b border-slate-100/70 px-6 py-6">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.35em] text-blue-600">Job Automator</div>
            <h1 className="mt-4 text-[1.95rem] font-bold leading-tight text-slate-900 tracking-tight">Command Center</h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">Trusted-source PM search with review-first application ops.</p>
          </div>
          <nav className="flex-1 space-y-2 px-3 py-4">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group block rounded-2xl border px-4 py-3 transition ${
                    isActive
                      ? 'border-blue-200 bg-blue-50/50 text-slate-900 shadow-sm'
                      : 'border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 transition group-hover:border-blue-200 group-hover:text-blue-600">
                    {item.icon}
                  </span>
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.hint}</div>
                  </div>
                </div>
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-slate-100 px-6 py-5 text-sm text-slate-400">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Live campaign</div>
              <div className="mt-2 font-medium text-slate-700">{state.campaign?.name ?? 'Not loaded'}</div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-slate-500">Ready to apply</span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-600 font-medium">{derived.dashboardStats.readyToApply}</span>
              </div>
            </div>
          </div>
        </aside>
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
            <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Operations console</div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">{title}</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="text-xs text-slate-500">Trusted</div>
                  <div className="text-lg font-semibold text-emerald-600">{derived.dashboardStats.trustedAccepted}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="text-xs text-slate-500">Review</div>
                  <div className="text-lg font-semibold text-amber-600">{derived.dashboardStats.inReview}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="text-xs text-slate-500">Approved</div>
                  <div className="text-lg font-semibold text-blue-600">{derived.dashboardStats.approved}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 shadow-sm">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">DB target</div>
                  <div className="text-lg font-bold text-slate-600">Supabase</div>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 px-5 py-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppShell;
