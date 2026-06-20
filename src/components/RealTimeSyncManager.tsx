import { useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function RealTimeSyncManager({ userId }: { userId: string | undefined }) {
  useEffect(() => {
    if (!userId) return;

    // Periodically sync local storage states to Firebase Firestore to assure persistence and real-time cross-device updates.
    // This acts as our Offline-First sync bridging layer.
    const syncInterval = setInterval(async () => {
      try {
        // 1. Sync active ride
        const activeRideStr = localStorage.getItem("gomoto_active_ride");
        if (activeRideStr) {
          const ride = JSON.parse(activeRideStr);
          await setDoc(doc(db, 'active_rides', ride.id), ride);
        }

        // 2. Sync transactions
        const txStr = localStorage.getItem(`gomoto_transactions_${userId}`);
        if (txStr) {
          const txs = JSON.parse(txStr);
          txs.forEach(async (tx: any) => {
             await setDoc(doc(db, 'transactions', tx.id), tx);
          });
        }

        // 3. Sync ride history
        const rideStr = localStorage.getItem(`gomoto_rides_history_${userId}`);
        if (rideStr) {
          const rides = JSON.parse(rideStr);
          rides.forEach(async (r: any) => {
             await setDoc(doc(db, 'rides', r.id), r);
          });
        }

        // 4. Sync profile wallet metadata that is out of band from App.tsx profile
        const cdfStr = localStorage.getItem(`gomoto_wallet_offline_cdf_${userId}`);
        const usdStr = localStorage.getItem(`gomoto_wallet_offline_usd_${userId}`);

        if (cdfStr != null || usdStr != null) {
           await setDoc(doc(db, 'users', userId), {
             walletBalanceCDF: parseFloat(cdfStr || '0'),
             walletBalanceUSD: parseFloat(usdStr || '0')
           }, { merge: true });
        }

      } catch (error) {
        console.warn("Background Firebase sync skipped:", error);
      }
    }, 5000);

    return () => clearInterval(syncInterval);
  }, [userId]);

  return null;
}
