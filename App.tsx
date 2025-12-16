import React, { useState, useEffect, useMemo, useRef } from 'react';
import { auth, googleProvider, db } from "./firebase";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";

import { 
  ProductItem, 
  WorkflowStatus, 
  ShopLocation 
} from './types';
import { 
  loadItems, 
  saveItems, 
  parseCSV, 
  getNextStatus, 
  calculateStats,
  subscribeToItems 
} from './services/workflowService';
import { MOCK_CSV_DATA, WORKFLOW_SEQUENCE } from './constants';
import { Dashboard } from './components/Dashboard';
import { RibbonFilter } from './components/RibbonFilter';
import { DataGrid } from './components/DataGrid';
import { ActionBar } from './components/ActionBar';
import { Modal, ModalType } from './components/Modal';
import { ShopSelectModal } from './components/ShopSelectModal';

const ADMIN_UID = "aiRIAdVAKpO43zmynBX0T5C5PA02";

// UI State for the Modal
interface ModalState {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  onConfirm?: () => void;
  onSecondary?: () => void;
}

// Sorting State Interface
export interface SortConfig {
  key: 'status' | 'item' | 'id';
  direction: 'asc' | 'desc';
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const isAdmin = user?.uid === ADMIN_UID;

  const [items, setItems] = useState<ProductItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterShop, setFilterShop] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterItemType, setFilterItemType] = useState('ALL');
  const [showShipped, setShowShipped] = useState(false);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Modal States
  const [modalConfig, setModalConfig] = useState<ModalState>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: ''
  });
  
  const [showShopModal, setShowShopModal] = useState(false);

  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);


  // Initialize Data with real-time sync
  useEffect(() => {
    const initializeData = async () => {
      const data = await loadItems();
      if (data.length > 0) {
        setItems(data);
        setHasUnsavedChanges(false);
      } else {
        // Load mock data if empty for demo purposes
        const initial = parseCSV(MOCK_CSV_DATA);
        setItems(initial);
        setHasUnsavedChanges(true); // Initial data needs to be saved
      }
    };
    
    initializeData();
    
    // Subscribe to real-time updates from other devices/users
    const unsubscribe = subscribeToItems((updatedItems) => {
      setItems(updatedItems);
      setHasUnsavedChanges(false); // Server data is now in sync
    });
    
    return () => unsubscribe();
  }, []);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Compute unique Items for the filter dropdown (using ITEM column)
  const uniqueItemTypes = useMemo(() => {
    const types = new Set(items.map(i => i.item).filter(Boolean));
    return Array.from(types).sort();
  }, [items]);

  // Filter Logic
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Filter Shipped/Active (Rough Archive logic)
      if (!showShipped && item.status === WorkflowStatus.SHIPPED) return false;
      if (showShipped && item.status !== WorkflowStatus.SHIPPED) return false;

      // 2. Shop Filter
      if (filterShop !== 'ALL' && item.shop !== filterShop) return false;

      // 3. Status Filter
      if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;

      // 4. Item Type Filter (using ITEM column)
      if (filterItemType !== 'ALL' && item.item !== filterItemType) return false;

      // 5. Search Term (ID, Item, Desc)
      if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        return (
          item.id.toLowerCase().includes(lowerTerm) ||
          item.item.toLowerCase().includes(lowerTerm) ||
          item.description.toLowerCase().includes(lowerTerm)
        );
      }
      return true;
    });
  }, [items, searchTerm, filterShop, filterStatus, filterItemType, showShipped]);

  // Sorting Logic
  const sortedItems = useMemo(() => {
    if (!sortConfig) return filteredItems;

    const sorted = [...filteredItems];
    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.key) {
        case 'status':
          // Sort by workflow sequence index
          const indexA = WORKFLOW_SEQUENCE.indexOf(a.status);
          const indexB = WORKFLOW_SEQUENCE.indexOf(b.status);
          comparison = indexA - indexB;
          break;
        case 'item':
          // Sort by Item name, then Description
          const valA = (a.item + a.description).toLowerCase();
          const valB = (b.item + b.description).toLowerCase();
          comparison = valA.localeCompare(valB);
          break;
        case 'id':
           comparison = a.id.localeCompare(b.id);
           break;
        default:
          comparison = 0;
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredItems, sortConfig]);

  // Calculate stats based on filtered items rather than all items
  const stats = useMemo(() => calculateStats(filteredItems), [filteredItems]);

  // --- Modal Helpers ---
  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));
  
  const showModal = (type: ModalType, title: string, message: string, onConfirm?: () => void, onSecondary?: () => void) => {
    setModalConfig({ isOpen: true, type, title, message, onConfirm, onSecondary });
  };

  // --- Handlers ---

  const login = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };


  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(current => {
      if (current?.key === key) {
        // Toggle direction
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      // New key, default to asc
      return { key, direction: 'asc' };
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges || isSaving) return;
    
    setIsSaving(true);
    try {
      await saveItems(items);
      setHasUnsavedChanges(false);
      showModal('success', '저장 완료', '변경사항이 서버에 저장되었습니다.');
    } catch (error) {
      console.error('Save error:', error);
      showModal('alert', '저장 실패', '서버에 저장하는 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        try {
          const newItems = parseCSV(text);
          
          if (newItems.length > 0) {
            // Function to execute overwrite import
            const executeOverwrite = () => {
              setItems(newItems);
              setHasUnsavedChanges(true); // Mark as unsaved
              setSelectedIds(new Set());
              
              // Reset filters so the new list is visible
              setSearchTerm('');
              setFilterShop('ALL');
              setFilterStatus('ALL');
              setFilterItemType('ALL');
              setShowShipped(false);

              closeModal();
              
              // Show success message
              setTimeout(() => {
                showModal('success', '가져오기 완료', `기존 데이터를 삭제하고 ${newItems.length}개 항목으로 교체했습니다.\n저장 버튼을 눌러 서버에 저장하세요.`);
              }, 300);
            };

            // Function to execute append import
            const executeAppend = () => {
              // Check for duplicate IDs
              const existingIds = new Set(items.map(item => item.id));
              const duplicates: string[] = [];
              const uniqueNewItems = newItems.filter(item => {
                if (existingIds.has(item.id)) {
                  duplicates.push(item.id);
                  return false;
                }
                return true;
              });

              const mergedItems = [...items, ...uniqueNewItems];
              setItems(mergedItems);
              setHasUnsavedChanges(true);
              setSelectedIds(new Set());
              
              closeModal();
              
              setTimeout(() => {
                if (duplicates.length > 0) {
                  showModal('success', '추가 완료', 
                    `${uniqueNewItems.length}개 항목을 추가했습니다. (${duplicates.length}개 중복 제외)\n저장 버튼을 눌러 서버에 저장하세요.`);
                } else {
                  showModal('success', '추가 완료', 
                    `${uniqueNewItems.length}개 항목을 추가했습니다.\n저장 버튼을 눌러 서버에 저장하세요.`);
                }
              }, 300);
            };

            // If we already have items, show import modal
            if (items.length > 0) {
              showModal(
                'import', 
                'CSV 가져오기 방식 선택', 
                `현재 ${items.length}개 항목이 있습니다.\nCSV에서 ${newItems.length}개 항목을 가져옵니다.\n\n• 덮어쓰기: 기존 데이터를 모두 삭제하고 새 데이터로 교체\n• 추가: 기존 데이터 뒤에 새 데이터 추가 (중복 ID는 제외)`,
                executeOverwrite,
                executeAppend
              );
            } else {
              // No existing items, just import immediately
              executeOverwrite();
            }
          } else {
            showModal('alert', '가져오기 실패', 'CSV 파일에서 유효한 데이터를 찾을 수 없습니다. 헤더 행과 데이터가 있는지 확인하세요.');
          }
        } catch (error) {
          console.error("CSV Parse Error:", error);
          showModal('alert', '오류', 'CSV 파일을 파싱하는데 실패했습니다. 파일 형식을 확인하세요.');
        }
      }
    };
    
    reader.readAsText(file);
    // Reset input so the same file can be selected again
    event.target.value = '';
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "NO,ITEM,ASSEMBLY,STATUS,SHOP\n"
      + items.map(e => `${e.id},${e.item},${e.assembly},${e.status},${e.shop}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    window.open(encodedUri);
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === sortedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedItems.map(i => i.id)));
    }
  };

  // --- Logic for Advancement ---

  const handleAdvance = () => {
    // Check if any selected items are in BLASTING or SHOP_SORTING
    // These items need a Shop assignment to move to PAINTING
    const itemsNeedingShop = items.filter(item => 
      selectedIds.has(item.id) && 
      (item.status === WorkflowStatus.BLASTING || item.status === WorkflowStatus.SHOP_SORTING)
    );

    if (itemsNeedingShop.length > 0) {
      setShowShopModal(true);
      return;
    }

    // Standard Advance for other states
    executeAdvance();
  };

  const executeAdvance = (forcedShop?: ShopLocation) => {
    const updatedItems = items.map(item => {
      if (!selectedIds.has(item.id)) return item;

      // Special handling for Blasting/Sorting -> Painting transition
      if (
        (item.status === WorkflowStatus.BLASTING || item.status === WorkflowStatus.SHOP_SORTING) 
        && forcedShop
      ) {
        return {
          ...item,
          status: WorkflowStatus.PAINTING,
          shop: forcedShop,
          updatedAt: new Date().toISOString()
        };
      }

      // Standard sequence
      return {
        ...item,
        status: getNextStatus(item.status),
        updatedAt: new Date().toISOString()
      };
    });

    setItems(updatedItems);
    setHasUnsavedChanges(true); // Mark as unsaved
    setSelectedIds(new Set()); // Clear selection
    setShowShopModal(false);
  };

  const handleSetStatus = (status: WorkflowStatus, shop?: ShopLocation) => {
    const updatedItems = items.map(item => {
      if (selectedIds.has(item.id)) {
        return {
          ...item,
          status: status,
          shop: shop || item.shop,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
    setItems(updatedItems);
    setHasUnsavedChanges(true); // Mark as unsaved
    setSelectedIds(new Set());
  };

  const handleDelete = () => {
    const count = selectedIds.size;
    if (count === 0) return;

    showModal(
      'delete',
      '항목 삭제',
      `선택한 ${count}개 항목을 삭제하시겠습니까? 삭제 후 저장 버튼을 눌러야 서버에 반영됩니다.`,
      () => {
        const remainingItems = items.filter(item => !selectedIds.has(item.id));
        setItems(remainingItems);
        setHasUnsavedChanges(true); // Mark as unsaved
        setSelectedIds(new Set());
        closeModal();
      }
    );
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 px-4">
        <img 
          src="/logo.png" 
          alt="NexGen" 
          className="h-16 sm:h-20 w-auto object-contain mb-4"
        />
        <h2 className="text-lg sm:text-xl font-semibold text-slate-700">로그인이 필요합니다</h2>
        <button
          onClick={login}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors shadow-md"
        >
          Google 로그인
        </button>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <div className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border-b bg-white">
        {isAdmin ? (
          <span className="text-green-600 font-semibold">
            관리자 계정
          </span>
        ) : (
          <span className="text-gray-500">
            읽기 전용 사용자
          </span>
        )}
      </div>

      <Modal 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        onSecondary={modalConfig.onSecondary}
      />

      <ShopSelectModal 
        isOpen={showShopModal}
        onClose={() => setShowShopModal(false)}
        onConfirm={(shop) => executeAdvance(shop)}
        count={items.filter(i => selectedIds.has(i.id)).length}
      />

      <RibbonFilter 
        onSearch={setSearchTerm}
        onFilterShop={setFilterShop}
        activeFilterShop={filterShop}
        
        onFilterStatus={setFilterStatus}
        activeFilterStatus={filterStatus}
        
        onFilterItem={setFilterItemType}
        activeFilterItem={filterItemType}
        itemOptions={uniqueItemTypes}

        onReset={() => {
          setSearchTerm('');
          setFilterShop('ALL');
          setFilterStatus('ALL');
          setFilterItemType('ALL');
        }}
        onImportClick={handleImportClick}
        onExportClick={handleExport}
        
        onSave={handleSave}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        isAdmin={isAdmin}
      />
      
      {/* Hidden input for file upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
        style={{ display: 'none' }} 
      />

      <main className="flex-1 flex flex-col overflow-hidden p-2 sm:p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
        {/* View Toggle (Active vs Shipped) */}
        <div className="flex justify-between items-center mb-3 sm:mb-4 px-1">
          <DashboardStatsView stats={stats} />
          <div className="flex bg-slate-200 p-0.5 sm:p-1 rounded-lg">
            <button
              onClick={() => setShowShipped(false)}
              className={`px-2 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${!showShipped ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
            >
              진행중
            </button>
            <button
              onClick={() => setShowShipped(true)}
              className={`px-2 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${showShipped ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
            >
              출하완료
            </button>
          </div>
        </div>

        {!showShipped && <Dashboard stats={stats} />}
        
        <DataGrid 
          items={sortedItems}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          sortConfig={sortConfig}
          onSort={handleSort}
        />
      </main>

      <ActionBar 
        selectedCount={selectedIds.size}
        onAdvance={handleAdvance}
        onSetStatus={handleSetStatus}
        onClearSelection={() => setSelectedIds(new Set())}
        onDelete={handleDelete}
      />
    </div>
  );
}

// Small helper component to show stats text when Dashboard is hidden in Shipped view
const DashboardStatsView = ({ stats }: { stats: any }) => (
  <div className="text-xs sm:text-sm text-slate-500">
    전체: <span className="font-semibold text-slate-900">{stats.total}</span>
  </div>
);