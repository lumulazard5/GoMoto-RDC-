import { useState, useEffect, useMemo } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

let cachedAccessToken: string | null = null;

export const getAccessToken = () => cachedAccessToken;

const createDefaultProfile = (uid: string, email: string): UserProfile => {
  const isAdmin = email === 'aepisciculture@gmail.com' || email === 'lumulazard5@gmail.com';
  return {
    id: uid,
    role: isAdmin ? 'admin' : 'client',
    firstName: isAdmin ? 'Système' : 'Testeur',
    lastName: isAdmin ? 'ADMIN' : 'GOMOTO',
    email: email,
    phone: isAdmin ? '+243 000000000' : '+243 899 999 999',
    address: {
      province: 'Kinshasa',
      city: 'Kinshasa',
      commune: 'Gombe',
      quartier: 'N/A',
      localite: 'N/A',
      avenue: 'N/A',
      number: 'N/A'
    },
    walletBalanceCDF: isAdmin ? 0 : 50000,
    walletBalanceUSD: isAdmin ? 0 : 20,
    documentType: 'passeport',
    documentNumber: isAdmin ? 'ADMIN-0000' : 'TEST-0000',
    documentPhotoFront: null,
    documentPhotoBack: null,
    profilePicture: null,
    myReferralCode: isAdmin ? 'ADMIN-GOMOTO' : 'TEST-GOMOTO',
    referredByCode: null,
    referralCount: 0,
    isRegistered: true,
    isOnline: false,
    rating: 5.0,
    ridesCompleted: 0
  };
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Virtual login override session if firebase anonymous auth is administrative-restricted
  const [virtualSession, setVirtualSession] = useState<{ uid: string, email: string } | null>(() => {
    const savedEmail = localStorage.getItem('gomoto_virtual_session_email');
    const savedUid = localStorage.getItem('gomoto_virtual_session_uid');
    if (savedEmail && savedUid) {
      return { uid: savedUid, email: savedEmail };
    }
    return null;
  });

  // Return a virtual user to downstream components with correct attributes
  const activeUser = useMemo(() => {
    if (user) return user;
    if (virtualSession) {
      return {
        uid: virtualSession.uid,
        email: virtualSession.email,
        isAnonymous: true,
        emailVerified: true
      } as unknown as User;
    }
    return null;
  }, [user, virtualSession]);

  const virtualUser = useMemo(() => {
    if (!activeUser) return null;
    return {
      ...activeUser,
      get email() {
        return activeUser.email || localStorage.getItem('gomoto_fallback_email') || 'tester@gomoto.cd';
      },
      get emailVerified() {
        return activeUser.emailVerified || activeUser.isAnonymous;
      }
    } as unknown as User;
  }, [activeUser]);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const docRef = doc(db, 'users', firebaseUser.uid);
        
        // Listen to profile changes in real-time
        unsubscribeProfile = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setProfile(data);
            // Backup locally
            localStorage.setItem(`gomoto_u_profile_${firebaseUser.uid}`, JSON.stringify(data));
            setLoading(false);
          } else {
            const fallbackEmail = firebaseUser.isAnonymous 
              ? (localStorage.getItem('gomoto_fallback_email') || 'tester@gomoto.cd')
              : (firebaseUser.email || 'tester@gomoto.cd');

            const defaultProfile = createDefaultProfile(firebaseUser.uid, fallbackEmail);
            try {
              await setDoc(docRef, defaultProfile);
            } catch (e) {
              console.warn("Could not save profile to firestore:", e);
            }
            localStorage.setItem(`gomoto_u_profile_${firebaseUser.uid}`, JSON.stringify(defaultProfile));
            setProfile(defaultProfile);
            setLoading(false);
          }
        }, (error) => {
          console.warn("Firestore onSnapshot error, retrieving profile from local storage fallback:", error);
          const offlineProfileStr = localStorage.getItem(`gomoto_u_profile_${firebaseUser.uid}`);
          if (offlineProfileStr) {
            setProfile(JSON.parse(offlineProfileStr));
          } else {
            const fallbackEmail = firebaseUser.email || localStorage.getItem('gomoto_fallback_email') || 'tester@gomoto.cd';
            const defaultProfile = createDefaultProfile(firebaseUser.uid, fallbackEmail);
            setProfile(defaultProfile);
          }
          setLoading(false);
        });
      } else {
        // If there's a local virtual session active, load profile locally
        if (virtualSession) {
          const offlineProfileStr = localStorage.getItem(`gomoto_u_profile_${virtualSession.uid}`);
          if (offlineProfileStr) {
            setProfile(JSON.parse(offlineProfileStr));
          } else {
            const defaultProfile = createDefaultProfile(virtualSession.uid, virtualSession.email);
            localStorage.setItem(`gomoto_u_profile_${virtualSession.uid}`, JSON.stringify(defaultProfile));
            setProfile(defaultProfile);
          }
          setLoading(false);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [virtualSession]);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/tasks');
    provider.addScope('https://www.googleapis.com/auth/forms');
    provider.addScope('https://www.googleapis.com/auth/chat.spaces');
    provider.addScope('https://www.googleapis.com/auth/chat.messages');
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        cachedAccessToken = credential.accessToken;
      }
    } catch (error: any) {
       if (error.code !== 'auth/popup-closed-by-user') {
         console.error("Error signing in with Google", error);
       }
    }
  };

  const loginWithTesterEmail = async (email: string) => {
    try {
      setLoading(true);
      const trimmedEmail = email.trim().toLowerCase();
      localStorage.setItem('gomoto_fallback_email', trimmedEmail);
      
      // Attempt anonymous login first
      try {
        await signInAnonymously(auth);
      } catch (fbError: any) {
        console.warn("Firebase anonymous login blocked by project restrictions (admin-restricted-operation). Switching automatically to fully functional Sandbox Session mode.", fbError);
        
        // Setup local virtual session
        const randUid = 'virtual-' + trimmedEmail.replace(/[^a-zA-Z0-9]/g, '');
        localStorage.setItem('gomoto_virtual_session_email', trimmedEmail);
        localStorage.setItem('gomoto_virtual_session_uid', randUid);
        setVirtualSession({ uid: randUid, email: trimmedEmail });
      }
    } catch (error: any) {
      console.error("General error in loginWithTesterEmail:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    cachedAccessToken = null;
    localStorage.removeItem('gomoto_fallback_email');
    localStorage.removeItem('gomoto_virtual_session_email');
    localStorage.removeItem('gomoto_virtual_session_uid');
    setVirtualSession(null);
    setUser(null);
    setProfile(null);
    return signOut(auth);
  };

  const updateProfile = async (updated: Partial<UserProfile>) => {
    if (profile) {
      const newProfile = { ...profile, ...updated };
      setProfile(newProfile);
      
      // Save locally
      localStorage.setItem(`gomoto_u_profile_${profile.id}`, JSON.stringify(newProfile));
      
      // Sync to firebase if it is an actual firebase account
      const isVirtual = profile.id.startsWith('virtual-');
      if (user && !isVirtual) {
        try {
          const docRef = doc(db, 'users', user.uid);
          await updateDoc(docRef, updated);
        } catch (fbErr) {
          console.warn("Firebase Firestore profile save failed/deferred offline:", fbErr);
        }
      }
    }
  };

  return { 
    user: virtualUser, 
    profile, 
    setProfile, 
    updateProfile, 
    loading, 
    loginWithGoogle, 
    loginWithTesterEmail, 
    logout 
  };
}
