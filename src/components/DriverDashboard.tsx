/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserProfile, RideRequest, WalletTransaction, AdminModificationRequest, DRCAddress, RideMessage, RideReview, SubmittedTaxDocument, SOSAlert, DocumentType } from "../types";
import { mockAvenues, getRandomAvenue } from "../data/drcLocations";
import MapSimulator from "./MapSimulator";
import DriverMapTracking from "./DriverMapTracking";
import EmergencySOS from "./EmergencySOS";
import WeatherAlert from "./WeatherAlert";
import DriverBadgeGenerator from "./DriverBadgeGenerator";
import { generateDailyRevenuePDF, generateAnnualTaxPDF, GOMOTO_HQ_ADDRESS, formatDRCAddress } from "../lib/pdfGenerators";
import { cacheWalletBalance, cacheRidesHistory } from "../lib/offlineIndexedDB";
import { 
  Compass, 
  MapPin, 
  CreditCard, 
  User, 
  Navigation, 
  DollarSign, 
  TrendingUp, 
  Camera, 
  Clock, 
  ShieldAlert, 
  Lock, 
  Send,
  CheckCircle,
  Smartphone,
  ChevronRight,
  Star,
  Activity,
  LogOut,
  Bell,
  Check,
  X,
  RefreshCw,
  Eye,
  Award,
  Plus,
  MessageSquare,
  Gift,
  Share2,
  Copy,
  Download,
  FileText,
  FileCheck,
  Building,
  Key
} from "lucide-react";
import { AppLanguage, translations } from "../lib/translations";

interface DriverDashboardProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onSubmitModRequest: (request: AdminModificationRequest) => void;
  modRequests: AdminModificationRequest[];
  onLogout: () => void;
  lang?: AppLanguage;
  onSubmitTaxDoc?: (doc: SubmittedTaxDocument) => void;
  submittedTaxDocs?: SubmittedTaxDocument[];
  onTriggerSOS?: (alert: SOSAlert) => void;
  sosAlerts?: SOSAlert[];
}

