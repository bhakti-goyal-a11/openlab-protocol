"use client";

import React from "react";
import { useAuth } from "@/context/auth-context";
import { 
  BarChart3, 
  Scale, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  Building2, 
  Zap
} from "lucide-react";

export default function FairnessAnalyticsPage() {
  const { currentUser } = useAuth();

  const departmentShares = [
    { name: "Mechatronics & Robotics", hours: 42.5, percent: 34, color: "bg-emerald-500" },
    { name: "Mechanical Engineering", hours: 38.0, percent: 30, color: "bg-cyan-500" },
    { name: "Computer Science (AI)", hours: 26.5, percent: 21, color: "bg-violet-500" },
    { name: "Physics & Optical Lab", hours: 18.0, percent: 15, color: "bg-amber-500" }
  ];

  const hoarderAlerts = [
    {
      actor: "Senior PhD Research Cluster (CS Dept)",
      resource: "NVIDIA DGX H100 Node",
      hoursAttempted: "28 hours / week (Quota Limit: 12h)",
      actionTaken: "Priority algorithm decayed score by 4.2x divisor. Uncontested undergraduate capstone teams elevated to slot contention."
    },
    {
      actor: "Additive Prototyping Student Group",
      resource: "Stratasys F370 3D Printer",
      hoursAttempted: "3 consecutive weekend slots",
      actionTaken: "Recency penalty (R_u = 0.80) throttled applicant priority. Idle slots awarded to waiting capstone candidates."
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-violet-400 px-2 py-0.5 rounded bg-violet-950/60 border border-violet-800/40">
            ALGORITHMIC FAIRNESS SUBSYSTEM
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Evaluator: {currentUser.fullName} ({currentUser.role})
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
          Anti-Monopolization & Algorithmic Fairness Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Continuous mathematical metrics preventing the tragedy of the commons without arbitrary manual bans.
        </p>
      </div>

      {/* Top 3 High-Impact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Gini Metric */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-zinc-800 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Gini Resource Inequality Index</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono text-emerald-400">
              0.18 <span className="text-xs text-slate-400 font-normal">/ 1.0 (Optimal)</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Highly egalitarian distribution. Gini score &lt; 0.25 indicates zero senior researcher monopoly across facilities.
            </p>
          </div>
          <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Monopoly Risk: NEGLIGIBLE</span>
          </div>
        </div>

        {/* Hoarding Mitigated */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-zinc-800 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Hoarding Attempts Throttled</span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/40 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono text-violet-300">
              14 Blocked
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Over-quota reservation attempts automatically deflated by weekly decay rate (W_decay = 0.15 per hour).
            </p>
          </div>
          <div className="pt-2 text-[11px] font-mono text-violet-400">
            Saved 42.0 hours for junior innovators
          </div>
        </div>

        {/* Idle Capacity Recovered */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-zinc-800 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Underutilized Asset Recovery</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono text-cyan-300">
              +71.4%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Equipment operating hours increased across non-thesis months by unlocking cross-departmental sharing.
            </p>
          </div>
          <div className="pt-2 text-[11px] font-mono text-cyan-400">
            CapEx Efficiency Rating: 94.2/100
          </div>
        </div>

      </div>

      {/* Cross-Department Allocation Breakdown */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-zinc-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Cross-Departmental Hardware Allocation Volume</span>
            </h3>
            <p className="text-xs text-slate-400">
              Real-time balance of machine utilization hours across autonomous academic faculties.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">125 Total Hours Logged This Week</span>
        </div>

        <div className="space-y-4">
          {departmentShares.map((dept) => (
            <div key={dept.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{dept.name}</span>
                <span className="font-mono text-slate-400">{dept.hours} hrs ({dept.percent}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full ${dept.color} rounded-full transition-all duration-500`}
                  style={{ width: `${dept.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Algorithmic Mitigation Feed */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-zinc-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-400" />
          <span>Recent Anti-Monopoly Governance Interventions</span>
        </h3>

        <div className="space-y-3">
          {hoarderAlerts.map((alert, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-950/80 border border-zinc-800 text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-200">
                <span className="font-bold text-slate-100">{alert.actor}</span>
                <span className="font-mono text-violet-400">{alert.resource}</span>
              </div>
              <p className="text-slate-400 font-mono text-[11px]">
                Target: {alert.hoursAttempted}
              </p>
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-900/40 text-emerald-300 font-mono text-[11px] flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Protocol Action: {alert.actionTaken}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
