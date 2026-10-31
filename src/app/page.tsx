"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { 
  ShieldCheck, 
  Cpu, 
  Scale, 
  ArrowRight, 
  Activity, 
  CheckCircle, 
  Zap, 
  Lock, 
  Building2, 
  DollarSign, 
  Clock, 
  Fingerprint,
  Sparkles
} from "lucide-react";

export default function HomePage() {
  const { currentUser, switchPersona } = useAuth();

  const stats = [
    {
      label: "Active Labs Connected",
      value: "4 Facilities",
      sub: "Mechanical, CS, Physics, FabLab",
      icon: Building2,
      color: "text-emerald-400",
      bg: "bg-emerald-950/40 border-emerald-800/50"
    },
    {
      label: "Shared Assets Value",
      value: "$240,000+",
      sub: "CNC, GPU Nodes, 3D Printers, DSOs",
      icon: DollarSign,
      color: "text-cyan-400",
      bg: "bg-cyan-950/40 border-cyan-800/50"
    },
    {
      label: "Idle Capacity Unlocked",
      value: "71.4%",
      sub: "Pre-Thesis Crunch Recovery Rate",
      icon: Clock,
      color: "text-violet-400",
      bg: "bg-violet-950/40 border-violet-800/50"
    },
    {
      label: "Tamper-Proof Audit Chain",
      value: "100% Verified",
      sub: "SHA-256 Sequential Block Hash",
      icon: Fingerprint,
      color: "text-emerald-400",
      bg: "bg-emerald-950/40 border-emerald-800/50"
    }
  ];

  const personasQuickSelect = [
    {
      id: "user_aarav",
      role: "Student Innovator",
      name: "Aarav Verma",
      status: "Certified Maker",
      desc: "Has completed safety & CNC Level 1 training. Priority score unlocked.",
      actionText: "Browse Catalog as Aarav",
      href: "/resources",
      accent: "border-emerald-500/30 hover:border-emerald-500/60"
    },
    {
      id: "user_priya",
      role: "Uncertified Student",
      name: "Priya Nair",
      status: "Novice Requester",
      desc: "Lacks CNC certification. Test the deterministic gate blocking logic.",
      actionText: "Test Hard Gate as Priya",
      href: "/resources/res_tormach_cnc",
      accent: "border-amber-500/30 hover:border-amber-500/60"
    },
    {
      id: "user_sharma",
      role: "Lab Custodian & PI",
      name: "Prof. Rajesh Sharma",
      status: "Facility Owner",
      desc: "Manages machine quotas, 1-click booking approvals, and return diffs.",
      actionText: "Open Custodian Desk",
      href: "/manager/requests",
      accent: "border-cyan-500/30 hover:border-cyan-500/60"
    },
    {
      id: "user_vandana",
      role: "Institutional Auditor",
      name: "Dean Vandana Rao",
      status: "Governance Provost",
      desc: "Full audit visibility into cross-department CapEx and ledger integrity.",
      actionText: "Verify Audit Ledger",
      href: "/admin/audit",
      accent: "border-violet-500/30 hover:border-violet-500/60"
    }
  ];

  return (
    <div className="space-y-12 pb-12">
      
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-zinc-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>100% Pure-Software Governance Protocol</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100 leading-[1.15]">
            Decentralized Trust Layer for Institutional Hardware & Specialized Spaces
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Resolving the institutional sharing crisis at the workflow, identity, and algorithmic governance layer. 
            Replace gatekeeping fear with <span className="text-emerald-400 font-medium">cryptographic condition handovers</span>, <span className="text-violet-400 font-medium">anti-monopoly fair queues</span>, and an <span className="text-cyan-400 font-medium">immutable audit ledger</span>.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/resources"
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
            >
              <Cpu className="w-4 h-4" />
              <span>Explore Campus Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/admin/audit"
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-zinc-800 hover:border-zinc-700 font-semibold text-sm flex items-center gap-2 transition-all"
            >
              <Fingerprint className="w-4 h-4 text-emerald-400" />
              <span>Inspect Cryptographic Ledger</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Telemetry Pulse Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-mono uppercase tracking-wider text-slate-400 font-bold">
              System Telemetry & Institutional Performance
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">Node Status: HEALTHY</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="p-5 rounded-2xl bg-slate-900/70 border border-zinc-800/80 backdrop-blur-md space-y-3 relative overflow-hidden group hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">{stat.label}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${stat.bg}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight text-slate-100 font-mono">
                    {stat.value}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{stat.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Testing Evaluation Lanes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Simulated Evaluation Lanes</span>
            </h2>
            <p className="text-xs text-slate-400">
              Select any stakeholder persona to instantly experience the workflow from their perspective.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {personasQuickSelect.map((p) => {
            const isCurrent = currentUser.id === p.id;
            return (
              <div
                key={p.id}
                className={`p-5 rounded-2xl bg-slate-900/60 border ${p.accent} flex flex-col justify-between transition-all ${
                  isCurrent ? "ring-2 ring-emerald-500/50 bg-slate-800/50" : ""
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {p.role}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{p.name}</h3>
                    <span className="text-xs text-emerald-400 font-mono">{p.status}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      switchPersona(p.id);
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isCurrent
                        ? "bg-slate-800 text-slate-200 border border-zinc-700"
                        : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    <span>{isCurrent ? "Persona Active" : p.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}

