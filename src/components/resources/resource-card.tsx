"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { EligibilityBadge } from "./eligibility-badge";
import { 
  MapPin, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle,
  Eye
} from "lucide-react";

export interface ResourceData {
  id: string;
  name: string;
  category: string;
  custodianId: string;
  location: string;
  description: string;
  imageUrl: string;
  requiredBadges: string[];
  supervisorRequired: boolean;
  maxWeeklyHoursPerUser: number;
  slotDurationMinutes: number;
  isAvailable: boolean;
}

interface ResourceCardProps {
  resource: ResourceData;
  onBookClick?: (resource: ResourceData) => void;
}

export function ResourceCard({ resource, onBookClick }: ResourceCardProps) {
  const { currentUser } = useAuth();

  const missingBadges = resource.requiredBadges.filter(
    (b) => !currentUser.badges.includes(b)
  );
  const isEligible = missingBadges.length === 0;

  return (
    <div className="group rounded-2xl bg-slate-900/80 border border-zinc-800/80 hover:border-zinc-700 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-emerald-500/5">
      
      {/* Visual Asset Top Preview */}
      <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden border-b border-zinc-800/80">
        <img
          src={resource.imageUrl}
          alt={resource.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // Fallback to svg demo asset if file missing
            (e.target as HTMLImageElement).src = "/demo-assets/cnc-baseline.svg";
          }}
        />

        {/* Category Chip */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-950/90 text-cyan-400 border border-cyan-800/50 backdrop-blur-md">
            {resource.category}
          </span>
        </div>

        {/* Status Pill */}
        <div className="absolute top-3 right-3">
          {resource.isAvailable ? (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950/90 text-emerald-400 border border-emerald-800/50 backdrop-blur-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Available
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-950/90 text-rose-400 border border-rose-800/50 backdrop-blur-md">
              In Use / Reserved
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{resource.location}</span>
          </div>

          <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
            {resource.name}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {resource.description}
          </p>
        </div>

        {/* Badges & Quota Constraints */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/80 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              Slot Window:
            </span>
            <span className="font-mono text-slate-200">
              {resource.slotDurationMinutes / 60} hrs ({resource.maxWeeklyHoursPerUser}h/wk max)
            </span>
          </div>

          {/* Dynamic Eligibility Indicator */}
          <div className="pt-1">
            <EligibilityBadge
              requiredBadges={resource.requiredBadges}
              userBadges={currentUser.badges}
              supervisorRequired={resource.supervisorRequired}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-3 flex items-center gap-2">
          <Link
            href={`/resources/${resource.id}`}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-zinc-700/60"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Specifications</span>
          </Link>

          {isEligible ? (
            <button
              onClick={() => onBookClick && onBookClick(resource)}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 hover:scale-105"
            >
              <span>Book Slot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              disabled
              title={`Access locked: You must complete training for [${missingBadges.join(", ")}] before booking.`}
              className="flex-1 py-2 px-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-400/80 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed opacity-75"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Gate Locked</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

