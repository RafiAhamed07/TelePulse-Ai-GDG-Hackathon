import React, { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Radio,
  Activity,
  ShieldCheck,
  RotateCcw,
  ListOrdered,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export function IncidentDetailModal({ incidentId, onClose }) {
  const { incidents, updateIncidentStatus, diagnoseIncidentWithAI } = useNetwork();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(null); // 'Investigating' | 'Resolved'
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showFallbackMode, setShowFallbackMode] = useState(false);

  const incident = incidents.find(i => i.id === incidentId || i.displayId === incidentId);

  if (!incident) return null;

  const handleRunAiAnalysis = async (fallback = false) => {
    setIsAnalyzing(true);
    try {
      await diagnoseIncidentWithAI(incident.id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmStatus) return;
    setIsUpdatingStatus(true);
    try {
      await updateIncidentStatus(incident.id, confirmStatus);
      setConfirmStatus(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const ai = incident.aiAnalysis;
  const samples = incident.evidenceSamples || [];
  const latestSample = samples[samples.length - 1] || {};

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#111B49]/50 backdrop-blur-sm animate-fadeIn overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-4xl w-full border border-[#EAE8F5] shadow-modal my-auto overflow-hidden max-h-[92vh] flex flex-col">
          {/* Top Header */}
          <div className="p-5 sm:px-6 sm:py-5 border-b border-[#ECEAF5] bg-[#FDFDFF] flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                <SeverityBadge severity={incident.severity} />
                <span className="font-mono text-base sm:text-lg font-bold text-[#171B3D]">
                  {incident.displayId}
                </span>
                <StatusBadge status={incident.status} />
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#EDE9FF] text-[#6546E8]">
                  SIMULATED TELEMETRY
                </span>
              </div>
              <p className="text-xs text-[#68708D] flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[#171B3D]">
                  Site: {incident.towerId} ({incident.towerName || 'Baridhara Hub'})
                </span>
                <span>•</span>
                <span>Network: {incident.networkType}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Clock size={12} />
                  Detected: {new Date(incident.detectedAt).toLocaleString()}
                </span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#9299AF] hover:text-[#171B3D] hover:bg-[#F5F4FF] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {/* Status Workflow Ribbon */}
            <div className="bg-[#F8F8FF] p-4 rounded-2xl border border-[#EAE8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-[#68708D] uppercase tracking-wider block">
                  Incident Operational Lifecycle
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-semibold ${incident.status === 'Open' ? 'text-[#E85D70]' : 'text-[#68708D]'}`}>
                    1. Open
                  </span>
                  <ChevronRight size={13} className="text-[#9299AF]" />
                  <span className={`text-xs font-semibold ${incident.status === 'Investigating' ? 'text-[#F3A43B]' : 'text-[#68708D]'}`}>
                    2. Investigating
                  </span>
                  <ChevronRight size={13} className="text-[#9299AF]" />
                  <span className={`text-xs font-semibold ${incident.status === 'Resolved' ? 'text-[#20B486]' : 'text-[#68708D]'}`}>
                    3. Resolved
                  </span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2">
                {incident.status === 'Open' && (
                  <button
                    onClick={() => setConfirmStatus('Investigating')}
                    data-testid="btn-mark-investigating"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FEF6EB] text-[#F3A43B] border border-[#FBD9A4] hover:bg-[#fdeece] transition-all flex items-center gap-1.5"
                  >
                    <span>Mark Investigating</span>
                  </button>
                )}

                {incident.status === 'Investigating' && (
                  <button
                    onClick={() => setConfirmStatus('Resolved')}
                    data-testid="btn-resolve-incident"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#E8F8F2] text-[#20B486] border border-[#A3EAD2] hover:bg-[#d8f4ea] transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    <span>Resolve Incident</span>
                  </button>
                )}

                {incident.status === 'Resolved' && (
                  <div className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#E8F8F2] text-[#20B486] border border-[#A3EAD2] flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    <span>Incident Resolved</span>
                  </div>
                )}
              </div>
            </div>

            {/* Evidence & Baseline Comparison */}
            <div>
              <h4 className="font-manrope text-sm font-bold text-[#171B3D] mb-3 flex items-center gap-2">
                <Activity size={16} className="text-[#6546E8]" />
                Triggering Evidence & Baseline Comparison
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#FFF8F9] border border-[#F9B6C1]">
                  <span className="text-[11px] font-semibold text-[#68708D] block">Breached Latency</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono text-xl font-bold text-[#E85D70]">
                      {latestSample.latency_ms || 320} ms
                    </span>
                    <span className="text-[11px] font-mono text-[#9299AF]">
                      Baseline: {incident.baseline?.latency_ms || 45} ms
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#E85D70] font-semibold block mt-1">
                    Crit Threshold: &gt; 250 ms
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FFF8F9] border border-[#F9B6C1]">
                  <span className="text-[11px] font-semibold text-[#68708D] block">Packet Loss Rate</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono text-xl font-bold text-[#E85D70]">
                      {latestSample.packet_loss_percent || 16.5}%
                    </span>
                    <span className="text-[11px] font-mono text-[#9299AF]">
                      Baseline: {incident.baseline?.packet_loss_percent || 0.4}%
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#E85D70] font-semibold block mt-1">
                    Crit Threshold: &gt; 10%
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F9F8FF] border border-[#EAE8F5]">
                  <span className="text-[11px] font-semibold text-[#68708D] block">Subscribers Connected</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono text-xl font-bold text-[#171B3D]">
                      {latestSample.connected_users?.toLocaleString() || '1,250'}
                    </span>
                    <span className="text-[11px] text-[#20B486] font-medium">Normal load</span>
                  </div>
                  <span className="text-[10px] text-[#68708D] block mt-1">
                    Throughput: {latestSample.traffic_mbps || 850} Mbps
                  </span>
                </div>
              </div>
            </div>

            {/* TowerMind AI Diagnosis Section */}
            <div className="rounded-2xl border-2 border-[#DCD6FA] bg-gradient-to-b from-[#FBFBFF] to-white p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#ECEAF5] mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center text-white shadow-sm">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-manrope text-sm font-bold text-[#171B3D]">
                        TowerMind AI Incident Diagnosis
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-[#EDE9FF] text-[#6546E8] text-[10px] font-bold">
                        Gemini 1.5 Pro
                      </span>
                    </div>
                    <p className="text-[11px] text-[#68708D]">
                      Strict ground-truth extraction from validated telemetry allowlist.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRunAiAnalysis(false)}
                  disabled={isAnalyzing}
                  data-testid="btn-analyze-gemini"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-gradient hover:opacity-95 text-white flex items-center gap-2 shadow-sm shadow-[#496DF5]/20 self-start sm:self-auto transition-all"
                >
                  <Sparkles size={14} />
                  {isAnalyzing ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Reasoning with Gemini...
                    </span>
                  ) : ai ? (
                    'Re-Analyze with TowerMind'
                  ) : (
                    'Analyze with Gemini'
                  )}
                </button>
              </div>

              {/* AI Content States */}
              {isAnalyzing ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full border-3 border-[#EDE9FF] border-t-[#6546E8] animate-spin mx-auto"></div>
                  <p className="font-manrope text-sm font-semibold text-[#171B3D]">
                    TowerMind is synthesizing telemetry patterns...
                  </p>
                  <p className="text-xs text-[#68708D] max-w-sm mx-auto">
                    Evaluating backhaul latency divergence, cross-checking sample baselines, and isolating hypotheses.
                  </p>
                </div>
              ) : ai ? (
                <div className="space-y-4 animate-fadeIn">
                  {/* AI Label and Summary */}
                  <div className="p-3.5 rounded-xl bg-[#F4F1FF] border border-[#E0DAFC]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold tracking-wider text-[#6546E8] uppercase">
                        AI-GENERATED EXECUTIVE SUMMARY
                      </span>
                      <span className="text-[10px] font-mono text-[#9299AF]">
                        Model: {ai.model}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#171B3D] leading-relaxed">
                      {ai.summary}
                    </p>
                  </div>

                  {/* Observed Facts vs Possible Causes (Strictly Separated per PRD §1, UI_Spec §9) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Observed Facts */}
                    <div className="p-4 rounded-xl bg-white border border-[#EAE8F5]">
                      <h5 className="font-manrope text-xs font-bold text-[#171B3D] mb-2 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-[#20B486]" />
                        Observed Facts (Verified Telemetry)
                      </h5>
                      <ul className="space-y-2 text-xs text-[#171B3D]">
                        {ai.observedFacts.map((fact, i) => (
                          <li key={i} className="flex items-start gap-2 bg-[#F8F8FF] p-2 rounded-lg border border-[#ECEAF5]">
                            <span className="text-[#6546E8] font-bold">•</span>
                            <span className="text-[11px] leading-snug">{fact.statement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Possible Causes (Hypotheses) */}
                    <div className="p-4 rounded-xl bg-white border border-[#EAE8F5]">
                      <h5 className="font-manrope text-xs font-bold text-[#171B3D] mb-2 flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-[#F3A43B]" />
                        Possible Causes (Hypotheses, Not Confirmed)
                      </h5>
                      <div className="space-y-2.5">
                        {ai.possibleCauses.map((cause, i) => (
                          <div key={i} className="bg-[#FFFBF5] p-2.5 rounded-lg border border-[#FBD9A4] text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-[#171B3D] text-[11px]">{cause.hypothesis}</span>
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-[#FEF6EB] text-[#F3A43B]">
                                {cause.confidence} confidence
                              </span>
                            </div>
                            <p className="text-[11px] text-[#68708D] leading-snug">{cause.rationale}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Customer Impact & Recommended Next Checks */}
                  <div className="p-4 rounded-xl bg-[#F9F8FF] border border-[#EAE8F5]">
                    <h5 className="font-manrope text-xs font-bold text-[#171B3D] mb-1.5 flex items-center gap-1.5">
                      <ListOrdered size={14} className="text-[#6546E8]" />
                      Recommended Investigation Steps (Human Decision Required)
                    </h5>
                    <div className="space-y-2 mt-2">
                      {ai.recommendedChecks.map((check, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs bg-white p-2.5 rounded-lg border border-[#ECEAF5]">
                          <span className="w-5 h-5 rounded-full bg-[#EDE9FF] text-[#6546E8] font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="font-semibold text-[#171B3D] text-[11px]">{check.step}</p>
                            <p className="text-[10px] text-[#68708D] mt-0.5">{check.rationale}</p>
                          </div>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                            check.priority === 'high' ? 'bg-[#FDEDF0] text-[#E85D70]' : 'bg-[#FEF6EB] text-[#F3A43B]'
                          }`}>
                            {check.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Uncertainties & Data Gaps */}
                  <div className="p-3 bg-[#F8F8FF] rounded-xl border border-[#ECEAF5] text-[11px] text-[#68708D] space-y-1">
                    <p className="font-semibold text-[#171B3D]">Uncertainty & Boundaries:</p>
                    <p>• {ai.uncertainties?.join(' ')}</p>
                    <p>• Missing in current telemetry feed: {ai.dataGaps?.join(', ')}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles size={28} className="mx-auto text-[#6546E8] mb-2 opacity-60" />
                  <p className="font-manrope text-sm font-semibold text-[#171B3D]">
                    Incident Not Yet Analyzed by TowerMind
                  </p>
                  <p className="text-xs text-[#68708D] max-w-sm mx-auto mt-1 mb-4">
                    Click "Analyze with Gemini" to extract observed facts, evaluate hypotheses, and generate structured diagnostic recommendations.
                  </p>
                  <button
                    onClick={() => handleRunAiAnalysis(false)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-gradient hover:opacity-95 text-white inline-flex items-center gap-2 shadow-sm"
                  >
                    <Sparkles size={14} />
                    Run TowerMind AI Diagnosis
                  </button>
                </div>
              )}
            </div>

            {/* Audit Status History */}
            <div>
              <h4 className="font-manrope text-xs font-bold text-[#68708D] uppercase tracking-wider mb-2">
                Status Audit Trail
              </h4>
              <div className="space-y-1.5">
                {incident.statusHistory?.map((h, i) => (
                  <div key={i} className="text-xs p-2 rounded-lg bg-[#F9F8FF] border border-[#ECEAF5] flex items-center justify-between">
                    <span className="font-medium text-[#171B3D]">
                      {h.from} → <span className="font-bold text-[#6546E8]">{h.to}</span>: {h.note}
                    </span>
                    <span className="font-mono text-[10px] text-[#9299AF]">
                      {new Date(h.at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Status Change */}
      <ConfirmDialog
        isOpen={!!confirmStatus}
        title={`Update Incident to ${confirmStatus}?`}
        message={`You are about to change the status of ${incident.displayId} on tower ${incident.towerId} to "${confirmStatus}".`}
        note="This records the human operator decision in the audit log and updates the incident document. It does not alter live radio equipment."
        confirmText={`Confirm ${confirmStatus}`}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setConfirmStatus(null)}
        isLoading={isUpdatingStatus}
      />
    </>
  );
}
