/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserProfile, MotorCycle, WalletTransaction, AdminModificationRequest, DRCAddress, SubmittedTaxDocument, DocumentType } from "../types";
import { mockAvenues } from "../data/drcLocations";
import { 
  Plus, 
  MapPin, 
  CreditCard, 
  User, 
  Building, 
  Compass, 
  Award, 
  Lock, 
  Clock, 
  ShieldAlert, 
  Send,
  CheckCircle,
  TrendingUp,
  Settings,
  Grid,
  Percent,
  List,
  AlertTriangle,
  Info,
  LogOut,
  Download,
  FileCheck,
  FileText,
  Users,
  Star,
  Eye,
  Check,
  X
} from "lucide-react";

import { AppLanguage } from "../lib/translations";
import { generateDailyRevenuePDF, generateAnnualTaxPDF, GOMOTO_HQ_ADDRESS, formatDRCAddress } from "../lib/pdfGenerators";

interface OwnerDashboardProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onSubmitModRequest: (request: AdminModificationRequest) => void;
  modRequests: AdminModificationRequest[];
  onLogout: () => void;
  lang?: AppLanguage;
  onSubmitTaxDoc?: (doc: SubmittedTaxDocument) => void;
  submittedTaxDocs?: SubmittedTaxDocument[];
}

