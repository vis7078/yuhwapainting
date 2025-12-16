import React, { useState, useEffect, useMemo, useRef } from 'react';
import { auth, googleProvider, db } from "./firebase";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
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
  key: 'status' | 'item' | 'id' | 'length' | 'weight' | 'area' | 'qty';
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
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    no: true,
    itemDesc: true,
    length: true,
    weight: true,
    detail: true,
    area: true,
    status: true,
    shop: true,
    fp: true,
    qty: true,
    updated: true
  });
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterShop, setFilterShop] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterItemType, setFilterItemType] = useState('ALL');
  const [filterDetail, setFilterDetail] = useState('ALL');
  const [filterFP, setFilterFP] = useState('ALL');
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

  // Compute unique Details (Material)
  const uniqueDetails = useMemo(() => {
    const details = new Set(items.map(i => i.material).filter(Boolean));
    return Array.from(details).sort();
  }, [items]);

  // Compute unique FP values
  const uniqueFPs = useMemo(() => {
    const fps = new Set(items.map(i => i.fp).filter(Boolean));
    return Array.from(fps).sort();
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

      // 5. Detail Filter (Material)
      if (filterDetail !== 'ALL' && item.material !== filterDetail) return false;

      // 6. FP Filter
      if (filterFP !== 'ALL' && item.fp !== filterFP) return false;

      // 7. Search Term (ID, Item, Desc)
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
  }, [items, searchTerm, filterShop, filterStatus, filterItemType, filterDetail, filterFP, showShipped]);

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
        case 'length':
          comparison = a.length - b.length;
          break;
        case 'weight':
          comparison = a.weight - b.weight;
          break;
        case 'area':
          comparison = a.area - b.area;
          break;
        case 'qty':
          comparison = a.qty - b.qty;
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

  // --- Auth Handlers ---
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const loginWithEmail = async () => {
    try {
      setAuthError('');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setAuthError('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  const signupWithEmail = async () => {
    try {
      setAuthError('');
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setAuthError('이미 사용 중인 이메일입니다.');
      } else if (error.code === 'auth/weak-password') {
        setAuthError('비밀번호는 최소 6자 이상이어야 합니다.');
      } else {
        setAuthError(error.message);
      }
    }
  };

  const resetPassword = async () => {
    try {
      setAuthError('');
      await sendPasswordResetEmail(auth, email);
      showModal('success', '이메일 전송 완료', '비밀번호 재설정 링크를 이메일로 전송했습니다.');
      setAuthMode('login');
    } catch (error: any) {
      setAuthError('이메일을 찾을 수 없습니다.');
    }
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
      <div className="h-screen flex flex-col items-center justify-center gap-4 px-4 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
          <img 
            src="/logo.png" 
            alt="NexGen" 
            className="h-12 w-auto object-contain mx-auto mb-6"
          />
          
          <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">
            {authMode === 'login' ? '로그인' : authMode === 'signup' ? '회원가입' : '비밀번호 재설정'}
          </h2>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {authError}
            </div>
          )}

          {authMode !== 'reset' ? (
            <>
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                onKeyPress={(e) => e.key === 'Enter' && (authMode === 'login' ? loginWithEmail() : signupWithEmail())}
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500"
                onKeyPress={(e) => e.key === 'Enter' && (authMode === 'login' ? loginWithEmail() : signupWithEmail())}
              />

              <button
                onClick={authMode === 'login' ? loginWithEmail : signupWithEmail}
                className="w-full px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors shadow-md mb-3"
              >
                {authMode === 'login' ? '로그인' : '회원가입'}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">또는</span>
                </div>
              </div>

              <button
                onClick={loginWithGoogle}
                className="w-full px-6 py-3 bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google로 로그인
              </button>

              <div className="mt-4 text-center text-sm">
                {authMode === 'login' ? (
                  <>
                    <button onClick={() => setAuthMode('signup')} className="text-brand-600 hover:underline">
                      계정이 없으신가요? 회원가입
                    </button>
                    <span className="mx-2 text-slate-400">|</span>
                    <button onClick={() => setAuthMode('reset')} className="text-brand-600 hover:underline">
                      비밀번호 찾기
                    </button>
                  </>
                ) : (
                  <button onClick={() => setAuthMode('login')} className="text-brand-600 hover:underline">
                    이미 계정이 있으신가요? 로그인
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500"
                onKeyPress={(e) => e.key === 'Enter' && resetPassword()}
              />
              <button
                onClick={resetPassword}
                className="w-full px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors shadow-md mb-3"
              >
                재설정 링크 전송
              </button>
              <button onClick={() => setAuthMode('login')} className="w-full text-brand-600 hover:underline text-sm">
                로그인으로 돌아가기
              </button>
            </>
          )}
        </div>
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

        onFilterDetail={setFilterDetail}
        activeFilterDetail={filterDetail}
        detailOptions={uniqueDetails}

        onFilterFP={setFilterFP}
        activeFilterFP={filterFP}
        fpOptions={uniqueFPs}

        onReset={() => {
          setSearchTerm('');
          setFilterShop('ALL');
          setFilterStatus('ALL');
          setFilterItemType('ALL');
          setFilterDetail('ALL');
          setFilterFP('ALL');
        }}
        onImportClick={handleImportClick}
        onExportClick={handleExport}
        
        onSave={handleSave}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        isAdmin={isAdmin}
        
        visibleColumns={visibleColumns}
        onColumnVisibilityChange={setVisibleColumns}
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
          <DashboardStatsView stats={stats} items={filteredItems} />
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
          visibleColumns={visibleColumns}
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
const DashboardStatsView = ({ stats, items }: { stats: any; items: ProductItem[] }) => {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const totalArea = items.reduce((sum, item) => sum + item.area, 0);
  
  return (
    <div className="text-xs sm:text-sm text-slate-500 flex items-center gap-3 flex-wrap">
      <span>
        수량: <span className="font-semibold text-slate-900">{stats.total}</span>
      </span>
      <span>
        W: <span className="font-semibold text-slate-900">{totalWeight.toFixed(1)}</span>kg
      </span>
      <span>
        A: <span className="font-semibold text-slate-900">{totalArea.toFixed(1)}</span>m²
      </span>
    </div>
  );
};