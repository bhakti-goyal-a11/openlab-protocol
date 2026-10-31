"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { EligibilityBadge } from "@/components/resources/eligibility-badge";
import { BookingModal } from "@/components/bookings/booking-modal";
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  UserCheck, 
  FileText, 
  ExternalLink,
  Lock,
  Calendar
} from "lucide-react";

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const id = params?.id as string;

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock mapping with realistic technical specifications
  const resourceData: Record<string, any> = {
    res_tormach_cnc: {
      id: "res_tormach_cnc",
      name: "Tormach PCNC 1100 Milling Machine",
      category: "Subtractive CNC",
      location: "Fabrication Shop Bay 4",
      custodian: "Prof. Rajesh Sharma",
      custodianEmail: "sharma@univ.edu",
      imageUrl: "/demo-assets/cnc-baseline.svg",
      requiredBadges: ["BADGE_CNC_1", "BADGE_SAFETY_101"],
      supervisorRequired: true,
      maxWeeklyHoursPerUser: 6,
      slotDurationMinutes: 120,
      isAvailable: true,
      specs: [
        { label: "Spindle Power", val: "1.5 HP (1.1 kW) Vector Driven" },
        { label: "Spindle Speed", val: "100 to 5,140 RPM Continuous" },
        { label: "Axis Travel (X/Y/Z)", val: "18.0\" x 9.5\" x 16.25\"" },
        { label: "Collet Standard", val: "ER20 Precision Collet System" },
        { label: "Permitted Materials", val: "6061 Aluminum, Delrin, Brass, Carbon Fiber Plate" },
        { label: "Prohibited Materials", val: "Titanium Gr.5 without coolant, Magnesium, Cast Iron" },
      ],
      safetyRules: [
        "ANSI Z87.1 certified impact eye protection mandatory inside yellow zone.",
        "Zero loose clothing, rings, neck chains, or long unsecured hair.",
        "Workpiece zeroing must be counter-checked by custodian prior to green button press."
      ]
    },
    res_stratasys_3d: {
      id: "res_stratasys_3d",
      name: "Stratasys F370 Industrial 3D Printer",
      category: "Additive 3D",
      location: "Rapid Prototyping Center",
      custodian: "Prof. Rajesh Sharma",
      custodianEmail: "sharma@univ.edu",
      imageUrl: "/demo-assets/cnc-baseline.svg",
      requiredBadges: ["BADGE_3D_PRINT_1"],
      supervisorRequired: false,
      maxWeeklyHoursPerUser: 8,
      slotDurationMinutes: 120,
      isAvailable: true,
      specs: [
        { label: "Build Envelope", val: "14\" x 10\" x 14\" (355 x 254 x 355 mm)" },
        { label: "Layer Resolution", val: "0.127 mm (0.005 in.) slice thickness" },
        { label: "Supported Materials", val: "ABS-M30, PLA, ASA, TPU 92A, QSR Soluble Support" },
        { label: "Chamber Control", val: "Enclosed active thermal gradient with HEPA filtration" }
      ],
      safetyRules: [
        "Wear heat-resistant gloves when removing completed build tray.",
        "Chemical safety goggles mandatory when using the ultrasonic caustic wash bath."
      ]
    },
    res_keysight_dso: {
      id: "res_keysight_dso",
      name: "Keysight Infiniium 4-Channel DSO",
      category: "Optical & Testing",
      location: "Microwave & RF Test Bench",
      custodian: "Prof. Rajesh Sharma",
      custodianEmail: "sharma@univ.edu",
      imageUrl: "/demo-assets/cnc-baseline.svg",
      requiredBadges: ["BADGE_SAFETY_101"],
      supervisorRequired: false,
      maxWeeklyHoursPerUser: 10,
      slotDurationMinutes: 120,
      isAvailable: true,
      specs: [
        { label: "Bandwidth", val: "4.0 GHz Real-time across all 4 channels" },
        { label: "Sample Rate", val: "20 GSa/s single-shot capability" },
        { label: "Memory Depth", val: "100 Mpts per channel deep buffer" },
        { label: "Protocol Decode", val: "PCIe Gen 3, USB 3.0, CAN-FD, I2C, SPI" }
      ],
      safetyRules: [
        "ESD grounding wrist strap must be clipped to chassis ground at all times.",
        "Max input voltage on Channel 1-4: 5V RMS into 50Ω (Damage threshold strict)."
      ]
    },
    res_nvidia_h100: {
      id: "res_nvidia_h100",
      name: "NVIDIA DGX H100 GPU Node",
      category: "High-Compute GPU",
      location: "AI Research Datacenter Rack 2",
      custodian: "Prof. Rajesh Sharma",
      custodianEmail: "sharma@univ.edu",
      imageUrl: "/demo-assets/cnc-baseline.svg",
      requiredBadges: [],
      supervisorRequired: false,
      maxWeeklyHoursPerUser: 12,
      slotDurationMinutes: 180,
      isAvailable: true,
      specs: [
        { label: "GPU Configuration", val: "8x NVIDIA H100 SXM5 80GB HBM3" },
        { label: "Interconnect", val: "4th Gen NVLink (900 GB/s bidirectional)" },
        { label: "CPU Compute", val: "Dual Intel Xeon Platinum 8480C (112 Cores)" },
        { label: "Host RAM", val: "2.0 TB DDR5 4800MHz ECC" }
      ],
      safetyRules: [
        "SSH access managed via protocol signed ed25519 tokens.",
        "Idle process reaper terminates jobs consuming zero compute for over 45 minutes."
      ]
    }
  };

  const resource = resourceData[id] || resourceData["res_tormach_cnc"];

  const missingBadges = resource.requiredBadges.filter(
    (b: string) => !currentUser.badges.includes(b)
  );
  const isEligible = missingBadges.length === 0;

  return (
    <div className="space-y-8">
      
      {/* Back link */}
      <div>
        <Link
          href="/resources"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Equipment Catalog</span>
        </Link>
      </div>

      {/* Main Asset Header */}
      <div className="rounded-3xl bg-slate-900 border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          
          {/* Visual Left Preview */}
          <div className="lg:col-span-5 bg-slate-950 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-zinc-800">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-800 bg-slate-900">
              <img
                src={resource.imageUrl}
                alt={resource.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-950/90 text-cyan-400 border border-cyan-800/50">
                  {resource.category}
                </span>
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-zinc-800/80 pb-2">
                <span>Facility Custodian:</span>
                <span className="font-semibold text-slate-200">{resource.custodian}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-zinc-800/80 pb-2">
                <span>Location Bay:</span>
                <span className="font-mono text-slate-200">{resource.location}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Per-User Weekly Cap:</span>
                <span className="font-mono text-emerald-400 font-bold">{resource.maxWeeklyHoursPerUser} Hours</span>
              </div>
            </div>
          </div>

          {/* Right Specification & Preflight Gate Panel */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <EligibilityBadge
                  requiredBadges={resource.requiredBadges}
                  userBadges={currentUser.badges}
                  supervisorRequired={resource.supervisorRequired}
                />
                {resource.supervisorRequired && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-amber-950/50 text-amber-300 border border-amber-800/40">
                    Supervisor Mandate: Required On-Site
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
                {resource.name}
              </h1>

              {/* Dynamic Gate Status Card */}
              {isEligible ? (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Deterministic Gate: Access Granted</span>
                  </div>
                  <p className="text-slate-400">
                    Active user ({currentUser.fullName}) satisfies all prerequisite digital safety badges. The fair-share allocation scheduler is unlocked.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 space-y-2">
                  <div className="font-bold flex items-center gap-2 text-rose-400">
                    <Lock className="w-4 h-4" />
                    <span>Deterministic Gate: Access Blocked</span>
                  </div>
                  <p className="text-slate-400">
                    You cannot request this machine because your credential wallet lacks the following certified modules:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {missingBadges.map((badge: string) => (
                      <span key={badge} className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-200 font-mono text-[11px] border border-rose-700/50">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Specifications Matrix */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Machine Specifications & Limits
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {resource.specs.map((item: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-950/70 border border-zinc-800/70">
                      <span className="text-slate-500 block text-[10px]">{item.label}</span>
                      <span className="font-mono text-slate-200 font-semibold">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Rules */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Institutional Safety Protocols
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  {resource.safetyRules.map((rule: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Reservation Button */}
            <div className="pt-4 border-t border-zinc-800">
              {isEligible ? (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Configure Reservation & Priority Score</span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3.5 px-4 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-400 font-semibold text-xs flex items-center justify-center gap-2 cursor-not-allowed opacity-75"
                >
                  <Lock className="w-4 h-4" />
                  <span>Access Blocked by Safety Credential Gate</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        resource={resource}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBookingSuccess={() => router.push("/bookings")}
      />

    </div>
  );
}

