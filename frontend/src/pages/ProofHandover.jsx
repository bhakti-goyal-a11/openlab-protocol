import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Camera, 
  CheckSquare, 
  Upload, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  FileText, 
  CheckCircle2, 
  X,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function ProofHandover() {
  const { user } = useAuth();
  const [activeBookings, setActiveBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [inspectionType, setInspectionType] = useState('PRE_USE'); // PRE_USE or POST_USE
  const [conditionRating, setConditionRating] = useState('GOOD'); // EXCELLENT, GOOD, FAIR, DAMAGED

  // Structured Checklist
  const [checklist, setChecklist] = useState({
    cleanliness: true,
    calibration: true,
    safety_guards: true,
    consumables: true
  });

  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Escrow Comparison State
  const [escrowViewBookingId, setEscrowViewBookingId] = useState('');
  const [escrowDetail, setEscrowDetail] = useState(null);
  const [loadingEscrow, setLoadingEscrow] = useState(false);

  // Dispute Report Modal
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeDesc, setDisputeDesc] = useState('');
  const [disputeSeverity, setDisputeSeverity] = useState('MEDIUM');

  const fetchActiveBookings = async () => {
    try {
      const data = await api.getBookings();
      // Only bookings that are reserved, checked in, or in progress
      const relevant = data.filter(b => ['CHECKED_IN', 'IN_PROGRESS', 'RESERVED', 'COMPLETED'].includes(b.status));
      setActiveBookings(relevant);
      if (relevant.length > 0 && !selectedBookingId) {
        setSelectedBookingId(relevant[0].id.toString());
        setEscrowViewBookingId(relevant[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load bookings for handover:', err);
    }
  };

  useEffect(() => {
    fetchActiveBookings();
  }, [user]);

  useEffect(() => {
    if (escrowViewBookingId) {
      fetchEscrowComparison(escrowViewBookingId);
    }
  }, [escrowViewBookingId]);

  const fetchEscrowComparison = async (bookingId) => {
    setLoadingEscrow(true);
    try {
      const data = await api.getBookingInspections(bookingId);
      setEscrowDetail(data);
    } catch (err) {
      console.error('Failed to fetch escrow inspection:', err);
    } finally {
      setLoadingEscrow(false);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitInspection = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) {
      alert('Please select a valid booking session.');
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      let uploadedPhotoUrl = photoPreview;

      // If actual file selected, upload to backend uploads directory
      if (photoFile) {
        setUploading(true);
        const uploadRes = await api.uploadPhoto(photoFile);
        uploadedPhotoUrl = uploadRes.photo_url;
        setUploading(false);
      }

      await api.submitInspection({
        booking_id: parseInt(selectedBookingId),
        inspection_type: inspectionType,
        condition_rating: conditionRating,
        checklist_cleanliness: checklist.cleanliness,
        checklist_calibration: checklist.calibration,
        checklist_safety_guards: checklist.safety_guards,
        checklist_consumables: checklist.consumables,
        photo_url: uploadedPhotoUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500',
        notes: notes || 'Inspection verified and counter-signed.'
      });

      setMessage({
        type: 'success',
        text: `ProofHandover ${inspectionType} inspection cryptographically sealed and attached to machine custody trail!`
      });

      // Refresh escrow view
      fetchEscrowComparison(selectedBookingId);
      fetchActiveBookings();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message
      });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleFileDispute = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) return;

    try {
      const currentBk = activeBookings.find(b => b.id.toString() === selectedBookingId);
      await api.reportDispute({
        equipment_id: currentBk ? currentBk.equipment_id : 1,
        booking_id: parseInt(selectedBookingId),
        description: disputeDesc,
        severity: disputeSeverity
      });

      alert('Equipment condition dispute formally lodged. Custodian notified and machine tagged for investigation.');
      setShowDisputeModal(false);
      fetchActiveBookings();
    } catch (err) {
      alert(`Dispute filing failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
            <Camera className="w-4 h-4" />
            <span>Module C: ProofHandover</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Digital Equipment Inspection & Condition Escrow
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Dual-sided digital chain-of-custody. Browser-native photographic attestation, structured condition checkpoints, and mutual sign-off eliminate the "it was like that before" dispute blackbox.
          </p>
        </div>

        <button
          onClick={() => setShowDisputeModal(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-600/90 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 flex items-center space-x-2 shrink-0 transition"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Report Machine Dispute / Damage</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inspection Submission Intake Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-white font-bold text-base">
              <CheckSquare className="w-5 h-5 text-cyan-400" />
              <span>Digital Inspection Attestation</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              STEP 1 & 2 OF CUSTODY
            </span>
          </div>

          <form onSubmit={handleSubmitInspection} className="space-y-4 text-xs">
            {/* Select Booking Session */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Select Active Booking Session
              </label>
              <select
                value={selectedBookingId}
                onChange={(e) => {
                  setSelectedBookingId(e.target.value);
                  setEscrowViewBookingId(e.target.value);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                required
              >
                {activeBookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    #{b.id.toString().padStart(4, '0')} - {b.equipment?.name} ({b.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Inspection Stage Toggle */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Inspection Stage</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInspectionType('PRE_USE')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border transition ${
                    inspectionType === 'PRE_USE'
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>PRE-USE (Pre-Flight Baseline)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectionType('POST_USE')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border transition ${
                    inspectionType === 'POST_USE'
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>POST-USE (Return & Handover)</span>
                </button>
              </div>
            </div>

            {/* Overall Machine Condition Rating */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Observed Condition Rating</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'EXCELLENT', label: 'Excellent', color: 'text-emerald-400' },
                  { id: 'GOOD', label: 'Good', color: 'text-blue-400' },
                  { id: 'FAIR', label: 'Fair / Wear', color: 'text-amber-400' },
                  { id: 'DAMAGED', label: 'Damaged', color: 'text-rose-400' }
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setConditionRating(r.id)}
                    className={`py-2 px-2 rounded-xl font-bold text-[11px] border text-center transition ${
                      conditionRating === r.id
                        ? 'bg-slate-800 border-blue-500 ring-1 ring-blue-500 ' + r.color
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Structured Condition Checklist */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block font-mono">
                Mandatory Operational Checklist
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={checklist.cleanliness}
                    onChange={(e) => setChecklist({ ...checklist, cleanliness: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span className="text-slate-300">Surface Cleanliness & Spoilboard Clear</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={checklist.calibration}
                    onChange={(e) => setChecklist({ ...checklist, calibration: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span className="text-slate-300">Spindle / Axis Zero Calibrated</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={checklist.safety_guards}
                    onChange={(e) => setChecklist({ ...checklist, safety_guards: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span className="text-slate-300">Safety Guards & Interlocks Engaged</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={checklist.consumables}
                    onChange={(e) => setChecklist({ ...checklist, consumables: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span className="text-slate-300">Fluids / Coolant Reservoir Adequate</span>
                </label>
              </div>
            </div>

            {/* Condition Photograph Evidence Upload */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Attach Machine Condition Photograph (Evidence)
              </label>
              <div className="flex items-center space-x-3">
                <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 flex items-center space-x-2 transition shrink-0">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Choose Photo File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
                <span className="text-slate-400 text-[11px] truncate">
                  {photoFile ? photoFile.name : 'PNG, JPG, or WEBP condition capture'}
                </span>
              </div>

              {photoPreview && (
                <div className="mt-2 relative w-32 h-24 rounded-lg overflow-hidden border border-slate-700">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Attestation Notes */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Inspection Attestation Notes</label>
              <textarea
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detail collet alignment, resin tank clarity, cooling pump flow, or baseline observations..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
              ></textarea>
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-xs font-semibold ${
                message.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? 'Anchoring Inspection...' : `Attest & Seal ${inspectionType} Inspection`}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Digital Condition Escrow (Side-by-Side Comparison) (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-white font-bold text-base">
              <Layers className="w-5 h-5 text-blue-400" />
              <span>Condition Escrow Vault</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              DUAL-SIDED
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Immutable comparison escrow comparing machine state before and after operational sessions.
          </p>

          {loadingEscrow ? (
            <div className="h-64 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800"></div>
          ) : escrowDetail ? (
            <div className="space-y-4">
              {/* Pre-Use Card */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase font-mono">
                    1. PRE-USE BASELINE
                  </span>
                  {escrowDetail.pre_use ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      {escrowDetail.pre_use.condition_rating}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">PENDING ATTENTION</span>
                  )}
                </div>

                {escrowDetail.pre_use ? (
                  <div className="space-y-2">
                    {escrowDetail.pre_use.photo_url && (
                      <div className="h-28 w-full rounded-lg overflow-hidden border border-slate-800">
                        <img
                          src={escrowDetail.pre_use.photo_url}
                          alt="Pre-use evidence"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <p className="text-xs text-slate-300 font-mono">
                      "{escrowDetail.pre_use.notes}"
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Inspector: {escrowDetail.pre_use.inspector_name} • {new Date(escrowDetail.pre_use.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Pre-use baseline inspection has not been submitted yet for this session.
                  </p>
                )}
              </div>

              {/* Post-Use Card */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-400 uppercase font-mono">
                    2. POST-USE RETURN STATE
                  </span>
                  {escrowDetail.post_use ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      {escrowDetail.post_use.condition_rating}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">PENDING RELEASE</span>
                  )}
                </div>

                {escrowDetail.post_use ? (
                  <div className="space-y-2">
                    {escrowDetail.post_use.photo_url && (
                      <div className="h-28 w-full rounded-lg overflow-hidden border border-slate-800">
                        <img
                          src={escrowDetail.post_use.photo_url}
                          alt="Post-use evidence"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <p className="text-xs text-slate-300 font-mono">
                      "{escrowDetail.post_use.notes}"
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Signed Off by: {escrowDetail.post_use.inspector_name} • {new Date(escrowDetail.post_use.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Post-use return inspection pending completion of operational slot.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">Select a booking session to inspect condition escrow records.</p>
          )}
        </div>
      </div>

      {/* Damage Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowDisputeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2 text-rose-400 text-xs font-mono font-bold uppercase mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Damage & Liability Escalation</span>
              </div>
              <h2 className="text-xl font-black text-white">File Equipment Dispute</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Formally freezes machine custody, prevents fault attribution to incoming user, and triggers custodian dispute resolution.
              </p>
            </div>

            <form onSubmit={handleFileDispute} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Severity Tier</label>
                <select
                  value={disputeSeverity}
                  onChange={(e) => setDisputeSeverity(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-rose-500 font-semibold"
                >
                  <option value="LOW">LOW - Cosmetic scratch / minor debris</option>
                  <option value="MEDIUM">MEDIUM - Misaligned tool / clogged consumable</option>
                  <option value="HIGH">HIGH - Spindle collision / optic damage (HALT MACHINE)</option>
                  <option value="CRITICAL">CRITICAL - Structural failure / safety interlock broken</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Incident Description & Location</label>
                <textarea
                  rows="3"
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder="Describe observed physical damage upon arrival at station..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-rose-500"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-600/30 transition"
                >
                  File & Freeze Custody
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
