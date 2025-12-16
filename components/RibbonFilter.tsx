import React, { useState } from 'react';
import { Search, Filter, RefreshCw, Upload, Download, ListFilter, Layers, Save, Loader2, Menu, X } from 'lucide-react';
import { ShopLocation, WorkflowStatus } from '../types';

interface ColumnVisibility {
  no: boolean;
  itemDesc: boolean;
  techSpecs: boolean;
  status: boolean;
  shop: boolean;
  updated: boolean;
}

interface RibbonFilterProps {
  onSearch: (term: string) => void;
  onFilterShop: (shop: string) => void;
  activeFilterShop: string;
  
  onFilterStatus: (status: string) => void;
  activeFilterStatus: string;
  
  onFilterItem: (itemType: string) => void;
  activeFilterItem: string;
  itemOptions: string[];

  onReset: () => void;
  onImportClick: () => void;
  onExportClick: () => void;
  
  onSave: () => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isAdmin: boolean;
  
  visibleColumns: ColumnVisibility;
  onColumnVisibilityChange: (columns: ColumnVisibility) => void;
}

export const RibbonFilter: React.FC<RibbonFilterProps> = ({
  onSearch,
  onFilterShop,
  activeFilterShop,
  onFilterStatus,
  activeFilterStatus,
  onFilterItem,
  activeFilterItem,
  itemOptions,
  onReset,
  onImportClick,
  onExportClick,
  onSave,
  hasUnsavedChanges,
  isSaving,
  isAdmin,
  visibleColumns,
  onColumnVisibilityChange
}) => {
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  
  const toggleColumn = (column: keyof ColumnVisibility) => {
    onColumnVisibilityChange({
      ...visibleColumns,
      [column]: !visibleColumns[column]
    });
  };
  return (
    <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-3 flex flex-col gap-3 shadow-sm z-10">
      
      {/* Top Row: Branding & Search */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center whitespace-nowrap">
          <img 
            src="/logo.png" 
            alt="NexGen" 
            className="h-8 sm:h-10 w-auto object-contain"
            onError={(e) => {
              // Fallback if image not found
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'flex items-center text-brand-700 font-bold text-base sm:text-xl';
              fallback.innerHTML = '<div class="w-7 h-7 sm:w-8 sm:h-8 bg-brand-600 rounded-md flex items-center justify-center text-white mr-1.5 sm:mr-2 text-sm sm:text-base">NG</div><span class="hidden sm:inline">NexGen</span>';
              target.parentElement?.appendChild(fallback);
            }}
          />
        </div>
        
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-1.5 sm:py-2 border border-slate-300 rounded-md leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-500 focus:border-brand-500 text-sm"
            placeholder="검색..."
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Bottom Row: Filters & Actions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
        
        {/* Column Menu Filter */}
        <div className="flex items-center gap-1 flex-shrink-0 relative">
          <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="text-xs sm:text-sm border border-slate-300 rounded-md shadow-sm py-1 sm:py-1.5 px-2 sm:px-3 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            메뉴
          </button>
          
          {showColumnMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 min-w-[160px]">
              <div className="p-2 space-y-1">
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.no}
                    onChange={() => toggleColumn('no')}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm">NO.</span>
                </label>
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.itemDesc}
                    onChange={() => toggleColumn('itemDesc')}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm">ITEM / DESC</span>
                </label>
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.techSpecs}
                    onChange={() => toggleColumn('techSpecs')}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm">TECH SPECS</span>
                </label>
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.status}
                    onChange={() => toggleColumn('status')}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm">STATUS</span>
                </label>
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.shop}
                    onChange={() => toggleColumn('shop')}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm">SHOP</span>
                </label>
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.updated}
                    onChange={() => toggleColumn('updated')}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm">UPDATED</span>
                </label>
              </div>
            </div>
          )}
        </div>
        
        {/* Status Filter */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <ListFilter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
          <select 
            className="text-xs sm:text-sm border-slate-300 rounded-md shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50 py-1 sm:py-1.5 bg-white text-slate-700 pr-6 sm:pr-8"
            value={activeFilterStatus}
            onChange={(e) => onFilterStatus(e.target.value)}
          >
            <option value="ALL">상태</option>
            {Object.values(WorkflowStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Item/Assembly Filter */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
          <select 
            className="text-xs sm:text-sm border-slate-300 rounded-md shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50 py-1 sm:py-1.5 bg-white text-slate-700 pr-6 sm:pr-8"
            value={activeFilterItem}
            onChange={(e) => onFilterItem(e.target.value)}
          >
            <option value="ALL">품목</option>
            {itemOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Shop Filter */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
          <select 
            className="text-xs sm:text-sm border-slate-300 rounded-md shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50 py-1 sm:py-1.5 bg-white text-slate-700 pr-6 sm:pr-8"
            value={activeFilterShop}
            onChange={(e) => onFilterShop(e.target.value)}
          >
            <option value="ALL">작업장</option>
            {Object.values(ShopLocation).filter(s => s !== ShopLocation.NONE).map(shop => (
              <option key={shop} value={shop}>{shop}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={onReset}
          className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors flex-shrink-0"
          title="필터 초기화"
        >
          <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <div className="flex gap-1 ml-auto flex-shrink-0">
          {/* Save Button - Only visible for admin */}
          {isAdmin && (
            <button 
              onClick={onSave}
              disabled={!hasUnsavedChanges || isSaving}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-md transition-all shadow-sm ${
                hasUnsavedChanges && !isSaving
                  ? 'bg-green-600 hover:bg-green-700 text-white animate-pulse'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
              title={hasUnsavedChanges ? '변경사항을 서버에 저장' : '저장된 상태'}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              <span className="hidden sm:inline">{isSaving ? '저장중...' : '저장'}</span>
              {hasUnsavedChanges && !isSaving && (
                <span className="hidden lg:inline text-xs opacity-90">(미저장)</span>
              )}
            </button>
          )}
          
          <button 
            onClick={onImportClick}
            disabled={!isAdmin}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
              isAdmin 
                ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
            title={isAdmin ? "CSV 가져오기" : "관리자만 사용 가능"}
          >
            <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          
          <button 
            onClick={onExportClick}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium rounded-md transition-colors"
            title="CSV 내보내기"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>
    </div>
  );
};