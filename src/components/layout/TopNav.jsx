import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Building2,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';

export function TopNav({ currentTab, onMenuClick, onSearchClick }) {
  const { user } = useAuth();
  const { stats, notifications, setNotifications } = useNetwork();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const notifRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Title & breadcrumb mappings
  const pageMeta = {
    dashboard: { title: 'Network Operations Dashboard', breadcrumb: 'Overview' },
    sites: { title: 'Network Sites & Tower Infrastructure', breadcrumb: 'Infrastructure' },
    analytics: { title: 'Performance & Telemetry Analytics', breadcrumb: 'Intelligence' },
    ingestion: { title: 'Data Ingestion & Simulator Control', breadcrumb: 'Data Pipeline' },
    incidents: { title: 'Incident Investigation & Management', breadcrumb: 'Operations' },
    copilot: { title: 'TowerMind AI Copilot', breadcrumb: 'AI Engine' },
    reports: { title: 'Network Health & Operations Reports', breadcrumb: 'Reporting' },
  };

  const meta = pageMeta[currentTab] || { title: 'Network Operations', breadcrumb: 'TelePulse' };

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="h-[72px] bg-white border-b border-[#EAE8F5] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_2px_10px_rgba(38,35,90,0.02)]">
      {/* Left: Mobile Toggle + Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-1 text-[#68708D] hover:text-[#171B3D] lg:hidden rounded-lg hover:bg-[#F5F4FF]"
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#9299AF]">
            <span>TelePulse AI</span>
            <span>/</span>
            <span className="text-[#6546E8]">{meta.breadcrumb}</span>
          </div>
          <h1 className="font-manrope text-base sm:text-lg font-bold text-[#171B3D] leading-tight truncate">
            {meta.title}
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Search input (hidden on very small screens) */}
        <div className="relative hidden md:block w-48 lg:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9299AF]" />
          <input
            type="text"
            placeholder="Search towers, incidents..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#F5F5FC] border border-[#E5E3F0] rounded-xl text-xs text-[#171B3D] placeholder-[#9299AF] focus:outline-none focus:border-[#6546E8] focus:bg-white transition-all"
          />
        </div>

        {/* Organization Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F9F8FF] border border-[#EAE8F5] rounded-xl text-xs text-[#171B3D]">
          <Building2 size={13} className="text-[#6546E8]" />
          <span className="font-semibold text-[11px]">ORG-001</span>
          <span className="text-[#9299AF] text-[10px] hidden xl:inline">• Dhaka NOC</span>
        </div>

        {/* Global Network Health Pill */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-[#A3EAD2] bg-[#E8F8F2] text-[#20B486] text-xs font-semibold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#20B486] animate-pulse"></span>
          <span className="hidden sm:inline font-mono text-[11px]">99.8% AVAIL</span>
          <span className="sm:hidden font-mono text-[11px]">OK</span>
        </div>

        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-xl text-[#68708D] hover:text-[#171B3D] hover:bg-[#F5F4FF] transition-colors"
            aria-label="View notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#E85D70] rounded-full ring-2 ring-white animate-pulse"></span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-modal border border-[#EAE8F5] p-4 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-[#ECEAF5]">
                <div className="flex items-center gap-2">
                  <h4 className="font-manrope text-sm font-bold text-[#171B3D]">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FDEDF0] text-[#E85D70]">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-medium text-[#6546E8] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#F5F4FF] max-h-72 overflow-y-auto mt-2">
                {notifications.length === 0 ? (
                  <p className="text-center py-6 text-xs text-[#9299AF]">No notifications</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="py-2.5 flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'critical' ? (
                          <div className="w-6 h-6 rounded-full bg-[#FDEDF0] text-[#E85D70] flex items-center justify-center">
                            <AlertOctagon size={13} />
                          </div>
                        ) : n.type === 'warning' ? (
                          <div className="w-6 h-6 rounded-full bg-[#FEF6EB] text-[#F3A43B] flex items-center justify-center">
                            <AlertTriangle size={13} />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#EDF3FF] text-[#4387EF] flex items-center justify-center">
                            <CheckCircle2 size={13} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#171B3D] truncate">{n.title}</p>
                        <p className="text-[11px] text-[#68708D] leading-snug mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-[#9299AF] mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Mini Avatar */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-[#ECEAF5]">
          <div className="w-8 h-8 rounded-full bg-brand-gradient text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {user.avatar}
          </div>
          <span className="hidden lg:block text-xs font-semibold text-[#171B3D]">
            {user.name.split(' ')[0]}
          </span>
        </div>
      </div>
    </header>
  );
}

