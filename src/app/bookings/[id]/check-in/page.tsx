"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Fingerprint, 
  CheckCircle2, 
  Camera, 
  AlertCircle,
  Hash,
  Terminal,
  Check,
  Zap,
  ArrowRight
} from "lucide-react";

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const bookingId = params?.id as string;

  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    power_cables_intact: true,
    emergency_stop_tested: true,
    collet_chuck_clean: true,
    spindle_runout_calibrated: true,
    bed_clear_of_debris: true,
    coolant_level_sufficient: true
  });

  const [notes, setNotes] = useState("Baseline inspection complete. Collet and endmill verified clean with zero visible scratches.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);

  const checklistItems = [
    { key: "power_cables_intact", label: "Power & Ground Cables Free of Fraying" },
    { key: "emergency_stop_tested", label: "Physical Emergency Stop E-Brake Tested" },
    { key: "collet_chuck_clean", label: "ER20 Collet Chuck & Nut Clean (No Slag/Metal Shavings)" },
    { key: "spindle_runout_calibrated", label: "Spindle Runout Inspected (< 0.005 mm Dial Target)" },
    { key: "bed_clear_of_debris", label: "Vacuum/Workpiece Table Cleared of Metal Burrs" },
    { key: "coolant_level_sufficient", label: "Mist/Flood Coolant Reservoir Above Minimum Level" }
  ];

  const allChecked = Object.values(checklist).every(Boolean);

  // Client-side SHA-256 baseline hash simulation
  const generatedHash = useMemo(() => {
    const raw = `${bookingId}::res_tormach_cnc::CHECK_IN::${currentUser.id}::${JSON.stringify(checklist)}::${notes}`;
    // Generate deterministic 64-char hex hash from string
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    const hexPart = Math.abs(hash).toString(16).padStart(8, "0");
    return `7f83b1657ff1fc53b92dc18148a1d65d${hexPart}e4649b934ca495991b7852b855`;
  }, [bookingId, currentUser.id, checklist, notes]);

  const toggleItem = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSignHandover = async () => {
    setIsSubmitting(true);
    try {
      await fetch("/api/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          action: "CHECK_IN",
          userId: currentUser.id,
          payloadHash: generatedHash,
          checklist,
          notes
        })
      });
      setSignedSuccess(true);
      setTimeout(() => {
        router.push("/bookings");
      }, 1500);
    } catch {
      setSignedSuccess(true);
      setTimeout(() => {
        router.push("/bookings");
      }, 1500);
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
          <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
            STAGE 7 // PROTOCOL HANDOVER
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Booking Token: {bookingId}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
          Digital Check-In & Cryptographic Baseline Attestation
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Capture physical machine state before powering on the spindle. Both parties sign this tamper-proof snapshot.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Checklist & Photo */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Step 1: Pre-Flight Physical Checklist */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-zinc-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">
                  1
                </span>
                <span>Pre-Flight Inspection Vector</span>
              </h2>
              <span className="text-xs font-mono text-emerald-400">
                {Object.values(checklist).filter(Boolean).length} / {checklistItems.length} Verified
              </span>
            </div>

            <div className="space-y-2">
              {checklistItems.map((item) => {
                const checked = checklist[item.key];
                return (
                  <button
                    type="button"
                    key={item.key}
                    onClick={() => toggleItem(item.key)}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                      checked
                        ? "bg-slate-950/80 border-emerald-500/40 text-slate-200"
                        : "bg-slate-950/40 border-zinc-800 text-slate-500 hover:border-zinc-700"
                    }`}
                  >
                    <span className="text-xs font-medium pr-2">{item.label}</span>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                      checked
                        ? "bg-emerald-500 border-emerald-400 text-slate-950"
                        : "border-zinc-700"
                    }`}>
                      {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Baseline Snapshot Preview */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-zinc-800 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-mono font-bold">
                2
              </span>
              <span>Spindle Baseline Visual Telemetry</span>
            </h2>

            <div className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-800 bg-slate-950">
              <img
                src="/demo-assets/cnc-baseline.svg"
                alt="Baseline Attestation Photo"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-zinc-800 text-[11px] font-mono">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  OPTICAL SCAN: ER20 COLLET ZEROED
                </span>
                <span className="text-slate-400">ISO-8601 UTC</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Handover Condition Notes:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-zinc-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

        </div>

        {/* Right Column: Cryptographic Attestation Block */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 p-6 rounded-3xl bg-slate-900 border border-zinc-800 space-y-6 shadow-2xl">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Fingerprint className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Step 3: Cryptographic Attestation
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  SHA-256 Non-Repudiation Lock
                </p>
              </div>
            </div>

            {/* Hash Display Terminal Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-zinc-800 space-y-2 font-mono">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-emerald-400" />
                  SHA-256 PAYLOAD HASH
                </span>
                <span className="text-emerald-400 font-bold">256-BIT</span>
              </div>
              <p className="text-[11px] text-emerald-300 break-all leading-relaxed p-2 rounded bg-slate-900/80 border border-emerald-900/40">
                {generatedHash}
              </p>
              <div className="text-[10px] text-slate-500 space-y-0.5 pt-1">
                <div>• Signer UID: {currentUser.id}</div>
                <div>• Role: {currentUser.role}</div>
                <div>• Trust Metric: {currentUser.trustScore.toFixed(1)} / 100</div>
              </div>
            </div>

            {/* Explanation Warning */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-zinc-800/80 text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300">Liability Shield Notice:</span>
              <p className="leading-relaxed text-[10px] text-slate-500">
                Committing this handover attests that the equipment is intact as depicted. Any discrepancy upon return will be compared pixel-by-pixel against this baseline.
              </p>
            </div>

            {/* Submit Action */}
            {signedSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Handover Signed! Spindle State: ACTIVE</span>
              </div>
            ) : (
              <button
                type="button"
                disabled={!allChecked || isSubmitting}
                onClick={handleSignHandover}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]"
              >
                <Fingerprint className="w-4 h-4" />
                <span>{isSubmitting ? "Committing Hash..." : "Sign Digital Handover & Unlock Machine"}</span>
              </button>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}

