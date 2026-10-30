import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Radar, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowRight, 
  DollarSign, 
  MapPin, 
  Calendar,
  Layers,
  Sparkles,
  Info,
  X,
  Plus
} from 'lucide-react';

export default function ResourceRadar({ onNavigateToBooking }) {
  const { user } = useAuth();
  const [equipmentList, setEquipmentList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modals
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAlternativeModal, setShowAlternativeModal] = useState(false);
  const [alternatives, setAlternatives] = useState([]);
  const [eligibilityCheck, setEligibilityCheck] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Booking Form State
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingStartTime, setBookingStartTime] = useState('14:00');
  const [bookingEndTime, setBookingEndTime] = useState('16:00');
  const [bookingPurpose, setBookingPurpose] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingMessage, setBookingMessage] = useState(null);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const [eqs, depts, cats] = await Promise.all([
        api.getEquipment({
          search: search || undefined,
          department_id: selectedDept || undefined,
          category: selectedCategory || undefined
        }),
        api.getDepartments(),
        api.getCategories()
      ]);
      setEquipmentList(eqs);
      setDepartments(depts);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load equipment radar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [search, selectedDept, selectedCategory]);

  const handleOpenBookingModal = async (eq) => {
    setSelectedEquipment(eq);
    setShowBookingModal(true);
    setBookingMessage(null);
    setCheckingEligibility(true);
    try {
      const elig = await api.verifyEligibility(eq.id);
      setEligibilityCheck(elig);
    } catch (err) {
      console.error('Eligibility check error:', err);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleOpenAlternatives = async (eq) => {
    setSelectedEquipment(eq);
    setShowAlternativeModal(true);
    try {
      const res = await api.getEquipmentAlternatives(eq.id);
      setAlternatives(res.alternatives || []);
    } catch (err) {
      console.error('Failed to fetch alternatives:', err);
    }
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedEquipment) return;
    setBookingSubmitting(true);
    setBookingMessage(null);

    try {
      const startIso = `${bookingDate}T${bookingStartTime}:00Z`;
      const endIso = `${bookingDate}T${bookingEndTime}:00Z`;

      const res = await api.createBooking({
        equipment_id: selectedEquipment.id,
        start_time: startIso,
        end_time: endIso,
        purpose: bookingPurpose || 'Coursework & Research Prototype'
      });

      setBookingMessage({
        type: 'success',
        text: `Reservation Confirmed! Slot secured on ${selectedEquipment.name}. Digital check-in window opened.`
      });

      // Refresh equipment list
      setTimeout(() => {
        setShowBookingModal(false);
        fetchEquipment();
        if (onNavigateToBooking) onNavigateToBooking();
      }, 1800);
    } catch (err) {
      setBookingMessage({
        type: 'error',
        text: err.message
      });
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleJoinWaitlist = async (eqId) => {
    try {
      const now = new Date();
      const startIso = new Date(now.getTime() + 2 * 3600000).toISOString();
      const endIso = new Date(now.getTime() + 4 * 3600000).toISOString();

      await api.joinWaitlist(eqId, {
        requested_slot_start: startIso,
        requested_slot_end: endIso
      });
      alert('Joined FairShare Priority Waitlist! You will be automatically awarded the slot if current reservation expires or cancels.');
    } catch (err) {
      alert(`Could not join waitlist: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
            <Radar className="w-4 h-4" />
            <span>Campus Resource Radar</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Federated Institutional Equipment Index
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Cross-department discovery for specialized university hardware. Bypass bureaucratic silos with real-time pre-flight credential gating and transparent capacity discovery.
          </p>
        </div>

        {/* Quick Stat Highlights */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Active Fleet</span>
            <span className="text-lg font-bold text-white font-mono">{equipmentList.length} Units</span>
          </div>
          <div className="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Departments</span>
            <span className="text-lg font-bold text-cyan-400 font-mono">{departments.length} Hubs</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search by equipment name, model number, or domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Department Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={() => setSelectedDept('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                selectedDept === '' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Departments
            </button>
            {departments.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDept(d.id.toString())}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                  selectedDept === d.id.toString()
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {d.code}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 shrink-0"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Equipment Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-slate-800/40 border border-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : equipmentList.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
          <Info className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No equipment found matching criteria</h3>
          <p className="text-xs text-slate-500">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {equipmentList.map((eq) => {
            const isAvailable = eq.status === 'AVAILABLE';
            const isInUse = eq.status === 'IN_USE';
            const isDisputed = eq.status === 'DISPUTED';

            return (
              <div
                key={eq.id}
                className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-blue-950/20"
              >
                <div>
                  {/* Image & Status Tag */}
                  <div className="relative h-44 bg-slate-950 overflow-hidden">
                    <img
                      src={eq.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500'}
                      alt={eq.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>

                    {/* Department Pill */}
                    <div className="absolute top-3 left-3 flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur border border-slate-700/80 text-[11px] font-semibold text-slate-200">
                      <span>{eq.department?.code || 'CAMPUS'}</span>
                    </div>

                    {/* Status Pill */}
                    <div className="absolute top-3 right-3">
                      {isAvailable && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>AVAILABLE</span>
                        </span>
                      )}
                      {isInUse && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-950/90 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          <span>IN OPERATION</span>
                        </span>
                      )}
                      {isDisputed && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-950/90 text-rose-300 border border-rose-500/40">
                          DISPUTE / LOCKED
                        </span>
                      )}
                    </div>

                    {/* Bottom overlay with Replacement Value */}
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-slate-300">
                      <span className="text-cyan-400 font-semibold">{eq.category}</span>
                      <span className="text-slate-400">CapEx: ${eq.replacement_value?.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-white text-base leading-snug group-hover:text-blue-400 transition">
                        {eq.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Model: {eq.model_number}
                      </p>
                    </div>

                    <div className="flex items-center text-xs text-slate-400 space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{eq.location_room || eq.department?.location}</span>
                    </div>

                    {/* Safety Badge Prerequisite */}
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs flex items-start space-x-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Required Prerequisite</span>
                        <span className="font-semibold text-slate-200 truncate block">
                          {eq.required_qualification || 'Standard Safety Orientation'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 pt-0 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenBookingModal(eq)}
                      disabled={!isAvailable && !isInUse}
                      className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
                        isAvailable
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{isAvailable ? 'Reserve Slot' : 'Check Times'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenAlternatives(eq)}
                      className="w-full py-2 px-3 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 flex items-center justify-center space-x-1 transition"
                      title="Discover cross-department equivalent equipment"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Alternatives</span>
                    </button>
                  </div>

                  {isInUse && (
                    <button
                      onClick={() => handleJoinWaitlist(eq.id)}
                      className="w-full py-1.5 rounded-lg text-[11px] font-semibold bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-800/60 flex items-center justify-center space-x-1 transition"
                    >
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>Join FairShare Priority Waitlist</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Modal with Real-Time Pre-Flight Check */}
      {showBookingModal && selectedEquipment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-bold uppercase mb-1">
                <Radar className="w-4 h-4" />
                <span>Pre-Flight Reservation Gate</span>
              </div>
              <h2 className="text-xl font-black text-white">{selectedEquipment.name}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedEquipment.department?.name}</p>
            </div>

            {/* Real-Time Pre-Flight Eligibility Status */}
            <div className="p-3 rounded-xl border bg-slate-950/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Algorithmic Eligibility Status:</span>
                {checkingEligibility ? (
                  <span className="text-cyan-400 text-xs animate-pulse">Checking credentials...</span>
                ) : eligibilityCheck?.eligible ? (
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Eligible to Book</span>
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Requirement Blocked</span>
                  </span>
                )}
              </div>

              {eligibilityCheck && !eligibilityCheck.eligible && (
                <div className="text-[11px] text-rose-300 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/50 space-y-1">
                  {eligibilityCheck.reasons.map((r, idx) => (
                    <div key={idx} className="flex items-start space-x-1.5">
                      <span className="text-rose-400">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {eligibilityCheck && (
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono border-t border-slate-800 text-slate-400">
                  <div>
                    <span>Fairness: </span>
                    <strong className="text-cyan-300">{eligibilityCheck.fairness_score}/10</strong>
                  </div>
                  <div>
                    <span>Weekly Used: </span>
                    <strong className="text-white">{eligibilityCheck.weekly_hours_used}h</strong>
                  </div>
                  <div>
                    <span>Dynamic Quota: </span>
                    <strong className="text-emerald-300">{eligibilityCheck.max_weekly_quota}h</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Booking Form */}
            <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reservation Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Time</label>
                  <input
                    type="time"
                    value={bookingStartTime}
                    onChange={(e) => setBookingStartTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Time</label>
                  <input
                    type="time"
                    value={bookingEndTime}
                    onChange={(e) => setBookingEndTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Purpose / Research Grant</label>
                <textarea
                  rows="2"
                  value={bookingPurpose}
                  onChange={(e) => setBookingPurpose(e.target.value)}
                  placeholder="e.g. Capstone prototyping, CAD manufacturing, neural training"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              {/* Check-In Deadline Note */}
              <div className="text-[11px] text-amber-300/90 bg-amber-950/30 p-2.5 rounded-lg border border-amber-800/40 flex items-start space-x-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Ghost Booking Prevention:</strong> You must complete digital check-in within <strong>{selectedEquipment.check_in_window_minutes} minutes</strong> of start time. Failure to check in automatically slashes your TrustScore and reassigns slot to waiting students.
                </p>
              </div>

              {bookingMessage && (
                <div className={`p-3 rounded-lg text-xs font-semibold ${
                  bookingMessage.type === 'success' 
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' 
                    : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                }`}>
                  {bookingMessage.text}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingSubmitting || (eligibilityCheck && !eligibilityCheck.eligible)}
                  className={`px-5 py-2 rounded-xl font-bold transition flex items-center space-x-2 ${
                    eligibilityCheck && !eligibilityCheck.eligible
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                  }`}
                >
                  {bookingSubmitting ? 'Verifying & Reserving...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Alternative Finder Modal */}
      {showAlternativeModal && selectedEquipment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowAlternativeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-bold uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Smart Alternative Finder</span>
            </div>
            <h2 className="text-xl font-black text-white">
              Cross-Campus Equivalents for {selectedEquipment.name}
            </h2>
            <p className="text-xs text-slate-400">
              Federated recommendations across other university departments to prevent bottlenecks and CapEx duplication.
            </p>

            <div className="max-h-96 overflow-y-auto space-y-3 py-1">
              {alternatives.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
                  No other active machines in this specific category are currently registered across campus.
                </div>
              ) : (
                alternatives.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm">{alt.name}</h4>
                        <p className="text-[11px] text-slate-400 font-mono">{alt.department_name} • {alt.location_room}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        alt.user_has_qualification 
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
                          : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      }`}>
                        {alt.user_has_qualification ? '✓ Qualified' : 'Badge Needed'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      💡 {alt.match_reason}
                    </p>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          setShowAlternativeModal(false);
                          handleOpenBookingModal(alt);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1"
                      >
                        <span>Switch & Reserve This Machine</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
