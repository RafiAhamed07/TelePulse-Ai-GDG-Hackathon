import React from 'react';
import { useNetwork } from '../context/NetworkContext';
import { MetricCard } from '../components/common/MetricCard';
import { ChartCard } from '../components/common/ChartCard';
import { TryItGuideCard } from '../components/dashboard/TryItGuideCard';
import { TowerHealthGrid } from '../components/dashboard/TowerHealthGrid';
import { RecentIncidentsFeed } from '../components/dashboard/RecentIncidentsFeed';
import {
  Radio,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Activity,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function DashboardPage({ onNavigateTab, onSelectTower, onOpenIncident }) {
  const {
    towers,
    stats,
    isSimRunning,
    startSimulator,
    stopSimulator,
    triggerIncident,
    activeDegradation,
    resetSession,
  } = useNetwork();

  // Create real-time chart data from Dhaka-104 or aggregate history
  const dhk104 = towers.find(t => (t.tower_id || t.id) === 'DHK-104') || towers[0];
  const chartData = [
    { time: '10:00', latency: 42, traffic: 810 },
    { time: '10:02', latency: 45, traffic: 830 },
    { time: '10:04', latency: 44, traffic: 840 },
    { time: '10:06', latency: 48, traffic: 855 },
    { time: '10:08', latency: dhk104?.latency_ms || 46, traffic: dhk104?.traffic_mbps || 850 },
  ];

  return (
    <div className="space-y-6">
      {/* Golden Path Guided Step Card */}
      <TryItGuideCard
        onOpenIncident={onOpenIncident}
        onNavigateTab={onNavigateTab}
      />

      {/* Simulator Control Quickbar */}
      <div className="bg-white rounded-2xl p-4 border border-[#EAE8F5] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EDE9FF] text-[#6546E8] flex items-center justify-center font-bold">
            <Activity size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#171B3D]">Telemetry Ingestion Stream</span>
              <span className={`w-2 h-2 rounded-full ${isSimRunning ? 'bg-[#20B486] animate-pulse' : 'bg-[#9299AF]'}`}></span>
            </div>
            <p className="text-[11px] text-[#68708D]">
              Emitting 1 sample per tower every 5s across 20 Dhaka cell sites.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isSimRunning ? (
            <button
              onClick={stopSimulator}
              className="px-3 py-1.5 rounded-xl border border-[#E5E3F0] hover:bg-[#F5F4FF] text-xs font-medium text-[#171B3D] flex items-center gap-1.5 transition-colors"
            >
              <Pause size={13} />
              <span>Pause Stream</span>
            </button>
          ) : (
            <button
              onClick={startSimulator}
              className="px-3 py-1.5 rounded-xl bg-[#20B486] hover:bg-[#1ca077] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Play size={13} />
              <span>Resume Stream</span>
            </button>
          )}

          <button
            onClick={() => triggerIncident('DHK-104')}
            disabled={!!activeDegradation}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeDegradation
                ? 'bg-[#FDEDF0] text-[#E85D70] border border-[#F9B6C1]'
                : 'bg-brand-gradient text-white hover:opacity-95 shadow-xs'
            }`}
          >
            <Zap size={13} />
            <span>{activeDegradation ? 'Incident Active' : 'Inject DHK-104 Fault'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard
          title="Monitored Towers"
          value={stats.totalTowers}
          unit="sites"
          subtitle="Dhaka Metro"
          icon={Radio}
        />
        <MetricCard
          title="Healthy Towers"
          value={stats.healthyTowers}
          subtitle="Nominal state"
          icon={CheckCircle2}
          trend={`${Math.round((stats.healthyTowers / (stats.totalTowers || 1)) * 100)}%`}
          trendType="positive"
        />
        <MetricCard
          title="Degraded / Warning"
          value={stats.warningTowers}
          subtitle="Minor breaches"
          icon={AlertTriangle}
          trendType="neutral"
        />
        <MetricCard
          title="Critical Anomalies"
          value={stats.criticalTowers}
          subtitle="Immediate action"
          icon={AlertOctagon}
          trendType="negative"
        />
        <MetricCard
          title="Mean Latency"
          value={stats.meanLatency}
          unit="ms"
          subtitle="Baseline ~45ms"
          icon={Activity}
          trendType={stats.meanLatency > 100 ? 'negative' : 'positive'}
        />
        <MetricCard
          title="Mean Packet Loss"
          value={stats.meanPacketLoss}
          unit="%"
          subtitle="Target < 2.0%"
          icon={Zap}
          trendType={parseFloat(stats.meanPacketLoss) > 2 ? 'negative' : 'positive'}
        />
      </div>

      {/* Charts & Quick Insights Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Telemetry Trend Chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Real-Time Network Telemetry Trend"
            subtitle="Comparing rolling latency vs throughput under active load"
            badge={
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8F8F2] text-[#20B486] font-bold">
                LIVE 5s
              </span>
            }
          >
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6546E8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6546E8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEEAF7" vertical={false} />
                  <XAxis dataKey="time" stroke="#8991A9" fontSize={11} tickLine={false} />
                  <YAxis stroke="#8991A9" fontSize={11} tickLine={false} domain={[0, 400]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E8E4F4',
                      boxShadow: '0 4px 18px rgba(38,35,90,0.06)',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="latency"
                    name="Latency (ms)"
                    stroke="#6546E8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#latencyGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-xs text-[#68708D] pt-3 border-t border-[#ECEAF5] mt-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6546E8]"></span>
                Latency (ms)
              </span>
              <span className="text-[11px] font-mono">
                Threshold Reference: 100ms (Warn) / 250ms (Crit)
              </span>
            </div>
          </ChartCard>
        </div>

        {/* AI Operational Insight Widget */}
        <div className="bg-gradient-to-br from-[#111B49] to-[#1C2C6E] text-white rounded-2xl p-5 border border-[#232F67] shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center text-white">
                <Sparkles size={14} />
              </div>
              <span className="font-manrope text-xs font-bold uppercase tracking-wider text-[#A9B3D5]">
                TowerMind Engine Insight
              </span>
            </div>

            <h4 className="font-manrope text-base font-bold text-white mb-2 leading-snug">
              {activeDegradation
                ? `Anomaly detected on tower ${activeDegradation.towerId} with latency spike.`
                : 'All 20 monitored sectors operating within nominal telemetry limits.'}
            </h4>

            <p className="text-xs text-[#A9B3D5] leading-relaxed">
              {activeDegradation
                ? 'Backhaul packet loss elevation correlates with transport transmission delays rather than RF cell congestion. Recommend inspecting fiber optic transceiver interfaces.'
                : 'Radio signal strength and handover efficiency across Dhaka Central and Diplomatic zones maintain a 99.8% availability rating.'}
            </p>
          </div>

          <div className="pt-4 border-t border-[#25336E] mt-4 flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#A9B3D5]">
              Gemini 1.5 Pro Active
            </span>
            <button
              onClick={() => onNavigateTab('copilot')}
              className="text-xs font-semibold text-[#EDE9FF] hover:text-white flex items-center gap-1 hover:underline"
            >
              Ask Copilot →
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid & Incident Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TowerHealthGrid onSelectTower={onSelectTower} />
        </div>
        <div className="lg:col-span-1">
          <RecentIncidentsFeed
            onOpenIncident={onOpenIncident}
            onNavigateIncidents={() => onNavigateTab('incidents')}
          />
        </div>
      </div>
    </div>
  );
}

