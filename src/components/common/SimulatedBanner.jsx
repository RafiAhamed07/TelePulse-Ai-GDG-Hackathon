import React from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { Radio, RefreshCw, Zap } from 'lucide-react';

export function SimulatedBanner() {
  const { isSimRunning, activeDegradation, resetSession } = useNetwork();
  const sessionId = 'ORG-001 • DEMO-LIVE';

  return (
    <div className="bg-[#111B49] text-white px-4 py-2 border-b border-[#232F67] flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#6546E8]/30 border border-[#7653F5]/40 text-[#EDE9FF] font-mono font-semibold text-[11px] tracking-wide">
          <span className="w-2 h-2 rounded-full bg-[#20B486] animate-pulse"></span>
          DEMO ENVIRONMENT
        </span>

        <span className="text-[#A9B3D5] flex items-center gap-1">
          <Radio size={13} className="text-[#7653F5]" />
          <span>Simulated Telemetry — 20 Dhaka Metro Sites (ORG-001)</span>
        </span>

        {activeDegradation && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#E85D70]/20 border border-[#E85D70]/40 text-[#F9B6C1] font-semibold text-[11px] animate-pulse">
            <Zap size={12} />
            INCIDENT ACTIVE: {activeDegradation.towerId}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] text-[#A9B3D5]">
          SESSION: <span className="text-white font-medium">{sessionId}</span>
        </span>

        <button
          onClick={resetSession}
          title="Reset demo session to initial baseline state"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#232F67] hover:bg-[#324185] text-[#EDE9FF] transition-colors text-[11px] font-medium"
        >
          <RefreshCw size={11} />
          Reset Demo
        </button>
      </div>
    </div>
  );
}

