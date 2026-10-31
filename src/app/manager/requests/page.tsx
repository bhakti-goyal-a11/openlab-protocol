"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { 
  Inbox, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  Calculator, 
  UserCheck, 
  FileText,
  Check,
  X,
  MapPin,
  Calendar
} from "lucide-react";

interface PendingRequest {
  id: string;
  applicantName: string;
  applicantRole: string;
  applicantDepartment: string;
  applicantTrustScore: number;
  applicantBadges: string[];
  resourceName: string;
  resourceCategory: string;
  location: string;
  requestedSlot: string;
  purpose: string;
  academicContext: string;
  priorityScore: number;
  hasConflict: boolean;
  conflictNotes?: string;
}

export default function ManagerRequestsPage() {
  const { currentUser } = useAuth();

  const [requests, setRequests] = useState<PendingRequest[]>([
    {
      id: "req_incoming_1",
      applicantName: "Aarav Verma",
      applicantRole: "STUDENT",
      applicantDepartment: "Mechatronics & Robotics",
      applicantTrustScore: 96.5,
      applicantBadges: ["BADGE_CNC_1", "BADGE_SAFETY_101", "BADGE_3D_PRINT_1"],
      resourceName: "Tormach PCNC 1100 Milling Machine",
      resourceCategory: "Subtractive CNC",
      location: "Fabrication Shop Bay 4",
      requestedSlot: "Today, 02:00 PM - 04:00 PM",
      purpose: "Autonomous Rover Chassis Machining & Tolerance Verification (Capstone milestone in 14 days)",
      academicContext: "CAPSTONE",
      priorityScore: 61.1,
      hasConflict: false
    },
    {
      id: "req_incoming_2",
      applicantName: "Vikram Malhotra",
      applicantRole: "PhD Researcher",
      applicantDepartment: "Mechanical Engineering",
      applicantTrustScore: 88.0,
      applicantBadges: ["BADGE_CNC_1", "BADGE_SAFETY_101"],
      resourceName: "Tormach PCNC 1100 Milling Machine",
      resourceCategory: "Subtractive CNC",
      location: "Fabrication Shop Bay 4",
      requestedSlot: "Today, 02:00 PM - 04:00 PM (Contested Slot)",
      purpose: "Preliminary tooling jig setup for thesis batch testing",
      academicContext: "THESIS",
      priorityScore: 32.4,
      hasConflict: true,
      conflictNotes: "Contested Slot: User Vikram has logged 14 hours this week (high decay drag). Aarav Verma wins contention via priority score (61.1 vs 32.4)."
    }
  ]);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<PendingRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("Conflicting capstone priority with higher fair-share queue score.");
  const [notification, setNotification] = useState<string | null>(null);

  const handleApprove = (reqId: string) => {
    setRequests(prev => prev.filter(r => r.id !== reqId));
    setNotification(`✓ Request ${reqId} Approved! Digital Check-In token unlocked for applicant.`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleReject = () => {
    if (activeRequest) {
      setRequests(prev => prev.filter(r => r.id !== activeRequest.id));
      setNotification(`Request ${activeRequest.id} declined with structured reason logged to Audit Ledger.`);
      setRejectModalOpen(false);
      setActiveRequest(null);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
              FACILITY GOVERNANCE DESK
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Custodian: {currentUser.fullName} ({currentUser.department})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
            Inbound Request Triage & Conflict Inbox
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Review applicant qualifications, automated conflict detection, and mathematical priority derivations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 px-3.5 py-2 rounded-xl border border-zinc-800">
          <Inbox className="w-4 h-4 text-emerald-400" />
          <span>Pending Approvals: {requests.length}</span>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-zinc-800 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-200">Inbox Completely Cleared</h3>
            <p className="text-xs text-slate-400">All inbound equipment reservations have been evaluated and committed.</p>
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className={`p-6 rounded-3xl bg-slate-900 border transition-all space-y-4 shadow-xl ${
                req.hasConflict
                  ? "border-amber-700/60 bg-slate-900/90"
                  : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              
              {/* Top Row: Applicant & Resource Info */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-base text-slate-100">
                      {req.applicantName}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      ({req.applicantDepartment})
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Trust: {req.applicantTrustScore}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-2 pt-0.5">
                    <span className="font-semibold text-slate-200">{req.resourceName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-slate-500">
                      <MapPin className="w-3 h-3" />
                      {req.location}
                    </span>
                  </div>

                  {/* Certified Badges Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {req.applicantBadges.map((badge) => (
                      <span
                        key={badge}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-cyan-400 border border-cyan-800/40"
                      >
                        ✓ {badge}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Priority Score Stamp */}
                <div className="text-right shrink-0">
                  <div className="px-3 py-1.5 rounded-xl bg-violet-950/70 border border-violet-800/60 inline-block text-right">
                    <div className="text-[10px] font-mono uppercase text-violet-400">
                      Fair-Share Score
                    </div>
                    <div className="text-lg font-bold font-mono text-violet-200">
                      {req.priorityScore.toFixed(1)} <span className="text-xs text-violet-400 font-normal">/100</span>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    {req.requestedSlot}
                  </div>
                </div>
              </div>

              {/* Purpose & Justification */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-zinc-800/80 text-xs text-slate-300">
                <span className="font-semibold text-slate-400">Purpose Statement: </span>
                {req.purpose}
              </div>

              {/* Conflict Warning (if contested slot) */}
              {req.hasConflict && (
                <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold">Algorithmic Conflict Detected</span>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      {req.conflictNotes}
                    </p>
                  </div>
                </div>
              )}

              {/* Custodian Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setActiveRequest(req);
                    setRejectModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-zinc-700 hover:border-rose-800/60 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject with Justification</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(req.id)}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 hover:scale-105"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>1-Click Custodian Approval</span>
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Structured Rejection Modal */}
      {rejectModalOpen && activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-zinc-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>Mandatory Structured Rejection Rationale</span>
            </h3>
            <p className="text-xs text-slate-400">
              Protocol rules forbid arbitrary rejection. Enter the auditable justification that will be sent to {activeRequest.applicantName} and written to the immutable ledger.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-zinc-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

