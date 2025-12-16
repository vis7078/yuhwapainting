import React from 'react';
import { AlertTriangle, CheckCircle, Info, X, Upload } from 'lucide-react';

export type ModalType = 'confirm' | 'alert' | 'delete' | 'success' | 'import';

interface ModalProps {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  onSecondary?: () => void; // For import modal: append action
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  type, 
  title, 
  message, 
  onClose, 
  onConfirm,
  onSecondary 
}) => {
  if (!isOpen) return null;

  // Configuration based on type
  const config = {
    confirm: {
      icon: <Info className="w-6 h-6 text-blue-600" />,
      bg: 'bg-blue-50',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700',
      confirmText: '확인'
    },
    delete: {
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
      bg: 'bg-red-50',
      confirmBtn: 'bg-red-600 hover:bg-red-700',
      confirmText: '삭제'
    },
    success: {
      icon: <CheckCircle className="w-6 h-6 text-emerald-600" />,
      bg: 'bg-emerald-50',
      confirmBtn: 'bg-emerald-600 hover:bg-emerald-700',
      confirmText: '확인'
    },
    alert: {
      icon: <Info className="w-6 h-6 text-slate-600" />,
      bg: 'bg-slate-50',
      confirmBtn: 'bg-slate-800 hover:bg-slate-900',
      confirmText: '확인'
    },
    import: {
      icon: <Upload className="w-6 h-6 text-indigo-600" />,
      bg: 'bg-indigo-50',
      confirmBtn: 'bg-red-600 hover:bg-red-700',
      confirmText: '덮어쓰기'
    }
  };

  const currentConfig = config[type];
  const isActionType = type === 'confirm' || type === 'delete';
  const isImportType = type === 'import';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`p-1.5 sm:p-2 rounded-full ${currentConfig.bg}`}>
              {currentConfig.icon}
            </div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3 sm:p-4 flex justify-end gap-2 sm:gap-3 border-t border-slate-100">
          {isImportType ? (
            <>
              <button
                onClick={onClose}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (onSecondary) onSecondary();
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors"
              >
                추가
              </button>
              <button
                onClick={() => {
                  if (onConfirm) onConfirm();
                }}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white rounded-lg shadow-sm transition-colors ${currentConfig.confirmBtn}`}
              >
                {currentConfig.confirmText}
              </button>
            </>
          ) : (
            <>
              {isActionType && (
                <button
                  onClick={onClose}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  취소
                </button>
              )}
              <button
                onClick={() => {
                  if (onConfirm) onConfirm();
                  else onClose();
                }}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white rounded-lg shadow-sm transition-colors ${currentConfig.confirmBtn}`}
              >
                {isActionType ? currentConfig.confirmText : '확인'}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};