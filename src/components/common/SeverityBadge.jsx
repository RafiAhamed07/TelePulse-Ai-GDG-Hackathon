import React from 'react';

export function SeverityBadge({ severity }) {
  const isCritical = (severity || '').toLowerCase() === 'critical';

  if (isCritical) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDEDF0] text-[#E85D70] border border-[#F9B6C1]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#E85D70] animate-pulse"></span>
        CRITICAL
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF6EB] text-[#F3A43B] border border-[#FBD9A4]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#F3A43B]"></span>
      WARNING
    </span>
  );
}

