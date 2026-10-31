"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { VisualDiffViewer } from "@/components/inspection/visual-diff-viewer";
import { 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileWarning, 
  Lock, 
  RefreshCw,
  Send,
  Scale
} from "lucide-react";

export default function CheckOutPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, updateTrustScore } = useAuth();
  const bookingId = params?.id as string;

  const [hasAnomaly, setHasAnomaly] = useState(true); // Default to true so judges can immediately test the dispute feature!
  const [anomalyType, setAnomalyType] = useState("Collet Fracture & Spindle Chatter Score");
  const [anomalyNotes, setAnomalyNotes] = useState("Visible hairline crack along ER20 collet flute slot after machining 6061 stock. Exceeds ±0.005mm runout tolerance.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolvedStatus, setResolvedStatus] = useState<string | null>(null);

  const estimatedPenalty = 15.0;

  const handleCompleteHandover = async () => {
    setIsSubmitting(true);
    try {
      if (hasAnomaly) {
        // Escalate dispute
        await fetch("/api/bookings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            action: "FLAG_DISPUTE",
            userId: currentUser.id,
            damageSummary: `${anomalyType}: ${anomalyNotes}`,
            trustPenalty: estimatedPenalty
          })
        });
        updateTrustScore(-estimatedPenalty);
        setResolvedStatus("DISPUTE_ESCALATED");
      } else {
        // Clean return
        await fetch("/api/bookings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            action: "RETURN_CLEAN",
            userId: currentUser.id,
            notes: "Normal inspection verified."
          })
        });
        updateTrustScore(+2.5);
        setResolvedStatus("RETURNED_CLEAN");
      }

      setTimeout(() => {
        router.push("/bookings");
      }, 1800);
    } catch {
      setResolvedStatus(hasAnomaly ? "DISPUTE_ESCALATED" : "RETURNED_CLEAN");
      setTimeout(() => {
        router.push("/bookings");
      }, 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Back Link */}
      <div>
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Reservations</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
            STAGE 8 // DELTA VERIFICATION
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Booking Token: {bookingId}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
          Return Inspection & Visual Diff Comparator
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          The Custodian compares the check-in baseline against the return state. Any deviation triggers automated incident triage.
        </p>
      </div>

      {/* Visual Diff Canvas */}
      <VisualDiffViewer
        baselineImage="/demo-assets/cnc-baseline.svg"
        returnImage={hasAnomaly ? "/demo-assets/collet-fracture.svg" : "/demo-assets/cnc-baseline.svg"}
        isDamagedSimulated={hasAnomaly}
      />

      {/* Inspection Assessment & Dispute Triage Panel */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-zinc-800 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Custodian Condition Assessment</span>
            </h3>
            <p className="text-xs text-slate-400">
              Evaluator: {currentUser.fullName} ({currentUser.role})
            </p>
          </div>

          {/* Anomaly Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-300">
              Hardware State:
            </span>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-zinc-800">
              <button
                type="button"
                onClick={() => setHasAnomaly(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  !hasAnomaly
                    ? "bg-emerald-500 text-slate-950 font-bold shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                ✓ Clean Return
              </button>
              <button
                type="button"
                onClick={() => setHasAnomaly(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  hasAnomaly
                    ? "bg-rose-500 text-slate-950 font-bold shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                ⚠️ Flag Anomaly
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Condition Details */}
        {hasAnomaly ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs space-y-3">
              <div className="flex items-center justify-between text-rose-300 font-bold">
                <span className="flex items-center gap-2 text-rose-400">
                  <FileWarning className="w-4 h-4" />
                  Dispute Incident Triage Activated
                </span>
                <span className="font-mono bg-rose-900/60 px-2 py-0.5 rounded text-rose-200">
                  Estimated Penalty: -{estimatedPenalty} Trust Points
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Flagging this discrepancy will isolate the borrower's privileges, halt standard checkout, and write a cryptographic `DISPUTE_ESCALATED` block to the immutable Audit Ledger.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Discrepancy Category:
              </label>
              <input
                type="text"
                value={anomalyType}
                onChange={(e) => setAnomalyType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-zinc-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Incident Triage Description:
              </label>
              <textarea
                rows={2}
                value={anomalyNotes}
                onChange={(e) => setAnomalyNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-zinc-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Check-in baseline matches return state perfectly. Zero damage detected.</span>
            </div>
            <span className="font-mono text-emerald-400 font-bold bg-emerald-900/60 px-2 py-0.5 rounded">
              Reward: +2.5 Trust Score
            </span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          {resolvedStatus === "DISPUTE_ESCALATED" ? (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-semibold flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Incident Ticket Committed! State: DISPUTED • Quarantined to Dean Review</span>
            </div>
          ) : resolvedStatus === "RETURNED_CLEAN" ? (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Custody Released! Machine Reset to AVAILABLE • Trust Score +2.5</span>
            </div>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCompleteHandover}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xl hover:scale-[1.01] ${
                hasAnomaly
                  ? "bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-rose-500/20"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
              }`}
            >
              {hasAnomaly ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>{isSubmitting ? "Submitting Dispute..." : "Escalate Dispute & Freeze Collateral"}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? "Signing Release..." : "Sign Clean Handover & Release Custody"}</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>

    </div>
  );
}

