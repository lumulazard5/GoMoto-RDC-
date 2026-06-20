/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, RideRequest, WalletTransaction, AdminModificationRequest, DRCAddress, RideMessage, RideReview, SOSAlert, DocumentType } from "../types";
import { mockAvenues, mockLocalities, getQuartiersForCommune, drcProvinces } from "../data/drcLocations";
import MapSimulator from "./MapSimulator";
import LiveMapTracking from "./LiveMapTracking";
import EmergencySOS from "./EmergencySOS";
import WeatherAlert from "./WeatherAlert";
import { jsPDF } from "jspdf";
import { 
  cacheWalletBalance, 
  getCachedWalletBalance, 
  cacheRidesHistory, 
  getCachedRidesHistory,
  CachedWallet,
  CachedRides
} from "../lib/offlineIndexedDB";
import { 
  hasSQLInjectionThreat, 
  hasXSSThreat, 
  sanitizeString, 
  getPresetSecurityEvents, 
  SecurityEvent, 
  getRandomKinshasaIP 
} from "../lib/securityGuard";
import { 
  Compass, 
  MapPin, 
  CreditCard, 
  User, 
  Navigation, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Clock, 
  ShieldAlert, 
  Lock, 
  Send,
  CheckCircle,
  HelpCircle,
  Smartphone,
  ChevronRight,
  Star,
  Activity,
  LogOut,
  ThumbsUp,
  Info,
  MessageSquare,
  Download,
  FileText,
  ShieldCheck,
  Shield,
  Server,
  Key,
  RotateCcw,
  AlertTriangle,
  Scale,
  Gift,
  Share2,
  Copy,
  Bell,
  X,
  RefreshCw,
  Sliders,
  Wifi,
  WifiOff,
  Database
} from "lucide-react";

import { AppLanguage, translations } from "../lib/translations";
import { DiscountCode, applyPromoToAmount } from "../lib/promo_store";
import { ClientPromotionHub } from "./PromotionManager";
import ChatWorkspaceManager from "./ChatWorkspaceManager";

interface ClientDashboardProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onSubmitModRequest: (request: AdminModificationRequest) => void;
  modRequests: AdminModificationRequest[];
  onLogout: () => void;
  lang?: AppLanguage;
  onTriggerSOS?: (alert: SOSAlert) => void;
  sosAlerts?: SOSAlert[];
}

