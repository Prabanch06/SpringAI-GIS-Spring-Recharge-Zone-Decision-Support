import { FieldObservation, SpringEntity } from '../types';

const OFFLINE_QUEUE_KEY = 'springai_offline_validations_queue';
const CACHED_SPRINGS_KEY = 'springai_offline_cached_springs';
const SIMULATED_OFFLINE_KEY = 'springai_simulated_offline';

export interface QueuedObservation {
  id: string; // Temporary local ID, e.g. OFFLINE-OBS-1728139
  springId: string;
  springName?: string;
  village?: string;
  district?: string;
  discharge: number;
  gpsAccuracyM: number;
  geologyNotes: string;
  waterCondition: string;
  interventionStatus: string;
  comments: string;
  sanitaryRisk?: 'Low' | 'Medium' | 'High' | string;
  flowVisible?: boolean;
  strikeDipMeasured?: string;
  observer: string;
  role: string;
  photosCount: number;
  createdAt: string;
  syncStatus: 'pending' | 'syncing' | 'failed' | 'synced';
  syncError?: string;
}

class OfflineSyncManager {
  private isSimulatedOffline: boolean = false;
  private listeners: Array<() => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.isSimulatedOffline = localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';

      window.addEventListener('online', () => this.handleNetworkChange());
      window.addEventListener('offline', () => this.handleNetworkChange());
    }
  }

  private handleNetworkChange() {
    this.notifyListeners();
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error('Error in offline sync listener:', e);
      }
    });
  }

  public isOnline(): boolean {
    if (typeof window === 'undefined') return true;
    if (this.isSimulatedOffline) return false;
    return navigator.onLine;
  }

  public setSimulatedOffline(offline: boolean) {
    this.isSimulatedOffline = offline;
    if (typeof window !== 'undefined') {
      localStorage.setItem(SIMULATED_OFFLINE_KEY, String(offline));
    }
    this.notifyListeners();
  }

  public getSimulatedOffline(): boolean {
    return this.isSimulatedOffline;
  }

  // Cache Springs for offline field lookup
  public cacheSprings(springs: SpringEntity[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CACHED_SPRINGS_KEY, JSON.stringify(springs));
    } catch (e) {
      console.warn('Failed to cache springs to localStorage:', e);
    }
  }

  public getCachedSprings(): SpringEntity[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(CACHED_SPRINGS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // Offline Observation Queue Management
  public getQueuedObservations(): QueuedObservation[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveObservationOffline(obs: Omit<QueuedObservation, 'id' | 'createdAt' | 'syncStatus'>): QueuedObservation {
    const queue = this.getQueuedObservations();
    const newRecord: QueuedObservation = {
      ...obs,
      id: `OFFLINE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      syncStatus: 'pending'
    };

    queue.unshift(newRecord);
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to save offline observation to storage:', e);
    }

    this.notifyListeners();
    return newRecord;
  }

  public updateQueuedObservation(id: string, updates: Partial<QueuedObservation>) {
    const queue = this.getQueuedObservations().map(item => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      return item;
    });

    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to update offline observation:', e);
    }
    this.notifyListeners();
  }

  public removeQueuedObservation(id: string) {
    const queue = this.getQueuedObservations().filter(item => item.id !== id);
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to remove offline observation:', e);
    }
    this.notifyListeners();
  }

  public clearSyncedObservations() {
    const queue = this.getQueuedObservations().filter(item => item.syncStatus !== 'synced');
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to clear synced observations:', e);
    }
    this.notifyListeners();
  }

  // Batch Synchronize Offline Queue to Central Server
  public async syncQueue(
    submitFn: (payload: any) => Promise<any>
  ): Promise<{ syncedCount: number; failedCount: number }> {
    if (!this.isOnline()) {
      return { syncedCount: 0, failedCount: 0 };
    }

    const queue = this.getQueuedObservations();
    const pendingItems = queue.filter(item => item.syncStatus === 'pending' || item.syncStatus === 'failed');

    let syncedCount = 0;
    let failedCount = 0;

    for (const item of pendingItems) {
      this.updateQueuedObservation(item.id, { syncStatus: 'syncing' });

      try {
        const res = await submitFn({
          springId: item.springId,
          discharge: item.discharge,
          gpsAccuracyM: item.gpsAccuracyM,
          geologyNotes: item.geologyNotes,
          waterCondition: item.waterCondition,
          interventionStatus: item.interventionStatus,
          sanitaryRisk: item.sanitaryRisk,
          flowVisible: item.flowVisible,
          strikeDipMeasured: item.strikeDipMeasured,
          comments: item.comments ? `${item.comments} [Synced from Offline Field Cache ${item.id}]` : `[Synced from Offline Field Cache ${item.id}]`
        });

        if (res && res.success) {
          this.updateQueuedObservation(item.id, { syncStatus: 'synced', syncError: undefined });
          syncedCount++;
        } else {
          this.updateQueuedObservation(item.id, {
            syncStatus: 'failed',
            syncError: res?.error?.message || 'Server rejected submission'
          });
          failedCount++;
        }
      } catch (err: any) {
        this.updateQueuedObservation(item.id, {
          syncStatus: 'failed',
          syncError: err?.message || 'Network connection failed'
        });
        failedCount++;
      }
    }

    return { syncedCount, failedCount };
  }
}

export const offlineSyncManager = new OfflineSyncManager();