export default function OwnerDashboard({
  profile,
  onUpdateProfile,
  onSubmitModRequest,
  modRequests,
  onLogout,
  lang = "fr",
  onSubmitTaxDoc,
  submittedTaxDocs = [],
}: OwnerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"fleet" | "wallet" | "profile" | "fiscalite">("fleet");
  const [docTypeToSubmit, setDocTypeToSubmit] = useState<"daily_revenue" | "annual_tax">("daily_revenue");
  const [periodToSubmit, setPeriodToSubmit] = useState<string>("Aujourd'hui");
  const [submissionFeedback, setSubmissionFeedback] = useState<string>("");

  // Sub tabs for Fleet: 'motos' or 'performances'
  const [fleetSubTab, setFleetSubTab] = useState<"motos" | "performances">("motos");
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // Deep performance metrics for each driver
  const [driversPerformance, setDriversPerformance] = useState<any[]>([
    {
      id: "drv-002",
      name: "Modeste LOBA",
      phone: "+243 897 452 110",
      licenseNumber: "DRC-CH-2024-99812",
      totalRides: 142,
      revenueCDF: 950000,
      revenueUSD: 420.00,
      rating: 4.9,
      completionRate: 98.5,
      status: "active",
      assignedMotoBrand: "Haobin Express Yellow 150cc",
      assignedMotoPlate: "C-MC-5590KIN",
      joinedDate: "15/01/2026",
      avatarBg: "from-amber-500 to-yellow-600",
      recentRides: [
        { id: "rd-101", date: "05/06/2026", route: "Rond-point Victoire ➔ Gombe (Supermarché)", amountCDF: 15000, amountUSD: 6.00, rating: 5, status: "completed" },
        { id: "rd-102", date: "05/06/2026", route: "Limete Echangeur ➔ Bandalungwa", amountCDF: 12000, amountUSD: 5.00, rating: 5, status: "completed" },
        { id: "rd-103", date: "04/06/2026", route: "Kintambo Magasin ➔ UPN", amountCDF: 9000, amountUSD: 3.50, rating: 4, status: "completed" },
        { id: "rd-104", date: "03/06/2026", route: "Gare Centrale ➔ Lemba Terminus", amountCDF: 18000, amountUSD: 7.50, rating: 5, status: "completed" },
        { id: "rd-105", date: "02/06/2026", route: "Château d'eau ➔ Ndjili Quartier 1", amountCDF: 22000, amountUSD: 9.00, rating: 5, status: "completed" }
      ]
    },
    {
      id: "drv-91",
      name: "Dieudonné MBOKOLO",
      phone: "+243 812 345 678",
      licenseNumber: "DRC-CH-2025-45129",
      totalRides: 87,
      revenueCDF: 520000,
      revenueUSD: 210.00,
      rating: 4.7,
      completionRate: 96.2,
      status: "active",
      assignedMotoBrand: undefined,
      assignedMotoPlate: undefined,
      joinedDate: "10/02/2026",
      avatarBg: "from-blue-500 to-indigo-600",
      recentRides: [
        { id: "rd-201", date: "05/06/2026", route: "Palais du Peuple ➔ Marché Central", amountCDF: 8000, amountUSD: 3.20, rating: 5, status: "completed" },
        { id: "rd-202", date: "04/06/2026", route: "UPN ➔ Rond-point Ngaba", amountCDF: 14000, amountUSD: 5.80, rating: 4, status: "completed" },
        { id: "rd-203", date: "03/06/2026", route: "Bandalungwa ➔ Gombe", amountCDF: 11000, amountUSD: 4.50, rating: 5, status: "completed" }
      ]
    },
    {
      id: "drv-92",
      name: "Rachel NYEMBO",
      phone: "+243 854 991 322",
      licenseNumber: "DRC-CH-2026-11043",
      totalRides: 119,
      revenueCDF: 780000,
      revenueUSD: 315.00,
      rating: 4.8,
      completionRate: 97.8,
      status: "active",
      assignedMotoBrand: undefined,
      assignedMotoPlate: undefined,
      joinedDate: "03/03/2026",
      avatarBg: "from-purple-500 to-pink-600",
      recentRides: [
        { id: "rd-301", date: "05/06/2026", route: "Aéroport de Ndjili ➔ Limete (7ème Rue)", amountCDF: 30000, amountUSD: 12.00, rating: 5, status: "completed" },
        { id: "rd-302", date: "05/06/2026", route: "Gombe ➔ Kintambo Magasin", amountCDF: 9500, amountUSD: 4.00, rating: 5, status: "completed" },
        { id: "rd-303", date: "04/06/2026", route: "Lingwala ➔ Rond-point Victoire", amountCDF: 7000, amountUSD: 2.80, rating: 4, status: "completed" }
      ]
    },
    {
      id: "drv-93",
      name: "Christian BANDUNDU",
      phone: "+243 899 123 456",
      licenseNumber: "DRC-CH-2023-88741",
      totalRides: 64,
      revenueCDF: 390000,
      revenueUSD: 155.00,
      rating: 4.5,
      completionRate: 93.5,
      status: "active",
      assignedMotoBrand: undefined,
      assignedMotoPlate: undefined,
      joinedDate: "20/04/2026",
      avatarBg: "from-emerald-500 to-teal-600",
      recentRides: [
        { id: "rd-401", date: "04/06/2026", route: "Pompage ➔ Kintambo Magasin", amountCDF: 6000, amountUSD: 2.50, rating: 5, status: "completed" },
        { id: "rd-402", date: "03/06/2026", route: "Rond-point Ngaba ➔ Limete Echangeur", amountCDF: 13000, amountUSD: 5.20, rating: 4, status: "completed" }
      ]
    }
  ]);

  // Mock fleet list
  const [motos, setMotos] = useState<MotorCycle[]>([]);
  const [showAddMotoModal, setShowAddMotoModal] = useState(false);
  const [motoBrand, setMotoBrand] = useState("TVS Star HLX 150cc");
  const [motoPlate, setMotoPlate] = useState("C-MC-");

  // Wallet payout
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutCurrency, setPayoutCurrency] = useState<"CDF" | "USD">("CDF");
  const [payoutMethod, setPayoutMethod] = useState<"M-Pesa" | "Orange Money" | "Airtel Money">("M-Pesa");

  // Profile recours
  const [showModModal, setShowModModal] = useState(false);
  const [reqFirstName, setReqFirstName] = useState("");
  const [reqLastName, setReqLastName] = useState("");
  const [reqReason, setReqReason] = useState("");
  const [reqDocType, setReqDocType] = useState<DocumentType>("carte_identite_nationale");
  const [reqDocNumber, setReqDocNumber] = useState("");
  const [reqDocPhotoFront, setReqDocPhotoFront] = useState("");
  const [reqDocPhotoBack, setReqDocPhotoBack] = useState("");
  const [reqProfilePicture, setReqProfilePicture] = useState("");

  // Nouveaux champs obligatoires pour l'affiliation Propriétaire-Chauffeur GoMoto RDC
  const [ownerCompleteAddress, setOwnerCompleteAddress] = useState(profile.ownerCompleteAddress || "");
  const [designatedDriverName, setDesignatedDriverName] = useState(profile.designatedDriverName || "");
  const [designatedDriverAddress, setDesignatedDriverAddress] = useState(profile.designatedDriverAddress || "");
  const [designatedDriverIdCard, setDesignatedDriverIdCard] = useState(profile.designatedDriverIdCard || "");
  const [designatedDriverLicense, setDesignatedDriverLicense] = useState(profile.designatedDriverLicense || "");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");

  useEffect(() => {
    setOwnerCompleteAddress(profile.ownerCompleteAddress || "");
    setDesignatedDriverName(profile.designatedDriverName || "");
    setDesignatedDriverAddress(profile.designatedDriverAddress || "");
    setDesignatedDriverIdCard(profile.designatedDriverIdCard || "");
    setDesignatedDriverLicense(profile.designatedDriverLicense || "");
  }, [profile]);

  useEffect(() => {
    // Generate initial sample fleet owned by this user
    const initialMotos: MotorCycle[] = [
      {
        id: "moto-x1",
        ownerId: profile.id,
        brand: "Haobin Express Yellow 150cc",
        plateNumber: "C-MC-5590KIN",
        assignedDriverId: "drv-002",
        status: "active"
      },
      {
        id: "moto-x2",
        ownerId: profile.id,
        brand: "TVS Sport 125cc Eco",
        plateNumber: "C-MC-1209KIN",
        assignedDriverId: undefined,
        status: "available"
      }
    ];
    setMotos(initialMotos);

    // Initial business payouts
    const initialTransactions: WalletTransaction[] = [
      {
        id: "tx-own-1",
        userId: profile.id,
        amount: 150000,
        currency: "CDF",
        type: "commission",
        method: "Wallet_System",
        status: "completed",
        date: "02/06/2026 à 07:05"
      },
      {
        id: "tx-own-2",
        userId: profile.id,
        amount: 80,
        currency: "USD",
        type: "commission",
        method: "Wallet_System",
        status: "completed",
        date: "01/06/2026 à 18:30"
      }
    ];
    setTransactions(initialTransactions);

    // Default plate number based on Province
    setMotoPlate("C-MC-" + Math.floor(1000 + Math.random() * 9000) + "KIN");
  }, []);

  const handleSaveDesignation = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !ownerCompleteAddress.trim() ||
      !designatedDriverName.trim() ||
      !designatedDriverAddress.trim() ||
      !designatedDriverIdCard.trim() ||
      !designatedDriverLicense.trim()
    ) {
      alert("⚠️ Tous les champs d'affiliation obligatoire doivent être remplis.");
      return;
    }

    onUpdateProfile({
      ...profile,
      ownerCompleteAddress: ownerCompleteAddress.trim(),
      designatedDriverName: designatedDriverName.trim(),
      designatedDriverAddress: designatedDriverAddress.trim(),
      designatedDriverIdCard: designatedDriverIdCard.trim(),
      designatedDriverLicense: designatedDriverLicense.trim(),
    });

    setSaveSuccessMessage("✓ Vos informations d'affiliation obligatoire ont été enregistrées avec succès !");
    setTimeout(() => {
      setSaveSuccessMessage("");
    }, 5000);
  };

  const handleAddNewMoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motoBrand.trim() || !motoPlate.trim()) {
      alert("Tous les champs sont requis pour enregistrer une moto.");
      return;
    }

    const newMoto: MotorCycle = {
      id: "moto-" + Math.random().toString(36).substr(2, 6),
      ownerId: profile.id,
      brand: motoBrand,
      plateNumber: motoPlate.toUpperCase(),
      status: "available"
    };

    setMotos(prev => [...prev, newMoto]);
    setShowAddMotoModal(false);
    setMotoBrand("TVS Star HLX 150cc");
    alert("Motocyclette enregistrée avec succès dans votre flotte d'investissement ! Elle est prête pour l'affectation d'un motard.");
  };

  const handleAssignDriver = (motoId: string) => {
    // Selected moto
    const moto = motos.find(m => m.id === motoId);
    if (!moto) return;

    // Simulated driver names and credentials standard for DRC
    const drivers = [
      { id: "drv-91", name: "Dieudonné MBOKOLO" },
      { id: "drv-92", name: "Rachel NYEMBO" },
      { id: "drv-93", name: "Christian BANDUNDU" }
    ];

    const chosen = drivers[Math.floor(Math.random() * drivers.length)];

    // Update motos assigned driver 
    setMotos(prev => prev.map(m => {
      if (m.id === motoId) {
        return {
          ...m,
          assignedDriverId: chosen.id,
          status: "active"
        };
      }
      return m;
    }));

    // Also update driversPerformance assigned moto
    setDriversPerformance(prev => prev.map(drv => {
      if (drv.id === chosen.id) {
        return {
          ...drv,
          assignedMotoBrand: moto.brand,
          assignedMotoPlate: moto.plateNumber,
          status: "active" as const
        };
      }
      return drv;
    }));

    alert(`Chauffeur partenaire [${chosen.name}] affecté avec succès à la moto ! Traçabilité active.`);
  };

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawNum = parseFloat(payoutAmount);
    if (!withdrawNum || withdrawNum <= 0) return;

    let balanceCheck = payoutCurrency === "CDF" ? profile.walletBalanceCDF : profile.walletBalanceUSD;
    if (balanceCheck < withdrawNum) {
      alert("Votre solde disponible dans votre portefeuille est insuffisant.");
      return;
    }

    let finalCDF = profile.walletBalanceCDF;
    let finalUSD = profile.walletBalanceUSD;

    if (payoutCurrency === "CDF") {
      finalCDF -= withdrawNum;
    } else {
      finalUSD -= withdrawNum;
    }

    const newTx: WalletTransaction = {
      id: "tx-pay-own-" + Math.random().toString(36).substr(2, 6),
      userId: profile.id,
      amount: withdrawNum,
      currency: payoutCurrency,
      type: "withdrawal",
      method: payoutMethod as any,
      status: "completed",
      date: new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })
    };

    setTransactions(prev => [newTx, ...prev]);
    onUpdateProfile({
      ...profile,
      walletBalanceCDF: finalCDF,
      walletBalanceUSD: parseFloat(finalUSD.toFixed(2))
    });

    setShowPayoutModal(false);
    setPayoutAmount("");
    alert(`Retrait d'investisseur initié de ${withdrawNum} ${payoutCurrency} via ${payoutMethod}. Arrivée immédiate.`);
  };

  const handleTaxDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmitTaxDoc) return;

    // Fleet owners calculate based on total revenue or standard estimates
    let totalCDF = 1450000;
    let totalUSD = 550.00;

    const newDoc: SubmittedTaxDocument = {
      id: "tax-doc-" + Math.random().toString(36).substr(2, 6),
      userId: profile.id,
      userName: profile.firstName + " " + profile.lastName,
      userRole: "owner",
      docType: docTypeToSubmit,
      period: periodToSubmit,
      totalUSD: totalUSD,
      totalCDF: totalCDF,
      confidentialUserAddress: formatDRCAddress(profile.address),
      headquartersAddress: GOMOTO_HQ_ADDRESS,
      submittedAt: new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      status: "pending"
    };

    onSubmitTaxDoc(newDoc);
    setSubmissionFeedback("Félicitations ! Votre télédéclaration fiscale de propriétaire-gérant a été enregistrée avec succès par GoMoto.");
    setTimeout(() => {
      setSubmissionFeedback("");
    }, 6500);
  };

  const handleSendModificationRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqFirstName.trim() || !reqLastName.trim() || !reqReason.trim()) {
      alert("Tous les champs obligatoires (Prénom, Nom, Motif) sont requis pour soumettre le recours.");
      return;
    }

    const newRequest: AdminModificationRequest = {
      id: "req-" + Math.random().toString(36).substr(2, 7),
      userId: profile.id,
      userRole: "owner",
      currentFirstName: profile.firstName,
      currentLastName: profile.lastName,
      requestedFirstName: reqFirstName,
      requestedLastName: reqLastName,
      requestedDocType: reqDocType,
      requestedDocNumber: reqDocNumber,
      requestedDocPhotoFront: reqDocPhotoFront || undefined,
      requestedDocPhotoBack: reqDocPhotoBack || undefined,
      requestedProfilePicture: reqProfilePicture || undefined,
      reason: reqReason,
      status: "pending",
      submittedAt: new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })
    };

    onSubmitModRequest(newRequest);
    setShowModModal(false);
    setReqFirstName("");
    setReqLastName("");
    setReqReason("");
    setReqDocNumber("");
    setReqDocPhotoFront("");
    setReqDocPhotoBack("");
    setReqProfilePicture("");
    alert("Dossier d'état civil d'investisseur et de pièces administratives transmis pour audit d'arbitrage.");
  };

  const handleSimulateNewRide = (driverId: string) => {
    // Kinshasa dynamic routes
    const routes = [
      "Marché Central ➔ Kintambo Magasin",
      "Victoire ➔ Boulevard du 30 Juin",
      "UPN ➔ Rond-point Triangulaire",
      "Limete 7e Rue ➔ Gare Centrale",
      "Aéroport de Ndjili ➔ Gombe (La Gousse)",
      "Bandalungwa ➔ Palais de la Nation",
      "Mbinza Ma Campagne ➔ Rond-point Ngaba"
    ];

    const randomRoute = routes[Math.floor(Math.random() * routes.length)];
    const randomFareCDF = Math.floor(6 + Math.random() * 20) * 1000; // 6000 CDF to 25000 CDF
    const randomFareUSD = parseFloat((randomFareCDF / 2500).toFixed(2)); // rate ~2500 CDF/USD
    
    // 15% commission goes to owner wallet!
    const ownerCommissionRate = 0.15;
    const ownerEarnedCDF = Math.floor(randomFareCDF * ownerCommissionRate);
    const ownerEarnedUSD = parseFloat((randomFareUSD * ownerCommissionRate).toFixed(2));

    // Update driversPerformance
    let driverName = "";
    setDriversPerformance(prev => prev.map(drv => {
      if (drv.id === driverId) {
        driverName = drv.name;
        const newRide = {
          id: "rd-" + Math.floor(1000 + Math.random() * 9000),
          date: new Date().toLocaleDateString("fr-FR"),
          route: randomRoute,
          amountCDF: randomFareCDF,
          amountUSD: randomFareUSD,
          rating: Math.random() > 0.15 ? 5 : 4,
          status: "completed" as const
        };
        return {
          ...drv,
          totalRides: drv.totalRides + 1,
          revenueCDF: drv.revenueCDF + randomFareCDF,
          revenueUSD: parseFloat((drv.revenueUSD + randomFareUSD).toFixed(2)),
          recentRides: [newRide, ...drv.recentRides]
        };
      }
      return drv;
    }));

    // Update owner balances
    onUpdateProfile({
      ...profile,
      walletBalanceCDF: profile.walletBalanceCDF + ownerEarnedCDF,
      walletBalanceUSD: parseFloat((profile.walletBalanceUSD + ownerEarnedUSD).toFixed(2))
    });

    // Add wallet transaction to owner ledger
    const newTx: WalletTransaction = {
      id: "tx-own-sim-" + Math.random().toString(36).substr(2, 6),
      userId: profile.id,
      amount: ownerEarnedCDF,
      currency: "CDF",
      type: "commission",
      method: "Wallet_System",
      status: "completed",
      date: new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    };
    setTransactions(prev => [newTx, ...prev]);

    alert(`Simulation réussie ! Le chauffeur ${driverName} a validé une course [${randomRoute}] pour ${randomFareCDF.toLocaleString()} CDF. Vos commissions de 15% (+${ownerEarnedCDF.toLocaleString()} CDF) ont été créditées en direct sur votre solde de propriétaire.`);
  };

  const handleAwardBonus = (driverId: string) => {
    const bonusStr = prompt("Saisissez le montant du bonus à octroyer à ce chauffeur (en CDF) :", "15000");
    if (!bonusStr) return;

    const bonusAmount = parseInt(bonusStr);
    if (isNaN(bonusAmount) || bonusAmount <= 0) {
      alert("Montant de bonus non valide.");
      return;
    }

    if (profile.walletBalanceCDF < bonusAmount) {
      alert("Votre solde en CDF est insuffisant pour octroyer ce bonus.");
      return;
    }

    // Deduct bonus from owner wallet
    onUpdateProfile({
      ...profile,
      walletBalanceCDF: profile.walletBalanceCDF - bonusAmount
    });

    // Add expense transaction
    const bonusTx: WalletTransaction = {
      id: "tx-bonus-" + Math.random().toString(36).substr(2, 6),
      userId: profile.id,
      amount: bonusAmount,
      currency: "CDF",
      type: "withdrawal",
      method: "M-Pesa",
      status: "completed",
      date: new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    };
    setTransactions(prev => [bonusTx, ...prev]);

    alert(`Félicitations ! Vous avez accordé un bonus d'encouragement de ${bonusAmount.toLocaleString()} CDF directement au portefeuille mobile de votre chauffeur de confiance.`);
  };

  return (
    <div id="owner-screen-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto">
      
      {/* LEFT COLUMN: Sidebar, role branding, logout */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Owner details card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-yellow-500 text-slate-950 font-black text-[9px] px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            Propriétaire / Fleet Manager
          </div>

          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-yellow-500 font-bold overflow-hidden">
              <Building className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                <span>{profile.firstName} {profile.lastName}</span>
                <CheckCircle className="w-3.5 h-3.5 text-yellow-500 fill-slate-950" />
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Contact d'Immatriculation : {profile.phone}</p>
              
              <div className="flex items-center gap-1.5 mt-1 border-t border-slate-800/60 pt-1">
                <span className="text-[10px] text-slate-500">Motos sous contrat : <b>{motos.length} motos</b></span>
              </div>
            </div>
          </div>

          {/* Wallet divisions */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800/60 font-sans">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-center">
              <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest block">Revenus CDF</span>
              <span className="text-xs font-black text-emerald-400 block mt-0.5">{profile.walletBalanceCDF.toLocaleString("fr-FR")} CDF</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-center">
              <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest block">Revenus USD</span>
              <span className="text-xs font-black text-yellow-500 block mt-0.5">${profile.walletBalanceUSD.toFixed(2)} USD</span>
            </div>
          </div>

          {/* Tabs switch */}
          <div className="flex gap-1.5 mt-5 bg-slate-950 p-1.5 rounded-xl border border-slate-850/80">
            <button
              type="button"
              onClick={() => setActiveTab("fleet")}
              className={`flex-1 text-center py-2 rounded-lg text-[10px] font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "fleet" ? "bg-yellow-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Ma Flotte
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("wallet")}
              className={`flex-1 text-center py-2 rounded-lg text-[10px] font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "wallet" ? "bg-yellow-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Portefeuille
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex-1 text-center py-2 rounded-lg text-[10px] font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "profile" ? "bg-yellow-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Compte 🔒
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("fiscalite")}
              className={`flex-1 text-center py-2 rounded-lg text-[10px] font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "fiscalite" ? "bg-yellow-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Fiscalité
            </button>
          </div>
        </div>

        {/* Global safety warning block */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-center">
          <p className="text-[10px] text-slate-400 italic">
            "GoMoto RDC Investisseur : Assurez la conformité d'assurance d'immatriculation d'État pour votre flotte."
          </p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-4 w-full bg-slate-950 hover:bg-red-950/20 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/35 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Se déconnecter de GoMoto</span>
          </button>
        </div>

      </div>

      {/* RIGHT COLUMN: Fleet list details, ledger transactions, locked profile recours */}
      <div className="lg:col-span-8 space-y-6">

        {/* ================= TAB 1: FLEET & MOTORCYCLE LIST ================= */}
        {activeTab === "fleet" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-850/60">
              <div>
                <h3 className="font-black text-slate-100 text-sm">Gestion de Flotte de Transport d'Investissement</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Enregistrer des motos et recruter des motards accrédités</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMotoModal(true)}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Enregistrer Moto v2.0</span>
              </button>
            </div>

            {/* Sub-tabs Selection */}
            <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3" id="fleet-subtabs">
              <button
                type="button"
                onClick={() => setFleetSubTab("motos")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  fleetSubTab === "motos"
                    ? "bg-slate-800 text-yellow-500 border border-slate-700 shadow-md"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-900"
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>Mes Motocyclettes ({motos.length})</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFleetSubTab("performances")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer relative ${
                  fleetSubTab === "performances"
                    ? "bg-slate-800 text-yellow-500 border border-slate-700 shadow-md"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-900"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Performances Chauffeurs ({driversPerformance.length})</span>
                <span className="absolute -top-1.5 -right-1.5 bg-yellow-500 text-slate-950 text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse border border-slate-900">
                  {driversPerformance.filter(d => d.assignedMotoBrand).length}
                </span>
              </button>
            </div>

            {/* Sub-tab Content 1: MOTORCYCLE LIST */}
            {fleetSubTab === "motos" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="fleet-motos-grid">
                {motos.length > 0 ? (
                  motos.map((m) => (
                    <div key={m.id} className="bg-slate-950 rounded-2xl p-4.5 border border-slate-850 hover:border-slate-750 transition-all space-y-3 shadow-md text-left">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-black text-slate-200">{m.brand}</h4>
                          <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">Immatriculation: <b>{m.plateNumber}</b></span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase ${
                          m.status === "active" ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40" : "bg-blue-950 text-blue-400 border border-blue-900/40"
                        }`}>
                          {m.status === "active" ? "En operation" : "disponible"}
                        </span>
                      </div>

                      {/* Assigned driver stats */}
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 text-xs">
                        {m.assignedDriverId ? (
                          (() => {
                            const driverInfo = driversPerformance.find(d => d.id === m.assignedDriverId);
                            const dName = driverInfo ? driverInfo.name : "Modeste LOBA";
                            return (
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                                  <span className="text-slate-350 text-[10px]">Chauffeur Assigné : <b className="text-slate-200">{dName}</b></span>
                                </div>
                                <span className="text-[8.5px] text-yellow-500 font-bold">Traceur GPS Actif</span>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 text-[10px]">Aucun chauffeur associé</span>
                            <button
                              type="button"
                              onClick={() => handleAssignDriver(m.id)}
                              className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black px-2.5 py-1 rounded text-[9px] transition-all cursor-pointer"
                            >
                              Assigner Chauffeur
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-xs text-slate-500 col-span-2">Aucune motocyclette enregistrée dans votre flotte.</p>
                )}
              </div>
            )}

            {/* Sub-tab Content 2: DRIVER PERFORMANCES */}
            {fleetSubTab === "performances" && (
              <div className="space-y-4" id="fleet-performances-section">
                
                {/* Informational advice banner */}
                <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-850 text-xs text-slate-350 space-y-1 text-left">
                  <span className="text-[9px] font-mono text-yellow-500 font-black uppercase tracking-wider block">CONSEIL DE RENDEMENT DE FLOTTE</span>
                  <p className="leading-normal text-slate-400 text-[10.5px]">
                    Assurez le suivi du rendement contractuel de vos chauffeurs de flotte. Les performances sont enregistrées en direct grâce aux balises de télémétrie civile GoMoto. Cliquez sur <b>Consulter Détails</b> pour analyser les rapports de courses ou distribuer des primes.
                  </p>
                </div>

                {/* Driver cards index */}
                <div className="grid grid-cols-1 gap-3.5">
                  {driversPerformance.map((drv) => {
                    const isAssigned = !!drv.assignedMotoBrand;
                    return (
                      <div 
                        key={drv.id} 
                        className={`bg-slate-950 border rounded-2xl p-4 transition-all duration-155 text-left hover:border-slate-700 ${
                          isAssigned ? "border-slate-850" : "border-slate-900 opacity-80"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          
                          {/* Left Block: Avatar & Core Information */}
                          <div className="flex items-center gap-3">
                            <div className={`h-11 w-11 rounded-xl bg-gradient-to-tr ${drv.avatarBg || 'from-slate-700 to-slate-800'} flex items-center justify-center font-black text-slate-950 text-sm shrink-0`}>
                              {drv.name.split(" ").map((n: string) => n[0]).join("")}
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                                <span>{drv.name}</span>
                                {isAssigned ? (
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                ) : (
                                  <span className="h-1.5 w-1.5 rounded-full bg-slate-600"></span>
                                )}
                              </h4>
                              <p className="text-[9.5px] text-slate-500 font-mono">
                                Permis : {drv.licenseNumber} • {drv.phone}
                              </p>
                              
                              <div className="flex items-center gap-1.5 pt-0.5">
                                {isAssigned ? (
                                  <span className="bg-emerald-950/70 text-emerald-400 border border-emerald-900/35 rounded-md px-2 py-0.5 text-[8px] font-extrabold uppercase">
                                    En service (Immatriculation : {drv.assignedMotoPlate})
                                  </span>
                                ) : (
                                  <span className="bg-slate-900 text-slate-550 border border-slate-850/60 rounded-md px-2 py-0.5 text-[8px] font-extrabold uppercase">
                                    En attente d'affectation moto
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Block: Stats Summaries */}
                          <div className="grid grid-cols-3 gap-2 w-full md:w-auto text-left shrink-0">
                            <div className="bg-slate-900/40 border border-slate-850/70 rounded-xl px-2.5 py-1.5 min-w-[70px]">
                              <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wider block">Courses</span>
                              <span className="text-xs font-mono font-black text-slate-200 mt-0.5 block">{drv.totalRides} trajets</span>
                            </div>
                            
                            <div className="bg-slate-900/40 border border-slate-850/70 rounded-xl px-2.5 py-1.5 min-w-[110px]">
                              <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wider block">Revenus bruts</span>
                              <span className="text-xs font-mono font-black text-emerald-400 mt-0.5 block">
                                {drv.revenueCDF.toLocaleString("fr-FR")} CDF
                              </span>
                            </div>

                            <div className="bg-slate-900/40 border border-slate-850/70 rounded-xl px-2.5 py-1.5 min-w-[65px]">
                              <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wider block">Note RDC</span>
                              <span className="text-xs font-mono font-black text-yellow-500 mt-0.5 block flex items-center gap-0.5">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />
                                <span>{drv.rating}</span>
                              </span>
                            </div>
                          </div>

                          {/* Action CTA Block */}
                          <div className="shrink-0 w-full md:w-auto">
                            <button
                              type="button"
                              onClick={() => setSelectedDriverId(drv.id)}
                              className="w-full md:w-auto bg-slate-900 hover:bg-slate-850 text-yellow-500 border border-slate-800 hover:border-slate-700 font-extrabold py-2 px-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm uppercase tracking-wide"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Consulter</span>
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* Split division chart snippet decoration */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex items-start gap-3 text-left">
              <Percent className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-extrabold text-white">Ratio d'Investissement & Partage de gains</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                  Chaque trajet effectué par vos chauffeurs assignés est soumis aux ratios contractuels de RDC de partage de gains de transport. Les revenus de versement sont nets de commissions GoMoto de 15% et se versent directement sur votre solde de propriétaire, retirable de manière instantanée.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 2: PORTFOLIO / WALLET SYSTEM ================= */}
        {activeTab === "wallet" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-100 text-sm">Portefeuille d'Investisseur d'État</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Compatible avec tous les versements M-Pesa, Orange Money et Airtel Money RDC</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPayoutModal(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Demander Retrait d'Investisseur</span>
              </button>
            </div>

            {/* Balances displays */}
            <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Mon Solde Investisseur (CDF)</span>
                <span className="text-2xl font-mono font-black text-emerald-400 block">{profile.walletBalanceCDF.toLocaleString("fr-FR")} CDF</span>
                <span className="text-[10px] text-slate-500 block">Dernier versement de flotte automatique</span>
              </div>

              <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800 md:pl-6 pt-4 md:pt-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Mon Solde Investisseur (USD)</span>
                <span className="text-2xl font-mono font-black text-yellow-500 block">${profile.walletBalanceUSD.toFixed(2)} USD</span>
                <span className="text-[10px] text-slate-500 block">Taux de transaction garanti</span>
              </div>
            </div>

            {/* Transactions lists */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Versements de Flotte enregistrés</span>
              </h4>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="divide-y divide-slate-850">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-3 bg-slate-900/40 flex justify-between items-center text-xs hover:bg-slate-900/80 transition-all">
                      <div className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${tx.type === 'withdrawal' ? 'bg-amber-400' : 'bg-emerald-500'}`}></span>
                        <div>
                          <span className="font-extrabold text-slate-200">
                            {tx.type === "withdrawal" ? "Retrait propriétaire" : "Versement de course par flotte"}
                          </span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">{tx.date} • {tx.method}</span>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs">
                        <span className={`font-bold ${tx.type === 'withdrawal' ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {tx.type === "withdrawal" ? "-" : "+"}
                          {tx.amount.toLocaleString()} {tx.currency}
                        </span>
                        <span className="text-[8px] block text-slate-500 uppercase font-bold tracking-widest mt-0.5">Validé</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 3: LOCKED PROFILE / IDENTITY ARCHIVE ================= */}
        {activeTab === "profile" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-100 text-sm">Dossier Fiscal de Propriétaire</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Identifiants d'immatriculation bloqués pour des raisons fiscales et juridiques</p>
              </div>
              <span className="bg-amber-950/60 text-amber-500 border border-amber-900/40 px-3 py-1 rounded-xl font-bold flex items-center gap-1 text-[9px] uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" />
                <span>Bloqué d'office</span>
              </span>
            </div>

            {/* Read-Only text inputs with Padlocks */}
            <div className="bg-amber-950/20 border border-amber-500/35 p-4 rounded-xl text-[10.5px] text-amber-200">
              <span className="font-bold flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Avis de non-modifiabilité :</span>
              </span>
              <p className="mt-1 text-slate-400 leading-normal">
                Les coordonnées d'immatriculation d'un propriétaire de flotte de motos sont verrouillées après l'enrôlement officiel. Tout manquement fiscal s'expose à des pénalités civiles de l'Hôtel de ville. Pour toute modification légitime, veuillez soumettre votre recours officiel.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase block">Prénom(s) (Lecture uniquement)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.firstName}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-855 text-slate-450 rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none cursor-not-allowed select-none font-bold"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-600 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase block font-sans">Nom de Famille</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.lastName}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-855 text-slate-455 rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none cursor-not-allowed select-none font-bold"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-600 absolute right-3.5 top-3.5" />
                </div>
              </div>
            </div>

            {/* ================= SECTION AFFILIATION OBLIGATOIRE ================= */}
            <form onSubmit={handleSaveDesignation} className="border-t border-slate-800 pt-5 space-y-4">
              <div className="flex justify-between items-center bg-slate-950 p-3.5 rounded-2xl border border-slate-855">
                <div>
                  <h4 className="text-xs font-black text-yellow-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-yellow-500" />
                    <span>Affiliation Obligatoire GoMoto RDC</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Enregistrement légal du propriétaire et du chauffeur motard désigné</p>
                </div>
                {ownerCompleteAddress && designatedDriverName && designatedDriverAddress && designatedDriverIdCard && designatedDriverLicense ? (
                  <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-900/50 px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dossier Complet</span>
                  </span>
                ) : (
                  <span className="bg-amber-950/80 text-amber-500 border border-amber-900/50 px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Incomplet (Action Requise)</span>
                  </span>
                )}
              </div>

              {saveSuccessMessage && (
                <div id="save-success-banner" className="bg-emerald-950/70 border border-emerald-500/30 p-3.5 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {/* Propriétaire section */}
                <div className="bg-slate-950/45 p-4 rounded-2xl border border-slate-855/60 space-y-3">
                  <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block font-mono">1. Coordonnées Obligatoires du Propriétaire</span>
                  
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-bold text-slate-400 uppercase block">Votre Adresse Résidentielle Complète en RDC *</label>
                    <textarea
                      rows={2}
                      required
                      value={ownerCompleteAddress}
                      onChange={(e) => setOwnerCompleteAddress(e.target.value)}
                      placeholder="Ex: N° 45, Avenue de la Justice, Quartier Gombe, Kinshasa, RDC"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-yellow-500 font-medium"
                    />
                  </div>
                </div>

                {/* Chauffeur section */}
                <div className="bg-slate-950/45 p-4 rounded-2xl border border-slate-855/60 space-y-3">
                  <span className="text-[10px] font-extrabold text-yellow-500 uppercase tracking-widest block font-mono font-sans">2. Désignation Civile du Chauffeur Motard</span>

                  <div className="space-y-1">
                    <label className="text-[9.5px] font-bold text-slate-400 uppercase block">Nom Complet du Chauffeur Motard Désigné *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={designatedDriverName}
                        onChange={(e) => setDesignatedDriverName(e.target.value)}
                        placeholder="Ex: Jean Mukoko Kabeya"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-3 pr-10 py-2.5 text-xs text-white outline-none focus:border-yellow-500 font-bold"
                      />
                      <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-400 uppercase block">Numéro de Carte d'Identité du Chauffeur *</label>
                      <input
                        type="text"
                        required
                        value={designatedDriverIdCard}
                        onChange={(e) => setDesignatedDriverIdCard(e.target.value)}
                        placeholder="Ex: CD-ID-8849201-B"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-yellow-500 font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-400 uppercase block font-sans">Permis de Conduire du Chauffeur *</label>
                      <input
                        type="text"
                        required
                        value={designatedDriverLicense}
                        onChange={(e) => setDesignatedDriverLicense(e.target.value)}
                        placeholder="Ex: CD-DRV-774130"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-yellow-500 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] font-bold text-slate-400 uppercase block">Adresse Complète de Résidence Secrète du Chauffeur *</label>
                    <textarea
                      rows={2}
                      required
                      value={designatedDriverAddress}
                      onChange={(e) => setDesignatedDriverAddress(e.target.value)}
                      placeholder="Ex: N° 12, Avenue Bobozo, Quartier Kingabwa, Commune de Limete, Kinshasa"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-yellow-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Core advisory banner for owner */}
              <div className="bg-yellow-500/10 border border-yellow-500/25 p-4 rounded-xl text-slate-350 space-y-2">
                <span className="font-bold text-yellow-500 flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-yellow-500" />
                  <span>Instruction Impérative Relativo GoMoto RDC :</span>
                </span>
                <p className="text-[10.5px] text-slate-300 leading-normal font-sans">
                  En tant que Propriétaire légal, il est strictement obligatoire de demander à votre chauffeur motard désigné <b className="text-yellow-400">{designatedDriverName || "(spécifié ci-dessus)"}</b> d'effectuer également à son tour sa propre demande d'affiliation et d'inscription en direct sur la plateforme <span className="text-yellow-400 font-extrabold">GoMoto RDC</span>. Les enrôlements doubles croisés sont l'unique moyen de valider l'historique d'audit d'État.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-6 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Enregistrer l'Affiliation du Chauffeur</span>
                </button>
              </div>
            </form>

            {/* Recours Submission area for owner */}
            <div className="border-t border-slate-800 pt-5 space-y-4">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">Introduire un Recours de Propriétaire</h4>
              <p className="text-[11px] text-slate-400">
                Besoin de modifier votre statut de partenariat ou documents ? Soumettez votre recours complet.
              </p>

              {modRequests.filter(req => req.userId === profile.id).map((req, i) => (
                <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-855 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-extrabold text-slate-300">Demande de correction civile</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">Soumis le : {req.submittedAt}</span>
                    <span className="text-[10px] text-yellow-500 block mt-1">Noms requis : {req.requestedFirstName} {req.requestedLastName}</span>
                  </div>
                  <span className="bg-amber-950 text-yellow-500 border border-yellow-500/20 px-2.5 py-1 rounded text-[10px] font-bold">
                    Dossier sous commission Admin
                  </span>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setShowModModal(true)}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-2.5 px-6 rounded-xl text-xs transition-all flex items-center gap-1 shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Soumettre Arbitrage</span>
              </button>
            </div>

          </div>
        )}

      </div>

      {/* ================= RECOURS MODAL ================= */}
      {showModModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl relative text-slate-100">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-yellow-500" />
              <span>Dossier d'Arbitrage Fiscal : Identité / Pièces</span>
            </h3>

            <form onSubmit={handleSendModificationRequest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nouveau Prénom civil souhaité</label>
                  <input
                    type="text"
                    placeholder="Ex: Patient"
                    value={reqFirstName}
                    onChange={(e) => setReqFirstName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-yellow-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nouveau Nom Civil souhaité</label>
                  <input
                    type="text"
                    placeholder="Ex: MBUYI"
                    value={reqLastName}
                    onChange={(e) => setReqLastName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-yellow-500 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Document Modification Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2 pt-2 border-t border-slate-800">
                <div className="md:col-span-2 text-xs font-bold text-yellow-500 uppercase tracking-wider">
                  🔑 Pièces de commerce à re-soumettre (facultatif)
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-sans">Type de Document</label>
                  <select
                    value={reqDocType}
                    onChange={(e) => setReqDocType(e.target.value as DocumentType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-yellow-500 font-bold"
                  >
                    <option value="carte_identite_nationale">Carte d'Identité Nationale</option>
                    <option value="passeport">Passeport</option>
                    <option value="permis_de_conduire">Permis de Conduire</option>
                    <option value="document_etranger">Document Étranger</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Numéro du Document</label>
                  <input
                    type="text"
                    placeholder="Ex: CD-ID-8849-B"
                    value={reqDocNumber}
                    onChange={(e) => setReqDocNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-yellow-500 font-mono font-bold"
                  />
                </div>

                {/* Doc photo front */}
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Photo Recto du document</span>
                  <div className="border border-dashed border-slate-800 bg-slate-950 rounded-xl p-2.5 text-center relative flex flex-col items-center justify-center min-h-[70px]">
                    {reqDocPhotoFront ? (
                      <div className="relative">
                        <img src={reqDocPhotoFront} className="h-10 object-contain rounded" />
                        <button type="button" onClick={() => setReqDocPhotoFront("")} className="absolute -top-1.5 -right-1.5 bg-red-955 text-red-100 border border-red-900 rounded-full p-0.5 text-[8px] font-bold">✕</button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = () => setReqDocPhotoFront(r.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <span className="text-[10px] font-bold text-yellow-500 font-sans">Choisir Recto</span>
                        <span className="text-[8px] text-slate-500 font-sans">PNG/JPG max 5MB</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Doc photo back */}
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Photo Verso du document</span>
                  <div className="border border-dashed border-slate-800 bg-slate-950 rounded-xl p-2.5 text-center relative flex flex-col items-center justify-center min-h-[70px]">
                    {reqDocPhotoBack ? (
                      <div className="relative">
                        <img src={reqDocPhotoBack} className="h-10 object-contain rounded" />
                        <button type="button" onClick={() => setReqDocPhotoBack("")} className="absolute -top-1.5 -right-1.5 bg-red-955 text-red-100 border border-red-900 rounded-full p-0.5 text-[8px] font-bold">✕</button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = () => setReqDocPhotoBack(r.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <span className="text-[10px] font-bold text-yellow-500 font-sans">Choisir Verso</span>
                        <span className="text-[8px] text-slate-500 font-sans">PNG/JPG max 5MB</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-sans">Motif légitime du changement</label>
                <textarea
                  rows={2}
                  placeholder="Justification légale et notariale..."
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-yellow-500 leading-relaxed font-sans"
                  required
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModModal(false)}
                  className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-2.5 rounded-xl text-xs cursor-pointer transition-all font-sans"
                >
                  Soumettre Demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TAB 4: FISCALITÉ & DÉCLARATION SYSTEM ================= */}
      {activeTab === "fiscalite" && (
        <div id="owner-fiscalite-panel" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-left space-y-6">
          
          {/* Header banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-yellow-500" />
                <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">Fisc National RDC (Hôtel de Ville de Kinshasa)</span>
              </div>
              <h3 className="text-base font-black text-slate-100 uppercase tracking-wide">
                Déclaration Fiscale d'Investisseur-Gérant
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Générez vos decharges de revenus pour l’ensemble de votre flotte de moto-taxis et transmettez vos bordereaux d'impôts au dôme d'arbitrage.
              </p>
            </div>
            <div className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-center self-start md:self-auto">
              Cadre Régulé d'Investissement
            </div>
          </div>

          {/* Address cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 relative font-sans">
              <span className="absolute top-2.5 right-2.5 text-yellow-500 font-sans">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Adresse du Siège Social</span>
              <span className="text-[11px] font-semibold text-slate-350 block mt-1.5">
                {GOMOTO_HQ_ADDRESS}
              </span>
              <span className="text-[8.5px] text-slate-500 block mt-1">Siège National Règlementaire GoMoto Kinshasa Gombe</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 relative font-sans">
              <span className="absolute top-2.5 right-2.5 text-yellow-500">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Adresse Privée du Propriétaire</span>
              <span className="text-[11px] font-semibold text-slate-350 block mt-1.5">
                {formatDRCAddress(profile.address)}
              </span>
              <span className="text-[8.5px] text-slate-500 block mt-1">Donnée confidentielle d'audit, masquée au public</span>
            </div>
          </div>

          {/* Downloads */}
          <div className="space-y-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-sans font-extrabold">1. Formulaires & Fiches d'exercices d'impôts de la flotte</span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-left">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-3.5">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block">Rapport Journalier</span>
                  <h4 className="text-xs font-extrabold text-slate-200">Bilan Consolidé de Flotte</h4>
                  <p className="text-[10px] text-slate-450 leading-relaxed">
                    Rapport certifié de la journée pour l’ensemble des motos-taxis immatriculées sous votre gérance d'État.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const doc = generateDailyRevenuePDF(profile, []);
                    doc.save(`GoMoto_Bilan_Flotte_Journalier_${profile.firstName}_${profile.lastName}.pdf`);
                  }}
                  className="w-full bg-slate-850 hover:bg-slate-750 text-slate-200 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-755 transition-all text-center"
                >
                  <Download className="w-4 h-4 text-yellow-500" />
                  <span>Bordereau Journalier de Flotte</span>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-3.5">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Fiche Annuelle</span>
                  <h4 className="text-xs font-extrabold text-slate-200">Déclaration d'Impôts Annuelle</h4>
                  <p className="text-[10px] text-slate-455 leading-relaxed">
                    Dossier de décharge de taxes de l'Hôtel de Ville requis pour l'exercice fiscal annuel réglementé en République Démocratique du Congo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const doc = generateAnnualTaxPDF(profile, []);
                    doc.save(`GoMoto_Declaration_Impots_Flotte_${profile.firstName}_${profile.lastName}.pdf`);
                  }}
                  className="w-full bg-slate-850 hover:bg-slate-750 text-slate-200 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-755 transition-all text-center"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Déclaration d'Impôts Annuelle</span>
                </button>
              </div>
            </div>
          </div>

          {/* Submission Form */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-extrabold">2. Envoyer la télédéclaration pour approbation</span>
            
            <form onSubmit={handleTaxDocSubmit} className="space-y-4 font-sans text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-405 uppercase mb-1">Nature de la décharge fiscale</label>
                  <select
                    value={docTypeToSubmit}
                    onChange={(e: any) => setDocTypeToSubmit(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-yellow-500 font-bold"
                  >
                    <option value="daily_revenue">Revenus consolidés journaliers de flotte (PDF)</option>
                    <option value="annual_tax">Déclaration annuelle d'impôts sur les bénéfices (PDF)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-405 uppercase mb-1">Période du Rôle d'Impôts</label>
                  <select
                    value={periodToSubmit}
                    onChange={(e) => setPeriodToSubmit(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-yellow-500 font-bold"
                  >
                    <option value="Aujourd'hui">Aujourd'hui (Journalier)</option>
                    <option value="Trimestre Actif Q2 2026">Trimestre Actif Q2 2026</option>
                    <option value="Exercice Impôt Annuel 2026">Exercice Impôt Annuel 2026</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-850 grid grid-cols-2 gap-4 text-center">
                <div>
                  <span className="text-[8px] font-extrabold text-slate-550 block uppercase">Gains de Flotte Declarés</span>
                  <span className="text-xs font-black text-emerald-400 block mt-0.5">1 450 000 CDF</span>
                </div>
                <div>
                  <span className="text-[8px] font-extrabold text-slate-550 block uppercase font-sans">Gains de Flotte en USD Equivalent</span>
                  <span className="text-xs font-black text-yellow-500 block mt-0.5">$550.00 USD</span>
                </div>
              </div>

              {submissionFeedback && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-extrabold text-center">
                  ✓ {submissionFeedback}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-yellow-550 hover:bg-yellow-500 text-slate-950 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md text-center"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmettre la décharge fiscale</span>
              </button>
            </form>
          </div>

          {/* Submission History */}
          <div className="space-y-3 font-sans">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-extrabold">Historique d'audit d'État de gérant</span>
            
            {submittedTaxDocs.filter(d => d.userId === profile.id).length === 0 ? (
              <div className="p-5 text-center text-slate-500 bg-slate-950 border border-slate-850 rounded-2xl text-[11px] font-bold">
                Aucun dossier fiscal soumis à la commission pour le moment.
              </div>
            ) : (
              <div className="space-y-2.5">
                {submittedTaxDocs.filter(d => d.userId === profile.id).map((doc) => (
                  <div key={doc.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-white font-sans">
                          {doc.docType === "daily_revenue" ? "Revenus Journaliers consolidés" : "Déclaration Annuelle d'Impôts de Flotte"}
                        </span>
                        <span className="text-[10px] text-slate-500 font-sans">({doc.period ?? doc.details?.period ?? ""})</span>
                      </div>
                      <div className="text-[9px] text-slate-455 font-mono">
                        ID Dossier: {doc.id} • Télédéclaré le: {doc.submittedAt}
                      </div>
                      <div className="text-[10px] text-slate-350">
                        Revenus Flotte certifiés : <span className="font-extrabold text-emerald-400 font-mono">{(doc.totalCDF ?? doc.details?.totalCDF ?? 1450000).toLocaleString()} CDF</span> (~<span className="font-bold text-yellow-500 font-mono">${(doc.totalUSD ?? doc.details?.totalUSD ?? 550).toFixed(2)} USD</span>)
                      </div>
                      {doc.adminNotes && (
                        <div className="text-[10px] text-amber-400 bg-slate-900 border border-slate-850 px-2.5 py-1 rounded-lg mt-1">
                          ⚠️ <b>Note de l'Administration :</b> {doc.adminNotes}
                        </div>
                      )}
                    </div>

                    <div>
                      {doc.status === "pending" && (
                        <span className="px-3 py-1 rounded-full text-[9px] font-extrabold bg-slate-900 text-slate-400 border border-slate-800 uppercase tracking-wider animate-pulse font-sans">
                          ⏳ Sous examen civil
                        </span>
                      )}
                      {doc.status === "approved" && (
                        <span className="px-3 py-1 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-550/20 uppercase tracking-wide font-sans">
                          ✓ Certifié & Acquitté
                        </span>
                      )}
                      {doc.status === "rejected" && (
                        <span className="px-3 py-1 rounded-full text-[9px] font-extrabold bg-red-500/10 text-red-400 border border-red-550/20 uppercase tracking-wide font-sans">
                          ✕ Rejeté sous réserve
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ================= ADD MOTORCYCLE MODAL ================= */}
      {showAddMotoModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Compass className="w-5 h-5 text-yellow-500" />
              <span>Enregistrer une Motocyclette d'État</span>
            </h3>

            <form onSubmit={handleAddNewMoto} className="space-y-4 font-sans">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Marque / Modèle de la Moto</label>
                <select
                  value={motoBrand}
                  onChange={(e) => setMotoBrand(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none"
                >
                  <option value="Haobin Express HL 150cc">Haobin Express HL 150cc</option>
                  <option value="TVS Star HLX 150cc">TVS Star HLX 150cc</option>
                  <option value="Bajaj Boxer BM 150">Bajaj Boxer BM 150</option>
                  <option value="Senke Hawk 150cc">Senke Hawk 150cc</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Numéro de Plaque d'État</label>
                <input
                  type="text"
                  value={motoPlate}
                  onChange={(e) => setMotoPlate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-yellow-500 font-mono font-bold"
                  placeholder="Ex: C-MC-4490KIN"
                  required
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-[9px] text-slate-500 text-left">
                <AlertTriangle className="w-4 h-4 text-yellow-500 float-left mr-1.5" />
                <span>
                  L'immatriculation d'État est soumise à la déclaration civile de vignette de la province. Tout fausse plaque s'expose à saisie immédiate du véhicule.
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMotoModal(false)}
                  className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-350 font-bold py-2 rounded-xl text-xs cursor-pointer transition-all"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-2 rounded-xl text-xs cursor-pointer transition-all shadow-md"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= WITHDRAW INVESTOR REVENUES MODAL ================= */}
      {showPayoutModal && (
        <div id="owner-withdrawal-modal-cover" className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-yellow-500" />
              <span>Retrait de gains de Flotte</span>
            </h3>

            <form onSubmit={handleWithdrawal} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Montant à retirer</label>
                  <input
                    type="number"
                    min="5000"
                    placeholder="Ex: 50000"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-yellow-500 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Devise</label>
                  <select
                    value={payoutCurrency}
                    onChange={(e) => setPayoutCurrency(e.target.value as "CDF" | "USD")}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-yellow-500 font-bold"
                  >
                    <option value="CDF">Franc Congolais (CDF)</option>
                    <option value="USD">Dollar Américain (USD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Opérateur de versement</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod("M-Pesa")}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all ${
                      payoutMethod === "M-Pesa" ? "bg-orange-500/10 border-orange-500 text-orange-500" : "bg-slate-950 border-slate-850 text-slate-400"
                    }`}
                  >
                    M-Pesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod("Orange Money")}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all ${
                      payoutMethod === "Orange Money" ? "bg-amber-600/10 border-amber-600 text-amber-500" : "bg-slate-950 border-slate-850 text-slate-400"
                    }`}
                  >
                    Orange Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod("Airtel Money")}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all ${
                      payoutMethod === "Airtel Money" ? "bg-red-500/10 border-red-500 text-red-500" : "bg-slate-950 border-slate-850 text-slate-400"
                    }`}
                  >
                    Airtel Money
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-[9.5px] text-slate-500 text-left">
                <Info className="w-3.5 h-3.5 text-blue-400 float-left mr-1.5" />
                <span>
                  Le transfert de solde s'effectuera directement via votre compte Mobile Money configuré. Des frais d'opérateur mobile s'appliquent.
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-350 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs cursor-pointer transition-all"
                >
                  Confirmer le Retrait
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DETAILED INDIVIDUAL DRIVER PERFORMANCE VIEW MODAL ================= */}
      {selectedDriverId && (() => {
        const drv = driversPerformance.find(d => d.id === selectedDriverId);
        if (!drv) return null;
        const isAssigned = !!drv.assignedMotoBrand;

        // Splits definitions: 15% owner commission / 85% driver net earnings
        const ownerCommissionCDF = Math.floor(drv.revenueCDF * 0.15);
        const driverShareCDF = Math.floor(drv.revenueCDF * 0.85);
        const ownerCommissionUSD = parseFloat((drv.revenueUSD * 0.15).toFixed(2));
        const driverShareUSD = parseFloat((drv.revenueUSD * 0.85).toFixed(2));

        return (
          <div id="driver-performance-modal" className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative space-y-6 my-8">
              
              {/* Absolutes Close */}
              <button 
                type="button"
                onClick={() => setSelectedDriverId(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white transition-all cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title Header */}
              <div className="space-y-1 text-left">
                <span className="text-[9px] font-mono text-yellow-500 font-black uppercase tracking-widest block">AUDIT CIVIL DE PERFORMANCE DE FLOTTE</span>
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-yellow-500" />
                  <span>Analyse de Rentabilité Individuelle</span>
                </h3>
              </div>

              {/* Driver identity details bar */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850 flex flex-col sm:flex-row items-center gap-4 text-left">
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-tr ${drv.avatarBg || 'from-yellow-400 to-amber-600'} flex items-center justify-center font-black text-slate-950 text-2xl shrink-0 shadow-lg`}>
                  {drv.name.split(" ").map((n: string) => n[0]).join("")}
                </div>

                <div className="space-y-1 w-full sm:w-auto">
                  <h4 className="text-base font-black text-slate-100 flex items-center gap-2 flex-wrap">
                    <span>{drv.name}</span>
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded text-[8.5px] uppercase tracking-wider font-extrabold">
                      Chauffeur Accrédité d'État
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Permis National : <b>{drv.licenseNumber}</b> • {drv.phone}
                  </p>
                  <p className="text-[10.5px] text-slate-500">
                    Rattaché à votre flotte active depuis l'enrôlement le {drv.joinedDate || "01/01/2026"}
                  </p>
                </div>
              </div>

              {/* Assignment warning or current linked vehicle details */}
              <div className="text-left">
                {isAssigned ? (
                  <div className="bg-emerald-950/20 border border-emerald-900/35 p-3 rounded-xl flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                    <p className="text-[10.5px] text-emerald-400 leading-normal">
                      Ce chauffeur est actuellement en service sur votre moto : <b>{drv.assignedMotoBrand}</b> (Plaque provinciale : <b>{drv.assignedMotoPlate}</b>). Balise de traçabilité GPS civile active.
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-950/20 border border-amber-900/35 p-3 rounded-xl flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-[10.5px] text-amber-400 leading-normal">
                      Ce chauffeur n'est affecté à aucun de vos véhicules de flotte d'investissement. Les revenus se mettront à jour après assignation.
                    </p>
                  </div>
                )}
              </div>

              {/* Core Financials Metrics grid (CDF & USD splits detailed view) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850">
                  <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest block font-sans">Trajets Effectués</span>
                  <span className="text-xl font-mono font-black text-slate-100 mt-1.5 block">{drv.totalRides} courses</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Taux de complétion: {drv.completionRate}%</span>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850">
                  <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest block font-sans">Revenus Bruts CDF</span>
                  <span className="text-xl font-mono font-black text-emerald-400 mt-1.5 block">{drv.revenueCDF.toLocaleString("fr-FR")} CDF</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Basé sur le tarificateur national</span>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850">
                  <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest block font-sans">Revenus Bruts USD</span>
                  <span className="text-xl font-mono font-black text-yellow-500 mt-1.5 block">${drv.revenueUSD.toFixed(2)} USD</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Taux fixe certifié</span>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850">
                  <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest block font-sans font-extrabold">Cote de Confiance</span>
                  <span className="text-xl font-mono font-black text-yellow-500 mt-1.5 block flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span>{drv.rating}</span>
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Note moyenne des voyageurs</span>
                </div>
              </div>

              {/* Dynamic split visualization cards */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left divide-y sm:divide-y-0 sm:divide-l divide-slate-850">
                <div className="space-y-1">
                  <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest block">Versement Part Chauffeur (85%)</span>
                  <span className="text-base font-mono font-black text-slate-350 block">
                    {driverShareCDF.toLocaleString("fr-FR")} CDF
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500 block">
                    ${driverShareUSD.toFixed(1)} USD
                  </span>
                  <p className="text-[9px] text-slate-550 pt-1 leading-normal">
                    Revenu net versé directement sur le portefeuille M-Pesa/Orange Money individuel du motard partenaire après prélèvement.
                  </p>
                </div>

                <div className="pt-3.5 sm:pt-0 sm:pl-4 space-y-1">
                  <span className="text-[8.5px] font-black text-yellow-550 uppercase tracking-widest block">Votre Solde de Propriétaire Net (15%)</span>
                  <span className="text-base font-mono font-black text-yellow-500 block">
                    +{ownerCommissionCDF.toLocaleString("fr-FR")} CDF
                  </span>
                  <span className="text-xs font-mono font-bold text-yellow-600 block">
                    +${ownerCommissionUSD.toFixed(1)} USD
                  </span>
                  <p className="text-[9px] text-slate-550 pt-1 leading-normal">
                    Votre commission nette de 15% d'investisseur-gérant, automatiquement disponible dans votre portefeuille de propriétaire.
                  </p>
                </div>
              </div>

              {/* Action Operations Block (highly interactive simulation capabilities) */}
              <div className="bg-slate-950/40 p-4.5 rounded-2xl border border-slate-850/80 space-y-4">
                <div className="text-left space-y-0.5">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Console d'Actions de Gestion d'Actifs</h4>
                  <p className="text-[10px] text-slate-500">Actions d'encouragement et de simulation d'activité pour valider la comptabilité en direct</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSimulateNewRide(drv.id)}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Simuler une Course Réussie</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAwardBonus(drv.id)}
                    className="w-full bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 hover:border-slate-650 font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span>Octroyer Prime de Rendement</span>
                  </button>
                </div>
              </div>

              {/* Recent journeys scrollable log (Kinshasa telemetry) */}
              <div className="space-y-3 text-left">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span>Derniers trajets enregistrés (Télémétrie GoMoto)</span>
                </h4>

                <div className="bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden">
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-850" id="driver-rides-log">
                    {drv.recentRides && drv.recentRides.length > 0 ? (
                      drv.recentRides.map((ride: any) => (
                        <div key={ride.id} className="p-3 bg-slate-900/40 hover:bg-slate-900/80 transition-all flex justify-between items-center text-xs">
                          <div className="space-y-1">
                            <span className="font-extrabold text-slate-200 block text-[11px] leading-snug">
                              {ride.route}
                            </span>
                            <span className="text-[9px] text-slate-500 block">
                              Trajet #{ride.id} • Validé le {ride.date}
                            </span>
                          </div>

                          <div className="text-right shrink-0 ml-4 font-mono">
                            <span className="text-emerald-400 font-bold block text-xs">
                              +{ride.amountCDF.toLocaleString("fr-FR")} CDF
                            </span>
                            <span className="text-slate-500 text-[10px] block">
                              ~${ride.amountUSD.toFixed(1)} USD
                            </span>
                            <div className="flex gap-0.5 justify-end mt-0.5">
                              {Array.from({ length: ride.rating }).map((_, i) => (
                                <Star key={i} className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="p-5 text-center text-xs text-slate-500">Aucun trajet enregistré pour le moment.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button footer bar */}
              <div className="pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setSelectedDriverId(null)}
                  className="w-full bg-slate-800 hover:bg-slate-750 text-slate-350 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all uppercase tracking-wider"
                >
                  Fermer le profil du chauffeur
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
