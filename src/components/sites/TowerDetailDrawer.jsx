import React from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  X,
  Radio,
  Activity,
  Users,
  Wifi,
  Zap,
  MapPin,
  Server,
  Clock,
  AlertOctagon,
  ArrowRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function TowerDetailDrawer({ towerId, onClose, onOpenIncident }) {
  const { towers, incidents, triggerIncident, activeDegradation } = useNetwork();

  if (!towerId) return null;

  const tower = towers.find(t => (t.tower_id || t.id) === towerId) || {};
  const towerIncidents = incidents.filter(i => i.towerId === towerId);

  // Generate history data points
  const historyData = [
    { time: '-20m', latency: tower.latency_ms - 2, loss: tower.packet_loss_percent },
    { time: '-15m', latency: tower.latency_ms + 1, loss: tower.packet_loss_percent },
    { time: '-10m', latency: tower.latency_ms - 1, loss: tower.packet_loss_percent },
    { time: '-5m', latency: tower.latency_ms + 3, loss: tower.packet_loss_percent },
    { time: 'Now', latency: tower.latency_ms, loss: tower.packet_loss_percent },
  ];

  const isDegraded = activeDegradation && activeDegradation.towerId === towerId;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-modal border-l border-[#EAE8F5] flex flex-col animate-slideLeft">
      {/* Header */}
      <div className="p-5 border-b border-[#ECEAF5] bg-[#FDFDFF] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#EDE9FF] text-[#6546E8] flex items-center justify-center font-bold">
            <Radio size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-base font-bold text-[#171B3D]">
                {tower.tower_id || tower.id}
              </h3>
              <StatusBadge status={tower.health || 'healthy'} size="sm" />
            </div>
            <p className="text-xs text-[#68708D]">{tower.tower_name || tower.name}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-[#9299AF] hover:text-[#171B3D] hover:bg-[#F5F4FF] transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Quick Hardware Spec */}
        <div className="p-4 rounded-2xl bg-[#F9F8FF] border border-[#EAE8F5] grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[#9299AF] block text-[11px]">Radio Technology</span>
            <span className="font-semibold text-[#171B3D]">{tower.network_type || tower.type} MIMO Active</span>
          </div>
          <div>
            <span className="text-[#9299AF] block text-[11px]">Backhaul Link</span>
            <span className="font-semibold text-[#171B3D]">10G DWDM Optical</span>
          </div>
          <div>
            <span className="text-[#9299AF] block text-[11px]">Coordinates</span>
            <span className="font-mono text-[#171B3D] text-[11px]">
              {tower.latitude || 23.79}°, {tower.longitude || 90.41}°
            </span>
          </div>
          <div>
            <span className="text-[#9299AF] block text-[11px]">Cell Sector Capacity</span>
            <span className="font-semibold text-[#20B486]">3 Sectors (120° ea)</span>
          </div>
        </div>

        {/* Live Gauges */}
        <div>
          <h4 className="font-manrope text-xs font-bold text-[#68708D] uppercase tracking-wider mb-2.5">
            Current Telemetry Gauges
          </h4>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-white border border-[#EAE8F5]">
              <span className="text-[11px] text-[#68708D] block">Latency</span>
              <span className="font-mono text-lg font-bold text-[#171B3D]">
                {tower.latency_ms} ms
              </span>
              <span className="text-[10px] text-[#9299AF] block mt-0.5">Threshold: 100/250ms</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#EAE8F5]">
              <span className="text-[11px] text-[#68708D] block">Packet Loss</span>
              <span className="font-mono text-lg font-bold text-[#171B3D]">
                {tower.packet_loss_percent}%
              </span>
              <span className="text-[10px] text-[#9299AF] block mt-0.5">Threshold: 2.0/10%</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#EAE8F5]">
              <span className="text-[11px] text-[#68708D] block">RF Signal Strength</span>
              <span className="font-mono text-lg font-bold text-[#171B3D]">
                {tower.signal_strength_dbm} dBm
              </span>
              <span className="text-[10px] text-[#9299AF] block mt-0.5">Threshold: -100/-110</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#EAE8F5]">
              <span className="text-[11px] text-[#68708D] block">Connected Users</span>
              <span className="font-mono text-lg font-bold text-[#171B3D]">
                {tower.connected_users?.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#9299AF] block mt-0.5">Throughput: {tower.traffic_mbps} Mbps</span>
            </div>
          </div>
        </div>

        {/* Latency History Chart */}
        <div className="p-4 rounded-2xl bg-white border border-[#EAE8F5]">
          <h4 className="font-manrope text-xs font-bold text-[#171B3D] mb-2">
            Recent Latency Trend (Last 20 Minutes)
          </h4>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <XAxis dataKey="time" stroke="#8991A9" fontSize={10} tickLine={false} />
                <YAxis stroke="#8991A9" fontSize={10} tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E8E4F4',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="#6546E8"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#6546E8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents Associated with this Tower */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-manrope text-xs font-bold text-[#68708D] uppercase tracking-wider">
              Recorded Incidents ({towerIncidents.length})
            </h4>
          </div>

          {towerIncidents.length === 0 ? (
            <p className="text-xs text-[#9299AF] italic py-2">No active or historical incidents recorded for this tower.</p>
          ) : (
            <div className="space-y-2">
              {towerIncidents.map(inc => (
                <div
                  key={inc.id}
                  onClick={() => onOpenIncident(inc.id)}
                  className="p-3 rounded-xl bg-[#F8F8FF] border border-[#ECEAF5] hover:border-[#6546E8] cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#171B3D]">{inc.displayId}</span>
                      <StatusBadge status={inc.status} size="sm" />
                    </div>
                    <p className="text-[11px] text-[#68708D] mt-0.5">
                      {inc.triggeringMetrics?.map(b => `${b.metric}: ${b.value}${b.unit}`).join(', ')}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-[#6546E8]" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-4 border-t border-[#ECEAF5] bg-[#F9F8FF] flex items-center justify-between">
        <button
          onClick={() => triggerIncident(tower.tower_id || tower.id)}
          disabled={isDegraded}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            isDegraded
              ? 'bg-[#EAE8F5] text-[#9299AF] cursor-not-allowed'
              : 'bg-brand-gradient hover:opacity-95 text-white shadow-sm'
          }`}
        >
          <Zap size={14} />
          {isDegraded ? 'Fault Injected' : `Inject Fault on ${tower.tower_id || tower.id}`}
        </button>

        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-[#68708D] hover:bg-[#EDE9FF] transition-colors"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
}

