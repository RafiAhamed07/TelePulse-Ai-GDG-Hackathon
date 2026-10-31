import React from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { PlayCircle, AlertCircle, FileSearch, CheckCircle2, ArrowRight } from 'lucide-react';

export function TryItGuideCard({ onOpenIncident, onNavigateTab }) {
  const { triggerIncident, activeDegradation, incidents } = useNetwork();
  const dhk104Incident = incidents.find(i => i.towerId === 'DHK-104' && i.status !== 'Resolved');

  return (
    <div className="bg-gradient-to-r from-[#EDE9FF]/80 via-[#F5F4FF] to-[#EDF3FF]/80 rounded-2xl p-5 border border-[#DCD6FA] shadow-subtle mb-6 relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#6546E8] text-white text-[11px] font-bold tracking-wide uppercase">
              Hackathon Golden Path
            </span>
            <span className="text-xs font-semibold text-[#171B3D]">
              Judge & Operator Demonstration Guide
            </span>
          </div>
          <p className="text-xs text-[#68708D] leading-relaxed max-w-2xl">
            Test the complete end-to-end incident lifecycle: trigger telemetry degradation, watch rule-based detection, examine TowerMind AI root-cause diagnosis, and resolve the incident.
          </p>
        </div>

        <div className="shrink-0">
          <button
            onClick={() => triggerIncident('DHK-104')}
            disabled={!!activeDegradation}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
              activeDegradation
                ? 'bg-[#EAE8F5] text-[#9299AF] cursor-not-allowed'
                : 'bg-brand-gradient hover:opacity-95 text-white shadow-[#496DF5]/20'
            }`}
          >
            <PlayCircle size={16} />
            {activeDegradation ? 'Incident In Progress...' : 'Trigger Incident (DHK-104)'}
          </button>
        </div>
      </div>

      {/* 4 Interactive Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-3 border-t border-[#E0DCF7]">
        {/* Step 1 */}
        <div className={`p-3 rounded-xl border transition-all ${
          activeDegradation 
            ? 'bg-[#FDEDF0] border-[#F9B6C1] text-[#E85D70]' 
            : 'bg-white/80 border-[#EAE8F5] text-[#171B3D]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono font-bold text-[#6546E8]">STEP 1</span>
            <span className="w-2 h-2 rounded-full bg-[#7653F5]"></span>
          </div>
          <p className="text-xs font-semibold">1. Trigger Degradation</p>
          <p className="text-[11px] text-[#68708D] mt-0.5">
            Click trigger button to inject 320ms latency & 16% packet drop into DHK-104.
          </p>
        </div>

        {/* Step 2 */}
        <div className={`p-3 rounded-xl border transition-all ${
          dhk104Incident
            ? 'bg-[#FEF6EB] border-[#FBD9A4] text-[#F3A43B]'
            : 'bg-white/80 border-[#EAE8F5] text-[#171B3D]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono font-bold text-[#6546E8]">STEP 2</span>
            {dhk104Incident ? <AlertCircle size={14} className="text-[#E85D70]" /> : <span className="w-2 h-2 rounded-full bg-[#A9B3D5]"></span>}
          </div>
          <p className="text-xs font-semibold">2. Anomaly Detection</p>
          <p className="text-[11px] text-[#68708D] mt-0.5">
            Detector requires 2 consecutive critical samples before opening incident.
          </p>
        </div>

        {/* Step 3 */}
        <div className="p-3 rounded-xl border bg-white/80 border-[#EAE8F5] text-[#171B3D]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono font-bold text-[#6546E8]">STEP 3</span>
            <FileSearch size={14} className="text-[#6546E8]" />
          </div>
          <p className="text-xs font-semibold">3. AI Diagnosis</p>
          <p className="text-[11px] text-[#68708D] mt-0.5">
            Click incident to view evidence & run grounded TowerMind Gemini analysis.
          </p>
          {dhk104Incident && (
            <button
              onClick={() => onOpenIncident(dhk104Incident.id)}
              className="mt-1.5 text-[11px] font-bold text-[#6546E8] hover:underline flex items-center gap-1"
            >
              Open Incident <ArrowRight size={12} />
            </button>
          )}
        </div>

        {/* Step 4 */}
        <div className="p-3 rounded-xl border bg-white/80 border-[#EAE8F5] text-[#171B3D]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono font-bold text-[#6546E8]">STEP 4</span>
            <CheckCircle2 size={14} className="text-[#20B486]" />
          </div>
          <p className="text-xs font-semibold">4. Forward Status</p>
          <p className="text-[11px] text-[#68708D] mt-0.5">
            Confirm transition: Open → Investigating → Resolved (persists on refresh).
          </p>
        </div>
      </div>
    </div>
  );
}

