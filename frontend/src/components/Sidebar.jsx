import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Radar, 
  Shield, 
  CalendarClock, 
  Camera, 
  Link2, 
  BarChart3, 
  Settings2,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab }) {
  const { user } = useAuth();
  const isCustodianOrAdmin = user?.role === 'LAB_CUSTODIAN' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    {
      id: 'radar',
      name: 'Resource Radar',
      subtitle: 'Cross-Campus Discovery',
      icon: Radar,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'trustpass',
      name: 'TrustPass ID',
      subtitle: 'Skill Passport & Badges',
      icon: Shield,
      badge: user?.role === 'STUDENT' ? `${user?.fairness_profile?.trust_score || 95} Pts` : null,
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    {
      id: 'bookings',
      name: 'FairShare Bookings',
      subtitle: 'Anti-Hoarding & Queues',
      icon: CalendarClock,
      badge: null
    },
    {
      id: 'handover',
      name: 'ProofHandover',
      subtitle: 'Digital Condition Escrow',
      icon: Camera,
      badge: 'Escrow',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    },
    {
      id: 'ledger',
      name: 'TrustLedger Audit',
      subtitle: 'SHA-256 Tamper-Evident',
      icon: Link2,
      badge: 'SHA-256',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    },
    {
      id: 'analytics',
      name: 'Smart Intelligence',
      subtitle: 'CapEx & Utilization Radar',
      icon: BarChart3,
      badge: 'AI Insights',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    },
    ...(isCustodianOrAdmin ? [{
      id: 'custodian',
      name: 'Custodian Hub',
      subtitle: 'Approvals & Disputes',
      icon: Settings2,
      badge: 'Admin',
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    }] : [])
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-65px)]">
      <div className="p-4 space-y-6">
        {/* Navigation Category */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            <span>Governance Modules</span>
            <span className="text-[10px] text-cyan-400 font-semibold">v1.0 Pure-Software</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition font-medium text-left group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                    <div className="truncate">
                      <div className="text-sm font-semibold truncate leading-tight">{item.name}</div>
                      <div className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold shrink-0 ${
                      isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Context Card */}
        {user && (
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
              <span>ACTIVE PROFILE</span>
              <span className="text-emerald-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>ONLINE</span>
              </span>
            </div>
            <div>
              <p className="font-semibold text-white truncate">{user.full_name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.department?.name || 'Cross-Disciplinary'}</p>
            </div>
            {user.role === 'STUDENT' && user.fairness_profile && (
              <div className="pt-2 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Fairness</span>
                  <span className="font-bold text-cyan-300 font-mono">{user.fairness_profile.fairness_score}/10</span>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Quota Rem.</span>
                  <span className="font-bold text-emerald-300 font-mono">
                    {Math.max(0, user.fairness_profile.max_weekly_quota - user.fairness_profile.current_weekly_hours).toFixed(1)}h
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Protocol Footprint Guarantee */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-900/40 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center space-x-1.5 text-blue-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% PURE SOFTWARE</span>
          </div>
          <p className="text-[10px] leading-tight text-slate-400">
            Zero IoT locks or hardware sensors. Governed by cryptographic identity, dynamic quotas, and tamper-evident event chains.
          </p>
        </div>
      </div>
    </aside>
  );
}
