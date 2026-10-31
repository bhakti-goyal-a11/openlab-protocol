"use client";

import React from "react";
import { CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react";

interface EligibilityBadgeProps {
  requiredBadges: string[];
  userBadges: string[];
  supervisorRequired?: boolean;
}

export function EligibilityBadge({
  requiredBadges,
  userBadges,
  supervisorRequired = false,
}: EligibilityBadgeProps) {
  const missing = requiredBadges.filter((b) => !userBadges.includes(b));
  const isEligible = missing.length === 0;

  if (!isEligible) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-mono font-medium shadow-sm">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span className="truncate">⚠️ Missing: {missing.join(", ")}</span>
      </div>
    );
  }

  if (supervisorRequired) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-300 text-xs font-mono font-medium shadow-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>✓ Eligible (Supervisor Required)</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-mono font-medium shadow-sm">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      <span>✓ All Prerequisites Met</span>
    </div>
  );
}

