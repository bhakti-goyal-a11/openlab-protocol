import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Award, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Upload, 
  FileCheck, 
  Sparkles,
  Calendar,
  Lock,
  Plus,
  X
} from 'lucide-react';

export default function TrustPass() {
  const { user, refreshUser } = useAuth();
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Credential Form
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState('CNC-5AXIS-SAFETY');
  const [customTitle, setCustomTitle] = useState('5-Axis Precision Subtractive Machining & CAM Offsets');
  const [issuerName, setIssuerName] = useState('Dept of Mechanical Engineering');
  const [proofUrl, setProofUrl] = useState('https://example.com/certificates/training_proof.pdf');
  const [notes, setNotes] = useState('Completed 12-hour laboratory workshop and safety exam.');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);

  const availableQualifications = [
    { code: 'GPU-CLUSTER-CERT', title: 'Accelerated HPC & Multi-GPU Infrastructure Safety', issuer: 'AI Center of Excellence' },
    { code: 'CNC-5AXIS-SAFETY', title: '5-Axis Precision Subtractive Machining & CAM Offsets', issuer: 'Dept of Mechanical Engineering' },
    { code: '3D-PRINT-ADVANCED', title: 'Industrial SLA/SLS Additive Manufacturing Safety', issuer: 'Makerspace Technical Advisory' },
    { code: 'RF-LAB-SAFETY', title: 'Microwave RF Instrumentation & Spectrum Analyzer Operations', issuer: 'Tesla Center RF Lab Staff' },
    { code: 'PCB-MILL-CERT', title: 'Precision PCB Prototyping & Isolation Routing', issuer: 'Electrical Engineering Maker Hub' },
    { code: 'LASER-SAFETY-L2', title: 'Class 4 High-Power Industrial Laser Systems Safety', issuer: 'Campus Environmental Health & Safety' },
    { code: 'TENSILE-TEST-L1', title: 'Universal Materials Tensile Testing & Load Cell Safety', issuer: 'Materials Science Department' }
  ];

  const fetchPassport = async () => {
    setLoading(true);
    try {
      const data = await api.getMyPassport();
      setPassport(data);
    } catch (err) {
      console.error('Failed to load TrustPass:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassport();
  }, [user]);

  const handleSelectPreset = (code) => {
    setSelectedCode(code);
    const found = availableQualifications.find(q => q.code === code);
    if (found) {
      setCustomTitle(found.title);
      setIssuerName(found.issuer);
    }
  };

  const handleSubmitCredential = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);

    try {
      await api.submitCredential({
        qualification_code: selectedCode,
        title: customTitle,
        issuer_name: issuerName,
        proof_document_url: proofUrl,
        notes: notes
      });

      setSubmitMessage({
        type: 'success',
        text: 'Training credential submitted! Dispatched to Lab Custodian verification queue.'
      });

      setTimeout(() => {
        setShowSubmitModal(false);
        fetchPassport();
        refreshUser();
      }, 1500);
    } catch (err) {
      setSubmitMessage({
        type: 'error',
        text: err.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getTrustScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40';
    if (score >= 70) return 'text-amber-400 border-amber-500/40 bg-amber-950/40';
    return 'text-rose-400 border-rose-500/40 bg-rose-950/40';
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Module A: TrustPass</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Digital Skill Passport & Pre-Flight Credentials
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Cryptographically bounded digital student passport. Replaces paper waivers and defensive custodian gatekeeping with dynamic competency verification and behavior-linked TrustScores.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center space-x-2 shrink-0 self-start md:self-auto transition"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Training Credential</span>
        </button>
      </div>

      {loading ? (
        <div className="h-72 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-800"></div>
      ) : passport ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Digital Student Identity Card (SaaS ID Design) */}
          <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-2xl p-6 relative overflow-hidden shadow-2xl space-y-6">
            {/* Holographic accent glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Card Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
                  TRUSTPASS ID
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400/80 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">
                VERIFIED AUTH
              </span>
            </div>

            {/* Student Persona Info */}
            <div className="flex items-center space-x-4">
              {passport.avatar_url ? (
                <img
                  src={passport.avatar_url}
                  alt={passport.full_name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-xl font-bold text-white">
                  {passport.full_name?.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-extrabold text-white text-lg leading-tight">
                  {passport.full_name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {passport.student_id_number || 'STU-UNASSIGNED'}
                </p>
                <p className="text-[11px] text-cyan-400 mt-0.5 font-medium">
                  {passport.department_name}
                </p>
              </div>
            </div>

            {/* TrustScore & Fairness Gauges */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl border ${getTrustScoreColor(passport.trust_score)}`}>
                <div className="flex items-center justify-between text-[10px] uppercase font-mono font-bold tracking-wider mb-1">
                  <span>TrustScore</span>
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div className="text-2xl font-black font-mono">
                  {passport.trust_score}
                  <span className="text-xs text-slate-400 font-normal">/100</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Dynamic reliability rating
                </p>
              </div>

              <div className="p-3 rounded-xl border bg-slate-950/80 border-slate-800 text-cyan-300">
                <div className="flex items-center justify-between text-[10px] uppercase font-mono font-bold tracking-wider mb-1 text-slate-400">
                  <span>Fairness</span>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-2xl font-black font-mono">
                  {passport.fairness_score}
                  <span className="text-xs text-slate-400 font-normal">/10</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Algorithmic priority weight
                </p>
              </div>
            </div>

            {/* Weekly Quota Progress */}
            <div className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Weekly Booking Quota:</span>
                <span className="font-mono font-bold text-white">
                  {passport.weekly_hours_used}h / {passport.weekly_quota}h
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (passport.weekly_hours_used / Math.max(1, passport.weekly_quota)) * 100)}%`
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                <span>Concurrency Cap: {passport.concurrency_limit} active slots</span>
                <span>No-Shows: {passport.no_show_count}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 font-mono text-center">
              SHA-256 HASH VERIFIED IDENTITY • OPENLAB TRUSTX
            </div>
          </div>

          {/* Qualification Badges & Credentials Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Equipment-Specific Qualification Badges
                </h3>
                <p className="text-xs text-slate-400">
                  Verified prerequisite safety certificates permitting access to high-value capital assets.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded-lg">
                {passport.badges.filter(b => b.status === 'APPROVED').length} Active Badges
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {passport.badges.map((badge) => {
                const isApproved = badge.status === 'APPROVED';
                const isPending = badge.status === 'PENDING';
                const isExpired = badge.status === 'EXPIRED';

                return (
                  <div
                    key={badge.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 truncate">
                          {badge.qualification_code}
                        </span>

                        {isApproved && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>APPROVED</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center space-x-1 shrink-0">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>AWAITING CUSTODIAN</span>
                          </span>
                        )}
                        {isExpired && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40 shrink-0">
                            EXPIRED
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-white text-sm mt-2 leading-snug">
                        {badge.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Issuer: {badge.issuer_name}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Expires: {badge.expires_at ? new Date(badge.expires_at).toLocaleDateString() : 'Perpetual'}
                        </span>
                      </div>
                      {badge.verified_by_name && (
                        <span className="text-[10px] text-slate-400">
                          Verified by {badge.verified_by_name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Submit Credential Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-bold uppercase mb-1">
                <Upload className="w-4 h-4" />
                <span>TrustPass Certification Intake</span>
              </div>
              <h2 className="text-xl font-black text-white">Submit Training Credential</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Uploaded credentials require digital review and cryptographic counter-signing by facility custodians.
              </p>
            </div>

            <form onSubmit={handleSubmitCredential} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Standard Campus Qualification Code
                </label>
                <select
                  value={selectedCode}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                >
                  {availableQualifications.map(q => (
                    <option key={q.code} value={q.code}>{q.code} - {q.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Credential Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Issuing Authority / Instructor</label>
                <input
                  type="text"
                  value={issuerName}
                  onChange={(e) => setIssuerName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Certificate / Proof URL</label>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://campus.lms.edu/verify/cert123"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Laboratory Experience Notes</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              {submitMessage && (
                <div className={`p-3 rounded-lg text-xs font-semibold ${
                  submitMessage.type === 'success' 
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' 
                    : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                }`}>
                  {submitMessage.text}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 transition flex items-center space-x-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{submitting ? 'Submitting...' : 'Dispatch for Verification'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
