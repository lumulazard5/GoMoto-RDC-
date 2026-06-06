import React, { useState, useMemo } from "react";
import { 
  Scale, 
  FileText, 
  User, 
  Bike, 
  Building, 
  Search, 
  Printer, 
  Copy, 
  Check, 
  Clock, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  Shield,
  CheckCircle,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { 
  generalTerms, 
  clientPolicy, 
  driverPolicy, 
  ownerPolicy,
  legalRegulations 
} from "../data/legalTexts";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "Gombe & Artères" | "Permis & Documents" | "Port du Casque" | "Fonds & Remboursement" | "Sécurité & Tracasseries";
  tags: string[];
  reference: string;
}

export const FAQ_DATABASE: FAQItem[] = [
  {
    id: "faq-1",
    question: "Est-il permis de circuler en taxi-moto à Gombe ou sur le Boulevard du 30 Juin ?",
    answer: "Non. Conformément à l'Arrêté Provincial de l'Hôtel de Ville de Kinshasa, la circulation de tout taxi-moto public est formellement interdite dans toute la commune de la Gombe, ainsi que sur les grands axes structurants comme le Boulevard du 30 Juin et la Route de l'Aéroport de Ndjili. Pour préserver nos partenaires des risques élevés de confiscation définitive de la motocyclette et d'amendes administratives colossales, GoMoto intègre un géofencing (barrière GPS virtuelle). L'application bloque automatiquement toute commande ayant un départ ou une destination dans la zone réglementée de la Gombe.",
    category: "Gombe & Artères",
    tags: ["gombe", "boulevard", "autorise", "interdit", "zone", "commune", "circulation", "centre ville"],
    reference: "Arrêté Provincial de l'Hôtel de Ville (Kinshasa)"
  },
  {
    id: "faq-2",
    question: "Quel permis de conduire est réglementairement obligatoire pour le motard en RDC ?",
    answer: "En vertu de la Loi n° 78/022 du 30 août 1978 portant Code de la Route en République Démocratique du Congo, le pilote de taxi-moto doit détenir obligatoirement un Permis de Conduire National de Catégorie A en cours de validité. Ce permis valide sa capacité de conduite théorique et pratique d'un deux-roues motorisé. Circuler sans permis expose le chauffeur à des poursuites pénales de premier degré pour défaut de pièces. GoMoto procède à une vérification faciale et manuelle systématique du permis avant d'octroyer le badge d'agrément officiel.",
    category: "Permis & Documents",
    tags: ["permis", "categorie a", "conduire", "moto", "obligatoire", "défaut", "pnc", "rouler"],
    reference: "Art. 12 du Code de la Route Congolais (Loi n° 78/022)"
  },
  {
    id: "faq-3",
    question: "Quels sont les documents obligatoires exigés par la police pour circuler légalement ?",
    answer: "Toute motocyclette affectée au transport doit être en mesure de produire à chaque réquisition d'un agent compétent : 1) La Carte Rose d'identification d'État du véhicule, 2) L'Attestation d'Assurance de Responsabilité Civile valide couvrant les tiers, 3) La Vignette Fiscale Provinciale annuelle obligatoire, 4) L'Autorisation de transport urbain en moto, et 5) La preuve du Contrôle Technique de sécurité (vérification des freins et phares). GoMoto centralise ces documents numériquement pour que les motards puissent prouver instantanément leur régularité totale.",
    category: "Permis & Documents",
    tags: ["carte rose", "vignette", "assurance", "controle technique", "pieces", "documents", "tracasseries"],
    reference: "Règlement d'Assainissement du Transport Public Terrestre RDC"
  },
  {
    id: "faq-4",
    question: "Le port du casque est-il une obligation stricte pour le passager (client) ?",
    answer: "Oui, le décret présidentiel et les circulaires ministérielles des Transports et Voies de Communication stipulent que le port d'un casque de protection homologué est obligatoire pour le conducteur ainsi que pour son passager. Le non-port de casque constitue une infraction pénale majeure au nom de la sécurité publique. Pour éliminer les risques de blessures ou de contraventions par la PNC, GoMoto équipe chaque motard agréé de deux casques officiels. Le passager a le droit d'exiger son casque de protection, et le conducteur a l'obligation légale de refuser la course si le client s'oppose à le porter.",
    category: "Port du Casque",
    tags: ["casque", "passager", "client", "obligatoire", "securite", "protection", "infraction", "pnc"],
    reference: "Code de la Route RDC, Titre IV: Mesures de Sécurité Individuelle"
  },
  {
    id: "faq-5",
    question: "Comment fonctionne le prépaiement sécurisé en reparo et la politique de remboursement ?",
    answer: "Afin de garantir et d'éradiquer les litiges financiers, les tracasseries ou les fraudes, tout client GoMoto prépaye son trajet par Mobile Money (Orange Money, Airtel Money, M-Pesa) ou via son Wallet avant que le motard ne démarre. Ce montant est consigné en séquestre inviolable (reparo). À la fin du trajet (course marquée effectuée par GPS et confirmation), les fonds sont ventilés automatiquement : 85% aux portefeuilles du motard et du propriétaire, et 15% de commission légale à GoMoto. Si aucun motard n'accepte la course, ou si une annulation est initiée pour motif valable (absence prolongée, panne), le passager est remboursé instantanément à 100% sans aucun frais retenu.",
    category: "Fonds & Remboursement",
    tags: ["payer avant", "paiement", "reparo", "remboursement", "mobile money", "wallet", "annuler", "litige", "séquestre"],
    reference: "Protocoles Financiers GoMoto & Direction Générale de la Protection Consommateur"
  },
  {
    id: "faq-6",
    question: "Comment GoMoto lutte-t-il contre les tracasseries policières et les amendes arbitraires ?",
    answer: "Les tracasseries routières de faible niveau constituent un fléau pour les transporteurs. GoMoto agit en protégeant ses motards agréés : chaque course étant enregistrée avec un tracé GPS horodaté, une preuve d'assurance en direct et des identités certifiées par reconnaissance faciale, l'application génère un certificat d'authenticité numérique. En cas d'interpellation injustifiée pour réclamer un pot-de-vin, le motard peut présenter son écran certifié GoMoto en direct à la Police de Circulation Routière (PCR). Notre service de support de permanence intervient également auprès des commissariats en fournissant la preuve télématisée de conformité légale.",
    category: "Sécurité & Tracasseries",
    tags: ["tracasseries", "police", "pcr", "racket", "amende", "arrestation", "arbitraire", "protection", "opj"],
    reference: "Charte Nationale Anti-Tracasseries et Droits du Transporteur Urbain"
  },
  {
    id: "faq-7",
    question: "Combien de passagers une moto GoMoto est-elle autorisée à transporter à Kinshasa ?",
    answer: "Le transport sur taxi-moto en RDC est limité à une (1) seule personne à bord (le pilote et un passager unique). La surcharge (transporter deux clients ou plus sur une seule moto, pratique appelée familièrement 'surcharge') est formellement prohibée par la loi et punie par la charte d'utilisation GoMoto. En cas de conduite en surcharge détectée par signalement de tiers ou flagrance policière, le conducteur est définitivement suspendu, et l'assurance de trajet GoMoto devient caduque, le déchargeant de toute indemnisation en cas d'accident routier.",
    category: "Port du Casque",
    tags: ["combien de passagers", "surcharge", "passagers", "limite", "nombre de personnes", "accident", "securite"],
    reference: "Règlement d'Assainissement du Transport Public Terrestre RDC"
  },
  {
    id: "faq-8",
    question: "Quelles sont les sanctions en cas de conduite dangereuse ou de vitesse folle ?",
    answer: "GoMoto intègre une détection télématique dynamique à l'aide de l'accéléromètre et du GPS de l'appareil mobile du chauffeur. Les excès de vitesse répétés, les slaloms risqués ou les freinages brutaux non justifiés génèrent des alertes automatiques et diminuent la note du motard. Les infractions graves (vitesse supérieure aux limitations de 50 km/h en zone urbaine) ou la suspicion de conduite sous l'emprise d'alcool entraînent le blocage immédiat et temporaire du compte. Les récidivistes se voient bannis de la plateforme de manière irrévocable, avec déclaration officielle aux OPJ de la commune.",
    category: "Sécurité & Tracasseries",
    tags: ["conduite dangereuse", "vitesse", "vitesse folle", "sanction", "banni", "securite", "gps", "accident"],
    reference: "Loi Relative à la Sécurité Routière et Mesures Urbaines RDC"
  }
];

