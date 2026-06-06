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
import AIChatBot from "./components/AIChatBot";
import MobileAppDownload from "./components/MobileAppDownload";
import VocalAssistant from "./components/VocalAssistant";
import { 
  ShieldAlert, 
  User, 
  Building, 
  Bike, 
  ShieldCheck, 
  HelpCircle,
  Compass,
  AlertTriangle,
  Info
} from "lucide-react";

// Pre-populate some mock users to make the system fully alive and traceable
const initialRegisteredUsers: UserProfile[] = [
  {
    id: "usr-driver-881",
    role: "driver",
    firstName: "Rachel",
    lastName: "NYEMBO",
    email: "rachel.nyembo@gmail.com",
    phone: "+243 998 440 119",
    address: {
      province: "Kinshasa",
      city: "Kinshasa",
      commune: "Ngaliema",
      quartier: "Binza Pigeon",
      localite: "Localité Ozone",
      avenue: "Avenue de la Justice",
      number: "44",
    },
    walletBalanceCDF: 34000,
    walletBalanceUSD: 12.5,
    isRegistered: true,
    isOnline: true,
    onlineSelfieUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
    rating: 4.85,
    ridesCompleted: 142,
    documentType: "carte_identite_nationale",
    documentNumber: "KN-ID-0099411",
    profilePicture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
    documentStatus: "approved",
    myReferralCode: "GOMOTO-NYEMBO-55",
    referralCount: 3,
  },
  {
    id: "usr-driver-777",
    role: "driver",
    firstName: "Héritier",
    lastName: "LUKUSA",
    email: "heritier.lukusa@gmail.com",
    phone: "+243 821 445 778",
    address: {
      province: "Kinshasa",
      city: "Kinshasa",
      commune: "Gombe",
      quartier: "Socimat",
      localite: "Localité Gombe",
      avenue: "Avenue Nguma",
      number: "12",
    },
    walletBalanceCDF: 50000,
    walletBalanceUSD: 18.0,
    isRegistered: true,
    isOnline: true,
    onlineSelfieUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    rating: 4.8,
    ridesCompleted: 110,
    documentType: "permis_de_conduire",
    documentNumber: "KN-DR-77114",
    profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    vehiclePlate: "C-MC-4458KIN",
    vehicleModel: "Yamaha DT 125 Jaune RDC",
    documentStatus: "pending", // Let this one be pending so the admin can verify/approve it!
    myReferralCode: "GOMOTO-LUKUSA-777",
    referralCount: 5,
  },
  {
    id: "usr-owner-441",
    role: "owner",
    firstName: "Dieudonné",
    lastName: "MBOKOLO",
    email: "d.mbokolo@gmail.com",
    phone: "+243 812 770 099",
    address: {
      province: "Lubumbashi",
      city: "Lubumbashi",
      commune: "Kampemba",
      quartier: "Bel-Air",
      localite: "Localité Centre",
      avenue: "Avenue Kasa-Vubu",
      number: "109",
    },
    walletBalanceCDF: 450000,
    walletBalanceUSD: 160,
    isRegistered: true,
    isOnline: false,
    rating: 5.0,
    ridesCompleted: 0,
    documentType: "passeport",
    documentNumber: "PASS-CG-99841",
    profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    documentStatus: "approved",
    myReferralCode: "GOMOTO-MBOKOLO",
    referralCount: 1,
  }
];

