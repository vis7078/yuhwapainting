import { ProductItem, WorkflowStatus, ShopLocation, DashboardStats } from '../types';
import { WORKFLOW_SEQUENCE } from '../constants';
import { db } from '../firebase';
import { collection, getDocs, setDoc, doc, onSnapshot, query, deleteDoc, writeBatch } from 'firebase/firestore';

// Firestore collection name
const COLLECTION_NAME = 'products';
const STORAGE_KEY = 'chromaflow_db_v3'; // Fallback for offline

export const getNextStatus = (current: WorkflowStatus): WorkflowStatus => {
  const currentIndex = WORKFLOW_SEQUENCE.indexOf(current);
  if (currentIndex === -1 || currentIndex === WORKFLOW_SEQUENCE.length - 1) {
    return current; // No next step or already shipped
  }
  return WORKFLOW_SEQUENCE[currentIndex + 1];
};

const cleanValue = (val: string | undefined): string => {
  if (!val) return '';
  // Remove surrounding quotes and whitespace
  return val.replace(/^["']|["']$/g, '').trim();
};

const parseNumber = (val: string | undefined): number => {
  if (!val) return 0;
  // Remove quotes, spaces, and commas (thousands separators)
  const clean = val.replace(/["'\s,]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

// Robust CSV Line Splitter that handles quoted fields containing commas
const splitCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

export const parseCSV = (csvText: string): ProductItem[] => {
  // 1. Remove Byte Order Mark (BOM) if present
  const cleanText = csvText.replace(/^\uFEFF/, '');

  // 2. Handle all common line endings
  const lines = cleanText.trim().split(/\r\n|\n|\r/);
  
  if (lines.length < 2) return []; // Need at least headers and one row

  // 3. Process lines
  return lines.slice(1).map(line => {
    // Skip empty lines
    if (!line.trim()) return null;
    
    // Robust split
    const values = splitCSVLine(line);
    
    // Ensure we have enough data (at least up to Item)
    if (values.length < 2) return null;

    // 4. Map columns based on fixed schema:
    // NO., ITEM, ASSEMBLY, DESCRIPTION, MATERIAL, LENGTH, Q'TY, WEIGHT, Area, FP
    const id = cleanValue(values[0]) || Math.random().toString(36).substr(2, 9);
    
    return {
      id: id,
      item: cleanValue(values[1]),
      assembly: cleanValue(values[2]),
      description: cleanValue(values[3]),
      material: cleanValue(values[4]),
      length: parseNumber(values[5]),
      qty: parseNumber(values[6]),
      weight: parseNumber(values[7]),
      area: parseNumber(values[8]),
      fp: cleanValue(values[9]),
      status: WorkflowStatus.UNRECEIVED,
      shop: ShopLocation.NONE,
      updatedAt: new Date().toISOString()
    };
  }).filter((item): item is ProductItem => item !== null);
};

// Load items from Firestore
export const loadItems = async (): Promise<ProductItem[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const items: ProductItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push(doc.data() as ProductItem);
    });
    
    // Also save to localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return items;
  } catch (error) {
    console.error("Error loading from Firestore:", error);
    // Fallback to localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  }
};

// Save items to Firestore (with deletion of removed items)
export const saveItems = async (items: ProductItem[]) => {
  try {
    // Get all existing documents
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const existingIds = new Set<string>();
    querySnapshot.forEach((doc) => {
      existingIds.add(doc.id);
    });
    
    // Get current item IDs
    const currentIds = new Set(items.map(item => item.id));
    
    // Use batch for better performance
    const batch = writeBatch(db);
    
    // Delete items that no longer exist
    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        batch.delete(doc(db, COLLECTION_NAME, id));
      }
    });
    
    // Add or update current items
    items.forEach((item) => {
      batch.set(doc(db, COLLECTION_NAME, item.id), item);
    });
    
    // Commit all changes
    await batch.commit();
    
    // Also save to localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Error saving to Firestore:", error);
    // Fallback to localStorage only
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
};

// Subscribe to real-time updates
export const subscribeToItems = (callback: (items: ProductItem[]) => void) => {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    return onSnapshot(q, (querySnapshot) => {
      const items: ProductItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push(doc.data() as ProductItem);
      });
      callback(items);
      // Also update localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, (error) => {
      console.error("Error in real-time listener:", error);
    });
  } catch (error) {
    console.error("Error setting up listener:", error);
    return () => {}; // Return empty unsubscribe function
  }
};

export const calculateStats = (items: ProductItem[]): DashboardStats => {
  const stats: DashboardStats = {
    received: 0,
    blasting: 0,
    painting: 0,
    packing: 0,
    waiting: 0,
    shipped: 0,
    total: items.length
  };

  items.forEach(item => {
    switch (item.status) {
      case WorkflowStatus.RECEIVED:
        stats.received++;
        break;
      case WorkflowStatus.BLASTING:
        stats.blasting++;
        break;
      case WorkflowStatus.PAINTING:
        stats.painting++;
        break;
      case WorkflowStatus.PACKING:
        stats.packing++;
        break;
      case WorkflowStatus.AWAITING_SHIPMENT:
        stats.waiting++;
        break;
      case WorkflowStatus.SHIPPED:
        stats.shipped++;
        break;
    }
  });

  return stats;
};