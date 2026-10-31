import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export function ConfirmDialog({
  isOpen,
  title,
  message,
  note,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  variant = 'primary', // 'primary' | 'danger'
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111B49]/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#EAE8F5] shadow-modal overflow-hidden">
        {/* Header */}
        <div className="p-5 flex items-start justify-between border-b border-[#ECEAF5]">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              variant === 'danger' ? 'bg-[#FDEDF0] text-[#E85D70]' : 'bg-[#EDE9FF] text-[#6546E8]'
            }`}>
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="font-manrope text-base font-bold text-[#171B3D]">
                {title}
              </h3>
              <p className="text-xs text-[#68708D] mt-0.5">NOC Operational Confirmation</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-[#9299AF] hover:text-[#171B3D] p-1 rounded-lg hover:bg-[#F5F4FF] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <p className="text-sm text-[#171B3D] leading-relaxed">
            {message}
          </p>
          {note && (
            <div className="bg-[#F8F8FF] border border-[#ECEAF5] rounded-xl p-3 text-xs text-[#68708D] flex items-start gap-2">
              <span className="font-semibold text-[#6546E8] shrink-0">Note:</span>
              <span>{note}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F9F8FF] border-t border-[#ECEAF5] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#68708D] hover:bg-[#EDE9FF] hover:text-[#171B3D] transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            data-testid="confirm-dialog-submit"
            className={`px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-sm ${
              variant === 'danger'
                ? 'bg-[#E85D70] hover:bg-[#d4485b]'
                : 'bg-brand-gradient hover:opacity-95'
            } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Writing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
