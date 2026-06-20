import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export function useGoMotoFirestore(userId: string | undefined, role: string | undefined) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [rides, setRides] = useState<any[]>([]);
  const [sosAlerts, setSosAlerts] = useState<any[]>([]);
  const [modRequests, setModRequests] = useState<any[]>([]);
  const [taxDocs, setTaxDocs] = useState<any[]>([]);
  const [activeRide, setActiveRide] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;

    // Load initial fallback from local storage immediately so UI is populated
    const localTx = localStorage.getItem(`gomoto_transactions_${userId}`);
    if (localTx) setTransactions(JSON.parse(localTx));

    const localRides = localStorage.getItem(`gomoto_rides_history_${userId}`);
    if (localRides) setRides(JSON.parse(localRides));

    const localActiveRide = localStorage.getItem('gomoto_active_ride');
    if (localActiveRide) setActiveRide(JSON.parse(localActiveRide));

    const localSOSStr = localStorage.getItem('gomoto_sos_alerts');
    if (localSOSStr) setSosAlerts(JSON.parse(localSOSStr));

    // Fetch transactions
    let unsubTx = () => {};
    try {
      const txQuery = query(collection(db, 'transactions'), where('userId', '==', userId));
      unsubTx = onSnapshot(txQuery, (snapshot) => {
        const txList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(txList);
        localStorage.setItem(`gomoto_transactions_${userId}`, JSON.stringify(txList));
      }, (error) => {
        console.warn("Unable to fetch transactions from firestore, using local history cache. (Unauthenticated / Sandbox Mode)", error);
      });
    } catch (e) {
      console.warn("Error setting up transaction firestore query:", e);
    }

    // Fetch rides history
    let unsubRides = () => {};
    try {
      const ridesQuery = query(collection(db, 'rides'), where('clientId', '==', userId));
      unsubRides = onSnapshot(ridesQuery, (snapshot) => {
        const ridesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRides(ridesList);
        localStorage.setItem(`gomoto_rides_history_${userId}`, JSON.stringify(ridesList));
      }, (error) => {
        console.warn("Unable to fetch rides from firestore, using local history cache. (Unauthenticated / Sandbox Mode)", error);
      });
    } catch (e) {
      console.warn("Error setting up rides firestore query:", e);
    }

    // Active ride
    let unsubActiveRide = () => {};
    try {
      const activeRideQuery = query(collection(db, 'active_rides'), where('clientId', '==', userId));
      unsubActiveRide = onSnapshot(activeRideQuery, (snapshot) => {
        if (!snapshot.empty) {
          const act = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          setActiveRide(act);
          localStorage.setItem('gomoto_active_ride', JSON.stringify(act));
        } else {
          setActiveRide(null);
          localStorage.removeItem('gomoto_active_ride');
        }
      }, (error) => {
        console.warn("Unable to fetch active ride from firestore. (Unauthenticated / Sandbox Mode)", error);
      });
    } catch (e) {
      console.warn("Error setting up active ride firestore query:", e);
    }

    // Admin stuff if admin
    let unsubAdmin = () => {};
    if (role === 'admin') {
      try {
        const sosQ = query(collection(db, 'sos_alerts'));
        unsubAdmin = onSnapshot(sosQ, (snap) => {
          const alertsList = snap.docs.map(d => ({id: d.id, ...d.data()}));
          setSosAlerts(alertsList);
          localStorage.setItem('gomoto_sos_alerts', JSON.stringify(alertsList));
        }, (error) => {
           console.warn("Unable to fetch SOS alerts from firestore. (Unauthenticated / Sandbox Mode)", error);
        });
      } catch (e) {
        console.warn("Error setting up SOS alerts firestore query:", e);
      }
    }

    return () => {
      unsubTx();
      unsubRides();
      unsubActiveRide();
      unsubAdmin();
    };
  }, [userId, role]);

  return { transactions, rides, activeRide, sosAlerts, setTransactions, setRides, setActiveRide };
}
