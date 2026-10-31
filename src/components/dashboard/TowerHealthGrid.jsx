import React from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { Radio, Users, Activity, AlertOctagon, CheckCircle2, AlertTriangle } from 'lucide-react';

export function TowerHealthGrid({ onSelectTower }) {
  const { towers, activeDegradation } = useNetwork();

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#EAE8F5] shadow-subtle">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#ECEAF5]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-manrope text-[15px] font-bold text-[#171B3D]">
              Tower Health & Telemetry Matrix
            </h3>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#EDE9FF] text-[#6546E8]">
              20 Dhaka Sites
            </span>
          </div>
          <p className="text-xs text-[#68708D] mt-0.5">
            Real-time multi-cell monitoring. Click any cell for deep telemetry analysis.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#20B486]"></span>
            <span className="text-[#68708D] text-[11px]">Healthy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F3A43B]"></span>
            <span className="text-[#68708D] text-[11px]">Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E85D70]"></span>
            <span className="text-[#68708D] text-[11px]">Critical</span>
          </div>
        </div>
      </div>

      {/* 20 Towers Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {towers.map(tower => {
          const isCritical = tower.health === 'critical';
          const isWarning = tower.health === 'warning';
          const isTargeted = activeDegradation && activeDegradation.towerId === (tower.tower_id || tower.id);

          let borderClass = 'border-[#EAE8F5] hover:border-[#6546E8]';
          let statusBg = 'bg-[#E8F8F2] text-[#20B486]';
          let StatusIcon = CheckCircle2;

          if (isCritical) {
            borderClass = 'border-[#F9B6C1] bg-[#FFF8F9] ring-1 ring-[#E85D70]';
            statusBg = 'bg-[#FDEDF0] text-[#E85D70]';
            StatusIcon = AlertOctagon;
          } else if (isWarning) {
            borderClass = 'border-[#FBD9A4] bg-[#FFFBF5]';
            statusBg = 'bg-[#FEF6EB] text-[#F3A43B]';
            StatusIcon = AlertTriangle;
          }

          return (
            <div
              key={tower.id || tower.tower_id}
              onClick={() => onSelectTower && onSelectTower(tower.id || tower.tower_id)}
              className={`p-3.5 rounded-xl border ${borderClass} cursor-pointer transition-all hover:shadow-hover relative overflow-hidden group`}
            >
              {isTargeted && (
                <div className="absolute top-0 right-0 bg-[#E85D70] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg animate-pulse">
                  TEST INJECT
                </div>
              )}

              {/* Tower ID and Type */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-[#171B3D] group-hover:text-[#6546E8] transition-colors">
                  {tower.id || tower.tower_id}
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#F5F5FC] text-[#68708D] border border-[#E5E3F0]">
                  {tower.type || tower.network_type}
                </span>
              </div>

              {/* Site Name */}
              <p className="text-[11px] font-medium text-[#68708D] truncate mb-2">
                {tower.name || tower.tower_name}
              </p>

              {/* Metrics */}
              <div className="space-y-1 pt-1 border-t border-[#ECEAF5]/60 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#9299AF]">Latency:</span>
                  <span className={`font-mono font-semibold ${isCritical ? 'text-[#E85D70]' : isWarning ? 'text-[#F3A43B]' : 'text-[#171B3D]'}`}>
                    {tower.latency_ms} ms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#9299AF]">Loss:</span>
                  <span className={`font-mono font-semibold ${tower.packet_loss_percent >= 10 ? 'text-[#E85D70]' : 'text-[#171B3D]'}`}>
                    {tower.packet_loss_percent}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#9299AF]">Users:</span>
                  <span className="font-mono text-[#68708D]">
                    {tower.connected_users?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status Pill Footer */}
              <div className="mt-2.5 pt-2 border-t border-[#ECEAF5]/60 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusBg}`}>
                  <StatusIcon size={10} />
                  <span className="capitalize">{tower.health}</span>
                </span>
                <span className="text-[10px] font-mono text-[#9299AF]">
                  {tower.availability_percent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

