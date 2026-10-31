import React, { useState } from 'react';
import { useNetwork } from '../context/NetworkContext';
import { ChartCard } from '../components/common/ChartCard';
import { MetricCard } from '../components/common/MetricCard';
import {
  Activity,
  LineChart as LineChartIcon,
  Wifi,
  Users,
  Clock,
  Radio,
  Download,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export function AnalyticsPage() {
  const { towers } = useNetwork();
  const [selectedTowerId, setSelectedTowerId] = useState('DHK-104');
  const [timeRange, setTimeRange] = useState('15m');

  const selectedTower = towers.find(t => (t.tower_id || t.id) === selectedTowerId) || towers[0];

  // Synthesize realistic time series based on current selected tower values
  const currLatency = selectedTower.latency_ms || 45;
  const currLoss = selectedTower.packet_loss_percent || 0.4;
  const currJitter = selectedTower.jitter_ms || 12;
  const currSignal = selectedTower.signal_strength_dbm || -80;
  const currUsers = selectedTower.connected_users || 1200;
  const currTraffic = selectedTower.traffic_mbps || 800;

  const timeSeriesData = [
    { time: '10:00', latency: 42, packetLoss: 0.2, jitter: 10, signal: -78, users: 1100, traffic: 750, availability: 99.9 },
    { time: '10:03', latency: 45, packetLoss: 0.3, jitter: 12, signal: -79, users: 1140, traffic: 770, availability: 99.8 },
    { time: '10:06', latency: 44, packetLoss: 0.2, jitter: 11, signal: -80, users: 1190, traffic: 810, availability: 99.9 },
    { time: '10:09', latency: Math.round(currLatency * 0.7), packetLoss: +(currLoss * 0.6).toFixed(1), jitter: 14, signal: -81, users: 1220, traffic: 830, availability: 99.7 },
    { time: '10:12', latency: Math.round(currLatency * 0.9), packetLoss: +(currLoss * 0.85).toFixed(1), jitter: currJitter - 2, signal: currSignal, users: currUsers - 30, traffic: currTraffic - 20, availability: 98.4 },
    { time: '10:15', latency: currLatency, packetLoss: currLoss, jitter: currJitter, signal: currSignal, users: currUsers, traffic: currTraffic, availability: selectedTower.availability_percent },
  ];

  return (
    <div className="space-y-6">
      {/* Selector Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE8F5] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-gradient flex items-center justify-center text-white shadow-sm">
            <LineChartIcon size={20} />
          </div>
          <div>
            <h2 className="font-manrope text-base font-bold text-[#171B3D]">
              Deep Telemetry Performance Analytics
            </h2>
            <p className="text-xs text-[#68708D]">
              Threshold-benchmarked telemetry streams across microwave and optical backhauls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Tower Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#68708D] hidden sm:inline">Site:</span>
            <select
              value={selectedTowerId}
              onChange={e => setSelectedTowerId(e.target.value)}
              className="px-3 py-2 bg-[#F5F5FC] border border-[#E5E3F0] rounded-xl text-xs font-mono font-bold text-[#171B3D] focus:outline-none focus:border-[#6546E8]"
            >
              {towers.map(t => {
                const tid = t.tower_id || t.id;
                return (
                  <option key={tid} value={tid}>
                    {tid} • {t.tower_name || t.name} ({t.health?.toUpperCase()})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-[#F5F5FC] p-1 rounded-xl border border-[#E5E3F0]">
            {['15m', '1h', '6h', '24h'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  timeRange === range
                    ? 'bg-white text-[#6546E8] shadow-xs'
                    : 'text-[#68708D] hover:text-[#171B3D]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Snapshot Metric Cards for Selected Tower */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard
          title="Roundtrip Latency"
          value={currLatency}
          unit="ms"
          subtitle="Crit > 250ms"
          trendType={currLatency >= 250 ? 'negative' : currLatency >= 100 ? 'neutral' : 'positive'}
          trend={currLatency >= 250 ? 'CRITICAL' : 'NORMAL'}
        />
        <MetricCard
          title="Packet Loss"
          value={currLoss}
          unit="%"
          subtitle="Crit > 10%"
          trendType={currLoss >= 10 ? 'negative' : currLoss >= 2 ? 'neutral' : 'positive'}
          trend={currLoss >= 10 ? 'CRITICAL' : 'NORMAL'}
        />
        <MetricCard
          title="Jitter Variance"
          value={currJitter}
          unit="ms"
          subtitle="Crit > 50ms"
          trendType={currJitter >= 50 ? 'negative' : 'positive'}
        />
        <MetricCard
          title="RF Signal"
          value={currSignal}
          unit="dBm"
          subtitle="Crit < -110dBm"
          trendType={currSignal <= -110 ? 'negative' : 'positive'}
        />
        <MetricCard
          title="Radio Subscribers"
          value={currUsers.toLocaleString()}
          subtitle="Active RRC"
          trendType="neutral"
        />
        <MetricCard
          title="Throughput"
          value={currTraffic}
          unit="Mbps"
          subtitle="Payload Data"
          trendType="positive"
        />
      </div>

      {/* 2x2 Grid of Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Chart */}
        <ChartCard
          title="Latency Time Series (ms)"
          subtitle="Yellow: Warning (100ms) • Red: Critical Threshold (250ms)"
        >
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="latencyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6651E8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6651E8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEEAF7" vertical={false} />
                <XAxis dataKey="time" stroke="#8991A9" fontSize={11} tickLine={false} />
                <YAxis stroke="#8991A9" fontSize={11} tickLine={false} domain={[0, 360]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E8E4F4',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={100} stroke="#F3A43B" strokeDasharray="4 4" label={{ value: 'Warn 100ms', fill: '#F3A43B', fontSize: 10 }} />
                <ReferenceLine y={250} stroke="#E76879" strokeDasharray="4 4" label={{ value: 'Crit 250ms', fill: '#E76879', fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="latency"
                  name="Latency (ms)"
                  stroke="#6651E8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#latencyFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Packet Loss Chart */}
        <ChartCard
          title="Packet Loss Rate (%)"
          subtitle="Yellow: Warning (2%) • Red: Critical Threshold (10%)"
        >
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="lossFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E76879" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#E76879" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEEAF7" vertical={false} />
                <XAxis dataKey="time" stroke="#8991A9" fontSize={11} tickLine={false} />
                <YAxis stroke="#8991A9" fontSize={11} tickLine={false} domain={[0, 25]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E8E4F4',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={2} stroke="#F3A43B" strokeDasharray="4 4" label={{ value: 'Warn 2%', fill: '#F3A43B', fontSize: 10 }} />
                <ReferenceLine y={10} stroke="#E76879" strokeDasharray="4 4" label={{ value: 'Crit 10%', fill: '#E76879', fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="packetLoss"
                  name="Packet Loss (%)"
                  stroke="#E76879"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#lossFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Jitter & RF Signal Strength */}
        <ChartCard
          title="Jitter & RF Propagation (ms & dBm)"
          subtitle="Jitter threshold: 30ms (Warn) / 50ms (Crit)"
        >
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEEAF7" vertical={false} />
                <XAxis dataKey="time" stroke="#8991A9" fontSize={11} tickLine={false} />
                <YAxis stroke="#8991A9" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E8E4F4',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={30} stroke="#F3A43B" strokeDasharray="4 4" />
                <ReferenceLine y={50} stroke="#E76879" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="jitter"
                  name="Jitter (ms)"
                  stroke="#4380F5"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Traffic Throughput & Connected Users */}
        <ChartCard
          title="Payload Traffic & User Densities"
          subtitle="Traffic Throughput (Mbps) and Connected RRC Users"
        >
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEEAF7" vertical={false} />
                <XAxis dataKey="time" stroke="#8991A9" fontSize={11} tickLine={false} />
                <YAxis stroke="#8991A9" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E8E4F4',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="traffic" name="Traffic (Mbps)" fill="#24B6AE" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

