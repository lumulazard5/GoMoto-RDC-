/**
 * GoMoto RDC - IndexedDB Client-Side Offline Caching Infrastructure
 * Provides robust offline data resilience for unstable internet connections (RDC).
 */

export interface CachedWallet {
  id: string;
  walletBalanceCDF: number;
  walletBalanceUSD: number;
  updatedAt: string;
}

export interface CachedRides {
  id: string; // "history"
  rides: any[];
  updatedAt: string;
}

const DB_NAME = "GoMotoRDC_OfflineStorage";
const DB_VERSION = 1;
const STORE_WALLET = "wallet_cache";
const STORE_RIDES = "rides_cache";

/**
 * Open or initialize IndexedDB Connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB non supporté par ce navigateur."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Create wallet store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_WALLET)) {
        db.createObjectStore(STORE_WALLET, { keyPath: "id" });
      }
      
      // Create rides store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_RIDES)) {
        db.createObjectStore(STORE_RIDES, { keyPath: "id" });
      }
    };
  });
}

/**
 * Cache Wallet Balance into IndexedDB
 */
export async function cacheWalletBalance(
  cdf: number,
  usd: number,
  profileId: string
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_WALLET], "readwrite");
      const store = transaction.objectStore(STORE_WALLET);
      
      const record: CachedWallet = {
        id: `wallet_${profileId}`,
        walletBalanceCDF: cdf,
        walletBalanceUSD: usd,
        updatedAt: new Date().toISOString(),
      };
      
      const request = store.put(record);
      
      request.onsuccess = () => {
        // Double-save in localStorage for immediate sync fallback
        localStorage.setItem(`gomoto_offline_wallet_${profileId}`, JSON.stringify(record));
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("Erreur IndexedDB lors de la sauvegarde du portefeuille:", err);
    // Fallback LocalStorage
    localStorage.setItem(`gomoto_offline_wallet_${profileId}`, JSON.stringify({
      id: `wallet_${profileId}`,
      walletBalanceCDF: cdf,
      walletBalanceUSD: usd,
      updatedAt: new Date().toISOString(),
    }));
  }
}

/**
 * Fetch cached Wallet Balance from IndexedDB
 */
export async function getCachedWalletBalance(profileId: string): Promise<CachedWallet | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_WALLET], "readonly");
      const store = transaction.objectStore(STORE_WALLET);
      const request = store.get(`wallet_${profileId}`);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          // Fallback LocalStorage if indexedDb failed to find
          const local = localStorage.getItem(`gomoto_offline_wallet_${profileId}`);
          resolve(local ? JSON.parse(local) : null);
        }
      };
      request.onerror = () => {
        const local = localStorage.getItem(`gomoto_offline_wallet_${profileId}`);
        resolve(local ? JSON.parse(local) : null);
      };
    });
  } catch (err) {
    const local = localStorage.getItem(`gomoto_offline_wallet_${profileId}`);
    return local ? JSON.parse(local) : null;
  }
}

/**
 * Cache Rides History list to IndexedDB
 */
export async function cacheRidesHistory(rides: any[], profileId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_RIDES], "readwrite");
      const store = transaction.objectStore(STORE_RIDES);
      
      const record: CachedRides = {
        id: `rides_${profileId}`,
        rides,
        updatedAt: new Date().toISOString(),
      };
      
      const request = store.put(record);
      
      request.onsuccess = () => {
        localStorage.setItem(`gomoto_offline_rides_${profileId}`, JSON.stringify(record));
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("Erreur IndexedDB lors de la sauvegarde de l'historique:", err);
    localStorage.setItem(`gomoto_offline_rides_${profileId}`, JSON.stringify({
      id: `rides_${profileId}`,
      rides,
      updatedAt: new Date().toISOString(),
    }));
  }
}

/**
 * Fetch cached Rides History from IndexedDB
 */
export async function getCachedRidesHistory(profileId: string): Promise<CachedRides | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_RIDES], "readonly");
      const store = transaction.objectStore(STORE_RIDES);
      const request = store.get(`rides_${profileId}`);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          const local = localStorage.getItem(`gomoto_offline_rides_${profileId}`);
          resolve(local ? JSON.parse(local) : null);
        }
      };
      request.onerror = () => {
        const local = localStorage.getItem(`gomoto_offline_rides_${profileId}`);
        resolve(local ? JSON.parse(local) : null);
      };
    });
  } catch (err) {
    const local = localStorage.getItem(`gomoto_offline_rides_${profileId}`);
    return local ? JSON.parse(local) : null;
  }
}
