import { db } from '../firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { WalletTransaction, SOSAlert } from '../types';

export const saveTransaction = async (tx: WalletTransaction) => {
  try {
    // 1. Save locally immediately
    const key = `gomoto_transactions_${tx.userId}`;
    const local = localStorage.getItem(key);
    const list = local ? JSON.parse(local) : [];
    const index = list.findIndex((item: any) => item.id === tx.id);
    if (index > -1) {
      list[index] = tx;
    } else {
      list.push(tx);
    }
    localStorage.setItem(key, JSON.stringify(list));

    // 2. Push to Firestore if authenticated/non-virtual
    if (tx.userId && !tx.userId.startsWith('virtual-')) {
      await setDoc(doc(db, 'transactions', tx.id), tx);
    }
  } catch (e) {
    console.warn('Failed to sync tx with Firestore (Deferred / Local Only):', e);
  }
};

export const saveRide = async (ride: any) => {
  try {
    // 1. Save locally immediately
    const key = `gomoto_rides_history_${ride.clientId}`;
    const local = localStorage.getItem(key);
    const list = local ? JSON.parse(local) : [];
    const index = list.findIndex((item: any) => item.id === ride.id);
    if (index > -1) {
      list[index] = ride;
    } else {
      list.push(ride);
    }
    localStorage.setItem(key, JSON.stringify(list));

    // 2. Push to Firestore if authenticated/non-virtual
    if (ride.clientId && !ride.clientId.startsWith('virtual-')) {
      await setDoc(doc(db, 'rides', ride.id), ride);
    }
  } catch (e) {
    console.warn('Failed to sync ride with Firestore (Deferred / Local Only):', e);
  }
};

export const updateActiveRide = async (rideId: string, updates: any) => {
  try {
    // 1. Save locally immediately
    const localStr = localStorage.getItem('gomoto_active_ride');
    let current = localStr ? JSON.parse(localStr) : { id: rideId };
    current = { ...current, ...updates };
    localStorage.setItem('gomoto_active_ride', JSON.stringify(current));

    // 2. Push to Firestore if authenticated/non-virtual
    if (current.clientId && !current.clientId.startsWith('virtual-')) {
      await setDoc(doc(db, 'active_rides', rideId), updates, { merge: true });
    }
  } catch (e) {
    console.warn('Failed to sync active ride with Firestore (Deferred / Local Only):', e);
  }
};

export const triggerSOSFirebase = async (alert: SOSAlert) => {
  try {
    // 1. Save locally immediately
    const localStr = localStorage.getItem('gomoto_sos_alerts');
    const list = localStr ? JSON.parse(localStr) : [];
    const index = list.findIndex((item: any) => item.id === alert.id);
    if (index > -1) {
      list[index] = alert;
    } else {
      list.unshift(alert);
    }
    localStorage.setItem('gomoto_sos_alerts', JSON.stringify(list));

    // 2. Push to Firestore if authenticated/non-virtual
    if (alert.userId && !alert.userId.startsWith('virtual-')) {
      await setDoc(doc(db, 'sos_alerts', alert.id), alert);
    }
  } catch (e) {
    console.warn('Failed to sync SOS Alert with Firestore (Deferred / Local Only):', e);
  }
};

export const updateSOSAlert = async (alertId: string, updates: any) => {
  try {
    // 1. Save locally immediately
    const localStr = localStorage.getItem('gomoto_sos_alerts');
    const list = localStr ? JSON.parse(localStr) : [];
    const index = list.findIndex((item: any) => item.id === alertId);
    if (index > -1) {
      list[index] = { ...list[index], ...updates };
      localStorage.setItem('gomoto_sos_alerts', JSON.stringify(list));
    }

    // 2. Push to Firestore
    await updateDoc(doc(db, 'sos_alerts', alertId), updates);
  } catch(e) {
    console.warn('Failed to sync SOS Alert update with Firestore (Deferred / Local Only):', e);
  }
};
