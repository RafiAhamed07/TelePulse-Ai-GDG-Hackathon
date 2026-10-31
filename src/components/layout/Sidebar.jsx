import React from 'react';
import {
  LayoutDashboard,
  Radio,
  LineChart,
  UploadCloud,
  AlertOctagon,
  Sparkles,
  FileText,
  Activity,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';

export function Sidebar({ currentTab, setCurrentTab, isMobileOpen, setIsMobileOpen }) {
  const { user, logout } = useAuth();
  const { activeIncidents, isSimRunning } = useNetwork();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sites', label: 'Network Sites', icon: Radio },
    { id: 'analytics', label: 'Network Analytics', icon: LineChart },
    { id: 'ingestion', label: 'Data Ingestion', icon: UploadCloud },
    {
      id: 'incidents',
      label: 'Incident Management',
      icon: AlertOctagon,
      badge: activeIncidents.length > 0 ? activeIncidents.length : null,
      badgeColor: 'bg-[#E85D70]',
    },
    {
      id: 'copilot',
      label: 'AI Copilot',
      icon: Sparkles,
      highlight: true,
    },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#111B49]/60 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Vertical Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-[220px] bg-[#111B49] text-[#F7F7FF] flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-[#1B275E] ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Logo & Branding */}
        <div>
          <div className="h-[72px] px-5 flex items-center gap-3 border-b border-[#1E2B63]">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-md shadow-[#496DF5]/20 shrink-0">
              <Activity size={20} className="text-white" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-manrope text-[17px] font-extrabold tracking-tight text-white">
                  TelePulse<span className="text-[#7653F5]">.AI</span>
                </span>
              </div>
              <p className="text-[10px] font-mono tracking-widest text-[#A9B3D5] uppercase font-medium">
                Network Intelligence
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    if (isMobileOpen) setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all group ${
                    isActive
                      ? 'bg-brand-gradient text-white shadow-md shadow-[#496DF5]/25 font-semibold'
                      : 'text-[#A9B3D5] hover:text-white hover:bg-[#1E2B63]/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      size={18}
                      className={isActive ? 'text-white' : 'text-[#8B98C4] group-hover:text-white transition-colors'}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full text-white ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && !isActive && (
                    <span className="w-2 h-2 rounded-full bg-[#7653F5] animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Panel: Engine Status & User Profile */}
        <div className="p-3 border-t border-[#1E2B63] space-y-3 bg-[#0D153B]/60">
          {/* Real-time Heartbeat */}
          <div className="px-3 py-2 rounded-xl bg-[#152054] border border-[#233177] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSimRunning ? 'bg-[#20B486] animate-pulse' : 'bg-[#9299AF]'}`}></span>
              <span className="text-[11px] text-[#A9B3D5]">
                {isSimRunning ? 'Telemetry Pulse Active' : 'Simulator Paused'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#7653F5] font-semibold">5s</span>
          </div>

          {/* User Profile */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-brand-gradient text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                {user.avatar}
              </div>
              <div className="min-w-0 overflow-hidden text-left">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-[#A9B3D5] truncate">{user.role}</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out / Switch to Demo Login"
              className="p-1.5 text-[#A9B3D5] hover:text-[#E85D70] hover:bg-[#1E2B63] rounded-lg transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

