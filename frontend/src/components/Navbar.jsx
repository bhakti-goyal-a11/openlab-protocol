import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  UserCheck, 
  ChevronDown, 
  LogOut, 
  Award, 
  Layers, 
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function Navbar({ onOpenAuthModal }) {
  const { user, logout, switchDemoUser, demoUsers, loading } = useAuth();
  const [showSwitcher, setShowSwitcher] = useState(false);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-900/60 text-purple-300 border-purple-500/40';
      case 'LAB_CUSTODIAN':
        return 'bg-amber-900/60 text-amber-300 border-amber-500/40';
      default:
        return 'bg-blue-900/60 text-blue-300 border-blue-500/40';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'Institutional Dean / Auditor';
      case 'LAB_CUSTODIAN':
        return 'Lab Custodian';
      default:
        return 'Student Researcher';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 lg:px-8 py-3 flex items-center justify-between">
      {/* Brand Identity */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-lg tracking-wider text-white">OPENLAB</span>
            <span className="text-xs px-2 py-0.5 rounded font-black tracking-widest bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950">
              TRUSTX
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono tracking-tight hidden sm:block">
            AI Campus Resource Governance & Trust Protocol
          </p>
        </div>
      </div>

      {/* Center/Right Actions: Demo Role Switcher & User Profile */}
      <div className="flex items-center space-x-3">
        {/* Quick Demo Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSwitcher(!showSwitcher)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition text-xs text-slate-200"
            title="Switch demo persona for testing different workflows"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden md:inline text-slate-400">Role Switcher:</span>
            <span className="font-semibold text-white">{user?.full_name || 'Switch Role'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showSwitcher && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Select Demo Persona
                </p>
                <p className="text-[11px] text-slate-400">
                  Switch instantly between Student, Custodian, and Admin accounts.
                </p>
              </div>

              <div className="max-h-72 overflow-y-auto py-1 divide-y divide-slate-800/60">
                {demoUsers.map((du) => {
                  const isCurrent = user?.email === du.email;
                  return (
                    <button
                      key={du.email}
                      onClick={async () => {
                        setShowSwitcher(false);
                        await switchDemoUser(du.email);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition flex items-start space-x-2.5 ${
                        isCurrent 
                          ? 'bg-blue-600/20 border border-blue-500/40 text-blue-200' 
                          : 'hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="mt-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRoleBadgeColor(du.role)}`}>
                          {du.role}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{du.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{du.dept}</p>
                        <p className="text-[10px] text-slate-400/90 italic truncate">{du.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Pill with TrustScore or Role */}
        {user && (
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            {user.role === 'STUDENT' && user.fairness_profile && (
              <div 
                className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium"
                title="Dynamic User Reliability Score (0-100)"
              >
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>TrustScore: <strong>{user.fairness_profile.trust_score}</strong>/100</span>
              </div>
            )}

            <div className="flex items-center space-x-2 bg-slate-800/50 border border-slate-700/60 rounded-lg px-2.5 py-1">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-7 h-7 rounded-full object-cover ring-1 ring-blue-500/40" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-100 leading-tight truncate max-w-[120px]">
                  {user.full_name}
                </p>
                <span className={`inline-block text-[9px] px-1 py-0.2 rounded border font-semibold ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Log out"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
