/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from "react";
import { UserProfile, AdminModificationRequest, DRCAddress } from "../types";
import PartnershipProposals from "./PartnershipProposals";
import { 
  ShieldAlert, 
  Check, 
  X, 
  User, 
  ShieldCheck, 
  Clock, 
  ChevronRight, 
  Search, 
  MapPin, 
  Lock,
  Building,
  Bike,
  Eye,
  Info,
  Smartphone,
  Wallet,
  RefreshCw,
  CheckCircle,
  Wifi,
  UserX,
  Map
} from "lucide-react";
import { drcProvinces } from "../data/drcLocations";

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userRole: "driver" | "owner";
  amount: number;
  currency: "CDF" | "USD";
  operator: "M-Pesa" | "Orange Money" | "Airtel Money" | "Wave";
  operatorPhone: string;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
}

interface AdminPanelProps {
  modRequests: AdminModificationRequest[];
  onReviewRequest: (id: string, status: "approved" | "rejected", notes?: string) => void;
  onUpdateUserStatus: (userId: string, status: "approved" | "pending" | "rejected") => void;
  registeredUsers: UserProfile[];
  onBackToApp: () => void;
  lang?: any;
  submittedTaxDocs?: any[];
  onReviewTaxDoc?: (id: string, status: "approved" | "rejected", adminNotes?: string) => void;
  sosAlerts?: any[];
  onResolveSOSAlert?: (id: string, notes: string) => void;
}

