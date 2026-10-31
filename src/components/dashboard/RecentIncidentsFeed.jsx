import React from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Sparkles, ArrowRight, Clock, AlertOctagon } from 'lucide-react';

export function RecentIncidentsFeed({ onOpenIncident, onNavigateIncidents }) {
  const { incidents } = useNetwork();
  const recent = incidents.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#EAE8F5] shadow-subtle flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#ECEAF5] mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-manrope text-[15px] font-bold text-[#171B3D]">
              Active Incident Feed
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#FDEDF0] text-[#E85D70] font-bold">
              {incidents.filter(i => i.status === 'Open').length} Open
            </span>
          </div>
          <button
            onClick={onNavigateIncidents}
            className="text-xs font-semibold text-[#6546E8] hover:underline flex items-center gap-1"
          >
            View All ({incidents.length}) <ArrowRight size={13} />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-10">
            <AlertOctagon size={28} className="mx-auto text-[#9299AF] mb-2" />
            <p className="text-xs font-medium text-[#68708D]">No incidents registered</p>
            <p className="text-[11px] text-[#9299AF] mt-0.5">
              Click "Trigger Incident (DHK-104)" in the guide above to start a live simulation.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F5F4FF] space-y-1">
            {recent.map(inc => {
              const hasAi = !!inc.aiAnalysis;

              return (
                <div
                  key={inc.id}
                  onClick={() => onOpenIncident(inc.id)}
                  data-testid={`incident-card-${inc.towerId}`}
                  className="py-3 px-2 rounded-xl hover:bg-[#F9F8FF] transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={inc.severity} />
                      <span className="font-mono text-xs font-bold text-[#171B3D] group-hover:text-[#6546E8] transition-colors">
                        {inc.displayId}
                      </span>
                    </div>
                    <StatusBadge status={inc.status} size="sm" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#68708D] mt-1">
                    <span className="font-medium text-[#171B3D]">
                      {inc.towerId} • {inc.towerName}
                    </span>
                    <span className="text-[11px] flex items-center gap-1 text-[#9299AF]">
                      <Clock size={11} />
                      {new Date(inc.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Triggering Metrics Summary */}
                  {inc.triggeringMetrics && inc.triggeringMetrics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {inc.triggeringMetrics.map((b, idx) => (
                        <span
                          key={idx}
                          className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#FDEDF0] text-[#E85D70] font-semibold"
                        >
                          {b.metric}: {b.value}{b.unit} (Crit &gt; {b.critThreshold})
                        </span>
                      ))}
                    </div>
                  )}

                  {/* AI Status tag */}
                  <div className="flex items-center justify-between mt-2 pt-1 text-[11px]">
                    {hasAi ? (
                      <span className="inline-flex items-center gap-1 text-[#6546E8] font-medium">
                        <Sparkles size={11} />
                        TowerMind Analyzed
                      </span>
                    ) : (
                      <span className="text-[#9299AF]">AI Analysis Pending</span>
                    )}
                    <span className="text-[#6546E8] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-medium">
                      Investigate <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-[#ECEAF5] mt-2">
        <div className="bg-[#F8F8FF] p-2.5 rounded-xl border border-[#EAE8F5] flex items-center justify-between text-[11px]">
          <span className="text-[#68708D]">Incident Retention Rule:</span>
          <span className="font-mono text-[#171B3D] font-semibold">1 Active Per Tower</span>
        </div>
      </div>
    </div>
  );
}
