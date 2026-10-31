import React from 'react';

export function MetricCard({
  title,
  value,
  unit = '',
  subtitle,
  icon: Icon,
  trend,
  trendType = 'neutral', // 'positive' | 'negative' | 'neutral'
  badge,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-[#EAE8F5] shadow-subtle transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-[#6546E8] hover:shadow-hover' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-[#68708D] uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-[#F5F4FF] flex items-center justify-center text-[#6546E8]">
            <Icon size={17} strokeWidth={2.2} />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="font-manrope text-3xl font-bold text-[#171B3D] tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="font-mono text-sm font-medium text-[#9299AF]">
            {unit}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        {subtitle && (
          <span className="text-[#68708D] flex items-center gap-1">
            {subtitle}
          </span>
        )}
        {trend && (
          <span
            className={`font-medium ${
              trendType === 'positive'
                ? 'text-[#20B486]'
                : trendType === 'negative'
                ? 'text-[#E85D70]'
                : 'text-[#68708D]'
            }`}
          >
            {trend}
          </span>
        )}
        {badge}
      </div>
    </div>
  );
}

