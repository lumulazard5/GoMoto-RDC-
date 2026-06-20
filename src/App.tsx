/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserProfile, AdminModificationRequest, DRCAddress, WalletTransaction, SubmittedTaxDocument, SOSAlert } from "./types";
import { AppLanguage, translations } from "./lib/translations";
import RegistrationFlow from "./components/RegistrationFlow";
import ClientDashboard from "./components/ClientDashboard";
import DriverDashboard from "./components/DriverDashboard";
import OwnerDashboard from "./components/OwnerDashboard";
import AdminPanel from "./components/AdminPanel";
import LegalCenter from "./components/LegalCenter";
import MobileAppDownload from "./components/MobileAppDownload";
import VocalAssistant from "./components/VocalAssistant";
import TasksManager from "./components/TasksManager";
import FormsManager from "./components/FormsManager";
import ChatWorkspaceManager from "./components/ChatWorkspaceManager";
import MeetManager from "./components/MeetManager";
import OnboardingModal from "./components/OnboardingModal";
import BatteryStatus from "./components/BatteryStatus";
import { T, AutoTranslateContainer } from "./components/Translate";
import { 
  ShieldAlert, 
  User, 
  Building, 
  Bike, 
  ShieldCheck, 
  HelpCircle,
  Compass,
  AlertTriangle,
  Info,
  CheckSquare,
  FileText,
  MessageSquare,
  Video
} from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { db } from "./firebase";
import { doc, getDoc, setDoc, onSnapshot, collection, updateDoc, setDoc as fSetDoc } from "firebase/firestore";
import { logAuditEvent } from "./utils/auditLogger";
import RealTimeSyncManager from "./components/RealTimeSyncManager";

