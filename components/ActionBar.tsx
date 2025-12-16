import React, { useState } from 'react';
import { ProductItem, WorkflowStatus, ShopLocation } from '../types';
import { WORKFLOW_SEQUENCE } from '../constants';
import { ChevronRight, ChevronsRight, GitBranch, X, Trash2 } from 'lucide-react';

interface ActionBarProps {
  selectedCount: number;
  onAdvance: () => void;
  onSetStatus: (status: WorkflowStatus, shop?: ShopLocation) => void;
  onClearSelection: () => void;
  onDelete: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({ 
  selectedCount, 
  onAdvance, 
  onSetStatus,
  onClearSelection,
  onDelete
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg p-2 sm:p-4 z-20 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Mobile Layout */}
        <div className="flex flex-col gap-2 sm:hidden">
          {/* Top row: Selection info & Main action */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-brand-600 text-white font-bold rounded-full w-7 h-7 flex items-center justify-center text-sm">
                {selectedCount}
              </div>
              <span className="text-slate-700 font-medium text-sm">선택됨</span>
            </div>
            
            <button
              onClick={onAdvance}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all active:scale-95 text-sm"
            >
              다음 단계
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Bottom row: Secondary actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium border transition-colors text-xs ${showAdvanced ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white border-slate-200 text-slate-600'}`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              예외처리
            </button>

            <button
              onClick={onDelete}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              삭제
            </button>
            
            <button 
              onClick={onClearSelection}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          {/* Left: Selection Info */}
          <div className="flex items-center gap-4">
            <div className="bg-brand-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center">
              {selectedCount}
            </div>
            <span className="text-slate-700 font-medium">선택됨</span>
            <button 
              onClick={onClearSelection}
              className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1"
            >
              <X className="w-3 h-3" /> 취소
            </button>
          </div>

          {/* Center: Main Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={onAdvance}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all active:scale-95"
            >
              다음 단계
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="h-8 w-px bg-slate-300 mx-2"></div>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium border transition-colors ${showAdvanced ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <GitBranch className="w-4 h-4" />
              예외 처리
            </button>

            <div className="h-8 w-px bg-slate-300 mx-2"></div>

            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              title="선택 항목 삭제"
            >
              <Trash2 className="w-4 h-4" />
              삭제
            </button>
          </div>
        </div>

      </div>

      {/* Advanced Drawer */}
      {showAdvanced && (
        <div className="max-w-7xl mx-auto mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 sm:mb-3">상태 직접 변경</h4>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {WORKFLOW_SEQUENCE.map((status) => (
              <button
                key={status}
                onClick={() => onSetStatus(status)}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs rounded border border-slate-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-colors bg-white"
              >
                {status}
              </button>
            ))}
          </div>
          
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 sm:mb-3 mt-3 sm:mt-4">작업장 할당</h4>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {Object.values(ShopLocation).filter(s => s !== ShopLocation.NONE).map((shop) => (
              <button
                key={shop}
                onClick={() => onSetStatus(WorkflowStatus.SHOP_SORTING, shop)}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs rounded border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors bg-white"
              >
                {shop}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};