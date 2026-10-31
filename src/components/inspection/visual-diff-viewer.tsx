"use client";

import React, { useState } from "react";
import { Sliders, Columns, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";

interface VisualDiffViewerProps {
  baselineImage: string;
  returnImage: string;
  baselineTimestamp?: string;
  returnTimestamp?: string;
  isDamagedSimulated?: boolean;
}

export function VisualDiffViewer({
  baselineImage,
  returnImage,
  baselineTimestamp = "Today, 02:00 PM UTC",
  returnTimestamp = "Today, 04:00 PM UTC",
  isDamagedSimulated = false,
}: VisualDiffViewerProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const [viewMode, setViewMode] = useState<"slider" | "side-by-side">("slider");

  return (
    <div className="rounded-3xl bg-slate-900 border border-zinc-800 overflow-hidden shadow-2xl space-y-4 p-5">
      
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Side-by-Side Optical Visual Diff Inspector</span>
          </h3>
          <p className="text-[11px] text-slate-400 font-mono">
            Direct comparison between Check-In Baseline vs. Check-Out Return State
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("slider")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              viewMode === "slider"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("side-by-side")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              viewMode === "side-by-side"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Dual Columns</span>
          </button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      {viewMode === "slider" ? (
        <div className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-800 bg-slate-950 select-none group">
          {/* Background image (Return State) */}
          <img
            src={returnImage}
            alt="Return State"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Foreground image (Baseline) clipped by slider */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={baselineImage}
              alt="Baseline State"
              className="absolute inset-0 w-full h-full object-cover max-w-none"
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          {/* Slider Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)] z-10 cursor-ew-resize flex items-center justify-center"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="w-6 h-6 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-[10px] text-cyan-400 shadow-lg">
              ↔
            </div>
          </div>

          {/* Overlay Labels */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-slate-950/90 text-emerald-400 border border-emerald-800/60 backdrop-blur-md">
              BASELINE SNAPSHOT ({baselineTimestamp})
            </span>
          </div>
          <div className="absolute top-3 right-3 z-20 pointer-events-none">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-slate-950/90 text-rose-400 border border-rose-800/60 backdrop-blur-md">
              RETURN SNAPSHOT ({returnTimestamp})
            </span>
          </div>

          {/* Interactive Range Input Overlay */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-ew-resize z-30 w-full h-full"
            aria-label="Visual Diff Slider"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Left Column: Baseline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Check-In Baseline
              </span>
              <span className="text-[10px] text-slate-500">{baselineTimestamp}</span>
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-emerald-800/50 bg-slate-950">
              <img
                src={baselineImage}
                alt="Check-In Baseline"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/90 text-[10px] font-mono text-emerald-300">
                Pristine Collet • Verified
              </div>
            </div>
          </div>

          {/* Right Column: Return */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-rose-400">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Return Inspection State
              </span>
              <span className="text-[10px] text-slate-500">{returnTimestamp}</span>
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-rose-800/50 bg-slate-950">
              <img
                src={returnImage}
                alt="Return State"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/90 text-[10px] font-mono text-rose-300">
                {isDamagedSimulated ? "Collet Fracture Flagged" : "Normal Return"}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Helpful Hint */}
      <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between pt-1">
        <span>Drag slider horizontally across the canvas to inspect microscopic deltas.</span>
        <span className="text-cyan-400">Tolerance Threshold: ±0.005mm</span>
      </div>

    </div>
  );
}