interface LegalCenterProps {
  currentRole?: "guest" | "client" | "driver" | "owner" | "admin";
  onClose?: () => void;
}

export default function LegalCenter({ currentRole = "guest", onClose }: LegalCenterProps) {
  const [activeTab, setActiveTab] = useState<"client" | "driver" | "owner">(() => {
    if (currentRole === "client") return "client";
    if (currentRole === "driver") return "driver";
    if (currentRole === "owner") return "owner";
    return "client"; // default
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  // States for the interactive FAQ
  const [faqSearchQuery, setFaqSearchQuery] = useState("");
  const [faqSelectedCategory, setFaqSelectedCategory] = useState<string>("all");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Custom AI Inquiry search simulation state
  const [customQuestion, setCustomQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState<{
    status: "idle" | "searching" | "success";
    question?: string;
    answer?: string;
    reference?: string;
    category?: string;
    accuracy?: number;
  }>({ status: "idle" });

  const handleAiInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;

    setAiResponse({ status: "searching" });

    setTimeout(() => {
      const cleanWords = customQuestion
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 2 && !["les", "des", "dans", "pour", "avec", "cette", "quel", "quelle", "comment", "existe", "puis", "peut", "peux"].includes(w));

      let bestItem: FAQItem | null = null;
      let maxScore = 0;

      FAQ_DATABASE.forEach(item => {
        let score = 0;
        cleanWords.forEach(word => {
          if (item.question.toLowerCase().includes(word)) score += 3;
          if (item.answer.toLowerCase().includes(word)) score += 1;
          if (item.tags.some(tag => tag.toLowerCase() === word || word.includes(tag))) score += 4;
          if (item.category.toLowerCase().includes(word)) score += 2;
        });

        if (score > maxScore) {
          maxScore = score;
          bestItem = item;
        }
      });

      if (bestItem && maxScore > 1) {
        setAiResponse({
          status: "success",
          question: bestItem.question,
          answer: bestItem.answer,
          reference: bestItem.reference,
          category: bestItem.category,
          accuracy: Math.min(75 + maxScore * 3, 99)
        });
      } else {
        setAiResponse({
          status: "success",
          question: customQuestion,
          answer: "La requête saisie n'a pas trouvé de correspondance exacte dans notre base de certifications de la RDC. Cependant, retenez que conformément aux prescrits de la Police de Circulation Routière (PCR) et du Code de la Route Congolais (Loi n° 78/022), tout déplacement public à moto exige sans dérogation possible : le port d'un double casque de protection conforme aux normes d'absorption, l'interdiction de franchir la zone sécuritaire de la commune de la Gombe sous peine d'interpellation routière forte, l'interdiction de rouler en surcharge (max 1 passager), et la détention permanente d'un permis catégorie A valide ainsi que de la vignette provinciale active.",
          reference: "Prescrits Généraux de la PCR & Code de la Route RDC",
          category: "Régulation Résiduelle",
          accuracy: 62
        });
      }
    }, 900);
  };

  // Map tabs to their actual data objects
  const documentMap = useMemo(() => {
    return {
      client: {
        title: "Conditions Passager (Charte Clients)",
        badge: "Espace Voyageurs",
        icon: User,
        color: "blue",
        bgColor: "bg-blue-50/50 border-blue-100",
        btnColor: "bg-blue-600 hover:bg-blue-700 text-white",
        textColor: "text-blue-900 border-blue-500",
        data: clientPolicy,
        extra: {
          title: "Dispositions Générales du Passager",
          items: [
            "Prise en charge instantanée dans les 26 provinces de RDC.",
            "Obligation stricte du port de casque de protection à bord.",
            "Couverture d'assurance responsabilité de trajet GoMoto."
          ]
        }
      },
      driver: {
        title: "Conditions Chauffeur (Partenaires Motards)",
        badge: "Espace Prestataires",
        icon: Bike,
        color: "amber",
        bgColor: "bg-amber-50/50 border-amber-100",
        btnColor: "bg-amber-600 hover:bg-amber-700 text-white",
        textColor: "text-amber-900 border-amber-500",
        data: driverPolicy,
        extra: {
          title: "Cadre Réglementaire RDC & Ville Province",
          items: legalRegulations.requirements
        }
      },
      owner: {
        title: "Conditions Propriétaire (Gestionnaires de Flottes)",
        badge: "Espace Investisseurs",
        icon: Building,
        color: "purple",
        bgColor: "bg-purple-50/50 border-purple-100",
        btnColor: "bg-purple-600 hover:bg-purple-700 text-white",
        textColor: "text-purple-900 border-purple-500",
        data: ownerPolicy,
        extra: {
          title: "Contrats de Gérance et Portefeuilles",
          items: [
            "Attribution sécurisée de chauffeurs agréés avec suivi GPS en direct.",
            "Clé de répartition de gain automatisée (ex. Versement fixe ou Ratio %).",
            "Séquestre de sécurité des règlements et arbitrages de litige de versement."
          ]
        }
      }
    };
  }, []);

  const activeDoc = documentMap[activeTab];

  // Search logic to filter headings or paragraph text in the active document
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return activeDoc.data.sections;
    const query = searchQuery.toLowerCase();
    
    return activeDoc.data.sections.filter(sect => {
      const matchHeading = sect.heading.toLowerCase().includes(query);
      const matchContent = sect.content.some(text => text.toLowerCase().includes(query));
      return matchHeading || matchContent;
    });
  }, [activeDoc, searchQuery]);

  const handleCopyText = () => {
    let fullText = `${activeDoc.title}\n${activeDoc.data.lastUpdated}\n\n`;
    
    activeDoc.data.sections.forEach(sect => {
      fullText += `${sect.heading}\n`;
      sect.content.forEach(p => {
        fullText += `- ${p}\n`;
      });
      fullText += `\n`;
    });

    if (activeDoc.extra) {
      fullText += `${activeDoc.extra.title}\n`;
      activeDoc.extra.items.forEach(item => {
        fullText += `- ${item}\n`;
      });
    }

    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="legal-center-component-root" className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-5xl mx-auto my-6">
      
      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 md:p-8 text-white relative">
        <div className="absolute top-5 right-5 flex items-center gap-2">
          <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-mono tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-800 rounded font-bold uppercase">
            Souveraineté RDC
          </span>
          {onClose && (
            <button 
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 h-8 w-8 rounded-full flex items-center justify-center transition-all cursor-pointer font-extrabold text-sm"
              title="Fermer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight font-sans">Centre de Clarté Légale & CGU</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Chartes d'utilisation, réglementations provinciales et transparence de répartition de GoMoto RDC
            </p>
          </div>
        </div>

        {/* Global CGU short note */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <p className="text-slate-350 leading-relaxed text-[11px] max-w-2xl">
            Conformément aux régulations régissant le transport public interprovincial en République Démocratique du Congo, chaque membre de la plateforme s'enquiert spécifiquement des obligations inhérentes à son statut juridique.
          </p>
          <div className="flex items-center gap-2 shrink-0 text-slate-400 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/50">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono text-[10px]">CGU global v2.4 (2026)</span>
          </div>
        </div>
      </div>

      {/* DYNAMIC ROLE TABS BAR */}
      <div className="bg-slate-50 border-b border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            
            {/* Tab: Passenger */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("client");
                setSearchQuery("");
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border cursor-pointer ${
                activeTab === "client" 
                  ? "bg-blue-600 text-white border-blue-600 shadow-md scale-102" 
                  : "bg-white text-slate-650 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Conditions Passager</span>
              {currentRole === "client" && (
                <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 animate-ping"></span>
              )}
            </button>

            {/* Tab: Driver */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("driver");
                setSearchQuery("");
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border cursor-pointer ${
                activeTab === "driver" 
                  ? "bg-amber-600 text-white border-amber-600 shadow-md scale-102" 
                  : "bg-white text-slate-650 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>Conditions Chauffeur</span>
              {currentRole === "driver" && (
                <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 animate-ping"></span>
              )}
            </button>

            {/* Tab: Fleet Owner */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("owner");
                setSearchQuery("");
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border cursor-pointer ${
                activeTab === "owner" 
                  ? "bg-purple-600 text-white border-purple-600 shadow-md scale-102" 
                  : "bg-white text-slate-650 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Conditions Propriétaire de Flotte</span>
              {currentRole === "owner" && (
                <span className="h-2 w-2 rounded-full bg-purple-400 shrink-0 animate-ping"></span>
              )}
            </button>
            
          </div>

          {/* Active status indicator badge */}
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Votre Rôle Actif :</span>
            <span className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5 justify-end">
              <span className={`inline-block h-2 w-2 rounded-full ${
                currentRole === "guest" ? "bg-slate-400" :
                currentRole === "client" ? "bg-blue-500" :
                currentRole === "driver" ? "bg-amber-500" : "bg-purple-500"
              }`} />
              {currentRole === "guest" && "Visiteur Non Inscrit"}
              {currentRole === "client" && "Passager (Client)"}
              {currentRole === "driver" && "Chauffeur (Motard)"}
              {currentRole === "owner" && "Propriétaire de Flotte"}
              {currentRole === "admin" && "Directeur Administratif (RDC)"}
            </span>
          </div>
        </div>

        {/* Role Matching Notification Alert */}
        {currentRole !== "guest" && currentRole !== "admin" && currentRole !== activeTab && (
          <div className="mt-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl px-3.5 py-2 text-[11px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <p>
              Vous consultez actuellement les conditions spécifiques à la catégorie <span className="font-extrabold uppercase">{activeTab === "client" ? "Passager" : activeTab === "driver" ? "Chauffeur" : "Propriétaire"}</span>. Vos propres engagements contractuels sont régis par l'onglet <span className="font-extrabold text-blue-700 underline uppercase">{currentRole === "client" ? "Conditions Passager" : currentRole === "driver" ? "Conditions Chauffeur" : "Conditions Propriétaire"}</span>.
            </p>
          </div>
        )}
      </div>

      {/* ACTIONS ROW & SEARCH */}
      <div className="border-b border-slate-150 p-4 bg-slate-50/50 flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search input field */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un terme, article..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-3 flex items-center text-[10px] text-slate-400 hover:text-slate-650 cursor-pointer"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Utility copy and print actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleCopyText}
            className="text-xs font-bold border border-slate-200 bg-white hover:bg-slate-55 text-slate-700 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Copier le document entier"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-555" />
                <span className="text-emerald-600">Texte copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copier Textes</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handlePrint}
            className="text-xs font-bold border border-slate-200 bg-white hover:bg-slate-55 text-slate-700 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Imprimer ou enregistrer au format PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Imprimer / PDF</span>
          </button>
        </div>
      </div>

      {/* CORE LEGAL TEXT DISPLAY BOARD */}
      <div id="legal-center-document-board" className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT & CENTER PANEL: Term Sections (dynamic content) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-150 pb-3">
            <div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                activeTab === "client" ? "bg-blue-100 text-blue-800" :
                activeTab === "driver" ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"
              }`}>
                {activeDoc.badge}
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1.5">{activeDoc.title}</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono italic shrink-0">
              {activeDoc.data.lastUpdated}
            </span>
          </div>

          {searchQuery && (
            <p className="text-xs text-slate-500 italic">
              Résultats de recherche pour "{searchQuery}" — {filteredSections.length} section(s) trouvée(s).
            </p>
          )}

          {filteredSections.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <span className="text-3xl">🔍</span>
              <h4 className="text-slate-700 font-bold text-sm mt-2">Aucun article ne correspond à votre recherche</h4>
              <p className="text-slate-405 text-xs mt-1">Veuillez ajuster les mots-clés ou changer de document.</p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-3.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow"
              >
                Tout réinitialiser
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSections.map((section, sIndex) => (
                <div 
                  key={sIndex} 
                  className={`p-5 rounded-2xl border transition-all ${
                    activeTab === "client" ? "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm" :
                    activeTab === "driver" ? "bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm" : 
                    "bg-white border-slate-200 hover:border-purple-300 hover:shadow-sm"
                  }`}
                >
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-2.5">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                      activeTab === "client" ? "bg-blue-100 text-blue-700" :
                      activeTab === "driver" ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {sIndex + 1}
                    </span>
                    <span>{section.heading}</span>
                  </h4>
                  <div className="space-y-2 border-l border-slate-150 pl-4 ml-3">
                    {section.content.map((paragraph, pIndex) => (
                      <p 
                        key={pIndex} 
                        className="text-[12px] text-slate-650 leading-relaxed font-normal"
                        dangerouslySetInnerHTML={{
                          __html: searchQuery 
                            ? paragraph.replace(new RegExp(`(${searchQuery})`, "gi"), "<mark class='bg-yellow-200 text-slate-905 px-0.5 rounded font-black'>$1</mark>")
                            : paragraph
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Category specific obligations / regulatory list */}
        <div className="space-y-6">
          
          {/* Box explaining the legal context */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-orange-400" />
              <span>Conformité d'État RDC</span>
            </h4>
            <div className="space-y-2 text-[11px] text-slate-350 leading-relaxed">
              <p>
                Chaque disposition contractuelle énoncée dans ce centre lèse ou profite directement aux utilisateurs de GoMoto selon les prescrits de <b>l'Autorité Urbaine de Sécurité du Transport Routier</b>.
              </p>
              <p>
                Tout incident, contestation tarifaire ou fraude de virement de portefeuille donne lieu à un arbitrage administratif officiel au sein de notre panel d’enquête de souveraineté.
              </p>
            </div>
            <div className="pt-2">
              <span className="block text-[9px] font-bold text-emerald-400 font-mono">● SERVEUR JURIDIQUE SÉCURISÉ ACTIF</span>
            </div>
          </div>

          {/* Right box: Dynamic role benefits & legal points */}
          <div className={`rounded-2xl p-5 border ${activeDoc.bgColor} space-y-4`}>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg bg-white shadow-sm border border-slate-150`}>
                <activeDoc.icon className={`w-4 h-4 text-slate-700`} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-850">
                {activeDoc.extra.title}
              </h4>
            </div>

            <div className="space-y-2.5">
              {activeDoc.extra.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-white/70 p-2.5 rounded-xl border border-slate-150 shadow-xs">
                  <span className="bg-emerald-50 text-emerald-600 h-5 w-5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                    ✓
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center text-[10px] text-slate-400 font-bold">
              Mis en vigueur dans toutes les provinces de RDC
            </div>
          </div>

          {/* FAQ sidebar link */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3 text-left">
            <div className="flex items-center gap-2 text-slate-800">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs font-black uppercase">Recherche IA Routière</h4>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Consultez notre moteur d'arbitrage et notre FAQ interactive ci-dessous pour toute question relative au Code de la Route Congolais (Loi n° 78/022), à la réglementation de la commune de la Gombe et aux décomptes financiers de paiement.
            </p>
            <a href="#interactive-faq-section" className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <span>Aller aux questions fréquentes</span>
              <span>↓</span>
            </a>
          </div>

        </div>
      </div>

      {/* ================= SECTION FAQ INTERACTIVE ET DÉCISIONNEL ROUTIER GOMOTO RDC ================= */}
      <div id="interactive-faq-section" className="border-t border-slate-200 bg-slate-50/50 p-6 md:p-8 space-y-8">
        
        {/* Section title */}
        <div className="max-w-3xl mx-auto text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 border border-blue-250 text-blue-800 rounded-full text-[10px] font-extrabold uppercase font-mono tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Moteur de Recherche Assistée & Arbitrage Routier</span>
          </div>
          <h3 className="text-xl font-black text-slate-900">FAQ Interactive & Code de la Route d'État RDC</h3>
          <p className="text-slate-500 text-xs max-w-2xl mx-auto">
            Notre système de recherche compile pour les motards, clients et propriétaires de flottes les règlements urbains de Kinshasa et la loi nationale de sécurité routière pour mettre fin aux litiges et tracasseries.
          </p>
        </div>

        {/* BENTO LAYOUT: MOTEUR DE RECHERCHE IA DÉCISIONNEL VS ACCORDEON STRUCTURÉ */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* SEARCH COCHONNET & DIRECT QUESTIONS IN ACCORDION: COLUMN SPAN 7 */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* SEARCH AND CATEGORIES TAB BAR */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              
              {/* Filter search bar */}
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={faqSearchQuery}
                  onChange={(e) => {
                    setFaqSearchQuery(e.target.value);
                    setExpandedFaqId(null);
                  }}
                  placeholder="Rechercher par mot-clé (ex: Gombe, permis, casque, remboursement, surcharge...)"
                  className="w-full text-xs pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium transition-all"
                />
                {faqSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setFaqSearchQuery("")}
                    className="absolute inset-y-0 right-3 flex items-center text-[10px] text-slate-400 hover:text-slate-650 cursor-pointer font-bold"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {/* Category selector capsules */}
              <div className="flex flex-wrap gap-1 md:gap-1.5 pt-1">
                {["all", "Gombe & Artères", "Permis & Documents", "Port du Casque", "Fonds & Remboursement", "Sécurité & Tracasseries"].map((cat) => {
                  const isActive = faqSelectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setFaqSelectedCategory(cat);
                        setExpandedFaqId(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        isActive
                          ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {cat === "all" ? "Toutes les catégories" : cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* EXPANDABLE ACCORDION LIST */}
            <div className="space-y-3">
              {(() => {
                const results = FAQ_DATABASE.filter(item => {
                  const matchCategory = faqSelectedCategory === "all" || item.category === faqSelectedCategory;
                  const query = faqSearchQuery.toLowerCase().trim();
                  if (!query) return matchCategory;
                  
                  const matchQuestion = item.question.toLowerCase().includes(query);
                  const matchAnswer = item.answer.toLowerCase().includes(query);
                  const matchTag = item.tags.some(tag => tag.toLowerCase().includes(query));
                  return matchCategory && (matchQuestion || matchAnswer || matchTag);
                });

                if (results.length === 0) {
                  return (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                      <h4 className="font-bold text-slate-800 text-xs">Aucune question trouvée</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed max-w-sm mx-auto">
                        Ajustez votre recherche ou utilisez le moteur de recherche assisté par l'IA à droite pour formuler une question personnalisée.
                      </p>
                    </div>
                  );
                }

                return results.map((item) => {
                  const isExpanded = expandedFaqId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all duration-200 text-left"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaqId(isExpanded ? null : item.id)}
                        className="w-full text-left p-4 flex justify-between items-center gap-4 transition-all hover:bg-slate-50/50 cursor-pointer"
                      >
                        <div className="space-y-1.5">
                          <span className="text-[8px] font-black uppercase text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                            {item.category}
                          </span>
                          <h4 className="font-bold text-slate-850 text-xs leading-relaxed">{item.question}</h4>
                        </div>
                        <span className={`h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-550 shrink-0 transform transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                          ▼
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="p-4 bg-slate-50/40 border-t border-slate-150 space-y-3 text-left">
                          <p className="text-[11.5px] text-slate-650 leading-relaxed font-normal">
                            {item.answer}
                          </p>
                          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[9px] font-mono text-slate-400">
                            <span className="font-bold">RDC Référence: <span className="text-slate-600">{item.reference}</span></span>
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase border border-emerald-200">Garantie Légale</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* AI SEARCH & DIAGNOSTIC PANEL: COLUMN SPAN 5 */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-4">
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-6 border border-slate-800 shadow-md space-y-4 text-left">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Consultation Assistée</h4>
                  <p className="text-[9px] text-slate-400">Saisissez une question libre sur les décisions juridiques RDC</p>
                </div>
              </div>

              <form onSubmit={handleAiInquiry} className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="custom-inquiry-txt" className="text-[9px] font-black text-slate-350 uppercase tracking-wider block font-mono">
                    Posez votre question sur le code :
                  </label>
                  <textarea
                    id="custom-inquiry-txt"
                    rows={2}
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="Ex: Puis-je rouler à Gombe sans casque? Que se passe-t-il si un passager refuse de payer avant le trajet ?"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={aiResponse.status === "searching" || !customQuestion.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:bg-slate-850 disabled:text-slate-600 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {aiResponse.status === "searching" ? (
                      <>
                        <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                        <span>Audit du code en cours...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-3.5 h-3.5" />
                        <span>Rechercher avec l'IA</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Quick helper question chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Sujets suggérés :</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Gombe",
                    "Paiement",
                    "Surcharge",
                    "Casque"
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setCustomQuestion(`Quelles sont les règles d'État concernant la question de : ${chip} ?`);
                        setAiResponse({ status: "idle" });
                      }}
                      className="bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg px-2.5 py-1 text-[9.5px] text-slate-300 font-semibold transition-all cursor-pointer whitespace-nowrap"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI COMPLIANCE REPORT BOX RESULT */}
              {aiResponse.status === "success" && (
                <div className="bg-slate-950/80 border border-blue-500/40 rounded-xl p-4 space-y-3 text-left animate-fade-in">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2 flex-wrap gap-2">
                    <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest font-mono block">
                      Rapport d'Arbitrage Certifié
                    </span>
                    <span className="bg-emerald-955 text-emerald-400 border border-emerald-900/60 text-[8px] font-black font-mono px-2 py-0.5 rounded">
                      CORRESPONDANCE: {aiResponse.accuracy}%
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase block font-mono">Question posée</span>
                    <h5 className="text-[10.5px] font-black text-slate-200 leading-relaxed font-sans">
                      {aiResponse.question}
                    </h5>
                  </div>

                  <div className="space-y-1.5 bg-slate-900/40 p-3 rounded-lg border border-slate-850">
                    <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase block font-mono">Décision & Analyse</span>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                      {aiResponse.answer}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 pt-1 border-t border-slate-900">
                    <span>CADRE: {aiResponse.category || "Général"}</span>
                    <span>RÉF: {aiResponse.reference || "Loi d'État"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Legal compliance notice footer inside the component */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[9.5px] text-slate-500 leading-relaxed text-left flex gap-2.5">
              <Shield className="w-5 h-5 text-slate-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-extrabold text-slate-700 block text-[10px]">Clause d'Impartialité Spécifique</span>
                Les résolutions de cette FAQ et de l'assistant de conseil ne se substituent aucunement aux ordonnances provinciales, mais dressent le cadre clair et transparent des conditions techniques d'utilisation de la plateforme souscrites d'un commun accord.
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
