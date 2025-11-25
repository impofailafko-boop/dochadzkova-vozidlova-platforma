export type EntityType = 'attendance' | 'vehicle_log' | 'fuel_log' | 'project_selection';
export type ActionType = 'create' | 'update' | 'delete';

export interface PendingMutation {
  id: string;
  entityType: EntityType;
  action: ActionType;
  data: any;
  timestamp: string;
  synced: boolean;
  retries: number;
  userId: string;
}

const DB_NAME = 'OfflineDB';
const DB_VERSION = 2; // Increased version for schema upgrade
const STORE_NAME = 'pendingMutations';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Delete old store if it exists
      if (db.objectStoreNames.contains('pendingAttendance')) {
        db.deleteObjectStore('pendingAttendance');
      }
      
      // Create new unified store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('synced', 'synced', { unique: false });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('entityType', 'entityType', { unique: false });
        objectStore.createIndex('userId', 'userId', { unique: false });
      }
    };
  });
}

async function checkDuplicateMutation(record: PendingMutation): Promise<boolean> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    
    request.onsuccess = () => {
      const allMutations = request.result.filter((r: PendingMutation) => !r.synced);
      
      // Check for duplicates based on entity type
      const isDuplicate = allMutations.some((existing: PendingMutation) => {
        if (existing.entityType !== record.entityType || existing.userId !== record.userId) {
          return false;
        }
        
        // Attendance: Check userId + date + type (no timestamp check to prevent fast duplicates)
        if (record.entityType === 'attendance') {
          const existingDate = new Date(existing.data.timestamp).toDateString();
          const newDate = new Date(record.data.timestamp).toDateString();
          return existingDate === newDate && existing.data.type === record.data.type;
        }
        
        // Vehicle log: Check userId + vehicle_id + date + action
        if (record.entityType === 'vehicle_log') {
          const existingDate = existing.data.date;
          const newDate = record.data.date;
          return existingDate === newDate && 
                 existing.data.vehicle_id === record.data.vehicle_id &&
                 existing.action === record.action;
        }
        
        // Fuel log: Check userId + vehicle_id + date
        if (record.entityType === 'fuel_log') {
          const existingDate = existing.data.date;
          const newDate = record.data.date;
          return existingDate === newDate && 
                 existing.data.vehicle_id === record.data.vehicle_id;
        }
        
        // Project selection: Check userId + date
        if (record.entityType === 'project_selection') {
          const existingDate = new Date(existing.data.timestamp).toDateString();
          const newDate = new Date(record.data.timestamp).toDateString();
          return existingDate === newDate;
        }
        
        return false;
      });
      
      resolve(isDuplicate);
    };
    
    request.onerror = () => reject(request.error);
  });
}

export async function savePendingMutation(record: PendingMutation): Promise<boolean> {
  // Check for duplicates before saving
  const isDuplicate = await checkDuplicateMutation(record);
  
  if (isDuplicate) {
    if (import.meta.env.DEV) {
      console.warn('Duplicate mutation detected, skipping save:', record);
    }
    return false; // Return false for duplicates
  }
  
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.put(record);
    request.onsuccess = () => resolve(true); // Return true on success
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingMutations(entityType?: EntityType): Promise<PendingMutation[]> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    let request: IDBRequest;
    
    if (entityType) {
      const entityIndex = store.index('entityType');
      request = entityIndex.getAll(entityType);
    } else {
      request = store.getAll();
    }
    
    request.onsuccess = () => {
      const results = request.result.filter((r: PendingMutation) => !r.synced);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function markMutationSynced(id: string): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const record = getRequest.result;
      if (record) {
        record.synced = true;
        const putRequest = store.put(record);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function incrementRetries(id: string): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const record = getRequest.result;
      if (record) {
        record.retries = (record.retries || 0) + 1;
        const putRequest = store.put(record);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function deleteSyncedMutations(): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const index = store.index('synced');
  
  return new Promise((resolve, reject) => {
    const request = index.openCursor(IDBKeyRange.only(true));
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      } else {
        resolve();
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingCount(): Promise<number> {
  const mutations = await getPendingMutations();
  return mutations.length;
}

export async function clearPendingMutations(entityType?: EntityType): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    if (entityType) {
      // Clear only specific entity type
      const entityIndex = store.index('entityType');
      const request = entityIndex.openCursor(IDBKeyRange.only(entityType));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    } else {
      // Clear all mutations
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }
  });
}
