export type EntityType = 'attendance' | 'vehicle_log' | 'fuel_log';
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

export async function savePendingMutation(record: PendingMutation): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.put(record);
    request.onsuccess = () => resolve();
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
