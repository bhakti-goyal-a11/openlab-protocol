"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { ShieldCheck, ChevronDown, Check, UserCheck, AlertTriangle } from "lucide-react";

export function RoleSwitcher() {
  const { currentUser, allPersonas, switchPersona } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "STUDENT":
        return <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">Student</span>;
      case "LAB_MANAGER":
        return <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">Custodian</span>;
      case "ADMIN":
        return <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-950 text-violet-400 border border-violet-800">Auditor</span>;
      default:
        return null;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-zinc-800 hover:border-zinc-700 transition-all duration-200 text-left shadow-sm group"
        aria-expanded={isOpen}
      >
        <div className="relative">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.fullName}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/30 group-hover:ring-emerald-500/60 transition-all"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
        </div>
        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200 leading-none">
              {currentUser.fullName}
            </span>
            {getRoleBadge(currentUser.role)}
          </div>
          <span className="text-[11px] text-slate-400 leading-none block mt-1">
            {currentUser.tagline.split("•")[0]?.trim()}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900/95 border border-zinc-800 shadow-2xl backdrop-blur-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-zinc-800/80 mb-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Persona Switcher (Demo Mode)
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                Instant State Sync
              </span>
            </div>
          </div>

          <div className="space-y-1">
            {allPersonas.map((persona) => {
              const isSelected = persona.id === currentUser.id;
              return (
                <button
                  key={persona.id}
                  onClick={() => {
                    switchPersona(persona.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-xl transition-all text-left ${
                    isSelected
                      ? "bg-slate-800/90 border border-emerald-500/40 shadow-inner"
                      : "hover:bg-slate-800/50 border border-transparent"
                  }`}
                >
                  <img
                    src={persona.avatarUrl}
                    alt={persona.fullName}
                    className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-100 truncate">
                        {persona.fullName}
                      </span>
                      {getRoleBadge(persona.role)}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {persona.department}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        Trust: {persona.trustScore}
                      </span>
                      <span className="text-[10px] text-slate-500">•</span>
                      <span className="text-[10px] text-slate-400 truncate font-mono">
                        {persona.badges.length} Badges
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 self-center" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-zinc-800/80 px-3 py-1.5 text-[11px] text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Switching persona alters all permissions instantly.</span>
          </div>
        </div>
      )}
    </div>
  );
}

