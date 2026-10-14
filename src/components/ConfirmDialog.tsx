import React from 'react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<Props> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  danger = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <h3 className="font-serif text-lg font-semibold text-[#1A1A1A] tracking-tight">{title}</h3>
        <p className="text-sm text-[#5A5751] leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs uppercase tracking-wider font-medium text-[#5A5751] hover:text-[#1A1A1A] hover:bg-[#EBE7DF] rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors ${
              danger
                ? 'bg-rose-700 text-white hover:bg-rose-800'
                : 'bg-[#1A1A1A] text-white hover:bg-[#333]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
