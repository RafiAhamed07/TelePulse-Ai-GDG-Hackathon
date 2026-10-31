import React from 'react';

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  badge,
  className = '',
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-[#EAE8F5] shadow-subtle ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#ECEAF5]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-manrope text-[15px] font-bold text-[#171B3D]">
              {title}
            </h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-[#68708D] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {action}
          </div>
        )}
      </div>

      <div className="w-full">
        {children}
      </div>
    </div>
  );
}

