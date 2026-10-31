"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { 
  ShieldCheck, 
  Cpu, 
  CalendarCheck, 
  Inbox, 
  ScrollText, 
  BarChart3, 
  Terminal,
  Activity,
  ChevronDown,
  Check,
  Lock,
  Radio,
  Fingerprint,
  Sparkles,
  Layers,
  Menu,
  X,
  AlertOctagon,
  KeyRound
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, allPersonas, switchPersona } = useAuth();
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    {
      name: "Command Center",
      href: "/",
      icon: Terminal,
      category: "OPERATIONS",
      badge: "LIVE"
    },
    {
      name: "Equipment & Spaces",
      href: "/resources",
      icon: Cpu,
      category: "OPERATIONS",
      badge: "4 BAYS"
    },
    {
      name: "My Reservations",
      href: "/bookings",
      icon: CalendarCheck,
      category: "OPERATIONS",
      badge: "PASSES"
    },
    {
      name: "Custodian Triage Desk",
      href: "/manager/requests",
      icon: Inbox,
      category: "GOVERNANCE",
      badge: "PENDING",
      highlight: true
    },
    {
      name: "Audit Ledger Chain",
      href: "/admin/audit",
      icon: ScrollText,
      category: "SECURITY & COMPLIANCE",
      badge: "SHA-256"
    },
    {
      name: "Fairness Analytics",
      href: "/admin/fairness",
      icon: BarChart3,
      category: "SECURITY & COMPLIANCE",
      badge: "GINI 0.18"
    },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "STUDENT":
        return <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono">Student</span>;
      case "LAB_MANAGER":
        return <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">Custodian</span>;
      case "ADMIN":
        return <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-violet-950 text-violet-400 border border-violet-800/60 font-mono">Auditor</span>;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile Top Bar (Only visible on small screens < 1024px) */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-slate-950/95 border-b border-zinc-800/80 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-100">OpenLab</span>
              <span className="text-[9px] font-mono font-bold text-emerald-400 px-1 py-0.2 rounded bg-emerald-950 border border-emerald-800">
                // SECURE
              </span>
            </div>
          </div>
        </Link>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-900 border border-zinc-800 text-slate-300 hover:text-white"
          aria-label="Toggle Navigation Sidebar"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm"
        />
      )}

      {/* Fixed High-Security Sidebar Rail */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 border-r border-zinc-800/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand & Security Status Enclave */}
        <div className="p-4 border-b border-zinc-800/80 bg-slate-950/90">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-500 p-0.5 shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-slate-100">OpenLab</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 px-1 py-0.2 rounded bg-emerald-950/80 border border-emerald-500/40">
                    // SHIELD-OS
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wide block">
                  Institutional Trust Engine
                </span>
              </div>
            </Link>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Air-Gap / Zero-Trust Status Meter */}
          <div className="mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-zinc-800/90 text-xs">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                <span className="text-[11px] font-mono font-bold text-slate-200">AIR-GAP DEFENSE:</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                ACTIVE
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>SHA-256 LEDGER: SYNCED</span>
              <span className="text-emerald-400">0 FAULTS</span>
            </div>
          </div>
        </div>

        {/* Identity & Clearance Control Panel */}
        <div className="p-4 border-b border-zinc-800/80 bg-slate-950/60">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-emerald-400" />
              Active Operator Clearance
            </span>
            <span className="text-[9px] text-emerald-400 font-mono">LEVEL 4</span>
          </div>

          {/* Active Persona Card */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-zinc-800 hover:border-zinc-700 transition-all">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/40"
                />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-slate-100 truncate">
                    {currentUser.fullName}
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {getRoleBadge(currentUser.role)}
                  <span className="text-[10px] text-slate-400 truncate">
                    {currentUser.department}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Trust Index Bar */}
            <div className="mt-3 pt-2.5 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Trust Index
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {currentUser.trustScore.toFixed(1)} / 100
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, currentUser.trustScore)}%` }}
                />
              </div>
            </div>

            {/* Toggle Persona Switcher Button */}
            <button
              type="button"
              onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
              className="mt-2.5 w-full py-1.5 px-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-zinc-800 text-slate-300 text-[11px] font-semibold flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Switch Persona (Demo)</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${personaMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Expandable Persona Switcher */}
            {personaMenuOpen && (
              <div className="mt-2 space-y-1.5 pt-2 border-t border-zinc-800/80 animate-in fade-in duration-150">
                {allPersonas.map((persona) => {
                  const isSelected = persona.id === currentUser.id;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => {
                        switchPersona(persona.id);
                        setPersonaMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${
                        isSelected
                          ? "bg-emerald-950/60 border border-emerald-500/50 text-slate-100"
                          : "hover:bg-slate-800/60 border border-transparent text-slate-300"
                      }`}
                    >
                      <img
                        src={persona.avatarUrl}
                        alt={persona.fullName}
                        className="w-7 h-7 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold truncate">
                            {persona.fullName}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </div>
                        <span className="text-[9px] text-slate-400 block truncate font-mono">
                          {persona.role} • Trust {persona.trustScore}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Primary Navigation Rail */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-4">
          <div>
            <span className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block mb-1.5">
              Protocol Modules
            </span>
            <div className="space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40 shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive 
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                          : "bg-slate-900 text-slate-400 group-hover:text-slate-200 border border-zinc-800"
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{link.name}</span>
                    </div>

                    {link.badge && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                        link.highlight
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : isActive
                          ? "bg-emerald-950 text-emerald-400 border-emerald-800/60"
                          : "bg-slate-900 text-slate-500 border-zinc-800"
                      }`}>
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Security Telemetry Footer Dock */}
        <div className="p-3 border-t border-zinc-800/80 bg-slate-950/90 text-[10px] font-mono space-y-2">
          <div className="p-2 rounded-xl bg-slate-900/80 border border-zinc-800 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              NODE INTEGRITY
            </span>
            <span className="text-emerald-400 font-bold">100% VERIFIED</span>
          </div>
          <div className="px-2 text-slate-500 flex items-center justify-between text-[9px]">
            <span>TLS 1.3 // SECURE</span>
            <span>PURE SOFTWARE</span>
          </div>
        </div>

      </aside>
    </>
  );
}

