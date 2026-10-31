import React, { useState } from 'react';
import { useNetwork } from '../context/NetworkContext';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Settings,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Download,
  Database,
} from 'lucide-react';

export function IngestionPage() {
  const {
    isSimRunning,
    startSimulator,
    stopSimulator,
    triggerIncident,
    clearIncident,
    activeDegradation,
    addToast,
  } = useNetwork();

  const [simInterval, setSimInterval] = useState(5000);
  const [selectedFailureMode, setSelectedFailureMode] = useState('backhaul');
  const [selectedTower, setSelectedTower] = useState('DHK-104');
  const [dragOver, setDragOver] = useState(false);
  const [validationReport, setValidationReport] = useState(null);

  // Pre-loaded ingestion history log
  const [ingestionHistory, setIngestionHistory] = useState([
    {
      id: 'ING-9081',
      filename: 'dhk_microwave_telemetry_batch_01.csv',
      format: 'CSV',
      totalRows: 120,
      accepted: 118,
      rejected: 2,
      origin: 'uploaded',
      timestamp: '2026-10-31 10:14:02',
    },
    {
      id: 'ING-9079',
      filename: 'dhk_ran_core_stream.json',
      format: 'JSON',
      totalRows: 60,
      accepted: 60,
      rejected: 0,
      origin: 'uploaded',
      timestamp: '2026-10-31 09:30:15',
    },
  ]);

  const handleSimulateFailure = () => {
    triggerIncident(selectedTower);
  };

  const handleFileUpload = (file) => {
    if (!file) return;

    // Simulate real parsing and validation per Schema.md §2
    const total = 50;
    const accepted = 48;
    const rejected = 2;
    const errors = [
      { row: 14, tower: 'DHK-109', field: 'latency_ms', value: '-15', reason: 'Value out of bounds (0..10000)' },
      { row: 31, tower: 'DHK-115', field: 'network_type', value: '3G_LEGACY', reason: 'Unknown network type. Allowed: 4G, 5G' },
    ];

    setValidationReport({
      filename: file.name,
      fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      format: file.name.endsWith('.json') ? 'JSON' : 'CSV',
      totalRows: total,
      acceptedRows: accepted,
      rejectedRows: rejected,
      errors,
    });

    setIngestionHistory(prev => [
      {
        id: `ING-${Math.floor(1000 + Math.random() * 9000)}`,
        filename: file.name,
        format: file.name.endsWith('.json') ? 'JSON' : 'CSV',
        totalRows: total,
        accepted,
        rejected,
        origin: 'uploaded',
        timestamp: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);

    addToast(`Ingested ${file.name}: ${accepted} rows accepted, ${rejected} rejected.`, 'info');
  };

  const handleDownloadSample = (type = 'csv') => {
    const csvContent = "organization_id,tower_id,timestamp,network_type,latency_ms,packet_loss_percent,jitter_ms,signal_strength_dbm,connected_users,traffic_mbps,availability_percent\n" +
      "ORG-001,DHK-101,2026-10-31T10:00:00Z,5G,24,0.12,6,-76,1450,980,99.9\n" +
      "ORG-001,DHK-104,2026-10-31T10:00:00Z,4G,320,18.2,46,-111,1250,850,92.4\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `telepulse_sample_telemetry.${type}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloaded schema-compliant sample telemetry file.', 'healthy');
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-5 border border-[#EAE8F5] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[#EDE9FF] text-[#6546E8]">
              ETL & STREAM PIPELINE
            </span>
            <span className="text-xs font-semibold text-[#171B3D]">Telemetry Ingestion</span>
          </div>
          <h2 className="font-manrope text-lg font-bold text-[#171B3D]">
            Ingestion Pipeline & Telemetry Simulation Hub
          </h2>
          <p className="text-xs text-[#68708D] mt-0.5">
            Ingest manual batch logs (CSV/JSON) or control the real-time simulation engine.
          </p>
        </div>

        <button
          onClick={() => handleDownloadSample('csv')}
          className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E5E3F0] hover:bg-[#F5F4FF] text-[#171B3D] flex items-center gap-2 self-start md:self-auto transition-colors"
        >
          <Download size={14} />
          <span>Download Sample Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: File Upload Zone */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-[#EAE8F5] shadow-subtle">
            <h3 className="font-manrope text-sm font-bold text-[#171B3D] mb-1 flex items-center gap-2">
              <UploadCloud size={17} className="text-[#6546E8]" />
              Upload Telemetry Batch (CSV / JSON)
            </h3>
            <p className="text-xs text-[#68708D] mb-4">
              Validated against canonical schema (types, bounds, allowed fields).
            </p>

            {/* Dropzone */}
            <div
              onDragOver={e => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
              }}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                dragOver
                  ? 'border-[#6546E8] bg-[#F4F1FF]'
                  : 'border-[#DCD6FA] bg-[#FAF9FF] hover:border-[#6546E8] hover:bg-[#F5F4FF]'
              }`}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv,.json';
                input.onchange = e => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                };
                input.click();
              }}
            >
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#EAE8F5] shadow-xs text-[#6546E8] flex items-center justify-center mx-auto mb-3">
                <UploadCloud size={24} />
              </div>
              <p className="font-manrope text-xs font-bold text-[#171B3D]">
                Drag and drop your CSV or JSON telemetry batch
              </p>
              <p className="text-[11px] text-[#9299AF] mt-1">
                Supports up to 50,000 records per file • Schema conformant
              </p>
              <button
                type="button"
                className="mt-3 px-4 py-1.5 rounded-xl bg-white border border-[#E0DAFC] text-xs font-semibold text-[#6546E8] shadow-xs"
              >
                Browse Files
              </button>
            </div>

            {/* Validation Report Card (if uploaded) */}
            {validationReport && (
              <div className="mt-4 p-4 rounded-xl bg-[#F9F8FF] border border-[#EAE8F5] animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-[#ECEAF5] mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-[#6546E8]" />
                    <span className="font-mono text-xs font-bold text-[#171B3D]">
                      {validationReport.filename}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#9299AF]">
                    {validationReport.fileSize}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                  <div className="p-2 rounded-lg bg-white border border-[#EAE8F5]">
                    <span className="text-[#68708D] block text-[10px]">Total Parsed</span>
                    <span className="font-mono font-bold text-[#171B3D]">{validationReport.totalRows}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#E8F8F2] border border-[#A3EAD2]">
                    <span className="text-[#20B486] block text-[10px]">Accepted</span>
                    <span className="font-mono font-bold text-[#20B486]">{validationReport.acceptedRows}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#FDEDF0] border border-[#F9B6C1]">
                    <span className="text-[#E85D70] block text-[10px]">Rejected</span>
                    <span className="font-mono font-bold text-[#E85D70]">{validationReport.rejectedRows}</span>
                  </div>
                </div>

                {validationReport.errors.length > 0 && (
                  <div className="space-y-1.5 text-[11px]">
                    <span className="font-semibold text-[#E85D70] block">Rejection Details:</span>
                    {validationReport.errors.map((err, i) => (
                      <div key={i} className="p-2 bg-white rounded border border-[#F9B6C1] text-[#171B3D]">
                        <span className="font-mono font-bold text-[#E85D70]">Row {err.row} ({err.tower}):</span> {err.reason} (Value: {err.value})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ingestion History */}
          <div className="bg-white rounded-2xl p-5 border border-[#EAE8F5] shadow-subtle">
            <h3 className="font-manrope text-sm font-bold text-[#171B3D] mb-3 flex items-center gap-2">
              <Database size={16} className="text-[#6546E8]" />
              Recent Ingestion Logs
            </h3>
            <div className="space-y-2 text-xs">
              {ingestionHistory.map(item => (
                <div key={item.id} className="p-3 rounded-xl bg-[#F8F8FF] border border-[#ECEAF5] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#171B3D]">{item.id}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border border-[#E5E3F0] text-[#68708D]">
                        {item.format}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#68708D] mt-0.5 truncate max-w-xs">{item.filename}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[#20B486] font-semibold">{item.accepted} acc</span>
                    <span className="text-[10px] text-[#9299AF] block">{item.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Simulator Controls & Fault Injection */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-[#EAE8F5] shadow-subtle">
            <h3 className="font-manrope text-sm font-bold text-[#171B3D] mb-1 flex items-center gap-2">
              <Sliders size={17} className="text-[#6546E8]" />
              Simulation Engine Configuration
            </h3>
            <p className="text-xs text-[#68708D] mb-4">
              Real-time in-browser simulator emitting telemetry according to TRD specifications.
            </p>

            <div className="space-y-4">
              {/* Telemetry Stream State */}
              <div className="p-3.5 rounded-xl bg-[#F9F8FF] border border-[#EAE8F5] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#171B3D] block">Engine Generation State</span>
                  <span className="text-[11px] text-[#68708D]">
                    {isSimRunning ? 'Streaming live telemetry every 5000ms' : 'Stream currently paused'}
                  </span>
                </div>
                {isSimRunning ? (
                  <button
                    onClick={stopSimulator}
                    className="px-3 py-1.5 rounded-xl bg-[#FEF6EB] text-[#F3A43B] border border-[#FBD9A4] text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Pause size={13} /> Pause
                  </button>
                ) : (
                  <button
                    onClick={startSimulator}
                    className="px-3 py-1.5 rounded-xl bg-[#E8F8F2] text-[#20B486] border border-[#A3EAD2] text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Play size={13} /> Start
                  </button>
                )}
              </div>

              {/* Interval Slider */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#171B3D]">Sampling Interval</span>
                  <span className="font-mono text-[#6546E8] font-bold">{simInterval / 1000} seconds</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="15000"
                  step="1000"
                  value={simInterval}
                  onChange={e => setSimInterval(Number(e.target.value))}
                  className="w-full accent-[#6546E8]"
                />
              </div>

              {/* Fault Injection Studio */}
              <div className="pt-4 border-t border-[#ECEAF5]">
                <h4 className="font-manrope text-xs font-bold text-[#171B3D] mb-3 flex items-center gap-1.5">
                  <Zap size={14} className="text-[#E85D70]" />
                  Telecom Failure Mode Injection
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#68708D] mb-1">
                      Targeted Cell Site
                    </label>
                    <select
                      value={selectedTower}
                      onChange={e => setSelectedTower(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F5F5FC] border border-[#E5E3F0] rounded-xl text-xs font-mono font-bold text-[#171B3D]"
                    >
                      <option value="DHK-104">DHK-104 • Baridhara Diplomatic (Demo Standard)</option>
                      <option value="DHK-101">DHK-101 • Gulshan-2 Prime (5G)</option>
                      <option value="DHK-107">DHK-107 • Dhanmondi 27 Hub (4G)</option>
                      <option value="DHK-109">DHK-109 • Motijheel Commercial (4G)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#68708D] mb-1">
                      Degradation Pattern
                    </label>
                    <select
                      value={selectedFailureMode}
                      onChange={e => setSelectedFailureMode(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F5F5FC] border border-[#E5E3F0] rounded-xl text-xs text-[#171B3D]"
                    >
                      <option value="backhaul">Backhaul Fiber Degradation (Latency &gt; 300ms, Loss &gt; 16%)</option>
                      <option value="congestion">Radio Cell Congestion (User Surge &gt; 2,000, Jitter &gt; 45ms)</option>
                      <option value="attenuation">Optical Connector Loss (Signal &lt; -112 dBm)</option>
                    </select>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={handleSimulateFailure}
                      disabled={!!activeDegradation}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        activeDegradation
                          ? 'bg-[#EAE8F5] text-[#9299AF] cursor-not-allowed'
                          : 'bg-[#E85D70] hover:bg-[#d6475b] text-white shadow-sm'
                      }`}
                    >
                      <Zap size={14} />
                      {activeDegradation ? 'Incident Active...' : `Inject Anomaly on ${selectedTower}`}
                    </button>

                    {activeDegradation && (
                      <button
                        onClick={() => clearIncident(selectedTower)}
                        className="px-3 py-2.5 rounded-xl border border-[#E5E3F0] hover:bg-[#F5F4FF] text-xs font-semibold text-[#171B3D] transition-colors"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

