import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { ENV_CONFIG } from '../config/constants';
import { isValidStatusTransition } from '../domain/incidentFactory';
import {
  AiAnalysis,
  IncidentDocument,
  IncidentStatus,
  ReportDocument,
  StatusTransition,
} from '../domain/types';
import { mapError } from './errorMapper';

const LOCAL_STORAGE_INCIDENTS_KEY = 'telepulse_incidents_v1';
const LOCAL_STORAGE_REPORTS_KEY = 'telepulse_reports_v1';

export type PersistenceMode = 'firestore' | 'local_storage_fallback';

type IncidentsListener = (incidents: IncidentDocument[]) => void;

class IncidentsFirestoreService {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private persistenceMode: PersistenceMode = 'local_storage_fallback';
  private localIncidents: Map<string, IncidentDocument> = new Map();
  private localReports: Map<string, ReportDocument> = new Map();
  private listeners: Set<IncidentsListener> = new Set();
  private inFlightStatusUpdates: Set<string> = new Set();
  private simulateWriteFailure = false;

  constructor() {
    this.loadFromLocalStorage();
    this.initFirebaseIfConfigured();
  }

  private initFirebaseIfConfigured(): void {
    const hasConfig = Boolean(
      ENV_CONFIG.FIREBASE_API_KEY &&
        ENV_CONFIG.FIREBASE_PROJECT_ID &&
        ENV_CONFIG.FIREBASE_APP_ID
    );

    if (!hasConfig) {
      this.persistenceMode = 'local_storage_fallback';
      return;
    }

    try {
      const existing = getApps();
      this.app =
        existing.length > 0
          ? existing[0]
          : initializeApp({
              apiKey: ENV_CONFIG.FIREBASE_API_KEY,
              authDomain: ENV_CONFIG.FIREBASE_AUTH_DOMAIN,
              projectId: ENV_CONFIG.FIREBASE_PROJECT_ID,
              storageBucket: ENV_CONFIG.FIREBASE_STORAGE_BUCKET,
              messagingSenderId: ENV_CONFIG.FIREBASE_MESSAGING_SENDER_ID,
              appId: ENV_CONFIG.FIREBASE_APP_ID,
            });
      this.db = getFirestore(this.app);
      this.persistenceMode = 'firestore';
    } catch {
      this.persistenceMode = 'local_storage_fallback';
    }
  }

  public getPersistenceMode(): PersistenceMode {
    return this.persistenceMode;
  }

  public setSimulateWriteFailure(enabled: boolean): void {
    this.simulateWriteFailure = enabled;
  }

