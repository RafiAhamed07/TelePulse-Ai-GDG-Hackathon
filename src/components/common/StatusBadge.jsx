import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info } from 'lucide-react';

export function StatusBadge({ status, size = 'md', showIcon = true }) {
  const norm = (status || '').toLowerCase();

  let styles = 'bg-[#E8F8F2] text-[#20B486] border-[#A3EAD2]';
  let Icon = CheckCircle2;
  let label = status || 'Healthy';

  if (norm === 'critical' || norm === 'open') {
    styles = 'bg-[#FDEDF0] text-[#E85D70] border-[#F9B6C1]';
    Icon = AlertOctagon;
  } else if (norm === 'warning' || norm === 'degraded' || norm === 'investigating') {
    styles = 'bg-[#FEF6EB] text-[#F3A43B] border-[#FBD9A4]';
    Icon = AlertTriangle;
  } else if (norm === 'info' || norm === 'simulated' || norm === 'resolved') {
    if (norm === 'resolved') {
      styles = 'bg-[#E8F8F2] text-[#20B486] border-[#A3EAD2]';
      Icon = CheckCircle2;
    } else {
      styles = 'bg-[#EDF3FF] text-[#4387EF] border-[#B5D1FC]';
      Icon = Info;
    }
  }

  const sizeClasses = size === 'sm' 
    ? 'text-[11px] px-2 py-0.5 gap-1' 
    : 'text-xs px-2.5 py-1 gap-1.5';

  const iconSizes = size === 'sm' ? 12 : 13;

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${styles} ${sizeClasses}`}>
      {showIcon && <Icon size={iconSizes} strokeWidth={2.2} />}
      <span className="capitalize">{label}</span>
    </span>
  );
}

