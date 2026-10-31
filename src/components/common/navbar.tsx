"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { 
  ShieldCheck, 
  Terminal,
  Activity,
  Lock,
  Sparkles
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  const getPageTitle = (path: string) => {
    if (path === "/") return "COMMAND CENTER // OPERATIONS PULSE";
    if (path.startsWith("/resources")) return "HARDWARE BAYS & CLEANROOM CATALOG";
    if (path.startsWith("/bookings")) return "RESERVATIONS & CONDITION HANDOVERS";
    if (path.startsWith("/manager")) return "CUSTODIAN TRIAGE & CONFLICT INBOX";
    if (path.startsWith("/admin/audit")) return "CRYPTOGRAPHIC AUDIT LEDGER (SHA-256)";
    if (path.startsWith("/admin/fairness")) return "ANTI-MONOPOLY FAIR-SHARE ANALYTICS";
    return "OPENLAB PROTOCOL";
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        
        {/* Left: Breadcrumbs & Security Engine Tag */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 diode-pulse-green shadow-[0_0_8px_#34d399]" />
            <span className="text-[11px] font-mono font-bold text-slate-300 tracking-wider">
              {getPageTitle(pathname)}
            </span>
          </div>
          <span className="hidden md:inline text-slate-600 font-mono text-xs">|</span>
          <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
            <Lock className="w-3 h-3" />
            ZERO-TRUST ISOLATION
          </span>
        </div>

        {/* Right: Security Telemetry & Active Trust Badge */}
        <div className="flex items-center gap-3">
          {/* Trust Score Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-zinc-800 shadow-inner">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="flex items-baseline gap-1">
              <span className="text-[11px] text-slate-400">Trust:</span>
              <span className="font-mono font-bold text-emerald-400">
                {currentUser.trustScore.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">/100</span>
            </div>
          </div>

          {/* Quick Active Operator Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/60 border border-zinc-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-300 font-medium text-[11px] truncate max-w-[140px]">
              {currentUser.fullName}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}
