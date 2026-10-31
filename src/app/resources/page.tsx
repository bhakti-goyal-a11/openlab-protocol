"use client";

import React, { useState, useEffect } from "react";
import { ResourceCard, ResourceData } from "@/components/resources/resource-card";
import { BookingModal } from "@/components/bookings/booking-modal";
import { useAuth } from "@/context/auth-context";
import { 
  Search, 
  Cpu, 
  Layers, 
  SlidersHorizontal, 
  Sparkles,
  Server,
  Zap,
  Microscope,
  CheckCircle2
} from "lucide-react";

const INITIAL_RESOURCES: ResourceData[] = [
  {
    id: "res_tormach_cnc",
    name: "Tormach PCNC 1100 Milling Machine",
    category: "Subtractive CNC",
    custodianId: "user_sharma",
    location: "Fabrication Shop Bay 4",
    description: "High-precision 4-axis mill for aerospace alloys, carbon fiber, and titanium parts.",
    imageUrl: "/demo-assets/cnc-baseline.svg",
    requiredBadges: ["BADGE_CNC_1", "BADGE_SAFETY_101"],
    supervisorRequired: true,
    maxWeeklyHoursPerUser: 6,
    slotDurationMinutes: 120,
    isAvailable: true
  },
  {
    id: "res_stratasys_3d",
    name: "Stratasys F370 Industrial 3D Printer",
    category: "Additive 3D",
    custodianId: "user_sharma",
    location: "Rapid Prototyping Center",
    description: "High-temperature dual-extrusion FDM/SLA rapid prototyping with soluble support bath.",
    imageUrl: "/demo-assets/cnc-baseline.svg",
    requiredBadges: ["BADGE_3D_PRINT_1"],
    supervisorRequired: false,
    maxWeeklyHoursPerUser: 8,
    slotDurationMinutes: 120,
    isAvailable: true
  },
  {
    id: "res_keysight_dso",
    name: "Keysight Infiniium 4-Channel DSO",
    category: "Optical & Testing",
    custodianId: "user_sharma",
    location: "Microwave & RF Test Bench",
    description: "4GHz 20GSa/s mixed-signal digital storage oscilloscope with protocol serial decoder.",
    imageUrl: "/demo-assets/cnc-baseline.svg",
    requiredBadges: ["BADGE_SAFETY_101"],
    supervisorRequired: false,
    maxWeeklyHoursPerUser: 10,
    slotDurationMinutes: 120,
    isAvailable: true
  },
  {
    id: "res_nvidia_h100",
    name: "NVIDIA DGX H100 GPU Node",
    category: "High-Compute GPU",
    custodianId: "user_sharma",
    location: "AI Research Datacenter Rack 2",
    description: "8x NVIDIA H100 SXM5 80GB GPUs with 900GB/s NVLink interconnect for scientific LLM fine-tuning.",
    imageUrl: "/demo-assets/cnc-baseline.svg",
    requiredBadges: [],
    supervisorRequired: false,
    maxWeeklyHoursPerUser: 12,
    slotDurationMinutes: 180,
    isAvailable: true
  }
];

export default function ResourcesPage() {
  const { currentUser } = useAuth();
  const [resources, setResources] = useState<ResourceData[]>(INITIAL_RESOURCES);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedResource, setSelectedResource] = useState<ResourceData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Optionally fetch live resources from SQLite backend if available
    fetch("/api/resources")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item: any) => ({
            ...item,
            requiredBadges: typeof item.requiredBadges === "string" ? JSON.parse(item.requiredBadges) : item.requiredBadges || []
          }));
          setResources(mapped);
        }
      })
      .catch(() => {
        // Fallback to initialized resources
      });
  }, []);

  const categories = ["All", "Subtractive CNC", "Additive 3D", "High-Compute GPU", "Optical & Testing"];

  const filteredResources = resources.filter((res) => {
    const matchesCategory = selectedCategory === "All" || res.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = 
      res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenBooking = (resource: ResourceData) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      
      {/* Page Title & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
              CAMPUS COMMONS
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Evaluator: {currentUser.fullName} ({currentUser.badges.length} Certified Badges)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
            Specialized Equipment & High-Value Spaces
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time qualification gates enforce machine safety prerequisites before booking windows unlock.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search specs, toolpath, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-zinc-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-zinc-800/80">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold"
                : "bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-zinc-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Resource Grid */}
      {filteredResources.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-zinc-800">
          <p className="text-slate-400 text-sm">No assets match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredResources.map((res) => (
            <ResourceCard
              key={res.id}
              resource={res}
              onBookClick={handleOpenBooking}
            />
          ))}
        </div>
      )}

      {/* Interactive Booking Modal */}
      <BookingModal
        resource={selectedResource}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

    </div>
  );
}

