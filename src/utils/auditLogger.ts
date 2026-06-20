import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { AuditLog } from '../types';

/**
 * Creates and saves an audit log entry both to Firebase Firestore and standard local cache
 */
export async function logAuditEvent(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
  try {
    const logId = `log-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const fullLog: AuditLog = {
      id: logId,
      timestamp,
      action: entry.action,
      adminId: entry.adminId || 'system',
      adminEmail: entry.adminEmail || 'system@gomoto.cd',
      adminName: entry.adminName || 'System Process',
      targetId: entry.targetId || 'none',
      targetName: entry.targetName || 'none',
      details: entry.details,
      payloadBefore: entry.payloadBefore || null,
      payloadAfter: entry.payloadAfter || null,
    };

    // 1. Write to remote persistent Firestore
    await setDoc(doc(db, 'audit_logs', logId), fullLog);
    console.log(`[Audit Trail] Successfully logged action "${fullLog.action}"`);

    // 2. Also keep a local localStorage backup so we always have it sync-independent
    try {
      const stored = localStorage.getItem('gomoto_audit_logs');
      const logs: AuditLog[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem('gomoto_audit_logs', JSON.stringify([fullLog, ...logs].slice(0, 100)));
    } catch (e) {
      console.warn('[Audit Trail] Local cache update failed:', e);
    }
  } catch (error) {
    console.error('[Audit Trail] SECURE AUDIT FAILED to write to Firestore:', error);
  }
}

/**
 * Fetches the latest audit logs from Firebase Firestore
 */
export async function fetchAuditLogs(maxCount: number = 100): Promise<AuditLog[]> {
  try {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(maxCount));
    const querySnapshot = await getDocs(q);
    const logs: AuditLog[] = [];
    querySnapshot.forEach((docSnap) => {
      logs.push(docSnap.data() as AuditLog);
    });
    return logs;
  } catch (error) {
    console.error('[Audit Trail] Failed to fetch remote audit logs:', error);
    // Fallback to local storage
    try {
      const stored = localStorage.getItem('gomoto_audit_logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Subscribes to real-time audit logs from Firebase Firestore
 */
export function subscribeToAuditLogs(callback: (logs: AuditLog[]) => void, maxCount: number = 100): () => void {
  try {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(maxCount));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const logs: AuditLog[] = [];
      querySnapshot.forEach((docSnap) => {
        logs.push(docSnap.data() as AuditLog);
      });
      callback(logs);
    }, (error) => {
      console.warn('[Audit Trail] onSnapshot error, falling back:', error);
      try {
        const stored = localStorage.getItem('gomoto_audit_logs');
        callback(stored ? JSON.parse(stored) : []);
      } catch {
        callback([]);
      }
    });
    return unsubscribe;
  } catch (error) {
    console.error('[Audit Trail] Subscription error:', error);
    try {
      const stored = localStorage.getItem('gomoto_audit_logs');
      callback(stored ? JSON.parse(stored) : []);
    } catch {
      callback([]);
    }
    return () => {};
  }
}

