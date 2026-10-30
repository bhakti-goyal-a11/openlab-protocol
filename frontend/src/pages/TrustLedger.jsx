import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Link2, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Wrench, 
  Terminal,
  Layers
} from 'lucide-react';

export default function TrustLedger() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [verification, setVerification] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [tampering, setTampering] = useState(false);
  const [repairing, setRepairing] = useState(false);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const data = await api.getAuditEvents({
        limit: 100,
        event_type: eventTypeFilter || undefined
      });
      setEvents(data);
    } catch (err) {
      console.error('Failed to load audit events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const runVerification = async () => {
    setVerifying(true);
    try {
      const report = await api.verifyChain();
      setVerification(report);
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    runVerification();
  }, [eventTypeFilter]);

  const handleSimulateTamper = async () => {
    if (events.length === 0) return;
    const targetSeq = events[events.length - 1].sequence_number; // Tamper with an event
    if (!confirm(`Simulate rogue database administrator modifying payload of Audit Event #${targetSeq}?`)) return;

    setTampering(true);
    try {
      await api.simulateTamper(targetSeq);
      alert(`Tamper simulation completed! Database record #${targetSeq} was modified directly.`);
      // Immediately run verification to prove tamper detection
      await runVerification();
      await fetchEvents();
    } catch (err) {
      alert(`Tamper simulation failed: ${err.message}`);
    } finally {
      setTampering(false);
    }
  };

  const handleRepairChain = async () => {
    setRepairing(true);
    try {
      const res = await api.repairChain();
      alert(res.message);
      await runVerification();
      await fetchEvents();
    } catch (err) {
      alert(`Repair failed: ${err.message}`);
    } finally {
      setRepairing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
            <Link2 className="w-4 h-4" />
            <span>Module D: TrustLedger</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Tamper-Evident SHA-256 Audit Engine
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Append-only cryptographic state verification. Every booking, credential approval, cancellation, and handover condition shift references its preceding block hash to guarantee non-repudiable auditability.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={runVerification}
            disabled={verifying}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center space-x-1.5 transition"
          >
            <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
            <span>Verify Integrity</span>
          </button>

          <button
            onClick={handleSimulateTamper}
            disabled={tampering}
            className="px-3 py-2.5 rounded-xl font-semibold text-xs bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 flex items-center space-x-1.5 transition"
            title="Demonstrate how TrustLedger detects retroactive modifications"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Simulate DB Tamper</span>
          </button>

          {verification && !verification.is_valid && (
            <button
              onClick={handleRepairChain}
              disabled={repairing}
              className="px-3 py-2.5 rounded-xl font-bold text-xs bg-emerald-700 hover:bg-emerald-600 text-white flex items-center space-x-1.5 transition"
            >
              <Wrench className="w-4 h-4" />
              <span>Re-Seal Chain</span>
            </button>
          )}
        </div>
      </div>

      {/* Cryptographic Verification Status Banner */}
      {verification && (
        <div className={`p-4 rounded-2xl border transition-all ${
          verification.is_valid
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
            : 'bg-rose-950/60 border-rose-500 text-rose-200 animate-pulse'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              {verification.is_valid ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6 text-rose-400" />
                </div>
              )}
              <div>
                <h3 className="font-extrabold text-base tracking-tight">
                  {verification.is_valid
                    ? 'CRYPTOGRAPHIC INTEGRITY: 100% VERIFIED SECURE'
                    : 'SECURITY COMPROMISED: UNAUTHORIZED TAMPER DETECTED'}
                </h3>
                <p className="text-xs opacity-90 mt-0.5 font-mono">
                  {verification.is_valid
                    ? `All ${verification.total_events} audit events sealed with valid continuous SHA-256 links.`
                    : verification.error_message}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono shrink-0">
              <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[9px]">LATEST ANCHOR</span>
                <span className="font-bold text-white">{verification.latest_hash?.slice(0, 16)}...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white text-sm">Chained Event Log</span>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
              {events.length} Events Logged
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 w-full sm:w-auto"
            >
              <option value="">All Event Types</option>
              <option value="USER_REGISTERED">USER_REGISTERED</option>
              <option value="CREDENTIAL_APPROVED">CREDENTIAL_APPROVED</option>
              <option value="BOOKING_CREATED">BOOKING_CREATED</option>
              <option value="CHECK_IN_CONFIRMED">CHECK_IN_CONFIRMED</option>
              <option value="HANDOVER_INSPECTION_SUBMITTED">HANDOVER_INSPECTION_SUBMITTED</option>
              <option value="GHOST_SLOT_RELEASED">GHOST_SLOT_RELEASED</option>
              <option value="DISPUTE_FILED">DISPUTE_FILED</option>
              <option value="DISPUTE_RESOLVED">DISPUTE_RESOLVED</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Seq #</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Previous Hash Pointer</th>
                <th className="py-3 px-4">Block Event Hash</th>
                <th className="py-3 px-4 text-center">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {events.map((ev) => {
                const isExpanded = expandedId === ev.id;
                let parsedPayload = {};
                try {
                  parsedPayload = JSON.parse(ev.payload_json);
                } catch (e) {
                  parsedPayload = ev.payload_json;
                }

                return (
                  <React.Fragment key={ev.id}>
                    <tr className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-cyan-400">
                        #{ev.sequence_number.toString().padStart(4, '0')}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40">
                          {ev.event_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-[140px] truncate" title={ev.actor_email}>
                        {ev.actor_email}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]" title={ev.previous_hash}>
                        {ev.previous_hash.slice(0, 10)}...
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-emerald-400 font-semibold" title={ev.event_hash}>
                        {ev.event_hash.slice(0, 12)}...
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center space-x-1 mx-auto"
                        >
                          <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable JSON Payload Drawer */}
                    {isExpanded && (
                      <tr className="bg-slate-950/90">
                        <td colSpan="7" className="p-4 border-y border-slate-800">
                          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>Canonical SHA-256 Pre-Image Payload:</span>
                              <span className="text-cyan-400 font-bold">
                                Entity: {ev.entity_type} #{ev.entity_id}
                              </span>
                            </div>
                            <pre className="text-[11px] text-cyan-200 overflow-x-auto bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                              {JSON.stringify(parsedPayload, null, 2)}
                            </pre>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Full SHA-256 Hash: {ev.event_hash}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
