import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  ShieldCheck,
  Zap,
  Radio,
  Lock,
  Mail,
  ArrowRight,
  Server,
  Sparkles,
} from 'lucide-react';

export function LoginPage({ onLoginSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('r.chowdhury@telepulse.ai');
  const [password, setPassword] = useState('telepulse2026');
  const [selectedRole, setSelectedRole] = useState('Senior NOC Specialist');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      login(selectedRole);
      setIsSubmitting(false);
      if (onLoginSuccess) onLoginSuccess();
    }, 600);
  };

  const handleFastTrack = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      login('Lead NOC Operations Director');
      setIsSubmitting(false);
      if (onLoginSuccess) onLoginSuccess();
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F5F4FF] flex flex-col justify-between relative overflow-hidden font-inter selection:bg-[#EDE9FF] selection:text-[#6546E8]">
      {/* Decorative Network Grid & Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#7653F5_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none"></div>
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#EDE9FF] blur-3xl opacity-70 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#EDF3FF] blur-3xl opacity-80 pointer-events-none"></div>

      {/* Top Header */}
      <header className="py-6 px-6 sm:px-12 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-[#496DF5]/20">
            <Activity size={22} className="text-white" />
          </div>
          <div>
            <span className="font-manrope text-xl font-extrabold tracking-tight text-[#171B3D]">
              TelePulse<span className="text-[#6546E8]">.AI</span>
            </span>
            <p className="text-[10px] font-mono tracking-widest text-[#68708D] uppercase font-semibold">
              Network Operations & Intelligence
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#EAE8F5] shadow-xs text-xs text-[#171B3D]">
          <span className="w-2 h-2 rounded-full bg-[#20B486] animate-pulse"></span>
          <span className="font-medium text-[11px]">NOC Production Cluster: Dhaka Central</span>
        </div>
      </header>

      {/* Main Form Center */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="bg-white rounded-3xl p-7 sm:p-9 max-w-[480px] w-full border border-[#EAE8F5] shadow-[0_8px_32px_rgba(38,35,90,0.06)]">
          {/* Card Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE9FF] text-[#6546E8] text-xs font-semibold mb-3">
              <Sparkles size={13} />
              <span>Enterprise Operations Portal</span>
            </div>
            <h2 className="font-manrope text-2xl font-bold text-[#171B3D] tracking-tight">
              Sign In to TelePulse AI
            </h2>
            <p className="text-xs text-[#68708D] mt-1.5">
              Access real-time telemetry, TowerMind AI diagnostics, and incident dispatch.
            </p>
          </div>

          {/* 1-Click Fast-Track Demo Access for Hackathon Judges */}
          <div className="mb-6 p-4 rounded-2xl bg-[#F9F8FF] border border-[#EAE8F5] text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#171B3D] flex items-center gap-1.5">
                <Zap size={14} className="text-[#7653F5]" />
                Judge & Evaluator Fast-Track
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#EDE9FF] text-[#6546E8]">
                Instant Demo
              </span>
            </div>
            <p className="text-[11px] text-[#68708D] leading-relaxed mb-3">
              Bypass credential entry and access the live NOC console directly with full operator privileges.
            </p>
            <button
              onClick={handleFastTrack}
              disabled={isSubmitting}
              className="w-full h-10 rounded-xl bg-brand-gradient hover:opacity-95 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>Enter Live NOC Console</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-[#ECEAF5] w-full"></div>
            <span className="bg-white px-3 text-[11px] font-medium text-[#9299AF] uppercase tracking-wider absolute">
              or use credentials
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#171B3D] mb-1.5">
                Operator Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9299AF]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#F5F5FC] border border-[#E5E3F0] rounded-xl text-xs text-[#171B3D] focus:outline-none focus:border-[#6546E8] focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171B3D] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9299AF]" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#F5F5FC] border border-[#E5E3F0] rounded-xl text-xs text-[#171B3D] focus:outline-none focus:border-[#6546E8] focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171B3D] mb-1.5">
                Role & Permission Scope
              </label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F5F5FC] border border-[#E5E3F0] rounded-xl text-xs text-[#171B3D] focus:outline-none focus:border-[#6546E8] focus:bg-white transition-all"
              >
                <option value="Senior NOC Specialist">Senior NOC Specialist (Full Control)</option>
                <option value="Network Performance Analyst">Network Performance Analyst</option>
                <option value="Incident Response Lead">Incident Response Lead</option>
                <option value="Telecom Executive / Auditor">Telecom Executive / Auditor</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 h-10 rounded-xl bg-[#111B49] hover:bg-[#1C2C6E] text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Authenticating...
                </span>
              ) : (
                <span>Sign In as {selectedRole.split(' ')[0]}</span>
              )}
            </button>
          </form>

          {/* Badges footer */}
          <div className="mt-6 pt-4 border-t border-[#ECEAF5] flex items-center justify-between text-[11px] text-[#9299AF]">
            <span className="flex items-center gap-1">
              <Radio size={12} className="text-[#6546E8]" /> 20 Active Towers
            </span>
            <span className="flex items-center gap-1">
              <Server size={12} className="text-[#20B486]" /> Spark Tier
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-[#3568F5]" /> Allowlist Safe
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-xs text-[#9299AF] relative z-10">
        TelePulse AI © 2026 • AI-Powered Network Operations and Intelligence Platform • Dhaka Metro NOC
      </footer>
    </div>
  );
}
