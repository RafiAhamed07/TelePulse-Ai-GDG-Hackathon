import React, { useState } from 'react';
import { useNetwork } from '../context/NetworkContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import {
  AlertOctagon,
  Search,
  Filter,
  Clock,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Activity,
} from 'lucide-react';

export function IncidentsPage({ onOpenIncident }) {
  const { incidents, triggerIncident, activeDegradation } = useNetwork();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  // Filter incidents
  const filtered = incidents.filter(inc => {
    const id = (inc.displayId || inc.id).toLowerCase();
    const tower = (inc.towerId || '').toLowerCase();
    const name = (inc.towerName || '').toLowerCase();
    const matchesSearch = id.includes(searchTerm.toLowerCase()) || tower.includes(searchTerm.toLowerCase()) || name.includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || inc.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const openCount = incidents.filter(i => i.status === 'Open').length;
  const invCount = incidents.filter(i => i.status === 'Investigating').length;
  const resCount = incidents.filter(i => i.status === 'Resolved').length;

  return (
    <div className="space-y-6">
      {/* Top Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#EAE8F5] shadow-subtle">
          <span className="text-[11px] font-semibold text-[#68708D] block uppercase tracking-wider">
            Total Logged
          </span>
          <span className="font-manrope text-2xl font-bold text-[#171B3D] mt-1 block">
            {incidents.length}
          </span>
          <span className="text-[11px] text-[#9299AF] mt-0.5 block">Session Lifetime</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#F9B6C1] shadow-subtle">
          <span className="text-[11px] font-semibold text-[#E85D70] block uppercase tracking-wider">
            Open Incidents
          </span>
          <span className="font-manrope text-2xl font-bold text-[#E85D70] mt-1 block">
            {openCount}
          </span>
          <span className="text-[11px] text-[#E85D70] mt-0.5 block">Requires immediate triage</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#FBD9A4] shadow-subtle">
          <span className="text-[11px] font-semibold text-[#F3A43B] block uppercase tracking-wider">
            Under Investigation
          </span>
          <span className="font-manrope text-2xl font-bold text-[#F3A43B] mt-1 block">
            {invCount}
          </span>
          <span className="text-[11px] text-[#68708D] mt-0.5 block">Assigned to NOC Engineers</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#A3EAD2] shadow-subtle">
          <span className="text-[11px] font-semibold text-[#20B486] block uppercase tracking-wider">
            Resolved Anomalies
          </span>
          <span className="font-manrope text-2xl font-bold text-[#20B486] mt-1 block">
            {resCount}
          </span>
          <span className="text-[11px] text-[#20B486] mt-0.5 block">Audit verified</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE8F5] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9299AF]" />
          <input
            type="text"
            placeholder="Search incident ID, tower ID (e.g. DHK-104)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F5F5FC] border border-[#E5E3F0] rounded-xl text-xs text-[#171B3D] placeholder-[#9299AF] focus:outline-none focus:border-[#6546E8] focus:bg-white transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F5F5FC] border border-[#E5E3F0] rounded-xl text-xs font-medium text-[#171B3D] focus:outline-none focus:border-[#6546E8]"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open Only</option>
            <option value="Investigating">Investigating Only</option>
            <option value="Resolved">Resolved Only</option>
          </select>

          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-[#F5F5FC] border border-[#E5E3F0] rounded-xl text-xs font-medium text-[#171B3D] focus:outline-none focus:border-[#6546E8]"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="warning">Warning Only</option>
          </select>

          <button
            onClick={() => triggerIncident('DHK-104')}
            disabled={!!activeDegradation}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              activeDegradation
                ? 'bg-[#EAE8F5] text-[#9299AF] cursor-not-allowed'
                : 'bg-brand-gradient hover:opacity-95 text-white'
            }`}
          >
            {activeDegradation ? 'Incident Active' : '+ Trigger Test Incident'}
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-[#EAE8F5] shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F8FF] border-b border-[#ECEAF5] text-[#68708D] font-semibold">
              <tr>
                <th className="py-3.5 px-4">Incident ID</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Target Tower</th>
                <th className="py-3.5 px-4">Network</th>
                <th className="py-3.5 px-4">Triggering Breaches</th>
                <th className="py-3.5 px-4">TowerMind AI</th>
                <th className="py-3.5 px-4">Detected At</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F4FF]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-[#9299AF]">
                    No incidents match your filter.
                  </td>
                </tr>
              ) : (
                filtered.map(inc => {
                  const hasAi = !!inc.aiAnalysis;

                  return (
                    <tr
                      key={inc.id}
                      onClick={() => onOpenIncident(inc.id)}
                      className="hover:bg-[#F9F8FF] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#171B3D] group-hover:text-[#6546E8] transition-colors">
                        {inc.displayId}
                      </td>
                      <td className="py-3.5 px-4">
                        <SeverityBadge severity={inc.severity} />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={inc.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#171B3D] block">{inc.towerId}</span>
                        <span className="text-[11px] text-[#68708D]">{inc.towerName}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#F5F5FC] border border-[#E5E3F0] font-mono text-[10px] font-semibold text-[#68708D]">
                          {inc.networkType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {inc.triggeringMetrics?.map((b, i) => (
                            <span
                              key={i}
                              className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FDEDF0] text-[#E85D70]"
                            >
                              {b.metric}: {b.value}{b.unit}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {hasAi ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6546E8]">
                            <Sparkles size={12} />
                            Diagnosed
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#9299AF]">Pending</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#68708D] font-mono text-[11px]">
                        {new Date(inc.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenIncident(inc.id);
                          }}
                          className="px-3 py-1 rounded-xl text-xs font-bold bg-[#EDE9FF] text-[#6546E8] hover:bg-[#ded7fc] transition-colors inline-flex items-center gap-1 shadow-2xs"
                        >
                          Investigate <ArrowUpRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

