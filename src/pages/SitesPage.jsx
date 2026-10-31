import React, { useState } from 'react';
import { useNetwork } from '../context/NetworkContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { TowerDetailDrawer } from '../components/sites/TowerDetailDrawer';
import {
  Radio,
  Search,
  Filter,
  MapPin,
  List,
  Layers,
  Activity,
  ArrowUpRight,
  Zap,
} from 'lucide-react';

export function SitesPage({ onOpenIncident }) {
  const { towers, activeDegradation } = useNetwork();
  const [viewMode, setViewMode] = useState('grid'); // 'map' | 'grid' | 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [drawerTowerId, setDrawerTowerId] = useState(null);

  // Filtered towers
  const filteredTowers = towers.filter(t => {
    const id = (t.tower_id || t.id).toLowerCase();
    const name = (t.tower_name || t.name || '').toLowerCase();
    const matchesSearch = id.includes(searchTerm.toLowerCase()) || name.includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.health === statusFilter;
    const matchesType = typeFilter === 'all' || (t.network_type || t.type) === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE8F5] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9299AF]" />
          <input
            type="text"
            placeholder="Search by tower ID (e.g. DHK-104) or location..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F5F5FC] border border-[#E5E3F0] rounded-xl text-xs text-[#171B3D] placeholder-[#9299AF] focus:outline-none focus:border-[#6546E8] focus:bg-white transition-all"
          />
        </div>

        {/* Filters and View Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F5F5FC] border border-[#E5E3F0] rounded-xl text-xs font-medium text-[#171B3D] focus:outline-none focus:border-[#6546E8]"
          >
            <option value="all">All Health Statuses</option>
            <option value="healthy">Healthy Only</option>
            <option value="warning">Warning / Degraded</option>
            <option value="critical">Critical Only</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-[#F5F5FC] border border-[#E5E3F0] rounded-xl text-xs font-medium text-[#171B3D] focus:outline-none focus:border-[#6546E8]"
          >
            <option value="all">All Networks (4G/5G)</option>
            <option value="4G">4G LTE Only</option>
            <option value="5G">5G NR Only</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#F5F5FC] p-1 rounded-xl border border-[#E5E3F0]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'grid' ? 'bg-white text-[#6546E8] shadow-xs' : 'text-[#68708D] hover:text-[#171B3D]'
              }`}
              title="Card Grid View"
            >
              <Layers size={14} />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'table' ? 'bg-white text-[#6546E8] shadow-xs' : 'text-[#68708D] hover:text-[#171B3D]'
              }`}
              title="Table View"
            >
              <List size={14} />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'map' ? 'bg-white text-[#6546E8] shadow-xs' : 'text-[#68708D] hover:text-[#171B3D]'
              }`}
              title="Regional Network Map"
            >
              <MapPin size={14} />
              <span className="hidden sm:inline">Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'map' ? (
        /* Interactive Regional Map Visualization */
        <div className="bg-white rounded-3xl p-6 border border-[#EAE8F5] shadow-subtle">
          <div className="flex items-center justify-between pb-4 border-b border-[#ECEAF5] mb-4">
            <div>
              <h3 className="font-manrope text-base font-bold text-[#171B3D]">
                Dhaka Metropolitan Cell Topology Map
              </h3>
              <p className="text-xs text-[#68708D]">
                Spatial distribution of 20 cell sites with color-coded live RF and backhaul status.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#20B486]"></span> Healthy</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F3A43B]"></span> Degraded</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#E85D70]"></span> Critical</span>
            </div>
          </div>

          {/* SVG Map Canvas with Light Lavender Theme */}
          <div className="relative w-full h-[520px] bg-[#F7F6FF] rounded-2xl border border-[#E6E2F5] overflow-hidden flex items-center justify-center">
            {/* Grid Lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#6546E8_1px,transparent_1px)] [background-size:32px_32px] opacity-10"></div>
            
            {/* Fictional River/Topographical Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
              <path d="M 50 100 Q 200 180 350 150 T 600 220 T 900 350" fill="none" stroke="#477BFF" strokeWidth="18" strokeLinecap="round" />
              <path d="M 200 450 Q 450 320 650 400 T 950 420" fill="none" stroke="#477BFF" strokeWidth="12" strokeLinecap="round" />
            </svg>

            {/* Interactive Pins */}
            {filteredTowers.map((tower, idx) => {
              // Convert lat/lng to normalized %
              // Dhaka bbox approx lat 23.70 to 23.88, lng 90.35 to 90.43
              const minLat = 23.70, maxLat = 23.88;
              const minLng = 90.35, maxLng = 90.44;
              const topPercent = 90 - ((tower.latitude - minLat) / (maxLat - minLat)) * 80;
              const leftPercent = 10 + ((tower.longitude - minLng) / (maxLng - minLng)) * 80;

              const isCritical = tower.health === 'critical';
              const isWarning = tower.health === 'warning';
              const pinBg = isCritical ? 'bg-[#E85D70]' : isWarning ? 'bg-[#F3A43B]' : 'bg-[#20B486]';
              const ringColor = isCritical ? 'border-[#E85D70]' : isWarning ? 'border-[#F3A43B]' : 'border-[#20B486]';

              return (
                <div
                  key={tower.id || tower.tower_id}
                  onClick={() => setDrawerTowerId(tower.id || tower.tower_id)}
                  style={{ top: `${topPercent}%`, left: `${leftPercent}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                >
                  <div className="relative flex items-center justify-center">
                    <span className={`absolute w-8 h-8 rounded-full border-2 ${ringColor} opacity-40 animate-ping-slow pointer-events-none`}></span>
                    <div className={`w-8 h-8 rounded-full ${pinBg} text-white flex items-center justify-center shadow-md group-hover:scale-125 transition-all`}>
                      <Radio size={14} />
                    </div>
                  </div>

                  {/* Tooltip on hover */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-[#111B49] text-white p-2.5 rounded-xl shadow-modal text-[11px] whitespace-nowrap z-30">
                    <span className="font-mono font-bold">{tower.tower_id || tower.id}</span>
                    <span className="text-[#A9B3D5]">{tower.tower_name || tower.name}</span>
                    <span className="text-[#EDE9FF] font-mono mt-1">
                      {tower.latency_ms}ms • {tower.packet_loss_percent}% loss
                    </span>
                    <div className="w-2 h-2 bg-[#111B49] rotate-45 -mb-1 mt-1"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* Tabular List View */
        <div className="bg-white rounded-2xl border border-[#EAE8F5] shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F8FF] border-b border-[#ECEAF5] text-[#68708D] font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Tower ID</th>
                  <th className="py-3.5 px-4">Site Name</th>
                  <th className="py-3.5 px-4">Network</th>
                  <th className="py-3.5 px-4">Health Status</th>
                  <th className="py-3.5 px-4">Latency</th>
                  <th className="py-3.5 px-4">Packet Loss</th>
                  <th className="py-3.5 px-4">Signal</th>
                  <th className="py-3.5 px-4">Users</th>
                  <th className="py-3.5 px-4">Throughput</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F4FF]">
                {filteredTowers.map(tower => {
                  const tid = tower.tower_id || tower.id;
                  const isCritical = tower.health === 'critical';

                  return (
                    <tr
                      key={tid}
                      className="hover:bg-[#F9F8FF] transition-colors cursor-pointer"
                      onClick={() => setDrawerTowerId(tid)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#171B3D]">
                        {tid}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#171B3D]">
                        {tower.tower_name || tower.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#F5F5FC] border border-[#E5E3F0] font-mono text-[10px] font-semibold text-[#68708D]">
                          {tower.network_type || tower.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={tower.health} size="sm" />
                      </td>
                      <td className={`py-3 px-4 font-mono font-semibold ${isCritical ? 'text-[#E85D70]' : 'text-[#171B3D]'}`}>
                        {tower.latency_ms} ms
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {tower.packet_loss_percent}%
                      </td>
                      <td className="py-3 px-4 font-mono text-[#68708D]">
                        {tower.signal_strength_dbm} dBm
                      </td>
                      <td className="py-3 px-4 font-mono text-[#68708D]">
                        {tower.connected_users?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#68708D]">
                        {tower.traffic_mbps} Mbps
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDrawerTowerId(tid);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[#6546E8] hover:bg-[#EDE9FF] font-semibold text-[11px] inline-flex items-center gap-1"
                        >
                          Details <ArrowUpRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTowers.map(tower => {
            const tid = tower.tower_id || tower.id;
            const isCritical = tower.health === 'critical';
            const isWarning = tower.health === 'warning';

            return (
              <div
                key={tid}
                onClick={() => setDrawerTowerId(tid)}
                className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer hover:shadow-hover group ${
                  isCritical
                    ? 'border-[#F9B6C1] ring-1 ring-[#E85D70]'
                    : isWarning
                    ? 'border-[#FBD9A4]'
                    : 'border-[#EAE8F5]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#171B3D] group-hover:text-[#6546E8] transition-colors">
                      {tid}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F5F5FC] text-[#68708D] border border-[#E5E3F0]">
                      {tower.network_type || tower.type}
                    </span>
                  </div>
                  <StatusBadge status={tower.health} size="sm" />
                </div>

                <p className="text-xs font-semibold text-[#171B3D] mb-3 truncate">
                  {tower.tower_name || tower.name}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-[#ECEAF5] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#9299AF]">Latency:</span>
                    <span className={`font-mono font-semibold ${isCritical ? 'text-[#E85D70]' : 'text-[#171B3D]'}`}>
                      {tower.latency_ms} ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9299AF]">Packet Loss:</span>
                    <span className="font-mono text-[#171B3D]">
                      {tower.packet_loss_percent}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9299AF]">Subscribers:</span>
                    <span className="font-mono text-[#68708D]">
                      {tower.connected_users?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9299AF]">Availability:</span>
                    <span className="font-mono text-[#20B486] font-semibold">
                      {tower.availability_percent}%
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#ECEAF5] flex items-center justify-between text-[11px] text-[#6546E8] font-medium">
                  <span>Inspect Hardware & Telemetry</span>
                  <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer */}
      {drawerTowerId && (
        <TowerDetailDrawer
          towerId={drawerTowerId}
          onClose={() => setDrawerTowerId(null)}
          onOpenIncident={onOpenIncident}
        />
      )}
    </div>
  );
}