export default function AdminPanel({
  modRequests,
  onReviewRequest,
  onUpdateUserStatus,
  registeredUsers,
  onBackToApp,
  lang = "fr",
  submittedTaxDocs = [],
  onReviewTaxDoc,
  sosAlerts = [],
  onResolveSOSAlert,
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"requests" | "users" | "documents" | "emergencies" | "transactions" | "partenariats">("requests");
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  
  // Custom Map states for emergency coordinates calibration
  const [focusedSOSId, setFocusedSOSId] = useState<string | null>("sos-882d");
  const [sosIntercomActive, setSosIntercomActive] = useState<boolean>(false);
  const [sosIntercomLog, setSosIntercomLog] = useState<string[]>([]);
  const [dispatchedBrigades, setDispatchedBrigades] = useState<Record<string, string>>({});

  // Mobile Money simulated transaction withdrawals
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    const saved = localStorage.getItem("gomoto_withdr_requests");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const initialWithdrawals: WithdrawalRequest[] = [
      {
        id: "WTH-2026-081",
        userId: "usr-driver-881",
        userName: "Rachel NYEMBO",
        userPhone: "+243 998 440 119",
        userRole: "driver",
        amount: 25000,
        currency: "CDF",
        operator: "M-Pesa",
        operatorPhone: "+243 998 440 119",
        requestedAt: "05/06/2026 14:30",
        status: "pending"
      },
      {
        id: "WTH-2026-082",
        userId: "usr-owner-441",
        userName: "Dieudonné MBOKOLO",
        userPhone: "+243 812 770 099",
        userRole: "owner",
        amount: 120,
        currency: "USD",
        operator: "Wave",
        operatorPhone: "+243 812 770 099",
        requestedAt: "05/06/2026 16:10",
        status: "pending"
      },
      {
        id: "WTH-2026-079",
        userId: "usr-driver-777",
        userName: "Héritier LUKUSA",
        userPhone: "+243 821 445 778",
        userRole: "driver",
        amount: 30000,
        currency: "CDF",
        operator: "Orange Money",
        operatorPhone: "+243 821 445 778",
        requestedAt: "04/06/2026 11:15",
        status: "approved",
        adminNotes: "Retrait compensé avec succès sur API Orange Money RDC."
      }
    ];
    localStorage.setItem("gomoto_withdr_requests", JSON.stringify(initialWithdrawals));
    return initialWithdrawals;
  });

  const handleReviewWithdrawal = (id: string, status: "approved" | "rejected", notes: string) => {
    const updated = withdrawals.map(w => w.id === id ? { ...w, status, adminNotes: notes } : w);
    setWithdrawals(updated);
    localStorage.setItem("gomoto_withdr_requests", JSON.stringify(updated));

    // If approved, deduct matching funds from globally registered users list securely
    const request = withdrawals.find(w => w.id === id);
    if (request && status === "approved") {
      const savedUsers = localStorage.getItem("gomoto_users");
      if (savedUsers) {
        try {
          const users: UserProfile[] = JSON.parse(savedUsers);
          const updatedUsers = users.map(u => {
            if (u.id === request.userId) {
              if (request.currency === "CDF") {
                return { ...u, walletBalanceCDF: Math.max(0, u.walletBalanceCDF - request.amount) };
              } else {
                return { ...u, walletBalanceUSD: parseFloat(Math.max(0, u.walletBalanceUSD - request.amount).toFixed(2)) };
              }
            }
            return u;
          });
          localStorage.setItem("gomoto_users", JSON.stringify(updatedUsers));
          
          // Propagate instantly to current active user profile if matched
          const savedCurrent = localStorage.getItem("gomoto_current_user");
          if (savedCurrent) {
            const currentObj = JSON.parse(savedCurrent);
            if (currentObj.id === request.userId) {
              const uMatch = updatedUsers.find(x => x.id === request.userId);
              if (uMatch) {
                localStorage.setItem("gomoto_current_user", JSON.stringify(uMatch));
              }
            }
          }
        } catch (e) {
          console.error("Local storage sync error", e);
        }
      }
    }
  };

  // Dispatch interactive simulated brigade updates
  const handleDispatchBrigade = (sosId: string, brigadeType: "pnc" | "gomoto_sec") => {
    const label = brigadeType === "pnc" ? "Patrouille Police Nationale PNC" : "Brigade Intervention Rapide GoMoto";
    setDispatchedBrigades(prev => ({
      ...prev,
      [sosId]: `En route... (${label} mobilisée du commissariat le plus proche)`
    }));
    
    setTimeout(() => {
      setDispatchedBrigades(prev => ({
        ...prev,
        [sosId]: `✓ Sur Place (${label} arrivée sur les lieux, situation stabilisée. Code Vert)`
      }));
    }, 4000);
  };

  // Live direct voice lines micro intercom simulation
  const handleToggleSOSIntercom = (userName: string) => {
    if (sosIntercomActive) {
      setSosIntercomActive(false);
      setSosIntercomLog([]);
    } else {
      setSosIntercomActive(true);
      setSosIntercomLog([
        `[CENTRAL] Connexion sécurisée au canal VoIP...`,
        `[CENTRAL] Appels d'Urgence GoMoto RDC actifs.`,
        `[COMMUNICATION] Ligne VoIP ouverte avec ${userName}`,
        `[COMMUNICATION] Son ambiant : Bruits de moteur, klaxons...`
      ]);
    }
  };

  // Filtering and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState("Tous");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("Tous");

  const pendingRequests = modRequests.filter(req => req.status === "pending");
  const reviewedRequests = modRequests.filter(req => req.status !== "pending");

  const filteredUsers = registeredUsers.filter((u) => {
    const matchesSearch = 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesProvince = 
      selectedProvinceFilter === "Tous" || u.address.province === selectedProvinceFilter;
      
    const matchesRole = 
      selectedRoleFilter === "Tous" || u.role === selectedRoleFilter;

    return matchesSearch && matchesProvince && matchesRole;
  });

  const handleNotesChange = (requestId: string, val: string) => {
    setAdminNotes(prev => ({ ...prev, [requestId]: val }));
  };

  return (
    <div id="admin-panel-container" className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-slate-800 shadow-sm">
      
      {/* Admin header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-red-50 text-red-650 p-2.5 rounded-2xl border border-red-100">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
              <span>GoMoto CONGO • Cabinet d'Arbitrage et d'Audit</span>
              <span className="bg-red-100 text-red-800 text-[8.5px] font-bold uppercase font-mono px-2 py-0.5 rounded border border-red-200">
                Direction Générale
              </span>
            </h2>
            <p className="text-[10px] text-slate-500 font-medium">Validation d'identité de conduite et recours d'état civil en RDC (26 provinces)</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToApp}
          className="bg-slate-100 hover:bg-slate-200 text-slate-750 py-2 px-5 rounded-xl text-xs font-bold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          Retourner au Portail Utilisateur
        </button>
      </div>

      {/* Admin metrics overview panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Recours civils en attente</span>
          <span className="text-2xl font-mono font-bold text-blue-600 block mt-1">{pendingRequests.length} Dossiers</span>
          <span className="text-[9px] text-slate-500 block font-medium">Modifications de noms civils ou pièces d'État</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Partenaires Enrôlés Certifiés</span>
          <span className="text-2xl font-mono font-bold text-emerald-600 block mt-1">{registeredUsers.length} Comptes</span>
          <span className="text-[9px] text-slate-500 block font-medium">Motos, Conducteurs et Propriétaires validés</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Provinces sous surveillance</span>
          <span className="text-2xl font-mono font-bold text-indigo-600 block mt-1">26 Provinces</span>
          <span className="text-[9px] text-slate-500 block font-medium">Kinshasa, Kivu, Katanga, Equateur, Kasai...</span>
        </div>
      </div>

      {/* Primary tabs controller */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto scroller-hidden">
        <button
          type="button"
          onClick={() => setActiveSubTab("requests")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeSubTab === "requests" ? "bg-red-50 text-red-650 border border-red-100" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Dossiers de Recours ({pendingRequests.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("documents")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeSubTab === "documents" ? "bg-red-50 text-red-650 border border-red-100" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Contrôle des Documents ({registeredUsers.filter(u => u.documentStatus === "pending" || !u.documentStatus).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("users")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeSubTab === "users" ? "bg-red-50 text-red-650 border border-red-100" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Registre Universel ({filteredUsers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("transactions")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeSubTab === "transactions" ? "bg-red-50 text-red-650 border border-red-100" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Retraits Mobile ({withdrawals.filter(w => w.status === "pending").length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("emergencies")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer relative shrink-0 ${
            activeSubTab === "emergencies" 
              ? "bg-red-600 text-white border border-red-500 shadow-md shadow-red-200" 
              : "bg-red-50 text-red-650 hover:bg-red-100/50 border border-red-100"
          }`}
        >
          🚨 SOS ({sosAlerts.filter((a: any) => a.status === "active").length})
          {sosAlerts.some((a: any) => a.status === "active") && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 font-sans">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("partenariats")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeSubTab === "partenariats" ? "bg-yellow-50 text-yellow-900 border border-yellow-205 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          📨 Partenariats & Contrats Pro
        </button>
      </div>

      {/* ================= ADMIN TAB 1: MODIFICATION RECOURS MANAGEMENT ================= */}
      {activeSubTab === "requests" && (
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-850 block">Note d'arbitrage de la Direction :</span>
              <p className="mt-0.5 leading-normal text-[11px] font-medium">
                En approuvant un recours d'état civil, le certificat d'immatriculation d'État est immédiatement ré-édité avec écrasement sécurisé de l'ancien dossier. Soyez extrêmement vigilant sur les motifs de modification.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-4.5 h-4.5 text-blue-600" />
              <span>Dossiers de Recours Actifs</span>
            </h3>

            {pendingRequests.length > 0 ? (
              pendingRequests.map((req) => (
                <div key={req.id} className="bg-slate-50 rounded-3xl p-5 border border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Requester overview */}
                  <div className="lg:col-span-4 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                        {req.userRole === "driver" ? <Bike className="w-4 h-4" /> : req.userRole === "owner" ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-650 bg-white px-2 py-0.5 rounded border border-slate-200 block w-max shadow-sm">
                          {req.userRole === "driver" ? "Chauffeur" : req.userRole === "owner" ? "Propriétaire" : "Passager"}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono block mt-0.5">UID: {req.userId}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-2 space-y-1.5 text-xs">
                      <div>
                        <span className="text-[8px] text-slate-500 font-bold uppercase block">Nom civil Actuel :</span>
                        <span className="font-bold text-slate-705">{req.currentFirstName} {req.currentLastName}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-550 font-bold uppercase block">Nom civil Requit :</span>
                        <span className="font-extrabold text-blue-700">{req.requestedFirstName} {req.requestedLastName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Justification details */}
                  <div className="lg:col-span-5 space-y-2.5 border-t lg:border-t-0 lg:border-x border-slate-200 px-0 lg:px-5">
                    <div>
                      <span className="text-[8px] text-slate-555 font-bold uppercase block">Motif légitime du Recours :</span>
                      <p className="text-[11px] text-slate-650 italic leading-relaxed mt-0.5">"{req.reason}"</p>
                    </div>

                    {/* Preview of submitted documents in Admin Modification Request card */}
                    {req.requestedDocNumber && (
                      <div className="p-3 bg-yellow-50/50 rounded-2xl border border-yellow-100 space-y-1.5 text-[11px] text-slate-800">
                        <span className="text-[8px] text-yellow-700 font-extrabold uppercase tracking-wider block">🔑 Pièce d'identité re-soumise en recours :</span>
                        <div className="grid grid-cols-2 gap-1 font-medium text-[10px]">
                          <div>
                            <span className="text-slate-500 font-bold block text-[8px] uppercase">Type :</span>
                            <span className="text-slate-900">
                              {req.requestedDocType === "carte_identite_nationale" ? "Carte d'Identité" :
                               req.requestedDocType === "passeport" ? "Passeport" :
                               req.requestedDocType === "permis_de_conduire" ? "Permis de conduire" : "Document étranger"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 font-bold block text-[8px] uppercase">Numéro :</span>
                            <span className="font-mono text-slate-900 font-bold">{req.requestedDocNumber}</span>
                          </div>
                        </div>

                        {/* Images preview */}
                        {(req.requestedDocPhotoFront || req.requestedDocPhotoBack || req.requestedProfilePicture) && (
                          <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-yellow-200/50">
                            {req.requestedProfilePicture && (
                              <div className="text-center">
                                <span className="text-[7.5px] text-slate-500 block uppercase font-bold mb-0.5">Photo Profil</span>
                                <img src={req.requestedProfilePicture} className="h-10 mx-auto object-cover w-10 rounded-full border border-slate-200 bg-white" referrerPolicy="no-referrer" />
                              </div>
                            )}
                            {req.requestedDocPhotoFront && (
                              <div className="text-center col-span-1">
                                <span className="text-[7.5px] text-slate-500 block uppercase font-bold mb-0.5">Recto</span>
                                <img src={req.requestedDocPhotoFront} className="h-10 mx-auto object-contain rounded border border-slate-200 bg-white" referrerPolicy="no-referrer" />
                              </div>
                            )}
                            {req.requestedDocPhotoBack && (
                              <div className="text-center col-span-1">
                                <span className="text-[7.5px] text-slate-500 block uppercase font-bold mb-0.5">Verso</span>
                                <img src={req.requestedDocPhotoBack} className="h-10 mx-auto object-contain rounded border border-slate-200 bg-white" referrerPolicy="no-referrer" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-white p-2.5 rounded-xl border border-slate-250">
                      <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Notes administratives justificatives obligatoires <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="Rédiger votre note d'autorisation..."
                        value={adminNotes[req.id] || ""}
                        onChange={(e) => handleNotesChange(req.id, e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 text-[10.5px] outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* Direct validation actions */}
                  <div className="lg:col-span-3 flex flex-row lg:flex-col justify-end gap-2 items-end">
                    <span className="text-[9px] text-slate-500 font-mono text-right block self-start mb-auto lg:order-none order-last">
                      Transmis le : {req.submittedAt}
                    </span>

                    <button
                      type="button"
                      onClick={() => onReviewRequest(req.id, "rejected", adminNotes[req.id])}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-650 border border-red-100 font-bold py-2 px-3 rounded-lg text-[10px] cursor-pointer flex items-center justify-center gap-1 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Rejeter et Radier</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!adminNotes[req.id]) {
                          alert("Veuillez rédiger une note décisionnelle administrative avant d'approuver ou rejeter le recours.");
                          return;
                        }
                        onReviewRequest(req.id, "approved", adminNotes[req.id]);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-[10px] cursor-pointer flex items-center justify-center gap-1 transition-all shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approuver & Ré-éditer Dossier</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 font-medium">
                Aucun recours d'état civil en attente d'arbitrage. Intégrité des registres à 100%.
              </p>
            )}
          </div>

          {/* HISTORIC DECISIONS LEDGER */}
          <div className="space-y-3.5 pt-5 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-4 w-4 text-emerald-600" />
              <span>Registre d'Arbitrage (Historique des Décisions)</span>
            </h4>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-200 text-slate-700">
              {reviewedRequests.length > 0 ? (
                reviewedRequests.map((req) => (
                  <div key={req.id} className="p-3.5 text-xs bg-white flex justify-between items-center hover:bg-slate-50 transition-all gap-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{req.requestedFirstName} {req.requestedLastName}</span>
                        <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[8.5px] text-slate-500 uppercase font-mono font-bold shadow-sm">
                          {req.userRole}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">Décision Motif: "{req.reason}"</span>
                      {req.adminNotes && (
                        <span className="text-[10px] text-slate-600 block italic">Note admin: "{req.adminNotes}"</span>
                      )}
                    </div>

                    <div className="text-right flex flex-col items-end shrink-0">
                      <span className={`px-2.5 py-0.5 rounded text-[8.5px] uppercase font-bold border ${
                        req.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                      }`}>
                        {req.status === "approved" ? "Accepté ✓" : "Refusé X"}
                      </span>
                      <span className="text-[8.5px] text-slate-500 block uppercase font-mono tracking-widest mt-0.5 font-medium">Traitement achevé</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-4 text-center text-[10px] text-slate-500 bg-white">Aucun historique d'arbitrage enregistré.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= ADMIN TAB 2: UNIVERSAL CITIZEN REGISTRY ================= */}
      {activeSubTab === "users" && (
        <div className="space-y-6">
          
          {/* Section d'Audit de Présence Biométrique Face-Match (Validation Caméra) */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  🛡️ Audit d'Accès Biométrique • Étape de Validation Caméra Connectée
                </h3>
              </div>
              <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[8.5px] font-mono px-2 py-0.5 rounded uppercase font-bold">
                API Face-Match GoMoto RDC
              </span>
            </div>

            <p className="text-[10.5px] text-slate-400 leading-normal">
              Chaque motard (chauffeur) doit passer une validation de visage par caméra lors de la connexion. Notre intelligence compare l'instantané caméra avec leur photo officielle d'enrôlement civil d'État.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {registeredUsers.filter(u => u.role === "driver").map((driver) => {
                const originalPhoto = driver.profilePicture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150";
                // A slightly different photo to simulate the real connection camera capture
                const selfiePhoto = driver.id === "usr-driver-881" 
                  ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" 
                  : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150";
                
                const matchScore = driver.id === "usr-driver-881" ? "98.7%" : "96.4%";
                const isSuspicious = driver.documentStatus === "rejected";

                return (
                  <div key={driver.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Photo comparaison side-by-side */}
                      <div className="flex gap-2 shrink-0">
                        <div className="text-center">
                          <span className="text-[7.5px] text-slate-500 uppercase font-mono block mb-1">Enrôlé</span>
                          <img src={originalPhoto} referrerPolicy="no-referrer" alt="Enrollement" className="h-11 w-11 rounded-lg object-cover border border-slate-800" />
                        </div>
                        <div className="text-center relative">
                          <span className="text-[7.5px] text-emerald-400 font-bold font-mono block mb-1">Caméra</span>
                          <img src={selfiePhoto} referrerPolicy="no-referrer" alt="Selfie" className="h-11 w-11 rounded-lg object-cover border border-emerald-500" />
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-100">{driver.firstName} {driver.lastName}</h4>
                        <p className="text-[9.5px] text-slate-400 font-mono">{driver.phone}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] text-slate-500">Similarité : <b className="text-emerald-400 font-mono">{matchScore}</b></span>
                          <span className={`h-1.5 w-1.5 rounded-full ${isSuspicious ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
                          <span className={`text-[8.5px] font-bold ${isSuspicious ? 'text-red-400' : 'text-emerald-400'}`}>
                            {isSuspicious ? 'Accès Bloqué par l\'Audit' : 'Validation Caméra Conforme ✓'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex sm:flex-col gap-1.5 w-full sm:w-auto mt-2 sm:mt-0">
                      {isSuspicious ? (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateUserStatus(driver.id, "approved");
                          }}
                          className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-lg text-[9.5px] cursor-pointer text-center whitespace-nowrap"
                        >
                          Rétablir la session
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateUserStatus(driver.id, "rejected");
                          }}
                          className="w-full sm:w-auto bg-red-950 text-red-400 border border-red-900 hover:bg-red-900 hover:text-white font-bold px-3 py-1.5 rounded-lg text-[9.5px] cursor-pointer flex items-center justify-center gap-1 text-center whitespace-nowrap transition-all"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Bloquer Accès Caméra</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Universal registry search parameters */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
            
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Scanner Nom, Prénom, Tél..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <select
                value={selectedProvinceFilter}
                onChange={(e) => setSelectedProvinceFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-2.5 py-2 text-xs focus:border-blue-600 outline-none"
              >
                <option value="Tous">Toutes les Provinces (26)</option>
                {drcProvinces.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-2.5 py-2 text-xs focus:border-blue-600 outline-none"
              >
                <option value="Tous">Tous les Profils</option>
                <option value="client">Passager (Client)</option>
                <option value="driver">Chauffeur (Motard)</option>
                <option value="owner">Propriétaire de motos</option>
              </select>
            </div>

            <div className="text-[10px] text-slate-500 font-mono text-center md:text-right uppercase font-medium">
              Registre : <b>{filteredUsers.length} enrôlés</b>
            </div>
          </div>

          {/* List of registered users */}
          <div className="bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-200">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <div key={u.id} className="p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-all text-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="h-9 w-9 rounded-full bg-slate-50 border border-slate-200 flex justify-center items-center text-slate-600">
                      {u.role === "driver" ? <Bike className="w-4.5 h-4.5" /> : u.role === "owner" ? <Building className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <span>{u.firstName} {u.lastName}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold ${
                          u.role === "driver" ? "bg-amber-100 text-amber-800 border border-amber-200" : u.role === "owner" ? "bg-blue-100 text-blue-805 border border-blue-200" : "bg-purple-100 text-purple-800 border border-purple-200"
                        }`}>
                          {u.role}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{u.phone} • {u.email}</p>
                      <span className="text-[9.5px] text-slate-500 block mt-1">Adresse : Province {u.address.province}, Ville/Territoire {u.address.city}, Commune {u.address.commune}</span>
                      {u.role === "driver" && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                          {u.telecomSubscriptionStatus === "active" ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[8.5px] font-sans font-semibold">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              📶 SIM Pro Active : {u.telecomOperator?.toUpperCase()} ({u.telecomPhoneSim})
                              {u.telecomSecuredAPN && " [APN Sécurisé]"}
                              {u.telecomPlanPaidByGoMoto && " • Option Sponsorisée"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-400 border border-slate-200 px-2 py-0.5 rounded text-[8px] font-mono">
                              📶 SIM standard grand public (Pas de forfait Pro crypté)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div id="admin-user-ledger-balances">
                      <span className="text-[9px] font-bold text-slate-450 block">Mouvements balances</span>
                      <span className="font-mono text-[11px] text-emerald-600 font-bold block">{u.walletBalanceCDF.toLocaleString()} CDF</span>
                      <span className="font-mono text-[11px] text-blue-650 font-bold block">${u.walletBalanceUSD} USD</span>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="bg-slate-50 text-slate-500 border border-slate-200 px-2 py-1 rounded text-[9px] font-bold flex items-center gap-1 shadow-sm">
                        <Lock className="w-3 h-3 text-red-500" />
                        <span>Identité Bloquée</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-8 text-center text-xs text-slate-500 bg-white">Aucun citoyen ne correspond aux filtres de recherche provinciale.</p>
            )}
          </div>

        </div>
      )}

      {/* ================= ADMIN TAB 3: DOCUMENT VERIFICATION AND CERTIFICATION ================= */}
      {activeSubTab === "documents" && (
        <div className="space-y-6">
          <div className="bg-slate-50 p-4.5 rounded-3xl border border-slate-200 flex items-start gap-3 text-xs leading-relaxed text-slate-700">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block mb-0.5">Autorité d'Examen d'Éligibilité Routière :</span>
              En tant qu'administrateur, examinez attentivement les cartes d'identité, permis de conduire, ou passeports soumis par les citoyens congolais. L'approbation d'un dossier débloque instantanément son statut de conduite/propriété (Approved), l'autorisant à solliciter ou accepter des courses en toute conformité contractuelle.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {registeredUsers.filter(u => u.documentStatus === "pending" || !u.documentStatus).length > 0 ? (
              registeredUsers.filter(u => u.documentStatus === "pending" || !u.documentStatus).map((u) => {
                const docNotesKey = `doc-note-${u.id}`;
                return (
                  <div key={u.id} className="bg-white border border-slate-205 rounded-3xl p-5.5 shadow-sm space-y-5">
                    {/* User identifier banner */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex justify-center items-center text-slate-600">
                          {u.role === "driver" ? <Bike className="w-5 h-5 text-amber-600" /> : <Building className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-805 text-xs flex items-center gap-2">
                            <span>{u.firstName} {u.lastName}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold ${
                              u.role === "driver" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-blue-100 text-blue-805 border border-blue-200"
                            }`}>
                              {u.role === "driver" ? "Motard / Chauffeur" : "Propriétaire de Flotte"}
                            </span>
                          </h4>
                          <p className="text-[10px] text-slate-450 mt-0.5 font-mono">Enrôlé le {u.registrationDate || "Récemment"} • Contact : {u.phone}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="bg-amber-50 text-amber-805 border border-amber-205 px-2.5 py-1 rounded-md text-[9px] font-bold inline-flex items-center gap-1.5 shadow-sm uppercase font-mono">
                          <Clock className="w-3" />
                          <span>Pièce En Attente (Pending)</span>
                        </span>
                      </div>
                    </div>

                    {/* Meta info columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Détails du Citoyen</span>
                        <p className="text-slate-850 font-medium">Email : <span className="font-mono text-slate-600">{u.email || "Non renseigné"}</span></p>
                        <p className="text-slate-850 font-medium">Adresse physique : <span className="text-slate-600">{u.address.avenue}, C/{u.address.commune}, {u.address.city}</span></p>
                        <p className="text-slate-850 font-medium">Province : <span className="font-bold text-blue-700">{u.address.province}</span></p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Pièce Légale de transport</span>
                        <p className="text-slate-855 font-medium">Type de Document : <span className="font-bold text-slate-800">{u.documentType === "carte_identite_nationale" ? "Carte d'Électeur / ID d'État" : u.documentType === "permis_de_conduire" ? "Permis de Conduire Congolais" : u.documentType === "passeport" ? "Passeport RDC" : "Autre document d'État"}</span></p>
                        <p className="text-slate-855 font-medium">Numéro de Pièce : <span className="font-bold font-mono text-xs text-indigo-750">{u.documentNumber || "C-4458-990"}</span></p>
                        {u.role === "driver" && (
                          <p className="text-slate-855 font-medium text-[11px] bg-amber-50 border border-amber-100 p-1.5 rounded-lg text-amber-800 mt-1.5">
                            <b>Moto :</b> {u.vehicleModel || "Honda CG 125"} • <b className="font-mono">{u.vehiclePlate || "C-KIN-4005"}</b>
                          </p>
                        )}
                      </div>

                      {/* Document visually simulated high fidelity container */}
                      <div className="bg-slate-50 border border-slate-205 rounded-2xl p-3 flex flex-col justify-between items-stretch">
                        <span className="text-[10px] font-bold text-slate-450 uppercase text-center block mb-2 font-mono">Visualisation administrative</span>
                        
                        <div className="border border-indigo-200 bg-indigo-50/20 rounded-xl p-3 text-[10px] relative overflow-hidden space-y-1.5 shadow-sm">
                          {/* Sealed badge */}
                          <div className="absolute right-2 top-2 h-7 w-7 rounded-full border border-indigo-400/30 flex items-center justify-center text-[7px] text-indigo-650 font-black rotate-12 scale-90">
                            MIN/SEC
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] uppercase tracking-wider font-extrabold text-indigo-900 leading-tight">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</span>
                          </div>
                          <div className="border-t border-indigo-150 my-1"></div>
                          
                          <div>
                            <span className="text-[7px] text-slate-400 block font-mono">NOM DE CITOYEN:</span>
                            <span className="font-bold text-slate-800 font-mono uppercase text-xs">{u.lastName} {u.firstName}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <div>
                              <span className="text-[7px] text-slate-400 block font-mono">NUMÉRO D'ENRÔLEMENT:</span>
                              <span className="font-bold text-indigo-900 font-mono text-[9px]">{u.documentNumber || "ID-906-8841-KIN"}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[7px] text-slate-400 block font-mono">PROVINCE:</span>
                              <span className="font-bold text-slate-805 font-mono text-[9px]">{u.address.province}</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[8px] text-slate-405 text-center mt-2 italic font-mono">Aperçu vectoriel d'enrôlement de transport régulier</p>
                      </div>
                    </div>

                    {/* Operational Actions */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-stretch justify-between gap-4">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Notes administratives d'audit (optionnel)</label>
                        <input
                          type="text"
                          id={docNotesKey}
                          placeholder="Ex: Document valide et lisible, signature approuvée..."
                          className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const noteInput = document.getElementById(docNotesKey) as HTMLInputElement;
                            const notes = noteInput ? noteInput.value : "";
                            onUpdateUserStatus(u.id, "rejected");
                            alert(`Dossier de ${u.firstName} ${u.lastName} a été rejeté. Notes d'audit : "${notes}"`);
                          }}
                          className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 font-bold py-2 px-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <X className="w-4 h-4 text-red-650" />
                          <span>Rejeter Pièce</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const noteInput = document.getElementById(docNotesKey) as HTMLInputElement;
                            const notes = noteInput ? noteInput.value : "";
                            onUpdateUserStatus(u.id, "approved");
                            alert(`Félicitations ! Le profil de ${u.firstName} ${u.lastName} est certifié conforme par le greffe d'État GoMoto. Notes: "${notes}"`);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm border border-emerald-500"
                        >
                          <Check className="w-4 h-4 text-white" />
                          <span>Approuver & Certifier</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white border border-slate-200 p-8.5 rounded-3xl text-center space-y-2">
                <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold shadow-inner border border-emerald-100">
                  ✓
                </div>
                <h4 className="text-xs font-bold text-slate-850">Aucun dossier en attente (File vide)</h4>
                <p className="text-[10.5px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Tous les citoyens, motards et propriétaires de flotte ont été examinés et certifiés par la Direction d'Audit de GoMoto RDC.
                </p>
              </div>
            )}

            {/* Split section line for Fiscalité & Déclarations */}
            <div className="border-t border-slate-200/80 pt-6 mt-6 text-left">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-700" />
                <span>Arbitrage & Contrôle Fiscal ({submittedTaxDocs.length})</span>
              </h3>
              <p className="text-[10.5px] text-slate-550 mt-0.5 font-sans leading-normal">
                Examinez les déclarations de revenus journalières et fiches annuelles de taxes transmises par les citoyens (motards et propriétaires).
              </p>
            </div>

            {/* List of submitted tax documents */}
            {submittedTaxDocs.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200/60 p-8.5 rounded-3xl text-center space-y-1.5">
                <div className="h-9 w-9 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-sm font-bold border border-slate-200">
                  ⌛
                </div>
                <h4 className="text-xs font-extrabold text-slate-800 font-sans">Aucun dossier fiscal en attente</h4>
                <p className="text-[10.5px] text-slate-500 max-w-sm mx-auto leading-normal font-sans">
                  Aucun citoyen (motard ou investisseur) n'a soumis de télédéclaration d'impôts d'exercice fiscal pour le moment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 text-left">
                {submittedTaxDocs.map((doc) => {
                  const docKey = `tax-note-${doc.id}`;
                  return (
                    <div key={doc.id} className="bg-white border border-slate-205 rounded-3xl p-5 shadow-sm space-y-4">
                      
                      {/* Banner header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-105">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex justify-center items-center text-indigo-600 font-black text-[10px]">
                            TAX
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
                              <span>{doc.userName}</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold ${
                                doc.userRole === "driver" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-blue-100 text-blue-800 border border-blue-200"
                              }`}>
                                {doc.userRole === "driver" ? "Chauffeur / Motard" : "Propriétaire Fleet"}
                              </span>
                            </h4>
                            <p className="text-[9.5px] text-slate-500 mt-0.5 font-sans">
                              Période : <span className="font-bold text-slate-705">{doc.period ?? doc.details?.period ?? ""}</span> • Soumis le {doc.submittedAt}
                            </p>
                          </div>
                        </div>

                        <div>
                          {doc.status === "pending" && (
                            <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase inline-flex items-center gap-1 font-sans animate-pulse">
                              ⏳ En attente de certification
                            </span>
                          )}
                          {doc.status === "approved" && (
                            <span className="bg-emerald-50 text-emerald-750 border border-emerald-100 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase inline-flex items-center gap-1 font-sans">
                              ✓ Certification Accordée
                            </span>
                          )}
                          {doc.status === "rejected" && (
                            <span className="bg-red-50 text-red-750 border border-red-100 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase inline-flex items-center gap-1 font-sans">
                              ✕ Déclinaison administrative
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content values */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-left">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Déclarations de Chiffre d'Affaires</span>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-500 font-sans">Formulaire fiscal :</span>
                            <span className="font-extrabold text-slate-800 font-sans">{doc.docType === "daily_revenue" ? "Fiche de Journée" : "Déclaration Annuelle d'Impôts"}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] pt-1 pt-1 border-t border-slate-100/40">
                            <span className="text-slate-500 font-sans">Revenus d'audit (CDF) :</span>
                            <span className="font-black text-emerald-600 font-mono">{(doc.totalCDF ?? doc.details?.totalCDF ?? 0).toLocaleString()} CDF</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-500 font-sans">Équivalent devises (USD) :</span>
                            <span className="font-black text-yellow-600 font-mono">${(doc.totalUSD ?? doc.details?.totalUSD ?? 0).toFixed(2)} USD</span>
                          </div>
                        </div>

                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-left text-[11px]">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Adresses de Certification</span>
                          <p className="text-slate-650"><b>ID Enregistrement :</b> <span className="font-mono text-[9px] bg-slate-205 px-1.5 py-0.5 rounded text-slate-800">{doc.id}</span></p>
                          <p className="text-slate-650"><b>Siège Social RDC :</b> <span className="font-semibold text-slate-700">{doc.headquartersAddress ?? doc.details?.headquartersAddress ?? "GoMoto Siège National, Kinshasa"}</span></p>
                          <p className="text-slate-655"><b>Adresse Chauffeur :</b> <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-1 py-0.2 rounded">{doc.confidentialUserAddress ?? (doc.userRole === "driver" ? doc.details?.confidentialDriverAddress : doc.details?.confidentialOwnerAddress) ?? "Non-déclarant"}</span></p>
                        </div>
                      </div>

                      {/* Notes & validations */}
                      {doc.status === "pending" ? (
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-stretch justify-between gap-4 text-left">
                          <div className="flex-1">
                            <input
                              type="text"
                              id={docKey}
                              placeholder="Faites part de vos annotations d'audit fiscal (ex: Déclaration admissible, conforme...)"
                              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100"
                            />
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById(docKey) as HTMLInputElement;
                                const val = el ? el.value : "";
                                if (onReviewTaxDoc) {
                                  onReviewTaxDoc(doc.id, "rejected", val);
                                } else {
                                  alert("Mécanisme d'arbitrage fiscal indisponible.");
                                }
                              }}
                              className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 font-extrabold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm font-sans"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Rejeter sous réserve</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById(docKey) as HTMLInputElement;
                                const val = el ? el.value : "Déclaration admissible & certifiée par la commission d'audit.";
                                if (onReviewTaxDoc) {
                                  onReviewTaxDoc(doc.id, "approved", val);
                                } else {
                                  alert("Mécanisme d'arbitrage fiscal indisponible.");
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-1.5 px-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm border border-emerald-500 font-sans"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Acquitter & Certifier</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10.5px] text-slate-500 text-left font-sans italic">
                          <b>Verdict de l'Administration :</b> {doc.adminNotes || "Admissible sans aucune decharge fiscale."}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= ADMIN TAB 4: REAL-TIME GOMOTO SOS EMERGENCY COMMAND CENTER ================= */}
      {activeSubTab === "emergencies" && (
        <div className="space-y-6 text-left">
          {/* Header instructions block */}
          <div className="bg-gradient-to-r from-red-650 to-red-800 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="bg-white/20 text-white font-mono font-black text-[9px] px-2 py-0.5 rounded-full tracking-widest uppercase">
                Directives d'Intervention Spéciales
              </span>
              <h3 className="text-sm md:text-base font-black tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-5.5 h-5.5 text-white animate-bounce animate-[bounce_1s_infinite]" />
                <span>Centre National de Dispatching Routier & SOS GoMoto RDC</span>
              </h3>
              <p className="text-xs text-red-100 max-w-xl font-sans leading-relaxed">
                Supervisez les alertes géolocalisées émises par les motards et les passagers en situation d'urgence. En cas d'appel Panique actif, le centre GoMoto transmet la position immédiatement aux patrouilles de la PNC congolaise.
              </p>
            </div>
            
            <div className="bg-white/10 border border-white/20 px-4 py-3 rounded-2xl shrink-0 text-center md:text-right">
              <span className="text-[10px] text-red-200 block uppercase tracking-wider font-mono">Délai régional cible</span>
              <span className="text-xl font-black font-mono text-yellow-300">⏱️ &lt; 3 mins</span>
            </div>
          </div>

          {/* Quick Metrics of Distress */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
              <span className="text-[9px] font-mono text-slate-400 uppercase block">Total Signaux Enregistrés</span>
              <span className="text-2xl font-black text-slate-800 font-mono mt-1 block">{sosAlerts.length} Dossiers</span>
              <span className="text-[10px] text-slate-500 font-sans block mt-1">Gérés depuis le 1er Janvier 2026</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left relative overflow-hidden">
              <span className="text-[9px] font-mono text-slate-400 uppercase block">Alertes Actives Non Clôturées</span>
              <span className="text-2xl font-black text-red-650 font-mono mt-1 block flex items-center gap-1.5">
                <span>{sosAlerts.filter(a => a.status === "active").length} En Cours</span>
                {sosAlerts.filter(a => a.status === "active").length > 0 && (
                  <span className="h-3 w-3 rounded-full bg-red-600 animate-ping"></span>
                )}
              </span>
              <span className="text-[10px] text-slate-500 font-sans block mt-1">Nécessite priorisation maximale</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
              <span className="text-[9px] font-mono text-slate-400 uppercase block">Performance de Dispatch</span>
              <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">99.4% Conforme</span>
              <span className="text-[10px] text-slate-500 font-sans block mt-1">Conformément aux directives de l'autorité</span>
            </div>
          </div>

          {/* SATELLITE GPS CO-ORDINATES RADAR MAP VISUALIZER */}
          <div className="bg-slate-950 text-white rounded-3xl p-5 border border-slate-800 space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
              <div className="space-y-0.5 text-left font-sans">
                <span className="bg-red-950 text-red-400 font-mono font-bold text-[8px] px-2 py-0.5 rounded tracking-wide border border-red-900/40 uppercase">
                  📡 TÉLÉMÉTRIE D'URGENCE INTERACTIVE
                </span>
                <h4 className="text-xs font-black text-slate-100 uppercase tracking-wide flex items-center gap-1.5 mt-1">
                  <span>Cartographie Satellite de RDC • Kinshasa Grid</span>
                </h4>
              </div>
              <div className="flex items-center gap-2 font-sans">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                <span className="text-[10px] text-slate-400 font-mono">Radar GPS actif • 26 satellites de surveillance</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left Column: Interactive Map Grid SVG */}
              <div className="lg:col-span-2 bg-[#050B14] rounded-2xl border border-[#1E293B] p-3 h-[320px] relative overflow-hidden flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full text-slate-900/60" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="radarGridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#0F172A" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#radarGridPattern)" />
                  
                  {/* Simulated Roads of Gombe Kinshasa */}
                  <line x1="10%" y1="20%" x2="90%" y2="20%" stroke="#1E293B" strokeWidth="3" />
                  <line x1="20%" y1="10%" x2="20%" y2="90%" stroke="#1E293B" strokeWidth="2" />
                  <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="#1E293B" strokeWidth="2.5" />
                  <line x1="10%" y1="60%" x2="90%" y2="60%" stroke="#1E293B" strokeWidth="4" />
                  <line x1="80%" y1="10%" x2="80%" y2="90%" stroke="#1E293B" strokeWidth="2" />
                  
                  {/* Street Names and Text Labels */}
                  <text x="35%" y="24%" fill="#334155" fontSize="7" fontFamily="monospace" fontWeight="bold">Av. Colonel Lukusa</text>
                  <text x="15%" y="56%" fill="#475569" fontSize="8" fontFamily="monospace" fontWeight="bold">BOULEVARD DU 30 JUIN</text>
                  <text x="52%" y="85%" fill="#334155" fontSize="7" fontFamily="monospace" fontWeight="bold">Avenue Landu</text>

                  {/* Pulsing Target pointer */}
                  {sosAlerts.map((a: any) => {
                    const isFocused = focusedSOSId === a.id;
                    const x = a.latitude ? Math.abs((a.latitude % 0.1) * 2000) % 80 + 10 : 50;
                    const y = a.longitude ? Math.abs((a.longitude % 0.1) * 2000) % 80 + 10 : 50;

                    return (
                      <g key={a.id} className="cursor-pointer" onClick={() => setFocusedSOSId(a.id)}>
                        <circle cx={`${x}%`} cy={`${y}%`} r={isFocused ? "16" : "8"} fill="none" stroke={a.status === "active" ? "#EF4444" : "#10B981"} strokeWidth="1.5" className="animate-ping" style={{ transformOrigin: `${x}% ${y}%` }} />
                        <circle cx={`${x}%`} cy={`${y}%`} r="4.5" fill={a.status === "active" ? "#EF4444" : "#10B981"} />
                        
                        {isFocused && (
                          <g>
                            <line x1={`${x - 5}%`} y1={`${y}%`} x2={`${x + 5}%`} y2={`${y}%`} stroke="#EF4444" strokeWidth="1" />
                            <line x1={`${x}%`} y1={`${y - 7}%`} x2={`${x}%`} y2={`${y + 7}%`} stroke="#EF4444" strokeWidth="1" />
                          </g>
                        )}
                        
                        <text x={`${x + 2}%`} y={`${y - 3}%`} fill={isFocused ? "#FFFFFF" : "#94A3B8"} fontSize="8" fontFamily="sans-serif" fontWeight="bold">
                          {a.userName.split(" ")[0]} ({a.status === "active" ? "SOS" : "OK"})
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm border border-slate-800 px-2 py-1 rounded text-[7.5px] font-mono text-slate-400">
                  COORDS FOCUS : {focusedSOSId ? "TRIG." : "RECHERCHE..."}
                </div>
              </div>

              {/* Right Column: Mini Intervention Console Terminal */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between h-[320px] text-left">
                {focusedSOSId ? (() => {
                  const focusedAlert = sosAlerts.find(a => a.id === focusedSOSId);
                  if (!focusedAlert) return <p className="text-slate-500 text-[10px] font-sans">Sélectionnez un signal sur la carte pour émettre un dispatch.</p>;
                  
                  const isBrigadeDispatched = dispatchedBrigades[focusedAlert.id];

                  return (
                    <div className="flex-grow flex flex-col justify-between h-full space-y-3 font-sans">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-red-500 font-extrabold uppercase font-mono tracking-widest block">FICHE CANAL DESPATCH</span>
                          <span className="bg-red-950/80 text-red-400 border border-red-900 px-2 py-0.5 rounded text-[8.5px] font-mono uppercase font-bold">
                            {focusedAlert.id}
                          </span>
                        </div>

                        <div className="text-xs space-y-1 bg-black/40 p-2.5 rounded-xl border border-slate-800/40 text-left">
                          <p className="text-white font-extrabold text-xs">{focusedAlert.userName}</p>
                          <p className="text-[10px] text-slate-450">Détresse : <b className="text-red-400 uppercase italic font-sans">{focusedAlert.reason}</b></p>
                          <p className="text-[9.5px] text-slate-500 font-mono">Tél : {focusedAlert.userPhone}</p>
                          <p className="text-[9px] text-slate-500 font-mono">Vecteur GPS: {focusedAlert.latitude.toFixed(5)}, {focusedAlert.longitude.toFixed(5)}</p>
                        </div>

                        {/* VoIP Live Micro intercom panel */}
                        <div id="voip-live-panel" className="bg-black/80 rounded-xl p-2 border border-slate-800 text-[9px] font-mono space-y-1">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                            <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                              <span className={`h-1 w-1 rounded-full bg-emerald-400 ${sosIntercomActive ? "animate-pulse" : ""}`}></span>
                              INTERCOM VoIP RDC
                            </span>
                            <span className="text-slate-550 text-[8px]">{sosIntercomActive ? "DIRECT" : "MUTÉ"}</span>
                          </div>
                          
                          {sosIntercomActive ? (
                            <div className="space-y-0.5 text-[8px] text-slate-350 max-h-[50px] overflow-y-auto font-mono scroller-hidden">
                              {sosIntercomLog.map((log, i) => (
                                <p key={i}>{log}</p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-500 italic text-[8px] py-1 text-center font-sans">Aucune liaison d'intercom audio ouverte.</p>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleSOSIntercom(focusedAlert.userName)}
                            className={`w-full font-bold py-1 px-2 rounded mt-1.5 text-[8.5px] cursor-pointer text-center flex items-center justify-center gap-1 ${
                              sosIntercomActive 
                                ? "bg-red-650 hover:bg-red-700 text-white" 
                                : "bg-emerald-700 hover:bg-emerald-650 text-white"
                            }`}
                          >
                            🎤 {sosIntercomActive ? "Muter Intercom" : "Ouvrir Intercom"}
                          </button>
                        </div>
                      </div>

                      {/* Dispatch Trigger Controls */}
                      <div className="space-y-1.5 border-t border-slate-800 pt-2 font-sans text-left">
                        <span className="text-[8.5px] text-slate-450 font-bold block uppercase">Escorte de Sécurité de Proximité :</span>
                        
                        {isBrigadeDispatched ? (
                          <div className="p-1 px-2 bg-indigo-950/60 rounded-lg border border-indigo-900 text-[8.5px] font-mono font-bold text-indigo-300 animate-pulse text-center">
                            {isBrigadeDispatched}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDispatchBrigade(focusedAlert.id, "gomoto_sec")}
                              className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-1 rounded text-[8px] cursor-pointer text-center block"
                            >
                              🚀 Centrale GoMoto
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDispatchBrigade(focusedAlert.id, "pnc")}
                              className="bg-rose-700 hover:bg-rose-800 text-white font-bold py-1 rounded text-[8px] cursor-pointer text-center block"
                            >
                              👮 Police PNC
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })() : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-3 text-slate-500 font-sans">
                    <Map className="w-8 h-8 text-slate-700 animate-pulse mb-2" />
                    <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Télémétrie en attente</p>
                    <p className="text-[9px] text-slate-600 max-w-[180px] mt-1 pl-1 pr-1 leading-normal">Sélectionnez une balise SOS rouge sur la carte pour émettre des forces de sécurité.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SOS List Container */}
          {sosAlerts.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 p-10 rounded-2xl text-center space-y-2">
              <div className="h-11 w-11 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto text-sm text-slate-400">
                ☘️
              </div>
              <h4 className="text-xs font-black text-slate-800">Aucune alerte de détresse signalée</h4>
              <p className="text-[10.5px] text-slate-500 max-w-md mx-auto leading-relaxed">
                Le réseau d'escorte GoMoto RDC est actuellement sous sécurité totale. Aucune défaillance ou demande de panique n'est transmise d'urgence.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sosAlerts.map((alert) => {
                const noteInputId = `sos-note-${alert.id}`;
                return (
                  <div 
                    key={alert.id} 
                    className={`bg-white border rounded-3xl p-5 shadow-sm space-y-4 transition-all text-left ${
                      alert.status === "active" ? "border-red-500 ring-2 ring-red-100" : "border-slate-200"
                    }`}
                  >
                    {/* Panel Header Banner */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3 text-left">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black ${
                          alert.status === "active" ? "bg-red-500 text-white animate-pulse" : "bg-slate-150 text-slate-500"
                        }`}>
                          🚨
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
                            <span>{alert.userName}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold ${
                              alert.userRole === "driver" ? "bg-amber-100 text-amber-805" : "bg-purple-100 text-purple-805"
                            }`}>
                              {alert.userRole === "driver" ? "Chauffeur / Motard" : "Passager / Client"}
                            </span>
                          </h4>
                          <p className="text-[10.5px] text-slate-500 mt-0.5">
                            Émis le {alert.timestamp} • Contact : <span className="font-bold text-slate-705">{alert.userPhone}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFocusedSOSId(alert.id)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-1 px-2.5 rounded-lg text-[9px] font-bold uppercase transition-all shadow-xs cursor-pointer mr-1"
                        >
                          👁️ Focaliser Carte
                        </button>

                        {alert.status === "active" ? (
                          <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wide inline-flex items-center gap-1.5 animate-pulse">
                            <span className="h-2.5 w-2.5 rounded-full bg-red-650 animate-ping"></span>
                            Alerte Active
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wide inline-flex items-center gap-1">
                            ✓ Résolu & Clôturé
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content telemetry */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-left animate-in fade-in">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Détails du Signal</span>
                        <p className="text-slate-800 leading-normal font-medium text-xs">
                          <b>Motif déclaré :</b> <span className="text-red-750 font-bold">{alert.reason}</span>
                        </p>
                        <p className="text-slate-500">
                          <b>ID Dispatch :</b> <span className="font-mono text-[9.5px] text-slate-700 bg-slate-205 px-1 py-0.2 rounded font-bold">{alert.id}</span>
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5 text-left font-mono text-[10.5px]">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Vecteur d'Audit Satellitaire</span>
                        <div className="flex justify-between">
                          <span className="text-slate-550">Latitude :</span>
                          <span className="text-indigo-900 font-bold">{alert.latitude.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-550">Longitude :</span>
                          <span className="text-indigo-900 font-bold">{alert.longitude.toFixed(6)}</span>
                        </div>
                        <div className="border-t border-slate-200/50 pt-1 mt-1 flex justify-between text-[8px] text-slate-400 font-sans">
                          <span>Triangulation GPS :</span>
                          <span className="text-yellow-600 font-extrabold uppercase">Validé par GoMoto-Sat</span>
                        </div>
                      </div>
                    </div>

                    {/* Resolution actions */}
                    {alert.status === "active" ? (
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-stretch justify-between gap-4 text-left">
                        <div className="flex-1">
                          <input
                            type="text"
                            id={noteInputId}
                            placeholder="Saisissez vos annotations d'enquête ou constat policiers (ex: Patrouille PNC déployée, situation sous contrôle, fausse alerte...)"
                            className="w-full bg-white border border-slate-202 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none focus:border-red-500 font-sans"
                          />
                        </div>

                        <div className="flex items-center shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById(noteInputId) as HTMLInputElement;
                              const val = el ? el.value.trim() : "";
                              const notes = val || "Alerte de détresse prise en charge par la centrale d'intervention.";
                              if (onResolveSOSAlert) {
                                onResolveSOSAlert(alert.id, notes);
                              } else {
                                alert("Fonction de clôture indisponible actuellement.");
                              }
                            }}
                            className="bg-emerald-650 hover:bg-emerald-700 text-white font-extrabold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm font-sans"
                          >
                            <Check className="w-4 h-4" />
                            <span>Résoudre & Clôturer</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100/60 text-[10.5px] text-slate-700 text-left font-sans italic">
                        <b>Rapport d'Intervention administrative :</b> {alert.resolutionNotes || "Alerte classée sans dérive."}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= ADMIN TAB 5: MOBILE MONEY WITHDRAWALS PAYOUT DISPATCH ================= */}
      {activeSubTab === "transactions" && (
        <div className="space-y-6 text-left">
          
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <span className="bg-blue-100 text-blue-700 font-bold text-[8.5px] px-2.5 py-0.5 rounded-full tracking-wider uppercase font-sans">
                Paiements & Mobile Money Brokerage
              </span>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 mt-1 font-sans">
                <Wallet className="w-5 h-5 text-blue-600" />
                <span>Dispatching National des Décaissements Partenaires</span>
              </h3>
              <p className="text-[11px] text-slate-500 leading-normal max-w-xl font-sans">
                Gérez et validez les transferts sortants demandés par les motards et les propriétaires fleetiens de GoMoto. L'API automatise l'acheminement direct vers les réseaux de téléphonie mobile de RDC.
              </p>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl shrink-0 text-center md:text-right font-sans">
              <span className="text-[9px] text-slate-400 block uppercase block font-bold font-mono">Commission globale collectée</span>
              <span className="text-xl font-mono font-black text-emerald-600">8.42% / Taxe RDC</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-sans">
              <Smartphone className="w-4 h-4 text-blue-605" />
              <span>Demandes de virements M-Pesa / Wave / Airtel / Orange</span>
            </h4>

            {withdrawals.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl text-center">
                <p className="text-xs text-slate-500 font-sans">Aucune demande de retrait mobile money en attente d'arbitrage.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {withdrawals.map((w) => {
                  const notesInputId = `withdr-note-${w.id}`;
                  return (
                    <div 
                      key={w.id} 
                      className={`bg-white border rounded-3xl p-5 shadow-xs flex flex-col lg:flex-row justify-between gap-5 items-stretch transition-all ${
                        w.status === "pending" ? "border-blue-200 ring-1 ring-blue-50/50" : "border-slate-200 bg-slate-50/20"
                      }`}
                    >
                      <div className="flex-1 space-y-4">
                        {/* Header details */}
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-black ${
                            w.operator === "M-Pesa" ? "bg-red-50 text-red-600 border border-red-105" :
                            w.operator === "Orange Money" ? "bg-orange-50 text-orange-600 border border-orange-105" :
                            w.operator === "Airtel Money" ? "bg-rose-50 text-rose-600 border border-rose-105" :
                            "bg-blue-50 text-blue-600 border border-blue-105"
                          }`}>
                            📱
                          </div>

                          <div className="text-left font-sans">
                            <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
                              <span>{w.userName}</span>
                              <span className={`px-2 py-0.2 rounded text-[8px] uppercase tracking-wider font-extrabold ${
                                w.userRole === "driver" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-blue-100 text-blue-800 border border-blue-200"
                              }`}>
                                {w.userRole === "driver" ? "Motard / Chauffeur" : "Propriétaire Flotte"}
                              </span>
                            </h5>
                            <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                              ID Partenaire : <span className="font-mono">{w.userId}</span> • Tél : {w.userPhone}
                            </p>
                          </div>
                        </div>

                        {/* Values grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans text-left">
                          <div className="bg-slate-50/65 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-[8px] font-bold text-slate-400 uppercase font-mono block">Virement Demandé</span>
                            <span className={`font-mono font-extrabold text-[12px] block mt-0.5 ${w.currency === "USD" ? "text-blue-600" : "text-emerald-600"}`}>
                              {w.currency === "USD" ? "$" : ""}{w.amount.toLocaleString()} {w.currency}
                            </span>
                          </div>
                          
                          <div className="bg-slate-50/65 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-[8px] font-bold text-slate-400 uppercase font-mono block">Opérateur mobile RDC</span>
                            <span className="font-extrabold text-slate-800 block mt-0.5 flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                              {w.operator}
                            </span>
                          </div>

                          <div className="bg-slate-50/65 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-[8px] font-bold text-slate-400 uppercase font-mono block">Téléphone de dépôt</span>
                            <span className="font-mono font-bold text-slate-700 block mt-0.5 text-xs">
                              {w.operatorPhone}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right feedback panel */}
                      <div className="flex flex-col justify-between items-end self-stretch lg:border-l lg:border-slate-150 lg:pl-5 shrink-0 lg:w-[260px] gap-3">
                        <div className="flex flex-col items-end w-full text-right font-sans">
                          <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase mb-1">Dossier de Retrait</span>
                          {w.status === "pending" ? (
                            <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider animate-pulse inline-block">
                              ⌛ Retrait en suspens
                            </span>
                          ) : w.status === "approved" ? (
                            <span className="bg-emerald-50 text-emerald-750 border border-emerald-200 px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider inline-block">
                              ✓ Accord de Virement
                            </span>
                          ) : (
                            <span className="bg-red-50 text-red-750 border border-red-200 px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider inline-block">
                              ✕ Bloqué pour suspicion
                            </span>
                          )}
                          <span className="text-[8px] text-slate-400 font-mono block mt-1">Transmis le {w.requestedAt}</span>
                        </div>

                        {w.status === "pending" ? (
                          <div className="w-full space-y-2 text-left">
                            <input
                              type="text"
                              id={notesInputId}
                              placeholder="Notes et références de transaction..."
                              className="w-full bg-slate-50 border border-slate-205 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-850 outline-none focus:bg-white focus:border-blue-600 font-sans"
                            />
                            
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const el = document.getElementById(notesInputId) as HTMLInputElement;
                                  const val = el ? el.value.trim() : "";
                                  handleReviewWithdrawal(w.id, "rejected", val || "Retrait rejeté pour non-conformité.");
                                }}
                                className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 font-black py-1.5 px-2 rounded-lg text-[9.5px] cursor-pointer text-center"
                              >
                                Annuler
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  const el = document.getElementById(notesInputId) as HTMLInputElement;
                                  const val = el ? el.value.trim() : "";
                                  handleReviewWithdrawal(w.id, "approved", val || "Débit validé. Virement API d'opérateur mobile complété.");
                                }}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-1.5 px-2.5 rounded-lg text-[9.5px] cursor-pointer text-center"
                              >
                                Décaisser
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-[9px] text-slate-500 font-sans italic w-full text-left leading-normal">
                            <b>Verdict admin :</b> {w.adminNotes || "Transaction admissible acquittée."}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= ADMIN TAB 6: PARTNERSHIP PORTFOLIO & TELECOM/MOMO AGREEMENTS ================= */}
      {activeSubTab === "partenariats" && (
        <PartnershipProposals onClose={() => setActiveSubTab("requests")} />
      )}

    </div>
  );
}
