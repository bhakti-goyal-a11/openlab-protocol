import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarClock, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  RefreshCw, 
  Zap, 
  ShieldAlert, 
  ArrowRight,
  Flame,
  Camera,
  Layers
} from 'lucide-react';

export default function BookingManager({ onNavigateToHandover }) {
  const { user, refreshUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, ACTIVE, RESERVED, COMPLETED, NO_SHOW
  const [recovering, setRecovering] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await api.getBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleCheckIn = async (bookingId) => {
    try {
      await api.checkInBooking(bookingId, 'Digital student attestation from mobile browser');
      alert('Digital Check-In Confirmed! Machine operational session unlocked.');
      fetchBookings();
      refreshUser();
      if (onNavigateToHandover) onNavigateToHandover();
    } catch (err) {
      alert(`Check-in failed: ${err.message}`);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this reservation? The slot will be released to waiting students.')) return;
    try {
      const res = await api.cancelBooking(bookingId, 'User requested cancellation ahead of window');
      alert(res.message + (res.promoted_waitlist ? `\n${res.promoted_waitlist}` : ''));
      fetchBookings();
      refreshUser();
    } catch (err) {
      alert(`Cancellation failed: ${err.message}`);
    }
  };

  const handleTriggerGhostRecovery = async () => {
    setRecovering(true);
    setRecoveryResult(null);
    try {
      const res = await api.triggerGhostRecovery();
      setRecoveryResult(res);
      fetchBookings();
      refreshUser();
    } catch (err) {
      alert(`Ghost recovery error: ${err.message}`);
    } finally {
      setRecovering(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CHECKED_IN':
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>IN OPERATION</span>
          </span>
        );
      case 'RESERVED':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-500/40 flex items-center space-x-1">
            <Clock className="w-3 h-3 text-blue-400" />
            <span>RESERVED (PENDING CHECK-IN)</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span>COMPLETED</span>
          </span>
        );
      case 'NO_SHOW_RELEASED':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
            <Flame className="w-3 h-3 text-rose-400" />
            <span>SLASHED (NO-SHOW)</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            CANCELLED
          </span>
        );
      default:
        return null;
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === 'ACTIVE') return ['RESERVED', 'CHECKED_IN', 'IN_PROGRESS'].includes(b.status);
    if (activeFilter === 'COMPLETED') return b.status === 'COMPLETED';
    if (activeFilter === 'NO_SHOW') return b.status === 'NO_SHOW_RELEASED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
            <CalendarClock className="w-4 h-4" />
            <span>Module B: FairShare AI</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Intelligent Fair Booking & Ghost Slot Engine
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Mathematical access governance. Dynamically throttles concurrent reservations, enforces anti-hoarding decay, and penalizes abandoned slots through automated deadline slashing.
          </p>
        </div>

        {/* Demo Action: Trigger Ghost Slot Recovery */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleTriggerGhostRecovery}
            disabled={recovering}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white shadow-lg shadow-amber-900/30 flex items-center space-x-2 transition"
            title="Runs automated background cron to slash no-shows and promote waitlist"
          >
            <Zap className={`w-4 h-4 ${recovering ? 'animate-spin' : ''}`} />
            <span>{recovering ? 'Scanning Fleet...' : 'Run Ghost Slot Recovery'}</span>
          </button>
        </div>
      </div>

      {/* Recovery Result Announcement Banner */}
      {recoveryResult && (
        <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-4 space-y-2 shadow-xl shadow-amber-950/20">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300 flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Ghost Slot Recovery Execution Completed</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              Released: {recoveryResult.ghost_slots_released} | Promoted: {recoveryResult.waitlist_users_promoted}
            </span>
          </div>
          {recoveryResult.actions && recoveryResult.actions.length > 0 ? (
            <div className="text-xs text-slate-300 space-y-1 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px]">
              {recoveryResult.actions.map((act, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="text-amber-400">✓</span>
                  <span>{act}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Fleet is currently healthy. Zero unconfirmed ghost slots detected beyond check-in windows.
            </p>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        {[
          { id: 'ALL', label: 'All Bookings' },
          { id: 'ACTIVE', label: 'Active & Reserved' },
          { id: 'COMPLETED', label: 'Completed' },
          { id: 'NO_SHOW', label: 'Slashed No-Shows' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeFilter === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-800/40 border border-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
          <CalendarClock className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No booking records found</h3>
          <p className="text-xs text-slate-500">
            Explore the Campus Resource Radar to reserve available equipment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isReserved = b.status === 'RESERVED';
            const isInProgress = b.status === 'IN_PROGRESS' || b.status === 'CHECKED_IN';
            const isCompleted = b.status === 'COMPLETED';
            const isNoShow = b.status === 'NO_SHOW_RELEASED';

            const startObj = new Date(b.start_time);
            const endObj = new Date(b.end_time);
            const deadlineObj = new Date(b.check_in_deadline);

            return (
              <div
                key={b.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {b.equipment?.category || 'EQUIPMENT'}
                      </span>
                      {getStatusBadge(b.status)}
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {b.equipment?.name || `Equipment #${b.equipment_id}`}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Reserved by {b.user?.full_name || 'Student'} • {b.equipment?.department?.name}
                    </p>
                  </div>

                  {/* Time Window Card */}
                  <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-mono space-y-1 shrink-0">
                    <div className="flex justify-between space-x-4 text-slate-400">
                      <span>Window:</span>
                      <strong className="text-white">
                        {startObj.toLocaleDateString()} {startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {endObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </strong>
                    </div>
                    {isReserved && (
                      <div className="flex justify-between space-x-4 text-amber-300">
                        <span>Check-In Deadline:</span>
                        <strong>{deadlineObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {b.purpose && (
                  <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                    <strong>Session Goal:</strong> {b.purpose}
                  </p>
                )}

                {/* Card Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-400 font-mono">
                    Booking Reference #{b.id.toString().padStart(5, '0')} • Created {new Date(b.created_at).toLocaleDateString()}
                  </div>

                  <div className="flex items-center space-x-2">
                    {isReserved && (
                      <>
                        <button
                          onClick={() => handleCheckIn(b.id)}
                          className="px-4 py-1.5 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Digital Check-In</span>
                        </button>

                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 border border-slate-700 transition"
                        >
                          Cancel Slot
                        </button>
                      </>
                    )}

                    {isInProgress && (
                      <button
                        onClick={onNavigateToHandover}
                        className="px-4 py-1.5 rounded-lg font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 flex items-center space-x-1.5 transition"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Submit ProofHandover</span>
                      </button>
                    )}

                    {isNoShow && (
                      <div className="text-[11px] text-rose-400 font-mono flex items-center space-x-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Reputation penalty applied: -15 TrustScore & weekly quota slashed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
