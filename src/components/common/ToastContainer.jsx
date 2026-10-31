import React from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts } = useNetwork();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        let bg = 'bg-white border-[#EAE8F5] text-[#171B3D]';
        let Icon = Info;
        let iconColor = 'text-[#4387EF]';

        if (toast.type === 'healthy') {
          bg = 'bg-[#F2FAF6] border-[#A3EAD2] text-[#171B3D]';
          Icon = CheckCircle2;
          iconColor = 'text-[#20B486]';
        } else if (toast.type === 'critical') {
          bg = 'bg-[#FDEDF0] border-[#F9B6C1] text-[#171B3D]';
          Icon = AlertOctagon;
          iconColor = 'text-[#E85D70]';
        } else if (toast.type === 'warning') {
          bg = 'bg-[#FEF6EB] border-[#FBD9A4] text-[#171B3D]';
          Icon = AlertTriangle;
          iconColor = 'text-[#F3A43B]';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-subtle ${bg} animate-slideUp`}
          >
            <div className={`mt-0.5 shrink-0 ${iconColor}`}>
              <Icon size={18} />
            </div>
            <div className="text-xs font-medium leading-relaxed flex-1">
              {toast.message}
            </div>
          </div>
        );
      })}
    </div>
  );
}