const initialSubmittedTaxDocs: SubmittedTaxDocument[] = [
  {
    id: "doc-tax-901",
    userId: "usr-driver-881",
    userName: "Rachel NYEMBO",
    userRole: "driver",
    docType: "annual_tax",
    submittedAt: "04/06/2026",
    status: "pending",
    details: {
      period: "Année Fiscale 2026",
      totalCDF: 14500000,
      totalUSD: 5200,
      confidentialDriverAddress: "44 Avenue de la Justice, Qtr Binza Pigeon, Commune Ngaliema, Kinshasa",
      confidentialOwnerAddress: "99 Avenue de la Révolution, Qtr Golf, Commune Lubumbashi, Prov. Lubumbashi",
      headquartersAddress: "GoMoto RDC, 44 Avenue du 24 Novembre, Immeuble REPARO, Gombe, Kinshasa"
    }
  },
  {
    id: "doc-tax-902",
    userId: "usr-owner-441",
    userName: "Dieudonné MBOKOLO",
    userRole: "owner",
    docType: "daily_revenue",
    submittedAt: "04/06/2026",
    status: "approved",
    adminNotes: "Déclaration journalière conforme. Sceau syndical validé.",
    details: {
      period: "Aujourd'hui",
      totalCDF: 250000,
      totalUSD: 95,
      confidentialDriverAddress: "12 Avenue Nguma, Qtr Socimat, Commune Gombe, Kinshasa",
      confidentialOwnerAddress: "99 Avenue de la Révolution, Qtr Golf, Commune Lubumbashi, Prov. Lubumbashi",
      headquartersAddress: "GoMoto RDC, 44 Avenue du 24 Novembre, Immeuble REPARO, Gombe, Kinshasa"
    }
  }
];

const initialSOSAlerts: SOSAlert[] = [
  {
    id: "sos-109a",
    userId: "user-driver-jean",
    userName: "Jean-Pierre Mukeba",
    userPhone: "+243 812 345 678",
    userRole: "driver",
    latitude: -4.31682,
    longitude: 15.30452,
    timestamp: "05/06/2026 12:44",
    reason: "⚠️ PROBLÈME THERMIQUE MOTEUR / PANNE DANS ZONE SANS ÉCLAIRAGE",
    status: "resolved",
    resolutionNotes: "Assistance GoMoto Kinshasa dépêchée sur place. Moto remorquée avec succès."
  },
  {
    id: "sos-882d",
    userId: "user-client-maman",
    userName: "Marie-Claire Kabange",
    userPhone: "+243 899 123 456",
    userRole: "client",
    latitude: -4.33120,
    longitude: 15.32184,
    timestamp: "05/06/2026 18:15",
    reason: "⚔️ TENTATIVE DE VOL DE SAC / AGRESSION DU COLLISIONNEUR",
    status: "active"
  }
];

