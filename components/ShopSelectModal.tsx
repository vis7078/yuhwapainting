import React from 'react';
import { ShopLocation } from '../types';
import { X, LayoutGrid } from 'lucide-react';

interface ShopSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (shop: ShopLocation) => void;
  count: number;
}

export const ShopSelectModal: React.FC<ShopSelectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count
}) => {
  if (!isOpen) return null;

  const shops = Object.values(ShopLocation).filter(s => s !== ShopLocation.NONE);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-full bg-indigo-50">
              <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900">작업장 선택</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <p className="text-sm sm:text-base text-slate-600 mb-4">
            <strong className="text-slate-900">{count}개 항목</strong>을 도장 단계로 이동합니다. 
            작업장을 선택해주세요.
          </p>
          
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {shops.map((shop) => (
              <button
                key={shop}
                onClick={() => onConfirm(shop)}
                className="flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-all font-medium text-slate-700 text-sm"
              >
                {shop}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-slate-50 p-3 sm:p-4 flex justify-end gap-2 sm:gap-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};