export default function DriverDashboard({
  profile,
  onUpdateProfile,
  onSubmitModRequest,
  modRequests,
  onLogout,
  lang = "fr",
  onSubmitTaxDoc,
  submittedTaxDocs = [],
  onTriggerSOS,
  sosAlerts = [],
}: DriverDashboardProps) {
  const [activeTab, setActiveTab] = useState<"courses" | "wallet" | "ratings" | "profile" | "badge" | "history" | "fiscalite">("courses");
  const [localTime, setLocalTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Congo time (Kinshasa UTC+1 / Lubumbashi UTC+2). Just display local format for the user
      setLocalTime(now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const [useGoogleMaps, setUseGoogleMaps] = useState<boolean>(() => {
    const saved = localStorage.getItem("gomoto_use_google_maps_driver");
    return saved === "true";
  });
  const [offlineModeSimulated, setOfflineModeSimulated] = useState<boolean>(false);
  const [offlinePendingRides, setOfflinePendingRides] = useState<RideRequest[]>(() => {
    const saved = localStorage.getItem(`gomoto_driver_offline_pending_rides_${profile.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [docTypeToSubmit, setDocTypeToSubmit] = useState<"daily_revenue" | "annual_tax">("daily_revenue");
  const [periodToSubmit, setPeriodToSubmit] = useState<string>("Aujourd'hui");
  const [submissionFeedback, setSubmissionFeedback] = useState<string>("");
  const [completedRides, setCompletedRides] = useState<RideRequest[]>(() => {
    const saved = localStorage.getItem(`gomoto_driver_rides_history_${profile.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    const initialRides: RideRequest[] = [
      {
        id: "ride-drv-101",
        clientId: "client-id-abc",
        clientName: "Rachel NYEMBO",
        clientPhone: "+243 998 440 119",
        pickupAddress: {
          province: "Kinshasa",
          city: "Kinshasa",
          commune: "Ngaliema",
          quartier: "Binza Pigeon",
          localite: "Ozone",
          avenue: "Avenue de la Justice",
          number: "44"
        },
        dropoffAddress: {
          province: "Kinshasa",
          city: "Kinshasa",
          commune: "Gombe",
          quartier: "Utexafrica",
          localite: "Utex",
          avenue: "Boulevard du 30 Juin",
          number: "112"
        },
        status: "completed",
        priceCDF: 15000,
        priceUSD: 5.5,
        distanceKm: 7.1,
        driverId: profile.id,
        driverName: profile.firstName + " " + profile.lastName,
        driverPhone: profile.phone,
        timestamp: "03/06/2026 à 11:10"
      },
      {
        id: "ride-drv-102",
        clientId: "client-id-xyz",
        clientName: "Placide MBALA",
        clientPhone: "+243 821 555 333",
        pickupAddress: {
          province: "Kinshasa",
          city: "Kinshasa",
          commune: "Limete",
          quartier: "Industriel",
          localite: "7ème Rue",
          avenue: "Avenue de l'Industrie",
          number: "98"
        },
        dropoffAddress: {
          province: "Kinshasa",
          city: "Kinshasa",
          commune: "Gombe",
          quartier: "Centre-Ville",
          localite: "Gare Centrale",
          avenue: "Avenue de la Nation",
          number: "20"
        },
        status: "completed",
        priceCDF: 10000,
        priceUSD: 3.8,
        distanceKm: 5.4,
        driverId: profile.id,
        driverName: profile.firstName + " " + profile.lastName,
        driverPhone: profile.phone,
        timestamp: "02/06/2026 à 16:45"
      }
    ];
    localStorage.setItem(`gomoto_driver_rides_history_${profile.id}`, JSON.stringify(initialRides));
    return initialRides;
  });

  const [selectedHistoryRide, setSelectedHistoryRide] = useState<string | null>("ride-drv-101");
  
  // Presence state
  const [isOnline, setIsOnline] = useState<boolean>(profile.isOnline);
  const [showSelfieModal, setShowSelfieModal] = useState<boolean>(false);
  const [selfieRawData, setSelfieRawData] = useState<string>("");
  const [isSelfieCaptured, setIsSelfieCaptured] = useState<boolean>(false);
  
  // High-fidelity facial recognition API states
  const [facialStep, setFacialStep] = useState<"idle" | "ready" | "capturing" | "scanning" | "matched" | "mismatched">("idle");
  const [facialProgress, setFacialProgress] = useState<number>(0);
  const [facialMatchScore, setFacialMatchScore] = useState<number>(0);
  const [facialScanLog, setFacialScanLog] = useState<string>("Prêt pour le scan biométrique.");
  const [simulatedSelfieType, setSimulatedSelfieType] = useState<"conform" | "fraud">("conform");

  // Available Rides Queue
  const [availableRides, setAvailableRides] = useState<RideRequest[]>([]);
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);
  const [rideToConfirm, setRideToConfirm] = useState<RideRequest | null>(null);
  const [rideStatus, setRideStatus] = useState<RideRequest["status"] | "idle">("idle");
  const [driverPos, setDriverPos] = useState({ x: 60, y: 300 });
  const [passengerPos, setPassengerPos] = useState({ x: 240, y: 220 });

  // Wallet and transactions
  const [isWalletUnlocked, setIsWalletUnlocked] = useState(false);
  const [walletPinInput, setWalletPinInput] = useState("");
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutCurrency, setPayoutCurrency] = useState<"CDF" | "USD">("CDF");
  const [payoutMethod, setPayoutMethod] = useState<"M-Pesa" | "Orange Money" | "Airtel Money" | "Virement Bancaire">("M-Pesa");

  const [ridePinInput, setRidePinInput] = useState("");
  const [ridePinError, setRidePinError] = useState<string | null>(null);
  
  // 2FA OTP security states for driver payouts
  const [withdrawalOtpSent, setWithdrawalOtpSent] = useState<boolean>(false);
  const [withdrawalGeneratedOtp, setWithdrawalGeneratedOtp] = useState<string>("");
  const [withdrawalEnteredOtp, setWithdrawalEnteredOtp] = useState<string>("");
  const [withdrawalOtpError, setWithdrawalOtpError] = useState<string | null>(null);
  const [withdrawalOtpNotify, setWithdrawalOtpNotify] = useState<string | null>(null);

  // Commission & Expense Share dynamic calculator states
  const [calcAmount, setCalcAmount] = useState<number>(15000);
  const [calcCurrency, setCalcCurrency] = useState<"CDF" | "USD">("CDF");
  const [calcOwnerPercent, setCalcOwnerPercent] = useState<number>(20); // Default owner versement of 20%
  const [fuelPaidBy, setFuelPaidBy] = useState<"driver" | "owner" | "split">("driver");
  const [maintenancePaidBy, setMaintenancePaidBy] = useState<"driver" | "owner" | "split">("owner");

  // Referral (Parrainage) states
  const [invitedName, setInvitedName] = useState("");
  const [invitedPhone, setInvitedPhone] = useState("+243 ");
  const [referralFeedback, setReferralFeedback] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Ride History Search & Filter states
  const [historySearchQuery, setHistorySearchQuery] = useState<string>("");
  const [historyPriceRange, setHistoryPriceRange] = useState<string>("all");

  // Profile Modification states
  const [showModModal, setShowModModal] = useState(false);
  const [reqFirstName, setReqFirstName] = useState("");
  const [reqLastName, setReqLastName] = useState("");
  const [reqReason, setReqReason] = useState("");
  const [reqDocType, setReqDocType] = useState<DocumentType>("carte_identite_nationale");
  const [reqDocNumber, setReqDocNumber] = useState("");
  const [reqDocPhotoFront, setReqDocPhotoFront] = useState("");
  const [reqDocPhotoBack, setReqDocPhotoBack] = useState("");
  const [reqProfilePicture, setReqProfilePicture] = useState("");

  // Messaging & Interactive Ratings states
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [messages, setMessages] = useState<RideMessage[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>("");
  const [reviewsHistory, setReviewsHistory] = useState<RideReview[]>([]);

  // Real-time Emergency SOS Panique system
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [sosReason, setSosReason] = useState<"kidnapping" | "agression" | "autre" | " font-sans">("");
  const [sosStatus, setSosStatus] = useState<"idle" | "triggered" | "connecting" | "transmitting" | "confirmed">("idle");
  const [sosCoords, setSosCoords] = useState<{ lat: number; lng: number }>({ lat: -4.325 + (Math.random() - 0.5) * 0.01, lng: 15.312 + (Math.random() - 0.5) * 0.01 }); // Default Kinshasa / Gombe center coordinates
  const [sosLogs, setSosLogs] = useState<string[]>([]);
  const [isSosSilent, setIsSosSilent] = useState(false);

  // Partenariats Réseau Télécoms RDC (Vodacom, Orange, Airtel)
  const [telSimNumber, setTelSimNumber] = useState<string>(profile.telecomPhoneSim || "");
  const [telOperator, setTelOperator] = useState<"vodacom" | "orange" | "airtel">(profile.telecomOperator || "vodacom");
  const [telSecuredAPN, setTelSecuredAPN] = useState<boolean>(profile.telecomSecuredAPN || true);
  const [telAutoRenew, setTelAutoRenew] = useState<boolean>(profile.telecomAutoRenew || true);
  const [telPlanPaidByGoMoto, setTelPlanPaidByGoMoto] = useState<boolean>(profile.telecomPlanPaidByGoMoto || false);
  const [isTelSubmitting, setIsTelSubmitting] = useState<boolean>(false);
  const [telFeedback, setTelFeedback] = useState<string>("");

  // Dual Enrollment Cross-Affiliation State Hooks
  const [driverEnrollmentCodeInput, setDriverEnrollmentCodeInput] = useState<string>("");
  const [driverCrossStatus, setDriverCrossStatus] = useState<string>(() => {
    let statusKey = "gomoto_cross_verification_usr-owner-441";
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      if (key.startsWith("gomoto_cross_verification_")) {
        statusKey = key;
        break;
      }
    }
    return localStorage.getItem(statusKey) || "pending";
  });
  const [driverCrossFeedback, setDriverCrossFeedback] = useState<string>("");
  const [isValidatingEnrollment, setIsValidatingEnrollment] = useState<boolean>(false);

  // Helper to fetch details of the linked owner from local storage
  const getLinkedOwnerDetails = () => {
    let foundOwnerId = "";
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      if (key.startsWith("gomoto_owner_enrollment_code_")) {
        foundOwnerId = key.split("gomoto_owner_enrollment_code_")[1];
        break;
      }
    }
    if (!foundOwnerId) foundOwnerId = "usr-owner-441";
    const usersStr = localStorage.getItem("gomoto_users") || "[]";
    try {
      const users = JSON.parse(usersStr);
      const owner = users.find((u: any) => u.id === foundOwnerId || u.role === "owner");
      return owner;
    } catch (e) {
      return null;
    }
  };

  // Sync cross status from localStorage on interval
  useEffect(() => {
    const syncStatus = () => {
      let statusKey = "gomoto_cross_verification_usr-owner-441";
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || "";
        if (key.startsWith("gomoto_cross_verification_")) {
          statusKey = key;
          break;
        }
      }
      const st = localStorage.getItem(statusKey) || "pending";
      setDriverCrossStatus(st);
    };
    syncStatus();
    const iv = setInterval(syncStatus, 3000);
    return () => clearInterval(iv);
  }, []);

  const handleValidateCrossEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverEnrollmentCodeInput.trim()) {
      setDriverCrossFeedback("⚠️ Veuillez saisir le code transmis par votre propriétaire.");
      return;
    }

    setIsValidatingEnrollment(true);
    setDriverCrossFeedback("");

    setTimeout(() => {
      setIsValidatingEnrollment(false);
      const codeInput = driverEnrollmentCodeInput.trim().toUpperCase();

      // Find if there is any generated code in local storage
      let foundOwnerId = "usr-owner-441";
      let actualCode = "";
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || "";
        if (key.startsWith("gomoto_owner_enrollment_code_")) {
          foundOwnerId = key.split("gomoto_owner_enrollment_code_")[1];
          actualCode = (localStorage.getItem(key) || "").trim().toUpperCase();
          break;
        }
      }

      const isValidFormat = codeInput.startsWith("GOMOTO-RDC-");
      const isExactMatch = actualCode ? codeInput === actualCode : false;

      if (isExactMatch || (isValidFormat && !actualCode)) {
        localStorage.setItem(`gomoto_cross_verification_${foundOwnerId}`, "confirmed");
        localStorage.setItem(`gomoto_cross_verification_${profile.id}`, "confirmed");
        setDriverCrossStatus("confirmed");
        setDriverCrossFeedback("✓ Félicitations ! Votre double enrôlement croisé a been validé avec succès par l'autorité d'enregistrement GoMoto RDC. Votre dossier d'audit d'État est désormais entièrement CONFORME.");
      } else {
        if (actualCode) {
          setDriverCrossFeedback(`❌ Code d'affiliation invalide. Le code saisi ne correspond pas à la clé d'audit générée par votre propriétaire enregistré.`);
        } else {
          setDriverCrossFeedback("❌ Code incorrect. Le format attendu doit commencer par 'GOMOTO-RDC-'. Veuillez d'abord demander à votre propriétaire d'enregistrer votre affiliation.");
        }
      }
    }, 1500);
  };

  const handleSubscribeTelecom = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTelSubmitting(true);
    setTelFeedback("");
    
    setTimeout(() => {
      const contractPriceUSD = 5;
      const contractPriceCDF = 12500;
      
      const newStatus: "active" | "inactive" = profile.telecomSubscriptionStatus === "active" ? "inactive" : "active";
      let updatedBalanceCDF = profile.walletBalanceCDF;
      let updatedBalanceUSD = profile.walletBalanceUSD;

      if (newStatus === "active") {
        if (!telSimNumber.trim() || telSimNumber === "+243") {
          setTelFeedback("❌ Veuillez insérer un numéro de carte SIM valide.");
          setIsTelSubmitting(false);
          return;
        }

        if (!telPlanPaidByGoMoto) {
          if (profile.walletBalanceCDF >= contractPriceCDF) {
            updatedBalanceCDF -= contractPriceCDF;
            setTelFeedback("✅ Forfait activé avec succès. Débit de 12 500 FC effectué sur votre solde GoMoto.");
          } else if (profile.walletBalanceUSD >= contractPriceUSD) {
            updatedBalanceUSD -= contractPriceUSD;
            setTelFeedback("✅ Forfait activé avec succès. Débit de $5.00 USD effectué sur votre solde GoMoto.");
          } else {
            setTelFeedback("❌ Solde insuffisant (12 500 FC ou $5.00 USD requis). Rechargez ou choisissez la prise en charge GoMoto.");
            setIsTelSubmitting(false);
            return;
          }
        } else {
          setTelFeedback("✅ Forfait activé gratuitement ! Pris en charge par signature d'accord GoMoto & Gouvernement.");
        }
      } else {
        setTelFeedback("🔴 Forfait Telecom Pro désactivé. Votre ligne repasse en mode standard.");
      }

      const updatedExpiry = newStatus === "active" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR") : undefined;

      const updated = {
        ...profile,
        telecomOperator: telOperator,
        telecomPhoneSim: telSimNumber,
        telecomSubscriptionStatus: newStatus,
        telecomExpiryDate: updatedExpiry,
        telecomAutoRenew: telAutoRenew,
        telecomSecuredAPN: telSecuredAPN,
        telecomPlanPaidByGoMoto: telPlanPaidByGoMoto,
        walletBalanceCDF: updatedBalanceCDF,
        walletBalanceUSD: updatedBalanceUSD
      };

      onUpdateProfile(updated);
      setIsTelSubmitting(false);
    }, 1200);
  };

  // Initialize available courses
  useEffect(() => {
    generateMockCourses();

    const loadedRatings = localStorage.getItem("gomoto_ratings_v1");
    if (loadedRatings) {
      setReviewsHistory(JSON.parse(loadedRatings));
    } else {
      const initialRatings: RideReview[] = [
        {
          id: "rev-mock-1",
          rideId: "ride-mock-100",
          fromUserId: "usr-client-01",
          fromUserName: "Madame Sarah KALANGA",
          fromUserRole: "client",
          toUserId: profile.id,
          toUserName: profile.firstName + " " + profile.lastName,
          rating: 5,
          comment: "Excellent conducteur ! Très prudent dans les embouteillages de Gombe et poli. Je recommande vivement pour tous vos trajets.",
          timestamp: "28/05/2026 à 14:32"
        },
        {
          id: "rev-mock-2",
          rideId: "ride-mock-101",
          fromUserId: "usr-client-02",
          fromUserName: "Papa Dieudonné",
          fromUserRole: "client",
          toUserId: profile.id,
          toUserName: profile.firstName + " " + profile.lastName,
          rating: 4,
          comment: "Bonne course, la moto est très bien entretenue. Arrivé rapidement sous les 15 minutes.",
          timestamp: "29/05/2026 à 18:15"
        },
        {
          id: "rev-mock-3",
          rideId: "ride-mock-102",
          fromUserId: "usr-client-03",
          fromUserName: "Merveille NSIMBA",
          fromUserRole: "client",
          toUserId: profile.id,
          toUserName: profile.firstName + " " + profile.lastName,
          rating: 5,
          comment: "Toujours au top ! Casque fourni propre, conduite extrêmement sécurisée.",
          timestamp: "01/06/2026 à 09:40"
        }
      ];
      setReviewsHistory(initialRatings);
      localStorage.setItem("gomoto_ratings_v1", JSON.stringify(initialRatings));
    }

    const initialTransactions: WalletTransaction[] = [
      {
        id: "tx-drv-1",
        userId: profile.id,
        amount: 45000,
        currency: "CDF",
        type: "commission",
        method: "Wallet_System",
        status: "completed",
        date: "02/06/2026 à 07:10"
      },
      {
        id: "tx-drv-2",
        userId: profile.id,
        amount: 25,
        currency: "USD",
        type: "commission",
        method: "Wallet_System",
        status: "completed",
        date: "02/06/2026 à 05:22"
      }
    ];
    setTransactions(initialTransactions);
  }, []);

  const generateMockCourses = () => {
    const rides: RideRequest[] = [
      {
        id: "request-101",
        clientId: "usr-client-01",
        clientName: "Madame Sarah KALANGA",
        clientPhone: "+243 812 344 556",
        pickupAddress: {
          province: profile.address.province,
          city: profile.address.city,
          commune: profile.address.commune,
          quartier: "Quartier Populaire",
          localite: "Localité Urbaine",
          avenue: getRandomAvenue(),
          number: "N/A"
        },
        dropoffAddress: {
          province: profile.address.province,
          city: profile.address.city,
          commune: profile.address.commune,
          quartier: "Quartier Centre-Ville",
          localite: "Localité Urbaine",
          avenue: "Avenue du 30 Juin n°14",
          number: "14"
        },
        status: "searching",
        priceCDF: 6500,
        priceUSD: 2.32,
        distanceKm: 3.1,
        timestamp: "À l'instant"
      },
      {
        id: "request-102",
        clientId: "usr-client-02",
        clientName: "Papa Jean-Pierre ALOBA",
        clientPhone: "+243 998 775 621",
        pickupAddress: {
          province: profile.address.province,
          city: profile.address.city,
          commune: profile.address.commune,
          quartier: "Quartier Résidentiel",
          localite: "Localité Urbaine",
          avenue: getRandomAvenue(),
          number: "N/A"
        },
        dropoffAddress: {
          province: profile.address.province,
          city: profile.address.city,
          commune: profile.address.commune,
          quartier: "Quartier Industriel",
          localite: "Localité Industrielle",
          avenue: "Avenue de la Libération n°60",
          number: "60"
        },
        status: "searching",
        priceCDF: 9800,
        priceUSD: 3.5,
        distanceKm: 4.8,
        timestamp: "Il y a 1 min"
      }
    ];
    setAvailableRides(rides);
  };

  // Online connection switcher logic
  const handleToggleOnline = () => {
    if (isOnline) {
      // Direct logoff
      setIsOnline(false);
      onUpdateProfile({
        ...profile,
        isOnline: false,
        onlineSelfieUrl: undefined
      });
    } else {
      // Prompt identity selfie verification with high-fidelity camera flow
      setShowSelfieModal(true);
      setIsSelfieCaptured(false);
      setSelfieRawData("");
      setFacialStep("ready");
      setFacialProgress(0);
      setFacialMatchScore(0);
      setFacialScanLog("Veuillez vous positionner face à l'objectif de la caméra.");
    }
  };

  const speakBiometricStatus = (status: "matched" | "mismatched") => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    
    const messages: Record<string, Record<AppLanguage, string>> = {
      matched: {
        fr: "Correspondance biométrique réussie. Bienvenue en ligne de courses Go Moto.",
        en: "Biometric match successful. Welcome online on Go Moto.",
        ln: "Esaleli biométrique elongi mpenza. Boyei bolamu na mosala Go Moto.",
        sw: "Uthibitisho wa kibaolojia umefanikiwa. Karibu kazini kwenye Go Moto.",
        ts: "Diyanyisha dya biométrique didi dimpe. Nuandamuka ku muaba wa Go Moto.",
        kk: "Kusonama ya biométrique isalidi mbote. Beto ke vukisa nge na Go Moto."
      },
      mismatched: {
        fr: "Erreur de correspondance biométrique. Suspicion d'usurpation faciale.",
        en: "Biometric match failed. Suspected identity theft.",
        ln: "Esaleli biométrique ekwei. Likama ya kokosa elongi.",
        sw: "Uthibitisho wa kibaolojia umefeli. Shaka ya wizi wa kitambulisho.",
        ts: "Diyanyisha dya biométrique yadi lipanga. Budimu bua kudimina muaba.",
        kk: "Kusonama ya biométrique imene kufuta. Likama ya ndala na meso."
      }
    };
    
    const langKey = lang || "fr";
    const textToSpeak = messages[status][langKey] || messages[status]["fr"];
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const langCodes: Record<AppLanguage, string> = {
      fr: "fr-FR",
      en: "en-US",
      sw: "sw-KE",
      ln: "fr-CD", 
      ts: "fr-CD",
      kk: "fr-CD"
    };
    utterance.lang = langCodes[langKey] || "fr-FR";
    
    if (window.speechSynthesis.getVoices) {
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => v.lang.startsWith(utterance.lang.substring(0, 2)));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }
    
    window.speechSynthesis.speak(utterance);
  };

  // Automated step-by-step facial recognition scan simulation
  const handleStartFacialScan = (type: "conform" | "fraud") => {
    if (facialStep === "capturing" || facialStep === "scanning") return;
    
    setSimulatedSelfieType(type);
    setFacialStep("capturing");
    setFacialProgress(0);
    setFacialMatchScore(0);
    setFacialScanLog("Déclenchement de l'obturateur photo...");

    // 1. Camerashutter flash
    setTimeout(() => {
      setFacialStep("scanning");
      setFacialScanLog("Initialisation de l'API de reconnaissance faciale...");

      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        if (currentProgress > 100) {
          currentProgress = 100;
        }

        setFacialProgress(currentProgress);

        // Dynamic log messages corresponding to progression milestones
        if (currentProgress <= 20) {
          setFacialScanLog("Détection faciale active... Visage détecté à 100%. Calibrage tridimensionnel...");
        } else if (currentProgress <= 45) {
          setFacialScanLog("Tracé des repères anthropométriques (256 points d'intérêt facial)...");
        } else if (currentProgress <= 70) {
          setFacialScanLog("Interrogation du répertoire de la Direction des Transports Civils RDC...");
        } else if (currentProgress <= 90) {
          setFacialScanLog(`Comparaison vectorielle avec la photo originale de ${profile.firstName} ${profile.lastName}...`);
        } else {
          setFacialScanLog("Finalisation du calcul de probabilité d'identité...");
        }

        if (currentProgress >= 100) {
          clearInterval(interval);
          
          // Complete and evaluate results
          if (type === "conform") {
            const score = parseFloat((95.5 + Math.random() * 4.2).toFixed(1));
            setFacialMatchScore(score);
            setSelfieRawData(profile.profilePicture || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250");
            setIsSelfieCaptured(true);
            setFacialStep("matched");
            setFacialScanLog(`✓ SUCCÈS : Correspondance biométrique de ${score}% certifiée par l'autorité.`);
            speakBiometricStatus("matched");
          } else {
            const score = parseFloat((11.4 + Math.random() * 8.5).toFixed(1));
            setFacialMatchScore(score);
            setSelfieRawData("https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250");
            setIsSelfieCaptured(true);
            setFacialStep("mismatched");
            setFacialScanLog(`❌ ALERTE SÉCURITÉ : Score de ${score}% insuffisant. Suspicion d'usurpation faciale !`);
            speakBiometricStatus("mismatched");
          }
        }
      }, 200);
    }, 800);
  };

  // Triggered after photographing selfie and scanning validated successfully
  const handleConfirmSelfieAndOnline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfieRawData || facialStep !== "matched") {
      alert("La vérification faciale approuvée par l'API est requise pour démarrer votre service de chauffeur.");
      return;
    }

    setIsOnline(true);
    setShowSelfieModal(false);
    onUpdateProfile({
      ...profile,
      isOnline: true,
      onlineSelfieUrl: selfieRawData
    });
  };

  // Course Acceptations / Decline flows
  const confirmationTranslations: Record<AppLanguage, {
    title: string;
    distance: string;
    estimatedPrice: string;
    departure: string;
    destination: string;
    cancel: string;
    accept: string;
    warning: string;
  }> = {
    fr: {
      title: "Confirmation de Course",
      distance: "Distance de la course",
      estimatedPrice: "Tarif estimé",
      departure: "Départ",
      destination: "Décharge",
      cancel: "Annuler",
      accept: "Confirmer & Accepter",
      warning: "Veuillez vérifier les détails ci-dessus pour éviter toute erreur de manipulation."
    },
    en: {
      title: "Confirm Ride Acceptance",
      distance: "Ride Distance",
      estimatedPrice: "Estimated Fare",
      departure: "Pickup",
      destination: "Dropoff",
      cancel: "Cancel",
      accept: "Confirm & Accept",
      warning: "Please double check the details above to avoid accidental taps."
    },
    ln: {
      title: "Ndimbola ya Mobembo",
      distance: "Boroki ya mobembo",
      estimatedPrice: "Talo to tongo",
      departure: "Epai ya kobanda",
      destination: "Epai ya kokita",
      cancel: "Zongisa nsima",
      accept: "Ndimisá mpe Bandá",
      warning: "Tala ndenge makambo ezali mpo na kokosa te na mosala."
    },
    sw: {
      title: "Uthibitisho wa Safari",
      distance: "Umbali wa safari",
      estimatedPrice: "Nauli inayokadiriwa",
      departure: "Kuanzia",
      destination: "Mwisho",
      cancel: "Ghairi",
      accept: "Thibitisha & Kubali",
      warning: "Tafadhali kagua maelezo hapo juu ili kuepuka makosa ya kubonyeza."
    },
    ts: {
      title: "Kondimisa Luendu Mukole",
      distance: "Bule dya luendu",
      estimatedPrice: "Mushinga mulombane",
      departure: "Kumpala kua kulata",
      destination: "Kufika kua mutobo",
      cancel: "Kupatula nyima",
      accept: "Dimiša ne Angata",
      warning: "Tangila bimpe malu onso bua kuenzela dipanga nansha."
    },
    kk: {
      title: "Kuzikisa Diata Diago",
      distance: "Kuendesa ya diata",
      estimatedPrice: "Talo ya kiyambula",
      departure: "Kisika ya tona",
      destination: "Kisika ya kukulumuka",
      cancel: "Kukatula nima",
      accept: "Zikisa mpe Baka",
      warning: "Keba mpenza mbongo mpe nzila mpo na kuvanda na ngolo."
    }
  };

  const speakRideConfirmationDetails = (ride: RideRequest) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const messages: Record<AppLanguage, string> = {
      fr: `Veuillez confirmer la course de ${ride.clientName}. Distance estimée: ${ride.distanceKm} kilomètre. Prix de la course : ${ride.priceCDF} francs congolais ou ${ride.priceUSD} dollars.`,
      en: `Please confirm ride request from ${ride.clientName}. Estimated distance: ${ride.distanceKm} kilometers. Fare is ${ride.priceCDF} Congolese francs or ${ride.priceUSD} dollars.`,
      ln: `Ndimisa mobembo ya ${ride.clientName}. Boroki ezali kilomètre ${ride.distanceKm}. Talo ya course ezali francs congolais ${ride.priceCDF} to ${ride.priceUSD} dollars.`,
      sw: `Tafadhali thibitisha safari ya ${ride.clientName}. Umbali unaokadiriwa ni kilomita ${ride.distanceKm}. Nauli ni faranga za Kongo ${ride.priceCDF} au dola ya marekani ${ride.priceUSD}.`,
      ts: `Dimiša luendu lua ${ride.clientName}. Bule dya nshila: kilomètre ${ride.distanceKm}. Mushinga udi francs congolais ${ride.priceCDF} to ${ride.priceUSD} dollars.`,
      kk: `Thibitisha diata de nzo de ${ride.clientName}. Kuendesa ezali kilomètre ${ride.distanceKm}. Talo ya mbongo ezali francs congolais ${ride.priceCDF} to ${ride.priceUSD} dollars.`
    };

    const langKey = lang || "fr";
    const textToSpeak = messages[langKey] || messages["fr"];

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const langCodes: Record<AppLanguage, string> = {
      fr: "fr-FR",
      en: "en-US",
      sw: "sw-KE",
      ln: "fr-CD", 
      ts: "fr-CD",
      kk: "fr-CD"
    };
    utterance.lang = langCodes[langKey] || "fr-FR";

    if (window.speechSynthesis.getVoices) {
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => v.lang.startsWith(utterance.lang.substring(0, 2)));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (rideToConfirm) {
      speakRideConfirmationDetails(rideToConfirm);
    }
  }, [rideToConfirm]);

  const handleAcceptRide = (ride: RideRequest) => {
    if (!isOnline) {
      alert("Veuillez activer votre présence en ligne avant d'accepter une course.");
      return;
    }

    setActiveRide(ride);
    setRideStatus("accepted");
    // Place driver and passenger coordinates on map
    setDriverPos({ x: 60, y: 300 });
    setPassengerPos({ x: 240, y: 220 });

    // Remove from general queue
    setAvailableRides(prev => prev.filter(r => r.id !== ride.id));

    // Update localStorage active ride to inform client screen
    const savedRideStr = localStorage.getItem("gomoto_active_ride");
    if (savedRideStr) {
      const parsed = JSON.parse(savedRideStr);
      if (parsed.id === ride.id) {
        parsed.status = "accepted";
        parsed.driverId = profile.id;
        parsed.driverName = profile.firstName + " " + profile.lastName;
        parsed.driverPhone = profile.phone;
        parsed.driverPlate = profile.vehiclePlate || "C-MC-4458KIN";
        parsed.driverRating = profile.rating || 4.8;
        localStorage.setItem("gomoto_active_ride", JSON.stringify(parsed));
      }
    }
  };

  const handleDeclineRide = (rideId: string) => {
    setAvailableRides(prev => prev.filter(r => r.id !== rideId));
  };

  // Synchronize dynamic active ride from localStorage requested by Passenger
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      const savedRideStr = localStorage.getItem("gomoto_active_ride");
      if (savedRideStr) {
        const savedRide = JSON.parse(savedRideStr);
        // If passenger has requested a ride but it's not accepted yet
        if (savedRide.status === "searching" && !activeRide) {
          setAvailableRides((prev) => {
            const exists = prev.find((r) => r.id === savedRide.id);
            if (!exists) {
              return [savedRide, ...prev];
            }
            return prev;
          });
        }
        // If passenger cancelled it, reset driver state
        if (savedRide.status === "cancelled" && activeRide?.id === savedRide.id) {
          setRideStatus("idle");
          setActiveRide(null);
          alert("Le passager a annulé la course.");
        }
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [isOnline, activeRide]);

  // Handle offline-to-online course reconciliation
  useEffect(() => {
    if (!offlineModeSimulated && offlinePendingRides.length > 0) {
      // Reconcile pending rides
      let extraCDF = 0;
      let extraUSD = 0;
      const syncedRides = [...offlinePendingRides];
      
      syncedRides.forEach(ride => {
        const earnedCDF = Math.round(ride.priceCDF * 0.85);
        const earnedUSD = parseFloat((ride.priceUSD * 0.85).toFixed(2));
        extraCDF += earnedCDF;
        extraUSD += earnedUSD;
      });

      const updatedHistoryStr = localStorage.getItem(`gomoto_driver_rides_history_${profile.id}`) || "[]";
      const currentHistory: RideRequest[] = JSON.parse(updatedHistoryStr);
      const unifiedHistory = [...offlinePendingRides, ...currentHistory];
      localStorage.setItem(`gomoto_driver_rides_history_${profile.id}`, JSON.stringify(unifiedHistory));
      setCompletedRides(unifiedHistory);

      // Create physical ledger transactions
      const newTransactions: WalletTransaction[] = offlinePendingRides.map(ride => ({
        id: "tx-earn-sync-" + Math.random().toString(36).substr(2, 6),
        userId: profile.id,
        amount: Math.round(ride.priceCDF * 0.85),
        currency: "CDF",
        type: "ride_payment",
        method: "Wallet_System",
        status: "completed",
        date: new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })
      }));

      setTransactions(prev => [...newTransactions, ...prev]);

      const finalBalanceCDF = profile.walletBalanceCDF + extraCDF;
      const finalBalanceUSD = profile.walletBalanceUSD + extraUSD;

      onUpdateProfile({
         ...profile,
         walletBalanceCDF: finalBalanceCDF,
         walletBalanceUSD: parseFloat(finalBalanceUSD.toFixed(2)),
         ridesCompleted: profile.ridesCompleted + offlinePendingRides.length
      });

      // Clear queue
      setOfflinePendingRides([]);
      localStorage.removeItem(`gomoto_driver_offline_pending_rides_${profile.id}`);

      alert(`📶 RÉCONCILIATION RÉSEAU RÉUSSIE !\n${syncedRides.length} course(s) accomplie(s) hors-ligne synchronisée(s) vers le grand livre d'audit d'État.\nMontant consolidé : +${extraCDF.toLocaleString()} CDF (+${extraUSD.toFixed(2)} USD).`);
    }
  }, [offlineModeSimulated]);

  // Sync chat messages during active ride
  useEffect(() => {
    if (rideStatus !== "idle" && activeRide) {
      const interval = setInterval(() => {
        const logged = localStorage.getItem("gomoto_active_ride_messages");
        if (logged) {
          setMessages(JSON.parse(logged));
        }
      }, 705);
      return () => clearInterval(interval);
    }
  }, [rideStatus, activeRide]);

  // SOS Real-time Tracking and simulation event loop
  useEffect(() => {
    if (!isSOSActive) {
      setSosLogs([]);
      setSosStatus("idle");
      return;
    }

    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSosCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => {
          // Keep default simulated coordinates if permission is blocked in the iframe
        }
      );
    }

    setSosStatus("triggered");
    const initTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setSosLogs([
      `📢 [${initTime}] [CRITIQUE] ALERTE ROUGE DE DÉTRESSE transmise par le Motard (${profile.firstName} ${profile.lastName}).`,
      `🚨 [${initTime}] Motif : ${sosReason === "kidnapping" ? "📌 ENLÈVEMENT / TENTATIVE DE RAPPORT EN COURS" : sosReason === "agression" ? "⚔️ AGRESSION AVEC VIOLENCE / ACCIDENT" : "⚠️ APPEL SOS DE SÉCURITÉ DIRECT"}.`,
      `📡 [${initTime}] Coordonnées verrouillées : Lat ${sosCoords.lat.toFixed(5)}, Lng ${sosCoords.lng.toFixed(5)}. Précision satellite : ±2.4 mètres.`
    ]);

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 3;
      
      const pingTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      // Slightly alter coordinates to simulate live physical movement (escape path / tracker)
      setSosCoords(prev => {
        const nextLat = prev.lat + (Math.random() - 0.5) * 0.00045;
        const nextLng = prev.lng + (Math.random() - 0.5) * 0.00045;
        
        setSosLogs(prevLogs => [
          `🛰️ [${pingTime}] Mise à jour GPS : Lat ${nextLat.toFixed(5)}, Lng ${nextLng.toFixed(5)} — Vitesse : ${Math.floor(25 + Math.random() * 20)} km/h.`,
          ...prevLogs
        ]);
        
        return { lat: nextLat, lng: nextLng };
      });

      // Update emergency statuses on timeline
      setSosStatus(current => {
        if (current === "triggered") {
          setSosLogs(prevLogs => [
            `📶 [${pingTime}] Connexion relais prioritaire établie avec le Centre National de Sécurisation PNC (Kinshasa Gombe).`,
            ...prevLogs
          ]);
          return "connecting";
        }
        if (current === "connecting") {
          setSosLogs(prevLogs => [
            `👮 [${pingTime}] ALERTE VALIDÉE ! Affectation de l'officier de liaison de garde PNC.`,
            `📲 [${pingTime}] Système d'urgence GoMoto : Diffusion SMS d'alerte instantanée au syndicat des motards locaux de la commune.`,
            ...prevLogs
          ]);
          return "transmitting";
        }
        if (current === "transmitting" && elapsed >= 9) {
          setSosLogs(prevLogs => [
            `🚔 [${pingTime}] BRIGADE D'INTERVENTION MOBILE PNC DE KINSHASA EN ROUTE (ETA estimée : 4 minutes).`,
            `🚨 [Consigne de sécurité] Restez calme, restez visible. Le pistage dynamique est actif. Ne tentez pas d'affronter seul des agresseurs armés.`,
            ...prevLogs
          ]);
          return "confirmed";
        }
        return current;
      });

      // Optional Audio Alarm Synthesizer tone
      if (!isSosSilent) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(1050, audioCtx.currentTime); 
            gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime); 
            oscillator.start();
            setTimeout(() => oscillator.stop(), 130);
          }
        } catch (e) {
          // Silent catch for locked browser autoplay policy
        }
      }

    }, 3000);

    return () => clearInterval(interval);
  }, [isSOSActive, isSosSilent, sosReason]);

  // Driver sends a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeRide) return;

    const newMessage: RideMessage = {
      id: "msg-" + Math.random().toString(36).substr(2, 6),
      rideId: activeRide.id,
      senderId: profile.id,
      senderName: profile.firstName + " " + profile.lastName,
      senderRole: "driver",
      text: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    };

    const currentLoggedStr = localStorage.getItem("gomoto_active_ride_messages") || "[]";
    const currentLoggedList: RideMessage[] = JSON.parse(currentLoggedStr);
    const updated = [...currentLoggedList, newMessage];
    localStorage.setItem("gomoto_active_ride_messages", JSON.stringify(updated));
    setMessages(updated);
    setMessageInput("");

    // Simulate automatic responses from the Passenger
    setTimeout(() => {
      const latestStr = localStorage.getItem("gomoto_active_ride_messages") || "[]";
      const latestList: RideMessage[] = JSON.parse(latestStr);
      
      const driverMsgsCount = latestList.filter(m => m.senderRole === "driver").length;
      let replyText = "D'accord, pas de souci !";
      if (driverMsgsCount === 1) {
        replyText = "Parfait, je me tiens prêt s'il vous plaît ! Merci.";
      } else if (driverMsgsCount === 2) {
        replyText = "Super ! Je vous attends juste au niveau du croisement principal.";
      } else {
        replyText = "Merci beaucoup, soyez prudent !";
      }

      const passengerReply: RideMessage = {
        id: "msg-clt-" + Math.random().toString(36).substr(2, 6),
        rideId: activeRide.id,
        senderId: activeRide.clientId,
        senderName: activeRide.clientName,
        senderRole: "client",
        text: replyText,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      };

      const withReply = [...latestList, passengerReply];
      localStorage.setItem("gomoto_active_ride_messages", JSON.stringify(withReply));
      setMessages(withReply);
    }, 2000);
  };

  // Driving animations
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (rideStatus === "accepted" && activeRide) {
      timer = setInterval(() => {
        setDriverPos((prev) => {
          const dx = passengerPos.x - prev.x;
          const dy = passengerPos.y - prev.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 12) {
            clearInterval(timer);
            setRideStatus("arrived");
            
            // Sync status to localStorage active ride
            const savedRide = localStorage.getItem("gomoto_active_ride");
            if (savedRide) {
              const parsed = JSON.parse(savedRide);
              parsed.status = "arrived";
              localStorage.setItem("gomoto_active_ride", JSON.stringify(parsed));
            }
            return passengerPos;
          }

          return {
            x: prev.x + (dx / dist) * 25,
            y: prev.y + (dy / dist) * 25
          };
        });
      }, 600);
    } else if (rideStatus === "picked_up" && activeRide) {
      // Driver moves Passenger to simulated destination
      const destination = { x: 330, y: 300 };
      timer = setInterval(() => {
        setDriverPos((prev) => {
          const dx = destination.x - prev.x;
          const dy = destination.y - prev.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 12) {
            clearInterval(timer);
            setRideStatus("completed");
            
            // Sync status to localStorage active ride
            const savedRide = localStorage.getItem("gomoto_active_ride");
            if (savedRide) {
              const parsed = JSON.parse(savedRide);
              parsed.status = "completed";
              localStorage.setItem("gomoto_active_ride", JSON.stringify(parsed));
            }
            return destination;
          }

          // Move passenger/driver tandem
          setPassengerPos({
            x: prev.x + (dx / dist) * 25,
            y: prev.y + (dy / dist) * 25
          });

          return {
            x: prev.x + (dx / dist) * 25,
            y: prev.y + (dy / dist) * 25
          };
        });
      }, 600);
    }

    return () => clearInterval(timer);
  }, [rideStatus, activeRide]);

  // Complete simulation of earnings distribution and passenger rating
  const handleFinishRideTask = () => {
    if (!activeRide) return;

    // Platform gets 15% commission, Driver gets 85%
    const driverPercentage = 0.85;
    const earnedCDF = Math.round(activeRide.priceCDF * driverPercentage);
    const earnedUSD = parseFloat((activeRide.priceUSD * driverPercentage).toFixed(2));

    const finalRideDetails: RideRequest = {
      ...activeRide,
      status: "completed",
      driverId: profile.id,
      driverName: profile.firstName + " " + profile.lastName,
      driverPhone: profile.phone
    };

    if (offlineModeSimulated) {
      // Off-line mode handling
      const updatedOfflineQueue = [...offlinePendingRides, finalRideDetails];
      setOfflinePendingRides(updatedOfflineQueue);
      localStorage.setItem(`gomoto_driver_offline_pending_rides_${profile.id}`, JSON.stringify(updatedOfflineQueue));

      // Caching to IndexedDB
      try {
        cacheRidesHistory(updatedOfflineQueue, profile.id);
        cacheWalletBalance(profile.walletBalanceCDF, profile.walletBalanceUSD, profile.id);
      } catch (err) {
        console.warn("Could not cache to IndexedDB offline:", err);
      }

      // Sync active ride state in local storage (passenger will eventually read this from IndexedDB)
      const savedRideStr = localStorage.getItem("gomoto_active_ride");
      if (savedRideStr) {
        const parsed = JSON.parse(savedRideStr);
        if (parsed.id === activeRide.id) {
          parsed.status = "completed";
          localStorage.setItem("gomoto_active_ride", JSON.stringify(parsed));
        }
      }

      // Clear active elements references
      localStorage.removeItem("gomoto_active_ride_messages");
      
      setRideStatus("idle");
      setActiveRide(null);
      setRatingComment("");

      alert(`📴 COURSE ENREGISTRÉE EN MODE HORS-LIGNE !\nGains de ${earnedCDF.toLocaleString()} CDF (~$${earnedUSD.toFixed(2)} USD) bloqués en escrow sécurisé REPARO.\nLes données sont scellées dans le stockage IndexedDB local de votre GSM et seront transmises au serveur GoMoto dès le rétablissement de la connexion.`);
      return;
    }

    // Update balances (Online path)
    const newBalanceCDF = profile.walletBalanceCDF + earnedCDF;
    const newBalanceUSD = profile.walletBalanceUSD + earnedUSD;

    const newTx: WalletTransaction = {
      id: "tx-earn-" + Math.random().toString(36).substr(2, 6),
      userId: profile.id,
      amount: earnedCDF,
      currency: "CDF",
      type: "ride_payment",
      method: "Wallet_System",
      status: "completed",
      date: new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })
    };

    // Save wallet balance offline cache
    try {
      cacheWalletBalance(newBalanceCDF, newBalanceUSD, profile.id);
    } catch (e) {
      console.warn(e);
    }

    setTransactions(prev => [newTx, ...prev]);
    onUpdateProfile({
      ...profile,
      walletBalanceCDF: newBalanceCDF,
      walletBalanceUSD: parseFloat(newBalanceUSD.toFixed(2)),
      ridesCompleted: profile.ridesCompleted + 1
    });

    // Save driver review about client inside global database
    const newReview: RideReview = {
      id: "rev-drv-" + Math.random().toString(36).substr(2, 6),
      rideId: activeRide.id,
      fromUserId: profile.id,
      fromUserName: profile.firstName + " " + profile.lastName,
      fromUserRole: "driver",
      toUserId: activeRide.clientId,
      toUserName: activeRide.clientName,
      rating: ratingValue,
      comment: ratingComment.trim() || undefined,
      timestamp: new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })
    };

    const existingStr = localStorage.getItem("gomoto_ratings_v1") || "[]";
    const existingList: RideReview[] = JSON.parse(existingStr);
    const updatedReviews = [newReview, ...existingList];
    localStorage.setItem("gomoto_ratings_v1", JSON.stringify(updatedReviews));
    setReviewsHistory(updatedReviews);

    // Update customer rating inside global users list
    const usersStr = localStorage.getItem("gomoto_users");
    if (usersStr) {
      const users: UserProfile[] = JSON.parse(usersStr);
      const updatedUsers = users.map((u) => {
        if (u.id === activeRide.clientId) {
          const oldRating = u.rating || 5.0;
          const oldRides = u.ridesCompleted || 0;
          const newRides = oldRides + 1;
          const newAvg = parseFloat(((oldRating * oldRides + ratingValue) / newRides).toFixed(2));
          return {
            ...u,
            rating: newAvg,
            ridesCompleted: newRides
          };
        }
        return u;
      });
      localStorage.setItem("gomoto_users", JSON.stringify(updatedUsers));
    }

    // Archive conversation
    const msgsStr = localStorage.getItem("gomoto_active_ride_messages") || "[]";
    const loggedMsgs = JSON.parse(msgsStr);
    if (loggedMsgs.length > 0) {
      const allHistoryStr = localStorage.getItem("gomoto_archived_conversations_v1") || "[]";
      const allHistory = JSON.parse(allHistoryStr);
      allHistory.push({
        rideId: activeRide.id,
        date: new Date().toLocaleDateString("fr-FR"),
        clientName: activeRide.clientName,
        driverName: profile.firstName + " " + profile.lastName,
        messages: loggedMsgs
      });
      localStorage.setItem("gomoto_archived_conversations_v1", JSON.stringify(allHistory));
    }

    // Archive completed course into driver history
    if (activeRide) {
      try {
        const parsedRide = { ...activeRide };
        parsedRide.status = "completed" as const;
        parsedRide.driverId = profile.id;
        parsedRide.driverName = profile.firstName + " " + profile.lastName;
        parsedRide.driverPhone = profile.phone;
        
        setCompletedRides(prev => {
          const updated = [parsedRide, ...prev];
          localStorage.setItem(`gomoto_driver_rides_history_${profile.id}`, JSON.stringify(updated));
          cacheRidesHistory(updated, profile.id);
          return updated;
        });
      } catch (e) {
        console.error("Error archiving completed ride", e);
      }
    }

    // Sync finished state to Active Ride
    const savedRideStr = localStorage.getItem("gomoto_active_ride");
    if (savedRideStr) {
      const parsed = JSON.parse(savedRideStr);
      if (parsed.id === activeRide.id) {
        parsed.status = "completed";
        localStorage.setItem("gomoto_active_ride", JSON.stringify(parsed));
      }
    }

    // Clear active references
    localStorage.removeItem("gomoto_active_ride_messages");
    localStorage.removeItem("gomoto_active_ride");

    setRideStatus("idle");
    setActiveRide(null);
    setRatingComment("");
    alert("Course clôturée et évaluation soumise avec succès.");
  };

  // Withdraw money via Mobile Money (M-Pesa, Orange, Airtel)
  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawNum = parseFloat(payoutAmount);
    if (!withdrawNum || withdrawNum <= 0) return;

    let balanceCheck = payoutCurrency === "CDF" ? profile.walletBalanceCDF : profile.walletBalanceUSD;
    if (balanceCheck < withdrawNum) {
      alert("Votre solde disponible dans votre portefeuille est insuffisant.");
      return;
    }

    // Interactive 2FA OTP Protocol Check (Recommandation #1)
    if (!withdrawalOtpSent) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setWithdrawalGeneratedOtp(code);
      setWithdrawalOtpSent(true);
      setWithdrawalOtpError(null);
      const carrierLabel = payoutMethod === "M-Pesa" ? "M-PESA / VODACOM" : payoutMethod === "Orange Money" ? "ORANGE MONEY" : payoutMethod === "Airtel Money" ? "AIRTEL MONEY" : "BANQUE PARTENAIRE";
      setWithdrawalOtpNotify(`[SMS SECURE - RETRAIT] Code d'authentification double facteur GoMoto : ${code} pour certifier le retrait de ${withdrawNum} ${payoutCurrency}.`);
      
      // Auto-clear notification after 20 seconds
      setTimeout(() => {
        setWithdrawalOtpNotify(null);
      }, 20000);
      return;
    }

    if (withdrawalEnteredOtp !== withdrawalGeneratedOtp || withdrawalGeneratedOtp === "") {
      setWithdrawalOtpError("Le code de vérification mobile ne correspond pas. Veuillez vérifier le SMS d'État.");
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
      id: "tx-payout-" + Math.random().toString(36).substr(2, 6),
      userId: profile.id,
      amount: withdrawNum,
      currency: payoutCurrency,
      type: "withdrawal",
      method: payoutMethod as any,
      status: "completed",
      date: new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })
    };

    setTransactions(prev => [newTx, ...prev]);
    onUpdateProfile({
      ...profile,
      walletBalanceCDF: finalCDF,
      walletBalanceUSD: parseFloat(finalUSD.toFixed(2))
    });

    // Write a Security Event directly on the Ledger to demonstrate active recommendations double-factor validation!
    try {
      const currentEventsStr = localStorage.getItem("gomoto_security_events_admin") || "[]";
      const currentEvents = JSON.parse(currentEventsStr);
      const newSecEvent = {
        id: "sh-evt-" + Math.random().toString(36).substr(2, 6),
        timestamp: new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        threatType: "OTP Verification",
        rawInput: "2FA Verified (Success)",
        sourceIp: "197.242.148.22 (Kinshasa, RDC - Airtel SIM)",
        actionTaken: "VERIFIED & PASSED",
        riskScore: "SECURE",
        location: `Kinshasa (${profile.address?.commune || "Gombe"})`,
        details: `Validation 2FA réussie par l'API pour le chauffeur ${profile.firstName} ${profile.lastName} lors du retrait de ${withdrawNum} ${payoutCurrency} via ${payoutMethod}.`
      };
      currentEvents.unshift(newSecEvent);
      localStorage.setItem("gomoto_security_events_admin", JSON.stringify(currentEvents));
    } catch (secErr) {
      console.error("Error logging 2FA audit trace to ledger", secErr);
    }

    setShowPayoutModal(false);
    setPayoutAmount("");
    setWithdrawalOtpSent(false);
    setWithdrawalGeneratedOtp("");
    setWithdrawalEnteredOtp("");
    setWithdrawalOtpError(null);
    setWithdrawalOtpNotify(null);

    alert(`✓ Retrait vérifié cryptographiquement par double facteur d'État ! Vos ${withdrawNum} ${payoutCurrency} ont été versés avec succès sur votre compte mobile ${payoutMethod}.`);
  };

  const handleTaxDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmitTaxDoc) return;

    // Calculate simulated amounts based on completed rides
    let totalUSD = 0;
    let totalCDF = 0;
    completedRides.forEach(r => {
      totalUSD += r.priceUSD;
      totalCDF += r.priceCDF;
    });

    // Add extra padding to guarantee non-zero base
    if (totalCDF === 0) totalCDF = 120500;
    if (totalUSD === 0) totalUSD = 45.20;

    const newDoc: SubmittedTaxDocument = {
      id: "tax-doc-" + Math.random().toString(36).substr(2, 6),
      userId: profile.id,
      userName: profile.firstName + " " + profile.lastName,
      userRole: "driver",
      docType: docTypeToSubmit,
      period: periodToSubmit,
      totalUSD: parseFloat(totalUSD.toFixed(2)),
      totalCDF: totalCDF,
      confidentialUserAddress: formatDRCAddress(profile.address),
      headquartersAddress: GOMOTO_HQ_ADDRESS,
      submittedAt: new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      status: "pending"
    };

    onSubmitTaxDoc(newDoc);
    setSubmissionFeedback("Félicitations ! Votre déclaration d'impôts a été télédéclarée avec succès et soumise à la commission de validation.");
    setTimeout(() => {
      setSubmissionFeedback("");
    }, 6000);
  };

  const handleInviteFriendSimulated = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitedName.trim()) {
      setReferralFeedback("⚠️ Veuillez renseigner le nom du nouvel utilisateur.");
      return;
    }
    if (!invitedPhone.trim() || invitedPhone.trim() === "+243") {
      setReferralFeedback("⚠️ Veuillez renseigner un numéro de téléphone RDC valide.");
      return;
    }

    const newCount = (profile.referralCount || 0) + 1;
    const bonusCDF = 15000;
    const bonusUSD = 5.00;

    const newCDFBand = profile.walletBalanceCDF + bonusCDF;
    const newUSDBand = profile.walletBalanceUSD + bonusUSD;

    const txIdBase = "tx-ref-" + Math.random().toString(36).substr(2, 6);
    const dateFormatted = new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })

    const txCDF: WalletTransaction = {
      id: `${txIdBase}-cdf`,
      userId: profile.id,
      amount: bonusCDF,
      currency: "CDF",
      type: "deposit",
      method: "Wallet_System",
      status: "completed",
      date: dateFormatted
    };

    const txUSD: WalletTransaction = {
      id: `${txIdBase}-usd`,
      userId: profile.id,
      amount: bonusUSD,
      currency: "USD",
      type: "deposit",
      method: "Wallet_System",
      status: "completed",
      date: dateFormatted
    };

    setTransactions(prev => [txCDF, txUSD, ...prev]);

    onUpdateProfile({
      ...profile,
      walletBalanceCDF: newCDFBand,
      walletBalanceUSD: parseFloat(newUSDBand.toFixed(2)),
      referralCount: newCount
    });

    setReferralFeedback(`🎉 Succès ! ${invitedName} a finalisé son inscription GoMoto avec votre code. Bonus de +15 000 CDF / +$5.00 USD crédité sur votre compte !`);
    setInvitedName("");
    setInvitedPhone("+243 ");

    setTimeout(() => {
      setReferralFeedback("");
    }, 10000);
  };

  // Recours application submission for driver
  const handleSendModificationRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqFirstName.trim() || !reqLastName.trim() || !reqReason.trim()) {
      alert("Tous les champs obligatoires (Prénom, Nom, Motif) sont requis pour valider le recours.");
      return;
    }

    const newRequest: AdminModificationRequest = {
      id: "req-" + Math.random().toString(36).substr(2, 7),
      userId: profile.id,
      userRole: "driver",
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
    alert("Dossier d'identité et de pièces administratives soumis à la commission d'arbitrage. Les modifications légitimes nécessitent un délai de traitement de 48h.");
  };

  return (
    <div id="driver-screen-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto font-sans">
      
      {/* 1. STATE-OF-THE-ART TOP HEADER MOBILITY HUD & NAVIGATION BAR */}
      <div className="col-span-1 lg:col-span-12 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-left">
        {/* Decorative ambient background blur vectors */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-48 h-48 bg-blue-600/5 rounded-full filter blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800/80 pb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {profile.profilePicture ? (
                <img referrerPolicy="no-referrer" src={profile.profilePicture} alt="Selfie Profile" className="h-16 w-16 rounded-2xl border-2 border-yellow-505 object-cover shadow-xl" />
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-slate-950 border-2 border-slate-800 flex items-center justify-center text-yellow-505 shadow-xl">
                  <User className="w-8 h-8" />
                </div>
              )}
              {isOnline ? (
                <span className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" title="En ligne" />
              ) : (
                <span className="absolute -bottom-1 -right-1 h-4 w-4 bg-amber-500 rounded-full border-2 border-slate-900" title="Hors ligne" />
              )}
            </div>
            
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[8.5px] font-black tracking-widest bg-yellow-500/15 text-yellow-500 px-2 py-0.5 rounded-md uppercase">Espace Chauffeur GoMoto</span>
                <span className="text-[8.5px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">Plaque: <b className="text-white">{profile.vehiclePlate || "C-MC-8841KIN"}</b></span>
              </div>
              <h1 className="text-xl font-black text-white mt-1 flex items-center gap-1.5">
                <span>{profile.firstName} {profile.lastName}</span>
                <CheckCircle className="w-5 h-5 text-yellow-500 fill-slate-950 shrink-0" />
              </h1>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Base : <b className="text-slate-300">{profile.address.commune}, {profile.address.city}</b></span>
              </p>
            </div>
          </div>

          {/* Quick Stats Grid Header Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Live Clock HUD */}
            <div className="bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-850/80 shadow-inner flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-500 shrink-0 animate-pulse" />
              <div className="text-left">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block font-mono">Horloge RDC</span>
                <span className="text-sm font-bold text-white block mt-0.5 font-mono">{localTime || "--:--:--"}</span>
              </div>
            </div>

            {/* Micro Rating Summary */}
            <div className="bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-850/80 shadow-inner flex items-center gap-3">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-505 shrink-0" />
              <div className="text-left">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Note Conducteur</span>
                <span className="text-sm font-bold text-slate-205 block mt-0.5 font-mono">{profile.rating} / 5</span>
              </div>
            </div>

            {/* Courses achieved */}
            <div className="bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-850/80 shadow-inner flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-left">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Rendement</span>
                <span className="text-sm font-bold text-slate-205 block mt-0.5 font-mono">{profile.ridesCompleted} Activées</span>
              </div>
            </div>

            {/* Status Display Card */}
            <div className="bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-850/80 shadow-inner flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-400 shrink-0 animate-pulse" />
              <div className="text-left">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Statut Actuel</span>
                <span className={`text-[10px] font-extrabold block mt-1 ${isOnline ? "text-emerald-400 animate-pulse" : "text-amber-500"}`}>
                  {isOnline ? "● EN SERVICE" : "○ HORS SERVICE"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. MAJESTIC SEGMENTED TOP HORIZONTAL NAVIGATION BAR */}
        <div className="flex flex-nowrap overflow-x-auto gap-2 mt-6 pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <button
            type="button"
            onClick={() => setActiveTab("courses")}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "courses"
                ? "bg-yellow-500 text-slate-950 shadow-lg font-black scale-[1.01]"
                : "bg-slate-950 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-850"
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span>Courses Actives</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "history"
                ? "bg-yellow-500 text-slate-950 shadow-lg font-black scale-[1.01]"
                : "bg-slate-950 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-850"
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>Historique courses</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("wallet")}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "wallet"
                ? "bg-yellow-500 text-slate-950 shadow-lg font-black scale-[1.01]"
                : "bg-slate-950 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-850"
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Portefeuille & Retrait</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ratings")}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "ratings"
                ? "bg-yellow-500 text-slate-950 shadow-lg font-black scale-[1.01]"
                : "bg-slate-950 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-850"
            }`}
          >
            <Star className="w-4 h-4 shrink-0" />
            <span>Évaluations</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "profile"
                ? "bg-yellow-500 text-slate-950 shadow-lg font-black scale-[1.01]"
                : "bg-slate-950 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-850"
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>Dossier d'Identité</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("badge")}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "badge"
                ? "bg-yellow-500 text-slate-950 shadow-lg font-black scale-[1.01]"
                : "bg-slate-950 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-850"
            }`}
          >
            <Award className="w-4 h-4 shrink-0" />
            <span>Badge Professionnel BD</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("fiscalite")}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "fiscalite"
                ? "bg-yellow-500 text-slate-950 shadow-lg font-black scale-[1.01]"
                : "bg-slate-950 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-850"
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Fiscalité & Impôts RDC</span>
          </button>
        </div>
      </div>

      {/* LEFT COLUMN: Sidebar menu, connectivity, status */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Dynamic Partner profile overview */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden text-left font-sans">
          <div className="absolute top-0 right-0 bg-yellow-500 text-slate-950 font-black text-[9px] px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            Mobilité & Gains
          </div>

          <div className="space-y-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1.5">Commandes de Connexion</span>

            {/* ONLINE/OFFLINE STATUS TRIGGER SWITCH */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-850/80 flex items-center justify-between">
              <div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Présence Mobilité</span>
                <span className={`text-xs font-black block mt-0.5 ${isOnline ? "text-emerald-400" : "text-amber-500"}`}>
                  {isOnline ? "● EN LIGNE" : "○ HORS LIGNE"}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleOnline}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow ${
                  isOnline ? "bg-red-500 hover:bg-red-400 text-white" : "bg-emerald-500 hover:bg-orange-400 text-slate-955"
                }`}
              >
                {isOnline ? "Déconnecter" : "Se Connecter"}
              </button>
            </div>

            {/* Presence selfie proof display */}
            {isOnline && profile.onlineSelfieUrl && (
              <div className="bg-slate-950 p-2.5 rounded-2xl border border-emerald-950/40 flex items-center gap-2.5">
                <img referrerPolicy="no-referrer" src={profile.onlineSelfieUrl} alt="Selfie" className="h-9 w-9 rounded-full border border-emerald-400 object-cover shrink-0" />
                <div>
                  <span className="text-[8px] font-bold text-white block">Selfie de présence validé</span>
                  <span className="text-[7.5px] text-slate-500 block">Comparaison faciale OK ({facialMatchScore > 0 ? `${facialMatchScore}%` : "98.4%"})</span>
                </div>
              </div>
            )}

            {/* Wallet displays */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850/80 text-left">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Gains CDF</span>
                <span className="text-[12px] font-black text-emerald-400 block mt-1">{profile.walletBalanceCDF.toLocaleString("fr-FR")} CDF</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850/80 text-left">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Gains USD</span>
                <span className="text-[12px] font-black text-yellow-500 block mt-1">${profile.walletBalanceUSD.toFixed(2)} USD</span>
              </div>
            </div>
          </div>
        </div>

        {/* DRIVER OFFLINE RESILIENCE NETWORK SIMULATOR */}
        <div id="driver-resilience-offline-box" className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connectivité Réseau</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black ${
              !offlineModeSimulated ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-500 animate-pulse"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${!offlineModeSimulated ? "bg-emerald-400" : "bg-amber-500"}`}></span>
              <span>{!offlineModeSimulated ? "LIGNE RDC STABLE" : "SANS RÉSEAU (HORS-LIGNE)"}</span>
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <p className="text-[10px] text-slate-400 leading-normal">
              Simulez la déconnexion réseau pour tester la résilience légale d'IndexedDB pour la poursuite de votre <b>misé de dépôt</b> et l'archivage local des courses.
            </p>

            <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-2xl border border-slate-850/80">
              <span className="text-[10.5px] font-bold text-slate-300">Coupe-Réseau GSM Instable</span>
              <button
                type="button"
                onClick={() => setOfflineModeSimulated(!offlineModeSimulated)}
                className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                  offlineModeSimulated ? "bg-amber-500" : "bg-slate-800"
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  offlineModeSimulated ? "translate-x-5" : "translate-x-0"
                }`}></div>
              </button>
            </div>
            
            {offlinePendingRides.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl text-[10px] space-y-2 animate-pulse">
                <span className="font-extrabold uppercase tracking-wide block">⏳ SYNCHRONISATION EN ATTENTE</span>
                <span>Vous avez <b>{offlinePendingRides.length} course(s)</b> accomplies hors-ligne en attente d'envoi. Reconnectez le réseau GSM pour les approuver.</span>
              </div>
            )}
          </div>
        </div>

        {/* ================= FORFAIT TELECOM PARTNERSHIP PRO FOR RIDERS ================= */}
        <div id="driver-telecom-partnership-box" className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-yellow-500" />
              <span>Forfait Télécom Pro Légitime</span>
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
              profile.telecomSubscriptionStatus === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-800 text-slate-400"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${profile.telecomSubscriptionStatus === "active" ? "bg-emerald-400" : "bg-slate-500"}`}></span>
              <span>{profile.telecomSubscriptionStatus === "active" ? "ACTIVE PRO" : "INACTIF"}</span>
            </span>
          </div>

          <div className="space-y-3 font-sans">
            <p className="text-[10px] text-slate-400 leading-normal">
              Bénéficiez d'une <b>connexion cryptée, prioritaire et fiable</b> négociée de concert avec l'Hôtel de ville et les opérateurs télécoms (Vodacom, Orange, Airtel) pour contrer les zones sans réseau à Kinshasa.
            </p>

            <form onSubmit={handleSubscribeTelecom} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8.5px] font-black text-slate-500 uppercase mb-1">Opérateur RDC</label>
                  <select
                    value={telOperator}
                    onChange={(e) => setTelOperator(e.target.value as "vodacom" | "orange" | "airtel")}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-yellow-500 font-bold"
                  >
                    <option value="vodacom">Vodacom Pro-Moto</option>
                    <option value="orange">Orange Business Moto</option>
                    <option value="airtel">Airtel Pro-Moto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8.5px] font-black text-slate-500 uppercase mb-1">N° de SIM Déclenchée</label>
                  <input
                    type="text"
                    placeholder="Ex: +243 821 513 114"
                    value={telSimNumber}
                    onChange={(e) => setTelSimNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white font-mono rounded-lg px-2.5 py-1.5 outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              {/* Secure Settings Checklist */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850/80 space-y-2 text-[10.5px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold flex items-center gap-1">
                    🔒 VPN & APN GoMoto Sécurisé (Canal Prioritaire)
                  </span>
                  <input
                    type="checkbox"
                    checked={telSecuredAPN}
                    onChange={(e) => setTelSecuredAPN(e.target.checked)}
                    className="accent-yellow-500 h-3.5 w-3.5 cursor-pointer rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold flex items-center gap-1">
                    🔄 Renouvellement automatique mensuel
                  </span>
                  <input
                    type="checkbox"
                    checked={telAutoRenew}
                    onChange={(e) => setTelAutoRenew(e.target.checked)}
                    className="accent-yellow-500 h-3.5 w-3.5 cursor-pointer rounded"
                  />
                </div>
              </div>

              {/* Pricing Choice Block (Payer par moi vs Sponsor) */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850/80 space-y-2 text-[10.5px]">
                <span className="block text-[8.5px] font-black text-yellow-500 uppercase tracking-wide">
                  Option de Financement Mensuel :
                </span>
                
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="telecomBilling"
                      checked={!telPlanPaidByGoMoto}
                      onChange={() => setTelPlanPaidByGoMoto(false)}
                      className="accent-yellow-500 mt-0.5 h-3.5 w-3.5"
                    />
                    <div>
                      <span className="text-slate-200 block font-bold text-[10px]">Payer par moi (Prélèvement GoMoto Wallet)</span>
                      <span className="text-[8.5px] text-slate-500 block">12 500 FC ou $5.00 USD déduits automatiquement chaque mois.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer pt-1 border-t border-slate-850/50">
                    <input
                      type="radio"
                      name="telecomBilling"
                      checked={telPlanPaidByGoMoto}
                      onChange={() => setTelPlanPaidByGoMoto(true)}
                      className="accent-yellow-500 mt-0.5 h-3.5 w-3.5"
                    />
                    <div>
                      <span className="text-slate-200 block font-bold text-[10px]">Pris en charge par l'entreprise GoMoto RDC</span>
                      <span className="text-[8.5px] text-slate-500 block">Frais de communication financés par la commission d'apport de clients de réseau mobile.</span>
                    </div>
                  </label>
                </div>
              </div>

              {profile.telecomSubscriptionStatus === "active" && profile.telecomExpiryDate && (
                <div className="bg-emerald-950/20 border border-emerald-900/40 p-2 rounded-lg text-emerald-300 text-[10px] space-y-0.5 font-sans">
                  <span className="font-bold uppercase tracking-wider block text-[8px]">📅 Période contractuelle en cours :</span>
                  <span>Expire le : <b>{profile.telecomExpiryDate}</b> (Renouvellement automatique actif)</span>
                </div>
              )}

              {telFeedback && (
                <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg text-[10px] text-white font-sans text-center transition-all animate-fade-in">
                  {telFeedback}
                </div>
              )}

              <button
                type="submit"
                disabled={isTelSubmitting}
                className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  profile.telecomSubscriptionStatus === "active"
                    ? "bg-slate-800 hover:bg-slate-750 text-red-400 border-slate-900"
                    : "bg-yellow-500 hover:bg-yellow-400 text-slate-950 border-yellow-700 font-extrabold"
                }`}
              >
                {isTelSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Traitement en cours...</span>
                  </>
                ) : profile.telecomSubscriptionStatus === "active" ? (
                  <span>Résilier mon Forfait Pro</span>
                ) : (
                  <span>Activer mon Forfait Pro (12500 FC/mois)</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* SOS URGENCE RDC Trigger Panel */}
        <div className="bg-slate-900 border-2 border-red-900/50 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-xl ${isSOSActive ? "bg-red-650 text-white animate-pulse" : "bg-red-950/65 text-red-500"}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-extrabold text-slate-105 text-[11px] uppercase tracking-wide">
                {isSOSActive ? "📡 Transmission SOS active" : "🚨 Dispositif SOS & Panique"}
              </h3>
              <p className="text-[9.5px] text-slate-400">Canal prioritaire d'assistance d'État</p>
            </div>
          </div>

          {!isSOSActive ? (
            <div className="space-y-2.5 text-left">
              <p className="text-[10px] text-slate-405 leading-normal">
                En cas d'urgence vitale, de <b>Kidnapping (enlèvement)</b> ou d'<b>Agression / Vol</b>, pressez l'un des boutons ci-dessous pour diffuser vos coordonnées GPS en temps réel aux forces de l'ordre.
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSosReason("kidnapping");
                    setIsSOSActive(true);
                  }}
                  className="bg-red-950/60 hover:bg-red-900 border border-red-700 hover:border-red-505 text-red-200 py-2.5 px-2 rounded-2xl text-[9px] font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 shadow-md active:translate-y-0.5"
                >
                  <span className="text-sm">👤❌</span>
                  <span>KIDNAPPING / RAPPORT</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSosReason("agression");
                    setIsSOSActive(true);
                  }}
                  className="bg-red-950/60 hover:bg-red-900 border border-red-700 hover:border-red-505 text-red-200 py-2.5 px-2 rounded-2xl text-[9px] font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 shadow-md active:translate-y-0.5"
                >
                  <span className="text-sm">⚔️🚨</span>
                  <span>AGRESSION / VOL</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowSOSModal(true)}
                className="w-full bg-slate-955 hover:bg-slate-850 text-slate-350 font-bold py-1.5 rounded-xl text-[9px] border border-slate-850 flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                <span>Consulter la Charte d'Urgence RDC (112)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 bg-red-950/20 border border-red-500/30 p-3.5 rounded-2xl text-left">
              <div className="flex items-center justify-between text-[9.5px] text-white font-extrabold">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                  <span className="text-red-400 uppercase">PISTAGE SATELLITE</span>
                </span>
                <span className="text-[8px] bg-red-500 text-slate-950 px-1.5 py-0.5 rounded font-black tracking-widest animate-pulse font-mono">
                  LIVE SECURED
                </span>
              </div>

              <div className="space-y-1 bg-slate-950/80 p-2.5 rounded-xl font-mono text-[9.5px] border border-red-950/30 text-red-400">
                <div className="flex justify-between">
                  <span>LAT:</span>
                  <span className="text-white font-black">{sosCoords.lat.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span>LNG:</span>
                  <span className="text-white font-black">{sosCoords.lng.toFixed(6)}</span>
                </div>
                <div className="flex justify-between border-t border-red-900/30 pt-1 mt-1 text-[8px]">
                  <span>VECTEUR:</span>
                  <span className="text-yellow-405 font-black uppercase">PNC KINSHASA</span>
                </div>
              </div>

              <div className="flex justify-between items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsSosSilent(!isSosSilent)}
                  className={`flex-1 py-1 px-1.5 rounded-lg text-[8px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-all border ${
                    isSosSilent 
                      ? "bg-slate-950 text-slate-400 border-slate-850" 
                      : "bg-red-500/10 text-red-200 border-red-500/20 hover:bg-red-500/20"
                  }`}
                >
                  {isSosSilent ? "🔕 Alarme Muette" : "🔊 Émettre Bip Alarme"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const val = prompt("Entrez votre code secret GoMoto Chauffeur pour annuler l'Alerte Rouge :");
                  if (val !== null) {
                    setIsSOSActive(false);
                    setSosReason("");
                    setSosStatus("idle");
                    alert("Alerte d'urgence Rouge annulée avec succès. Forces de sécurité notifiées.");
                  }
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-950 font-black py-2 rounded-xl text-[10px] cursor-pointer shadow-md transition-all text-center"
              >
                ❌ ANNULER L'ALERTE (RESET)
              </button>
            </div>
          )}
        </div>

        {/* Global safety/motard policy rule box */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-center">
          <p className="text-[10px] text-slate-400 italic">
            "GoMoto RDC Partenaire : Port du double-casque obligatoire et contrôle régulier de la vitesse."
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

      {/* RIGHT COLUMN: Display dispatch boards, lists of courses and transactions */}
      <div className="lg:col-span-8 space-y-6">

        {/* ================= ACTIVE REAL-TIME SOS SATELLITE DISPATCH TERMINAL ================= */}
        {isSOSActive && (
          <div className="bg-red-950/25 border-2 border-red-600 rounded-3xl p-5 md:p-6 shadow-2xl space-y-4 animate-[pulse_3s_infinite] relative overflow-hidden text-left">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600/10 rounded-full blur-2xl"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-red-900/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-red-600 text-white p-2.5 rounded-2xl animate-ping shrink-0">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-sans font-black text-slate-100 text-xs tracking-wide flex items-center gap-2">
                    <span>📡 TRANSMISSION GÉOLOCALISÉE PNC EN DIRECT BD-DRC</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  </h3>
                  <p className="text-[10px] text-red-300 font-mono">Commission Urbaine de Sécurité de Kinshasa • Protocole d'Urgence National</p>
                </div>
              </div>
              <div className="bg-red-950/85 border border-red-550 text-red-205 text-[9px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 shrink-0 uppercase tracking-widest leading-none font-mono">
                <span className="animate-pulse">SIMULATION ACTIVE 🟢</span>
              </div>
            </div>

            {/* Simulated Live Mini-Map coordinates display */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4 bg-slate-950 p-4 rounded-2xl border border-red-900/30 text-center flex flex-col justify-center space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-red-600 text-white font-bold text-[7px] px-1.5 py-0.5 rounded-bl font-mono">
                  BALISE ACTIVE
                </div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">LIAISON GPS SATELLITE RDC</span>
                <div className="font-mono text-xs font-black text-slate-100 space-y-1">
                  <div className="bg-slate-900 px-2 py-1.5 rounded border border-slate-850/60 flex justify-between">
                    <span className="text-[9px] text-slate-500">LAT:</span>
                    <span className="text-red-400 font-bold">{sosCoords.lat.toFixed(6)}</span>
                  </div>
                  <div className="bg-slate-900 px-2 py-1.5 rounded border border-slate-850/60 flex justify-between">
                    <span className="text-[9px] text-slate-500">LNG:</span>
                    <span className="text-red-400 font-bold">{sosCoords.lng.toFixed(6)}</span>
                  </div>
                </div>
                <div className="bg-slate-900 px-2 py-1 rounded-lg text-[8.5px] text-slate-400 font-sans leading-relaxed border border-slate-850 flex items-center gap-1.5 justify-center">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Signal d'urgence chiffré</span>
                </div>
              </div>

              {/* Console log of current streaming data */}
              <div className="md:col-span-8 bg-slate-950 rounded-2xl border border-red-900/35 p-3.5 flex flex-col h-[155px]">
                <span className="text-[8px] font-black text-red-400 uppercase tracking-wider block mb-1.5 font-mono">Console de Détresse en direct :</span>
                <div className="flex-1 overflow-y-auto font-mono text-[9px] text-slate-300 space-y-1.5 pr-2 text-left scroll-smooth">
                  {sosLogs.map((log, index) => (
                    <div key={index} className="leading-relaxed border-b border-slate-900/45 pb-1">
                      <span className="text-red-500 font-black">&gt;</span> <span className="text-slate-205">{log}</span>
                    </div>
                  ))}
                  {sosLogs.length === 0 && (
                    <div className="text-center py-8 text-slate-650 italic">
                      Liaison de déconfinement initiée...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick alert recommendations */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-red-955/40 text-[9px] text-slate-400 flex items-start gap-2 text-left leading-normal">
              <span className="text-yellow-600 font-bold">⚠️ SÉCURITÉ :</span>
              <p>
                <b>Mesure de Sécurité Obligatoire RDC :</b> Ce signal d'urgence de sécurité d'État transmet en continu aux autorités policière (PNC) votre localisation. En cas de menace imminente de kidnapping ou agression, suivez l'itinéraire d'évacuation préconisé sans conflit avec vos assaillants.
              </p>
            </div>
          </div>
        )}

        {/* ================= TAB 1: AVAILABLE COURSES DISPATCH BOARD ================= */}
        {activeTab === "courses" && (
          <div className="space-y-6">
            
            {/* Live routing map tracking */}
            {rideStatus !== "idle" && activeRide && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3 font-sans">
                <div className="flex justify-between items-center text-xs gap-3 flex-wrap">
                  <span className="font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-yellow-500" />
                    <span>Navigation Active - {activeRide.clientName}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next = !useGoogleMaps;
                        setUseGoogleMaps(next);
                        localStorage.setItem("gomoto_use_google_maps_driver", String(next));
                      }}
                      className={`text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                        useGoogleMaps
                          ? "bg-yellow-500 text-slate-950 border-yellow-400 font-black shadow-md hover:bg-yellow-400"
                          : "bg-slate-800 text-slate-305 border-slate-700 hover:text-white hover:bg-slate-700"
                      }`}
                    >
                      {useGoogleMaps ? "🗺️ Mode Carte Actif" : "🗺️ Mode Carte Inactif"}
                    </button>
                    <span className="bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded text-yellow-500 font-bold text-[9px] animate-pulse">
                      MOTEUR NAVIGATION GPS RDC
                    </span>
                  </div>
                </div>
                
                <WeatherAlert theme="dark" communeFilter={profile.address.commune} address={profile.address} lang={lang} />

                {useGoogleMaps ? (
                  <DriverMapTracking
                    address={profile.address}
                    pickupAddress={activeRide.pickupAddress}
                    dropoffAddress={activeRide.dropoffAddress}
                    isRideActive={true}
                    rideStatus={rideStatus === "idle" ? undefined : rideStatus}
                    driverPosition={driverPos}
                    passengerPosition={passengerPos}
                    onSwitchToLocalSimulator={() => {
                      setUseGoogleMaps(false);
                      localStorage.setItem("gomoto_use_google_maps_driver", "false");
                    }}
                  />
                ) : (
                  <MapSimulator
                    address={profile.address}
                    pickupAddress={activeRide.pickupAddress}
                    dropoffAddress={activeRide.dropoffAddress}
                    isRideActive={true}
                    rideStatus={rideStatus === "idle" ? undefined : rideStatus}
                    driverPosition={driverPos}
                    passengerPosition={passengerPos}
                    role="driver"
                  />
                )}
              </div>
            )}

            {/* Offline notification if they have not toggled "Online" */}
            {!isOnline && (
              <div id="driver-offline-card-callout" className="bg-amber-950/20 border-2 border-dashed border-amber-950 p-6 rounded-3xl text-center space-y-3 shadow-inner">
                <div className="mx-auto bg-amber-500/10 text-yellow-500 h-12 w-12 rounded-full flex items-center justify-center border border-yellow-500/20">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                <h3 className="font-extrabold text-slate-200 text-sm">Vous êtes actuellement Hors Ligne</h3>
                <p className="text-[10.5px] text-slate-400 max-w-sm mx-auto">
                  Afin de de voir les trajets de passagers disponibles en temps réel à {profile.address.commune} et postuler à des courses, vous devez activer votre présence en ligne avec selfie facial.
                </p>
                <button
                  type="button"
                  onClick={handleToggleOnline}
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-2.5 px-6 rounded-xl text-xs shadow-md cursor-pointer transition-all uppercase"
                >
                  Activer la Présence Maintenant
                </button>
              </div>
            )}

            {/* Active ride controls */}
            {rideStatus !== "idle" && activeRide && (
              <div id="active-driver-ride-controls" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-500 text-slate-950 p-2 rounded-xl">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-100 text-sm">Course Principale Active</h3>
                    <p className="text-[10px] text-slate-500">Passager : <b>{activeRide.clientName}</b> • Contacter: {activeRide.clientPhone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-slate-300">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                    <span className="text-[8px] text-slate-500 font-bold block uppercase">Point de Ramassage</span>
                    <span className="font-extrabold text-white mt-1 block truncate">{activeRide.pickupAddress.avenue}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                    <span className="text-[8px] text-slate-500 font-bold block uppercase">Lieu de Décharge</span>
                    <span className="font-extrabold text-white mt-1 block truncate">{activeRide.dropoffAddress.avenue}</span>
                  </div>
                </div>

                {/* Ride state controllers for drivers */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col items-stretch justify-between gap-4">
                  <div className="flex justify-between items-center w-full border-b border-slate-850 pb-2.5">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 block tracking-widest uppercase">Gains nets de course (85%)</span>
                      <span className="text-sm font-mono text-emerald-400 font-black">
                        {(activeRide.priceCDF * 0.85).toLocaleString()} CDF <span className="text-slate-500 font-normal">(${(activeRide.priceUSD * 0.85).toFixed(2)})</span>
                      </span>
                    </div>

                    {rideStatus === "accepted" && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 px-3.5 py-1.5 rounded-xl text-[10px] text-yellow-500 font-bold animate-pulse text-right">
                        En route vers le passager
                      </div>
                    )}

                    {rideStatus === "arrived" && (
                      <div className="bg-purple-500/10 border border-purple-500/20 px-3.5 py-1.5 rounded-xl text-[10px] text-purple-400 font-bold animate-pulse text-right">
                        Arrivé - Attente PIN
                      </div>
                    )}

                    {rideStatus === "picked_up" && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl text-[10px] text-emerald-400 font-bold animate-pulse text-right">
                        Course en cours de transport
                      </div>
                    )}

                    {rideStatus === "completed" && (
                      <div className="bg-blue-500/10 border border-blue-500/20 px-3.5 py-1.5 rounded-xl text-[10px] text-blue-400 font-bold text-right">
                        Arrivée validée
                      </div>
                    )}
                  </div>

                  {rideStatus === "arrived" && (
                    <div className="w-full bg-slate-900 border border-purple-900/40 p-4 rounded-xl mt-1 text-left space-y-3">
                      <h4 className="text-xs font-black text-purple-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Key className="w-4 h-4" />
                        <span>Contrôle de Sécurité : Code PIN Requis</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Pour sécuriser la course et prouver que vous prenez le bon passager, demandez-lui son code PIN secret à 4 chiffres.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          value={ridePinInput}
                          onChange={(e) => setRidePinInput(e.target.value.replace(/\D/g, ''))}
                          className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-center text-lg font-mono font-bold text-white focus:outline-none focus:border-purple-500"
                          placeholder="0000"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (activeRide?.securityPin && ridePinInput === activeRide.securityPin) {
                              setRidePinError(null);
                              setRidePinInput("");
                              setRideStatus("picked_up");
                              const savedRide = localStorage.getItem("gomoto_active_ride");
                              if (savedRide) {
                                const parsed = JSON.parse(savedRide);
                                parsed.status = "picked_up";
                                localStorage.setItem("gomoto_active_ride", JSON.stringify(parsed));
                              }
                            } else if (!activeRide?.securityPin && ridePinInput === "1234") {
                              setRidePinError(null);
                              setRidePinInput("");
                              setRideStatus("picked_up");
                              const savedRide = localStorage.getItem("gomoto_active_ride");
                              if (savedRide) {
                                const parsed = JSON.parse(savedRide);
                                parsed.status = "picked_up";
                                localStorage.setItem("gomoto_active_ride", JSON.stringify(parsed));
                              }
                            } else {
                              setRidePinError("Code PIN incorrect. Le passager doit vérifier son application.");
                            }
                          }}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg px-4 flex items-center justify-center gap-2 transition-colors uppercase tracking-wider text-[11px]"
                        >
                          Valider & Démarrer
                        </button>
                      </div>
                      {ridePinError && (
                        <p className="text-[10px] text-red-400 bg-red-400/10 p-2 rounded-lg">{ridePinError}</p>
                      )}
                    </div>
                  )}

                  {rideStatus === "completed" && (
                    <div className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl mt-1 space-y-3 test-left">
                      <h4 className="text-xs font-black text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>Fiche d'Évaluation Civique du Passager</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 text-left">
                        Conformément à la charte de comportement GoMoto RDC, attribuez une note de courtoisie à votre client passager :
                      </p>
                      
                      <div className="flex items-center justify-start gap-1.5 py-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setRatingValue(s)}
                            className="p-1 hover:scale-110 active:scale-95 transition-all text-yellow-500 cursor-pointer"
                          >
                            <Star className={`w-5 h-5 ${ratingValue >= s ? "fill-yellow-500 text-yellow-500" : "text-slate-600"}`} />
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[9px] font-bold text-slate-500 block uppercase pl-0.5">Commentaire de comportement (Optionnel)</label>
                        <input
                          type="text"
                          placeholder="Ex: Client calme, très respectueux..."
                          value={ratingComment}
                          onChange={(e) => setRatingComment(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-805 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-slate-600"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleFinishRideTask}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-6 rounded-xl text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1 uppercase tracking-wider"
                      >
                        <Check className="w-4 h-4" />
                        <span>Clôturer & encaisser {(activeRide.priceCDF * 0.85).toLocaleString()} CDF</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Driver In-App Chat Overlay box */}
                <div className="bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden mt-4 flex flex-col">
                  <div className="bg-slate-800 text-white p-3 flex justify-between items-center text-xs">
                    <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-yellow-500 font-sans">
                      <MessageSquare className="w-4 h-4 text-yellow-500" />
                      <span>Messagerie Intégrée Moto-Taxi / Client</span>
                    </span>
                    <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
                  </div>

                  {/* Chat logs */}
                  <div className="h-32 overflow-y-auto p-3 space-y-2 bg-slate-900 text-[10px] flex flex-col text-left">
                    {messages.length === 0 ? (
                      <div className="m-auto text-slate-500 text-center italic">
                        Aucun message avec le client.<br />Saisissez un message de courtoisie pour rassurer votre client.
                      </div>
                    ) : (
                      messages.map((m) => (
                        <div 
                          key={m.id} 
                          className={`max-w-[85%] rounded-xl px-3 py-1.5 leading-relaxed relative ${
                            m.senderRole === "driver" 
                              ? "bg-yellow-500 text-slate-950 self-end rounded-br-none font-bold" 
                              : "bg-slate-800 border border-slate-700 text-white self-start rounded-bl-none shadow-sm"
                          }`}
                        >
                          <span className="font-bold block text-[8px] opacity-75 mb-0.5">
                            {m.senderRole === "driver" ? "Vous" : m.senderName}
                          </span>
                          <span>{m.text}</span>
                          <span className="text-[7px] block text-right mt-1 opacity-60 font-mono">
                            {m.timestamp}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message write form */}
                  <form onSubmit={handleSendMessage} className="border-t border-slate-850 p-2 flex gap-1.5 bg-slate-900">
                    <input
                      type="text"
                      placeholder="Saisir un message pour rassurer votre client..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-slate-600 text-white"
                    />
                    <button
                      type="submit"
                      className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* List of nearby available rides */}
            {isOnline && rideStatus === "idle" && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3.5 font-sans">
                <div className="flex justify-between items-center text-xs gap-3 flex-wrap">
                  <span className="font-extrabold text-[#f3f4f6] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600 animate-ping"></span>
                    <span>Radar Trafic & Bouchons en Temps Réel</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next = !useGoogleMaps;
                        setUseGoogleMaps(next);
                        localStorage.setItem("gomoto_use_google_maps_driver", String(next));
                      }}
                      className={`text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                        useGoogleMaps
                          ? "bg-yellow-500 text-slate-950 border-yellow-400 font-black shadow-md hover:bg-yellow-400"
                          : "bg-slate-800 text-slate-305 border-slate-700 hover:text-white hover:bg-slate-700"
                      }`}
                    >
                      {useGoogleMaps ? "🗺️ Mode Carte Actif" : "🗺️ Mode Carte Inactif"}
                    </button>
                    <span className="bg-red-500/10 border border-red-500/20 px-2 py-1 rounded text-red-400 font-bold text-[9px] font-mono tracking-widest">
                      ALERTE LIVE RDC
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                  Suivez les blocages signalés par la communauté ou signalez-en un pour alerter les autres chauffeurs GoMoto. Cliquez sur une intersection ou une avenue puis appuyez sur <b>Signaler Bouchon 🚨</b>.
                </p>
                {useGoogleMaps ? (
                  <DriverMapTracking
                    address={profile.address}
                    isRideActive={false}
                    rideStatus="idle"
                    onSwitchToLocalSimulator={() => {
                      setUseGoogleMaps(false);
                      localStorage.setItem("gomoto_use_google_maps_driver", "false");
                    }}
                  />
                ) : (
                  <MapSimulator
                    address={profile.address}
                    isRideActive={false}
                    role="driver"
                  />
                )}
              </div>
            )}

            {isOnline && rideStatus === "idle" && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-slate-100 text-sm flex items-center gap-1.5">
                    <Bell className="w-4.5 h-4.5 text-yellow-500" />
                    <span>Demandes de Course à {profile.address.commune}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={generateMockCourses}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-all cursor-pointer"
                    title="Actualiser la liste"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <WeatherAlert theme="dark" communeFilter={profile.address.commune} address={profile.address} lang={lang} />

                <div className="space-y-3">
                  {availableRides.length > 0 ? (
                    availableRides.map((ride) => (
                      <div key={ride.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-850 hover:border-slate-750 transition-all space-y-3.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-black text-slate-200">{ride.clientName}</h4>
                            <span className="text-[8.5px] text-slate-500 mt-0.5 block">Distance : {ride.distanceKm} km • {ride.timestamp}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono font-black text-emerald-400 block">{ride.priceCDF.toLocaleString()} CDF</span>
                            <span className="text-[9px] text-slate-500 block font-bold">${ride.priceUSD} USD</span>
                          </div>
                        </div>

                        {/* Itinerary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10.5px] border-y border-slate-850 py-2 text-slate-400">
                          <div className="flex items-center gap-1 text-slate-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                            <span className="truncate">Départ: <b className="text-white">{ride.pickupAddress.avenue}</b></span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-300">
                            <span className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0"></span>
                            <span className="truncate">Décharge: <b className="text-white">{ride.dropoffAddress.avenue}</b></span>
                          </div>
                        </div>

                        {/* Actions accept / decline */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeclineRide(ride.id)}
                            className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 font-bold py-1.5 rounded-lg text-[10px] cursor-pointer transition-all flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Ignorer</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRideToConfirm(ride)}
                            className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-1.5 rounded-lg text-[10px] cursor-pointer transition-all flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accepter Course</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-500">Pas de requêtes disponibles pour le moment.</p>
                      <button
                        type="button"
                        onClick={generateMockCourses}
                        className="mt-2.5 text-[10px] text-yellow-500 font-bold hover:underline cursor-pointer"
                      >
                        Scanner la zone à nouveau
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Floating Emergency SOS Native Dialer Activator */}
            <EmergencySOS idPrefix="driver-ride-sos" userProfile={profile} onTriggerSOS={onTriggerSOS} />

          </div>
        )}

        {/* ================= TAB: NATIVE COMPLETED RIDE HISTORY (HISTORIQUE DES TRACS) ================= */}
        {activeTab === "history" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-805 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-100 text-sm flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <span>Historique des courses effectuées</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Suivi légal et fiscal de vos anciens trajets de transport.</p>
              </div>
              <span className="bg-yellow-500/10 text-yellow-505 border border-yellow-500/30 text-[9.5px] font-black uppercase px-2.5 py-1 rounded-xl">
                {completedRides.length} {completedRides.length > 1 ? "Courses" : "Course"}
              </span>
            </div>

            {(() => {
              const filteredRides = completedRides.filter(ride => {
                const query = historySearchQuery.toLowerCase().trim();
                let matchesQuery = true;
                if (query) {
                  const clientMatch = (ride.clientName || "").toLowerCase().includes(query);
                  const idMatch = ride.id.toLowerCase().includes(query);
                  const dateMatch = (ride.timestamp || "").toLowerCase().includes(query);
                  const pickupMatch = `${ride.pickupAddress.avenue} ${ride.pickupAddress.commune} ${ride.pickupAddress.quartier}`.toLowerCase().includes(query);
                  const dropoffMatch = `${ride.dropoffAddress.avenue} ${ride.dropoffAddress.commune} ${ride.dropoffAddress.quartier}`.toLowerCase().includes(query);
                  matchesQuery = clientMatch || idMatch || dateMatch || pickupMatch || dropoffMatch;
                }
                
                let matchesPrice = true;
                if (historyPriceRange === "under12k") {
                  matchesPrice = ride.priceCDF < 12000;
                } else if (historyPriceRange === "over12k") {
                  matchesPrice = ride.priceCDF >= 12000;
                }
                
                return matchesQuery && matchesPrice;
              });

              if (completedRides.length === 0) {
                return (
                  <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                    <MapPin className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-xs text-slate-400 font-medium">Aucune course enregistrée historiquement.</p>
                    <p className="text-[10px] text-slate-500 mt-1">Vos futures courses complétées s'ajouteront automatiquement.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4 w-full">
                  {/* Search and Filters Layout for Driver (Slate/Dark styling) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left">
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">Chercher une course</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Client, Commune, ID, Date..."
                          value={historySearchQuery}
                          onChange={(e) => setHistorySearchQuery(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-yellow-500 placeholder-slate-500"
                        />
                        {historySearchQuery && (
                          <button
                            type="button"
                            onClick={() => setHistorySearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 font-bold text-xs pointer-events-auto"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">Filtrer par Prix</label>
                      <select
                        value={historyPriceRange}
                        onChange={(e) => setHistoryPriceRange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-805 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 outline-none focus:border-yellow-500 cursor-pointer"
                      >
                        <option value="all">Tous les Tarifs</option>
                        <option value="under12k">Moins de 12 000 CDF</option>
                        <option value="over12k">12 000 CDF ou plus</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
                
                {/* List portion - Col span 5 */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredRides.length === 0 ? (
                    <div className="text-center py-10 bg-slate-950 border border-slate-800 rounded-2xl p-4">
                      <p className="text-xs text-slate-400 font-medium">Aucune course trouvée.</p>
                      <p className="text-[10px] text-slate-550 mt-1">Ajustez vos filtres ou termes de recherche.</p>
                    </div>
                  ) : (
                    filteredRides.map((ride) => {
                      const isSelected = selectedHistoryRide === ride.id;
                    return (
                      <button
                        key={ride.id}
                        type="button"
                        onClick={() => setSelectedHistoryRide(ride.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                          isSelected
                            ? "bg-slate-950 border-yellow-500 ring-1 ring-yellow-500"
                            : "bg-slate-950/60 border-slate-800 hover:border-slate-700 animate-fade-in"
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className="text-[9px] font-black text-yellow-500 font-mono uppercase tracking-widest bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800">
                            {ride.id}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            {ride.timestamp}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-slate-200">
                          <div className="flex gap-2 items-center text-xs font-semibold">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                            <span className="truncate">{ride.pickupAddress.avenue}</span>
                          </div>
                          <div className="flex gap-2 items-center text-xs font-semibold">
                            <span className="h-2 w-2 rounded-full bg-yellow-500 flex-shrink-0" />
                            <span className="truncate">{ride.dropoffAddress.avenue}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center w-full pt-2 border-t border-slate-850 mt-1 text-[11px]">
                          <span className="text-slate-400 font-medium">{ride.clientName || "Passager"}</span>
                          <span className="font-mono font-extrabold text-emerald-400">
                            {ride.priceCDF.toLocaleString("fr-FR")} CDF
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
                </div>

                {/* Detail portion - Col span 7 */}
                <div className="lg:col-span-12 xl:col-span-7">
                  {(() => {
                    const ride = filteredRides.find(r => r.id === selectedHistoryRide) || filteredRides[0] || completedRides[0];
                    if (!ride) return null;

                    return (
                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Rapport de trajet</span>
                            <h4 className="text-xs font-black text-slate-200 uppercase mt-0.5 font-mono">{ride.id}</h4>
                          </div>
                          <div className="text-right">
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-extrabold px-2.5 py-1 rounded">
                              ENREGISTRÉ AU REGISTRE
                            </span>
                          </div>
                        </div>

                        {/* Start & End locations lists */}
                        <div className="space-y-3.5 bg-slate-900 p-4 rounded-xl border border-slate-800">
                          <div className="flex gap-3 text-xs">
                            <div className="flex flex-col items-center">
                              <span className="h-3 w-3 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-slate-900 ring-2 ring-emerald-950 flex-shrink-0" />
                              <div className="w-0.5 h-8 bg-slate-800" />
                              <span className="h-3 w-3 rounded-full bg-yellow-500 flex items-center justify-center border-2 border-slate-900 ring-2 ring-yellow-950 flex-shrink-0" />
                            </div>
                            <div className="space-y-4 flex-1 text-slate-300">
                              <div className="space-y-0.5">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Point d'Enlèvement</span>
                                <span className="font-bold text-slate-100 text-[11px]">
                                  {ride.pickupAddress.avenue}, Q.{ride.pickupAddress.quartier} ({ride.pickupAddress.commune})
                                </span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Destination Finale</span>
                                <span className="font-bold text-slate-100 text-[11px]">
                                  {ride.dropoffAddress.avenue}, Q.{ride.dropoffAddress.quartier} ({ride.dropoffAddress.commune})
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Static mapping system */}
                        <div className="relative h-44 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
                          {/* Grid road layout vector simulation lines */}
                          <svg className="absolute inset-0 w-full h-full text-slate-800" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <pattern id="grid-map-d" width="30" height="30" patternUnits="userSpaceOnUse">
                                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid-map-d)" />
                            
                            {/* Kinshasa simulated road lines */}
                            <line x1="0" y1="50" x2="100%" y2="50" stroke="#1e293b" strokeWidth="4" />
                            <line x1="0" y1="110" x2="100%" y2="110" stroke="#1e293b" strokeWidth="4" />
                            <line x1="120" y1="0" x2="120" y2="100%" stroke="#1e293b" strokeWidth="4" />
                            <line x1="260" y1="0" x2="260" y2="100%" stroke="#1e293b" strokeWidth="4" />
                            
                            {/* Route trace curve line */}
                            <path d="M 120 110 Q 190 80 260 50" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="6,4" />
                          </svg>

                          {/* Floating Marker A (Start) */}
                          <div className="absolute bottom-[35px] left-[105px] flex flex-col items-center">
                            <span className="bg-emerald-600 text-white rounded-full p-1 text-[8.5px] font-black z-10 flex items-center justify-center shadow-lg w-5 h-5 leading-none">
                              A
                            </span>
                            <span className="bg-slate-950 text-slate-350 font-bold text-[7.5px] px-1 py-0.5 rounded border border-slate-800 whitespace-nowrap mt-1 font-sans">
                              {ride.pickupAddress.commune}
                            </span>
                          </div>

                          {/* Floating Marker B (Destination) */}
                          <div className="absolute top-[25px] left-[242px] flex flex-col items-center">
                            <span className="bg-yellow-500 text-slate-950 rounded-full p-1 text-[8.5px] font-black z-10 flex items-center justify-center shadow-lg w-5 h-5 leading-none">
                              B
                            </span>
                            <span className="bg-slate-900 text-slate-350 font-bold text-[7.5px] px-1 py-0.5 rounded border border-slate-800 whitespace-nowrap mt-1 font-sans">
                              {ride.dropoffAddress.commune}
                            </span>
                          </div>

                          <div className="absolute top-2.5 right-2 text-right">
                            <span className="bg-slate-950/80 text-white font-mono text-[8px] px-1.5 py-0.5 rounded-lg border border-slate-800 font-bold block">
                              COMMUNE: {ride.pickupAddress.commune} vers {ride.dropoffAddress.commune}
                            </span>
                          </div>

                          <div className="absolute bottom-2.5 right-2 text-right">
                            <span className="bg-slate-900 text-yellow-500 font-mono text-[8.5px] font-extrabold px-2 py-0.5 rounded-lg border border-slate-800 shadow-md">
                              Distance: {ride.distanceKm} km
                            </span>
                          </div>
                        </div>

                        {/* Invoice & Driver details bento row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                            <div className="space-y-0.5 text-[10px]">
                              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Détails du Client</span>
                              <p className="font-extrabold text-slate-100 mt-1">{ride.clientName || "Passager"}</p>
                              <p className="text-slate-400 mt-0.5 font-mono">{ride.clientPhone || "+243 899 XXX XXX"}</p>
                            </div>
                            <div className="mt-3 bg-slate-950 p-2 rounded-lg text-[9px] text-slate-400 font-medium leading-relaxed border border-slate-850">
                              La course s'est déroulée en accord complet avec la charte nationale de civile sécurité GoMoto.
                            </div>
                          </div>

                          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs flex flex-col justify-between">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2">Comptabilité de la Course</span>
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-slate-400 font-medium">
                                <span>Tarif brut :</span>
                                <span className="font-mono">{ride.priceCDF.toLocaleString("fr-FR")} CDF</span>
                              </div>
                              <div className="flex justify-between items-center text-slate-400 font-medium">
                                <span>Commission GoMoto (15%) :</span>
                                <span className="font-mono text-amber-500">-{Math.round(ride.priceCDF * 0.15).toLocaleString("fr-FR")} CDF</span>
                              </div>
                              <div className="flex justify-between items-center font-extrabold text-slate-100 border-t border-slate-800 pt-1.5">
                                <span>Gain net motard :</span>
                                <span className="font-mono text-emerald-405">{Math.round(ride.priceCDF * 0.85).toLocaleString("fr-FR")} CDF</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

              </div>
            </div>
          );
        })()}
          </div>
        )}

        {/* ================= TAB 2: WALLET FOR DRIVER / OWNER VERSEMENT ================= */}
        {activeTab === "wallet" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            
            {!isWalletUnlocked ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center border-2 border-slate-800 shadow-xl">
                  <Lock className="w-7 h-7 text-yellow-500" />
                </div>
                
                <div className="text-center space-y-1">
                  <h3 className="font-black text-slate-100 text-lg uppercase tracking-widest">Portefeuille Sécurisé</h3>
                  <p className="text-xs text-slate-400">Entrez votre code PIN secret à 4 chiffres (Simulation: 1234)</p>
                </div>

                <div className="w-full max-w-[240px] space-y-4">
                  <input
                    type="password"
                    maxLength={4}
                    value={walletPinInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setWalletPinInput(val);
                      if (val === "1234") {
                        setIsWalletUnlocked(true);
                        setWalletPinInput("");
                      }
                    }}
                    placeholder="••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 text-center text-2xl tracking-widest text-emerald-400 font-mono font-black outline-none focus:border-yellow-500 transition-colors"
                  />
                  <div className="text-center">
                    <p className="text-[9px] text-slate-600">Vos fonds sont protégés par la norme de sécurité d'état congolaise.</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-slate-100 text-sm">Gestion des Revenus Chauffeur</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Demandez des fonds instantanément vers Bank/Mobile Money</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsWalletUnlocked(false)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Verrouiller</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPayoutModal(true)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Demander Retrait</span>
                    </button>
                  </div>
                </div>

            {/* Balances Display Card */}
            <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Mon Solde Disponible (CDF)</span>
                <span className="text-2xl font-mono font-black text-emerald-400 block">{profile.walletBalanceCDF.toLocaleString("fr-FR")} CDF</span>
                <span className="text-[10px] text-slate-500 block">GoMoto Commission déduite d'office (15%)</span>
              </div>

              <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800 md:pl-6 pt-4 md:pt-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Mon Solde USD (Devise Libre)</span>
                <span className="text-2xl font-mono font-black text-yellow-500 block">${profile.walletBalanceUSD.toFixed(2)} USD</span>
                <span className="text-[10px] text-slate-500 block">Versements 100% sécurisés</span>
              </div>
            </div>

            {/* ================= OUTIL DE CALCUL DE COMMISSION AUTOMATIQUE & TRANSPARENCE EXPENSES ================= */}
            <div className="bg-slate-950 p-5 rounded-3xl border border-slate-850 space-y-5">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-yellow-500/10 text-yellow-500 rounded-xl border border-yellow-500/20">
                  <Activity className="w-4 h-4 text-yellow-400" />
                </span>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Simulateur de Commission & Rentabilité Partagée (Carburant / Entretien)</h4>
                  <p className="text-[9.5px] text-slate-500 mt-0.5">Calculateur automatique des commissions GoMoto et arbitrage équitable pour les charges routières</p>
                </div>
              </div>

              {/* Input course amount & Owner share side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                {/* Simulated course field */}
                <div className="space-y-2 text-left">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono">Montant de la Course à Simuler</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(Math.max(0, Number(e.target.value)))}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white font-extrabold outline-none focus:border-yellow-500"
                      placeholder="Ex: 15000"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newCurr = calcCurrency === "CDF" ? "USD" : "CDF";
                        setCalcCurrency(newCurr);
                        setCalcAmount(newCurr === "CDF" ? 15000 : 6);
                      }}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl px-3.5 text-xs font-mono font-black text-yellow-500 cursor-pointer"
                    >
                      {calcCurrency}
                    </button>
                  </div>

                  {/* Predefined common RDC buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {calcCurrency === "CDF" ? (
                      [3000, 5000, 10000, 15000, 25000, 50000].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setCalcAmount(v)}
                          className={`text-[8px] font-mono px-2 py-1 rounded-lg border transition-all ${
                            calcAmount === v 
                              ? "bg-yellow-500 text-slate-950 border-yellow-500 font-extrabold" 
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {v.toLocaleString()} CDF
                        </button>
                      ))
                    ) : (
                      [2, 5, 8, 12, 20, 35].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setCalcAmount(v)}
                          className={`text-[8px] font-mono px-2 py-1 rounded-lg border transition-all ${
                            calcAmount === v 
                              ? "bg-yellow-500 text-slate-950 border-yellow-500 font-extrabold" 
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          ${v} USD
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Owner custom percentage */}
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono">Commission Assignée au Propriétaire</label>
                    <span className="text-[10px] text-yellow-500 font-black font-mono">{calcOwnerPercent}%</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={calcOwnerPercent}
                      onChange={(e) => setCalcOwnerPercent(Number(e.target.value))}
                      className="w-full accent-yellow-500 cursor-pointer h-1.5"
                    />
                  </div>
                  <p className="text-[8.5px] text-slate-500 leading-relaxed">
                    La commission propriétaire est versée en échange de l'acquisition de la motocyclette par l'investisseur. Taux d'accord libre recommandé: <b>20% à 30%</b>.
                  </p>
                </div>
              </div>

              {/* Expense Sharing Contributions Clarifications */}
              <div className="border-t border-slate-850 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Fuel Split selector */}
                <div className="space-y-1.5 text-left">
                  <span className="text-[9.5px] font-black text-slate-300 uppercase font-mono flex items-center gap-1.5">
                    <span>⛽</span> Contribution Carburant (Essence)
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    {(["driver", "owner", "split"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFuelPaidBy(m)}
                        className={`text-[8.5px] font-black py-1 px-1 rounded-lg border uppercase transition text-center ${
                          fuelPaidBy === m
                            ? "bg-amber-500 text-slate-950 border-amber-500 font-bold"
                            : "bg-slate-950 border-transparent text-slate-400 hover:text-white"
                        }`}
                      >
                        {m === "driver" ? "Motard 100%" : m === "owner" ? "Proprio 100%" : "Partage 50/50"}
                      </button>
                    ))}
                  </div>
                  <p className="text-[8px] text-slate-500 leading-normal">
                    Frais de carburant de trajet estimés: <span className="font-mono text-slate-300 font-extrabold">{(calcAmount * 0.18).toLocaleString("fr-FR")} {calcCurrency}</span> (~18% de consommation moyenne 150cc)
                  </p>
                </div>

                {/* Maintenance Split selector */}
                <div className="space-y-1.5 text-left">
                  <span className="text-[9.5px] font-black text-slate-300 uppercase font-mono flex items-center gap-1.5">
                    <span>🛠️</span> Vidange & Maintenance Moto
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    {(["driver", "owner", "split"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMaintenancePaidBy(m)}
                        className={`text-[8.5px] font-black py-1 px-1 rounded-lg border uppercase transition text-center ${
                          maintenancePaidBy === m
                            ? "bg-amber-500 text-slate-950 border-amber-500 font-bold"
                            : "bg-slate-950 border-transparent text-slate-400 hover:text-white"
                        }`}
                      >
                        {m === "driver" ? "Motard 100%" : m === "owner" ? "Proprio 100%" : "Partage 50/50"}
                      </button>
                    ))}
                  </div>
                  <p className="text-[8px] text-slate-500 leading-normal">
                    Budget de maintenance de route estimé: <span className="font-mono text-slate-300 font-extrabold">{(calcAmount * 0.10).toLocaleString("fr-FR")} {calcCurrency}</span> (~10% amortissement matériel)
                  </p>
                </div>

              </div>

              {/* Calculation output summary card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 space-y-4 font-mono">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block font-sans text-left">
                  📋 Facturation & Répartition Détaillée Légale RDC :
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                  
                  {/* Left: Driver Net */}
                  <div className="space-y-2 text-left pt-2 md:pt-0">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                      <span className="text-[9.5px] font-black text-cyan-400 uppercase font-sans">Compte Net du Chauffeur (Motard)</span>
                    </div>
                    
                    <div className="space-y-1 text-[10px] leading-normal">
                      <div className="flex justify-between">
                        <span className="text-slate-550">Versement Brut Client :</span>
                        <span className="text-slate-300 font-bold">{calcAmount.toLocaleString("fr-FR")} {calcCurrency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-550">Commission GoMoto RDC (15%) :</span>
                        <span className="text-orange-400">-{(calcAmount * 0.15).toLocaleString("fr-FR")} {calcCurrency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-550">Quote-part Propriétaire ({calcOwnerPercent}%) :</span>
                        <span className="text-amber-500">-{(calcAmount * calcOwnerPercent / 100).toLocaleString("fr-FR")} {calcCurrency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-550">Frais d'Essence ({fuelPaidBy === "driver" ? "100%" : fuelPaidBy === "split" ? "50%" : "0%"}) :</span>
                        <span className="text-red-400">-{((fuelPaidBy === "driver" ? 0.18 : fuelPaidBy === "split" ? 0.09 : 0) * calcAmount).toLocaleString("fr-FR")} {calcCurrency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-550">Frais d'Entretien ({maintenancePaidBy === "driver" ? "100%" : maintenancePaidBy === "split" ? "50%" : "0%"}) :</span>
                        <span className="text-red-400">-{((maintenancePaidBy === "driver" ? 0.10 : maintenancePaidBy === "split" ? 0.05 : 0) * calcAmount).toLocaleString("fr-FR")} {calcCurrency}</span>
                      </div>

                      <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs mt-3">
                        <span className="font-sans font-black text-white text-[10px] uppercase">Reste net en poche :</span>
                        <span className="text-emerald-400 font-extrabold text-[12.5px]">
                          {Math.max(0, calcAmount - (calcAmount * 0.15) - (calcAmount * calcOwnerPercent / 100) - ((fuelPaidBy === "driver" ? 0.18 : fuelPaidBy === "split" ? 0.09 : 0) * calcAmount) - ((maintenancePaidBy === "driver" ? 0.10 : maintenancePaidBy === "split" ? 0.05 : 0) * calcAmount)).toLocaleString("fr-FR")} {calcCurrency}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Owner Net */}
                  <div className="space-y-2 text-left pt-3 md:pt-0 md:pl-5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                      <span className="text-[9.5px] font-black text-yellow-500 uppercase font-sans">Compte Net du Propriétaire de Fleet</span>
                    </div>

                    <div className="space-y-1 text-[10px] leading-normal">
                      <div className="flex justify-between">
                        <span className="text-slate-550">Versement Brut Reçu :</span>
                        <span className="text-slate-300 font-bold">{(calcAmount * calcOwnerPercent / 100).toLocaleString("fr-FR")} {calcCurrency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-550">Soutien Carburant ({fuelPaidBy === "owner" ? "100%" : fuelPaidBy === "split" ? "50%" : "0%"}) :</span>
                        <span className="text-red-405">-{((fuelPaidBy === "owner" ? 0.18 : fuelPaidBy === "split" ? 0.09 : 0) * calcAmount).toLocaleString("fr-FR")} {calcCurrency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-550">Prise en charge Vidange ({maintenancePaidBy === "owner" ? "100%" : maintenancePaidBy === "split" ? "50%" : "0%"}) :</span>
                        <span className="text-red-405">-{((maintenancePaidBy === "owner" ? 0.10 : maintenancePaidBy === "split" ? 0.05 : 0) * calcAmount).toLocaleString("fr-FR")} {calcCurrency}</span>
                      </div>

                      <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs mt-3">
                        <span className="font-sans font-black text-white text-[10px] uppercase">Bénéfice net investisseur :</span>
                        <span className="text-cyan-400 font-extrabold text-[12.5px]">
                          {Math.max(0, (calcAmount * calcOwnerPercent / 100) - ((fuelPaidBy === "owner" ? 0.18 : fuelPaidBy === "split" ? 0.09 : 0) * calcAmount) - ((maintenancePaidBy === "owner" ? 0.10 : maintenancePaidBy === "split" ? 0.05 : 0) * calcAmount)).toLocaleString("fr-FR")} {calcCurrency}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="border-t border-slate-850 pt-2 text-center text-[8px] text-slate-500 font-sans uppercase">
                  ✓ Calcul validé conformément aux CGU consolidées de GoMoto RDC • Arbitrage d'État direct
                </div>
              </div>
            </div>

            {/* Commission details */}
            <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800 flex items-start gap-3">
              <Award className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-white">Programme Partenaire GoMoto</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                  Chaque course terminée attribue 100% de la somme versée par le client. GoMoto RDC prélève ensuite 15% de commission pour financer l'assurance double-sinistre, le support 24/7 de Gombe, et la maintenance applicative. Le reste de vos revenus est retirable en temps réel.
                </p>
              </div>
            </div>

            {/* ================= DRIVER REFERRAL SYSTEM (SYSTEME DE PARRAINAGE CHAUFFEUR) ================= */}
            <div className="bg-slate-950 border-2 border-amber-500/30 rounded-2xl p-5 space-y-4 text-left">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-white text-xs flex items-center gap-1.5 uppercase tracking-wide">
                    <Gift className="w-4 h-4 text-yellow-500 animate-bounce" />
                    <span>Réseau de Parrainage des Chauffeurs</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-normal">Recrutez de nouveaux motards ou passagers à Kinshasa et partagez les bénéfices GoMoto !</p>
                </div>
                <div className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                  +15 000 CDF / +$5.00
                </div>
              </div>

              {/* Stats & Code block */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pb-3 border-b border-slate-800">
                {/* Promo Code Box */}
                <div className="md:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Votre Code de Parrainage Chauffeur</span>
                  <div className="flex gap-1.5 items-center bg-slate-950 p-2 rounded-lg border border-slate-800 justify-between">
                    <span className="font-mono text-xs font-black text-yellow-500 select-all">
                      {profile.myReferralCode || "GOMOTO-CHAUFFEUR-777"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const code = profile.myReferralCode || "GOMOTO-CHAUFFEUR-777";
                        navigator.clipboard.writeText(code);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }}
                      className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold px-2 py-1 text-[9px] rounded transition-all flex items-center gap-1 cursor-pointer border border-slate-750"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{isCopied ? "Copié !" : "Copier"}</span>
                    </button>
                  </div>
                </div>

                {/* Counter Stats & Sum */}
                <div className="md:col-span-6 grid grid-cols-2 gap-2">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center flex flex-col justify-center">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block font-extrabold">Filleuls Recrutés</span>
                    <span className="text-xl font-mono font-black text-yellow-500 block mt-0.5">{profile.referralCount || 0}</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center flex flex-col justify-center">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block font-extrabold">Cumul de Primes</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 block mt-0.5">
                      {((profile.referralCount || 0) * 15000).toLocaleString()} CDF
                    </span>
                    <span className="text-[9px] font-mono font-bold text-yellow-500 block">
                      +${((profile.referralCount || 0) * 5).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Simulation recruitment box */}
              <form onSubmit={handleInviteFriendSimulated} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block">
                  Enregistrer un nouveau filleul (Test de simulation)
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[8.5px] font-black text-slate-400 mb-1">Prénom du collègue</label>
                    <input
                      type="text"
                      placeholder="Ex: Junior"
                      value={invitedName}
                      onChange={(e) => setInvitedName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-yellow-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[8.5px] font-black text-slate-400 mb-1">Numéro de Téléphone RDC</label>
                    <input
                      type="text"
                      placeholder="+243"
                      value={invitedPhone}
                      onChange={(e) => setInvitedPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center gap-4">
                  <p className="text-[9.5px] text-slate-400 leading-snug max-w-[280px]">
                    Saisissez ses infos. En soumettant, vous simulez instantanément son inscription grâce à votre code parrain !
                  </p>
                  <button
                    type="submit"
                    className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-[10px] px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1 border-b-2 border-yellow-700"
                  >
                    <span>Valider l'Affiliation</span>
                  </button>
                </div>

                {referralFeedback && (
                  <div className="bg-emerald-950/40 text-emerald-300 border border-emerald-900/40 p-2.5 rounded-lg text-[9.5px] font-medium leading-relaxed mt-2 animate-fade-in font-sans">
                    {referralFeedback}
                  </div>
                )}
              </form>
            </div>

            {/* List of operations and balances */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span>Historique de Versement Chauffeur</span>
              </h4>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="divide-y divide-slate-850">
                  {transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <div key={tx.id} className="p-3 bg-slate-900/40 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs hover:bg-slate-900/80 transition-all">
                        <div className="flex items-start gap-3">
                          <span className={`h-2.5 w-2.5 rounded-full mt-1 shrink-0 ${tx.type === 'withdrawal' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                          <div>
                            <span className="font-extrabold text-slate-200 block">
                              {tx.type === "withdrawal" ? "Retrait de fonds" : "Gains de course terminés"}
                            </span>
                            <span className="text-[9px] text-slate-500 block mt-0.5">{tx.date} • {tx.method}</span>
                            
                            {/* Commission automatic breakdown details */}
                            {tx.type !== "withdrawal" ? (
                              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[8.5px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-900 leading-none">
                                <span>GoMoto (15%) : <b className="text-orange-400">-{Math.round(tx.amount * 0.15).toLocaleString()} {tx.currency}</b></span>
                                <span>•</span>
                                <span>Net part : <b className="text-emerald-400">{Math.round(tx.amount * 0.85).toLocaleString()} {tx.currency}</b></span>
                              </div>
                            ) : (
                              <div className="mt-1 text-[8.5px] font-mono text-slate-500 italic">
                                Frais d'opération Mobile Money : 0 CDF (Subventionné par la Direction de GoMoto RDC)
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right font-mono text-xs shrink-0 self-end sm:self-center">
                          <span className={`font-bold block ${tx.type === 'withdrawal' ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {tx.type === "withdrawal" ? "-" : "+"}
                            {tx.amount.toLocaleString()} {tx.currency}
                          </span>
                          <span className="text-[8px] block text-slate-500 uppercase font-black tracking-widest mt-0.5">Validé d'État</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-center text-[10px] text-slate-500">Aucun versement enregistré.</p>
                  )}
                </div>
              </div>
            </div>
          </>
          )}

          </div>
        )}

        {/* ================= TAB 2.5: RATINGS & CUSTOMER FEEDBACK TAB ================= */}
        {activeTab === "ratings" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-100 text-sm">Historique Réceptif d'Évaluations Civiques</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Retours d'expérience de vos passagers transportés en toute sécurité</p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 px-3.5 py-1.5 rounded-xl font-bold font-mono text-xs text-yellow-500 flex items-center gap-1.5 shadow-sm">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                <span>Score d'Exercice :</span>
                <span className="text-white font-black">{profile.rating || 5.0} / 5</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800 text-slate-400 text-xs leading-normal space-y-2">
              <span className="font-extrabold text-slate-200 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-yellow-500" />
                <span>Réglementation Nationale sur la Qualité en RDC :</span>
              </span>
              <p className="text-[10.5px]">
                La police provinciale de la République Démocratique du Congo exige le maintien d'une moyenne de satisfaction client supérieure à <b>3.5 / 5</b> pour garantir l'habilitation d'usage commercial des autoroutes et routes urbaines.
              </p>
            </div>

            <div className="space-y-3.5">
              {reviewsHistory.filter(r => r.toUserId === profile.id || !r.toUserId).length === 0 ? (
                <div className="text-center py-12 bg-slate-950 border border-slate-850 rounded-2xl">
                  <Star className="w-8 h-8 text-slate-700 mx-auto opacity-40 mb-2" />
                  <p className="text-xs text-slate-500 italic">Aucune évaluation civique passager reçue pour le moment.</p>
                </div>
              ) : (
                reviewsHistory.filter(r => r.toUserId === profile.id || !r.toUserId).map((rev) => (
                  <div key={rev.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-850 hover:border-slate-800 transition-all space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-black text-slate-200 block text-xs">{rev.fromUserName}</span>
                        <span className="text-[9px] text-slate-500 block font-bold font-mono mt-0.5 uppercase">Passager Identifié GoMoto</span>
                      </div>
                      <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3 h-3 ${rev.rating >= s ? "fill-yellow-500 text-yellow-500" : "text-slate-700"}`} />
                        ))}
                      </div>
                    </div>

                    {rev.comment ? (
                      <p className="text-slate-300 italic text-[11px] leading-relaxed bg-slate-900/50 p-2.5 rounded-xl border border-slate-900">
                        "{rev.comment}"
                      </p>
                    ) : (
                      <p className="text-slate-500 italic text-[10px]">Aucun commentaire écrit de l'utilisateur.</p>
                    )}

                    <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1.5 border-t border-slate-900/60 font-mono">
                      <span>Date : <b className="text-slate-400">{rev.timestamp}</b></span>
                      <span className="text-yellow-500/70 font-bold uppercase tracking-wider">Certifié Conforme RDC</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: LOCKED PROFILE / IDENTITY ARCHIVE ================= */}
        {activeTab === "profile" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-100 text-sm">Contrôle Fédéral d'Identité Chauffeur</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Identifiants civils et permis associés à l'autorisation d'exercice de l'Hôtel de Ville</p>
              </div>
              <span className="bg-amber-950/65 text-amber-400 border border-amber-900/40 px-3 py-1 rounded-xl font-bold flex items-center gap-1 text-[9px] uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" />
                <span>Bloqué</span>
              </span>
            </div>

            {/* Read-Only text inputs with Padlocks */}
            <div className="bg-amber-950/20 border border-amber-500/35 p-4 rounded-xl text-[10.5px] text-amber-200">
              <span className="font-bold flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Verrou d'intégrité pénal congolais :</span>
              </span>
              <p className="mt-1 text-slate-400 leading-normal">
                Conformément à la réglementation sur le transport par moto-taxi en RDC, les pièces d'identité et coordonnées validées ne peuvent pas être mis à jour sans un accord de l'administrateur de l'application. Tout manquement expose le chauffeur à des sanctions.
              </p>
            </div>

            {/* ================= INTERACTIVE DOUBLE-ENROLLMENT & STATE AUDIT SECTION ================= */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4 text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <span className="font-extrabold text-yellow-500 flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-mono">
                    <ShieldAlert className="w-4 h-4 text-yellow-500 animate-pulse" />
                    <span>Double Enrôlement Croisé Propriétaire-Chauffeur</span>
                  </span>
                  <p className="text-[10px] text-slate-350 leading-normal max-w-2xl font-sans">
                    Pour valider historiquement votre audit d'État auprès de la fédération des transports, vous devez lier votre dossier à celui de votre Propriétaire. Demandez au propriétaire légal de votre moto de vous fournir le <b>Code d'Affiliation Légale</b> généré sur son propre compte, puis saisissez-le ci-dessous pour confirmer l'association croisée officielle.
                  </p>
                </div>
                <div>
                  {driverCrossStatus === "confirmed" ? (
                    <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-black text-[9px] tracking-wider uppercase font-mono flex items-center gap-1 shrink-0 shadow-sm shadow-emerald-500/5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Validé par l'État</span>
                    </span>
                  ) : (
                    <span className="bg-amber-950/80 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-xl font-black text-[9px] tracking-wider uppercase font-mono flex items-center gap-1.5 shrink-0 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                      <span>Non Affilié</span>
                    </span>
                  )}
                </div>
              </div>

              {driverCrossStatus !== "confirmed" ? (
                <form onSubmit={handleValidateCrossEnrollment} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end pt-1">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[9.5px] font-bold text-slate-400 uppercase block font-sans">Saisir le Code d'Affiliation Légale de votre Propriétaire</label>
                    <input
                      type="text"
                      required
                      value={driverEnrollmentCodeInput}
                      onChange={(e) => setDriverEnrollmentCodeInput(e.target.value)}
                      placeholder="Ex: GOMOTO-RDC-MBO-1A2B3C"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-yellow-500 font-mono font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isValidatingEnrollment}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-2.5 px-4 rounded-xl text-[10.5px] uppercase transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer h-[41px]"
                  >
                    {isValidatingEnrollment ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-slate-950 animate-spin" />
                        <span>Vérification...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-slate-950" />
                        <span>Valider l'Affiliation</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="bg-emerald-950/40 border border-emerald-500/35 p-3.5 rounded-xl text-[11px] text-emerald-350 leading-relaxed text-left flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block">Dossier d'Association Réciproque Conforme</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">L'affiliation étatique double croisée a été validée avec succès. L'historique d'audit d'État a consolidé la liaison contractuelle de votre flotte auprès du Greffe de l'Hôtel de ville de Kinshasa.</span>
                    </div>
                  </div>

                  {getLinkedOwnerDetails() && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 text-left">
                      <span className="text-[8.5px] font-bold text-yellow-500 tracking-wider uppercase block font-mono">📋 FLOTTE & PROPRIÉTAIRE DÉSIGNÉ</span>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10.5px]">
                        <div>
                          <span className="text-slate-400 block text-[8px] uppercase">Propriétaire légal :</span>
                          <span className="text-slate-200 font-extrabold">{getLinkedOwnerDetails()?.firstName} {getLinkedOwnerDetails()?.lastName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[8px] uppercase">Téléphone Propriétaire :</span>
                          <span className="text-slate-250 font-mono font-bold">{getLinkedOwnerDetails()?.phone || "+243 812 770 099"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[8px] uppercase">Véhicule Assigné :</span>
                          <span className="text-yellow-400 font-bold">{getLinkedOwnerDetails()?.vehicleModel || "Honda CG 125 Sport"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[8px] uppercase">Plaque d'Immatriculation :</span>
                          <span className="text-slate-200 font-mono font-extrabold">{getLinkedOwnerDetails()?.vehiclePlate || "C-KIN-2026"}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {driverCrossFeedback && (
                <div className={`p-3.5 rounded-xl text-[10px] text-left leading-relaxed animate-fadeIn ${driverCrossFeedback.startsWith("❌") ? "bg-red-950/50 border border-red-500/30 text-red-300" : "bg-emerald-950/60 border border-emerald-500/25 text-emerald-350"}`}>
                  {driverCrossFeedback}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Prénom(s) (Lecture uniquement)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.firstName}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-850 text-slate-450 rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none cursor-not-allowed select-none font-bold"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-600 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nom de Famille (Lecture uniquement)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.lastName}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-850 text-slate-450 rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none cursor-not-allowed select-none font-bold"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-600 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Type de Document Soumis</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.documentType ? profile.documentType.replace(/_/g, " ").toUpperCase() : "CARTE D'IDENTITÉ NATIONALE CONGOLAISE"}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-850 text-slate-450 rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none cursor-not-allowed select-none font-bold"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-600 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Numéro du Document d'Identité</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.documentNumber || "CD-ID-77448211-M"}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-850 text-slate-455 font-mono rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none cursor-not-allowed select-none font-bold"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-600 absolute right-3.5 top-3.5" />
                </div>
              </div>
            </div>

            {/* Displaying submitted photo cards with padlocks */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Pièces Jointes Validées Certifiées</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 text-center relative">
                  <span className="absolute top-2 right-2 bg-slate-900 border border-slate-800 p-1.5 rounded-full text-slate-450" title="Verrouillé">
                    <Lock className="w-3 h-3 text-red-500" />
                  </span>
                  <img
                    referrerPolicy="no-referrer"
                    src={profile.documentPhotoFront || "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=200"}
                    alt="Recto Piece"
                    className="h-20 w-full object-cover rounded-lg border border-slate-800 select-none grayscale cursor-help"
                  />
                  <span className="text-[9px] text-slate-500 mt-1.5 block">Photo Recto (Face)</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 text-center relative">
                  <span className="absolute top-2 right-2 bg-slate-900 border border-slate-800 p-1.5 rounded-full text-slate-350" title="Verrouillé">
                    <Lock className="w-3 h-3 text-red-500" />
                  </span>
                  <img
                    referrerPolicy="no-referrer"
                    src={profile.documentPhotoBack || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200"}
                    alt="Verso Piece"
                    className="h-20 w-full object-cover rounded-lg border border-slate-800 select-none grayscale cursor-help"
                  />
                  <span className="text-[9px] text-slate-500 mt-1.5 block">Photo Verso (Dos)</span>
                </div>
              </div>
            </div>

            {/* Reviews received by this driver / partner from passenger customers */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4 text-left">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span>Mes Évaluations de Chauffeur Partenaire</span>
                </h4>
                <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl font-bold font-mono text-[10px] text-yellow-500 flex items-center gap-1">
                  <span>Moyenne :</span>
                  <span className="text-white font-extrabold">{profile.rating || 5.0} / 5</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {reviewsHistory.filter(r => r.toUserId === profile.id).length === 0 ? (
                  <p className="text-[10px] text-slate-500 bg-slate-900 p-4 rounded-xl border border-slate-850 text-center italic">
                    Aucune évaluation de client passager reçue pour le moment.
                  </p>
                ) : (
                  reviewsHistory.filter(r => r.toUserId === profile.id).map((rev) => (
                    <div key={rev.id} className="bg-slate-900 p-3.5 rounded-xl border border-slate-850 space-y-1.5 shadow-sm text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200">{rev.fromUserName} <span className="font-normal text-slate-500 text-[10px]">(Passager)</span></span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3 h-3 ${rev.rating >= s ? "fill-yellow-500 text-yellow-500" : "text-slate-700"}`} />
                          ))}
                        </div>
                      </div>
                      {rev.comment && <p className="text-slate-400 italic text-[11px]">"{rev.comment}"</p>}
                      <span className="text-[8px] font-mono text-slate-500 block mt-1">{rev.timestamp} • Certifié GoMoto</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recours Submission area for driver */}
            <div className="border-t border-slate-800 pt-5 space-y-4">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">Introduire un Recours administratif</h4>
              <p className="text-[11px] text-slate-400">
                Vous avez besoin de modifier votre identité civile ou permis d'exercice ? Rédigez le formulaire pour notification de la direction.
              </p>

              {modRequests.filter(req => req.userId === profile.id).map((req, i) => (
                <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-extrabold text-slate-300">Demande de correction d'identité</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Soumis le : {req.submittedAt}</span>
                    <span className="text-[10px] text-yellow-500 block mt-1">Noms requis : {req.requestedFirstName} {req.requestedLastName}</span>
                  </div>
                  <span className="bg-amber-950/60 text-yellow-500 border border-yellow-500/20 px-2.5 py-1 rounded text-[10px] font-bold">
                    Arbitrage Administratif en cours
                  </span>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setShowModModal(true)}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-2.5 px-6 rounded-xl text-xs transition-all flex items-center gap-1 shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Soumettre un Dossier d'Arbitrage</span>
              </button>
            </div>

          </div>
        )}

        {/* ================= TAB 4: OFFICIAL BADGE & ID CARD SYSTEM ================= */}
        {activeTab === "badge" && (
          <DriverBadgeGenerator profile={profile} lang={lang} />
        )}

        {/* ================= TAB 5: FISCALITÉ & DÉCLARATION PORTAL ================= */}
        {activeTab === "fiscalite" && (
          <div id="driver-fiscalite-panel" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-left space-y-6">
            
            {/* Header banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-yellow-500" />
                  <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">Ministère des Finances & Régie d'État (DGI RDC)</span>
                </div>
                <h3 className="text-base font-black text-slate-100 uppercase tracking-wide">
                  Déclaration Fiscale & Impôts
                </h3>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Téléchargez vos preuves de revenus certifiées sous format PDF et soumettez vos télédéclarations impôts à l'administration.
                </p>
              </div>
              <div className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-center self-start md:self-auto">
                Sceau GoMoto d'État
              </div>
            </div>

            {/* Address fields with Lock icons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 relative">
                <span className="absolute top-2.5 right-2.5 text-yellow-500">
                  <Lock className="w-3.5 h-3.5" />
                </span>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Adresse du Siège Social</span>
                <span className="text-[11px] font-semibold text-slate-350 block mt-1.5">
                  {GOMOTO_HQ_ADDRESS}
                </span>
                <span className="text-[8.5px] text-slate-500 block mt-1">Siège National Réglementaire GoMoto Kinshasa Gombe</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 relative">
                <span className="absolute top-2.5 right-2.5 text-yellow-500">
                  <Lock className="w-3.5 h-3.5" />
                </span>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Adresse Confidentielle Chauffeur</span>
                <span className="text-[11px] font-semibold text-slate-350 block mt-1.5">
                  {formatDRCAddress(profile.address)}
                </span>
                <span className="text-[8.5px] text-slate-500 block mt-1">Donnée confidentielle d'audit, masquée au public</span>
              </div>
            </div>

            {/* Document Generation Options */}
            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">1. Générer et Télécharger les PDF fiscaux</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1: Daily */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block">Bordereau Quotidien</span>
                    <h4 className="text-xs font-extrabold text-slate-200">Revenus de la Journée</h4>
                    <p className="text-[10px] text-slate-450 leading-relaxed">
                      Rapport d'audit de chiffre d'affaires consolidé pour la journée en cours. Utile pour la soumission ou decharge journalière.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const doc = generateDailyRevenuePDF(profile, completedRides);
                      doc.save(`GoMoto_Revenus_Journaliers_${profile.firstName}_${profile.lastName}.pdf`);
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-755 text-slate-200 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-750 transition-all"
                  >
                    <Download className="w-4 h-4 text-yellow-500" />
                    <span>Télécharger la Fiche de Journée</span>
                  </button>
                </div>

                {/* Option 2: Annual */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block font-sans">Déclaration Annuelle</span>
                    <h4 className="text-xs font-extrabold text-slate-200 font-sans">Déclaration d'Impôts Annuelle</h4>
                    <p className="text-[10px] text-slate-455 leading-relaxed">
                      Fiche certifiée d'exercice fiscal annuel requise pour le fisc national de la République Démocratique du Congo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const doc = generateAnnualTaxPDF(profile, completedRides);
                      doc.save(`GoMoto_Declaration_Annuelle_${profile.firstName}_${profile.lastName}.pdf`);
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-755 text-slate-200 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-750 transition-all"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Télécharger la Fiche d'Année</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Submission Form */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">2. Télédéclarer & Soumettre pour Approbation</span>
              
              <form onSubmit={handleTaxDocSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">Type de decharge fiscale</label>
                    <select
                      value={docTypeToSubmit}
                      onChange={(e: any) => setDocTypeToSubmit(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-yellow-500 font-bold"
                    >
                      <option value="daily_revenue">Revenus de la Journée (PDF)</option>
                      <option value="annual_tax">Déclaration d'Impôts Annuelle (PDF)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-455 uppercase mb-1">Période Déclarée</label>
                    <select
                      value={periodToSubmit}
                      onChange={(e) => setPeriodToSubmit(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-yellow-500 font-bold"
                    >
                      <option value="Aujourd'hui">Aujourd'hui (Journalier)</option>
                      <option value="Exercice Fiscal Trimestriel Q2 2026">Exercice Trimestriel Q2 2026</option>
                      <option value="Exercice Fiscal Annuel 2026">Exercice Annuel 2026 (Complet)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <span className="text-[8px] font-extrabold text-slate-500 uppercase block">Revenus cumulés (CDF)</span>
                    <span className="text-xs font-black text-emerald-400 block mt-0.5">{(completedRides.reduce((a,c)=>a+c.priceCDF,0) || 120500).toLocaleString()} CDF</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-extrabold text-slate-500 uppercase block">Revenus cumulés (USD)</span>
                    <span className="text-xs font-black text-yellow-500 block mt-0.5">${(completedRides.reduce((a,c)=>a+c.priceUSD,0) || 45.20).toFixed(2)} USD</span>
                  </div>
                </div>

                {submissionFeedback && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold text-center">
                    ✓ {submissionFeedback}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-yellow-550 hover:bg-yellow-500 text-slate-950 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Soumettre la Déclaration à la commission</span>
                </button>
              </form>
            </div>

            {/* Submission History */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Historique d'audit des Télédéclarations</span>
              
              {submittedTaxDocs.filter(d => d.userId === profile.id).length === 0 ? (
                <div className="p-5 text-center text-slate-500 bg-slate-950 border border-slate-850 rounded-2xl text-[11px] font-bold font-sans">
                  Aucun dossier fiscal soumis pour le moment.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {submittedTaxDocs.filter(d => d.userId === profile.id).map((doc) => (
                    <div key={doc.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-white">
                            {doc.docType === "daily_revenue" ? "Fiche de Journée" : "Déclaration Annuelle d'Impôts"}
                          </span>
                          <span className="text-[9.5px] text-slate-500">({doc.period ?? doc.details?.period ?? ""})</span>
                        </div>
                        <div className="text-[9px] text-slate-455 font-mono">
                          ID: {doc.id} • Soumis le: {doc.submittedAt}
                        </div>
                        <div className="text-[10px] text-slate-350">
                          Revenus certifiés : <span className="font-extrabold text-emerald-400">{(doc.totalCDF ?? doc.details?.totalCDF ?? 0).toLocaleString()} CDF</span> (~<span className="font-bold text-yellow-500">${(doc.totalUSD ?? doc.details?.totalUSD ?? 0).toFixed(2)} USD</span>)
                        </div>
                        {doc.adminNotes && (
                          <div className="text-[10px] text-amber-400 bg-slate-900 border border-slate-850 px-2.5 py-1 rounded-lg mt-1">
                            ⚠️ <b>Note de l'Administration :</b> {doc.adminNotes}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 flex-wrap">
                        <div>
                          {doc.status === "pending" && (
                            <span className="px-3 py-1 rounded-full text-[9px] font-extrabold bg-slate-900 text-slate-400 border border-slate-800 uppercase tracking-wider animate-pulse">
                              ⏳ En attente de revue
                            </span>
                          )}
                          {doc.status === "approved" && (
                            <span className="px-3 py-1 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-550/20 uppercase tracking-wider">
                              ✓ Approuvé & Certifié
                            </span>
                          )}
                          {doc.status === "rejected" && (
                            <span className="px-3 py-1 rounded-full text-[9px] font-extrabold bg-red-500/10 text-red-400 border border-red-550/20 uppercase tracking-wider">
                              ✕ Rejeté sous réserve
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const pdf = doc.docType === "daily_revenue"
                              ? generateDailyRevenuePDF(profile, completedRides)
                              : generateAnnualTaxPDF(profile, completedRides);
                            pdf.save(`GoMoto_Document_Fiscal_${doc.id}_${profile.firstName}_${profile.lastName}.pdf`);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Télécharger le document"
                        >
                          <FileText className="w-3 h-3 text-yellow-500" />
                          <span>{
                            (lang === "en" ? "Export PDF" :
                             lang === "ln" ? "Bimisa PDF" :
                             lang === "sw" ? "Pakua PDF" :
                             lang === "ts" ? "Patula PDF" :
                             lang === "kk" ? "Kukatula PDF" :
                             "Exporter en PDF")
                          }</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ================= MODIFICATION RECOURS MODAL ================= */}
      {showModModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl relative text-slate-100">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-yellow-500" />
              <span>Dossier de Recours civil : Identité / Pièces</span>
            </h3>

            <form onSubmit={handleSendModificationRequest} className="space-y-4 font-sans">
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
                  🔑 Pièces administratives à re-soumettre (facultatif)
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-yellow-500 font-mono font-bold"
                  />
                </div>

                {/* Doc photo front */}
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Photo Recto du document</span>
                  <div className="border border-dashed border-slate-800 bg-slate-950 rounded-xl p-2.5 text-center relative flex flex-col items-center justify-center min-h-[70px]">
                    {reqDocPhotoFront ? (
                      <div className="relative">
                        <img src={reqDocPhotoFront} className="h-10 object-contain rounded" />
                        <button type="button" onClick={() => setReqDocPhotoFront("")} className="absolute -top-1.5 -right-1.5 bg-red-950 text-red-400 border border-red-900 rounded-full p-0.5 text-[8px] font-bold font-sans">✕</button>
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
                        <button type="button" onClick={() => setReqDocPhotoBack("")} className="absolute -top-1.5 -right-1.5 bg-red-950 text-red-400 border border-red-900 rounded-full p-0.5 text-[8px] font-bold font-sans">✕</button>
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
                  placeholder="Justification légale (Ex: Correction d'orthographe suite à ma modification de carte d'électeur civile...)"
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-yellow-500 leading-relaxed font-sans"
                  required
                ></textarea>
              </div>

              <div className="bg-amber-955/15 border border-amber-900/30 p-3 rounded-xl text-[9px] text-slate-400 font-sans">
                <span className="font-extrabold text-yellow-550 block uppercase">Délai pénal d'évaluation :</span>
                Toute fausse déclaration ou falsification de dossier est un délit de faux et usage d'ordre civil passible de radiation immédiate de l'autorisation d'immatriculation d'État GoMoto.
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
                  className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-2.5 rounded-xl text-xs cursor-pointer transition-all"
                >
                  Soumettre Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= IDENTITY SELFIE PRESENCE VERIFICATION MODAL ================= */}
      {showSelfieModal && (
        <div id="selfie-presence-verification-modal" className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-center space-y-5 shadow-2xl relative overflow-hidden">
            
            {/* Header Identity Badge */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5 text-left">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  facialStep === "matched" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                  facialStep === "mismatched" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                  "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                }`}>
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[12.5px] text-slate-100 uppercase tracking-wider">Sécurisation Biométrique</h3>
                  <span className="text-[9.5px] text-slate-500 font-mono">ID de session: CONGO-AUTH-{profile.id.toUpperCase()}</span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setShowSelfieModal(false)}
                className="text-slate-400 hover:text-white transition-all cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Instruction Context Banner */}
            <div className="text-left bg-slate-950 p-3 rounded-xl border border-slate-850/60">
              <p className="text-[10px] text-slate-450 leading-relaxed">
                <span className="text-yellow-500 font-extrabold font-mono text-[9px] uppercase tracking-wider block mb-0.5">DIRECTIVE SÛRETÉ DU MINISTÈRE</span>
                Afin de se connecter au réseau de transport et recevoir des courses, vous devez effectuer une approbation faciale instantanée. L'API compare votre morphologie avec votre photo d'enrôlement nationale pour certifier votre identité.
              </p>
            </div>

            {/* HIGH-TECH CAMERA VIEWPORT */}
            <div className="relative bg-slate-950 h-[220px] rounded-2xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center">
              
              {/* Shutter camera flash animation overlay */}
              {facialStep === "capturing" && (
                <div className="absolute inset-0 bg-white z-20 animate-flash flex items-center justify-center">
                  <div className="text-slate-950 font-black text-sm uppercase tracking-widest animate-pulse">
                    CLICHÉ CAPTURÉ !
                  </div>
                </div>
              )}

              {/* Laser Scanning Animation bar in scanning mode */}
              {facialStep === "scanning" && (
                <div className="absolute left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent z-15 animate-scanline"></div>
              )}

              {/* Background live feed camera simulation under "ready" phase */}
              {facialStep === "ready" && (
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] flex flex-col items-center justify-center space-y-2">
                  <div className="h-16 w-16 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-slate-650 font-black text-lg">
                    [O]
                  </div>
                  <span className="text-[9.5px] font-mono text-slate-600 animate-pulse uppercase tracking-widest">
                    Flux Caméra Prêt • En Attente du cliché
                  </span>
                </div>
              )}

              {/* The captured or simulated picture display */}
              {selfieRawData && (
                <img 
                  referrerPolicy="no-referrer" 
                  src={selfieRawData} 
                  alt="Captured Selfie Preview" 
                  className="h-full w-full object-cover select-none pointer-events-none" 
                />
              )}

              {/* Biometric landmarks SVG Overlay (Only when scanning, matched, or mismatched) */}
              {(facialStep === "scanning" || facialStep === "matched" || facialStep === "mismatched") && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Outer Alignment target frame corners */}
                  <path d="M 8 15 L 8 8 L 15 8" stroke={facialStep === "matched" ? "#10B981" : facialStep === "mismatched" ? "#EF4444" : "#EAB308"} strokeWidth="1" fill="none" />
                  <path d="M 85 8 L 92 8 L 92 15" stroke={facialStep === "matched" ? "#10B981" : facialStep === "mismatched" ? "#EF4444" : "#EAB308"} strokeWidth="1" fill="none" />
                  <path d="M 8 85 L 8 92 L 15 92" stroke={facialStep === "matched" ? "#10B981" : facialStep === "mismatched" ? "#EF4444" : "#EAB308"} strokeWidth="1" fill="none" />
                  <path d="M 85 92 L 92 92 L 92 85" stroke={facialStep === "matched" ? "#10B981" : facialStep === "mismatched" ? "#EF4444" : "#EAB308"} strokeWidth="1" fill="none" />

                  {/* Face bounding ellipse overlay */}
                  <ellipse cx="50" cy="50" rx="22" ry="32" stroke={facialStep === "matched" ? "#10B981" : facialStep === "mismatched" ? "#EF4444" : "rgba(234, 179, 8, 0.4)"} strokeWidth="0.75" strokeDasharray="3,3" fill="none" />

                  {/* Eye alignment boxes */}
                  <rect x="36" y="38" width="8" height="6" stroke={facialStep === "mismatched" ? "#EF4444" : "#10B981"} strokeWidth="0.5" fill="none" />
                  <rect x="56" y="38" width="8" height="6" stroke={facialStep === "mismatched" ? "#EF4444" : "#10B981"} strokeWidth="0.5" fill="none" />

                  {/* Connecting mesh nodes (dots) */}
                  <circle cx="40" cy="41" r="1" fill={facialStep === "mismatched" ? "#EF4444" : "#10B981"} />
                  <circle cx="60" cy="41" r="1" fill={facialStep === "mismatched" ? "#EF4444" : "#10B981"} />
                  <circle cx="50" cy="54" r="1" fill={facialStep === "mismatched" ? "#EF4444" : "#10B981"} />
                  <circle cx="43" cy="68" r="1" fill={facialStep === "mismatched" ? "#EF4444" : "#10B981"} />
                  <circle cx="57" cy="68" r="1" fill={facialStep === "mismatched" ? "#EF4444" : "#10B981"} />
                  <circle cx="50" cy="72" r="1" fill={facialStep === "mismatched" ? "#EF4444" : "#10B981"} />

                  {/* Geometric matching lines */}
                  <line x1="40" y1="41" x2="50" y2="54" stroke={facialStep === "mismatched" ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"} strokeWidth="0.4" />
                  <line x1="60" y1="41" x2="50" y2="54" stroke={facialStep === "mismatched" ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"} strokeWidth="0.4" />
                  <line x1="43" y1="68" x2="50" y2="54" stroke={facialStep === "mismatched" ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"} strokeWidth="0.4" />
                  <line x1="57" y1="68" x2="50" y2="54" stroke={facialStep === "mismatched" ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"} strokeWidth="0.4" />
                </svg>
              )}

              {/* Match Result Overlay Badge */}
              {facialStep === "matched" && (
                <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 font-black text-[9px] px-2.5 py-1 rounded-lg uppercase shadow-lg border border-emerald-350 shrink-0">
                  MATCH {facialMatchScore}% ✓
                </div>
              )}

              {facialStep === "mismatched" && (
                <div className="absolute top-3 right-3 bg-rose-500 text-white font-black text-[9px] px-2.5 py-1 rounded-lg uppercase shadow-lg border border-rose-350 shrink-0">
                  MATCH {facialMatchScore}% ⚠️
                </div>
              )}
            </div>

            {/* TELEMETRY ENGINE LOGGER DISPLAY */}
            <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl text-left space-y-2">
              <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                <span>Rapport d'analyse API</span>
                {facialStep === "scanning" && (
                  <span className="font-bold text-yellow-500 animate-pulse">Analyse : {facialProgress}%</span>
                )}
                {facialStep === "matched" && (
                  <span className="font-extrabold text-emerald-400">CERTIFICATION OK</span>
                )}
                {facialStep === "mismatched" && (
                  <span className="font-extrabold text-rose-500">SIGNIFICATION REJET</span>
                )}
              </div>

              {/* Progress Bar during scanning */}
              {facialStep === "scanning" && (
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-yellow-500 h-full transition-all duration-150"
                    style={{ width: `${facialProgress}%` }}
                  />
                </div>
              )}

              <p className={`font-mono text-[9px] leading-relaxed transition-all ${
                facialStep === "matched" ? "text-emerald-400" :
                facialStep === "mismatched" ? "text-rose-400 font-extrabold" :
                "text-slate-400 hover:text-slate-200"
              }`}>
                &gt; {facialScanLog}
              </p>
            </div>

            {/* ACTION PANELS */}
            {facialStep === "ready" && (
              <div className="space-y-3.5">
                <div className="text-left">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block mb-1">DÉMO : SIMULER LE MATÉRIEL CAMÉRA</span>
                  <p className="text-[10px] text-slate-500">
                    Afin de tester le raccordement sécurisé, vous pouvez simuler une caméra capturant le visage conforme enregistré à l'enrôlement initial ou simuler une fraude (usurpateur) pour observer le verrouillage.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-1">
                  <button
                    type="button"
                    onClick={() => handleStartFacialScan("conform")}
                    className="bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 py-3 px-3.5 rounded-2xl text-[10.5px] font-black transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-400 fill-emerald-950/20" />
                    <span>Selfie Conforme [Propriétaire du compte]</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartFacialScan("fraud")}
                    className="bg-slate-800 hover:bg-slate-750 text-rose-400 border border-slate-700 py-3 px-3.5 rounded-2xl text-[10.5px] font-black transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <ShieldAlert className="w-5 h-5 text-rose-400 fill-rose-950/20" />
                    <span>Selfie Non Conforme [Autre Chauffeur]</span>
                  </button>
                </div>
              </div>
            )}

            {facialStep === "scanning" && (
              <div className="py-2.5 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
                <span className="text-xs text-slate-450 font-bold uppercase tracking-wider font-mono">
                  Comparaison biométrique en temps réel...
                </span>
              </div>
            )}

            {facialStep === "matched" && (
              <div className="space-y-4 pt-1 animate-in zoom-in duration-200">
                <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-900/35 flex items-center gap-3 text-left">
                  <div className="h-9 w-9 bg-emerald-500 text-slate-950 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                    OK
                  </div>
                  <p className="text-[10.5px] text-emerald-400 leading-normal">
                    La signature morphologique correspond au profil enregistré de <b>{profile.firstName} {profile.lastName}</b>. L'accès sécurisé à votre espace de travail est autorisé.
                  </p>
                </div>

                <form onSubmit={handleConfirmSelfieAndOnline} className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFacialStep("ready")}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer border border-slate-700"
                  >
                    Recommencer
                  </button>
                  <button
                    type="submit"
                    className="flex-grow bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-md uppercase tracking-wider"
                  >
                    Activer ma présence en ligne
                  </button>
                </form>
              </div>
            )}

            {facialStep === "mismatched" && (
              <div className="space-y-4 pt-1 animate-in zoom-in duration-200">
                <div className="bg-rose-950/40 p-3 rounded-2xl border border-rose-900/35 flex items-start gap-3 text-left">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-extrabold text-rose-450 uppercase block">USURPATION GÉOMÉTRIQUE ALERTE</span>
                    <p className="text-[10px] text-rose-400 leading-normal mt-0.5 animate-pulse">
                      La caméra a capturé un visage inconnu non synchronisé aux registres. L'autorisation d'immatriculation GoMoto RDC est temporairement restreinte. Tout abus sera communiqué au syndicat fiscal civil.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowSelfieModal(false)}
                    className="flex-1 bg-slate-950 hover:bg-slate-850 hover:text-slate-300 text-slate-400 font-bold py-2.5 rounded-xl text-xs border border-slate-850 transition-all cursor-pointer"
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacialStep("ready")}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-2.5 rounded-xl text-xs cursor-pointer shadow-md transition-all uppercase"
                  >
                    Réessayer le scan
                  </button>
                </div>
              </div>
            )}

            {/* Cancel fallback under idle or generic states */}
            {facialStep === "ready" && (
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSelfieModal(false)}
                  className="w-full bg-slate-950 hover:bg-slate-850 text-slate-405 hover:text-slate-205 font-bold py-2 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Annuler & Fermer
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ================= WITHDRAW REVENUES PAYOUT MODAL ================= */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <CreditCard className="w-4.5 h-4.5 text-yellow-500" />
              <span>Retrait de gains Mobile Money</span>
            </h3>

            <form onSubmit={handleWithdrawal} className="space-y-4">
              {!withdrawalOtpSent ? (
                <>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Montant à retirer</label>
                      <input
                        type="number"
                        min="1000"
                        placeholder="Ex: 10000"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-yellow-500 font-mono font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Devise du solde</label>
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
                    <div className="grid grid-cols-2 gap-2">
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
                      <button
                        type="button"
                        onClick={() => setPayoutMethod("Virement Bancaire")}
                        className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all ${
                          payoutMethod === "Virement Bancaire" ? "bg-blue-500/10 border-blue-500 text-blue-500" : "bg-slate-950 border-slate-850 text-slate-400"
                        }`}
                      >
                        Virement Bancaire
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 text-[9.5px] text-slate-500">
                    <span className="font-extrabold text-yellow-500 block">Dépôt sécurisé :</span>
                    Le retrait de vos gains s'effectuera directement via la méthode sélectionnée. Pour les virements bancaires, un délai de 24h à 48h peut s'appliquer.
                  </div>
                </>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200 text-left">
                  <div className="bg-amber-950/40 p-3.5 border border-amber-500/25 rounded-2xl text-left text-amber-400 space-y-1">
                    <span className="font-extrabold text-[9px] block uppercase tracking-wider font-mono text-amber-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      <span>SÉCURISATION DOUBLE FACTEUR D'ÉTAT</span>
                    </span>
                    <p className="text-[10px] leading-relaxed text-slate-300 font-sans">
                      Un code OTP temporaire de certification a été envoyé par SMS civil à votre numéro de service : <b>{profile.phone || "+243 998 440 119"}</b>.
                    </p>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entrez le code de vérification à 6 chiffres :</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="------"
                      value={withdrawalEnteredOtp}
                      onChange={(e) => setWithdrawalEnteredOtp(e.target.value)}
                      className="w-full text-center bg-slate-950 border border-slate-800 rounded-xl py-2.5 text-base font-mono font-extrabold tracking-widest text-[#F59E0B] outline-none focus:border-yellow-500"
                      required
                    />
                  </div>

                  {withdrawalOtpError && (
                    <p className="text-[10px] text-red-500 font-bold block text-left bg-red-950/20 px-3 py-1.5 border border-red-900/30 rounded-lg">{withdrawalOtpError}</p>
                  )}

                  <div className="flex justify-between items-center text-[10px] pt-1">
                    <span className="text-slate-500 font-bold">Volume de transfert :</span>
                    <span className="font-extrabold text-white font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">{payoutAmount} {payoutCurrency} via {payoutMethod}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawalOtpSent(false);
                      setWithdrawalEnteredOtp("");
                      setWithdrawalOtpError(null);
                    }}
                    className="text-[9px] text-[#F59E0B] hover:underline block text-center mx-auto cursor-pointer font-bold uppercase tracking-wide font-mono"
                  >
                    Choisir un autre montant
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPayoutModal(false);
                    setWithdrawalOtpSent(false);
                    setWithdrawalEnteredOtp("");
                    setWithdrawalOtpError(null);
                  }}
                  className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs cursor-pointer transition-all"
                >
                  {withdrawalOtpSent ? "Valider le Retrait" : "Confirmer le Retrait"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= GLOBAL SOS & DRC GOVT REQUIREMENTS MODAL ================= */}
      {showSOSModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-red-500 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="bg-red-600 text-white p-2 ml-1 rounded-2xl animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="font-black text-sm text-red-500 tracking-wider uppercase">🚨 PORTAIL SOS & ASSISTANCE RDC</h3>
                <p className="text-[10px] text-slate-400">Canaux de détresse de la République Démocratique du Congo & exigences de l'État</p>
              </div>
            </div>

            {/* Emergency clickable numbers matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <a
                href="tel:112"
                className="bg-red-950/40 hover:bg-red-950/60 transition-all border border-red-500/35 p-3 rounded-2xl text-center space-y-1 block cursor-pointer"
              >
                <span className="text-[8.5px] font-black text-red-400 uppercase tracking-widest block">Police PNC Gombe</span>
                <span className="text-md font-black text-white font-mono block">📞 112 / 111</span>
                <span className="text-[7.5px] text-slate-500 block">Autorités urbaines nationales</span>
              </a>

              <a
                href="tel:+243821445777"
                className="bg-yellow-950/30 hover:bg-yellow-950/50 transition-all border border-yellow-500/30 p-3 rounded-2xl text-center space-y-1 block cursor-pointer"
              >
                <span className="text-[8.5px] font-black text-yellow-500 uppercase tracking-widest block">Sécurité GoMoto</span>
                <span className="text-md font-black text-white font-mono block">📞 +243 821 445</span>
                <span className="text-[7.5px] text-slate-500 block">Assistance routière direct 24/7/365</span>
              </a>

              <a
                href="tel:118"
                className="bg-emerald-950/30 hover:bg-emerald-950/50 transition-all border border-emerald-500/30 p-3 rounded-2xl text-center space-y-1 block cursor-pointer"
              >
                <span className="text-[8.5px] font-black text-emerald-400 uppercase tracking-widest block">Pompiers / Samus</span>
                <span className="text-md font-black text-white font-mono block">📞 118 / 113</span>
                <span className="text-[7.5px] text-slate-500 block">Urgences vitales républicaines</span>
              </a>
            </div>

            {/* Official Government license portal */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2.5 text-left">
              <div className="flex justify-between items-center decoration-none">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-red-500" />
                  <span>Portail du Ministère des Transports :</span>
                </span>
                <span className="bg-red-500/20 text-red-400 py-0.5 px-2 rounded-md font-black text-[7.5px] uppercase tracking-widest border border-red-500/10">
                  Ressource Officielle
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-relaxed">
                Pour solliciter legalement l'immatriculation d'État et retirer les formulaires d'évaluation obligatoires pour le transport commercial par taxi-moto en RDC, visitez le portail de la Direction de Transports Urbains de Kinshasa :
              </p>
              <a
                href="https://www.transport.gouv.cd"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-red-650 hover:bg-red-650/80 text-white px-3.5 py-2 rounded-xl text-[10px] font-black tracking-wide border border-red-500/30 font-sans hover:underline cursor-pointer"
              >
                <span>Accéder à : www.transport.gouv.cd</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* RDC State taxi rules content */}
            <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-850 space-y-3.5 text-left text-xs leading-relaxed">
              <h4 className="font-bold text-white text-xs uppercase text-slate-300 border-b border-slate-900 pb-1.5 flex items-center gap-2">
                <span className="bg-red-600/10 text-red-550 border border-red-500/20 rounded h-1.5 w-1.5 inline-block"></span>
                <span>Exigences Gouvernementales Taxi-Moto RDC</span>
              </h4>

              <div className="space-y-3 font-sans text-slate-300">
                <div className="grid grid-cols-3 gap-2 border-b border-slate-900/40 pb-2">
                  <span className="text-[9.5px] text-slate-500 font-extrabold uppercase">Âge Limite</span>
                  <p className="col-span-2 text-[10.5px] font-bold text-slate-205">
                    Le conducteur doit avoir <span className="text-red-400 font-black">18 ans révolus</span>. Les mineurs ne sont pas admis pour exercer le taxi-moto.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 border-b border-slate-900/40 pb-2">
                  <span className="text-[9.5px] text-slate-500 font-extrabold uppercase">Permis National</span>
                  <p className="col-span-2 text-[10.5px] text-slate-205">
                    Permis de Conduire Congolais de <b>Catégorie-A</b> valide obligatoire requis pour tout contrôle de patrouille dans les communes.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 border-b border-slate-900/40 pb-2">
                  <span className="text-[9.5px] text-slate-500 font-extrabold uppercase">Politique Casques</span>
                  <p className="col-span-2 text-[10.5px] text-slate-205">
                    <b>Double casque de protection obligatoire</b> : un pour le taximan (motard) et un propre fourni obligatoirement au passager.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <span className="text-[9.5px] text-slate-500 font-extrabold uppercase">Gilet Réfléchissant</span>
                  <p className="col-span-2 text-[10.5px] text-slate-205">
                    Port de la chasuble d'identification municipale marqué avec la plaque d'immatriculation d'Hôtel de Ville correspondante.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSOSModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-350 font-black py-2.5 rounded-2xl text-xs transition-all cursor-pointer border border-slate-750"
            >
              Fermer la fenêtre d'Assistance
            </button>
          </div>
        </div>
      )}

      {/* ================= COURSE ACCEPTANCE CONFIRMATION MODAL ================= */}
      {rideToConfirm && (() => {
        const ct = confirmationTranslations[lang] || confirmationTranslations["fr"];
        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm md:max-w-md w-full space-y-5 shadow-2xl text-left relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-500 via-yellow-400 to-amber-500 animate-pulse"></div>
              
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 p-2.5 rounded-2xl">
                  <Navigation className="w-5 h-5 text-yellow-500 animate-bounce" />
                </div>
                <div className="text-left">
                  <h3 className="font-sans font-black text-[12.5px] text-white uppercase tracking-wider">
                    {ct.title}
                  </h3>
                  <span className="text-[8px] font-mono text-slate-400 block uppercase">
                    GOMOTO SÉCURITÉ CONGOLAISE
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Metric grid */}
                <div className="grid grid-cols-2 gap-3 font-sans">
                  <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl text-center space-y-1">
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">
                      {ct.distance}
                    </span>
                    <span className="text-md font-black text-white font-mono block">
                      🏍️ {rideToConfirm.distanceKm} KM
                    </span>
                  </div>

                  <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl text-center space-y-1">
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">
                      {ct.estimatedPrice}
                    </span>
                    <span className="text-xs font-black text-emerald-400 font-mono block">
                      {rideToConfirm.priceCDF.toLocaleString()} CDF
                    </span>
                    <span className="text-[8.5px] text-slate-400 font-bold block">
                      ${rideToConfirm.priceUSD} USD
                    </span>
                  </div>
                </div>

                {/* Itinerary details */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3 text-[11px] text-slate-300">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <div>
                      <span className="text-[8px] font-mono text-slate-500 uppercase block">{ct.departure}</span>
                      <b className="text-white text-[11px] leading-tight font-sans block">{rideToConfirm.pickupAddress.avenue}</b>
                      <span className="text-[9px] text-slate-400 font-medium block">{rideToConfirm.pickupAddress.quartier}, {rideToConfirm.pickupAddress.commune}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-900 my-2" />

                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />
                    <div>
                      <span className="text-[8px] font-mono text-slate-500 uppercase block">{ct.destination}</span>
                      <b className="text-white text-[11px] leading-tight font-sans block">{rideToConfirm.dropoffAddress.avenue}</b>
                      <span className="text-[9px] text-slate-400 font-medium block">{rideToConfirm.dropoffAddress.quartier}, {rideToConfirm.dropoffAddress.commune}</span>
                    </div>
                  </div>
                </div>

                {/* Accident prevention Warning */}
                <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-2xl text-center">
                  <p className="text-[9px] text-amber-300 font-sans leading-relaxed">
                    ⚠️ {ct.warning}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined" && "speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                    }
                    setRideToConfirm(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-350 font-black py-2.5 rounded-xl text-[10.5px] cursor-pointer transition-all text-center uppercase font-sans tracking-wide shrink-0"
                >
                  {ct.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined" && "speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                    }
                    handleAcceptRide(rideToConfirm);
                    setRideToConfirm(null);
                  }}
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-2.5 rounded-xl text-[10.5px] cursor-pointer transition-all text-center uppercase font-sans tracking-wide shrink-0 flex items-center justify-center gap-1 shadow-lg shadow-yellow-500/10"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{ct.accept}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
