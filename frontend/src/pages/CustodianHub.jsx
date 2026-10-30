import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Settings2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Wrench, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function CustodianHub() {
  const { user } = useAuth();
  const [pendingCredentials, setPendingCredentials] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Resolution Modal State
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  // Credential Review State
  const [reviewNotes, setReviewNotes] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [creds, eqs, disp] = await Promise.all([
        api.getPendingCredentials(),
        api.getEquipment(),
        api.getDisputes()
      ]);
      setPendingCredentials(creds);
      setEquipmentList(eqs);
      setDisputes(disp);
    } catch (err) {
      console.error('Failed to load custodian hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleApproveCred = async (id) => {
    try {
      const notes = reviewNotes[id] || 'Verified laboratory prerequisites and safety training documentation.';
      await api.approveCredential(id, notes);
      alert('Training credential approved! Qualification badge granted to student.');
      fetchData();
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    }
  };

  const handleRejectCred = async (id) => {
    const reason = prompt('Please enter reason for rejection:');
    if (!reason) return;
    try {
      await api.rejectCredential(id, reason);
      alert('Credential rejected and logged in TrustLedger.');
      fetchData();
    } catch (err) {
      alert(`Rejection failed: ${err.message}`);
    }
  };

  const handleToggleMaintenance = async (eq) => {
    const newStatus = eq.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    try {
      await api.updateEquipment(eq.id, { status: newStatus });
      fetchData();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;

    setResolving(true);
    try {
      await api.resolveDispute(selectedDispute.id, {
        status: 'RESOLVED',
        resolution_notes: resolutionNotes || 'Machine inspected by custodian. Calibrated and cleared for active student access.'
      });
      alert('Dispute resolved! Equipment status restored to available.');
      setSelectedDispute(null);
      setResolutionNotes('');
      fetchData();
    } catch (err) {
      alert(`Resolution failed: ${err.message}`);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
            <Settings2 className="w-4 h-4" />
            <span>Lab Custodian Governance Hub</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Facility Oversight, Qualification Verification & Dispute Console
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Decisive operational control. Review student training waivers, resolve equipment condition disputes, and toggle machine maintenance without paperwork overhead.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
            {pendingCredentials.length} Pending Credentials
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold">
            {disputes.filter(d => d.status === 'OPEN').length} Open Disputes
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Section 1: Pending Student Training Credentials (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-white font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>Training Credential Approval Queue</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              TRUSTPASS VERIFIER
            </span>
          </div>

          {loading ? (
            <div className="h-48 rounded-xl bg-slate-800/40 animate-pulse"></div>
          ) : pendingCredentials.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800 text-slate-400 text-xs space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-200">Verification Queue Clear</p>
              <p className="text-[11px] text-slate-500">All submitted student training credentials have been reviewed and counter-signed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCredentials.map((cred) => (
                <div
                  key={cred.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {cred.qualification_code}
                      </span>
                      <h4 className="font-bold text-white text-sm mt-1">{cred.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Applicant: <strong>{cred.student_name}</strong> ({cred.student_email})
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(cred.submitted_at).toLocaleDateString()}
                    </span>
                  </div>

                  {cred.notes && (
                    <p className="text-xs text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800 font-mono text-[11px]">
                      "{cred.notes}"
                    </p>
                  )}

                  {cred.proof_document_url && (
                    <a
                      href={cred.proof_document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-mono"
                    >
                      <span>Inspect Training Document</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleRejectCred(cred.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveCred(cred.id)}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Grant Badge</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Equipment Maintenance & Dispute Console (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Dispute Resolution Console */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-white font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>Damage & Dispute Console</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                DISPUTES
              </span>
            </div>

            <div className="space-y-3">
              {disputes.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No active incident reports filed.</p>
              ) : (
                disputes.map((disp) => {
                  const isOpen = disp.status === 'OPEN';
                  return (
                    <div
                      key={disp.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            disp.severity === 'CRITICAL' || disp.severity === 'HIGH' 
                              ? 'bg-rose-950 text-rose-300 border-rose-500/40' 
                              : 'bg-amber-950 text-amber-300 border-amber-500/40'
                          }`}>
                            {disp.severity} SEVERITY
                          </span>
                          <h4 className="font-bold text-white text-xs mt-1">{disp.equipment_name}</h4>
                        </div>
                        <span className={`text-[10px] font-mono font-bold ${isOpen ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {disp.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-snug">
                        {disp.description}
                      </p>

                      <div className="text-[10px] text-slate-500 font-mono">
                        Reported by {disp.reported_by_name} • {new Date(disp.created_at).toLocaleDateString()}
                      </div>

                      {isOpen && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => setSelectedDispute(disp)}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1"
                          >
                            <span>Adjudicate & Clear</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {disp.resolution_notes && (
                        <div className="text-[11px] text-emerald-300 bg-emerald-950/40 p-2 rounded border border-emerald-800/50 font-mono">
                          ✓ Resolved: {disp.resolution_notes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Equipment Maintenance Toggle List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-white font-bold text-base">
                <Wrench className="w-5 h-5 text-amber-400" />
                <span>Fleet Maintenance Toggles</span>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {equipmentList.map((eq) => (
                <div
                  key={eq.id}
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <p className="font-bold text-white truncate max-w-[180px]">{eq.name}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{eq.status}</span>
                  </div>

                  <button
                    onClick={() => handleToggleMaintenance(eq)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition shrink-0 ${
                      eq.status === 'MAINTENANCE'
                        ? 'bg-amber-950 text-amber-300 border-amber-500/40 hover:bg-amber-900'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    {eq.status === 'MAINTENANCE' ? 'Clear Maintenance' : 'Tag Maintenance'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Adjudicate Dispute Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white">Resolve Dispute for {selectedDispute.equipment_name}</h3>
            <p className="text-xs text-slate-400">
              Submit resolution notes and clear equipment back for active scheduling.
            </p>

            <form onSubmit={handleResolveDispute} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Resolution Summary</label>
                <textarea
                  rows="3"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detail inspection result, maintenance performed, or cleared status..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/30"
                >
                  {resolving ? 'Clearing...' : 'Certify & Release Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
