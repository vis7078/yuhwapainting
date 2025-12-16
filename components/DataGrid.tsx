import React from 'react';
import { ProductItem, WorkflowStatus } from '../types';
import { STATUS_COLORS, STATUS_ICONS } from '../constants';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { SortConfig } from '../App';

interface ColumnVisibility {
  no: boolean;
  itemDesc: boolean;
  techSpecs: boolean;
  status: boolean;
  shop: boolean;
  updated: boolean;
}

interface DataGridProps {
  items: ProductItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  sortConfig: SortConfig | null;
  onSort: (key: SortConfig['key']) => void;
  visibleColumns: ColumnVisibility;
}

export const DataGrid: React.FC<DataGridProps> = ({ 
  items, 
  selectedIds, 
  onToggleSelect, 
  onToggleSelectAll,
  sortConfig,
  onSort,
  visibleColumns
}) => {
  const allSelected = items.length > 0 && selectedIds.size === items.length;

  const SortIcon = ({ columnKey }: { columnKey: SortConfig['key'] }) => {
    if (sortConfig?.key !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-50" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-brand-600" />
      : <ArrowDown className="w-3 h-3 text-brand-600" />;
  };

  return (
    <div className="flex-1 overflow-auto custom-scrollbar bg-white shadow-sm border border-slate-200 rounded-lg mx-2 sm:mx-4 lg:mx-6 mb-20 sm:mb-24">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50 sticky top-0 z-10">
          <tr>
            <th scope="col" className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-8 sm:w-12">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 sm:w-4 sm:h-4"
                checked={allSelected}
                onChange={onToggleSelectAll}
              />
            </th>

            {visibleColumns.no && (
              <th scope="col" className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                NO.
              </th>
            )}
            
            {visibleColumns.itemDesc && (
              <th 
                scope="col" 
                className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer group hover:bg-slate-100 transition-colors select-none"
                onClick={() => onSort('item')}
              >
                <div className="flex items-center gap-1">
                  ITEM / DESC
                  <SortIcon columnKey="item" />
                </div>
              </th>
            )}

            {visibleColumns.techSpecs && (
              <th scope="col" className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                TECH SPECS
              </th>
            )}
            
            {visibleColumns.status && (
              <th 
                scope="col" 
                className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer group hover:bg-slate-100 transition-colors select-none"
                onClick={() => onSort('status')}
              >
                <div className="flex items-center gap-1">
                  STATUS
                  <SortIcon columnKey="status" />
                </div>
              </th>
            )}

            {visibleColumns.shop && (
              <th scope="col" className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">SHOP</th>
            )}
            
            {visibleColumns.updated && (
              <th scope="col" className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">UPDATED</th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {items.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 sm:px-6 py-8 sm:py-12 text-center text-slate-400 text-sm">
                아이템이 없습니다. CSV를 가져오거나 필터를 조정하세요.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr 
                key={item.id} 
                className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedIds.has(item.id) ? 'bg-yellow-100' : ''}`}
                onClick={() => onToggleSelect(item.id)}
              >
                <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 sm:w-4 sm:h-4"
                    checked={selectedIds.has(item.id)}
                    onChange={(e) => {
                       e.stopPropagation();
                       onToggleSelect(item.id);
                    }}
                  />
                </td>
                
                {visibleColumns.no && (
                  <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-slate-700">
                    {item.id}
                  </td>
                )}
                
                {visibleColumns.itemDesc && (
                  <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-900">
                    <div className="font-bold text-base">{item.description}</div>
                    <div className="text-xs text-slate-500">{item.item}</div>
                  </td>
                )}
                
                {visibleColumns.techSpecs && (
                  <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs text-slate-500 font-mono">
                    <div className="grid grid-cols-2 gap-x-2 lg:gap-x-4 gap-y-1">
                      <span className="col-span-2 text-slate-800 font-semibold border-b border-slate-100 pb-1 mb-1">
                        {item.material} <span className="text-slate-400 mx-1">|</span> {item.fp}
                      </span>
                      <span title="Length" className="truncate">L: {item.length}</span>
                      <span title="Quantity" className="text-slate-700 font-bold truncate">Q: {item.qty}</span>
                      <span title="Weight" className="truncate">W: {item.weight}</span>
                      <span title="Surface Area" className="truncate">A: {item.area}</span>
                    </div>
                  </td>
                )}
                
                {visibleColumns.status && (
                  <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[item.status]}`}>
                      <span className="mr-1 sm:mr-1.5">{STATUS_ICONS[item.status]}</span>
                      {item.status}
                    </span>
                  </td>
                )}
                
                {visibleColumns.shop && (
                  <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-600">
                    {item.shop}
                  </td>
                )}
                
                {visibleColumns.updated && (
                  <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-400">
                    {new Date(item.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};