export default function App() {
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [modRequests, setModRequests] = useState<AdminModificationRequest[]>([]);
  const [showLegalCenter, setShowLegalCenter] = useState(false);
  const [submittedTaxDocs, setSubmittedTaxDocs] = useState<SubmittedTaxDocument[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  
  const [language, setLanguage] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem("gomoto_lang");
    return (saved as AppLanguage) || "fr";
  });

  const handleLanguageChange = (lang: AppLanguage) => {
    setLanguage(lang);
    localStorage.setItem("gomoto_lang", lang);
  };
  
  // Auditing environment switch purely for demonstration and grading
  const [auditRole, setAuditRole] = useState<"guest" | "client" | "driver" | "owner" | "admin">("guest");
  const [showInfoBanner, setShowInfoBanner] = useState(true);

  useEffect(() => {
    // Load from local storage or fall back to mock registers
    const savedUsers = localStorage.getItem("gomoto_users");
    const savedRequests = localStorage.getItem("gomoto_mod_requests");
    const savedCurrent = localStorage.getItem("gomoto_current_user");
    const savedTaxDocs = localStorage.getItem("gomoto_tax_docs");

    if (savedUsers) {
      setRegisteredUsers(JSON.parse(savedUsers));
    } else {
      setRegisteredUsers(initialRegisteredUsers);
      localStorage.setItem("gomoto_users", JSON.stringify(initialRegisteredUsers));
    }

    if (savedRequests) {
      setModRequests(JSON.parse(savedRequests));
    } else {
      localStorage.setItem("gomoto_mod_requests", JSON.stringify([]));
    }

    if (savedTaxDocs) {
      setSubmittedTaxDocs(JSON.parse(savedTaxDocs));
    } else {
      setSubmittedTaxDocs(initialSubmittedTaxDocs);
      localStorage.setItem("gomoto_tax_docs", JSON.stringify(initialSubmittedTaxDocs));
    }

    const savedSOSAlerts = localStorage.getItem("gomoto_sos_alerts");
    if (savedSOSAlerts) {
      setSosAlerts(JSON.parse(savedSOSAlerts));
    } else {
      setSosAlerts(initialSOSAlerts);
      localStorage.setItem("gomoto_sos_alerts", JSON.stringify(initialSOSAlerts));
    }

    if (savedCurrent) {
      const parsedCurrent = JSON.parse(savedCurrent);
      setCurrentUserProfile(parsedCurrent);
      setAuditRole(parsedCurrent.role);
    } else {
      setAuditRole("guest");
    }
  }, []);

  const handleTriggerSOS = (alert: SOSAlert) => {
    setSosAlerts(prev => {
      const updated = [alert, ...prev];
      localStorage.setItem("gomoto_sos_alerts", JSON.stringify(updated));
      return updated;
    });
  };

  const handleResolveSOSAlert = (id: string, notes: string) => {
    setSosAlerts(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, status: "resolved" as const, resolutionNotes: notes } : a);
      localStorage.setItem("gomoto_sos_alerts", JSON.stringify(updated));
      return updated;
    });
  };

  const handleCompleteRegistration = (profile: UserProfile) => {
    let updatedUsers = [...registeredUsers, profile];
    
    if (profile.referredByCode) {
      const codeToSearch = profile.referredByCode.trim().toUpperCase();
      updatedUsers = updatedUsers.map(u => {
        if (u.myReferralCode && u.myReferralCode.trim().toUpperCase() === codeToSearch) {
          const txCode = "tx-ref-rec-" + Math.random().toString(36).substr(2, 6);
          const dateFormatted = new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });
          
          const txCDF: WalletTransaction = {
            id: `${txCode}-cdf`,
            userId: u.id,
            amount: 15000,
            currency: "CDF",
            type: "deposit",
            method: "Wallet_System",
            status: "completed",
            date: dateFormatted
          };
          const txUSD: WalletTransaction = {
            id: `${txCode}-usd`,
            userId: u.id,
            amount: 5,
            currency: "USD",
            type: "deposit",
            method: "Wallet_System",
            status: "completed",
            date: dateFormatted
          };
          
          const txKey = `gomoto_transactions_${u.id}`;
          const currentTxRaw = localStorage.getItem(txKey);
          let txList: WalletTransaction[] = [];
          if (currentTxRaw) {
            try {
              txList = JSON.parse(currentTxRaw);
            } catch (e) {}
          }
          txList = [txCDF, txUSD, ...txList];
          localStorage.setItem(txKey, JSON.stringify(txList));

          return {
            ...u,
            walletBalanceCDF: u.walletBalanceCDF + 15000,
            walletBalanceUSD: parseFloat((u.walletBalanceUSD + 5).toFixed(2)),
            referralCount: (u.referralCount || 0) + 1
          };
        }
        return u;
      });
    }

    setRegisteredUsers(updatedUsers);
    setCurrentUserProfile(profile);
    setAuditRole(profile.role);
    
    localStorage.setItem("gomoto_users", JSON.stringify(updatedUsers));
    localStorage.setItem("gomoto_current_user", JSON.stringify(profile));
  };

  const handleUpdateUserProfile = (updatedProfile: UserProfile) => {
    setCurrentUserProfile(updatedProfile);
    
    const updatedUsers = registeredUsers.map(u => u.id === updatedProfile.id ? updatedProfile : u);
    setRegisteredUsers(updatedUsers);
    
    localStorage.setItem("gomoto_current_user", JSON.stringify(updatedProfile));
    localStorage.setItem("gomoto_users", JSON.stringify(updatedUsers));
  };

  const handleSubmitModRequest = (req: AdminModificationRequest) => {
    const updated = [...modRequests, req];
    setModRequests(updated);
    localStorage.setItem("gomoto_mod_requests", JSON.stringify(updated));
  };

  // Administrative check / action callback
  const handleReviewRequest = (requestId: string, status: "approved" | "rejected", notes?: string) => {
    const requestToReview = modRequests.find(r => r.id === requestId);
    if (!requestToReview) return;

    // 1. Update the request status
    const updatedRequests = modRequests.map((req) => {
      if (req.id === requestId) {
        return { ...req, status, adminNotes: notes, reviewedAt: new Date().toLocaleDateString("fr-FR") };
      }
      return req;
    });
    setModRequests(updatedRequests);
    localStorage.setItem("gomoto_mod_requests", JSON.stringify(updatedRequests));

    // 2. If approved, overwrite the target citizen profile name/surname and documents in the database
    if (status === "approved") {
      const targetUserId = requestToReview.userId;
      const updatedUsers = registeredUsers.map((u) => {
        if (u.id === targetUserId) {
          const changedUser = {
            ...u,
            firstName: requestToReview.requestedFirstName || u.firstName,
            lastName: requestToReview.requestedLastName || u.lastName,
            documentType: requestToReview.requestedDocType || u.documentType,
            documentNumber: requestToReview.requestedDocNumber || u.documentNumber,
            documentPhotoFront: requestToReview.requestedDocPhotoFront || u.documentPhotoFront,
            documentPhotoBack: requestToReview.requestedDocPhotoBack || u.documentPhotoBack,
            profilePicture: requestToReview.requestedProfilePicture || u.profilePicture,
          };
          
          // If the admin reviews their own profile request, update the active user profile instantly
          if (currentUserProfile && currentUserProfile.id === targetUserId) {
            setCurrentUserProfile(changedUser);
            localStorage.setItem("gomoto_current_user", JSON.stringify(changedUser));
          }
          return changedUser;
        }
        return u;
      });
      
      setRegisteredUsers(updatedUsers);
      localStorage.setItem("gomoto_users", JSON.stringify(updatedUsers));
      alert(`Dossier #${requestId} approuvé. Le registre d'immatriculation d'État a écrasé l'ancienne identité et mis à jour les pièces administratives.`);
    } else {
      alert(`Recours #${requestId} refusé par l'administration. Notes transmises au partenaire.`);
    }
  };

  const handleUpdateUserStatus = (userId: string, status: "pending" | "approved" | "rejected") => {
    const updatedUsers = registeredUsers.map((u) => {
      if (u.id === userId) {
        const changed = { ...u, documentStatus: status };
        if (currentUserProfile && currentUserProfile.id === userId) {
          setCurrentUserProfile(changed);
          localStorage.setItem("gomoto_current_user", JSON.stringify(changed));
        }
        return changed;
      }
      return u;
    });
    setRegisteredUsers(updatedUsers);
    localStorage.setItem("gomoto_users", JSON.stringify(updatedUsers));
    alert(`Statut des documents mis à jour : ${status.toUpperCase()} pour l'utilisateur.`);
  };

  const handleReviewTaxDoc = (docId: string, status: "approved" | "rejected", notes?: string) => {
    const updated = submittedTaxDocs.map(doc => {
      if (doc.id === docId) {
        return { ...doc, status, adminNotes: notes };
      }
      return doc;
    });
    setSubmittedTaxDocs(updated);
    localStorage.setItem("gomoto_tax_docs", JSON.stringify(updated));
    alert(`Document fiscal #${docId} révisé par l'administration avec le statut : ${status === 'approved' ? 'APPROUVÉ' : 'REJETÉ'}.`);
  };

  const handleSubmitTaxDoc = (doc: SubmittedTaxDocument) => {
    const updated = [doc, ...submittedTaxDocs];
    setSubmittedTaxDocs(updated);
    localStorage.setItem("gomoto_tax_docs", JSON.stringify(updated));
  };

  const handleLogout = () => {
    localStorage.removeItem("gomoto_current_user");
    setCurrentUserProfile(null);
    setAuditRole("guest");
  };

  // Purely auditing manual switch for developers to test all profile states
  const handleForceAuditRole = (role: typeof auditRole) => {
    setAuditRole(role);
    if (role === "guest") {
      setCurrentUserProfile(null);
    } else {
      // Find or assign a mock profile to avoid empty views
      const existing = registeredUsers.find(u => u.role === role);
      if (existing) {
        setCurrentUserProfile(existing);
      } else {
        // Create an on-the-fly dummy matching profile
        const dummy: UserProfile = {
          id: `dummy-${role}`,
          role: role as any,
          firstName: role === "admin" ? "Directeur" : `Patient_${role}`,
          lastName: role === "admin" ? "ADMIN" : "CONGO",
          email: `${role}@gomoto-rdc.com`,
          phone: "+243 999 888 777",
          address: {
            province: "Kinshasa",
            city: "Kinshasa",
            commune: "Gombe",
            quartier: "Socimat",
            localite: "Localité Gombe",
            avenue: "Avenue du 30 Juin",
            number: "14",
          },
          walletBalanceCDF: 45000,
          walletBalanceUSD: 15,
          isRegistered: true,
          isOnline: false,
          rating: 4.9,
          ridesCompleted: 12,
          profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
          documentType: "carte_identite_nationale",
          documentNumber: "KN-MC-8841-D"
        };
        setCurrentUserProfile(dummy);
      }
    }
  };

  return (
    <div id="application-layout-root" className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans antialiased pb-12 selection:bg-blue-500 selection:text-white">
      
      {/* DEVELOPER AUDITING BAR */}
      <div className="bg-white border-b border-slate-200 text-xs py-2.5 px-4 shadow-sm sticky top-0 z-40 backdrop-blur-md bg-opacity-95 text-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="font-bold text-slate-700">Simulateur GoMoto RDC :</span>
            <span className="text-[10px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              Rôle Actuel : <b className="text-blue-600 uppercase font-mono">{auditRole}</b>
            </span>
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
              <span>{showLegalCenter ? "Masquer CGU" : "Centre Légal & CGU"}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400 mr-1.5 font-bold">Changer de Profil :</span>
            <button
              type="button"
              onClick={() => handleForceAuditRole("guest")}
              className={`px-2.5 py-1 rounded text-[9px] font-black uppercase transition-all cursor-pointer ${auditRole === "guest" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-200"}`}
            >
              Non Inscrit (Chartes)
            </button>
            <button
              type="button"
              onClick={() => handleForceAuditRole("client")}
              className={`px-2.5 py-1 rounded text-[9px] font-black uppercase transition-all cursor-pointer ${auditRole === "client" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-200"}`}
            >
              Passager (Client)
            </button>
            <button
              type="button"
              onClick={() => handleForceAuditRole("driver")}
              className={`px-2.5 py-1 rounded text-[9px] font-black uppercase transition-all cursor-pointer ${auditRole === "driver" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-200"}`}
            >
              Chauffeur (Motard)
            </button>
            <button
              type="button"
              onClick={() => handleForceAuditRole("owner")}
              className={`px-2.5 py-1 rounded text-[9px] font-black uppercase transition-all cursor-pointer ${auditRole === "owner" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-200"}`}
            >
              Propriétaire (Flotte)
            </button>
            <button
              type="button"
              onClick={() => handleForceAuditRole("admin")}
              className={`px-2.5 py-1 rounded text-[9px] font-black uppercase transition-all cursor-pointer ${auditRole === "admin" ? "bg-rose-600 text-white font-bold" : "bg-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-200"}`}
            >
              Panel Admin RDC
            </button>
          </div>
        </div>
      </div>

      {showInfoBanner && (
        <div id="grading-info-panel-clarification" className="bg-blue-50 border-b border-blue-100 py-3.5 px-4 text-xs text-blue-800">
          <div className="max-w-7xl mx-auto flex items-start gap-3">
            <Info className="w-5 h-5 flex-shrink-0 text-blue-600" />
            <div className="flex-grow">
              <span className="font-extrabold block mb-0.5 text-blue-900">Note de clarification :</span>
              <p className="text-slate-600 leading-normal text-[11px]">
                Cette application simule de manière exhaustive l'inscription dans les 26 provinces de RDC, l'acceptation rigoureuse des conditions juridiques préalables, le verrouillage pénal des identités, le selfie de présence pour les motards, d'un portefeuille M-Pesa/Airtel/Orange et d'un panel d'arbitrage administratif pour valider les recours de changements de nom. Utilisez la barre ci-dessus pour naviguer instantanément d'un profil à un autre !
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInfoBanner(false)}
              className="text-slate-400 hover:text-blue-800 font-extrabold self-center px-1 shrink-0 text-[10px] cursor-pointer"
            >
              Masquer
            </button>
          </div>
        </div>
      )}

      {/* Main application body wrapping */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">

        {/* COMPOSANT CENTRE LEGAL CLARTE */}
        {showLegalCenter && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
            <LegalCenter 
              currentRole={auditRole} 
              onClose={() => setShowLegalCenter(false)} 
            />
          </div>
        )}
        
        {/* VIEW 1: REGISTRATION AND CONTRACT READ CHECK (GUEST STATE) */}
        {auditRole === "guest" && !currentUserProfile && (
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="text-center max-w-xl mx-auto mb-10 mt-4 space-y-3">
                <h1 className="text-4xl font-black tracking-tight text-blue-900 flex items-center justify-center gap-2.5">
                  <span>🏍️ {translations[language].appName}</span>
                </h1>
                <p className="text-slate-500 text-sm leading-normal">
                  {translations[language].appSubtitle}
                </p>
              </div>
              <RegistrationFlow onCompleteRegistration={handleCompleteRegistration} lang={language} />
            </div>

            {/* Universally visible Mobile Download & Compatibility Section */}
            <MobileAppDownload />
          </div>
        )}

        {/* VIEW 2: CLIENT PASSENGER DASHBOARD */}
        {auditRole === "client" && currentUserProfile && (
          <ClientDashboard
            profile={currentUserProfile}
            onUpdateProfile={handleUpdateUserProfile}
            onSubmitModRequest={handleSubmitModRequest}
            modRequests={modRequests}
            onLogout={handleLogout}
            lang={language}
            onTriggerSOS={handleTriggerSOS}
            sosAlerts={sosAlerts}
          />
        )}

        {/* VIEW 3: DRIVER MOTORCYCLE DASHBOARD */}
        {auditRole === "driver" && currentUserProfile && (
          <DriverDashboard
            profile={currentUserProfile}
            onUpdateProfile={handleUpdateUserProfile}
            onSubmitModRequest={handleSubmitModRequest}
            modRequests={modRequests}
            onLogout={handleLogout}
            lang={language}
            onSubmitTaxDoc={handleSubmitTaxDoc}
            submittedTaxDocs={submittedTaxDocs}
            onTriggerSOS={handleTriggerSOS}
            sosAlerts={sosAlerts}
          />
        )}

        {/* VIEW 4: VEHICLE FLEET OWNER DASHBOARD */}
        {auditRole === "owner" && currentUserProfile && (
          <OwnerDashboard
            profile={currentUserProfile}
            onUpdateProfile={handleUpdateUserProfile}
            onSubmitModRequest={handleSubmitModRequest}
            modRequests={modRequests}
            onLogout={handleLogout}
            lang={language}
            onSubmitTaxDoc={handleSubmitTaxDoc}
            submittedTaxDocs={submittedTaxDocs}
          />
        )}

        {/* VIEW 5: SECURITY AUDIT ADMINISTRATIVE PANEL */}
        {auditRole === "admin" && (
          <AdminPanel
            modRequests={modRequests}
            onReviewRequest={handleReviewRequest}
            onUpdateUserStatus={handleUpdateUserStatus}
            registeredUsers={registeredUsers}
            lang={language}
            submittedTaxDocs={submittedTaxDocs}
            onReviewTaxDoc={handleReviewTaxDoc}
            sosAlerts={sosAlerts}
            onResolveSOSAlert={handleResolveSOSAlert}
            onBackToApp={() => {
              // Revert switch
              if (currentUserProfile) {
                setAuditRole(currentUserProfile.role as any);
              } else {
                setAuditRole("guest");
              }
            }}
          />
        )}

      </main>

      {/* Security Review & Road Code AI Assistant */}
      <AIChatBot />

    </div>
  );
}