  public getSimulateWriteFailure(): boolean {
    return this.simulateWriteFailure;
  }

  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    try {
      const rawInc = window.localStorage.getItem(LOCAL_STORAGE_INCIDENTS_KEY);
      if (rawInc) {
        const parsed = JSON.parse(rawInc) as IncidentDocument[];
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && typeof item.id === 'string') {
              this.localIncidents.set(item.id, item);
            }
          }
        }
      }
      const rawRep = window.localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
      if (rawRep) {
        const parsedRep = JSON.parse(rawRep) as ReportDocument[];
        if (Array.isArray(parsedRep)) {
          for (const r of parsedRep) {
            if (r && typeof r.id === 'string') {
              this.localReports.set(r.id, r);
            }
          }
        }
      }
    } catch {
      // Ignore corrupt local storage
    }
  }

  private persistToLocalStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    try {
      const allInc = this.getSortedLocalIncidents();
      window.localStorage.setItem(LOCAL_STORAGE_INCIDENTS_KEY, JSON.stringify(allInc));
      const allRep = Array.from(this.localReports.values());
      window.localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(allRep));
    } catch {
      // Ignore quota errors
    }
  }

  private getSortedLocalIncidents(): IncidentDocument[] {
    return Array.from(this.localIncidents.values())
      .sort((a, b) => Date.parse(b.detectedAt) - Date.parse(a.detectedAt))
      .slice(0, 100);
  }

  private notifyLocalListeners(): void {
    const sorted = this.getSortedLocalIncidents();
    for (const listener of this.listeners) {
      listener(sorted);
    }
  }

  public async create(incident: IncidentDocument): Promise<IncidentDocument> {
    if (this.simulateWriteFailure) {
      throw mapError(
        new Error('firestore_write: Simulated write failure is active.'),
        'incidentsService.create',
        incident.id
      );
    }

    if (this.db && this.persistenceMode === 'firestore') {
      try {
        const ref = doc(
          this.db,
          'orgs',
          ENV_CONFIG.DEMO_ORG_ID,
          'incidents',
          incident.id
        );
        await setDoc(ref, incident);
      } catch (err) {
        throw mapError(
          new Error(`firestore_write: ${(err as Error).message}`),
          'incidentsService.create',
          incident.id
        );
      }
    }

    // Always mirror in local store so UI and refresh persistence are instant & reliable
    this.localIncidents.set(incident.id, incident);
    this.persistToLocalStorage();
    this.notifyLocalListeners();
    return incident;
  }

  public async list(
    sessionId?: string,
    showAllSessions: boolean = false
  ): Promise<IncidentDocument[]> {
    if (this.db && this.persistenceMode === 'firestore') {
      try {
        const colRef = collection(
          this.db,
          'orgs',
          ENV_CONFIG.DEMO_ORG_ID,
          'incidents'
        );
        const q = query(colRef, orderBy('detectedAt', 'desc'), limit(100));
        const snap = await getDocs(q);
        const docs: IncidentDocument[] = [];
        snap.forEach((d) => {
          const data = d.data() as IncidentDocument;
          docs.push(data);
          this.localIncidents.set(data.id, data);
        });
        this.persistToLocalStorage();
      } catch (err) {
        throw mapError(
          new Error(`firestore_read: ${(err as Error).message}`),
          'incidentsService.list'
        );
      }
    }

    const all = this.getSortedLocalIncidents();
    if (!showAllSessions && sessionId) {
      return all.filter((inc) => inc.sessionId === sessionId);
    }
    return all;
  }

  public getIncidentsSync(): IncidentDocument[] {
    return this.getSortedLocalIncidents();
  }

  public async getAll(): Promise<IncidentDocument[]> {
    return this.list();
  }

  public async getById(incidentId: string): Promise<IncidentDocument | null> {
    const existing = this.localIncidents.get(incidentId);
    if (existing) return existing;
    const found = Array.from(this.localIncidents.values()).find(
      (i) => i.id === incidentId || i.displayId === incidentId
    );
    return found || null;
  }

  public subscribe(listener: IncidentsListener): () => void {
    this.listeners.add(listener);
    listener(this.getSortedLocalIncidents());

    let unsubFirestore: (() => void) | null = null;
    if (this.db && this.persistenceMode === 'firestore') {
      try {
        const colRef = collection(
          this.db,
          'orgs',
          ENV_CONFIG.DEMO_ORG_ID,
          'incidents'
        );
        const q = query(colRef, orderBy('detectedAt', 'desc'), limit(100));
        unsubFirestore = onSnapshot(
          q,
          (snap) => {
            snap.forEach((d) => {
              const data = d.data() as IncidentDocument;
              this.localIncidents.set(data.id, data);
            });
            this.persistToLocalStorage();
            this.notifyLocalListeners();
          },
          () => {
            // Keep serving from local mirror on snapshot error
          }
        );
      } catch {
        // Fallback to local listener
      }
    }

    return () => {
      this.listeners.delete(listener);
      if (unsubFirestore) {
        unsubFirestore();
      }
    };
  }

  public async updateStatus(
    incidentId: string,
    nextStatus: IncidentStatus
  ): Promise<IncidentDocument> {
    if (this.inFlightStatusUpdates.has(incidentId)) {
      throw mapError(
        new Error('validation: Status update already in progress for this incident.'),
        'incidentsService.updateStatus',
        incidentId
      );
    }

    const existing = this.localIncidents.get(incidentId);
    if (!existing) {
      throw mapError(
        new Error('validation: Incident not found.'),
        'incidentsService.updateStatus',
        incidentId
      );
    }

    if (!isValidStatusTransition(existing.status, nextStatus)) {
      throw mapError(
        new Error(
          `validation: Invalid status transition from ${existing.status} to ${nextStatus}. Transitions are forward-only.`
        ),
        'incidentsService.updateStatus',
        incidentId
      );
    }

    this.inFlightStatusUpdates.add(incidentId);

    try {
      if (this.simulateWriteFailure) {
        throw mapError(
          new Error('firestore_write: Simulated write failure is active.'),
          'incidentsService.updateStatus',
          incidentId
        );
      }

      const nowIso = new Date().toISOString();
      const transition: StatusTransition = {
        from: existing.status,
        to: nextStatus,
        at: nowIso,
      };
      const updatedHistory = [...existing.statusHistory, transition];
      const updatedDoc: IncidentDocument = {
        ...existing,
        status: nextStatus,
        statusHistory: updatedHistory,
        updatedAt: nowIso,
      };

      if (this.db && this.persistenceMode === 'firestore') {
        try {
          const ref = doc(
            this.db,
            'orgs',
            ENV_CONFIG.DEMO_ORG_ID,
            'incidents',
            incidentId
          );
          await updateDoc(ref, {
            status: nextStatus,
            statusHistory: updatedHistory,
            updatedAt: nowIso,
          });
        } catch (err) {
          throw mapError(
            new Error(`firestore_write: ${(err as Error).message}`),
            'incidentsService.updateStatus',
            incidentId
          );
        }
      }

      // Update local state ONLY after confirmed write succeeds (OF-02)
      this.localIncidents.set(incidentId, updatedDoc);
      this.persistToLocalStorage();
      this.notifyLocalListeners();
      return updatedDoc;
    } finally {
      this.inFlightStatusUpdates.delete(incidentId);
    }
  }

  public async saveAnalysis(
    incidentId: string,
    analysis: AiAnalysis
  ): Promise<IncidentDocument> {
    const existing = this.localIncidents.get(incidentId);
    if (!existing) {
      throw mapError(
        new Error('validation: Incident not found.'),
        'incidentsService.saveAnalysis',
        incidentId
      );
    }

    if (this.simulateWriteFailure) {
      throw mapError(
        new Error('firestore_write: Simulated write failure is active.'),
        'incidentsService.saveAnalysis',
        incidentId
      );
    }

    const nowIso = new Date().toISOString();
    const updatedDoc: IncidentDocument = {
      ...existing,
      aiAnalysis: analysis,
      updatedAt: nowIso,
    };

    if (this.db && this.persistenceMode === 'firestore') {
      try {
        const ref = doc(
          this.db,
          'orgs',
          ENV_CONFIG.DEMO_ORG_ID,
          'incidents',
          incidentId
        );
        await updateDoc(ref, {
          aiAnalysis: analysis,
          updatedAt: nowIso,
        });
      } catch (err) {
        throw mapError(
          new Error(`firestore_write: ${(err as Error).message}`),
          'incidentsService.saveAnalysis',
          incidentId
        );
      }
    }

    this.localIncidents.set(incidentId, updatedDoc);
    this.persistToLocalStorage();
    this.notifyLocalListeners();
    return updatedDoc;
  }

  public async createReport(report: ReportDocument): Promise<ReportDocument> {
    if (this.simulateWriteFailure) {
      throw mapError(
        new Error('firestore_write: Simulated write failure is active.'),
        'incidentsService.createReport',
        report.id
      );
    }

    if (this.db && this.persistenceMode === 'firestore') {
      try {
        const ref = doc(
          this.db,
          'orgs',
          ENV_CONFIG.DEMO_ORG_ID,
          'reports',
          report.id
        );
        await setDoc(ref, report);
      } catch (err) {
        throw mapError(
          new Error(`firestore_write: ${(err as Error).message}`),
          'incidentsService.createReport',
          report.id
        );
      }
    }

    this.localReports.set(report.id, report);
    this.persistToLocalStorage();
    return report;
  }

  public getReports(sessionId?: string): ReportDocument[] {
    const all = Array.from(this.localReports.values()).sort(
      (a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt)
    );
    if (sessionId) {
      return all.filter((r) => r.sessionId === sessionId);
    }
    return all;
  }
}

export const incidentsService = new IncidentsFirestoreService();

