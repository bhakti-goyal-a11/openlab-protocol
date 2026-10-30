import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  AlertOctagon, 
  DollarSign, 
  Clock, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Flame,
  ShieldCheck,
  Building2,
  Wrench
} from 'lucide-react';

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function SmartAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load institutional analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-2xl bg-slate-800/40 border border-slate-800 animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 rounded-xl bg-slate-800/40 border border-slate-800 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { kpis, department_stats, duplicate_radar, recommendations, most_used_equipment, underutilized_equipment } = analytics;

  // Format data for Department Load Bar Chart
  const deptChartData = department_stats.map(d => ({
    name: d.code,
    fullName: d.name,
    'Booked Hours': d.hours_booked,
    'Idle Capacity': d.idle_hours,
    'Utilization %': d.utilization_rate
  }));

  return (
    <div className="space-y-6">
      {/* Module Title & Institutional Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Module F: Smart Utilization Intelligence</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Institutional Asset ROI & CapEx Federation Radar
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Executive institutional intelligence for department deans and provosts. Replaces guesswork with empirical utilization metrics, phantom booking slashing stats, and cross-department duplicate purchase prevention.
          </p>
        </div>

        <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2 text-right shrink-0">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Institutional Scope</span>
          <span className="text-xs font-bold text-cyan-400">University Research Labs</span>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Utilization Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Overall Fleet Utilization</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {kpis.overall_utilization_percent}%
          </div>
          <p className="text-[10px] text-slate-400">
            {kpis.total_hours_booked}h active out of {kpis.total_registered_equipment * 420}h monthly capacity
          </p>
        </div>

        {/* KPI 2: Idle Hours */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Idle Machine Hours</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono">
            {kpis.idle_equipment_hours?.toLocaleString()}h
          </div>
          <p className="text-[10px] text-slate-400">
            Unutilized capital capacity across campus
          </p>
        </div>

        {/* KPI 3: Fleet Valuation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Fleet Valuation</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            ${(kpis.total_asset_valuation_usd / 1000).toFixed(0)}k
          </div>
          <p className="text-[10px] text-slate-400">
            {kpis.total_registered_equipment} High-Value Specialized Assets
          </p>
        </div>

        {/* KPI 4: Ghost Booking / No-Show Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Phantom Reservation Rate</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-rose-400 font-mono">
            {kpis.no_show_rate_percent}%
          </div>
          <p className="text-[10px] text-slate-400">
            {kpis.no_show_bookings} slots auto-released by FairShare AI
          </p>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department-Wise Utilization Bar Chart (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Department Utilization vs Capacity</h3>
              <p className="text-xs text-slate-400">Comparison of operational booking hours vs idle machine capacity per department</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
              HOURS / MONTH
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar dataKey="Booked Hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Idle Capacity" fill="#1e293b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Asset Share Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Asset Distribution</h3>
            <p className="text-xs text-slate-400">Capital valuation share across departments</p>
          </div>

          <div className="space-y-3">
            {department_stats.map((dept, idx) => (
              <div key={dept.department_id} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-white">{dept.name}</span>
                  <span className="font-mono text-cyan-400">${(dept.total_asset_value / 1000).toFixed(0)}k</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Utilization: <strong>{dept.utilization_rate}%</strong></span>
                  <span>{dept.equipment_count} Machines</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, dept.utilization_rate)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 font-mono text-center">
            Total CapEx Base: ${kpis.total_asset_valuation_usd?.toLocaleString()}
          </div>
        </div>
      </div>

      {/* CapEx Duplicate Purchase Detection & Resource Sharing Intelligence */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30 border border-indigo-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-indigo-900/40 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight">
                Resource Sharing Intelligence: Duplicate CapEx Detection
              </h3>
              <p className="text-xs text-slate-400">
                AI cross-department redundancy analysis detecting parallel capital requests
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-800/80">
            {duplicate_radar.length} Redundancies Identified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {duplicate_radar.map((dup, idx) => (
            <div
              key={idx}
              className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {dup.category}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1.5">
                    Co-Procurement: {dup.departments.join(' & ')}
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                  {dup.average_utilization}% Avg Util
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                {dup.analysis}
              </p>

              <div className="flex items-center justify-between text-xs font-mono pt-1 text-emerald-400">
                <span>Estimated Avoidable CapEx:</span>
                <strong className="text-sm">${dup.potential_savings_usd?.toLocaleString()}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actionable Recommendations Based on Real Database Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Actionable Governance Recommendations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {rec.type}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    rec.priority === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-500/40' : 'bg-blue-950 text-blue-300 border border-blue-500/40'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">{rec.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{rec.rationale}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Workhorses vs Underutilized Assets Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Utilized */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>High-Demand Institutional Workhorses</span>
          </h3>
          <div className="space-y-2">
            {most_used_equipment.map((eq) => (
              <div key={eq.id} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white truncate max-w-[220px]">{eq.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{eq.department_name} • {eq.total_bookings} bookings</p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-emerald-400 font-bold block">{eq.utilization_percentage}% Util</span>
                  <span className="text-[10px] text-slate-500">{eq.hours_used}h active</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Underutilized Assets */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 text-amber-400" />
            <span>Underutilized Equipment (Idle Financial Drag)</span>
          </h3>
          <div className="space-y-2">
            {underutilized_equipment.map((eq) => (
              <div key={eq.id} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white truncate max-w-[220px]">{eq.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{eq.department_name} • CapEx: ${eq.replacement_value?.toLocaleString()}</p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-amber-400 font-bold block">{eq.utilization_percentage}% Util</span>
                  <span className="text-[10px] text-rose-400">-${eq.idle_cost_usd} idle loss</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
