"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { 
  CalendarCheck, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  Fingerprint, 
  FileCheck2, 
  ArrowRight,
  Sparkles,
  Hourglass
} from "lucide-react";

export interface BookingDisplay {
  id: string;
  resourceId: string;
  resourceName: string;
  category: string;
  location: string;
  startTime: string;
  endTime: string;
  purpose: string;
  academicContext: string;
  priorityScore: number;
  explainability: string;
  status: "PENDING" | "APPROVED" | "WAITLISTED" | "ACTIVE" | "RETURNED" | "DISPUTED";
  disputeSummary?: string;
}

export default function BookingsPage() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<BookingDisplay[]>([
    {
      id: "book_mock_1",
      resourceId: "res_tormach_cnc",
      resourceName: "Tormach PCNC 1100 Milling Machine",
      category: "Subtractive CNC",
      location: "Fabrication Shop Bay 4",
      startTime: "Today, 02:00 PM",
      endTime: "Today, 04:00 PM",
      purpose: "Autonomous Rover Chassis Machining & Tolerance Verification",
      academicContext: "CAPSTONE",
      priorityScore: 61.1,
      explainability: "Priority: 61.10/100 | High Capstone Multiplier (1.5x) + Baseline Trust (96.5) with zero decay penalty.",
      status: "APPROVED"
    },
    {
      id: "book_mock_2",
      resourceId: "res_stratasys_3d",
      resourceName: "Stratasys F370 Industrial 3D Printer",
      category: "Additive 3D",
      location: "Rapid Prototyping Center",
      startTime: "Tomorrow, 10:00 AM",
      endTime: "Tomorrow, 12:00 PM",
      purpose: "High-Temperature Drone Aerodynamic Propeller Housing",
      academicContext: "COURSEWORK",
      priorityScore: 34.2,
      explainability: "Queue Rank #2: User accumulated 6.0 hours within rolling 7-day window. Diminishing marginal priority applied.",
      status: "WAITLISTED"
    }
  ]);

  useEffect(() => {
    fetch("/api/bookings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: BookingDisplay[] = data.map((b: any) => ({
            id: b.id,
            resourceId: b.resourceId,
            resourceName: b.resourceName || b.resource?.name || "Equipment Asset",
            category: b.category || b.resource?.category || "Lab Hardware",
            location: b.location || b.resource?.location || "Campus Bay",
            startTime: b.startTime ? new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "02:00 PM",
            endTime: b.endTime ? new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "04:00 PM",
            purpose: b.purpose || b.purposeDescription || "Academic Research",
            academicContext: b.academicContext || "RESEARCH",
            priorityScore: Number(b.priorityScore ?? b.calculatedPriorityScore ?? 50.0),
            explainability: b.explainability || b.explainabilityReceipt || "Standard algorithmic fair-share queue allocation.",
            status: b.status || "PENDING",
            disputeSummary: b.dispute?.claimDescription
          }));
          setBookings(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const getStatusBadge = (status: BookingDisplay["status"]) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Approved • Ready for Check-In
          </span>
        );
      case "ACTIVE":
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Active In-Use Session
          </span>
        );
      case "WAITLISTED":
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-violet-950 text-violet-300 border border-violet-800 flex items-center gap-1.5">
            <Hourglass className="w-3 h-3 text-violet-400" />
            Waitlisted • Fair-Share Queued
          </span>
        );
      case "DISPUTED":
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Condition Dispute Raised
          </span>
        );
      case "RETURNED":
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900 text-slate-400 border border-zinc-800">
            Returned Clean • Completed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800">
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
              BORROWER DESK
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Identity: {currentUser.fullName} ({currentUser.department})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
            My Reservations & Custody Handovers
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            All equipment bookings operate under cryptographic proof-of-condition and mathematical priority arbitration.
          </p>
        </div>

        <Link
          href="/resources"
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-md shadow-emerald-500/20"
        >
          <span>Book Another Asset</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="p-6 rounded-3xl bg-slate-900/80 border border-zinc-800 hover:border-zinc-700 transition-all shadow-xl space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(booking.status)}
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-cyan-400 border border-cyan-800/50">
                    {booking.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {booking.location}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 pt-1">
                  {booking.resourceName}
                </h3>
                <p className="text-xs text-slate-300">
                  <span className="font-semibold text-slate-400">Purpose: </span>
                  {booking.purpose}
                </p>
              </div>

              {/* Time Window */}
              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-semibold text-slate-200">
                  {booking.startTime}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Duration: 2 Hours
                </div>
              </div>
            </div>

            {/* Explainability / Math Receipt Box */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-zinc-800/80 text-xs font-mono space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-violet-400 font-bold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Priority Score: {Number(booking.priorityScore ?? 0).toFixed(1)} / 100
                </span>
                <span className="text-[10px] text-slate-500">
                  Context: {booking.academicContext}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {booking.explainability}
              </p>
            </div>

            {/* Action Bar based on state */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
              <div className="text-xs text-slate-500 font-mono">
                Booking ID: {booking.id}
              </div>

              <div className="flex items-center gap-3">
                {booking.status === "APPROVED" && (
                  <Link
                    href={`/bookings/${booking.id}/check-in`}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>Proceed to Digital Check-In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                {booking.status === "ACTIVE" && (
                  <Link
                    href={`/bookings/${booking.id}/check-out`}
                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>Initiate Return & Visual Diff</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                {booking.status === "WAITLISTED" && (
                  <div className="px-3.5 py-1.5 rounded-xl bg-violet-950/60 border border-violet-800/50 text-violet-300 text-xs font-mono">
                    Standby Queue Active • Auto-claim if slot freed
                  </div>
                )}

                {booking.status === "DISPUTED" && (
                  <Link
                    href={`/bookings/${booking.id}/check-out`}
                    className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 hover:bg-rose-900/60 font-semibold text-xs flex items-center gap-2 transition-all"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Review Dispute Dossier</span>
                  </Link>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