export default function ClientDashboard({
  profile,
  onUpdateProfile,
  onSubmitModRequest,
  modRequests,
  onLogout,
  lang = "fr",
  onTriggerSOS,
  sosAlerts = [],
}: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState<"ride" | "wallet" | "profile" | "history" | "disputes" | "promotions">("ride");
  const [lastCacheSyncString, setLastCacheSyncString] = useState("");
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [blockedAttack, setBlockedAttack] = useState<any | null>(null);
  const [clientOtpNotify, setClientOtpNotify] = useState(false);
  
  const [completedRides, setCompletedRides] = useState<RideRequest[]>(() => {
    const saved = localStorage.getItem(`gomoto_rides_history_${profile.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    const initialRides: RideRequest[] = [
      {
        id: "ride-hist-101",
        clientId: profile.id,
        clientName: profile.firstName + " " + profile.lastName,
        clientPhone: profile.phone,
        pickupAddress: {
          province: profile.address.province,
          city: profile.address.city,
          commune: "Gombe",
          quartier: "Centre",
          localite: "Centre",
          avenue: "Boulevard du 30 Juin",
          number: "14"
        },
        dropoffAddress: {
          province: profile.address.province,
          city: profile.address.city,
          commune: "Kalamu",
          quartier: "Victoire",
          localite: "Centre",
          avenue: "Rond-Point Victoire",
          number: "1"
        },
        status: "completed",
        priceCDF: 12000,
        priceUSD: 4.5,
        distanceKm: 6.2,
        driverId: "usr-driver-1",
        driverName: "Ir. Héritier LUKUSA",
        driverPhone: "+243 899 123 456",
        timestamp: "03/06/2026 à 14:32"
      },
      {
        id: "ride-hist-102",
        clientId: profile.id,
        clientName: profile.firstName + " " + profile.lastName,
        clientPhone: profile.phone,
        pickupAddress: {
          province: profile.address.province,
          city: profile.address.city,
          commune: "Bandalungwa",
          quartier: "Bandal",
          localite: "Bandal Centre",
          avenue: "Avenue Kasa-Vubu",
          number: "260"
        },
        dropoffAddress: {
          province: profile.address.province,
          city: profile.address.city,
          commune: "Ngaliema",
          quartier: "UPN",
          localite: "UPN",
          avenue: "Route de Matadi",
          number: "5"
        },
        status: "completed",
        priceCDF: 18000,
        priceUSD: 6.5,
        distanceKm: 8.4,
        driverId: "usr-driver-2",
        driverName: "Jean-Pierre NYEMBO",
        driverPhone: "+243 811 987 654",
        timestamp: "01/06/2026 à 09:15"
      }
    ];
    localStorage.setItem(`gomoto_rides_history_${profile.id}`, JSON.stringify(initialRides));
    return initialRides;
  });

  const [selectedHistoryRide, setSelectedHistoryRide] = useState<string | null>("ride-hist-101");

  const [showSOSModal, setShowSOSModal] = useState(false);

  // Recharge 2FA OTP security states
  const [rechargeOtpSent, setRechargeOtpSent] = useState<boolean>(false);
  const [rechargeGeneratedOtp, setRechargeGeneratedOtp] = useState<string>("");
  const [rechargeEnteredOtp, setRechargeEnteredOtp] = useState<string>("");
  const [rechargeOtpError, setRechargeOtpError] = useState<string | null>(null);

  // Ride History Search & Filter states
  const [historySearchQuery, setHistorySearchQuery] = useState<string>("");
  const [historyPriceRange, setHistoryPriceRange] = useState<string>("all");

  // Locations states
  const [pickupRoad, setPickupRoad] = useState<string>("");
  const [dropoffRoad, setDropoffRoad] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<"moto_classique" | "moto_premium" | "moto_cargo">("moto_classique");
  const [appliedPromo, setAppliedPromo] = useState<DiscountCode | null>(null);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("kinshasa");
  const [selectedCityName, setSelectedCityName] = useState<string>("Kinshasa");
  const [selectedCommuneName, setSelectedCommuneName] = useState<string>("Gombe");
  const [simulatedCongestion, setSimulatedCongestion] = useState<"low" | "medium" | "high">("low");
  const [isSimulatingItinerary, setIsSimulatingItinerary] = useState<boolean>(false);

  // Ride Simulation states
  const [rideStatus, setRideStatus] = useState<RideRequest["status"] | "idle">("idle");
  const [rideHelmetConsent, setRideHelmetConsent] = useState<boolean>(false);
  
  // Mandatory Road Safety Pact (Engagement Obligatoire au Pacte de Sécurité)
  const [isPactSigned, setIsPactSigned] = useState<boolean>(() => {
    return localStorage.getItem(`gomoto_pact_signed_client_${profile.id}`) === "true";
  });
  const [pledgeName, setPledgeName] = useState<string>(`${profile.firstName} ${profile.lastName}`);
  const [pledgeRole, setPledgeRole] = useState<"client" | "driver" | "owner">("client");
  const [pledgeCasque, setPledgeCasque] = useState<boolean>(false);
  const [pledgeRules, setPledgeRules] = useState<boolean>(false);
  const [pledgeNoProhibited, setPledgeNoProhibited] = useState<boolean>(false);
  const [pledgeRespectDrivers, setPledgeRespectDrivers] = useState<boolean>(false);
  const [pledgeRespectAgents, setPledgeRespectAgents] = useState<boolean>(false);
  const [pledgeZeroTolerance, setPledgeZeroTolerance] = useState<boolean>(false);
  const [pledgeCertCode, setPledgeCertCode] = useState<string>(() => {
    return localStorage.getItem(`gomoto_pact_cert_client_${profile.id}`) || "";
  });
  const [pledgeDateStr, setPledgeDateStr] = useState<string>(() => {
    return localStorage.getItem(`gomoto_pact_date_client_${profile.id}`) || "";
  });

  const handleSignPact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pledgeName.trim() || !pledgeCasque || !pledgeRules || !pledgeNoProhibited || !pledgeRespectDrivers || !pledgeRespectAgents || !pledgeZeroTolerance) return;
    const randomHex = Math.floor(100000 + Math.random() * 900000).toString();
    const generatedCert = `GOMOTO-RDC-SEC-PASS-${randomHex}`;
    
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    };
    const nowStr = new Date().toLocaleDateString("fr-CD", options);
    
    localStorage.setItem(`gomoto_pact_signed_client_${profile.id}`, "true");
    localStorage.setItem(`gomoto_pact_cert_client_${profile.id}`, generatedCert);
    localStorage.setItem(`gomoto_pact_date_client_${profile.id}`, nowStr);
    
    setPledgeCertCode(generatedCert);
    setPledgeDateStr(nowStr);
    setIsPactSigned(true);
    setRideHelmetConsent(true); // Automatically consent for the current ride since they signed the whole general pact
  };
  const [assignedDriver, setAssignedDriver] = useState<{
    name: string;
    phone: string;
    plate: string;
    rating: number;
    selfie: string;
    color: string;
  } | null>(null);

  // Position states for dynamic map tracking
  const [driverPos, setDriverPos] = useState({ x: 150, y: 140 });
  const [passengerPos, setPassengerPos] = useState({ x: 240, y: 220 });
  const [mapViewMode, setMapViewMode] = useState<"simulator" | "live">("live");
  const [distanceKm, setDistanceKm] = useState(2.8);

  // Wallet Recharge States
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showPaymentConfirmationModal, setShowPaymentConfirmationModal] = useState(false);
  const [paymentDetailsForModal, setPaymentDetailsForModal] = useState<{
    totalAmount: number;
    paymentUsed: "CDF" | "USD";
    serviceCost: number;
    remainingBalance: number;
  } | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState<string>("5000");
  const [rechargeCurrency, setRechargeCurrency] = useState<"CDF" | "USD">("CDF");
  const [rechargeMethod, setRechargeMethod] = useState<"M-Pesa" | "Orange Money" | "Airtel Money">("M-Pesa");
  const [rechargePhone, setRechargePhone] = useState(profile.phone);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  
  // Offline & Connectivity states (IndexedDB / Local Caching)
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== "undefined" ? navigator.onLine : true);
  
  // Custom disputes and arbitrage states
  interface DisputeRecord {
    id: string;
    rideId: string;
    amount: number;
    currency: "CDF" | "USD";
    reason: string;
    details: string;
    status: "approved" | "pending" | "rejected";
    date: string;
    pickup: string;
    dropoff: string;
    driverName?: string;
  }

  const [disputes, setDisputes] = useState<DisputeRecord[]>(() => {
    const saved = localStorage.getItem(`gomoto_disputes_${profile.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [arbitrageRideId, setArbitrageRideId] = useState<string>("");
  const [arbitrageReason, setArbitrageReason] = useState<string>("course_non_effectuee");
  const [arbitrageDetails, setArbitrageDetails] = useState<string>("");
  const [arbitrageRefundCurrency, setArbitrageRefundCurrency] = useState<"CDF" | "USD">("CDF");
  
  // Referral (Parrainage) states
  const [isCopied, setIsCopied] = useState(false);

  // Préférences de course states
  const [prefHelmet, setPrefHelmet] = useState<boolean>(() => profile.ridePreferences?.helmetRequired ?? true);
  const [prefSafeDriving, setPrefSafeDriving] = useState<boolean>(() => profile.ridePreferences?.safeDrivingOnly ?? true);
  const [prefSilentRide, setPrefSilentRide] = useState<boolean>(() => profile.ridePreferences?.silentRide ?? false);
  const [prefBaggageCargo, setPrefBaggageCargo] = useState<boolean>(() => profile.ridePreferences?.baggageCargo ?? false);
  const [prefCustomNote, setPrefCustomNote] = useState<string>(() => profile.ridePreferences?.customDriverNote ?? "");

  const savePreferences = (
    helmet: boolean,
    safe: boolean,
    silent: boolean,
    cargo: boolean,
    note: string
  ) => {
    const updatedPreferences = {
      helmetRequired: helmet,
      safeDrivingOnly: safe,
      silentRide: silent,
      baggageCargo: cargo,
      customDriverNote: note,
    };
    
    const updatedProfile = {
      ...profile,
      ridePreferences: updatedPreferences,
    };

    onUpdateProfile(updatedProfile);

    const usersStr = localStorage.getItem("gomoto_users");
    if (usersStr) {
      const parsedUsers: UserProfile[] = JSON.parse(usersStr);
      const updatedUsersList = parsedUsers.map(u => {
        if (u.id === profile.id) {
          return {
            ...u,
            ridePreferences: updatedPreferences
          };
        }
        return u;
      });
      localStorage.setItem("gomoto_users", JSON.stringify(updatedUsersList));
    }
    
    showToast(
      "success",
      "Préférences enregistrées",
      "Vos préférences de course ont été enregistrées avec succès et seront partagées lors de vos commandes."
    );
  };

  // Toast notifications states
  interface ToastItem {
    id: string;
    type: "success" | "info" | "warning" | "error";
    title: string;
    message: string;
  }
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (type: "success" | "info" | "warning" | "error", title: string, message: string) => {
    const id = "toast-" + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  // Real-time wallet recharge validations computed dynamically
  const currentLang = lang || "fr";
  const rechargeAmountNum = parseFloat(rechargeAmount);
  let rechargeAmountError = "";
  if (!rechargeAmount) {
    rechargeAmountError = currentLang === "fr" ? "Veuillez saisir un montant." : "Please enter an amount.";
  } else if (isNaN(rechargeAmountNum) || rechargeAmountNum <= 0) {
    rechargeAmountError = currentLang === "fr" ? "Le montant doit être supérieur à zéro." : "Amount must be greater than zero.";
  } else if (rechargeCurrency === "CDF") {
    if (rechargeAmountNum < 500) {
      rechargeAmountError = currentLang === "fr" ? "Dépôt minimum : 500 CDF." : "Minimum deposit: 500 CDF.";
    } else if (rechargeAmountNum > 1500000) {
      rechargeAmountError = currentLang === "fr" ? "Dépôt maximum : 1 500 000 CDF." : "Maximum deposit: 1,500,000 CDF.";
    }
  } else if (rechargeCurrency === "USD") {
    if (rechargeAmountNum < 1) {
      rechargeAmountError = currentLang === "fr" ? "Dépôt minimum : 1 USD." : "Minimum deposit: 1 USD.";
    } else if (rechargeAmountNum > 1000) {
      rechargeAmountError = currentLang === "fr" ? "Dépôt maximum : 1 000 USD." : "Maximum deposit: 1,000 USD.";
    }
  }

  let rechargePhoneError = "";
  let rechargePhoneWarning = ""; // Alert user without blocking if prefix has slight oddity
  const cleanRechargePhone = rechargePhone.replace(/[\s-]/g, "");
  if (!cleanRechargePhone) {
    rechargePhoneError = currentLang === "fr" ? "Veuillez saisir votre numéro Mobile Money." : "Please enter your Mobile Money phone number.";
  } else {
    const drcPhoneRegex = /^(?:\+243|243|0)(80|81|82|83|84|85|89|90|91|97|98|99)\d{7}$/;
    if (!drcPhoneRegex.test(cleanRechargePhone)) {
      rechargePhoneError = currentLang === "fr" 
        ? "Numéro non valide (RDC valide attendu, ex: +243821234567 ou 0821234567)" 
        : "Invalid number (Valid DRC number expected, e.g. +243821234567 or 0821234567)";
    } else {
      // Real-time prefix validation compatible with selected mobile money partner
      const match = cleanRechargePhone.match(/^(?:\+243|243|0)?(80|81|82|83|84|85|89|90|91|97|98|99)/);
      if (match) {
        const prefix = match[1];
        if (rechargeMethod === "M-Pesa" && !["81", "82", "83", "80"].includes(prefix)) {
          rechargePhoneError = currentLang === "fr"
            ? `Le préfixe 0${prefix} ne correspond pas à Vodacom M-Pesa (les préfixes attendus sont 081, 082, 083)`
            : `Prefix 0${prefix} is not compatible with Vodacom M-Pesa (expected 081, 082, or 083)`;
        } else if (rechargeMethod === "Orange Money" && !["84", "85", "89"].includes(prefix)) {
          rechargePhoneError = currentLang === "fr"
            ? `Le préfixe 0${prefix} ne correspond pas à Orange Money (les préfixes attendus sont 084, 085, 089)`
            : `Prefix 0${prefix} is not compatible with Orange Money (expected 084, 085, or 089)`;
        } else if (rechargeMethod === "Airtel Money" && !["97", "98", "99", "90", "91"].includes(prefix)) {
          rechargePhoneError = currentLang === "fr"
            ? `Le préfixe 0${prefix} ne correspond pas à Airtel Money (les préfixes attendus sont 097, 098, 099)`
            : `Prefix 0${prefix} is not compatible with Airtel Money (expected 097, 098, or 099)`;
        }
      }
    }
  }

  const isRechargeFormInvalid = !!rechargeAmountError || !!rechargePhoneError;

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

  const [activeRideRating, setActiveRideRating] = useState<number>(5);
  const [rideSuccessMessage, setRideSuccessMessage] = useState(false);

  // Messaging & Ratings Features
  const [currentRideId, setCurrentRideId] = useState<string>("");
  const [messages, setMessages] = useState<RideMessage[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [ratingComment, setRatingComment] = useState<string>("");
  const [reviewsHistory, setReviewsHistory] = useState<RideReview[]>([]);

  // Network Resilience Status & Caching Synchronization Loop
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("success", "Connexion Rétablie", "Votre connexion internet est de nouveau stable. Synchronisation des données d'État GoMoto RDC en cours...");
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast("warning", "Connexion Interrompue", "Réseau instable détecté. Passage automatique en mode consultation d'historique hors-ligne (sécurité de cache d'État).");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial preload check
    getCachedWalletBalance(profile.id)
      .then(wallet => {
        if (wallet) {
          const syncDate = new Date(wallet.updatedAt);
          setLastCacheSyncString(syncDate.toLocaleTimeString("fr-FR") + " " + syncDate.toLocaleDateString("fr-FR"));
        }
      })
      .catch(err => console.error("Could not retrieve initial wallet cache metadata:", err));

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [profile.id]);

  // Sync wallet changes to IndexedDB
  useEffect(() => {
    if (profile) {
      cacheWalletBalance(profile.walletBalanceCDF, profile.walletBalanceUSD, profile.id)
        .then(() => {
          const now = new Date();
          setLastCacheSyncString(now.toLocaleTimeString("fr-FR") + " " + now.toLocaleDateString("fr-FR"));
        })
        .catch(err => console.error("Failed to automatically synchronize wallet to database:", err));
    }
  }, [profile.walletBalanceCDF, profile.walletBalanceUSD, profile.id]);

  // Sync completed rides changes to IndexedDB
  useEffect(() => {
    if (completedRides && completedRides.length > 0) {
      cacheRidesHistory(completedRides, profile.id)
        .then(() => {
          const now = new Date();
          setLastCacheSyncString(now.toLocaleTimeString("fr-FR") + " " + now.toLocaleDateString("fr-FR"));
        })
        .catch(err => console.error("Failed to automatically synchronize completed rides to database:", err));
    }
  }, [completedRides, profile.id]);

  // Initialize avenues and transaction histories
  useEffect(() => {
    setPickupRoad(profile.address.avenue || mockAvenues[0]);
    setDropoffRoad(mockAvenues[1]);

    const matchedProvince = drcProvinces.find(p => 
      p.name.toLowerCase() === profile.address.province.toLowerCase() || 
      p.id === profile.address.province.toLowerCase()
    ) || drcProvinces[0];
    setSelectedProvinceId(matchedProvince.id);
    setSelectedCityName(profile.address.city || (matchedProvince.cities && matchedProvince.cities[0]?.name) || "Kinshasa");
    setSelectedCommuneName(profile.address.commune || (matchedProvince.cities && matchedProvince.cities[0]?.communes[0]) || "Gombe");

    // Initialize or load rating logs and reviews
    const presetReviews: RideReview[] = [
      {
        id: "rev-init-1",
        rideId: "ride-old-1",
        fromUserId: "usr-client-01",
        fromUserName: "Madame Sarah KALANGA",
        fromUserRole: "client",
        toUserId: "usr-driver-777",
        toUserName: "Ir. Héritier LUKUSA",
        rating: 5,
        comment: "Excellent chauffeur ! Très prudent sur les boulevards de Gombe.",
        timestamp: "28/05/2026"
      },
      {
        id: "rev-init-2",
        rideId: "ride-old-2",
        fromUserId: "usr-client-02",
        fromUserName: "Papa Jean-Pierre ALOBA",
        fromUserRole: "client",
        toUserId: "usr-driver-777",
        toUserName: "Ir. Héritier LUKUSA",
        rating: 4,
        comment: "Moto très propre, casque fourni de bonne qualité.",
        timestamp: "29/05/2026"
      },
      {
        id: "rev-init-3",
        rideId: "ride-old-3",
        fromUserId: "usr-driver-777",
        fromUserName: "Ir. Héritier LUKUSA",
        fromUserRole: "driver",
        toUserId: profile.id,
        toUserName: profile.firstName + " " + profile.lastName,
        rating: 5,
        comment: "Passager courtois, très ponctuel au point de rendez-vous.",
        timestamp: "30/05/2026"
      }
    ];

    const loadedRatings = localStorage.getItem("gomoto_ratings_v1");
    if (!loadedRatings) {
      localStorage.setItem("gomoto_ratings_v1", JSON.stringify(presetReviews));
      setReviewsHistory(presetReviews);
    } else {
      setReviewsHistory(JSON.parse(loadedRatings));
    }

    const loadedTx = localStorage.getItem(`gomoto_transactions_${profile.id}`);
    if (loadedTx) {
      setTransactions(JSON.parse(loadedTx));
    } else {
      const initialTransactions: WalletTransaction[] = [
        {
          id: "tx-init-1",
          userId: profile.id,
          amount: 25000,
          currency: "CDF",
          type: "deposit",
          method: "M-Pesa",
          status: "completed",
          date: "02/06/2026 à 07:12"
        },
        {
          id: "tx-init-ride-1",
          userId: profile.id,
          amount: 5500,
          currency: "CDF",
          type: "ride_payment",
          method: "Wallet_System",
          status: "completed",
          date: "31/05/2026 à 14:22",
          rideDetails: {
            pickup: "Grand Hôtel de Kinshasa, Gombe",
            dropoff: "Aéroport de Ndolo, Barumbu",
            driverName: "Ir. Héritier LUKUSA",
            distanceKm: 4.8
          }
        },
        {
          id: "tx-init-2",
          userId: profile.id,
          amount: 10,
          currency: "USD",
          type: "deposit",
          method: "Airtel Money",
          status: "completed",
          date: "02/06/2026 à 06:45"
        },
        {
          id: "tx-init-ride-2",
          userId: profile.id,
          amount: 2.50,
          currency: "USD",
          type: "ride_payment",
          method: "Wallet_System",
          status: "completed",
          date: "29/05/2026 à 18:05",
          rideDetails: {
            pickup: "Palais du Peuple, Lingwala",
            dropoff: "Rond-point Victoire, Kalamu",
            driverName: "Ir. Héritier LUKUSA",
            distanceKm: 2.1
          }
        }
      ];
      setTransactions(initialTransactions);
      localStorage.setItem(`gomoto_transactions_${profile.id}`, JSON.stringify(initialTransactions));
    }
  }, [profile]);

  // Deterministic distance calculator based on city and address
  useEffect(() => {
    if (!pickupRoad || !dropoffRoad) return;
    
    const str = `${selectedCityName}-${selectedCommuneName}-${pickupRoad}-${dropoffRoad}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const positiveHash = Math.abs(hash);
    let baseKm = (positiveHash % 80) / 10 + 1.5;
    
    const lCaseCity = selectedCityName.toLowerCase();
    if (lCaseCity.includes("kinshasa")) {
      baseKm *= 1.15;
    } else if (lCaseCity.includes("kolwezi") || lCaseCity.includes("kasumbalesa")) {
      baseKm *= 0.85;
    }
    
    setDistanceKm(parseFloat(baseKm.toFixed(1)));
  }, [pickupRoad, dropoffRoad, selectedCityName, selectedCommuneName]);

  const activeProvince = drcProvinces.find(p => p.id === selectedProvinceId) || drcProvinces[0];
  const activeCities = activeProvince.cities || [];
  const activeCity = activeCities.find(c => c.name === selectedCityName) || activeCities[0] || { name: "", communes: [] };
  const activeCommunes = activeCity.communes || [];

  const handleProvinceChange = (provId: string) => {
    setSelectedProvinceId(provId);
    const prov = drcProvinces.find(p => p.id === provId);
    if (prov && prov.cities && prov.cities.length > 0) {
      setSelectedCityName(prov.cities[0].name);
      if (prov.cities[0].communes && prov.cities[0].communes.length > 0) {
        setSelectedCommuneName(prov.cities[0].communes[0]);
      } else {
        setSelectedCommuneName("Centre");
      }
    }
  };

  const handleCityChange = (cityName: string) => {
    setSelectedCityName(cityName);
    const city = activeCities.find(c => c.name === cityName);
    if (city && city.communes && city.communes.length > 0) {
      setSelectedCommuneName(city.communes[0]);
    } else {
      setSelectedCommuneName("Centre");
    }
  };

  // Pricing based on vehicle class, distance, chosen city, and simulated traffic
  const getPrices = () => {
    let multiplier = 2000; // 2000 CDF per Km
    let usdRate = 2800;    // $1 = 2800 CDF
    if (selectedClass === "moto_premium") multiplier = 2700;
    if (selectedClass === "moto_cargo") multiplier = 3200;

    // Base "Prise en charge" fee
    let baseFeeCDF = 1500;
    let cityMultiplier = 1.0;
    const lCaseCity = selectedCityName.toLowerCase();

    if (lCaseCity.includes("kinshasa")) {
      baseFeeCDF = 1500;
      cityMultiplier = 1.0;
      if (selectedCommuneName.toLowerCase() === "gombe") {
        cityMultiplier = 1.25; // Elite zone surge
      }
    } else if (lCaseCity.includes("lubumbashi")) {
      baseFeeCDF = 1800;
      cityMultiplier = 1.15;
    } else if (lCaseCity.includes("kolwezi")) {
      baseFeeCDF = 1800;
      cityMultiplier = 1.20;
    } else if (lCaseCity.includes("goma")) {
      baseFeeCDF = 1600;
      cityMultiplier = 1.10;
    } else {
      baseFeeCDF = 1000;
      cityMultiplier = 0.90;
    }

    // Traffic congestion modifier
    let trafficFactor = 1.0;
    if (simulatedCongestion === "medium") trafficFactor = 1.20;
    if (simulatedCongestion === "high") trafficFactor = 1.40;

    const ratePerKm = Math.round(multiplier * cityMultiplier * trafficFactor);
    const basePriceCDF = baseFeeCDF + Math.round(distanceKm * ratePerKm);
    const basePriceUSD = parseFloat((basePriceCDF / usdRate).toFixed(2));

    return {
      cdf: basePriceCDF,
      usd: basePriceUSD,
      baseFee: baseFeeCDF,
      ratePerKm,
      cityMultiplier,
      trafficFactor
    };
  };

  const prices = getPrices();

  const finalPrices = (() => {
    const usdRate = 2800;
    if (!appliedPromo) {
      return {
        cdf: prices.cdf,
        usd: prices.usd,
        discountCDF: 0,
        discountUSD: 0,
        applied: false
      };
    }
    const applied = applyPromoToAmount(prices.cdf, "CDF", appliedPromo, usdRate);
    const discCDF = applied.discountAmount;
    const finalCDF = applied.finalAmount;
    const finalUSD = parseFloat((finalCDF / usdRate).toFixed(2));
    const discUSD = parseFloat((discCDF / usdRate).toFixed(2));
    return {
      cdf: finalCDF,
      usd: finalUSD,
      discountCDF: discCDF,
      discountUSD: discUSD,
      applied: true
    };
  })();

  const getETA = () => {
    if (rideStatus === "searching") return "Recherche de chauffeur...";
    if (rideStatus === "accepted") {
      const dx = passengerPos.x - driverPos.x;
      const dy = passengerPos.y - driverPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const mins = Math.ceil(dist / 30);
      return mins > 0 ? `${mins} minutes` : "Arrivé !";
    }
    if (rideStatus === "picked_up") {
      const destination = { x: 330, y: 300 };
      const dx = destination.x - driverPos.x;
      const dy = destination.y - driverPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const mins = Math.ceil(dist / 20);
      return mins > 0 ? `${mins} mins restants` : "Arrive à destination !";
    }
    return "Arrivé à destination !";
  };

  const getProgressPercentage = () => {
    if (rideStatus === "accepted") {
      const startPos = { x: 60, y: 60 };
      const totalDx = passengerPos.x - startPos.x;
      const totalDy = passengerPos.y - startPos.y;
      const totalDistance = Math.sqrt(totalDx * totalDx + totalDy * totalDy);

      const dx = passengerPos.x - driverPos.x;
      const dy = passengerPos.y - driverPos.y;
      const leftDistance = Math.sqrt(dx * dx + dy * dy);

      const percent = Math.round(((totalDistance - leftDistance) / totalDistance) * 100);
      return Math.min(100, Math.max(0, percent));
    }
    if (rideStatus === "picked_up") {
      const startPos = { x: 240, y: 220 };
      const destination = { x: 330, y: 300 };
      const totalDx = destination.x - startPos.x;
      const totalDy = destination.y - startPos.y;
      const totalDistance = Math.sqrt(totalDx * totalDx + totalDy * totalDy);

      const dx = destination.x - driverPos.x;
      const dy = destination.y - driverPos.y;
      const leftDistance = Math.sqrt(dx * dx + dy * dy);

      const percent = Math.round(((totalDistance - leftDistance) / totalDistance) * 100);
      return Math.min(100, Math.max(0, percent));
    }
    if (rideStatus === "completed") return 100;
    return 0;
  };

  // Route selector click on Map
  const handleMapSelection = (avenueName: string, pos: { x: number; y: number }) => {
    setDropoffRoad(avenueName);
    // Randomize coordinates
    const startX = 240;
    const startY = 220;
    const diffX = Math.abs(pos.x - startX);
    const diffY = Math.abs(pos.y - startY);
    const calcDistance = parseFloat((Math.sqrt(diffX * diffX + diffY * diffY) / 60).toFixed(1));
    setDistanceKm(calcDistance > 0.5 ? calcDistance : 1.2);
  };

  // Simulating ride booking and live tracking
  const handleRequestRide = () => {
    let newBalanceCDF = profile.walletBalanceCDF;
    let newBalanceUSD = profile.walletBalanceUSD;
    let paymentUsed: "CDF" | "USD" = "CDF";
    let paymentAmount = 0;

    if (profile.walletBalanceCDF >= finalPrices.cdf) {
      newBalanceCDF -= finalPrices.cdf;
      paymentUsed = "CDF";
      paymentAmount = finalPrices.cdf;
    } else if (profile.walletBalanceUSD >= finalPrices.usd) {
      newBalanceUSD -= finalPrices.usd;
      paymentUsed = "USD";
      paymentAmount = finalPrices.usd;
    } else {
      alert(`Solde insuffisant dans votre portefeuille. Le trajet coûte ${finalPrices.cdf.toLocaleString()} CDF / $${finalPrices.usd} USD.`);
      return;
    }

    const newRideId = "ride-" + Math.random().toString(36).substr(2, 6);
    setCurrentRideId(newRideId);
    setRideStatus("searching");
    setRideSuccessMessage(false);
    setMessages([]);
    localStorage.setItem("gomoto_active_ride_messages", "[]");

    // Initial driver placement far away
    setDriverPos({ x: 60, y: 60 });
    setPassengerPos({ x: 240, y: 220 });

    const newActiveRide = {
      id: newRideId,
      clientId: profile.id,
      clientName: profile.firstName + " " + profile.lastName,
      clientPhone: profile.phone,
      pickupAddress: {
        province: drcProvinces.find(p => p.id === selectedProvinceId)?.name || selectedProvinceId,
        city: selectedCityName,
        commune: selectedCommuneName,
        quartier: profile.address.quartier,
        localite: profile.address.localite,
        avenue: pickupRoad,
      },
      dropoffAddress: {
        province: drcProvinces.find(p => p.id === selectedProvinceId)?.name || selectedProvinceId,
        city: selectedCityName,
        commune: selectedCommuneName,
        quartier: profile.address.quartier,
        localite: profile.address.localite,
        avenue: dropoffRoad,
      },
      status: "searching" as const,
      priceCDF: finalPrices.cdf,
      priceUSD: finalPrices.usd,
      distanceKm: distanceKm,
      paymentUsed: paymentUsed,
      isReparoPaid: true,
      securityPin: Math.floor(1000 + Math.random() * 9000).toString(),
      timestamp: new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })
    };

    localStorage.setItem("gomoto_active_ride", JSON.stringify(newActiveRide));

    // Append pending transaction (BLOCKED IN REPARO)
    const newTx: WalletTransaction = {
      id: "tx-reparo-" + Math.random().toString(36).substr(2, 6),
      userId: profile.id,
      amount: paymentAmount,
      currency: paymentUsed,
      type: "ride_payment",
      method: "Wallet_System",
      status: "pending", // Held in escrow REPARO
      date: new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }),
      rideDetails: {
        pickup: `${pickupRoad}, C/${selectedCommuneName}`,
        dropoff: `${dropoffRoad}, C/${selectedCommuneName}`,
        driverName: "Ir. Héritier LUKUSA (Paiement REPARO actif)",
        distanceKm: Number(distanceKm.toFixed(1))
      }
    };

    const updatedTransactionsList = [newTx, ...transactions];
    setTransactions(updatedTransactionsList);
    localStorage.setItem(`gomoto_transactions_${profile.id}`, JSON.stringify(updatedTransactionsList));

    // Update global users list for persistence
    const usersStr = localStorage.getItem("gomoto_users");
    if (usersStr) {
      const users: UserProfile[] = JSON.parse(usersStr);
      const updatedUsers = users.map(u => {
        if (u.id === profile.id) {
          return {
            ...u,
            walletBalanceCDF: newBalanceCDF,
            walletBalanceUSD: parseFloat(newBalanceUSD.toFixed(2))
          };
        }
        return u;
      });
      localStorage.setItem("gomoto_users", JSON.stringify(updatedUsers));
    }

    onUpdateProfile({
      ...profile,
      walletBalanceCDF: newBalanceCDF,
      walletBalanceUSD: parseFloat(newBalanceUSD.toFixed(2))
    });

    setTimeout(() => {
      setRideStatus("accepted");
      showToast(
        "success",
        "Chauffeur en approche !",
        "Ir. Héritier LUKUSA (moto Jaune RDC, plaque C-MC-4458KIN) a accepté votre course et se dirige vers vous."
      );
      const initialDriver = {
        name: "Ir. Héritier LUKUSA",
        phone: "+243 821 445 778",
        plate: "C-MC-4458KIN",
        rating: 4.8,
        selfie: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
        color: "Jaune RDC"
      };
      setAssignedDriver(initialDriver);

      // Create preferences summary message from system and response from driver
      const hasHelmet = profile.ridePreferences?.helmetRequired ?? prefHelmet;
      const hasSafe = profile.ridePreferences?.safeDrivingOnly ?? prefSafeDriving;
      const hasSilent = profile.ridePreferences?.silentRide ?? prefSilentRide;
      const hasBaggage = profile.ridePreferences?.baggageCargo ?? prefBaggageCargo;
      const userCustomNote = profile.ridePreferences?.customDriverNote ?? prefCustomNote;

      let prefStringList = [];
      if (hasHelmet) prefStringList.push("Casque requis 🪖");
      if (hasSafe) prefStringList.push("Conduite prudente 🛡️");
      if (hasSilent) prefStringList.push("Trajet silencieux 🤫");
      if (hasBaggage) prefStringList.push("Porte-bagage vide 🎒");

      const prefSummary = prefStringList.length > 0 ? prefStringList.join(", ") : "Aucune spécifiée";

      const systemPrefMsg: RideMessage = {
        id: "msg-welcome-pref-" + Math.random().toString(36).substr(2, 6),
        rideId: newRideId,
        senderId: "system",
        senderName: "Système GoMoto",
        senderRole: "driver", // styled as driver/neutral
        text: `[PRÉFÉRENCES PASSAGER TRANSMISES] : ${prefSummary}.${userCustomNote ? ` Note au motard : "${userCustomNote}"` : ""}`,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      };

      const driverAckMsg: RideMessage = {
        id: "msg-drv-ack-pref-" + Math.random().toString(36).substr(2, 6),
        rideId: newRideId,
        senderId: "usr-driver-777",
        senderName: "Ir. Héritier LUKUSA",
        senderRole: "driver",
        text: `Bonjour Boss ! Bien reçu vos préférences de voyage (${prefSummary}). Je prends soin de tout cela immédiatement pour notre trajet. À tout de suite ! 👍`,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      };

      const initialMessageList = [systemPrefMsg, driverAckMsg];
      localStorage.setItem("gomoto_active_ride_messages", JSON.stringify(initialMessageList));
      setMessages(initialMessageList);

      // Save driver info back to localStorage active ride
      const savedRide = localStorage.getItem("gomoto_active_ride");
      if (savedRide) {
        const parsed = JSON.parse(savedRide);
        parsed.status = "accepted";
        parsed.driverId = "usr-driver-777";
        parsed.driverName = initialDriver.name;
        parsed.driverPhone = initialDriver.phone;
        parsed.driverPlate = initialDriver.plate;
        parsed.driverRating = initialDriver.rating;
        parsed.preferences = {
          helmetRequired: hasHelmet,
          safeDrivingOnly: hasSafe,
          silentRide: hasSilent,
          baggageCargo: hasBaggage,
          customDriverNote: userCustomNote
        };
        localStorage.setItem("gomoto_active_ride", JSON.stringify(parsed));
      }
    }, 3000);
  };

  // Poll for messages in active ride
  useEffect(() => {
    if (rideStatus !== "idle" && currentRideId) {
      const interval = setInterval(() => {
        const logged = localStorage.getItem("gomoto_active_ride_messages");
        if (logged) {
          setMessages(JSON.parse(logged));
        }
      }, 700);
      return () => clearInterval(interval);
    }
  }, [rideStatus, currentRideId]);

  // Poll for active ride status changes from the driver perspective
  useEffect(() => {
    if (rideStatus !== "idle" && currentRideId) {
      const interval = setInterval(() => {
        const savedRide = localStorage.getItem("gomoto_active_ride");
        if (savedRide) {
          const parsed = JSON.parse(savedRide);
          if (parsed.id === currentRideId) {
            if (parsed.status !== rideStatus) {
              setRideStatus(parsed.status);
            }
          }
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [rideStatus, currentRideId]);

  // Passenger sends a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = messageInput.trim();
    if (!trimmedInput) return;

    // Cyber Security threat interception
    if (hasSQLInjectionThreat(trimmedInput) || hasXSSThreat(trimmedInput)) {
      const threatType = hasSQLInjectionThreat(trimmedInput) ? "SQL Injection (SQLi)" : "Cross-Site Scripting (XSS)";
      const attackEvent: SecurityEvent = {
        id: "sh-evt-" + Math.random().toString(36).substr(2, 6),
        timestamp: new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        threatType: threatType as any,
        rawInput: trimmedInput,
        sourceIp: `${getRandomKinshasaIP().ip} (${profile.address.commune})`,
        actionTaken: "BLOCKED & REJETÉ",
        riskScore: "HIGH",
        location: `Kinshasa ${profile.address.commune}`,
        details: "Tentative d'injection malveillante détectée dans le terminal de messagerie instantanée en temps réel."
      };

      setSecurityEvents(prev => [attackEvent, ...prev]);
      setBlockedAttack(attackEvent);
      setMessageInput("");
      return;
    }

    const newMessage: RideMessage = {
      id: "msg-" + Math.random().toString(36).substr(2, 6),
      rideId: currentRideId || "ride-active",
      senderId: profile.id,
      senderName: profile.firstName + " " + profile.lastName,
      senderRole: "client",
      text: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    };

    const currentLoggedStr = localStorage.getItem("gomoto_active_ride_messages") || "[]";
    const currentLoggedList: RideMessage[] = JSON.parse(currentLoggedStr);
    const updated = [...currentLoggedList, newMessage];
    localStorage.setItem("gomoto_active_ride_messages", JSON.stringify(updated));
    setMessages(updated);
    
    const passengerText = messageInput.trim();
    setMessageInput("");

    // Simulate automatic responses from the driver
    setTimeout(() => {
      const latestStr = localStorage.getItem("gomoto_active_ride_messages") || "[]";
      const latestList: RideMessage[] = JSON.parse(latestStr);
      
      // Calculate how many messages the passenger has sent to keep responses aligned
      const passengerMsgsCount = latestList.filter(m => m.senderRole === "client").length;
      
      let replyText = "D'accord, je comprends bien. J'arrive !";
      if (passengerMsgsCount === 1) {
        replyText = "Réceptionné camarade ! Je suis déjà en train de faire vibrer le moteur. J'approche ! 🏍️";
      } else if (passengerMsgsCount === 2) {
        replyText = "Na komi ! (Je suis arrivé) Je me gare prudemment devant l'adresse pour vous attendre.";
      } else if (passengerMsgsCount === 3) {
        replyText = "D'accord, n'oubliez pas d'enfiler le double casque de sécurité s'il vous plaît !";
      } else {
        replyText = "Parfait chef, je reste concentré sur la route et notre itinéraire.";
      }

      const driverReply: RideMessage = {
        id: "msg-drv-" + Math.random().toString(36).substr(2, 6),
        rideId: currentRideId || "ride-active",
        senderId: "usr-driver-777",
        senderName: "Ir. Héritier LUKUSA",
        senderRole: "driver",
        text: replyText,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      };

      const withReply = [...latestList, driverReply];
      localStorage.setItem("gomoto_active_ride_messages", JSON.stringify(withReply));
      setMessages(withReply);
    }, 2000);
  };

  const handlePromptPaymentConfirmation = () => {
    const savedRideStr = localStorage.getItem("gomoto_active_ride");
    let pUsed: "CDF" | "USD" = "CDF";
    let pAmount = 0;

    if (savedRideStr) {
      const savedRide = JSON.parse(savedRideStr);
      pUsed = savedRide.paymentUsed || "CDF";
      pAmount = pUsed === "CDF" ? savedRide.priceCDF : savedRide.priceUSD;
    } else {
      pUsed = profile.walletBalanceCDF >= prices.cdf ? "CDF" : "USD";
      pAmount = pUsed === "CDF" ? prices.cdf : prices.usd;
    }

    const sCost = pUsed === "CDF" 
      ? Math.round(pAmount * 0.15) 
      : parseFloat((pAmount * 0.15).toFixed(2));

    const remBalance = pUsed === "CDF" 
      ? profile.walletBalanceCDF 
      : profile.walletBalanceUSD;

    setPaymentDetailsForModal({
      totalAmount: pAmount,
      paymentUsed: pUsed,
      serviceCost: sCost,
      remainingBalance: remBalance
    });
    
    setShowPaymentConfirmationModal(true);
  };

  // Animate active driver towards passenger, then to dropoff
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (rideStatus === "accepted") {
      timer = setInterval(() => {
        setDriverPos((prev) => {
          const dx = passengerPos.x - prev.x;
          const dy = passengerPos.y - prev.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 12) {
            clearInterval(timer);
            setRideStatus("picked_up");
            showToast(
              "info",
              "Course entamée !",
              "Vous êtes à bord avec Ir. Héritier LUKUSA. Destination en cours..."
            );
            
            // Sync status to localStorage active ride
            const savedRide = localStorage.getItem("gomoto_active_ride");
            if (savedRide) {
              const parsed = JSON.parse(savedRide);
              parsed.status = "picked_up";
              localStorage.setItem("gomoto_active_ride", JSON.stringify(parsed));
            }
            return passengerPos;
          }

          // Move step
          return {
            x: prev.x + (dx / distance) * 22,
            y: prev.y + (dy / distance) * 22
          };
        });
      }, 500);
    } else if (rideStatus === "picked_up") {
      // Driver moves to destination dropoff (330, 300)
      const destination = { x: 330, y: 300 };
      timer = setInterval(() => {
        setDriverPos((prev) => {
          const dx = destination.x - prev.x;
          const dy = destination.y - prev.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 12) {
            clearInterval(timer);
            handlePromptPaymentConfirmation();
            return destination;
          }

          // Move passenger and driver together
          setPassengerPos({
            x: prev.x + (dx / distance) * 22,
            y: prev.y + (dy / distance) * 22
          });

          return {
            x: prev.x + (dx / distance) * 22,
            y: prev.y + (dy / distance) * 22
          };
        });
      }, 500);
    }

    return () => clearInterval(timer);
  }, [rideStatus]);

  const handleCompleteRide = async () => {
    // Call the newly implemented Secure Backend Escrow Release
    const savedRideStr = localStorage.getItem("gomoto_active_ride");
    let paymentUsed: "CDF" | "USD" = "CDF";
    let paymentAmount = 0;

    if (savedRideStr) {
      const savedRide = JSON.parse(savedRideStr);
      paymentUsed = savedRide.paymentUsed || "CDF";
      paymentAmount = paymentUsed === "CDF" ? savedRide.priceCDF : savedRide.priceUSD;
    } else {
      paymentUsed = profile.walletBalanceCDF >= prices.cdf ? "CDF" : "USD";
      paymentAmount = paymentUsed === "CDF" ? prices.cdf : prices.usd;
    }

    try {
      // PROXY CALL: Backend processes the 70/15/15 rules inalterably
      const res = await fetch("/api/escrow/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rideId: currentRideId || "ride-active",
          clientPrice: paymentAmount,
          currency: paymentUsed,
          clientId: profile.id,
          driverId: "usr-driver-777",
          ownerId: "usr-owner-441"
        })
      });

      const serverData = await res.json();
      
      if (!serverData.success) {
        showToast("error", "Erreur Escrow", serverData.error);
        return;
      }

      const { driverCredited, ownerCredited, adminCommission } = serverData.distribution;

      // Update other users in local storage database (To show in UI)
      const usersStr = localStorage.getItem("gomoto_users");
      if (usersStr) {
        const users: UserProfile[] = JSON.parse(usersStr);
        const updatedUsers = users.map(u => {
          // Credit Driver "usr-driver-777"
          if (u.id === "usr-driver-777" || u.role === "driver") {
            const newCDF = paymentUsed === "CDF" ? u.walletBalanceCDF + driverCredited : u.walletBalanceCDF;
            const newUSD = paymentUsed === "USD" ? u.walletBalanceUSD + driverCredited : u.walletBalanceUSD;
            
            // Append transaction log for driver
            const txId = "tx-earn-" + Math.random().toString(36).substr(2, 6);
            const driverTx: WalletTransaction = {
              id: txId,
              userId: u.id,
              amount: driverCredited,
              currency: paymentUsed,
              type: "ride_payment",
              method: "Wallet_System",
              status: "completed",
              date: new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }),
              rideDetails: {
                pickup: `${pickupRoad}, ${profile.address.commune}`,
                dropoff: `${dropoffRoad}, ${profile.address.commune}`,
                driverName: profile.firstName + " " + profile.lastName,
                distanceKm: Number(distanceKm.toFixed(1))
              }
            };
            const currentDriverTxs = JSON.parse(localStorage.getItem(`gomoto_transactions_${u.id}`) || "[]");
            localStorage.setItem(`gomoto_transactions_${u.id}`, JSON.stringify([driverTx, ...currentDriverTxs]));
            
            return {
              ...u,
              walletBalanceCDF: newCDF,
              walletBalanceUSD: parseFloat(newUSD.toFixed(2)),
              ridesCompleted: u.ridesCompleted + 1
            };
          }
          
          // Credit Owner "usr-owner-441"
          if (u.id === "usr-owner-441" || u.role === "owner") {
            const newCDF = paymentUsed === "CDF" ? u.walletBalanceCDF + ownerCredited : u.walletBalanceCDF;
            const newUSD = paymentUsed === "USD" ? u.walletBalanceUSD + ownerCredited : u.walletBalanceUSD;
            
            // Append transaction log for owner
            const txId = "tx-earn-owner-" + Math.random().toString(36).substr(2, 6);
            const ownerTx: WalletTransaction = {
              id: txId,
              userId: u.id,
              amount: ownerCredited,
              currency: paymentUsed,
              type: "ride_payment",
              method: "Wallet_System",
              status: "completed",
              date: new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }),
              rideDetails: {
                pickup: `${pickupRoad}, ${profile.address.commune}`,
                dropoff: `${dropoffRoad}, ${profile.address.commune}`,
                driverName: "Ir. Héritier LUKUSA (Option 15% Propriétaire)",
                distanceKm: Number(distanceKm.toFixed(1))
              }
            };
            const currentOwnerTxs = JSON.parse(localStorage.getItem(`gomoto_transactions_${u.id}`) || "[]");
            localStorage.setItem(`gomoto_transactions_${u.id}`, JSON.stringify([ownerTx, ...currentOwnerTxs]));
            
            return {
              ...u,
              walletBalanceCDF: newCDF,
              walletBalanceUSD: parseFloat(newUSD.toFixed(2))
            };
          }
          return u;
        });
        localStorage.setItem("gomoto_users", JSON.stringify(updatedUsers));
      }

      // Mark the pending upfront payment transaction as completed
      setTransactions(prev => {
        const updated = prev.map(t => {
          if (t.type === "ride_payment" && t.status === "pending") {
            return { ...t, status: "completed" as const };
          }
          return t;
        });
        localStorage.setItem(`gomoto_transactions_${profile.id}`, JSON.stringify(updated));
        return updated;
      });

      onUpdateProfile({
        ...profile,
        ridesCompleted: profile.ridesCompleted + 1
      });

      setRideStatus("completed");
      setShowPaymentConfirmationModal(false);
      setPaymentDetailsForModal(null);

      showToast(
        "success",
        "Paiement Intervenu !",
        "Le Backend a clôturé la transaction avec succès et sécurisé la libération des fonds en toute conformité."
      );

      // Sync completion status and payment distribution to localStorage active ride
      if (savedRideStr) {
        const parsed = JSON.parse(savedRideStr);
        parsed.status = "completed";
        parsed.paymentDistributed = true;
        localStorage.setItem("gomoto_active_ride", JSON.stringify(parsed));
      }

      alert(serverData.message);
      
    } catch (error) {
      console.error("Escrow backend API error:", error);
      showToast("error", "Erreur Réseau", "Impossible de contacter le module Escrow du backend.");
    }
  };

  const handleFinishRating = () => {
    // Cyber Security threat interception in comment
    if (hasSQLInjectionThreat(ratingComment) || hasXSSThreat(ratingComment)) {
      const threatType = hasSQLInjectionThreat(ratingComment) ? "SQL Injection (SQLi)" : "Cross-Site Scripting (XSS)";
      const attackEvent: SecurityEvent = {
        id: "sh-evt-" + Math.random().toString(36).substr(2, 6),
        timestamp: new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        threatType: threatType as any,
        rawInput: ratingComment,
        sourceIp: `${getRandomKinshasaIP().ip} (${profile.address.commune})`,
        actionTaken: "BLOCKED & REJETÉ",
        riskScore: "HIGH",
        location: `Kinshasa ${profile.address.commune}`,
        details: "Tentative d'évasion SQL ou script HTML actif bloqué sur le champ 'Commentaire Course' du passager."
      };

      setSecurityEvents(prev => [attackEvent, ...prev]);
      setBlockedAttack(attackEvent);
      setRatingComment("");
      return;
    }

    // 1. Log rating inside database
    const newReview: RideReview = {
      id: "rev-" + Math.random().toString(36).substr(2, 6),
      rideId: currentRideId || "ride-active",
      fromUserId: profile.id,
      fromUserName: profile.firstName + " " + profile.lastName,
      fromUserRole: "client",
      toUserId: "usr-driver-777", // Héritier LUKUSA
      toUserName: "Ir. Héritier LUKUSA",
      rating: activeRideRating,
      comment: ratingComment.trim() || undefined,
      timestamp: new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })
    };

    // Save to ratings logs database
    const existingStr = localStorage.getItem("gomoto_ratings_v1") || "[]";
    const existingList: RideReview[] = JSON.parse(existingStr);
    const updatedReviews = [newReview, ...existingList];
    localStorage.setItem("gomoto_ratings_v1", JSON.stringify(updatedReviews));
    setReviewsHistory(updatedReviews);

    // Update driver profile rating inside database
    const usersStr = localStorage.getItem("gomoto_users");
    if (usersStr) {
      const users: UserProfile[] = JSON.parse(usersStr);
      const updatedUsers = users.map((u) => {
        if (u.id === "usr-driver-777") {
          const oldRating = u.rating || 4.8;
          const oldRides = u.ridesCompleted || 110;
          const newRides = oldRides + 1;
          const newAvg = parseFloat(((oldRating * oldRides + activeRideRating) / newRides).toFixed(2));
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
        rideId: currentRideId,
        date: new Date().toLocaleDateString("fr-FR"),
        clientName: profile.firstName + " " + profile.lastName,
        driverName: "Ir. Héritier LUKUSA",
        messages: loggedMsgs
      });
      localStorage.setItem("gomoto_archived_conversations_v1", JSON.stringify(allHistory));
    }

    // Archive course into completed history
    const activeRideRaw = localStorage.getItem("gomoto_active_ride");
    if (activeRideRaw) {
      try {
        const parsedRide = JSON.parse(activeRideRaw) as RideRequest;
        parsedRide.status = "completed";
        if (assignedDriver) {
          parsedRide.driverId = assignedDriver.id;
          parsedRide.driverName = assignedDriver.firstName + " " + assignedDriver.lastName;
          parsedRide.driverPhone = assignedDriver.phone;
        } else {
          parsedRide.driverId = "usr-driver-777";
          parsedRide.driverName = "Ir. Héritier LUKUSA";
          parsedRide.driverPhone = "+243 899 123 456";
        }
        
        setCompletedRides(prev => {
          const updated = [parsedRide, ...prev];
          localStorage.setItem(`gomoto_rides_history_${profile.id}`, JSON.stringify(updated));
          return updated;
        });
      } catch (e) {
        console.error("Error archiving ride to history", e);
      }
    }

    // Clear statuses
    localStorage.removeItem("gomoto_active_ride");
    localStorage.removeItem("gomoto_active_ride_messages");

    setRideStatus("idle");
    setAssignedDriver(null);
    setRideSuccessMessage(true);
    setRatingComment("");
  };

  const handleDownloadInvoice = (tx: WalletTransaction) => {
    const doc = new jsPDF();
    
    // Set basic metadata
    doc.setProperties({
      title: `Facture GoMoto - ${tx.id}`,
      subject: "Ticket de transport public",
      author: "GoMoto RDC",
      creator: "GoMoto Automated System"
    });

    // Theme Color definitions (Classic Slate & Blue)
    const primaryColor = [15, 23, 42]; // dark slate #0f172a
    const accentColor = [37, 99, 235]; // blue-600 #2563eb
    const borderColor = [226, 232, 240]; // slate-200
    const textColor = [51, 65, 85]; // slate-700
    
    // Draw visual accent bar at the very top
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(0, 0, 210, 8, "F");

    // Corporate Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("GOMOTO RDC", 20, 25);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(115, 115, 115);
    doc.text("Transport de Confiance & Sécurisé National", 20, 31);
    doc.text("Régis par la Direction Générale des Impôts - Kinshasa", 20, 36);
    doc.text("Support: support@gomoto.cd | Urgences: +243 822 000 112", 20, 41);

    // Document Title Box (Right Aligned Header)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text("FACTURE DE COURSE", 130, 25);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`N° Facture : FAT-${tx.id.replace("tx-", "").toUpperCase()}`, 130, 31);
    doc.text(`Date : ${tx.date}`, 130, 37);
    doc.text("Statut : PAYÉ (Wallet)", 130, 43);

    // Decorative Separator Line
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, 48, 190, 48);

    // Client Details Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("DÉTAILS DES PARTIES :", 20, 56);

    // Frame for details
    doc.setFillColor(248, 250, 252); // light slate background
    doc.rect(20, 60, 170, 34, "F");
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.rect(20, 60, 170, 34, "S");

    // Passenger info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Bénéficiaire / Voyageur :", 25, 67);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`${profile.firstName} ${profile.lastName}`, 25, 73);
    doc.text(`Tél : ${profile.phone}`, 25, 79);
    doc.text("Rôle : Passager Homologué GoMoto RDC", 25, 85);

    // Provider (Driver info / Platform ID)
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Transporteur Agréé :", 110, 67);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(tx.rideDetails?.driverName || "Ir. Héritier LUKUSA", 110, 73);
    doc.text("GOMOTO Partenaire Chauffeur SAS", 110, 79);
    doc.text("Identifiant Chauffeur: usr-driver-777", 110, 85);

    // Itinerary Details Section (if present)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("ITINÉRAIRE & PARCOURS SÉCURISÉ :", 20, 104);

    doc.setFillColor(248, 250, 252); // light slate background
    doc.rect(20, 108, 170, 42, "F");
    doc.rect(20, 108, 170, 42, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Point de Prise en Charge (Départ) :", 25, 115);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    const pickupTxt = tx.rideDetails?.pickup || `${pickupRoad || "Adresse de départ"}, ${profile.address.quartier}, ${profile.address.commune}`;
    doc.text(pickupTxt.length > 75 ? pickupTxt.substring(0, 75) + "..." : pickupTxt, 25, 120);

    doc.setFont("helvetica", "bold");
    doc.text("Destination Finale :", 25, 128);
    doc.setFont("helvetica", "normal");
    
    const dropoffTxt = tx.rideDetails?.dropoff || `${dropoffRoad || "Adresse de destination"}, ${profile.address.quartier}, ${profile.address.commune}`;
    doc.text(dropoffTxt.length > 75 ? dropoffTxt.substring(0, 75) + "..." : dropoffTxt, 25, 133);

    // Distance metric
    doc.setFont("helvetica", "bold");
    doc.text("Distance estimée :", 25, 142);
    doc.setFont("helvetica", "normal");
    const distanceVal = tx.rideDetails?.distanceKm || distanceKm;
    doc.text(`${distanceVal.toFixed(1)} km (Suivi par GPS d'État Congolais)`, 60, 142);

    // Financial Summary Grid
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("DÉTAILS FINANCIERS DE LA TRANSACTION :", 20, 160);

    // Table Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(20, 164, 170, 7.5, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("DESCRIPTION DU SERVICE", 24, 169);
    doc.text("NATURE", 95, 169);
    doc.text("MÉTHODE", 128, 169);
    doc.text("MONTANT", 168, 169);

    // Table Body
    doc.setFillColor(255, 255, 255);
    doc.rect(20, 171.5, 170, 15, "S");
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    doc.text("Course motocycliste de sécurité GoMoto", 24, 178);
    doc.text("Intercommunale", 95, 178);
    doc.text("Portefeuille", 128, 178);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`${tx.amount.toLocaleString("fr-FR")} ${tx.currency}`, 168, 178);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // slate-400
    doc.text("Inclut T.V.A d'État de 16% & Taxe Mini-Régionale", 24, 183);

    // Total box
    doc.setFillColor(241, 245, 249); // slate-100 background
    doc.rect(110, 186.5, 80, 16, "F");
    doc.rect(110, 186.5, 80, 16, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("TOTAL DÉBITÉ :", 115, 196.5);
    doc.setFontSize(11);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(`${tx.amount.toLocaleString("fr-FR")} ${tx.currency}`, 155, 196.5);

    // Compliance, Regulatory & Security stamp
    doc.setDrawColor(239, 68, 68); // red border
    doc.setFillColor(254, 242, 242); // soft red background
    doc.rect(20, 212, 170, 24, "F");
    doc.rect(20, 212, 170, 24, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(185, 28, 28); // red-700
    doc.text("CRITÈRE DE VÉRIFICATION DE SÉCURITÉ CONGOLAISE (CONFORMITÉ REGULATOIRE) :", 24, 218);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(153, 27, 27); // red-800
    doc.text("✓ Ce reçu numérique fait foi de preuve d'acquittement de la course conformément aux règlements de transport GoMoto RDC.", 24, 224);
    doc.text("✓ Enregistrement officiel de la Direction de Sécurité Urbaine - République Démocratique du Congo, code ID de traçabilité d'État.", 24, 229);
    doc.text(`  ID-RACCRACT-TRACK: ${tx.id.toUpperCase()}-GOMOTO-RDC-SECURE-STAMP-V1`, 24, 233);

    // Verification QR Simulation Pattern Design graphic using simple lines
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(1.5);
    doc.rect(160, 244, 25, 25, "S");
    // Draw some custom inner black circles/boxes to simulate QR code
    doc.setFillColor(15, 23, 42);
    doc.rect(162, 246, 7, 7, "F");
    doc.rect(176, 246, 7, 7, "F");
    doc.rect(162, 260, 7, 7, "F");
    doc.rect(171, 255, 4, 4, "F");
    doc.rect(178, 262, 3, 3, "F");
    doc.rect(171, 262, 3, 3, "F");

    // Closing Note text
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Pour toute réclamation, veuillez mentionner le numéro de facture susmentionné auprès du support.", 20, 250);
    doc.text("GoMoto, l'excellence du transport moto sécurisé à Kinshasa.", 20, 255);
    doc.setFont("helvetica", "normal");
    doc.text("Ce document ne nécessite pas de signature manuscrite pour être valide.", 20, 260);

    // Save PDF file
    doc.save(`GoMoto_Facture_${tx.id}.pdf`);
  };

  const handleDownloadRevenueReceipt = (ride: RideRequest) => {
    const doc = new jsPDF();
    
    // Set document properties
    doc.setProperties({
      title: `Rapport de Revenus GoMoto - ${ride.id}`,
      subject: "Ventilation des Revenus Chauffeur & Propriétaires",
      author: "GoMoto RDC",
      creator: "GoMoto Automated Splitter Engine v1.0"
    });

    // Theme Colors
    const primaryColor = [15, 23, 42];   // dark slate #0f172a
    const accentColor = [37, 99, 235];    // blue-600 #2563eb
    const successColor = [16, 185, 129];  // emerald-500
    const goldColor = [234, 179, 8];     // yellow-500
    const borderColor = [226, 232, 240]; // slate-200
    const textColor = [51, 65, 85];      // slate-700
    
    // Decorative top border bar (Gold & Blue)
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(0, 0, 140, 8, "F");
    doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.rect(140, 0, 70, 8, "F");

    // Branded GoMoto RDC Logo Mark
    doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.circle(30, 27, 10, "F");
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.circle(30, 27, 7.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("G", 28, 30.5);

    // Business Header text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("GOMOTO RDC", 44, 25);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(115, 115, 115);
    doc.text("Solution de Transport Urbain & Arbitrage de Garantie Civile", 44, 30);
    doc.text("République Démocratique du Congo • Secrétariat National", 44, 34.5);
    doc.text("Registre de Ventilation des Recettes Mobiles - Direct-To-Wallet", 44, 39);

    // Right-aligned Document Metadata Box
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(successColor[0], successColor[1], successColor[2]);
    doc.text("REÇU DE REVENUS SYNDICAL", 130, 23);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`ID Course : ${ride.id.toUpperCase()}`, 130, 28);
    doc.text(`Date : ${ride.timestamp}`, 130, 32.5);
    doc.text("Index : Distribué d'après REPARO", 130, 37);
    doc.text("Statut : Libéré & Archivé", 130, 41.5);

    // Separation line
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, 46, 190, 46);

    // Ride Details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("1. DESCRIPTIF GENERAL DE LA COURSE", 20, 54);

    doc.setFillColor(248, 250, 252); // soft slate background
    doc.rect(20, 58, 170, 38, "F");
    doc.rect(20, 58, 170, 38, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Trajet :", 25, 64);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    const pAddress = `${ride.pickupAddress.avenue}, Q.${ride.pickupAddress.quartier} (${ride.pickupAddress.commune})`;
    const dAddress = `${ride.dropoffAddress.avenue}, Q.${ride.dropoffAddress.quartier} (${ride.dropoffAddress.commune})`;
    doc.text(`Départ : ${pAddress.substring(0, 75)}`, 25, 69);
    doc.text(`Arrivée : ${dAddress.substring(0, 75)}`, 25, 74);
    doc.text(`Distance certifiée par GPS : ${ride.distanceKm} km`, 25, 79);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Acteurs :", 110, 64);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`Passager: ${profile.firstName} ${profile.lastName}`, 110, 69);
    doc.text(`Chauffeur homologué: ${ride.driverName || "Ir. Héritier LUKUSA"}`, 110, 74);
    doc.text(`Tél Chauffeur: ${ride.driverPhone || "+243 899 123 456"}`, 110, 79);
    doc.text("Co-Arbitrage: GoMoto RDC & Greffe REPARO", 110, 84);

    // Title 2: Ventilation des Revenus (70% - 15% - 15%)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("2. VENTILATION DU REVENU (Rapport Aux Chauffeurs et Propriétaires)", 20, 106);

    // Let's do the math
    const totalCDF = ride.priceCDF;
    const totalUSD = ride.priceUSD;

    const chauffeurShareCDF = Math.round(totalCDF * 0.70);
    const chauffeurShareUSD = parseFloat((totalUSD * 0.70).toFixed(2));

    const ownerShareCDF = Math.round(totalCDF * 0.15);
    const ownerShareUSD = parseFloat((totalUSD * 0.15).toFixed(2));

    const platformShareCDF = Math.round(totalCDF * 0.15);
    const platformShareUSD = parseFloat((totalUSD * 0.15).toFixed(2));

    // Draw heavy block header for table
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(20, 110, 170, 7.5, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("DESTINATAIRE DES REVENUS", 24, 115);
    doc.text("CLE DE REPARTITION", 85, 115);
    doc.text("MONTANT (CDF)", 125, 115);
    doc.text("MONTANT (USD equiv.)", 158, 115);

    // Row 1: Chauffeur (70%)
    doc.setFillColor(255, 255, 255);
    doc.rect(20, 117.5, 170, 10, "F");
    doc.rect(20, 117.5, 170, 10, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Ir. Héritier LUKUSA (Chauffeur Motard)", 24, 124);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text("70% (Travail Direct)", 85, 124);
    doc.setFont("helvetica", "bold");
    doc.text(`${chauffeurShareCDF.toLocaleString("fr-FR")} CDF`, 125, 124);
    doc.text(`$${chauffeurShareUSD.toFixed(2)}`, 160, 124);

    // Row 2: Fleet Owner (15%)
    doc.setFillColor(250, 250, 250);
    doc.rect(20, 127.5, 170, 10, "F");
    doc.rect(20, 127.5, 170, 10, "S");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Ferdinand / Dieudonné (Propriétaire / Flotte)", 24, 134);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text("15% (Amortissement Véhicule)", 85, 134);
    doc.setFont("helvetica", "bold");
    doc.text(`${ownerShareCDF.toLocaleString("fr-FR")} CDF`, 125, 134);
    doc.text(`$${ownerShareUSD.toFixed(2)}`, 160, 134);

    // Row 3: GoMoto Platform (15%)
    doc.setFillColor(255, 255, 255);
    doc.rect(20, 137.5, 170, 10, "F");
    doc.rect(20, 137.5, 170, 10, "S");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("GoMoto Platform SAS (Commission RDC)", 24, 144);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text("15% (Frais Hébergement / Tél)", 85, 144);
    doc.setFont("helvetica", "bold");
    doc.text(`${platformShareCDF.toLocaleString("fr-FR")} CDF`, 125, 144);
    doc.text(`$${platformShareUSD.toFixed(2)}`, 160, 144);

    // Total fare card
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(110, 151.5, 80, 14, "F");
    doc.rect(110, 151.5, 80, 14, "S");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("TOTAL DISPATCHE :", 114, 160);
    doc.setFontSize(10.5);
    doc.setTextColor(successColor[0], successColor[1], successColor[2]);
    doc.text(`${totalCDF.toLocaleString("fr-FR")} CDF / $${totalUSD.toFixed(2)}`, 147, 160);

    // SECTION 3: REPARO & STATE LAWS / REGULATORY CERTIFICATION
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("3. CERTIFICATION DE LEGALITE & INTEGRITE SYNDICALE RDC", 20, 176);

    doc.setFillColor(240, 253, 250); // soft cyan emerald background
    doc.setDrawColor(successColor[0], successColor[1], successColor[2]);
    doc.rect(20, 180, 170, 36, "F");
    doc.rect(20, 180, 170, 36, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(4, 120, 87); // emerald-700
    doc.text("ATTESTATION DE DISPATCH REPARO AUTOMATISE ET TRANSPARENT :", 24, 186);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(6, 95, 70); // emerald-800
    const textReg1 = "✓ Les fonds REPARO ont fait l'objet d'un escrow sécurisé et ont été dispatchés électroniquement de façon irréversible.";
    const textReg2 = "✓ Ce reçu fait foi de preuve de revenus vis-à-vis de l'administration fiscale, du syndicat des motards, et du bailleur.";
    const textReg3 = "✓ Conforme aux régulations d'État concernant le transport public rémunéré en République Démocratique du Congo.";
    const textReg4 = "  Rapport d'État - ID Référence de Traçabilité : REG-FLOW-" + ride.id.toUpperCase() + "-GOMOTO-SYNDICAT-2026-V1";
    
    doc.text(textReg1, 24, 191.5);
    doc.text(textReg2, 24, 196);
    doc.text(textReg3, 24, 200.5);
    doc.setFont("helvetica", "bold");
    doc.text(textReg4, 24, 206);

    // Decorative stamp block at bottom left
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1);
    doc.rect(20, 226, 48, 18, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("COMMUNAUTE DES MOTARDS", 22, 230);
    doc.text("PARTENAIRE AGREÉ", 26, 235);
    doc.text("✓ SCEAU TRANSIT REPARO", 22, 240);

    // Platform stamp block at middle
    doc.rect(73, 226, 48, 18, "S");
    doc.text("PROPRIETAIRE DE FLOTTE", 76, 230);
    doc.text("REVENU AMORTI 15%", 78, 235);
    doc.text("✓ DECHARGE AUTOMATIQUE", 74, 240);

    // QR verification simulation layout
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1.5);
    doc.rect(160, 226, 30, 30, "S");
    
    // QR details
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(162.5, 228.5, 8, 8, "F");
    doc.rect(179, 228.5, 8, 8, "F");
    doc.rect(162.5, 245, 8, 8, "F");
    doc.rect(173, 239, 4, 4, "F");
    doc.rect(182, 248, 4, 4, "F");
    doc.rect(173, 248, 4, 4, "F");

    // Close page footer note
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(115, 115, 115);
    doc.text("Ce rapport financier GoMoto RDC est généré électroniquement d'après la télémétrie GPS vérifiée.", 20, 262);
    doc.text("En cas d'erreur ou d'arbitrage supplémentaire, contactez le Service Syndical National GoMoto.", 20, 266.5);
    doc.setFont("helvetica", "normal");
    doc.text("Solution technologique homologuée sous protocole d'arbitrage civil REPARO RDC.", 20, 271);

    doc.save(`GoMoto_Revenus_${ride.id}.pdf`);
  };

  // Recharge trigger
  const handleRechargeWallet = async (e: React.FormEvent) => {
    e.preventDefault();

    // Cyber Security threat interception
    const isSQLiAmount = hasSQLInjectionThreat(rechargeAmount);
    const isXSSAmount = hasXSSThreat(rechargeAmount);
    const isSQLiPhone = hasSQLInjectionThreat(rechargePhone);
    const isXSSPhone = hasXSSThreat(rechargePhone);

    if (isSQLiAmount || isXSSAmount || isSQLiPhone || isXSSPhone) {
      const threatType = (isSQLiAmount || isSQLiPhone) ? "SQL Injection (SQLi)" : "Cross-Site Scripting (XSS)";
      const rawInput = isSQLiAmount || isXSSAmount ? rechargeAmount : rechargePhone;
      const details = (isSQLiAmount || isSQLiPhone) 
        ? "Tentative d'évasion SQL par injection de union/caractères d'échappement invalides sur le champ rechargement."
        : "Tentative d'injection de script XSS (Cross-Site Scripting) actif visant à voler les cookies de session mobile.";

      const attackEvent: SecurityEvent = {
        id: "sh-evt-" + Math.random().toString(36).substr(2, 6),
        timestamp: new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        threatType: threatType as any,
        rawInput: rawInput,
        sourceIp: `${getRandomKinshasaIP().ip} (${profile.address.commune})`,
        actionTaken: "BLOCKED & REJETÉ",
        riskScore: "CRITICAL",
        location: `Kinshasa ${profile.address.commune}`,
        details: details
      };

      try {
        const currentEventsStr = localStorage.getItem("gomoto_security_events_admin") || "[]";
        const currentEvents = JSON.parse(currentEventsStr);
        currentEvents.unshift(attackEvent);
        localStorage.setItem("gomoto_security_events_admin", JSON.stringify(currentEvents));
      } catch (secErr) {
        console.error("Error logging attack event to ledger", secErr);
      }

      setBlockedAttack(attackEvent);
      setShowRechargeModal(false);
      return;
    }

    if (isRechargeFormInvalid) return;
    const amountNum = parseFloat(rechargeAmount);
    if (!amountNum || amountNum <= 0) return;

    // Interactive 2FA OTP Protocol Check (Recommandation #1)
    if (!rechargeOtpSent) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setRechargeGeneratedOtp(code);
      setRechargeOtpSent(true);
      setRechargeOtpError(null);
      setClientOtpNotify(`[SMS SECURE - RECHARGE] Code de validation double facteur GoMoto : ${code} pour authentifier le dépôt de ${amountNum} ${rechargeCurrency}.`);
      
      // Auto-clear notification after 20 seconds
      setTimeout(() => {
        setClientOtpNotify(null);
      }, 20000);
      return;
    }

    if (rechargeEnteredOtp !== rechargeGeneratedOtp || rechargeGeneratedOtp === "") {
      setRechargeOtpError("Le code OTP saisi ne correspond pas. Veuillez inscrire le code d'État reçu.");
      return;
    }

    try {
      // Backend Request Call
      const res = await fetch("/api/wallet/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          amountCDF: rechargeCurrency === "CDF" ? amountNum : amountNum * 2800, // Normalized
          currency: rechargeCurrency,
          operator: rechargeMethod,
          transactionRef: "TRX-" + Math.random().toString(36).substr(2, 8).toUpperCase()
        })
      });

      const serverData = await res.json();
      
      if (!serverData.success) {
        setRechargeOtpError(serverData.error || "La transaction a été refusée par le serveur backend.");
        return;
      }

      let newBalanceCDF = profile.walletBalanceCDF;
      let newBalanceUSD = profile.walletBalanceUSD;

      if (rechargeCurrency === "CDF") {
        newBalanceCDF += amountNum;
      } else {
        newBalanceUSD += amountNum;
      }

      const newTx: WalletTransaction = {
        id: "tx-rec-" + Math.random().toString(36).substr(2, 6),
        userId: profile.id,
        amount: amountNum,
        currency: rechargeCurrency,
        type: "deposit",
        method: rechargeMethod as any,
        status: "completed",
        date: new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })
      };

      setTransactions(prev => {
        const updated = [newTx, ...prev];
        localStorage.setItem(`gomoto_transactions_${profile.id}`, JSON.stringify(updated));
        return updated;
      });
      onUpdateProfile({
        ...profile,
        walletBalanceCDF: newBalanceCDF,
        walletBalanceUSD: parseFloat(newBalanceUSD.toFixed(2))
      });

      // Log the successful 2FA validation trace in security database
      try {
        const currentEventsStr = localStorage.getItem("gomoto_security_events_admin") || "[]";
        const currentEvents = JSON.parse(currentEventsStr);
        const newSecEvent = {
          id: "sh-evt-" + Math.random().toString(36).substr(2, 6),
          timestamp: new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          threatType: "OTP Verification",
          rawInput: "2FA Verified (Success)",
          sourceIp: "197.228.10.45 (Kinshasa, RDC - M-Pesa client)",
          actionTaken: "VERIFIED & PASSED",
          riskScore: "SECURE",
          location: `Kinshasa (${profile.address?.commune || "Limete"})`,
          details: `Validation 2FA réussie par l'API pour le client ${profile.firstName} ${profile.lastName} lors du rechargement de ${amountNum} ${rechargeCurrency} via ${rechargeMethod}. Backend : ${serverData.message}`
        };
        currentEvents.unshift(newSecEvent);
        localStorage.setItem("gomoto_security_events_admin", JSON.stringify(currentEvents));
      } catch (secErr) {
        console.error("Error logging 2FA audit trace to ledger", secErr);
      }

      showToast(
        "success",
        "Paiement M-Pesa Sécurisé",
        `Backend : ${serverData.message}`
      );
    } catch (apiErr) {
      setRechargeOtpError("Erreur réseau : Impossible de contacter la passerelle de paiement sécurisée.");
      return;
    }

    setShowRechargeModal(false);
    setRechargeOtpSent(false);
    setRechargeGeneratedOtp("");
    setRechargeEnteredOtp("");
    setRechargeOtpError(null);
    setClientOtpNotify(null);
  };

  const handleExportWalletCSV = () => {
    if (!transactions || transactions.length === 0) {
      showToast("error", "Erreur d'export", "Aucune transaction disponible pour l'export.");
      return;
    }
    
    let csvContent = "ID,Type,Montant,Devise,Methode,Date,Statut\n";
    transactions.forEach(tx => {
      const typeStr = tx.type === "deposit" ? "Crédit/Dépôt" : "Débit/Course";
      csvContent += `${tx.id},${typeStr},${tx.amount},${tx.currency},${tx.method},"${tx.date}",${tx.status}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `gomoto_wallet_transactions_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", "Export CSV", "Le fichier CSV a été généré avec succès.");
  };

  const handleExportWalletPDF = () => {
    if (!transactions || transactions.length === 0) {
      showToast("error", "Erreur d'export", "Aucune transaction disponible pour l'export.");
      return;
    }

    const doc = new jsPDF();

    // En-tête
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("GOMOTO RDC", 14, 20);

    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text("Relevé de Transactions - Wallet", 14, 28);

    doc.setFontSize(10);
    doc.text(`Client : ${profile.firstName} ${profile.lastName}`, 14, 38);
    doc.text(`Date d'export : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 44);

    // Ligne de séparation
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 48, 196, 48);

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    let yPos = 56;
    
    transactions.forEach((tx) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      // Format line
      const typeLabel = tx.type === "deposit" ? "+ CREDIT" : "- DEBIT ";
      const fontColor = tx.type === "deposit" ? [0, 150, 0] : [200, 0, 0];
      
      doc.setFont("helvetica", "bold");
      // @ts-ignore
      doc.setTextColor(...fontColor);
      doc.text(typeLabel, 14, yPos);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.text(`${tx.amount.toLocaleString("fr-FR")} ${tx.currency}`, 45, yPos);

      doc.text(`Méthode: ${tx.method}`, 90, yPos);
      doc.text(`${tx.date}`, 145, yPos);

      yPos += 8;
      
      doc.setDrawColor(240, 240, 240);
      doc.line(14, yPos - 3, 196, yPos - 3);
    });

    doc.save(`gomoto_wallet_transactions_${new Date().getTime()}.pdf`);
    showToast("success", "Export PDF", "Le relevé PDF a été généré avec succès.");
  };

  // Modification Request submit
  const handleSendModificationRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqFirstName.trim() || !reqLastName.trim() || !reqReason.trim()) {
      alert("Tous les champs obligatoires (Prénom, Nom, Motif) sont requis pour valider le recours.");
      return;
    }

    const newRequest: AdminModificationRequest = {
      id: "req-" + Math.random().toString(36).substr(2, 7),
      userId: profile.id,
      userRole: "client",
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
    alert("Votre demande de modification de profil et de documents d'identité a été transmise à la direction administrative. Elle est en cours d'examen.");
  };

  return (
    <div id="client-screen-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto relative">
      
      {/* Toast Notifications Overlay Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={`p-4 rounded-2xl shadow-xl border flex gap-3 text-left pointer-events-auto items-start ${
                toast.type === "success"
                  ? "bg-emerald-950 border-emerald-800 text-emerald-50"
                  : toast.type === "info"
                  ? "bg-slate-900 border-slate-700 text-slate-100"
                  : toast.type === "warning"
                  ? "bg-amber-950 border-amber-800 text-amber-50"
                  : "bg-red-950 border-red-800 text-red-50"
              }`}
            >
              {/* Type Accent Icon */}
              <div className="mt-0.5 select-none">
                {toast.type === "success" && <CheckCircle className="w-4 h-4 text-emerald-450" />}
                {toast.type === "info" && <Info className="w-4 h-4 text-sky-400" />}
                {toast.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {toast.type === "error" && <ShieldAlert className="w-4 h-4 text-red-400" />}
              </div>

              {/* Message Details */}
              <div className="flex-1 space-y-0.5">
                <span className="font-extrabold text-[11px] block uppercase tracking-wider font-mono">
                  {toast.title}
                </span>
                <span className="text-[10px] opacity-90 leading-relaxed block">
                  {toast.message}
                </span>
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="opacity-65 hover:opacity-100 p-0.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                id={`btn-close-${toast.id}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Sticky Network Resilience Indicator Banner */}
      {!isOnline && (
        <div id="offline-network-banner" className="lg:col-span-12 bg-amber-50 border border-amber-200 text-slate-800 p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center justify-between text-left animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-2xl text-amber-700 animate-pulse">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider block font-bold text-slate-900 flex items-center gap-1.5">
                <span>Mode Hors-ligne Résilient Actif (RDC • IndexedDB Engine)</span>
                <span className="bg-amber-100 text-amber-850 text-[8px] font-black px-1.5 py-0.5 rounded uppercase font-mono">Resilient State</span>
              </span>
              <span className="text-[10px] text-slate-500 block leading-normal mt-0.5 font-sans">
                La connexion mobile GSM (Gombe, Victoire, Bandal, etc.) est instable. GoMoto affiche votre historique de courses et votre solde via le <b>moteur de cache sécurisé d'État IndexedDB</b> local.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 bg-white border border-amber-200 px-3 py-1.5 rounded-xl text-[9px] font-mono text-slate-600 shadow-xs">
            <Database className="w-3.5 h-3.5 text-amber-600" />
            <span>Store: GoMotoRDC_OfflineStorage</span>
          </div>
        </div>
      )}

      {/* LEFT COLUMN: Sidebar menu, navigation, status */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Profile Card & Info overview */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden text-slate-800">
          <div className="absolute top-0 right-0 bg-blue-600 text-white font-bold text-[9px] px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            {translations[lang]?.roleClient || "Passager"}
          </div>

          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-blue-600 overflow-hidden font-bold">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1">
                <span>{profile.firstName} {profile.lastName}</span>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">{profile.phone}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="bg-slate-50 text-slate-605 px-2 py-0.5 rounded text-[8px] font-mono border border-slate-200">
                  {profile.address.province} • {profile.address.city}
                </span>
              </div>
            </div>
          </div>

          {/* Quick wallet balances */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">{translations[lang]?.balanceCDF || "Solde CDF"}</span>
              <span className="text-xs font-bold text-emerald-700 block mt-0.5">{profile.walletBalanceCDF.toLocaleString("fr-FR")} CDF</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">{translations[lang]?.balanceUSD || "Solde USD"}</span>
              <span className="text-xs font-bold text-blue-700 block mt-0.5">${profile.walletBalanceUSD.toFixed(2)} USD</span>
            </div>
          </div>

          {/* Reorganized Vertical Navigation Sidebar Menu with Icons */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-4 mt-5 text-left animate-fade-in shadow-sm">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block px-1.5 mb-1.5">Services de Transport</span>
              <div className="space-y-1.5">
                <button
                  type="button"
                  id="tab-btn-ride"
                  onClick={() => setActiveTab("ride")}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-[11px] font-bold transition-all cursor-pointer ${
                    activeTab === "ride"
                      ? "bg-blue-600 text-white shadow-sm font-black translate-x-1"
                      : "text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Compass className={`w-4 h-4 ${activeTab === "ride" ? "text-white" : "text-blue-650"}`} />
                  <span className="flex-1 text-left">{translations[lang]?.tabRide || "Commander"}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  type="button"
                  id="tab-btn-history"
                  onClick={() => setActiveTab("history")}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-[11px] font-bold transition-all cursor-pointer ${
                    activeTab === "history"
                      ? "bg-blue-600 text-white shadow-sm font-black translate-x-1"
                      : "text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Clock className={`w-4 h-4 ${activeTab === "history" ? "text-white" : "text-amber-505"}`} />
                  <span className="flex-1 text-left">{translations[lang]?.tabHistory || "Historique"}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>
            </div>

            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block px-1.5 mb-1.5">Finances & Recours</span>
              <div className="space-y-1.5">
                <button
                  type="button"
                  id="tab-btn-wallet"
                  onClick={() => setActiveTab("wallet")}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-[11px] font-bold transition-all cursor-pointer ${
                    activeTab === "wallet"
                      ? "bg-blue-600 text-white shadow-sm font-black translate-x-1"
                      : "text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <CreditCard className={`w-4 h-4 ${activeTab === "wallet" ? "text-white" : "text-emerald-650"}`} />
                  <span className="flex-1 text-left">{translations[lang]?.tabWallet || "Wallet"}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  type="button"
                  id="tab-btn-disputes"
                  onClick={() => setActiveTab("disputes")}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-[11px] font-bold transition-all cursor-pointer ${
                    activeTab === "disputes"
                      ? "bg-blue-600 text-white shadow-sm font-black translate-x-1"
                      : "text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <HelpCircle className={`w-4 h-4 ${activeTab === "disputes" ? "text-white" : "text-rose-505"}`} />
                  <span className="flex-1 text-left">{translations[lang]?.tabDisputes || "Litiges"}</span>
                  {disputes.length > 0 && (
                    <span className="bg-rose-100 text-rose-700 text-[8px] font-bold px-1.5 py-0.2 rounded font-mono">
                      {disputes.length}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  type="button"
                  id="tab-btn-chat"
                  onClick={() => setActiveTab("chat")}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-[11px] font-bold transition-all cursor-pointer ${
                    activeTab === "chat"
                      ? "bg-blue-600 text-white shadow-sm font-black translate-x-1"
                      : "text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <MessageSquare className={`w-4 h-4 ${activeTab === "chat" ? "text-white" : "text-amber-550"}`} />
                  <span className="flex-1 text-left">Google Chat Support</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  type="button"
                  id="tab-btn-promotions"
                  onClick={() => setActiveTab("promotions")}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-[11px] font-bold transition-all cursor-pointer ${
                    activeTab === "promotions"
                      ? "bg-blue-600 text-white shadow-sm font-black translate-x-1 font-sans"
                      : "text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 font-sans"
                  }`}
                >
                  <Gift className={`w-4 h-4 ${activeTab === "promotions" ? "text-white" : "text-amber-500"}`} />
                  <span className="flex-1 text-left font-bold">{lang === "en" ? "Offers & Loyalty" : "Offres & Fidélité"}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block px-1.5 mb-1.5">Mon Profil & Protection</span>
              <div className="space-y-1.5">
                <button
                  type="button"
                  id="tab-btn-profile"
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-[11px] font-bold transition-all cursor-pointer ${
                    activeTab === "profile"
                      ? "bg-blue-600 text-white shadow-sm font-black translate-x-1"
                      : "text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <User className={`w-4 h-4 ${activeTab === "profile" ? "text-white" : "text-indigo-505"}`} />
                  <span className="flex-1 text-left">{translations[lang]?.tabProfile || "Profil"}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

              </div>
            </div>
          </div>

          {/* Desktop tabs buttons */}
          <div id="desktop-tabs-menu" className="hidden">
            <button
               type="button"
               onClick={() => setActiveTab("ride")}
               className={`flex-1 text-center py-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                 activeTab === "ride" ? "bg-white text-slate-800 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
               }`}
            >
              {translations[lang]?.tabRide || "Commander"}
            </button>
            <button
               type="button"
               onClick={() => setActiveTab("history")}
               className={`flex-1 text-center py-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                 activeTab === "history" ? "bg-white text-slate-800 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
               }`}
            >
              {translations[lang]?.tabHistory || "Historique"}
            </button>
            <button
               type="button"
               onClick={() => setActiveTab("wallet")}
               className={`flex-1 text-center py-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                 activeTab === "wallet" ? "bg-white text-slate-800 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
               }`}
            >
              {translations[lang]?.tabWallet || "Wallet"}
            </button>
            <button
               type="button"
               onClick={() => setActiveTab("disputes")}
               className={`flex-1 text-center py-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                 activeTab === "disputes" ? "bg-white text-slate-800 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
               }`}
            >
              {translations[lang]?.tabDisputes || "Litiges"}
            </button>
            <button
               type="button"
               onClick={() => setActiveTab("promotions")}
               className={`flex-1 text-center py-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                 activeTab === "promotions" ? "bg-white text-slate-800 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
               }`}
            >
              {lang === "en" ? "Offers" : "Offres"}
            </button>
            <button
               type="button"
               onClick={() => setActiveTab("profile")}
               className={`flex-1 text-center py-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                 activeTab === "profile" ? "bg-white text-slate-800 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
               }`}
            >
              {translations[lang]?.tabProfile || "Profil"}
            </button>
          </div>
        </div>

        {/* Dynamic active ride panel if accepted or driving */}
        {rideStatus !== "idle" && assignedDriver && (
          <div id="active-client-ride-driver-card" className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-blue-600 text-white font-mono text-[8px] font-bold px-2 py-0.5 rounded uppercase">
              {rideStatus === "searching" && "Recherche"}
              {rideStatus === "accepted" && "Motard en approche"}
              {rideStatus === "picked_up" && "Course en cours"}
              {rideStatus === "completed" && "Destination"}
            </div>
            
            <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Dossier Moto Partenaire</span>
            </h3>

            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200">
              <img referrerPolicy="no-referrer" src={assignedDriver.selfie} alt={assignedDriver.name} className="h-12 w-12 rounded-full object-cover border border-blue-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">{assignedDriver.name}</h4>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Star className="w-3.5 h-3.5 text-blue-650 fill-blue-600 text-blue-600" />
                  <span className="text-slate-700 font-bold">{assignedDriver.rating}</span>
                  <span>• Plaque: {assignedDriver.plate}</span>
                </div>
                <span className="text-[9px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-blue-600 mt-1 inline-block font-bold">
                  {assignedDriver.color}
                </span>
              </div>
            </div>

            {/* OTP SECURITY PIN FOR START RIDE */}
            {rideStatus === "accepted" && (() => {
              try {
                const actRide = JSON.parse(localStorage.getItem("gomoto_active_ride") || "{}");
                if (actRide?.securityPin) {
                  return (
                    <div className="mt-4 bg-purple-50 border border-purple-200 p-3.5 rounded-2xl flex items-center justify-between text-left shadow-sm">
                      <div>
                        <span className="text-[10px] font-black text-purple-600 block uppercase tracking-wider flex items-center gap-1.5"><Key className="w-3.5 h-3.5" /> Code de Sécurité</span>
                        <span className="text-[9px] text-slate-600 block mt-0.5 leading-tight">Donnez ce PIN au motard pour qu'il puisse démarrer la course.</span>
                      </div>
                      <div className="bg-white px-3 py-1.5 rounded-xl border border-purple-200 shadow-sm">
                        <span className="text-lg font-mono font-black text-slate-800 tracking-widest">{actRide.securityPin}</span>
                      </div>
                    </div>
                  );
                }
              } catch (e) {}
              return null;
            })()}

            {/* Ride state information */}
            <div className="mt-4 space-y-2.5">
              <div className="flex justify-between items-center text-[11px] bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Départ choisi :</span>
                <span className="font-bold text-slate-800 max-w-[150px] truncate" title={pickupRoad}>{pickupRoad}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Destination :</span>
                <span className="font-bold text-slate-800 max-w-[150px] truncate" title={dropoffRoad}>{dropoffRoad}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium font-bold">Coût estimé :</span>
                <span className="font-mono text-emerald-700 font-bold">{prices.cdf} CDF (${prices.usd})</span>
              </div>
            </div>

            {/* Driver call triggers */}
            <div className="mt-4 flex gap-2">
              <a
                href={`tel:${assignedDriver.phone}`}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2 rounded-xl text-[10px] font-bold text-center flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                <span>Appeler Motard</span>
              </a>
            </div>

            {/* Live ETA Tracking & Progress Line */}
            <div className="mt-4 bg-emerald-50 border border-emerald-500/20 p-3 rounded-2xl flex items-start gap-2.5 shadow-sm text-left">
              <div className="bg-emerald-600/10 text-emerald-600 p-2 rounded-xl border border-emerald-500/10 mt-0.5 shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <span className="text-[8px] font-extrabold text-emerald-600 uppercase tracking-widest block font-mono">AUDIT DE SÉCURITÉ GOMOTO RDC • CONFORME 100%</span>
                <span className="font-extrabold text-[10.5px] text-slate-800 block">Double Enrôlement National Validé</span>
                <span className="text-[9.5px] text-slate-500 block leading-tight mt-0.5">La moto et le chauffeur motard sont doublement affiliés à leur propriétaire légal d'actifs et certifiés conformes par l'Hôtel de Ville de Kinshasa. Assurances à jour.</span>
              </div>
            </div>

            {/* Live ETA Tracking & Progress Line */}
            <div className="mt-4 bg-blue-50/50 border border-blue-100 p-3.5 rounded-2xl text-left">
              <div className="flex justify-between items-center mb-1.5 text-xs">
                <span className="text-slate-500 font-medium font-bold">Temps estimé :</span>
                <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full text-[10px] uppercase font-mono">
                  {getETA()}
                </span>
              </div>
              
              {/* Dynamic Progress indicator with motorcycle */}
              <div className="relative w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-visible">
                <div 
                  className="absolute left-0 top-0 h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
                <span 
                  className="absolute -top-2.5 text-xs transition-all duration-500" 
                  style={{ left: `calc(${getProgressPercentage()}% - 8px)` }}
                >
                  🏍️
                </span>
              </div>
              <div className="flex justify-between text-[8px] text-slate-400 mt-1.5 font-black uppercase tracking-wider">
                <span>Départ</span>
                <span>Destination</span>
              </div>
            </div>

            {/* If arrived at destination, show payment validator callout */}
            {getProgressPercentage() >= 100 && rideStatus === "picked_up" && (
              <div id="reparo-payment-arrival-container" className="mt-4 bg-emerald-50 border border-emerald-205 p-4 rounded-2xl text-left space-y-3 animate-fade-in shadow-sm">
                <div className="flex items-start gap-2.5">
                  <div className="bg-emerald-100 p-1.5 rounded-full text-emerald-800 flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Destination atteinte !</h4>
                    <p className="text-[10px] text-slate-550 leading-relaxed font-sans">
                      Vous êtes arrivé à bon port. Veuillez approuver la libération de garantie REPARO pour créditer le motard Héritier LUKUSA et valider le paiement.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-reparo-payment-confirm-trigger"
                  onClick={handlePromptPaymentConfirmation}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm focus:ring-1 focus:ring-emerald-300"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Confirmer l'Arrivée & Libérer les Fonds (REPARO)</span>
                </button>
              </div>
            )}

            {/* In-App Direct Messaging Interface */}
            <div className="mt-4 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="bg-slate-800 text-white p-3 flex justify-between items-center text-xs">
                <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider font-sans">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Messagerie GoMoto</span>
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>

              {/* Chat log body */}
              <div className="h-36 overflow-y-auto p-3 space-y-2 bg-slate-50 text-[10px] flex flex-col text-left">
                {messages.length === 0 ? (
                  <div className="m-auto text-slate-400 text-center italic leading-relaxed font-semibold">
                    Aucun message échangé.<br />Saisissez un message ci-dessous pour discuter.
                  </div>
                ) : (
                  messages.map((m) => (
                    <div 
                      key={m.id} 
                      className={`max-w-[85%] rounded-xl px-3 py-1.5 leading-relaxed relative ${
                        m.senderRole === "client" 
                          ? "bg-blue-600 text-white self-end rounded-br-none" 
                          : "bg-white border border-slate-200 text-slate-800 self-start rounded-bl-none shadow-sm"
                      }`}
                    >
                      <span className="font-bold block text-[8px] opacity-75 mb-0.5">
                        {m.senderRole === "client" ? "Vous" : m.senderName}
                      </span>
                      <span>{m.text}</span>
                      <span className="text-[7px] block text-right mt-1 opacity-60 font-mono">
                        {m.timestamp}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Messenger bottom send form */}
              <form onSubmit={handleSendMessage} className="border-t border-slate-200 p-2 flex gap-1.5 bg-slate-50">
                <input
                  type="text"
                  placeholder="Écrire un message au motard..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500 text-slate-850"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SOS URGENCE RDC Trigger Button */}
        <button
          type="button"
          onClick={() => setShowSOSModal(true)}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-3 px-4 rounded-3xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md border border-red-500/20 uppercase tracking-wider animate-pulse"
        >
          <ShieldAlert className="w-4 h-4 text-white" />
          <span>🚨 SOS Urgence RDC (112)</span>
        </button>

        {/* Global Stats/Vision snippet */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-center">
          <p className="text-[10px] text-slate-500 italic font-medium">
            "GoMoto RDC : Sécurité absolue, traçabilité des courses et inclusion d'avenir."
          </p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-4 w-full bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-650 border border-slate-200 hover:border-red-105 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Se déconnecter de TalaTaxi</span>
          </button>
        </div>

      </div>

      {/* RIGHT COLUMN: Interactive map, wallet management, profile info */}
      <div className="lg:col-span-8 space-y-6">

        {/* ================= TABS VIEW 1: BOOK A MOTO-TAXI / MAP ================= */}
        {activeTab === "ride" && (
          <div className="space-y-6">
            {/* Simulated Live Map */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-center text-xs flex-wrap gap-2">
                <span className="font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span>Géolocalisation en temps réel (Congo)</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMapViewMode("live")}
                    className={`px-2.5 py-1 rounded-xl font-bold text-[9px] uppercase tracking-wider border transition-all cursor-pointer ${
                      mapViewMode === "live"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm font-black"
                        : "bg-slate-50 text-slate-650 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    Google Maps (Live) 🌍
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapViewMode("simulator")}
                    className={`px-2.5 py-1 rounded-xl font-bold text-[9px] uppercase tracking-wider border transition-all cursor-pointer ${
                      mapViewMode === "simulator"
                        ? "bg-slate-800 text-white border-slate-850 shadow-sm font-black"
                        : "bg-slate-50 text-slate-650 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    Simulateur (SVG) 🇨🇩
                  </button>
                </div>
              </div>
              
              <WeatherAlert 
                theme="light" 
                communeFilter={selectedCommuneName} 
                address={{ 
                  ...profile.address, 
                  province: drcProvinces.find(p => p.id === selectedProvinceId)?.name || selectedProvinceId, 
                  city: selectedCityName, 
                  commune: selectedCommuneName 
                }} 
                lang={lang} 
              />

              {mapViewMode === "live" ? (
                <LiveMapTracking
                  provinceName={drcProvinces.find(p => p.id === selectedProvinceId)?.name || selectedProvinceId}
                  cityName={selectedCityName}
                  communeName={selectedCommuneName}
                  pickupRoad={pickupRoad}
                  dropoffRoad={dropoffRoad}
                  lang={lang}
                  onSwitchToLocalSimulator={() => setMapViewMode("simulator")}
                />
              ) : (
                <MapSimulator
                  address={{
                     ...profile.address,
                     province: drcProvinces.find(p => p.id === selectedProvinceId)?.name || selectedProvinceId,
                     city: selectedCityName,
                     commune: selectedCommuneName,
                  }}
                  pickupAddress={{
                    ...profile.address,
                    province: drcProvinces.find(p => p.id === selectedProvinceId)?.name || selectedProvinceId,
                    city: selectedCityName,
                    commune: selectedCommuneName,
                    avenue: pickupRoad,
                  }}
                  dropoffAddress={{
                    ...profile.address,
                    province: drcProvinces.find(p => p.id === selectedProvinceId)?.name || selectedProvinceId,
                    city: selectedCityName,
                    commune: selectedCommuneName,
                    avenue: dropoffRoad,
                  }}
                  isRideActive={rideStatus !== "idle"}
                  rideStatus={rideStatus === "idle" ? undefined : rideStatus}
                  driverPosition={driverPos}
                  passengerPosition={passengerPos}
                  onMapClick={handleMapSelection}
                />
              )}
            </div>

            {/* Prominent Active Promotions Spotlight Banner */}
            {rideStatus === "idle" && (
              <div 
                id="active-promotions-spotlight-banner"
                className="bg-gradient-to-r from-amber-50 through-orange-50 to-amber-50 border border-amber-200 rounded-3xl p-4 shadow-sm space-y-3.5 text-left text-slate-850"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏷️</span>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Promotions & Bonnes Offres</h4>
                      <p className="text-[9.5px] text-amber-800 font-medium">Bénéficiez de remises immédiates sur vos courses de ce jour.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("promotions")}
                    className="text-[9.5px] font-extrabold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 uppercase tracking-wider bg-white rounded-lg px-2 py-1 border border-slate-200/50 shadow-xs cursor-pointer"
                  >
                    <span>Voir tout</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Local Offres Spéciales */}
                  <div className="bg-white/80 p-3 rounded-2xl border border-amber-200/50 flex flex-col justify-between">
                    <div>
                      <span className="bg-orange-100 text-orange-850 text-[8px] font-black uppercase px-2 py-0.5 rounded-full inline-block mb-1.5 font-mono">Offre Limitée Active</span>
                      <h5 className="font-bold text-slate-850 text-xs">⚡ Kalamu Weekend Special</h5>
                      <p className="text-[9.5px] text-slate-500 mt-0.5 leading-relaxed">
                        Voyagez malin avec 20% de réduction vers Kalamu ce week-end !
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const foundCode: DiscountCode = {
                          id: "promo-kns20",
                          code: "KNS20",
                          discountType: "percent",
                          discountValue: 20,
                          minRideAmountCDF: 3000,
                          maxDiscountCDF: 4000,
                          validFrom: "2026-01-01",
                          validTo: "2026-12-31",
                          usageLimit: 500,
                          timesUsed: 42,
                          active: true,
                          description: "20% de réduction sur vos trajets de plus de 3.000 CDF (Max 4.000 CDF)."
                        };
                        setAppliedPromo(foundCode);
                        alert("Code promotionnel KNS20 (-20%) appliqué automatiquement ! Le prix estimé ci-dessous a été réduit.");
                      }}
                      className="mt-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-[9px] uppercase tracking-widest py-1.5 px-3 rounded-xl transition shadow-xs text-center cursor-pointer"
                    >
                      Appliquer Code KNS20 (-20%)
                    </button>
                  </div>

                  {/* Coupon Code Shortcut */}
                  <div className="bg-white/80 p-3 rounded-2xl border border-amber-200/50 flex flex-col justify-between">
                    <div>
                      <span className="bg-blue-100 text-blue-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-full inline-block mb-1.5 font-mono">Forfait Fixe</span>
                      <h5 className="font-bold text-slate-850 text-xs">🎁 Bon Forfaitaire Immédiat</h5>
                      <p className="text-[9.5px] text-slate-500 mt-0.5 leading-relaxed">
                        Économisez instantanément un montant fixe de 1.500 CDF sur toute course.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const foundCode: DiscountCode = {
                          id: "promo-gomoto5",
                          code: "GOMOTO5",
                          discountType: "fixed",
                          discountValue: 1500,
                          minRideAmountCDF: 2000,
                          maxDiscountCDF: 1500,
                          validFrom: "2026-01-01",
                          validTo: "2026-12-31",
                          usageLimit: 1000,
                          timesUsed: 189,
                          active: true,
                          description: "Réduction fixe immédiate de 1.500 CDF sur n'importe quel trajet !"
                        };
                        setAppliedPromo(foundCode);
                        alert("Forfait GOMOTO5 (-1500 CDF) appliqué automatiquement !");
                      }}
                      className="mt-3 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[9px] uppercase tracking-widest py-1.5 px-3 rounded-xl transition shadow-xs text-center cursor-pointer"
                    >
                      Utiliser Forfait GOMOTO5
                    </button>
                  </div>
                </div>

                {appliedPromo && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
                    <span className="font-semibold flex items-center gap-1.5 text-[11px]">
                      ✨ Réduction active : <b className="font-extrabold bg-emerald-100 px-1.5 py-0.5 rounded font-mono text-emerald-950">{appliedPromo.code}</b> 
                      ({appliedPromo.discountType === "percent" ? `${appliedPromo.discountValue}%` : `${appliedPromo.discountValue} CDF`})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedPromo(null);
                        alert("Code promotionnel désactivé.");
                      }}
                      className="text-[9.5px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Setup Destination / Trip request form */}
            {rideStatus === "idle" ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 border border-blue-100 shadow-sm">
                      <Navigation className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Estimateur de Coût & Itinéraire (Géo-Temps Réel)</h3>
                      <p className="text-[10px] text-slate-500">Estimez en temps réel le coût de votre trajet basé sur la distance et le tarif de votre province.</p>
                    </div>
                  </div>
                  <span className="bg-blue-50 text-blue-700 font-mono text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    ESTIMATEUR
                  </span>
                </div>

                {/* Grid 1: Province / City / Commune selector */}
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    📍 1. Ville d'opération de la course
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Province Selection */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        Province
                      </label>
                      <select
                        value={selectedProvinceId}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:border-blue-500 outline-none shadow-sm cursor-pointer"
                      >
                        {drcProvinces.map((prov) => (
                          <option key={prov.id} value={prov.id}>
                            {prov.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* City Selection */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        Ville choisie
                      </label>
                      <select
                        value={selectedCityName}
                        onChange={(e) => handleCityChange(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:border-blue-500 outline-none shadow-sm cursor-pointer"
                      >
                        {activeCities.map((city) => (
                          <option key={city.name} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Commune Selection */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        Commune de départ
                      </label>
                      <select
                        value={selectedCommuneName}
                        onChange={(e) => setSelectedCommuneName(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:border-blue-500 outline-none shadow-sm cursor-pointer"
                      >
                        {activeCommunes.length > 0 ? (
                          activeCommunes.map((comm) => (
                            <option key={comm} value={comm}>
                              {comm}
                            </option>
                          ))
                        ) : (
                          <option value="Centre">Centre-Ville</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Grid 2: Traffic and Weather surge simulation */}
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      ⚡ 2. Conditions du Trafic & Surge RDC
                    </span>
                    {prices.trafficFactor > 1 && (
                      <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider animate-pulse">
                        Surge Tarification Actif (x{prices.trafficFactor})
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Low traffic */}
                    <button
                      type="button"
                      onClick={() => {
                        setSimulatedCongestion("low");
                        setIsSimulatingItinerary(true);
                        setTimeout(() => setIsSimulatingItinerary(false), 800);
                      }}
                      className={`py-2 px-2.5 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        simulatedCongestion === "low"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-sm">🟢</span>
                      <span>Fluide (Standard)</span>
                    </button>

                    {/* Medium traffic */}
                    <button
                      type="button"
                      onClick={() => {
                        setSimulatedCongestion("medium");
                        setIsSimulatingItinerary(true);
                        setTimeout(() => setIsSimulatingItinerary(false), 800);
                      }}
                      className={`py-2 px-2.5 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        simulatedCongestion === "medium"
                          ? "bg-amber-50 border-amber-500 text-amber-800 shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-sm">🟡</span>
                      <span>Heures de Pointe (+20%)</span>
                    </button>

                    {/* High traffic / Rain */}
                    <button
                      type="button"
                      onClick={() => {
                        setSimulatedCongestion("high");
                        setIsSimulatingItinerary(true);
                        setTimeout(() => setIsSimulatingItinerary(false), 800);
                      }}
                      className={`py-2 px-2.5 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        simulatedCongestion === "high"
                          ? "bg-red-50 border-red-500 text-red-800 shadow-sm animate-pulse"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-sm">⛈️ Mbula</span>
                      <span>Pluie d'Orages (+40%)</span>
                    </button>
                  </div>
                </div>

                {/* Grid 3: Point-to-point road itinerary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pickup Avenue */}
                  <div className="space-y-1 text-left">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3" />
                        <span>Avenue de Départ ({selectedCommuneName})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                              const gpsString = `Point GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
                              setPickupRoad(gpsString);
                              setIsSimulatingItinerary(true);
                              setTimeout(() => setIsSimulatingItinerary(false), 1000);
                            }, () => {
                              alert("Veuillez autoriser l'accès au GPS dans votre navigateur.");
                            });
                          } else {
                            alert("La localisation GPS n'est pas supportée par votre navigateur.");
                          }
                        }}
                        className="text-[9px] bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded cursor-pointer hover:bg-blue-200 transition-all ml-auto uppercase tracking-wider shadow-sm flex items-center gap-1"
                      >
                        📍 Utiliser Mon GPS
                      </button>
                    </label>
                    <select
                      value={pickupRoad}
                      onChange={(e) => {
                        setPickupRoad(e.target.value);
                        setIsSimulatingItinerary(true);
                        setTimeout(() => setIsSimulatingItinerary(false), 1000);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:border-blue-600 outline-none cursor-pointer"
                    >
                      {pickupRoad.startsWith("Point GPS") && (
                        <option value={pickupRoad} className="text-blue-800 font-bold bg-blue-50">
                          {pickupRoad} (Lat/Lng)
                        </option>
                      )}
                      <option value={profile.address.avenue} className="text-slate-800">
                        {profile.address.avenue} (Mon domicile)
                      </option>
                      {mockAvenues.map((av, idx) => (
                        <option key={idx} value={av} className="text-slate-800">
                          {av}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dropoff Avenue */}
                  <div className="space-y-1 text-left">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 text-red-550" />
                        <span>Avenue de Destination</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                              const gpsString = `Point GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
                              setDropoffRoad(gpsString);
                              setIsSimulatingItinerary(true);
                              setTimeout(() => setIsSimulatingItinerary(false), 1000);
                            }, () => {
                              alert("Veuillez autoriser l'accès au GPS dans votre navigateur.");
                            });
                          } else {
                            alert("La localisation GPS n'est pas supportée par votre navigateur.");
                          }
                        }}
                        className="text-[9px] bg-red-50 text-red-700 font-bold px-2 py-1 rounded cursor-pointer hover:bg-red-100 transition-all ml-auto uppercase tracking-wider shadow-sm flex items-center gap-1 border border-red-100"
                      >
                        📍 Mon GPS
                      </button>
                    </label>
                    <select
                      value={dropoffRoad}
                      onChange={(e) => {
                        setDropoffRoad(e.target.value);
                        setIsSimulatingItinerary(true);
                        setTimeout(() => setIsSimulatingItinerary(false), 1000);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:border-blue-600 outline-none cursor-pointer"
                    >
                      {dropoffRoad.startsWith("Point GPS") && (
                        <option value={dropoffRoad} className="text-red-800 font-bold bg-red-50">
                          {dropoffRoad} (Lat/Lng)
                        </option>
                      )}
                      {mockAvenues
                        .filter((av) => av !== pickupRoad)
                        .map((av, idx) => (
                          <option key={idx} value={av} className="text-slate-800">
                            {av}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Route calculation loader overlay */}
                {isSimulatingItinerary && (
                  <div className="bg-blue-50/90 border border-blue-250 p-4 rounded-2xl flex flex-col items-center justify-center space-y-2.5 text-center animate-fade-in py-5 shadow-inner">
                    <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                    <div className="space-y-1">
                      <p className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                        Simulation d'itinéraire contractuel en cours...
                      </p>
                      <p className="text-[10px] text-blue-600 italic">
                        Calcul de la distance à {selectedCityName} ({selectedCommuneName}) via {pickupRoad} et {dropoffRoad}...
                      </p>
                    </div>
                  </div>
                )}

                {/* Ride classes selection */}
                <div className="space-y-2 pt-2 text-left">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Choix de la Catégorie de Course
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {/* Classique */}
                    <button
                      type="button"
                      onClick={() => setSelectedClass("moto_classique")}
                      className={`p-3.5 rounded-2xl border text-left flex justify-between items-start transition-all cursor-pointer ${
                        selectedClass === "moto_classique"
                          ? "bg-blue-50 border-blue-600 shadow-sm"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span>Moto Classique</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5">Casque standard inclus</p>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-blue-700">2000 CDF / km</span>
                    </button>

                    {/* Premium */}
                    <button
                      type="button"
                      onClick={() => setSelectedClass("moto_premium")}
                      className={`p-3.5 rounded-2xl border text-left flex justify-between items-start transition-all cursor-pointer ${
                        selectedClass === "moto_premium"
                          ? "bg-blue-50 border-blue-600 shadow-sm"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span>Premium GOMOTO</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5">Casque neuf + Gilet propre</p>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-blue-700">2700 CDF / km</span>
                    </button>

                    {/* Cargo */}
                    <button
                      type="button"
                      onClick={() => setSelectedClass("moto_cargo")}
                      className={`p-3.5 rounded-2xl border text-left flex justify-between items-start transition-all cursor-pointer ${
                        selectedClass === "moto_cargo"
                          ? "bg-blue-50 border-blue-600 shadow-sm"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span>Livraison / Cargo</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5">Coffre de transport sécurisé</p>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-blue-700">3200 CDF / km</span>
                    </button>
                  </div>
                </div>

                {/* Ride Summary and Book button */}
                <div className="grid grid-cols-1 md:grid-cols-2 bg-slate-50 p-4 rounded-2xl border border-slate-250 items-center justify-between gap-4 text-left">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">
                      Itinéraire à {selectedCityName}
                    </h4>
                    <div className="flex flex-col text-[10px] text-slate-600 space-y-0.5">
                      <p>
                        Commune : <b className="text-slate-800 font-semibold">{selectedCommuneName}</b>
                      </p>
                      <p>
                        Distance : <b className="text-slate-900 font-mono text-xs">{distanceKm} Km</b>
                      </p>
                      <p>
                        Prise en charge :{" "}
                        <b className="text-slate-800 font-mono">
                          {prices.baseFee.toLocaleString()} CDF
                        </b>
                      </p>
                      <p>
                        Coût au Km :{" "}
                        <b className="text-slate-850 font-mono">
                          {prices.ratePerKm.toLocaleString()} CDF/Km
                        </b>{" "}
                        {prices.cityMultiplier > 1 && (
                          <span className="text-blue-600 text-[8px] font-semibold">
                            (Zone Premium x{prices.cityMultiplier})
                          </span>
                        )}
                      </p>
                    </div>
                    {finalPrices.applied ? (
                      <div className="mt-1.5 pt-1 border-t border-slate-200/60 block space-y-1 text-left">
                        <div className="flex items-center gap-1.5 text-[9.5px] text-slate-500">
                          <span className="line-through">{prices.cdf.toLocaleString()} CDF (~${prices.usd})</span>
                          <span className="bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded text-[8px] uppercase">
                            -{appliedPromo?.discountType === "percent" ? `${appliedPromo?.discountValue}%` : `${appliedPromo?.discountValue} CDF`} !
                          </span>
                        </div>
                        <p className="text-xs font-extrabold text-emerald-800">
                          Tarif Promotionnel : <span className="font-mono font-black text-sm">{finalPrices.cdf.toLocaleString()} CDF</span>{" "}
                          <span className="text-slate-500 font-normal">(${finalPrices.usd} USD)</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs font-extrabold text-emerald-700 mt-1.5 pt-1 border-t border-slate-200/60 block">
                        Tarif Total Certifié : {prices.cdf.toLocaleString()} CDF{" "}
                        <span className="text-slate-450 font-normal">(${prices.usd} USD)</span>
                      </p>
                    )}
                  </div>


                  {!isPactSigned ? (
                    <div className="flex flex-col space-y-3.5 w-full">
                      {/* Mandatory Road Safety Pact Sign-up Card - Green/Dark Visual Style */}
                      <div className="bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900 border-2 border-emerald-500/30 rounded-3xl p-5 text-white space-y-4 shadow-xl text-left">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[8.5px] font-mono font-black text-emerald-400 uppercase tracking-widest block">CONTRAT DE CITOYENNETÉ ROUTIÈRE</span>
                            <h4 className="text-sm font-black text-white font-sans mt-0.5">Engagement Obligatoire au Pacte de Sécurité GoMoto RDC</h4>
                            <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                              Chaque motard, passager et propriétaire de flotte est légalement tenu de souscrire formellement à l'application rigoureuse du Code de la Route Congolais (Loi n° 78/022) pour la préservation des vies humaines en RDC.
                            </p>
                          </div>
                        </div>

                        {/* Form starts here */}

                        <form onSubmit={handleSignPact} className="space-y-4 text-left border-t border-slate-800/80 pt-3">
                          {/* Name and Status */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label htmlFor="pact-name-inp" className="block text-[8.5px] font-black text-slate-400 uppercase tracking-wider font-mono">
                                VOTRE NOM & POSTNOM COMPLET :
                              </label>
                              <input
                                id="pact-name-inp"
                                type="text"
                                required
                                value={pledgeName}
                                onChange={(e) => setPledgeName(e.target.value)}
                                placeholder="Ex: Justin Kakonde Mbuyi"
                                className="w-full bg-slate-900/95 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-white outline-none focus:border-emerald-500 placeholder-slate-600 font-semibold"
                              />
                            </div>

                            <div className="space-y-1">
                              <label htmlFor="pact-role-inp" className="block text-[8.5px] font-black text-slate-400 uppercase tracking-wider font-mono">
                                VOTRE STATUT SUR L'APPLICATION :
                              </label>
                              <select
                                id="pact-role-inp"
                                value={pledgeRole}
                                onChange={(e) => setPledgeRole(e.target.value as any)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-white outline-none focus:border-emerald-500 font-semibold cursor-pointer"
                              >
                                <option value="client">Passager (Client Voyageur)</option>
                                <option value="driver">Chauffeur (Pilote Motard)</option>
                                <option value="owner">Propriétaire de Flotte (Investisseur)</option>
                              </select>
                            </div>
                          </div>

                          {/* Interactive Checkboxes */}
                          <div className="space-y-2.5 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-850">
                            <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest block font-mono">
                              COCHEZ CHAQUE ARTICLE OBLIGATOIRE POUR VALIDER :
                            </span>

                            <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none group">
                              <div className="mt-0.5 shrink-0">
                                <input
                                  type="checkbox"
                                  checked={pledgeCasque}
                                  onChange={(e) => setPledgeCasque(e.target.checked)}
                                  className="h-3.5 w-3.5 accent-emerald-500 rounded border-slate-800 cursor-pointer"
                                />
                              </div>
                              <span className="text-[10.5px] text-slate-300 leading-normal group-hover:text-white transition">
                                <b>Art 1.</b> Je m’engage au port systématique du <b>casque de protection homologué</b> (double casque obligatoire pour le motard et son passager) à chaque seconde du trajet.
                              </span>
                            </label>

                            <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none group">
                              <div className="mt-0.5 shrink-0">
                                <input
                                  type="checkbox"
                                  checked={pledgeRules}
                                  onChange={(e) => setPledgeRules(e.target.checked)}
                                  className="h-3.5 w-3.5 accent-emerald-500 rounded border-slate-800 cursor-pointer"
                                />
                              </div>
                              <span className="text-[10.5px] text-slate-300 leading-normal group-hover:text-white transition">
                                <b>Art 2 & 3.</b> Je m'oppose fermement à toute forme de surcharge, au surpassement des 50 km/h et au franchissement de la commune interdite de la Gombe.
                              </span>
                            </label>

                            <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none group">
                              <div className="mt-0.5 shrink-0">
                                <input
                                  type="checkbox"
                                  checked={pledgeNoProhibited}
                                  onChange={(e) => setPledgeNoProhibited(e.target.checked)}
                                  className="h-3.5 w-3.5 accent-emerald-500 rounded border-slate-800 cursor-pointer"
                                />
                              </div>
                              <span className="text-[10.5px] text-slate-300 leading-normal group-hover:text-white transition">
                                <b>Art 7.</b> Je promets une vigilance civique totale (aucun transport de colis suspect ou fret prohibé) et accepte l'arbitrage légitime de GoMoto.
                              </span>
                            </label>

                            <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none group">
                              <div className="mt-0.5 shrink-0">
                                <input
                                  type="checkbox"
                                  checked={pledgeRespectDrivers}
                                  onChange={(e) => setPledgeRespectDrivers(e.target.checked)}
                                  className="h-3.5 w-3.5 accent-emerald-500 rounded border-slate-800 cursor-pointer"
                                />
                              </div>
                              <span className="text-[10.5px] text-slate-300 leading-normal group-hover:text-white transition">
                                <b>Art 8. Dignité & Respect.</b> Je m’engage à traiter mon chauffeur avec civilité, respect et déférence, et à proscrire rigoureusement tout comportement agressif ou haussement de ton.
                              </span>
                            </label>

                            <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none group">
                              <div className="mt-0.5 shrink-0">
                                <input
                                  type="checkbox"
                                  checked={pledgeRespectAgents}
                                  onChange={(e) => setPledgeRespectAgents(e.target.checked)}
                                  className="h-3.5 w-3.5 accent-emerald-500 rounded border-slate-800 cursor-pointer"
                                />
                              </div>
                              <span className="text-[10.5px] text-slate-300 leading-normal group-hover:text-white transition">
                                <b>Art 9. Collaboration.</b> Je m’engage à interagir avec tout agent du service clientèle de GoMoto RDC avec bienséance, politesse et intégrité.
                              </span>
                            </label>

                            <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none group">
                              <div className="mt-0.5 shrink-0">
                                <input
                                  type="checkbox"
                                  checked={pledgeZeroTolerance}
                                  onChange={(e) => setPledgeZeroTolerance(e.target.checked)}
                                  className="h-3.5 w-3.5 accent-emerald-500 rounded border-slate-800 cursor-pointer"
                                />
                              </div>
                              <span className="text-[10.5px] text-slate-300 leading-normal group-hover:text-white transition">
                                <b>Art 10. Vigilance Civique Sévère.</b> Je reconnais formellement que tout comportement ou conduite à risques, toute violence, ainsi que le transport ou trafic de stupéfiants ou d'armes à feu feront l'objet d'un signalement immédiat et d'une transmission de dossier aux autorités policières et judiciaires compétentes de la RDC.
                              </span>
                            </label>
                          </div>

                          <button
                            type="submit"
                            disabled={!pledgeName.trim() || !pledgeCasque || !pledgeRules || !pledgeNoProhibited || !pledgeRespectDrivers || !pledgeRespectAgents || !pledgeZeroTolerance}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 text-xs font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-emerald-500/10 transition-all cursor-pointer uppercase font-mono tracking-wider"
                          >
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            <span>Signer & Enregistrer mon Engagement</span>
                          </button>
                        </form>
                      </div>

                      {/* Bottom Legal Context - Conformité d'état RDC as shown on photo */}
                      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 space-y-3 text-left">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-amber-500" />
                          <span>Conformité d'État RDC</span>
                        </h4>
                        <p className="text-[10px] text-slate-350 leading-relaxed">
                          Chaque disposition contractuelle énoncée dans ce centre lèse ou profite directement aux utilisateurs de GoMoto selon les prescrits de <b>l'Autorité Urbaine de Sécurité du Transport Routier</b>. Tout incident, contestation tarifaire ou fraude de virement de portefeuille donne lieu à un arbitrage administratif officiel au sein de notre panel d'enquête de souveraineté.
                        </p>
                        <div className="pt-1 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="text-[8px] font-bold text-emerald-400 font-mono tracking-wide uppercase">SERVEUR JURIDIQUE SÉCURISÉ ACTIF</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-3.5 w-full">
                      {/* Certified Seal of safety commitment */}
                      <div className="bg-gradient-to-r from-emerald-50/90 to-slate-50/90 border-2 border-emerald-500/20 rounded-2xl p-4 text-left flex flex-col sm:flex-row gap-3 items-start justify-between shadow-sm">
                        <div className="flex gap-2.5 items-start text-[10.5px]">
                          <span className="text-emerald-650 bg-emerald-100/80 p-2 rounded-xl shrink-0 text-base">🛡️</span>
                          <div>
                            <span className="font-extrabold text-emerald-900 block text-[11px] uppercase tracking-wide">PACTE DE SÉCURITÉ GOMOTO RDC SIGNÉ</span>
                            <p className="text-slate-700 text-[10px] leading-relaxed mt-0.5">
                              Vous avez signé l'<b>Engagement Obligatoire au Pacte de Sécurité</b> (port du casque homologué obligatoire et refus des surcharges).
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                              <span className="bg-emerald-100 text-emerald-850 font-mono text-[9px] px-2 py-0.5 rounded font-black border border-emerald-200">
                                ID CODE : {pledgeCertCode || `GOMOTO-RDC-SEC-PASS-${Math.floor(100000+Math.random()*900000)}`}
                              </span>
                              <span className="text-[9px] text-slate-450 font-mono">Signé le : {pledgeDateStr || new Date().toLocaleDateString("fr-CD")}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            localStorage.removeItem(`gomoto_pact_signed_client_${profile.id}`);
                            setIsPactSigned(false);
                            setPledgeCasque(false);
                            setPledgeRules(false);
                            setPledgeNoProhibited(false);
                            setPledgeRespectDrivers(false);
                            setPledgeRespectAgents(false);
                            setPledgeZeroTolerance(false);
                          }}
                          className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[9.5px] font-medium text-rose-700 py-1 px-2.5 rounded-lg font-mono tracking-wider transition cursor-pointer self-end sm:self-start shrink-0"
                        >
                          RÉVOQUER
                        </button>
                      </div>

                      {/* Port de Casque obligatoire block */}
                      <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-3.5 text-left">
                        <div className="flex gap-2.5 items-start text-[10.5px]">
                          <span className="text-sm shrink-0">🪖</span>
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-blue-900 block uppercase tracking-wide">CASQUE OBLIGATOIRE ACTIF</span>
                            <p className="text-blue-800 text-[10px] leading-relaxed">
                              Conformément à votre Pacte signé, votre motard Héritier apportera votre casque de protection homologué. Le port est 100% requis pour démarrer la course.
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsSimulatingItinerary(true);
                          setTimeout(() => {
                            setIsSimulatingItinerary(false);
                            handleRequestRide();
                          }, 1000);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md select-none hover:scale-[1.01] duration-150"
                      >
                        <Navigation className="w-4 h-4 fill-white animate-pulse" />
                        <div className="flex flex-col text-center">
                          <span className="text-xs uppercase tracking-wider font-extrabold">Commander ma Course</span>
                          <span className="text-[9px] opacity-75 font-normal font-mono">
                            Recherche immédiate à {selectedCityName}
                          </span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
                <div id="live-trip-simulation-card" className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="animate-ping bg-blue-600 h-2 w-2 rounded-full inline-block"></span>
                    <h3 className="font-bold text-sm text-slate-800">Suivi en direct de votre course</h3>
                  </div>
                  <span className="bg-blue-50 border border-blue-105 text-blue-600 font-mono text-[9px] px-2.5 py-1 rounded-md font-bold">
                    MOTO ACTIF
                  </span>
                </div>

                {/* REPARO UPFRONT HOLD INDICATOR ACCORDING TO REQ #2 */}
                <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-blue-805 leading-relaxed">
                  <b className="text-sm">💰</b>
                  <div>
                    <span className="font-extrabold text-blue-900 block">Paiement Garanti en REPARO (Hôtel d'arbitrage) :</span>
                    Un dépôt fiduciaire de <b className="font-mono text-blue-950">{prices.cdf.toLocaleString()} CDF (${prices.usd} USD)</b> est retenu avec sécurité d'État. Les fonds seront libérés au motard, propriétaire et GoMoto à la fin (70% / 15% / 15%), ou remboursés sans pénalité en cas d'annulation.
                  </div>
                </div>

                {/* Live road step status */}
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-100"></div>
                  
                  <div className="flex items-start gap-2 text-xs relative">
                    <span className={`absolute left-[-17.5px] h-3.5 w-3.5 rounded-full border border-white flex items-center justify-center ${rideStatus !== "searching" ? "bg-emerald-500" : "bg-slate-300 animate-pulse"}`}></span>
                    <div>
                      <h4 className="font-bold text-slate-805">Chauffeur Héritier assigné</h4>
                      <p className="text-[10px] text-slate-450">Plaque validée : C-MC-4458KIN</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs relative">
                    <span className={`absolute left-[-17.5px] h-3.5 w-3.5 rounded-full border border-white flex items-center justify-center ${rideStatus === "picked_up" || rideStatus === "completed" ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                    <div>
                      <h4 className="font-bold text-slate-805">Prise en charge du passager</h4>
                      <p className="text-[10px] text-slate-450">Embarquement sécurisé à l'Avenue {pickupRoad}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs relative">
                    <span className={`absolute left-[-17.5px] h-3.5 w-3.5 rounded-full border border-white flex items-center justify-center ${rideStatus === "completed" ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                    <div>
                      <h4 className="font-bold text-slate-805">Arrivée estimée</h4>
                      <p className="text-[10px] text-slate-450">Trajet par {dropoffRoad}</p>
                    </div>
                  </div>
                </div>

                {/* CANCEL AND IMMEDIATE REFUND TRIGGER BUTTON ACCORDING TO REQ #2 */}
                {(rideStatus === "searching" || rideStatus === "accepted") && (
                  <div id="reparo-escrow-safe-refund-block" className="pt-2.5 border-t border-slate-100 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        id="passenger-cancel-reason"
                        className="bg-slate-50 border border-slate-205 text-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-red-500"
                      >
                        <option value="absence_motard">Chauffeur absent / Aucun motard disponible</option>
                        <option value="chauffeur_lent">Le motard n'avance plus (temps d'attente trop long)</option>
                        <option value="metyo_mauvaise">Pluie diluvienne ou mauvaise météo</option>
                        <option value="autre_motif">Autre raison légitime d'annulation</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          const selectEl = document.getElementById("passenger-cancel-reason") as HTMLSelectElement;
                          const cancelReason = selectEl ? selectEl.options[selectEl.selectedIndex].text : "Absence de motard";

                          const savedRideStr = localStorage.getItem("gomoto_active_ride");
                          if (savedRideStr) {
                            const savedRide = JSON.parse(savedRideStr);
                            const currencyUsed = savedRide.paymentUsed || "CDF";
                            const refundAmount = currencyUsed === "CDF" ? savedRide.priceCDF : savedRide.priceUSD;

                            let newBalanceCDF = profile.walletBalanceCDF;
                            let newBalanceUSD = profile.walletBalanceUSD;

                            if (currencyUsed === "CDF") {
                              newBalanceCDF += refundAmount;
                            } else {
                              newBalanceUSD += refundAmount;
                            }

                            // Refund transac
                            const refundTx: WalletTransaction = {
                              id: "tx-back-reparo-" + Math.random().toString(36).substr(2, 6),
                              userId: profile.id,
                              amount: refundAmount,
                              currency: currencyUsed,
                              type: "deposit",
                              method: "Wallet_System",
                              status: "completed",
                              date: new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }),
                              rideDetails: {
                                pickup: `${pickupRoad}, C/${profile.address.commune}`,
                                dropoff: `${dropoffRoad}, C/${profile.address.commune}`,
                                driverName: "GoMoto RDC (Arbitrage REPARO)",
                                distanceKm: distanceKm
                              }
                            };

                            const updatedTxs = transactions.map(t => {
                              if (t.type === "ride_payment" && t.status === "pending") {
                                return { ...t, status: "failed" as const };
                              }
                              return t;
                            });

                            const finalizedTxs = [refundTx, ...updatedTxs];
                            setTransactions(finalizedTxs);
                            localStorage.setItem(`gomoto_transactions_${profile.id}`, JSON.stringify(finalizedTxs));

                            const usersStr = localStorage.getItem("gomoto_users");
                            if (usersStr) {
                              const uDb = JSON.parse(usersStr);
                              const updatedDb = uDb.map((u: any) => {
                                if (u.id === profile.id) {
                                  return {
                                    ...u,
                                    walletBalanceCDF: newBalanceCDF,
                                    walletBalanceUSD: parseFloat(newBalanceUSD.toFixed(2))
                                  };
                                }
                                return u;
                              });
                              localStorage.setItem("gomoto_users", JSON.stringify(updatedDb));
                            }

                            onUpdateProfile({
                              ...profile,
                              walletBalanceCDF: newBalanceCDF,
                              walletBalanceUSD: parseFloat(newBalanceUSD.toFixed(2))
                            });

                            // Set active ride cancelled in storage so driver discovers it
                            const canceledRide = { ...savedRide, status: "cancelled" };
                            localStorage.setItem("gomoto_active_ride", JSON.stringify(canceledRide));
                          }

                          setRideStatus("idle");
                          setCurrentRideId(null);
                          setAssignedDriver(null);
                          localStorage.removeItem("gomoto_active_ride_messages");

                          alert(`Course annulée avec recours ! Motif : "${cancelReason}".\nLe greffe d'arbitrage REPARO a immédiatement recrédité ${prices.cdf.toLocaleString()} CDF (${prices.usd} USD) sur votre portefeuille.`);
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs cursor-pointer transition-all border border-red-500 shadow-sm flex items-center justify-center gap-1.5"
                      >
                        Annuler la course (Rembourser 100%)
                      </button>
                    </div>
                  </div>
                )}

                {/* RATING PANEL ON COMPLETED */}
                {rideStatus === "completed" && (
                  <div id="ride-feedback-panel" className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-center">
                    <div className="h-10 w-10 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                      ✓
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">Arrivé à bon port ! Merci d'avoir voyagé avec GoMoto.</h4>
                    <p className="text-[10.5px] text-slate-600 max-w-md mx-auto">
                      Votre paiement garanti en **REPARO** a été libéré et distribué avec succès. Veuillez attribuer une note à votre chauffeur pour finaliser le trajet :
                    </p>
                    
                    <div className="flex items-center justify-center gap-2 py-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setActiveRideRating(s)}
                          className={`p-1 hover:scale-110 active:scale-95 transition-all text-yellow-500 cursor-pointer`}
                        >
                          <Star className={`w-6 h-6 ${activeRideRating >= s ? "fill-yellow-500 text-yellow-500" : "text-slate-300"}`} />
                        </button>
                      ))}
                    </div>

                    <div className="max-w-md mx-auto space-y-1 text-left pb-3">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1 font-bold">
                        Votre Commentaire (Optionnel)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Trajet impeccable, conduite très prudente..."
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        className="w-full bg-white border border-slate-250 text-slate-800 rounded-xl px-3 py-2 text-xs focus:border-blue-600 outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleFinishRating}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-10 rounded-xl text-xs transition-all cursor-pointer shadow-sm"
                    >
                      Soumettre la Note
                    </button>
                  </div>
                )}
              </div>
            )}

            {rideSuccessMessage && (
              <div id="ride-complete-banner" className="bg-emerald-50 border border-emerald-150 p-4 rounded-2xl flex items-center gap-3 text-xs text-emerald-800">
                <ThumbsUp className="w-5 h-5 text-emerald-650" />
                <span>Merci ! Votre note a été prise en compte. Votre historique de courses a été mis à jour de manière sécurisée.</span>
              </div>
            )}

            {/* Floating Emergency SOS Native Dialer Activator */}
            <EmergencySOS idPrefix="client-ride-sos" userProfile={profile} onTriggerSOS={onTriggerSOS} />

          </div>
        )}

        {/* ================= TABS VIEW 2: PORTFOLIO / WALLET SYSTEM ================= */}
        {activeTab === "wallet" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Gestion des Fonds & Paiement Mobile</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Compatible avec tous les opérateurs mobiles en RDC</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRechargeModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Recharger Mon Compte</span>
              </button>
            </div>

            {/* Balances Display Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 text-[50px] font-mono font-black text-slate-200/50 pointer-events-none">
                CDF
              </div>

              <div className="space-y-1 z-10">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-bold">Solde Principal (CDF)</span>
                <span className="text-2xl font-mono font-bold text-emerald-700 block">{profile.walletBalanceCDF.toLocaleString("fr-FR")} CDF</span>
                <span className="text-[10px] text-slate-400 block font-medium">Dernier versement via M-Pesa</span>
              </div>

              <div className="space-y-1 z-10 border-t md:border-t-0 md:border-l border-slate-200 md:pl-6 pt-4 md:pt-0">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-bold">Solde USD (Équivalent)</span>
                <span className="text-2xl font-mono font-bold text-blue-700 block">${profile.walletBalanceUSD.toFixed(2)} USD</span>
                <span className="text-[10px] text-slate-400 block font-medium">Taux moyen du marché : 2 800 CDF/USD</span>
              </div>
            </div>

            {/* Offline IndexedDB Cache Status Alert Badge for Wallet */}
            <div id="wallet-cache-status-badge" className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl flex flex-col sm:flex-row gap-3.5 items-center justify-between text-[10.5px] text-emerald-800 leading-normal animate-fade-in shadow-xs">
              <div className="flex items-center gap-2.5 text-left">
                <Database className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-sans">
                  <b>Résilience Réseau RDC :</b> Votre solde est sauvegardé en continu dans votre cache <b>IndexedDB GoMotoRDC_OfflineStorage</b> local. Vous pouvez le consulter même sans connexion internet GSM.
                </span>
              </div>
              {lastCacheSyncString && (
                <span className="text-[8.5px] font-mono font-bold bg-emerald-100 text-emerald-900 px-2 py-1 rounded-xl block shrink-0">
                  Sync: {lastCacheSyncString}
                </span>
              )}
            </div>

            {/* Operators showcase */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Opérateurs Partenaires RDC</h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-orange-50 border border-orange-105 p-3 rounded-xl">
                  <span className="font-bold text-orange-600 block">M-PESA</span>
                  <span className="text-[9px] text-slate-500 block">Vodacom Congo</span>
                </div>
                <div className="bg-amber-50 border border-amber-105 p-3 rounded-xl">
                  <span className="font-bold text-amber-700 block">ORANGE MONEY</span>
                  <span className="text-[9px] text-slate-500 block">Orange RDC</span>
                </div>
                <div className="bg-red-50 border border-red-105 p-3 rounded-xl">
                  <span className="font-bold text-red-600 block">AIRTEL MONEY</span>
                  <span className="text-[9px] text-slate-500 block">Airtel Congo</span>
                </div>
              </div>
            </div>

            {/* ================= INTERACTIVE REFERRAL SYSTEM (SYSTEME DE PARRAINAGE) ================= */}
            <div className="bg-gradient-to-br from-amber-50/70 to-indigo-50/40 border-2 border-amber-200/60 rounded-2xl p-5 space-y-4 text-left">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <h3 className="font-black text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                    <Gift className="w-4 h-4 text-amber-500 animate-bounce" />
                    <span>Programme National de Parrainage</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-normal">Invitez vos amis motards ou clients et gagnez des bonus collectifs !</p>
                </div>
                <div className="bg-amber-500/10 text-amber-800 border border-amber-500/20 text-[9px] font-black uppercase px-2.5 py-1 rounded-lg">
                  Bonus : 15 000 CDF / $5.00
                </div>
              </div>

              {/* Stats & Code Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pb-3 border-b border-amber-200/50">
                {/* Promo Code Box */}
                <div className="md:col-span-6 bg-white border border-slate-205 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-1">Votre Code de Parrainage</span>
                  <div className="flex gap-1.5 items-center bg-slate-50 p-2 rounded-lg border border-slate-200 justify-between">
                    <span className="font-mono text-xs font-black text-slate-800 select-all">
                      {profile.myReferralCode || "GOMOTO-CLIENT-501"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const code = profile.myReferralCode || "GOMOTO-CLIENT-501";
                        navigator.clipboard.writeText(code);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2 py-1 text-[9px] rounded-md transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{isCopied ? "Copié !" : "Copier"}</span>
                    </button>
                  </div>
                </div>

                {/* Counter Stats & Sum */}
                <div className="md:col-span-6 grid grid-cols-2 gap-2">
                  <div className="bg-white border border-slate-205 rounded-xl p-3 text-center flex flex-col justify-center">
                    <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest block">Parrainés</span>
                    <span className="text-xl font-mono font-black text-indigo-700 block mt-0.5">{profile.referralCount || 0}</span>
                  </div>
                  <div className="bg-white border border-slate-205 rounded-xl p-3 text-center flex flex-col justify-center">
                    <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest block">Total Gagné</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 block mt-0.5">
                      {((profile.referralCount || 0) * 15000).toLocaleString()} CDF
                    </span>
                    <span className="text-[9px] font-mono font-bold text-blue-600 block">
                      +${((profile.referralCount || 0) * 5).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Transactions Table module */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Historique des Mouvements de Portefeuille</span>
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportWalletCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-sm hover:shadow"
                  >
                    <Download className="w-3 h-3" /> EXPORT CSV
                  </button>
                  <button
                    type="button"
                    onClick={handleExportWalletPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[9px] font-bold text-blue-700 hover:text-blue-800 transition-all cursor-pointer shadow-sm hover:shadow"
                  >
                    <Download className="w-3 h-3" /> EXPORT PDF
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <div key={tx.id} className="p-3 bg-white flex justify-between items-center text-xs hover:bg-slate-50 transition-all font-medium text-slate-800 font-sans">
                        <div className="flex items-center gap-3">
                          <span className={`h-2.5 w-2.5 rounded-full ${tx.type === 'deposit' ? 'bg-emerald-500' : 'bg-blue-600'}`}></span>
                          <div>
                            <span className="font-bold text-slate-800">
                              {tx.type === "deposit" ? "Rechargement direct" : "Paiement Course"}
                            </span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">{tx.date} • via {tx.method}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {tx.type === "ride_payment" && (
                            <button
                              type="button"
                              onClick={() => handleDownloadInvoice(tx)}
                              className="bg-slate-100 hover:bg-blue-50 text-slate-750 hover:text-blue-600 font-bold px-2.5 py-1.5 rounded-lg text-[9px] transition-all flex items-center gap-1 cursor-pointer border border-slate-200 hover:border-blue-200 shadow-sm"
                              title="Télécharger la Facture PDF"
                            >
                              <Download className="w-3 h-3 flex-shrink-0" />
                              <span>Facture PDF</span>
                            </button>
                          )}
                          <div className="text-right">
                            <span className={`font-mono font-bold ${tx.type === 'deposit' ? 'text-emerald-700' : 'text-slate-600'}`}>
                              {tx.type === "deposit" ? "+" : "-"}
                              {tx.amount.toLocaleString()} {tx.currency}
                            </span>
                            <span className="text-[8px] block text-slate-450 uppercase font-bold tracking-widest mt-0.5">Approuvé</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-center text-[10px] text-slate-400 bg-white">Aucune transaction enregistrée.</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================= TABS VIEW: COMPLETED RIDE HISTORY (HISTORIQUE DES COURSES) ================= */}
        {activeTab === "history" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Historique des trajets GoMoto</span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Consultez et vérifiez vos déplacements passés, tarifs et itinéraires certifiés GPS.</p>
              </div>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-black uppercase px-2.5 py-1 rounded-xl">
                {completedRides.length} {completedRides.length > 1 ? "Courses" : "Course"}
              </span>
            </div>

            {/* Offline Cache Status Alert Badge for History */}
            <div id="history-cache-status-badge" className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl flex flex-col sm:flex-row gap-3.5 items-center justify-between text-[10.5px] text-emerald-800 leading-normal animate-fade-in shadow-xs">
              <div className="flex items-center gap-2.5 text-left">
                <Database className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-sans">
                  <b>Données Archivées Hors-ligne :</b> Historique des trajets extrait en direct de la base de données locale sécurisée <b>IndexedDB</b>. Consultable sans aucune couverture réseau.
                </span>
              </div>
              {lastCacheSyncString && (
                <span className="text-[8.5px] font-mono font-bold bg-emerald-100 text-emerald-950 px-2 py-1 rounded-xl block shrink-0">
                  Sync : {lastCacheSyncString}
                </span>
              )}
            </div>

            {(() => {
              const filteredRides = completedRides.filter(ride => {
                const query = historySearchQuery.toLowerCase().trim();
                let matchesQuery = true;
                if (query) {
                  const driverMatch = (ride.driverName || "").toLowerCase().includes(query);
                  const idMatch = ride.id.toLowerCase().includes(query);
                  const dateMatch = (ride.timestamp || "").toLowerCase().includes(query);
                  const pickupMatch = `${ride.pickupAddress.avenue} ${ride.pickupAddress.commune} ${ride.pickupAddress.quartier}`.toLowerCase().includes(query);
                  const dropoffMatch = `${ride.dropoffAddress.avenue} ${ride.dropoffAddress.commune} ${ride.dropoffAddress.quartier}`.toLowerCase().includes(query);
                  matchesQuery = driverMatch || idMatch || dateMatch || pickupMatch || dropoffMatch;
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
                  <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl">
                    <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs text-slate-500 font-medium">Vous n'avez effectué aucune course pour le moment.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Vos futurs trajets s'afficheront ici en temps réel après leur finalisation.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {/* Search and Filters Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-150 text-left">
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">Chercher une course</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Chauffeur, Commune, ID, Date..."
                          value={historySearchQuery}
                          onChange={(e) => setHistorySearchQuery(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 placeholder-slate-400"
                        />
                        {historySearchQuery && (
                          <button
                            type="button"
                            onClick={() => setHistorySearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
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
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
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
                        <div className="text-center py-10 bg-white border border-slate-150 rounded-2xl p-4">
                          <p className="text-xs text-slate-500 font-medium">Aucune course trouvée.</p>
                          <p className="text-[10px] text-slate-400 mt-1">Ajustez vos filtres ou termes de recherche.</p>
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
                                  ? "bg-slate-50 border-blue-500 ring-1 ring-blue-500"
                                  : "bg-white border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex justify-between items-start w-full">
                                <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                                  {ride.id}
                                </span>
                                <span className="text-[9px] font-mono text-slate-500">
                                  {ride.timestamp}
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex gap-2 items-center text-xs font-semibold text-slate-850">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                                  <span className="truncate">{ride.pickupAddress.avenue}</span>
                                </div>
                                <div className="flex gap-2 items-center text-xs font-semibold text-slate-850">
                                  <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                                  <span className="truncate">{ride.dropoffAddress.avenue}</span>
                                </div>
                              </div>

                              <div className="flex justify-between items-center w-full pt-2 border-t border-slate-100 mt-1 text-[11px]">
                                <span className="text-slate-500 font-medium">{ride.driverName || "Chauffeur GoMoto"}</span>
                                <span className="font-mono font-extrabold text-blue-700">
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
                          <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-200 space-y-4">
                            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                              <div>
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Rapport de course</span>
                                <h4 className="text-xs font-black text-slate-800 uppercase mt-0.5 font-mono">{ride.id}</h4>
                              </div>
                              <div className="text-right">
                                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-extrabold px-2 py-1 rounded">
                                  COURSE EFFECTUÉE
                                </span>
                              </div>
                            </div>

                            {/* Start & End locations lists */}
                            <div className="space-y-3.5 bg-white p-4 rounded-xl border border-slate-150">
                              <div className="flex gap-3 text-xs">
                                <div className="flex flex-col items-center">
                                  <span className="h-3 w-3 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white ring-2 ring-emerald-100 flex-shrink-0" />
                                  <div className="w-0.5 h-8 bg-slate-200" />
                                  <span className="h-3 w-3 rounded-full bg-blue-600 flex items-center justify-center border-2 border-white ring-2 ring-blue-100 flex-shrink-0" />
                                </div>
                                <div className="space-y-4 flex-1">
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Départ</span>
                                    <span className="font-bold text-slate-800 text-[11px]">
                                      {ride.pickupAddress.avenue}, Q.{ride.pickupAddress.quartier} ({ride.pickupAddress.commune})
                                    </span>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Destination</span>
                                    <span className="font-bold text-slate-800 text-[11px]">
                                      {ride.dropoffAddress.avenue}, Q.{ride.dropoffAddress.quartier} ({ride.dropoffAddress.commune})
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Static mapping system */}
                            <div className="relative h-44 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-inner">
                              {/* Grid road layout vector simulation lines */}
                              <svg className="absolute inset-0 w-full h-full text-slate-200" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                  <pattern id="grid-map-y" width="30" height="30" patternUnits="userSpaceOnUse">
                                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                                  </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid-map-y)" />
                                <line x1="0" y1="40" x2="100%" y2="40" stroke="#cbd5e1" strokeWidth="5" />
                                <line x1="0" y1="120" x2="100%" y2="120" stroke="#cbd5e1" strokeWidth="5" />
                                <line x1="80" y1="0" x2="80" y2="100%" stroke="#cbd5e1" strokeWidth="5" />
                                <line x1="220" y1="0" x2="220" y2="100%" stroke="#cbd5e1" strokeWidth="5" />
                                <path d="M 80 120 Q 150 80 220 40" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="6,4" />
                              </svg>

                              <div className="absolute bottom-[28px] left-[66px] flex flex-col items-center">
                                <span className="bg-emerald-600 text-white rounded-full p-1 text-[8.5px] font-black z-10 flex items-center justify-center shadow-lg w-5 h-5 leading-none">A</span>
                                <span className="bg-slate-900/90 text-white font-bold text-[7.5px] px-1 py-0.5 rounded border border-slate-800 whitespace-nowrap mt-1 font-sans">{ride.pickupAddress.commune}</span>
                              </div>

                              <div className="absolute top-[20px] left-[200px] flex flex-col items-center">
                                <span className="bg-blue-650 text-white rounded-full p-1 text-[8.5px] font-black z-10 flex items-center justify-center shadow-lg w-5 h-5 leading-none">B</span>
                                <span className="bg-slate-900/90 text-white font-bold text-[7.5px] px-1 py-0.5 rounded border border-slate-800 whitespace-nowrap mt-1 font-sans">{ride.dropoffAddress.commune}</span>
                              </div>

                              <div className="absolute top-2.5 right-2 text-right">
                                <span className="bg-slate-900/70 backdrop-blur-xs text-white font-mono text-[8px] px-1.5 py-0.5 rounded-lg border border-slate-700 font-bold block">
                                  COMMUNE: {ride.pickupAddress.commune} vers {ride.dropoffAddress.commune}
                                </span>
                              </div>

                              <div className="absolute bottom-2.5 right-2 text-right">
                                <span className="bg-slate-900 text-yellow-400 font-mono text-[8.5px] font-extrabold px-2 py-0.5 rounded-lg border border-slate-800 shadow-md">
                                  Distance: {ride.distanceKm} km
                                </span>
                              </div>
                            </div>

                            {/* Invoice & Driver details bento row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                              <div className="bg-white p-4 rounded-xl border border-slate-150 flex flex-col justify-between">
                                <div className="space-y-0.5 text-[10px]">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-sans">Chauffeur Assigné</span>
                                  <p className="font-extrabold text-slate-850 mt-1">{ride.driverName || "Ir. Héritier LUKUSA"}</p>
                                  <p className="text-slate-500 mt-0.5 font-mono">{ride.driverPhone || "+243 899 123 456"}</p>
                                </div>
                                <div className="mt-3 bg-slate-50 p-2 rounded-lg text-[9px] text-slate-500 font-medium leading-relaxed font-sans">
                                  Le motard a été authentifié via reconnaissance faciale avant de démarrer ce trajet.
                                </div>
                              </div>

                              <div className="bg-white p-4 rounded-xl border border-slate-150 text-xs flex flex-col justify-between">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2 font-sans">Facturation vérifiée</span>
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center text-slate-600 font-medium">
                                    <span>Prix de base :</span>
                                    <span className="font-mono">{ride.priceCDF.toLocaleString("fr-FR")} CDF</span>
                                  </div>
                                  <div className="flex justify-between items-center text-slate-600 font-medium">
                                    <span>Conversion USD :</span>
                                    <span className="font-mono">${ride.priceUSD.toFixed(2)} USD</span>
                                  </div>
                                  <div className="flex justify-between items-center font-extrabold text-slate-850 border-t border-slate-100 pt-1.5">
                                    <span>Total Payé :</span>
                                    <span className="font-mono text-emerald-700">{ride.priceCDF.toLocaleString("fr-FR")} CDF</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Download Receipts & Revenues Row */}
                            <div id={`history-ride-actions-row-${ride.id}`} className="bg-slate-50 border border-slate-200 p-4.5 rounded-2xl flex flex-col sm:flex-row gap-3.5 items-center justify-between text-left animate-fade-in shadow-sm">
                              <div className="space-y-0.5 max-w-md">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                  <span>Reçu de Ventilation des Revenus (Syndicat RDC)</span>
                                </span>
                                <span className="text-[10px] text-slate-500 block leading-relaxed font-sans">
                                  Télécharger le relevé de répartition GoMoto RDC avec répartition transparente : <b>70% Chauffeur</b> ({ride.driverName || "Héritier"}), <b>15% Propriétaire de Flotte</b> (Dieudonné) et <b>15% GoMoto</b>.
                                </span>
                              </div>
                              
                              <button
                                type="button"
                                id={`btn-download-revenue-receipt-${ride.id}`}
                                onClick={() => handleDownloadRevenueReceipt(ride)}
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11.5px] px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:translate-x-0.5 active:scale-95"
                              >
                                <Download className="w-3.5 h-3.5 text-white flex-shrink-0" />
                                <span>Télécharger le PDF</span>
                              </button>
                            </div>

                            {/* Dispute Center Box */}
                            <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4.5 space-y-3 text-left">
                              <div className="flex items-start gap-2.5">
                                <span className="text-base select-none mt-0.5">⚠️</span>
                                <div>
                                  <span className="font-extrabold text-red-950 text-xs block">Un problème avec ce trajet ?</span>
                                  <span className="text-[10px] text-red-805 block mt-1 leading-relaxed">
                                    Si cette course n'a pas été réellement effectuée ou si le motard GoMoto ne s'est jamais présenté, vous pouvez lancer immédiatement le protocole de conciliation d'État REPARO. L'arbitrage est instantané d'après la télémétrie GPS et déclenchera votre remboursement direct vers le portefeuille mobile (Wallet).
                                  </span>
                                </div>
                              </div>
                              
                              {ride.disputeStatus === "refunded" ? (
                                <div className="bg-emerald-100/95 text-emerald-800 border border-emerald-200 py-2 px-4 rounded-xl text-[10.5px] font-black text-center uppercase tracking-wider flex items-center justify-center gap-1.5 font-mono">
                                  ✓ Litige Réglé : Course entièrement remboursée sur votre Wallet !
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-2 pt-1 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setArbitrageRideId(ride.id);
                                      setArbitrageReason("course_non_effectuee");
                                      setArbitrageDetails(`Signalement d'absence de prise en charge pour la course ${ride.id} datant du ${ride.timestamp}.`);
                                      setActiveTab("disputes");
                                    }}
                                    className="bg-red-650 hover:bg-red-750 text-white font-extrabold text-[9.5px] tracking-wider uppercase py-2 px-3.5 rounded-lg border border-red-700 font-mono transition-all flex items-center gap-1 cursor-pointer hover:shadow-xs"
                                  >
                                    Signaler Non Effectuée & Rembourser via Wallet
                                  </button>
                                </div>
                              )}
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

        {/* ================= TABS VIEW 3: PROFILE / ACCOUNTS WITH LOCK STATE ================= */}
        {activeTab === "profile" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Gestion des Informations Personnelles</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Identifiants sécurisés bloqués après validation légale</p>
              </div>
              <span className="bg-amber-50 text-amber-705 border border-amber-200 px-3 py-1 rounded-xl font-bold flex items-center gap-1 text-[9px] uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" />
                <span>Données Verrouillées v1.0</span>
              </span>
            </div>

            {/* Info Lock warning */}
            <div className="bg-amber-50 border border-amber-105 p-4 rounded-2xl text-[11px] text-slate-700 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-805 block">Directive d'Intégrité de la Plateforme :</span>
                <span className="text-slate-600 leading-relaxed block mt-0.5">
                  Pour des raisons impérieuses de sécurité civile et de responsabilité juridique en RDC, les champs Nom et Prénom sont gelés. Aucune mise à jour directe n'est permise. Si vous avez commis une erreur de saisie ou si vous changez légalement d'état civil, veuillez formuler un recours en modification ci-dessous pour notre panel administratif.
                </span>
              </div>
            </div>

            {/* Read-Only inputs with Padlock Icons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Prénom(s) (Lecture uniquement)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.firstName}
                    readOnly
                    className="w-full bg-slate-50 border border-slate-200 text-slate-600 rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none cursor-not-allowed select-none"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Nom de Famille (Lecture uniquement)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.lastName}
                    readOnly
                    className="w-full bg-slate-50 border border-slate-200 text-slate-600 rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none cursor-not-allowed select-none"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">E-mail Assigné</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.email}
                    readOnly
                    className="w-full bg-slate-50 border border-slate-200 text-slate-600 rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none cursor-not-allowed select-none"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Contact d'Urgence RDC</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.phone}
                    readOnly
                    className="w-full bg-slate-50 border border-slate-200 text-slate-600 rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none cursor-not-allowed select-none"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

            </div>

            {/* Address Information Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Adresse Géographique Enregistrée</span>
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Province</span>
                  <span className="font-bold text-slate-800 mt-1 block">{profile.address.province}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Ville / Territoire</span>
                  <span className="font-bold text-slate-800 mt-1 block">{profile.address.city}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Commune</span>
                  <span className="font-bold text-slate-800 mt-1 block">{profile.address.commune}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Quartier</span>
                  <span className="font-bold text-slate-800 mt-1 block">{profile.address.quartier}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Localité</span>
                  <span className="font-bold text-slate-800 mt-1 block">{profile.address.localite}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Avenue</span>
                  <span className="font-bold text-slate-800 mt-1 block">{profile.address.avenue}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Numéro</span>
                  <span className="font-bold text-slate-800 mt-1 block">{profile.address.number || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Préférences de Voyage / Course Client (Partagées automatiquement avec le motard) */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 text-left animate-fade-in shadow-sm">
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Préférences de Course (Partagées automatiquement)</span>
                </h4>
                <p className="text-[10px] text-slate-550 mt-1 leading-relaxed">
                  Ces critères seront transmis automatiquement au chauffeur lors de chaque réservation pour assurer votre confort et votre sécurité civile.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. Helmet Required */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm hover:border-slate-300 transition-all">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">Besoin d'un casque client</span>
                    <span className="text-[9.5px] text-slate-500 block leading-tight">Le motard apportera un casque de protection propre 🪖</span>
                  </div>
                  <button
                    type="button"
                    id="pref-toggle-helmet"
                    onClick={() => {
                      const val = !prefHelmet;
                      setPrefHelmet(val);
                      savePreferences(val, prefSafeDriving, prefSilentRide, prefBaggageCargo, prefCustomNote);
                    }}
                    className={`relative inline-flex h-5.5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      prefHelmet ? "bg-blue-600" : "bg-slate-250"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        prefHelmet ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Safe Driving Only */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm hover:border-slate-300 transition-all">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">Conduite prudente exigée</span>
                    <span className="text-[9.5px] text-slate-500 block leading-tight">Recommander une vitesse limitée et vigilante (max 45 km/h) 🛡️</span>
                  </div>
                  <button
                    type="button"
                    id="pref-toggle-safe"
                    onClick={() => {
                      const val = !prefSafeDriving;
                      setPrefSafeDriving(val);
                      savePreferences(prefHelmet, val, prefSilentRide, prefBaggageCargo, prefCustomNote);
                    }}
                    className={`relative inline-flex h-5.5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      prefSafeDriving ? "bg-blue-600" : "bg-slate-250"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        prefSafeDriving ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Silent Ride */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm hover:border-slate-300 transition-all">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">Course calme / silencieuse</span>
                    <span className="text-[9.5px] text-slate-500 block leading-tight">Privilégier un trajet concentré sans discussion inutile 🤫</span>
                  </div>
                  <button
                    type="button"
                    id="pref-toggle-silent"
                    onClick={() => {
                      const val = !prefSilentRide;
                      setPrefSilentRide(val);
                      savePreferences(prefHelmet, prefSafeDriving, val, prefBaggageCargo, prefCustomNote);
                    }}
                    className={`relative inline-flex h-5.5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      prefSilentRide ? "bg-blue-600" : "bg-slate-250"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        prefSilentRide ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 4. Extra Bagage / Cargo */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm hover:border-slate-300 transition-all">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">Besoin de porte-bagages libre</span>
                    <span className="text-[9.5px] text-slate-500 block leading-tight">Pour emporter des paquets légers ou sacs à dos du client 🎒</span>
                  </div>
                  <button
                    type="button"
                    id="pref-toggle-baggage"
                    onClick={() => {
                      const val = !prefBaggageCargo;
                      setPrefBaggageCargo(val);
                      savePreferences(prefHelmet, prefSafeDriving, prefSilentRide, val, prefCustomNote);
                    }}
                    className={`relative inline-flex h-5.5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      prefBaggageCargo ? "bg-blue-600" : "bg-slate-250"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        prefBaggageCargo ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Freeform Personalised Driver Note */}
              <div className="space-y-1.5 mt-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Note d'instruction textuelle permanente au motard</label>
                <textarea
                  value={prefCustomNote}
                  id="pref-text-note"
                  onChange={(e) => {
                    const val = e.target.value;
                    setPrefCustomNote(val);
                    savePreferences(prefHelmet, prefSafeDriving, prefSilentRide, prefBaggageCargo, val);
                  }}
                  placeholder="Ex: 'Passer par l'avenue de l'Équateur', 'Merci de rouler calmement sur les pavés', etc."
                  rows={2}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:border-blue-605 outline-none transition-all shadow-inner focus:ring-1 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Reviews received by this citizen passenger from motards */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 text-left">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span>Mes Évaluations de Citoyen Passager</span>
                </h4>
                <div className="bg-white border border-slate-200 px-3 py-1 rounded-xl font-bold font-mono text-[10px] text-slate-750 flex items-center gap-1">
                  <span>Moyenne :</span>
                  <span className="text-blue-600 font-extrabold">{profile.rating || 5.0} / 5</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {reviewsHistory.filter(r => r.toUserId === profile.id).length === 0 ? (
                  <p className="text-[10px] text-slate-400 bg-white p-4 rounded-xl border border-slate-100 text-center italic">
                    Aucune évaluation de chauffeur reçue pour le moment.
                  </p>
                ) : (
                  reviewsHistory.filter(r => r.toUserId === profile.id).map((rev) => (
                    <div key={rev.id} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-sm text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">{rev.fromUserName} <span className="font-normal text-slate-400 text-[10px]">(Chauffeur)</span></span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3 h-3 ${rev.rating >= s ? "fill-yellow-500 text-yellow-500" : "text-slate-200"}`} />
                          ))}
                        </div>
                      </div>
                      {rev.comment && <p className="text-slate-600 italic text-[11px]">"{rev.comment}"</p>}
                      <span className="text-[8px] font-mono text-slate-400 block mt-1">{rev.timestamp} • Certifié Securisé</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recours Submission area */}
            <div className="border-t border-slate-250 pt-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Introduire une Demande de Changement administrative</h4>
              <p className="text-[11px] text-slate-500">
                Vous avez besoin de modifier votre identité légale ? Complétez le dossier pour soumettre une demande formelle à l'administrateur.
              </p>

              {/* Show existing request status if pending */}
              {modRequests.filter(req => req.userId === profile.id).map((req, i) => (
                <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-750">Demande de correction d'identité</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Soumis le : {req.submittedAt}</span>
                    <span className="text-[10px] text-blue-650 block mt-1 font-bold">Noms requis : {req.requestedFirstName} {req.requestedLastName}</span>
                  </div>
                  <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded text-[10px] font-bold">
                    En attente de validation Admin
                  </span>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setShowModModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Rédiger une Demande de Recours</span>
              </button>
            </div>

          </div>
        )}

        {/* ================= TABS VIEW 4.25: GOOGLE CHAT SUPPORT CENTRAL ================= */}
        {activeTab === "chat" && (
          <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-xl animate-fade-in text-white">
            <ChatWorkspaceManager isEmbedded={true} />
          </div>
        )}

        {/* ================= TABS VIEW 4.5: PROMOTIONS & LOYALTY HUB ================= */}
        {activeTab === "promotions" && (
          <ClientPromotionHub
            lang={lang}
            userId={profile.id}
            completedRidesCount={profile.ridesCompleted || 0}
            onApplyPromo={(promo) => {
              setAppliedPromo(promo);
              if (promo) {
                alert(`Code promotionnel ${promo.code} appliqué avec succès ! La remise sera appliquée à votre prochaine commande.`);
              }
            }}
            appliedPromo={appliedPromo}
            activePickupCommune={selectedCommuneName}
            activeDropoffCommune={selectedCommuneName}
            currentEstimatedFareCDF={prices.cdf}
          />
        )}

        {/* ================= TABS VIEW 5: DISPUTE MANAGEMENT (GESTION DES LITIGES) ================= */}
        {activeTab === "disputes" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 text-slate-850">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-650 animate-bounce" />
                  <span>Tribunal d'Arbitrage et Recours GoMoto RDC</span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Signalez une course payée mais non effectuée pour déclencher un contrôle automatique de géolocalisation et un remboursement immédiat.
                </p>
              </div>
              <span className="bg-red-50 text-red-700 border border-red-200 text-[9px] font-black uppercase px-2.5 py-1 rounded-xl font-mono">
                REPARO SECURE
              </span>
            </div>

            {/* Arbitration Stats Dashboard row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Plaintes Déposées</span>
                <span className="text-xl font-black text-slate-800 mt-1 font-mono">{disputes.length}</span>
                <span className="text-[9px] text-slate-500 mt-1">Requêtes d'arbitrage enregistrées</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider font-mono">Fonds Récupérés</span>
                <div className="flex flex-col mt-1">
                  <span className="text-sm font-black text-emerald-800 font-mono">
                    {disputes
                      .filter(d => d.status === "approved" && d.currency === "CDF")
                      .reduce((sum, d) => sum + d.amount, 0)
                      .toLocaleString("fr-FR")} CDF
                  </span>
                  <span className="text-sm font-black text-emerald-800 font-mono">
                    ${disputes
                      .filter(d => d.status === "approved" && d.currency === "USD")
                      .reduce((sum, d) => sum + d.amount, 0)
                      .toFixed(2)} USD
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider font-mono font-sans">Délai d'arbitrage</span>
                <span className="text-sm font-black text-blue-800 mt-1 uppercase flex items-center gap-1">
                  ⚡ INSTANTANÉ
                </span>
                <span className="text-[9px] text-blue-700 mt-1">Remboursement cryptographique d'État</span>
              </div>
            </div>

            {/* Main grid section: New dispute form + History of disputes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* Form card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm text-left">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <FileText className="w-3.5 h-3.5 text-blue-605" />
                  <span>Introduire une demande d'arbitrage</span>
                </h4>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Sélectionner la course contestée</label>
                    <select
                      value={arbitrageRideId}
                      onChange={(e) => {
                        const rId = e.target.value;
                        setArbitrageRideId(rId);
                        const matched = completedRides.find(r => r.id === rId);
                        if (matched) {
                          setArbitrageRefundCurrency(profile.walletBalanceUSD < 1 ? "CDF" : "USD");
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                    >
                      <option value="">-- Choisir une course passée --</option>
                      {completedRides
                        .filter(r => r.disputeStatus !== "refunded")
                        .map((ride) => (
                          <option key={ride.id} value={ride.id}>
                            [{ride.id}] {ride.timestamp} - {ride.pickupAddress.avenue} ({ride.priceCDF.toLocaleString("fr-FR")} CDF)
                          </option>
                        ))
                      }
                      {completedRides.filter(r => r.disputeStatus !== "refunded").length === 0 && (
                        <option value="" disabled>Aucune course éligible pour arbitrage</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Motif formel du litige</label>
                    <select
                      value={arbitrageReason}
                      onChange={(e) => setArbitrageReason(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
                    >
                      <option value="course_non_effectuee">Course non effectuée - Chauffeur absent / non venu</option>
                      <option value="depart_force">Course complétée sans prise en charge (démarrage forcé)</option>
                      <option value="surfacturation">Tarification abusive ou non conforme au GPS</option>
                      <option value="erreur_identite">Chauffeur / véhicule non conforme au selfie</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Précisions contractuelles (optionnel)</label>
                    <textarea
                      value={arbitrageDetails}
                      onChange={(e) => setArbitrageDetails(e.target.value)}
                      placeholder="Ex: Le motards Héritier ne s'est jamais arrêté au Rond-Point Victoire, j'ai attendu 15 minutes..."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-850 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Devise de remboursement préférée</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setArbitrageRefundCurrency("CDF")}
                        className={`py-2 px-3 rounded-xl border text-[11px] font-bold font-mono transition-all cursor-pointer flex justify-between items-center ${
                          arbitrageRefundCurrency === "CDF" 
                            ? "bg-emerald-50 border-emerald-500 text-emerald-850 ring-1 ring-emerald-500 font-extrabold" 
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-350"
                        }`}
                      >
                        <span>CDF (Franc Congolais)</span>
                        <span className="font-extrabold text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">CDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setArbitrageRefundCurrency("USD")}
                        className={`py-2 px-3 rounded-xl border text-[11px] font-bold font-mono transition-all cursor-pointer flex justify-between items-center ${
                          arbitrageRefundCurrency === "USD" 
                            ? "bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500 font-extrabold" 
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-350"
                        }`}
                      >
                        <span>USD (Dollar US)</span>
                        <span className="font-extrabold text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">USD</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!arbitrageRideId) {
                        alert("Veuillez sélectionner une course contestée.");
                        return;
                      }

                      const selectedRide = completedRides.find(r => r.id === arbitrageRideId);
                      if (!selectedRide) {
                        alert("La course sélectionnée est invalide.");
                        return;
                      }

                      const refundAmt = arbitrageRefundCurrency === "CDF" ? selectedRide.priceCDF : selectedRide.priceUSD;
                      
                      let newBalanceCDF = profile.walletBalanceCDF;
                      let newBalanceUSD = profile.walletBalanceUSD;

                      if (arbitrageRefundCurrency === "CDF") {
                        newBalanceCDF += refundAmt;
                      } else {
                        newBalanceUSD += refundAmt;
                      }

                      const dispId = "DISP-" + Math.random().toString(36).substr(2, 6).toUpperCase();
                      const reasonsMap: Record<string, string> = {
                        "course_non_effectuee": "Chauffeur absent",
                        "depart_force": "Départ forcé sans client",
                        "surfacturation": "Tarification abusive GPS",
                        "erreur_identite": "Chauffeur non conforme"
                      };

                      const newDisp: DisputeRecord = {
                        id: dispId,
                        rideId: selectedRide.id,
                        amount: refundAmt,
                        currency: arbitrageRefundCurrency,
                        reason: reasonsMap[arbitrageReason] || arbitrageReason,
                        details: arbitrageDetails || "Dépôt de plainte formelle via mobile",
                        status: "approved",
                        date: new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }),
                        pickup: selectedRide.pickupAddress.avenue,
                        dropoff: selectedRide.dropoffAddress.avenue,
                        driverName: selectedRide.driverName
                      };

                      const updatedDisputes = [newDisp, ...disputes];
                      setDisputes(updatedDisputes);
                      localStorage.setItem(`gomoto_disputes_${profile.id}`, JSON.stringify(updatedDisputes));

                      const updatedRidesHistory = completedRides.map(r => {
                        if (r.id === selectedRide.id) {
                          return { ...r, disputeStatus: "refunded" as const };
                        }
                        return r;
                      });
                      setCompletedRides(updatedRidesHistory);
                      localStorage.setItem(`gomoto_rides_history_${profile.id}`, JSON.stringify(updatedRidesHistory));

                      const refundTx: WalletTransaction = {
                        id: "tx-refund-litige-" + Math.random().toString(36).substr(2, 6),
                        userId: profile.id,
                        amount: refundAmt,
                        currency: arbitrageRefundCurrency,
                        type: "deposit",
                        method: "Wallet_System",
                        status: "completed",
                        date: new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }),
                        rideDetails: {
                          pickup: selectedRide.pickupAddress.avenue,
                          dropoff: selectedRide.dropoffAddress.avenue,
                          driverName: `Remboursement Tribunal GoMoto (Course non effectuée: ${selectedRide.id})`,
                          distanceKm: selectedRide.distanceKm
                        }
                      };

                      const newTxsList = [refundTx, ...transactions];
                      setTransactions(newTxsList);
                      localStorage.setItem(`gomoto_transactions_${profile.id}`, JSON.stringify(newTxsList));

                      const updatedProfile = {
                        ...profile,
                        walletBalanceCDF: newBalanceCDF,
                        walletBalanceUSD: parseFloat(newBalanceUSD.toFixed(2))
                      };
                      onUpdateProfile(updatedProfile);

                      const usersStr = localStorage.getItem("gomoto_users");
                      if (usersStr) {
                        const parsedUsers: UserProfile[] = JSON.parse(usersStr);
                        const updatedUsersList = parsedUsers.map(u => {
                          if (u.id === profile.id) {
                            return {
                              ...u,
                              walletBalanceCDF: newBalanceCDF,
                              walletBalanceUSD: parseFloat(newBalanceUSD.toFixed(2))
                            };
                          }
                          return u;
                        });
                        localStorage.setItem("gomoto_users", JSON.stringify(updatedUsersList));
                      }

                      setArbitrageRideId("");
                      setArbitrageDetails("");

                      showToast(
                        "warning",
                        "Arbitrage clos & Remboursé !",
                        `Le dossier n° ${dispId} a été clos d'État : ${refundAmt.toLocaleString()} ${arbitrageRefundCurrency} recrédités instantanément.`
                      );
                      
                      alert(`✓ ARBITRAGE APPROUVÉ\n\nRecours n° ${dispId} résolu :\n- Montant remboursé : ${refundAmt.toLocaleString()} ${arbitrageRefundCurrency}\n- Crédité instantanément au Wallet !\n- Course n° ${selectedRide.id} marquée comme contestée & remboursée.`);
                    }}
                    className="w-full bg-red-600 hover:bg-red-750 text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-red-700"
                  >
                    <AlertTriangle className="w-4 h-4 text-white" />
                    <span>Lancer le Recours & RemBOURSER</span>
                  </button>
                </div>
              </div>

              {/* Disputes List card */}
              <div className="bg-slate-50 border border-slate-205 rounded-2xl p-5 space-y-4 shadow-inner text-left max-h-[500px] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-[10px] font-bold text-slate-450 uppercase font-mono">Dossiers d'Arbitrage Clôturés</span>
                  <span className="text-[9px] font-black uppercase text-indigo-750 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded">
                    Protocole REPARO : Actif
                  </span>
                </div>

                {disputes.length > 0 ? (
                  <div className="space-y-3">
                    {disputes.map((disp) => (
                      <div key={disp.id} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded text-[10px]">
                            {disp.id}
                          </span>
                          <span className="text-[9px] font-bold font-mono text-emerald-800 bg-emerald-50 border border-emerald-150 rounded px-2 py-0.5 uppercase">
                            ANNULÉ & REMBOURSÉ
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-slate-800 font-bold block">Motif : {disp.reason}</p>
                          <p className="text-[10.5px] text-slate-600 mt-1 italic leading-relaxed">
                            "{disp.details}"
                          </p>
                          <p className="text-[10px] text-slate-450 font-mono mt-0.5">
                            Course affiliée : {disp.rideId} • Date contestation : {disp.date}
                          </p>
                        </div>

                        <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[10px] mt-1.5 font-mono">
                          <span className="text-slate-500 text-[9px]">Chauffeur : {disp.driverName || "Non spécifié"}</span>
                          <span className="font-mono font-black text-emerald-750 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                            +{disp.amount.toLocaleString("fr-FR")} {disp.currency}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 space-y-2">
                    <span className="text-3xl text-slate-350 block leading-none">⚖️</span>
                    <h5 className="font-bold text-xs text-slate-700">Aucun litige soumis d'État</h5>
                    <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                      Aucune course n'a fait l'objet d'un litige. Vos trajets GoMoto RDC s'opèrent avec transparence sous garantie REPARO.
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Educational block about REPARO */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex gap-3 text-xs text-slate-755 leading-relaxed text-left">
              <span className="text-sm">ℹ️</span>
              <div>
                <span className="font-extrabold text-slate-950 block">Règles d'arbitrage de l'État de GoMoto :</span>
                Chaque trajet est doté d'un contrat d'arbitrage en cascade (REPARO) qui protège les fonds. Si le motard valide une course sans véritablement se déplacer (contrôles constants de coordonnées GPS d'État), le client est légalement en droit d'exiger son remboursement intégral et immédiat sans avoir besoin de passer par un intermédiaire physique.
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ================= MODIFICATION REQUEST MODAL ================= */}
      {showModModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl relative text-slate-800">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-600" />
              <span>Dossier de Recours civil : Identité / Pièces</span>
            </h3>

            <form onSubmit={handleSendModificationRequest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nouveau Prénom souhaité</label>
                  <input
                    type="text"
                    placeholder="Ex: Patient"
                    value={reqFirstName}
                    onChange={(e) => setReqFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-600 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nouveau Nom souhaité</label>
                  <input
                    type="text"
                    placeholder="Ex: MBUYI"
                    value={reqLastName}
                    onChange={(e) => setReqLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-600 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Document Modification Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2 pt-2 border-t border-slate-100">
                <div className="md:col-span-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  🔑 Pièces administratives à re-soumettre (facultatif)
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Type de Document</label>
                  <select
                    value={reqDocType}
                    onChange={(e) => setReqDocType(e.target.value as DocumentType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-600 font-bold"
                  >
                    <option value="carte_identite_nationale">Carte d'Identité Nationale</option>
                    <option value="passeport">Passeport</option>
                    <option value="permis_de_conduire">Permis de Conduire</option>
                    <option value="document_etranger">Document Étranger</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Numéro du Document</label>
                  <input
                    type="text"
                    placeholder="Ex: CD-ID-8849-B"
                    value={reqDocNumber}
                    onChange={(e) => setReqDocNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-600 font-mono font-bold"
                  />
                </div>

                {/* Doc photo front */}
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Photo Recto du document</span>
                  <div className="border border-dashed border-slate-200 bg-slate-50 rounded-xl p-2.5 text-center relative flex flex-col items-center justify-center min-h-[70px]">
                    {reqDocPhotoFront ? (
                      <div className="relative">
                        <img src={reqDocPhotoFront} className="h-10 object-contain rounded" />
                        <button type="button" onClick={() => setReqDocPhotoFront("")} className="absolute -top-1.5 -right-1.5 bg-red-100 text-red-700 rounded-full p-0.5 text-[8px] font-bold">✕</button>
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
                        <span className="text-[10px] font-bold text-blue-600">Choisir Recto</span>
                        <span className="text-[8px] text-slate-400">PNG/JPG max 5MB</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Doc photo back */}
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Photo Verso du document</span>
                  <div className="border border-dashed border-slate-200 bg-slate-50 rounded-xl p-2.5 text-center relative flex flex-col items-center justify-center min-h-[70px]">
                    {reqDocPhotoBack ? (
                      <div className="relative">
                        <img src={reqDocPhotoBack} className="h-10 object-contain rounded" />
                        <button type="button" onClick={() => setReqDocPhotoBack("")} className="absolute -top-1.5 -right-1.5 bg-red-100 text-red-700 rounded-full p-0.5 text-[8px] font-bold">✕</button>
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
                        <span className="text-[10px] font-bold text-blue-600">Choisir Verso</span>
                        <span className="text-[8px] text-slate-400">PNG/JPG max 5MB</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Motif légitime du changement</label>
                <textarea
                  rows={2}
                  placeholder="Justification officielle (Ex: Correction d'une faute d'orthographe sur ma carte de citoyen...)"
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-600 leading-relaxed"
                  required
                ></textarea>
              </div>

              <div id="recharge-disclaimer-card" className="bg-amber-50 border border-amber-105 p-3 rounded-lg text-[9.5px] text-slate-600">
                <span className="font-bold text-amber-805 block">Vérification de Pièce requise :</span>
                Vous devrez présenter votre pièce d'identité physique lors du contrôle administratif si la demande de recours est accordée.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all shadow-sm"
                >
                  Soumettre Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ALERTE INTELLIGENCE CYBERSÉCURITÉ GOMOTO (SCREEN OVERLAY) ================= */}
      {blockedAttack && (
        <div id="security-threat-blocked-overlay" className="fixed inset-0 bg-red-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-950 border-2 border-red-650 rounded-3xl p-6.5 max-w-lg w-full space-y-5 shadow-2xl relative text-white font-sans text-left">
            <div className="flex items-center gap-3.5 border-b border-red-500/20 pb-4">
              <ShieldAlert className="w-10 h-10 text-red-500 animate-bounce flex-shrink-0" />
              <div>
                <h3 className="text-base font-black text-red-505 uppercase tracking-widest leading-tight">ALERTE CYBERSÉCURITÉ GOMOTO RDC</h3>
                <p className="text-[9px] text-red-400 uppercase font-bold tracking-wider mt-0.5">Bouclier WAF actif • Tentative d'Intrusion Neutralisée</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-350">
              <p className="leading-relaxed bg-red-950/20 p-3.5 rounded-xl border border-red-500/10 text-[10.5px]">
                Le Pare-feu Applicatif GoMoto (WAF) a intercepté et bloqué une charge utile suspecte transmise par votre session. Pour des raisons d'intégrité, la requête a été entièrement neutralisée et enregistrée dans le registre d'audit.
              </p>

              <div className="grid grid-cols-2 gap-3 font-mono text-[10.5px] bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="block text-slate-500 text-[8.5px] uppercase font-bold tracking-widest">Type d'Attaque :</span>
                  <span className="text-red-400 font-bold block mt-0.5">{blockedAttack.threatType}</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-[8.5px] uppercase font-bold tracking-widest">Facteur de Risque :</span>
                  <span className="text-red-500 font-black block mt-0.5">{blockedAttack.riskScore}</span>
                </div>
                <div className="col-span-2 border-t border-slate-850 pt-2.5 mt-1">
                  <span className="block text-slate-500 text-[8.5px] uppercase font-bold tracking-widest">Payload Intercepté :</span>
                  <span className="bg-slate-950 px-2 py-1 rounded text-red-400 select-all block break-all font-bold mt-1 text-[9.5px]">
                    {blockedAttack.rawInput}
                  </span>
                </div>
                <div className="col-span-2 border-t border-slate-850 pt-2.5 mt-1">
                  <span className="block text-slate-500 text-[8.5px] uppercase font-bold tracking-widest">Analyse Heuristique :</span>
                  <span className="text-slate-300 block mt-1 leading-relaxed text-[10px] font-sans">{blockedAttack.details}</span>
                </div>
                <div className="col-span-2 border-t border-slate-850 pt-2.5 mt-1 flex justify-between text-[9px] text-slate-500">
                  <span>IP BLOQUÉE: {blockedAttack.sourceIp}</span>
                  <span>STATUT: PAYLOAD REJETÉ ✓</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setBlockedAttack(null)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 rounded-xl text-xs transition-colors uppercase tracking-widest cursor-pointer shadow-md text-center"
              >
                Acquitter l'Alerte & Réactiver le WAF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= RECHARGE FUNDS MODAL ================= */}
      {showRechargeModal && (
        <div id="wallet-recharge-modal-cover" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl text-slate-800">
            <h3 className="text-sm font-bold text-slate-950 uppercase tracking-widest flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span>Dépôt Sécurisé Mobile Money</span>
            </h3>

            <form onSubmit={handleRechargeWallet} className="space-y-4">
              {!rechargeOtpSent ? (
                <>
                  <div className="grid grid-cols-2 gap-3.5 text-left">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Montant à recharger</label>
                      <input
                        type="number"
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(e.target.value)}
                        className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none font-mono font-bold transition-all ${
                          rechargeAmountError 
                            ? "border-red-400 focus:border-red-500 bg-red-50/10 focus:ring-1 focus:ring-red-450" 
                            : "border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                        }`}
                        required
                      />
                      {rechargeAmountError ? (
                        <p className="text-[9px] text-red-500 font-semibold mt-1 leading-tight">{rechargeAmountError}</p>
                      ) : (
                        <p className="text-[9px] text-emerald-600 font-semibold mt-1 leading-tight">✓ Montant valide ({rechargeAmountNum} {rechargeCurrency})</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Devise</label>
                      <select
                        value={rechargeCurrency}
                        onChange={(e) => setRechargeCurrency(e.target.value as "CDF" | "USD")}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-600 font-bold"
                      >
                        <option value="CDF">Franc Congolais (CDF)</option>
                        <option value="USD">Dollar Américain (USD)</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-left">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sélectionner un Opérateur</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRechargeMethod("M-Pesa")}
                        className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                          rechargeMethod === "M-Pesa" ? "bg-orange-50 border-orange-400 text-orange-650 font-extrabold" : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}
                      >
                        M-Pesa (Vodacom)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRechargeMethod("Orange Money")}
                        className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                          rechargeMethod === "Orange Money" ? "bg-amber-50 border-amber-400 text-amber-750 font-extrabold" : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}
                      >
                        Orange Money
                      </button>
                      <button
                        type="button"
                        onClick={() => setRechargeMethod("Airtel Money")}
                        className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                          rechargeMethod === "Airtel Money" ? "bg-red-50 border-red-400 text-red-650 font-extrabold" : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}
                      >
                        Airtel Money
                      </button>
                    </div>
                  </div>

                  <div className="text-left">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Numéro de Téléphone Mobile Money</label>
                    <input
                      type="text"
                      value={rechargePhone}
                      onChange={(e) => setRechargePhone(e.target.value)}
                      className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none font-mono transition-all ${
                        rechargePhoneError 
                          ? "border-red-400 focus:border-red-500 bg-red-50/10 focus:ring-1 focus:ring-red-450" 
                          : "border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      }`}
                      placeholder="+243"
                      required
                    />
                    {rechargePhoneError ? (
                      <p className="text-[9px] text-red-500 font-semibold mt-1 leading-tight">{rechargePhoneError}</p>
                    ) : (
                      <p className="text-[9px] text-emerald-600 font-semibold mt-1 leading-tight">✓ Numéro de téléphone DRC Mobile Money valide</p>
                    )}
                  </div>

                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-start gap-2 text-[9px] text-blue-800 text-left">
                    <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>
                      Un message de confirmation PIN de transaction vous sera immédiatement envoyé par Vodacom/Airtel/Orange pour valider le débit de votre solde mobile.
                    </span>
                  </div>
                </>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200 text-left">
                  <div className="bg-blue-50 p-3.5 border border-blue-200 rounded-2xl text-left text-blue-850 space-y-1">
                    <span className="font-extrabold text-[9px] block uppercase tracking-wider font-mono text-blue-800 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                      <span>SÉCURISATION DOUBLE FACTEUR D'ÉTAT</span>
                    </span>
                    <p className="text-[10.5px] leading-relaxed text-slate-650 font-sans">
                      Un code OTP temporaire de certification d'État a été envoyé par SMS civil à votre numéro de rechargement : <b>{rechargePhone}</b>.
                    </p>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Entrez le code OTP à 6 chiffres :</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="------"
                      value={rechargeEnteredOtp}
                      onChange={(e) => setRechargeEnteredOtp(e.target.value)}
                      className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl py-2.5 text-base font-mono font-extrabold tracking-widest text-[#2563EB] outline-none focus:border-blue-600"
                      required
                    />
                  </div>

                  {rechargeOtpError && (
                    <p className="text-[10px] text-red-650 font-bold block text-left bg-red-50 px-3 py-1.5 border border-red-200 rounded-lg">{rechargeOtpError}</p>
                  )}

                  <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-bold">Volume de transfert :</span>
                    <span className="font-extrabold text-slate-900 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">{rechargeAmount} {rechargeCurrency}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setRechargeOtpSent(false);
                      setRechargeEnteredOtp("");
                      setRechargeOtpError(null);
                    }}
                    className="text-[9px] text-blue-600 hover:underline block text-center mx-auto cursor-pointer font-bold uppercase tracking-wide font-mono"
                  >
                    Corriger les informations
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRechargeModal(false);
                    setRechargeOtpSent(false);
                    setRechargeEnteredOtp("");
                    setRechargeOtpError(null);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!rechargeOtpSent && isRechargeFormInvalid}
                  className={`flex-1 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all shadow-sm ${
                    !rechargeOtpSent && isRechargeFormInvalid 
                      ? "bg-slate-250 text-slate-400 cursor-not-allowed border border-slate-200" 
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {rechargeOtpSent ? "Valider la Recharge" : "Initier la Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= GLOBAL SOS & DRC GOVT REQUIREMENTS MODAL ================= */}
      {showSOSModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-red-500 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="bg-red-600 text-white p-2 ml-1 rounded-2xl animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="font-black text-sm text-red-500 tracking-wider uppercase">🚨 PORTAIL SOS & ASSISTANCE RDC</h3>
                <p className="text-[10px] text-slate-450">Canaux de détresse de la République Démocratique du Congo & exigences de l'État</p>
              </div>
            </div>

            {/* Emergency clickable numbers matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
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
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2.5 text-left text-xs">
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
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-350 font-black py-2.5 rounded-2xl text-xs transition-all cursor-pointer border border-slate-755"
            >
              Fermer la fenêtre d'Assistance
            </button>
          </div>
        </div>
      )}

      {/* ================= REPARO PAYMENT CONFIRMATION MODAL ================= */}
      {showPaymentConfirmationModal && paymentDetailsForModal && (
        <div id="reparo-payment-confirmation-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl text-slate-800 animate-fade-in font-sans">
            <div className="text-center space-y-2">
              <div className="mx-auto w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-100 shadow-sm">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Validation Finale du Paiement (REPARO)
              </h3>
              <p className="text-[10px] text-slate-500">
                Veuillez approuver la libération de la garantie suite à l'arrivée de la course à sa destination.
              </p>
            </div>

            {/* Receipt Summary / Ticket Style */}
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3 text-xs text-left">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest block font-mono">Détails financiers</span>
              
              <div className="flex justify-between items-center border-b border-dashed border-slate-205 pb-2">
                <span className="text-slate-550 font-medium">Prix Total Course :</span>
                <span className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                  {paymentDetailsForModal.totalAmount.toLocaleString("fr-FR")} {paymentDetailsForModal.paymentUsed}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-dashed border-slate-205 pb-2">
                <span className="text-slate-550 font-medium">Coût de Service (15%) :</span>
                <span className="font-mono font-bold text-slate-700 text-[11px]">
                  {paymentDetailsForModal.serviceCost.toLocaleString("fr-FR")} {paymentDetailsForModal.paymentUsed}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-550 font-medium">Solde Restant du Wallet :</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                  {paymentDetailsForModal.remainingBalance.toLocaleString("fr-FR")} {paymentDetailsForModal.paymentUsed}
                </span>
              </div>
            </div>

            {/* Note alert */}
            <div className="bg-blue-50/70 border border-blue-100 p-3 rounded-xl flex items-start gap-2 text-[9px] text-blue-805 text-left leading-relaxed">
              <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                <b>Garantie de Trajet :</b> Ces fonds ont été provisionnés au départ en gage d'arbitrage REPARO. Valider libère les parts du motard, du propriétaire, et la plateforme.
              </span>
            </div>

            {/* Dialogue Action buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                id="btn-confirm-payment-cancel"
                onClick={() => {
                  setShowPaymentConfirmationModal(false);
                  showToast("info", "Paiement en suspend", "La validation est en attente. Finalisez de façon autonome via le bouton actif.");
                }}
                className="flex-1 bg-slate-105 hover:bg-slate-200 text-slate-600 font-bold py-2 px-3 rounded-xl text-xs cursor-pointer transition-all border border-slate-205"
              >
                Plus tard
              </button>
              <button
                type="button"
                id="btn-confirm-payment-submit"
                onClick={handleCompleteRide}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 px-3 rounded-xl text-xs cursor-pointer transition-all shadow-sm shadow-blue-200"
              >
                Valider & Payer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
