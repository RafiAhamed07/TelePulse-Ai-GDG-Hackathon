import React, { useState } from 'react';
import { useNetwork } from '../context/NetworkContext';
import { apiClient } from '../services/apiClient';
import { ChartCard } from '../components/common/ChartCard';
import { MetricCard } from '../components/common/MetricCard';
import {
  FileText,
  Download,
  Printer,
  Copy,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Radio,
  Activity,
  AlertOctagon,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function ReportsPage() {
  const { incidents, stats, addToast } = useNetwork();
  const [selectedPeriod, setSelectedPeriod] = useState('Demo Session');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState({
    title: 'Dhaka Metropolitan NOC Telemetry & Operations Health Report',
    period: 'Current Demo Session',
    generatedAt: new Date().toLocaleString(),
    executiveSummary: `During the current session, the Dhaka Metropolitan NOC telemetry network registered an aggregate availability of ${stats.meanAvailability}%. A total of ${incidents.length} anomalies were processed across 20 monitored sites, with ${incidents.filter(i => i.status === 'Resolved').length} incidents successfully verified and resolved.`,
    stats: {
      totalIncidents: incidents.length,
      openIncidents: incidents.filter(i => i.status === 'Open').length,
      investigatingIncidents: incidents.filter(i => i.status === 'Investigating').length,
      resolvedIncidents: incidents.filter(i => i.status === 'Resolved').length,
      availability: `${stats.meanAvailability}%`,
      mttr: '14.2 minutes',
    },
    keyIncidents: [
      {
        tower: 'DHK-104',
        title: 'Baridhara Diplomatic Backhaul Latency Surge',
        severity: 'CRITICAL',
        impact: '320 ms latency & 16.5% packet drop recorded. TowerMind AI recommended optical transceiver inspection.',
      },
      {
        tower: 'DHK-109',
        title: 'Motijheel Commercial Backhaul Congestion',
        severity: 'WARNING',
        impact: 'Transient load spike during peak hours. Successfully investigated and resolved.',
      },
    ],
    recommendations: [
      'Perform scheduled optical power budget audit along the Gulshan-Baridhara transmission ring.',
      'Calibrate predictive threshold warnings to alert at 150 ms before critical 250 ms breach.',
      'Maintain continuous automated baseline tracking per TRD specifications.',
    ],
  });

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const narrative = await apiClient.generateReport(selectedPeriod, {
        availability: stats.meanAvailability,
        incidentCount: incidents.length,
        resolvedCount: incidents.filter(i => i.status === 'Resolved').length,
        towersMonitored: stats.totalTowers,
      });

      setReportData(prev => ({
        ...prev,
        period: selectedPeriod,
        generatedAt: new Date().toLocaleString(),
        executiveSummary: narrative.executiveSummary,
        recommendations: narrative.recommendationsForReview,
      }));
      addToast('Generated updated executive report narrative.', 'healthy');
    } catch (e) {
      addToast('Error generating report: ' + e.message, 'critical');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = `${reportData.title}\nPeriod: ${reportData.period}\n\nExecutive Summary:\n${reportData.executiveSummary}\n\nKey Recommendations:\n${reportData.recommendations.map(r => `• ${r}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    addToast('Report copied to clipboard.', 'healthy');
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TelePulse_Report_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloaded JSON report.', 'healthy');
  };

  const chartData = [
    { name: 'Critical', count: incidents.filter(i => i.severity === 'critical').length, fill: '#E85D70' },
    { name: 'Warning', count: incidents.filter(i => i.severity === 'warning').length, fill: '#F3A43B' },
    { name: 'Resolved', count: incidents.filter(i => i.status === 'Resolved').length, fill: '#20B486' },
    { name: 'Open', count: incidents.filter(i => i.status === 'Open').length, fill: '#6546E8' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white rounded-2xl p-5 border border-[#EAE8F5] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[#EDE9FF] text-[#6546E8]">
              OPERATIONS INTELLIGENCE
            </span>
            <span className="text-xs font-semibold text-[#171B3D]">Formal Audits & Summaries</span>
          </div>
          <h2 className="font-manrope text-lg font-bold text-[#171B3D]">
            Executive & Network Operations Reports
          </h2>
          <p className="text-xs text-[#68708D] mt-0.5">
            Code-computed metrics synthesized with TowerMind AI narrative analysis.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 bg-[#F5F5FC] border border-[#E5E3F0] rounded-xl text-xs font-medium text-[#171B3D] focus:outline-none focus:border-[#6546E8]"
          >
            <option value="Demo Session">Current Demo Session</option>
            <option value="Last 24 Hours">Last 24 Hours</option>
            <option value="Last 7 Days">Last 7 Days</option>
          </select>

          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-brand-gradient hover:opacity-95 text-white flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles size={13} />
            {isGenerating ? 'Compiling...' : 'Re-Generate with AI'}
          </button>

          <button
            onClick={handleCopy}
            className="p-2 rounded-xl border border-[#E5E3F0] hover:bg-[#F5F4FF] text-[#171B3D] transition-colors"
            title="Copy Report Text"
          >
            <Copy size={16} />
          </button>

          <button
            onClick={handleExportJSON}
            className="p-2 rounded-xl border border-[#E5E3F0] hover:bg-[#F5F4FF] text-[#171B3D] transition-colors"
            title="Download JSON Report"
          >
            <Download size={16} />
          </button>

          <button
            onClick={handlePrint}
            className="p-2 rounded-xl border border-[#E5E3F0] hover:bg-[#F5F4FF] text-[#171B3D] transition-colors"
            title="Print or Export to PDF"
          >
            <Printer size={16} />
          </button>
        </div>
      </div>

      {/* Main Document Preview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE8F5] shadow-card space-y-6">
        {/* Document Header */}
        <div className="border-b border-[#ECEAF5] pb-5">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <span className="font-mono text-[11px] font-bold text-[#6546E8] uppercase tracking-wider block">
                TELEPULSE AI • NOC AUDIT DOCUMENT
              </span>
              <h3 className="font-manrope text-xl font-extrabold text-[#171B3D] mt-1">
                {reportData.title}
              </h3>
              <p className="text-xs text-[#68708D] mt-1">
                Period: <span className="font-semibold text-[#171B3D]">{reportData.period}</span> • Generated: {reportData.generatedAt}
              </p>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-[#F8F8FF] border border-[#EAE8F5] text-right text-xs">
              <span className="text-[#9299AF] block text-[10px]">Scope</span>
              <span className="font-semibold text-[#171B3D]">ORG-001 • Dhaka Metro</span>
            </div>
          </div>
        </div>

        {/* Code-Computed Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#F9F8FF] border border-[#EAE8F5]">
            <span className="text-[11px] text-[#68708D] block">Network Availability</span>
            <span className="font-manrope text-2xl font-bold text-[#20B486]">{stats.meanAvailability}%</span>
            <span className="text-[10px] text-[#9299AF] block mt-0.5">Target &gt; 99.5%</span>
          </div>

          <div className="p-4 rounded-xl bg-[#F9F8FF] border border-[#EAE8F5]">
            <span className="text-[11px] text-[#68708D] block">Total Incidents</span>
            <span className="font-manrope text-2xl font-bold text-[#171B3D]">{incidents.length}</span>
            <span className="text-[10px] text-[#E85D70] block mt-0.5">{incidents.filter(i => i.severity === 'critical').length} Critical</span>
          </div>

          <div className="p-4 rounded-xl bg-[#F9F8FF] border border-[#EAE8F5]">
            <span className="text-[11px] text-[#68708D] block">Resolution Rate</span>
            <span className="font-manrope text-2xl font-bold text-[#6546E8]">
              {incidents.length > 0 ? `${Math.round((incidents.filter(i => i.status === 'Resolved').length / incidents.length) * 100)}%` : '100%'}
            </span>
            <span className="text-[10px] text-[#9299AF] block mt-0.5">NOC Triage Efficacy</span>
          </div>

          <div className="p-4 rounded-xl bg-[#F9F8FF] border border-[#EAE8F5]">
            <span className="text-[11px] text-[#68708D] block">Mean Time to Resolve (MTTR)</span>
            <span className="font-manrope text-2xl font-bold text-[#171B3D]">{reportData.stats.mttr}</span>
            <span className="text-[10px] text-[#20B486] block mt-0.5">-3.4 min vs target</span>
          </div>
        </div>

        {/* AI-Generated Executive Summary */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#F5F4FF] to-[#FAF9FF] border border-[#DCD6FA]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-brand-gradient flex items-center justify-center text-white">
              <Sparkles size={13} />
            </div>
            <h4 className="font-manrope text-xs font-bold text-[#6546E8] uppercase tracking-wider">
              AI-Generated Executive Narrative (TowerMind)
            </h4>
          </div>
          <p className="text-xs sm:text-[13px] text-[#171B3D] leading-relaxed">
            {reportData.executiveSummary}
          </p>
        </div>

        {/* Breakdown Chart & Key Incidents */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-2xl bg-[#F9F8FF] border border-[#EAE8F5]">
            <h4 className="font-manrope text-xs font-bold text-[#171B3D] mb-3">
              Incident Status & Severity Distribution
            </h4>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEEAF7" vertical={false} />
                  <XAxis dataKey="name" stroke="#8991A9" fontSize={11} tickLine={false} />
                  <YAxis stroke="#8991A9" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E8E4F4',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F9F8FF] border border-[#EAE8F5] space-y-3">
            <h4 className="font-manrope text-xs font-bold text-[#171B3D]">
              Significant Network Events
            </h4>
            {reportData.keyIncidents.map((k, idx) => (
              <div key={idx} className="p-3 bg-white rounded-xl border border-[#ECEAF5] text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#171B3D]">{k.tower} • {k.title}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    k.severity === 'CRITICAL' ? 'bg-[#FDEDF0] text-[#E85D70]' : 'bg-[#FEF6EB] text-[#F3A43B]'
                  }`}>
                    {k.severity}
                  </span>
                </div>
                <p className="text-[11px] text-[#68708D]">{k.impact}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-4 rounded-2xl bg-[#F8F8FF] border border-[#ECEAF5]">
          <h4 className="font-manrope text-xs font-bold text-[#171B3D] mb-2 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[#20B486]" />
            Actionable Engineering Recommendations
          </h4>
          <ul className="space-y-1.5 text-xs text-[#171B3D]">
            {reportData.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#6546E8] font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