export default function App() {
  const { user, profile: currentUserProfile, setProfile: setCurrentUserProfile, loading, loginWithGoogle, loginWithTesterEmail, logout } = useAuth();
  const [modRequests, setModRequests] = useState<AdminModificationRequest[]>([]);
  const [showLegalCenter, setShowLegalCenter] = useState(false);
  const [showTasksManager, setShowTasksManager] = useState(false);
  const [showFormsManager, setShowFormsManager] = useState(false);
  const [showChatWorkspace, setShowChatWorkspace] = useState(false);
  const [showMeetManager, setShowMeetManager] = useState(false);
  const [submittedTaxDocs, setSubmittedTaxDocs] = useState<SubmittedTaxDocument[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [showDevTools, setShowDevTools] = useState(false);
  const [easterEggCount, setEasterEggCount] = useState(0);
  
  const [language, setLanguage] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem("gomoto_lang");
    return (saved as AppLanguage) || "fr";
  });

  const [isNetworkOnline, setIsNetworkOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsNetworkOnline(true);
    const handleOffline = () => setIsNetworkOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleLanguageChange = (lang: AppLanguage) => {
    setLanguage(lang);
    localStorage.setItem("gomoto_lang", lang);
  };

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user) {
      const shown = localStorage.getItem(`gomoto_onboarding_shown_${user.uid}`);
      if (shown !== "true") {
        setShowOnboarding(true);
      }
    } else {
      setShowOnboarding(false);
    }
  }, [user]);
  
  useEffect(() => {
    // Load from local storage or fall back to mock registers for legacy data
    const savedRequests = localStorage.getItem("gomoto_mod_requests");
    const savedTaxDocs = localStorage.getItem("gomoto_tax_docs");
    const savedUsers = localStorage.getItem("gomoto_users");

    if (savedRequests) {
      setModRequests(JSON.parse(savedRequests));
    }

    if (savedTaxDocs) {
      setSubmittedTaxDocs(JSON.parse(savedTaxDocs));
    }

    if (savedUsers) {
      setRegisteredUsers(JSON.parse(savedUsers));
    } else {
      const defaultUsers: UserProfile[] = [
        {
          id: "usr-driver-777",
          firstName: "Jean",
          lastName: "Kabila",
          phone: "+243 812 345 678",
          email: "jean.kabila@gomoto-driver.cd",
          role: "driver",
          isRegistered: true,
          registrationDate: "01/05/2026",
          address: { province: "Kinshasa", city: "Kinshasa", commune: "Gombe", quartier: "Gombe", localite: "Kinshasa", avenue: "Boulevard du 30 Juin", number: "15" },
          walletBalanceCDF: 450000,
          walletBalanceUSD: 150,
          isOnline: true,
          rating: 4.8,
          ridesCompleted: 120,
          documentStatus: "approved"
        },
        {
          id: "usr-owner-441",
          firstName: "Marcel",
          lastName: "Mpemba",
          phone: "+243 899 876 543",
          email: "marcel@gomoto-owner.cd",
          role: "owner",
          isRegistered: true,
          registrationDate: "10/05/2026",
          address: { province: "Kinshasa", city: "Kinshasa", commune: "Ngaliema", quartier: "Ngaliema", localite: "Kinshasa", avenue: "Avenue Kasa-Vubu", number: "30" },
          walletBalanceCDF: 1500000,
          walletBalanceUSD: 500,
          isOnline: false,
          rating: 4.9,
          ridesCompleted: 450,
          documentStatus: "approved"
        },
        {
          id: "usr-client-123",
          firstName: "Sarah",
          lastName: "Mbuyi",
          phone: "+243 999 111 222",
          email: "sarah.mbuyi@gmail.com",
          role: "client",
          isRegistered: true,
          registrationDate: "15/05/2026",
          address: { province: "Kinshasa", city: "Kinshasa", commune: "Limete", quartier: "Limete", localite: "Kinshasa", avenue: "Avenue Lumumba", number: "45" },
          walletBalanceCDF: 25000,
          walletBalanceUSD: 10,
          isOnline: false,
          rating: 4.5,
          ridesCompleted: 15,
          documentStatus: "approved"
        }
      ];
      localStorage.setItem("gomoto_users", JSON.stringify(defaultUsers));
      setRegisteredUsers(defaultUsers);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setSosAlerts([]);
      return;
    }

    const unsubscribeSOS = onSnapshot(collection(db, 'sos_alerts'), (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SOSAlert));
      // Sort by timestamp descending
      alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setSosAlerts(alerts);
    }, (error) => {
      console.error("Error fetching SOS alerts", error);
    });

    return () => unsubscribeSOS();
  }, [user]);

  const handleTriggerSOS = async (alert: SOSAlert) => {
    try {
      await fSetDoc(doc(db, "sos_alerts", alert.id), alert);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveSOSAlert = async (id: string, notes: string) => {
    try {
      await updateDoc(doc(db, "sos_alerts", id), { status: "resolved", resolutionNotes: notes });
      await logAuditEvent({
        action: "RESOLVE_SOS_ALERT",
        adminId: currentUserProfile?.id || "system",
        adminEmail: currentUserProfile?.email || "admin@gomoto.cd",
        adminName: currentUserProfile ? `${currentUserProfile.firstName} ${currentUserProfile.lastName}` : "Super Admin RDC",
        targetId: id,
        targetName: "SOS Alert Room",
        details: `Résolution officielle de l'alerte d'urgence SOS #${id}. Notes de résolution : ${notes}`,
      });
    } catch(e) {
      console.error(e);
    }
  };

  const handleCompleteRegistration = async (profile: UserProfile) => {
    if (!user) return;
    const finalProfile = { ...profile, id: user.uid, email: user.email || profile.email };
    await setDoc(doc(db, "users", user.uid), finalProfile);
    setCurrentUserProfile(finalProfile);
  };

  const handleUpdateUserProfile = async (updatedProfile: UserProfile) => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), updatedProfile);
    setCurrentUserProfile(updatedProfile);
  };

  const handleSubmitModRequest = (req: AdminModificationRequest) => {
    const updated = [...modRequests, req];
    setModRequests(updated);
    localStorage.setItem("gomoto_mod_requests", JSON.stringify(updated));
  };

  // Administrative check / action callback
  const handleReviewRequest = async (requestId: string, status: "approved" | "rejected", notes?: string) => {
    // Legacy offline update logic removed for brevity
    alert(`Dossier #${requestId} : fonctionnalité d'administration locale hors ligne.`);
    await logAuditEvent({
      action: "REVIEW_MODIFICATION_REQUEST",
      adminId: currentUserProfile?.id || "system",
      adminEmail: currentUserProfile?.email || "admin@gomoto.cd",
      adminName: currentUserProfile ? `${currentUserProfile.firstName} ${currentUserProfile.lastName}` : "Super Admin RDC",
      targetId: requestId,
      targetName: `Request ID: ${requestId}`,
      details: `Revue de la demande de modification #${requestId}. Résultat : ${status.toUpperCase()}. Notes : ${notes || "Aucune"}`
    });
  };

  const handleUpdateUserStatus = async (userId: string, status: "pending" | "approved" | "rejected") => {
     alert(`Statut des documents mis à jour : ${status.toUpperCase()} pour l'utilisateur.`);
     await logAuditEvent({
       action: "UPDATE_USER_REGISTRATION_STATUS",
       adminId: currentUserProfile?.id || "system",
       adminEmail: currentUserProfile?.email || "admin@gomoto.cd",
       adminName: currentUserProfile ? `${currentUserProfile.firstName} ${currentUserProfile.lastName}` : "Super Admin RDC",
       targetId: userId,
       targetName: `User ID: ${userId}`,
       details: `Mise à jour du statut d'enrôlement et de validation des documents de l'utilisateur ${userId}. Statut : ${status.toUpperCase()}.`
     });
  };

  const handleReviewTaxDoc = async (docId: string, status: "approved" | "rejected", notes?: string) => {
    const updated = submittedTaxDocs.map(doc => {
      if (doc.id === docId) {
        return { ...doc, status, adminNotes: notes };
      }
      return doc;
    });
    setSubmittedTaxDocs(updated);
    localStorage.setItem("gomoto_tax_docs", JSON.stringify(updated));
    alert(`Document fiscal #${docId} révisé par l'administration avec le statut : ${status === 'approved' ? 'APPROUVÉ' : 'REJETÉ'}.`);
    
    const targetDoc = submittedTaxDocs.find(d => d.id === docId);
    await logAuditEvent({
      action: "REVIEW_TAX_DOCUMENT",
      adminId: currentUserProfile?.id || "system",
      adminEmail: currentUserProfile?.email || "admin@gomoto.cd",
      adminName: currentUserProfile ? `${currentUserProfile.firstName} ${currentUserProfile.lastName}` : "Super Admin RDC",
      targetId: docId,
      targetName: targetDoc?.userName || `User ID: ${targetDoc?.userId}`,
      details: `Revue de la déclaration fiscale #${docId} (${targetDoc?.docType === "daily_revenue" ? "Revenus Journaliers" : "Déclaration Annuelle"}). Statut final : ${status.toUpperCase()}. Notes : ${notes || "Aucune"}`
    });
  };

  const handleSubmitTaxDoc = (doc: SubmittedTaxDocument) => {
    const updated = [doc, ...submittedTaxDocs];
    setSubmittedTaxDocs(updated);
    localStorage.setItem("gomoto_tax_docs", JSON.stringify(updated));
  };

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">Chargement...</div>
  }

  return (
    <div id="application-layout-root" className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans antialiased pb-12 selection:bg-blue-500 selection:text-white">
      {currentUserProfile && <RealTimeSyncManager userId={user?.uid} />}
      
      {/* HEADER BAR */}
      <div className="bg-white border-b border-slate-200 text-xs py-2.5 px-4 shadow-sm sticky top-0 z-40 backdrop-blur-md bg-opacity-95 text-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-slate-800 tracking-tight text-sm">GoMoto RDC</span>
            
            {/* Live Network Status Indicator using navigator.onLine API */}
            <div 
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black border transition-all ${
                isNetworkOnline 
                  ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-750" 
                  : "bg-rose-500/10 border-rose-500/35 text-rose-750 animate-pulse"
              }`}
              title={isNetworkOnline ? "L'application fonctionne en ligne" : "L meun l'application fonctionne en mode hors ligne"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isNetworkOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              <span className="uppercase tracking-wider">
                {isNetworkOnline ? (
                  <T lang={language}>EN LIGNE</T>
                ) : (
                  <T lang={language}>HORS LIGNE</T>
                )}
              </span>
            </div>

            {/* Live Battery Manager Status bar indicator using navigator.getBattery API */}
            <BatteryStatus />

            {user && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded-full border border-slate-200">
                  <span>Connecté: <b className="text-[#1E293B]">{user.email}</b></span>
                </span>
                
                {currentUserProfile && (
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-250/60 shadow-sm">
                    <button
                      type="button"
                      onClick={async () => {
                        const updatedProfile = { ...currentUserProfile, role: "client" };
                        setCurrentUserProfile(updatedProfile);
                        await setDoc(doc(db, "users", user.uid), { role: "client" }, { merge: true });
                      }}
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                        currentUserProfile.role === "client"
                          ? "bg-blue-600 text-white shadow-sm font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                      title="Activer l'Application Client Citoyen Passager"
                    >
                      <span>🎒</span>
                      <span>App Client</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const updatedProfile = { ...currentUserProfile, role: "driver" };
                        setCurrentUserProfile(updatedProfile);
                        await setDoc(doc(db, "users", user.uid), { role: "driver" }, { merge: true });
                      }}
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                        currentUserProfile.role === "driver"
                          ? "bg-amber-500 text-slate-950 shadow-sm font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                      title="Activer l'Application Drive Motards"
                    >
                      <span>🏍️</span>
                      <span>Drive Motards</span>
                    </button>

                    {/* Elite administration options */}
                    {(currentUserProfile.role === "admin" || currentUserProfile.role === "owner" || user.email === "aepisciculture@gmail.com" || user.email === "lumulazard5@gmail.com") && (
                      <select
                        value={currentUserProfile.role}
                        onChange={async (e) => {
                          const newRole = e.target.value as any;
                          const updatedProfile = { ...currentUserProfile, role: newRole };
                          setCurrentUserProfile(updatedProfile);
                          await setDoc(doc(db, "users", user.uid), { role: newRole }, { merge: true });
                        }}
                        className="bg-slate-200 text-slate-700 font-extrabold px-2 py-1 text-[8px] rounded-full uppercase tracking-wider outline-none cursor-pointer border-none font-sans ml-1 mr-1"
                        title="Configuration administrative système"
                      >
                        <option value="admin">🔧 SYSTEME ADMIN</option>
                        <option value="owner">🏢 PROPRIÉTAIRE FLOTTE</option>
                        <option value="client">🎒 ESPACE CLIENT</option>
                        <option value="driver">🏍️ DRIVER MOTARD</option>
                      </select>
                    )}
                  </div>
                )}
              </div>
            )}
            <span className="text-[10px] text-slate-655 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 flex items-center gap-1 font-bold">
              <span>🌐</span>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as AppLanguage)}
                className="bg-transparent border-none font-bold text-[9.5px] font-sans outline-none cursor-pointer text-slate-800 pr-1"
              >
                <option value="fr">FR — Français</option>
                <option value="en">EN — English</option>
                <option value="sw">SW — Kiswahili</option>
                <option value="ln">LN — Lingala</option>
                <option value="ts">TS — Tshiluba</option>
                <option value="kk">KK — Kikongo</option>
              </select>
            </span>

            <VocalAssistant currentLang={language} onLanguageChange={handleLanguageChange} />

            <button
              type="button"
              onClick={() => setShowLegalCenter(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-lg border text-[9.5px] font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                showLegalCenter 
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                  : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shadow-xs"
              }`}
            >
              <span>⚖️</span>
              <span>
                {showLegalCenter ? (
                  <T lang={language}>Masquer CGU</T>
                ) : (
                  <T lang={language}>Centre Légal & CGU</T>
                )}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {!user ? (
              <button
                type="button"
                onClick={loginWithGoogle}
                className="px-3 py-1.5 rounded text-xs font-black uppercase transition-all bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              >
                <T lang={language}>Se connecter avec Google</T>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowTasksManager(true)}
                  className="px-3 py-1.5 rounded text-xs font-black uppercase transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer flex items-center gap-1 border border-emerald-200"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <T lang={language}>Mes Tâches</T>
                </button>
                <button
                  type="button"
                  onClick={() => setShowFormsManager(true)}
                  className="px-3 py-1.5 rounded text-xs font-black uppercase transition-all bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer flex items-center gap-1 border border-purple-200"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Google Forms
                </button>
                <button
                  type="button"
                  onClick={() => setShowChatWorkspace(true)}
                  className="px-3 py-1.5 rounded text-xs font-black uppercase transition-all bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer flex items-center gap-1 border border-amber-200"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600 fill-amber-500/10" />
                  Google Chat
                </button>
                <button
                  type="button"
                  onClick={() => setShowMeetManager(true)}
                  className="px-3 py-1.5 rounded text-xs font-black uppercase transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer flex items-center gap-1 border border-emerald-200"
                >
                  <Video className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500/10" />
                  Google Meet
                </button>
                <button
                  type="button"
                  onClick={() => setShowOnboarding(true)}
                  className="px-3 py-1.5 rounded text-xs font-black uppercase transition-all bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer flex items-center gap-1 border border-blue-200"
                >
                  <Compass className="w-3.5 h-3.5 text-blue-600 animate-pulse animate-duration-1000" />
                  <T lang={language}>Tutoriel</T>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-1.5 rounded text-xs font-black uppercase transition-all bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  <T lang={language}>Fermer la session</T>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showTasksManager && (
        <TasksManager onClose={() => setShowTasksManager(false)} />
      )}

      {showFormsManager && (
        <FormsManager onClose={() => setShowFormsManager(false)} />
      )}

      {showChatWorkspace && (
        <ChatWorkspaceManager onClose={() => setShowChatWorkspace(false)} />
      )}

      {showMeetManager && (
        <MeetManager onClose={() => setShowMeetManager(false)} lang={language} />
      )}

      {showOnboarding && user && (
        <OnboardingModal 
          userId={user.uid} 
          lang={language} 
          onClose={() => setShowOnboarding(false)} 
        />
      )}

      {/* Main application body wrapping */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <AutoTranslateContainer lang={language}>

          {/* COMPOSANT CENTRE LEGAL CLARTE */}
          {showLegalCenter && (
            <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
              <LegalCenter 
                currentRole={currentUserProfile?.role || "client"} 
                onClose={() => setShowLegalCenter(false)} 
              />
            </div>
          )}
          
          {/* VIEW 1: REGISTRATION AND CONTRACT READ CHECK (GUEST STATE) */}
          {!currentUserProfile && (
            <div className="space-y-10">
              <div className="space-y-4">
                <div className="text-center max-w-xl mx-auto mb-10 mt-4 space-y-3">
                  <h1 
                    onClick={() => {
                      setEasterEggCount((prev) => {
                        const next = prev + 1;
                        if (next >= 5) {
                          setShowDevTools(!showDevTools);
                          return 0;
                        }
                        return next;
                      });
                    }}
                    className="text-4xl font-black tracking-tight text-blue-900 flex items-center justify-center gap-2.5 cursor-pointer select-none active:scale-95 transition-transform"
                    title="GoMoto DRC"
                  >
                    <span>🏍️ {translations[language].appName}</span>
                  </h1>
                  <p className="text-slate-500 text-sm leading-normal">
                    {translations[language].appSubtitle}
                  </p>
                  {!user && (
                     <div className="mt-6 max-w-md mx-auto space-y-6">
                        {/* Option 1: Official Google OAuth Auth */}
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm text-left">
                          <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">Option 1 : Authentification Google</span>
                          <button onClick={loginWithGoogle} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition-all w-full flex items-center justify-center gap-2.5 cursor-pointer text-sm">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.86-3.577-7.86-8s3.53-8 7.86-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.84 0 10.92-3.834 10.92-11.24 0-.768-.082-1.353-.183-1.955H12.24z"/>
                            </svg>
                            <span>Se connecter via Google</span>
                          </button>
                          <p className="text-[10px] text-slate-400 mt-2.5 leading-relaxed text-center">
                            Nécessite d'être préalablement enregistré comme testeur officiel sur la console GCP Gomoto.
                          </p>
                        </div>

                        {/* Option 2: Custom Instant Email Connection bypass */}
                        <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-5 shadow-xl text-left relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-yellow-500 text-slate-950 font-black text-[8px] px-2.5 py-0.5 rounded-bl-lg uppercase tracking-widest">
                            Recommandé RDC
                          </div>
                          
                          <span className="text-[9.5px] font-black text-yellow-500 uppercase tracking-widest block mb-1">Option 2 : Connexion Immédiate (E-mail Sandbox)</span>
                          <p className="text-[10px] text-slate-400 leading-normal mb-4">
                            Si Google bloque la validation (<code className="bg-slate-950 px-1 rounded text-red-400 font-mono">Erreur 403 : access_denied</code>), connectez-vous directement ci-dessous sans approbation Google externe :
                          </p>

                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const emailStr = formData.get("tester_email") as string;
                            if (emailStr && emailStr.includes("@")) {
                              try {
                                await loginWithTesterEmail(emailStr);
                              } catch (err: any) {
                                alert("Échec de connexion: " + err.message);
                              }
                            } else {
                              alert("Veuillez entrer une adresse e-mail valide.");
                            }
                          }} className="flex flex-col gap-2.5">
                            <div className="flex gap-2">
                              <input 
                                type="email" 
                                name="tester_email"
                                placeholder="votre-adresse-email@gmail.com" 
                                className="flex-1 px-3.5 py-2.5 text-xs border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-slate-950 text-white font-sans font-medium"
                                required
                                defaultValue="lumulazard5@gmail.com"
                              />
                              <button 
                                type="submit" 
                                className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs font-black uppercase rounded-xl transition-all cursor-pointer shrink-0"
                              >
                                Connecter
                              </button>
                            </div>
                          </form>

                          <div className="mt-4 pt-3.5 border-t border-slate-800/80">
                            <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block mb-2">Comptes d'accès rapide Admin :</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await loginWithTesterEmail("lumulazard5@gmail.com");
                                  } catch (err: any) {
                                    alert(err.message);
                                  }
                                }}
                                className="px-3 py-2 border border-slate-800 hover:border-slate-700 bg-slate-950 rounded-xl text-[10.5px] text-yellow-500/90 hover:text-yellow-400 font-extrabold flex items-center justify-between transition-all cursor-pointer text-left"
                              >
                                <span>👤 Lazard Lumu</span>
                                <span className="text-[7.5px] bg-yellow-500/10 text-yellow-500 px-1 py-0.5 rounded font-black font-mono">ADMIN</span>
                              </button>
                              
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await loginWithTesterEmail("aepisciculture@gmail.com");
                                  } catch (err: any) {
                                    alert(err.message);
                                  }
                                }}
                                className="px-3 py-2 border border-slate-800 hover:border-slate-700 bg-slate-950 rounded-xl text-[10.5px] text-yellow-500/90 hover:text-yellow-400 font-extrabold flex items-center justify-between transition-all cursor-pointer text-left"
                              >
                                <span>👤 Pisciculture CD</span>
                                <span className="text-[7.5px] bg-yellow-500/10 text-yellow-500 px-1 py-0.5 rounded font-black font-mono">ADMIN</span>
                              </button>
                            </div>
                          </div>
                        </div>
                     </div>
                  )}
                </div>
                {user && <RegistrationFlow onCompleteRegistration={handleCompleteRegistration} lang={language} userEmail={user.email} userId={user.uid} />}
              </div>

              {/* Universally visible Mobile Download & Compatibility Section */}
              <MobileAppDownload />
            </div>
          )}

          {/* VIEW 2: CLIENT PASSENGER DASHBOARD */}
          {currentUserProfile?.role === "client" && (
            <ClientDashboard
              profile={currentUserProfile}
              onUpdateProfile={handleUpdateUserProfile}
              onSubmitModRequest={handleSubmitModRequest}
              modRequests={modRequests}
              onLogout={logout}
              lang={language}
              onTriggerSOS={handleTriggerSOS}
              sosAlerts={sosAlerts}
            />
          )}

          {/* VIEW 3: DRIVER MOTORCYCLE DASHBOARD */}
          {currentUserProfile?.role === "driver" && (
            <DriverDashboard
              profile={currentUserProfile}
              onUpdateProfile={handleUpdateUserProfile}
              onSubmitModRequest={handleSubmitModRequest}
              modRequests={modRequests}
              onLogout={logout}
              lang={language}
              onSubmitTaxDoc={handleSubmitTaxDoc}
              submittedTaxDocs={submittedTaxDocs}
              onTriggerSOS={handleTriggerSOS}
              sosAlerts={sosAlerts}
            />
          )}

          {/* VIEW 4: VEHICLE FLEET OWNER DASHBOARD */}
          {currentUserProfile?.role === "owner" && (
            <OwnerDashboard
              profile={currentUserProfile}
              onUpdateProfile={handleUpdateUserProfile}
              onSubmitModRequest={handleSubmitModRequest}
              modRequests={modRequests}
              onLogout={logout}
              lang={language}
              onSubmitTaxDoc={handleSubmitTaxDoc}
              submittedTaxDocs={submittedTaxDocs}
            />
          )}

          {/* VIEW 5: SECURITY AUDIT ADMINISTRATIVE PANEL */}
          {currentUserProfile?.role === "admin" && (
            <AdminPanel
              adminProfile={currentUserProfile}
              modRequests={modRequests}
              onReviewRequest={handleReviewRequest}
              onUpdateUserStatus={handleUpdateUserStatus}
              onUpdateUsersList={(newUsers) => {
                setRegisteredUsers(newUsers);
                localStorage.setItem("gomoto_users", JSON.stringify(newUsers));
              }}
              registeredUsers={registeredUsers}
              lang={language}
              submittedTaxDocs={submittedTaxDocs}
              onReviewTaxDoc={handleReviewTaxDoc}
              sosAlerts={sosAlerts}
              onResolveSOSAlert={handleResolveSOSAlert}
              onBackToApp={() => {}}
            />
          )}

        </AutoTranslateContainer>
      </main>

    </div>
  );
}
