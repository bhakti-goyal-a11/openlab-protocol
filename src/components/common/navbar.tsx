"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RoleSwitcher } from "./role-switcher";
import { useAuth } from "@/context/auth-context";
import { 
  ShieldCheck, 
  Cpu, 
  CalendarCheck, 
  Inbox, 
  ScrollText, 
  BarChart3, 
  Terminal,
  Activity
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  const navLinks = [
    {
      name: "Catalog & Spaces",
      href: "/resources",
      icon: Cpu,
      showFor: ["STUDENT", "LAB_MANAGER", "ADMIN"],
    },
    {
      name: "My Reservations",
      href: "/bookings",
      icon: CalendarCheck,
      showFor: ["STUDENT", "LAB_MANAGER", "ADMIN"],
    },
    {
      name: "Custodian Desk",
      href: "/manager/requests",
      icon: Inbox,
      showFor: ["LAB_MANAGER", "ADMIN"],
      badge: "Pending",
    },
    {
      name: "Audit Ledger",
      href: "/admin/audit",
      icon: ScrollText,
      showFor: ["ADMIN", "LAB_MANAGER", "STUDENT"],
    },
    {
      name: "Fairness Analytics",
      href: "/admin/fairness",
      icon: BarChart3,
      showFor: ["ADMIN", "LAB_MANAGER", "STUDENT"],
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Protocol Title */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-slate-100">OpenLab</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 px-1 py-0.2 rounded bg-emerald-950/60 border border-emerald-800/50">
                    // PROTOCOL
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono tracking-wide block">
                  Trust-Governed Campus Commons
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-slate-900 text-emerald-400 border border-emerald-500/30 shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
                    <span>{link.name}</span>
                    {link.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            
            {/* Live Trust Score Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-zinc-800 text-xs shadow-inner">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div className="flex items-baseline gap-1">
                <span className="text-[11px] text-slate-400">Trust:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {currentUser.trustScore.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">/100</span>
              </div>
            </div>

            {/* Role Switcher Dropdown */}
            <RoleSwitcher />
          </div>

        </div>
      </div>
    </header>
  );
}

