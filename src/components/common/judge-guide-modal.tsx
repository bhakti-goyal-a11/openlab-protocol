"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { 
  Sparkles, 
  X, 
  ChevronRight, 
  ShieldAlert, 
  Calculator, 
  CheckCircle2, 
  Fingerprint, 
  GitCompare, 
  FileCheck2,
  Play,
  RotateCcw
} from "lucide-react";

export function JudgeGuideModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { switchPersona, currentUser } = useAuth();
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      step: 1,
      title: "Test Eligibility Gate",
      description: "Switch to Priya (Uncertified) -> Attempt CNC booking -> Verify deterministic hard-gate block.",
      icon: ShieldAlert,
      color: "text-amber-400 bg-amber-950/40 border-amber-800/60",
      actionLabel: "Set Priya & Open CNC Mill",
      action: () => {
        switchPersona("user_priya");
        router.push("/resources/res_tormach_cnc");
        setActiveStep(2);
      }
    },
    {
      step: 2,
      title: "Live Fair-Share Calculation",
      description: "Switch to Aarav (Certified) -> Open booking modal -> Inspect priority formula P(u,r,t) breakdown.",
      icon: Calculator,
      color: "text-violet-400 bg-violet-950/40 border-violet-800/60",
      actionLabel: "Set Aarav & View Math Meter",
      action: () => {
        switchPersona("user_aarav");
        router.push("/resources/res_tormach_cnc");
        setActiveStep(3);
      }
    },
    {
      step: 3,
      title: "Custodian 1-Click Approval",
      description: "Switch to Prof. Sharma -> Open Custodian Desk -> Review and 1-click approve pending request.",
      icon: CheckCircle2,
      color: "text-emerald-400 bg-emerald-950/40 border-emerald-800/60",
      actionLabel: "Set Sharma & Open Desk",
      action: () => {
        switchPersona("user_sharma");
        router.push("/manager/requests");
        setActiveStep(4);
      }
    },
    {
      step: 4,
      title: "Digital Handover Check-In",
      description: "Complete pre-flight physical checklist & generate SHA-256 baseline attestation hash.",
      icon: Fingerprint,
      color: "text-cyan-400 bg-cyan-950/40 border-cyan-800/60",
      actionLabel: "Open Digital Check-In",
      action: () => {
        switchPersona("user_aarav");
        router.push("/bookings");
        setActiveStep(5);
      }
    },
    {
      step: 5,
      title: "Visual Diff Return & Dispute",
      description: "Test side-by-side Visual Diff Inspector: compare baseline vs fractured collet & flag dispute.",
      icon: GitCompare,
      color: "text-rose-400 bg-rose-950/40 border-rose-800/60",
      actionLabel: "Open Return Inspection Diff",
      action: () => {
        switchPersona("user_sharma");
        router.push("/bookings");
        setActiveStep(6);
      }
    },
    {
      step: 6,
      title: "Cryptographic Ledger Check",
      description: "Switch to Dean Vandana -> Run ledger integrity check -> Assert zero tampering across SHA-256 chain.",
      icon: FileCheck2,
      color: "text-emerald-400 bg-emerald-950/40 border-emerald-800/60",
      actionLabel: "Open Audit Ledger",
      action: () => {
        switchPersona("user_vandana");
        router.push("/admin/audit");
      }
    }
  ];

  return (
    <>
      {/* Floating Glowing Trigger Pill */}
      <div className="fixed bottom-5 right-5 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-emerald-500/40 shadow-2xl backdrop-blur-xl group transition-all duration-300 glow-emerald hover:scale-105"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <Sparkles className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold tracking-tight">
            ⚡ Judge 3-Min Demo Walkthrough
          </span>
        </button>
      </div>

      {/* Expanded Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Judge Evaluation Control Suite
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Zero-Friction 1-Click Verification of All 7 Hackathon Criteria
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Steps Container */}
            <div className="p-6 overflow-y-auto space-y-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Active Evaluator:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {currentUser.fullName} ({currentUser.role})
                </span>
              </div>

              {steps.map((item) => {
                const Icon = item.icon;
                const isCurrent = activeStep === item.step;
                return (
                  <div
                    key={item.step}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrent
                        ? "bg-slate-800/90 border-emerald-500/50 shadow-md"
                        : "bg-slate-950/50 border-zinc-800/80 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-100">
                              Step {item.step}: {item.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          item.action();
                          setIsOpen(false);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-sm hover:scale-105"
                      >
                        <Play className="w-3 h-3 fill-slate-950" />
                        <span>{item.actionLabel}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-zinc-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono text-emerald-400">
                100% Pure Software • Zero IoT Dependencies
              </span>
              <button
                onClick={() => {
                  switchPersona("user_aarav");
                  setActiveStep(1);
                  router.push("/");
                  setIsOpen(false);
                }}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Demo Walkthrough</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

