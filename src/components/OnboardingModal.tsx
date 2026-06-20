import React, { useState, useMemo } from "react";
import { 
  Compass, 
  Wallet, 
  MapPin, 
  TrendingUp, 
  DollarSign, 
  ShieldCheck, 
  Bike, 
  Smartphone, 
  Navigation,
  Globe,
  Coins,
  ArrowRight,
  ArrowLeft,
  X,
  Trophy,
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  UserPlus,
  Download,
  Info,
  Lock,
  Shield,
  PhoneCall,
  QrCode,
  UserCheck,
  BookOpen,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AppLanguage } from "../lib/translations";

interface Step {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  colorClass: string;
  accentBg: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "tarifs" | "securite" | "documents" | "application";
}

export default function OnboardingModal({ 
  userId, 
  lang = "fr", 
  onClose 
}: { 
  userId: string; 
  lang?: AppLanguage; 
  onClose: () => void; 
}) {
  const [activeTab, setActiveTab] = useState<"guide" | "faq">("guide");
  const [currentStep, setCurrentStep] = useState(0);
  const [faqSearch, setFaqSearch] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<string | null>("t1");
  const [activeFaqCat, setActiveFaqCat] = useState<string>("all");

  const steps: Step[] = [
    {
      id: 0,
      title: "Bienvenue sur GoMoto RDC !",
      subtitle: "La révolution de la mobilité moto en République Démocratique du Congo",
      colorClass: "text-blue-500",
      accentBg: "bg-blue-500/10 border-blue-500/20",
      icon: <Bike className="w-12 h-12 text-blue-500 animate-bounce" />,
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            GoMoto RDC est la première plateforme technologique dédiée à la professionnalisation et à la sécurisation du transport en taxi-moto en République Démocratique du Congo.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-900 border border-slate-800/80 p-3.5 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-xs text-white">Sécurité Maximale</h5>
                <p className="text-[10px] text-slate-400 mt-1">
                  Chauffeurs certifiés, civisme routier rigoureux et bouton d'urgence SOS relié à la PNC.
                </p>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 p-3.5 rounded-2xl flex items-start gap-3">
              <Trophy className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-xs text-white">Tarification Juste</h5>
                <p className="text-[10px] text-slate-400 mt-1">
                  Pas de tarifs arbitraires. Trajet mesuré au kilomètre près pour le respect de chacun.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 1,
      title: "1. Comment créer un compte ?",
      subtitle: "Rejoindre GoMoto RDC en quelques clics",
      colorClass: "text-indigo-400",
      accentBg: "bg-indigo-500/10 border-indigo-500/20",
      icon: <UserPlus className="w-12 h-12 text-indigo-400" />,
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            L'inscription sur GoMoto a été simplifiée au maximum pour s'adapter à toutes les connexions :
          </p>
          <div className="bg-slate-900 border border-slate-800/80 p-3.5 rounded-2xl space-y-2 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">A</span>
              <p>
                <b className="text-white">Connexion Directe Google :</b> Un seul clic suffit pour lier votre adresse Gmail et crypter vos accès.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">B</span>
              <p>
                <b className="text-white">Formulaire de Profil :</b> Entrez votre nom réel, numéro de contact de portefeuille mobile <span className="text-amber-400 font-bold">M-Pesa / Airtel Money / Orange Money</span>, et votre rôle (Motard ou Client).
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">C</span>
              <p>
                <b className="text-white">Accès Rapide Démo :</b> Vous êtes en phase de test ? Un <b className="text-amber-400">Easter Egg</b> secret vous permet de vous connecter sans mot de passe : cliquez simplement <span className="underline">5 fois</span> sur le titre <span className="font-bold">"🏍️ GoMoto DRC"</span> sur la page d'accueil.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "2. Utilisation de la Plateforme",
      subtitle: "Comment commander une course ou simuler un trajet",
      colorClass: "text-emerald-400",
      accentBg: "bg-emerald-500/10 border-emerald-500/20",
      icon: <Navigation className="w-12 h-12 text-emerald-400" />,
      content: (
        <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
          <p>
            Le service est fluide et entièrement automatisé grâce aux balises de position :
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl flex items-start gap-3">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <b className="text-white text-xs block">Détection GPS & Communes :</b>
                <span className="text-[11px] text-slate-450 block">Notre carte interactive identifie votre position pour l'associer au motard le plus proche dans votre commune de Kinshasa ou de province.</span>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl flex items-start gap-3">
              <Wallet className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <b className="text-white text-xs block">Simulations & Portefeuilles Mobiles :</b>
                <span className="text-[11px] text-slate-450 block">Entrez une destination pour obtenir une tarification basée sur des barèmes certifiés. Payez en ligne depuis votre wallet double devise CDF / USD.</span>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <b className="text-white text-xs block">Bouton de Détresse SOS :</b>
                <span className="text-[11px] text-slate-450 block">En cours de trajet, l'application dispose d'un bouton d'alerte SOS immédiat connectant l'équipage directement à l'assistance et à la PNC.</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "3. Soumission des Documents requis",
      subtitle: "Comment obtenir et envoyer vos fichiers officiels en RDC",
      colorClass: "text-amber-400",
      accentBg: "bg-amber-500/10 border-amber-500/20",
      icon: <FileText className="w-12 h-12 text-amber-400" />,
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p className="text-slate-400 text-xs text-left">
            Afin de garantir un service hautement sécurisé, les documents suivants sont exigés de la part de nos partenaires motards. Vous pouvez utiliser les portails officiels et guides de référence ci-dessous pour lancer vos démarches à la demande :
          </p>
          <div className="space-y-3">
            {/* Doc 1 */}
            <div className="bg-slate-900 border border-slate-800/60 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-400 flex items-center justify-center text-[10px] font-black">1</span>
                  Carte d'électeur / Passeport RDC
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-900/30 font-semibold">Identité</span>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-normal">
                Délivré par la <b className="text-slate-300">CENI</b> pour la carte d'électeur civile ou la direction générale de chancellerie pour le passeport biométrique.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/40">
                <a 
                  href="https://www.ceni.cd" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-lg text-[10px] font-bold border border-slate-800 transition-all cursor-pointer"
                >
                  <Globe className="w-3 h-3" />
                  <span>Portail CENI RDC</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <a 
                  href="https://www.diplomatie.gouv.cd" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold border border-slate-800 transition-all cursor-pointer"
                >
                  <span>Min. Affaires Étrangères</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            {/* Doc 2 */}
            <div className="bg-slate-900 border border-slate-800/60 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-400 flex items-center justify-center text-[10px] font-black">2</span>
                  Permis de Conduire (Catégorie A)
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-900/30 font-semibold text-sans">Obligatoire</span>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-normal">
                Délivré par le <b className="text-slate-300">Ministère des Transports et Voies de Communication</b> après agrément technique de la CNPR.
              </p>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/40">
                <a 
                  href="https://www.transcom.gouv.cd" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-lg text-[10px] font-bold border border-slate-800 transition-all cursor-pointer"
                >
                  <Globe className="w-3 h-3" />
                  <span>Ressources Transcom Gouv</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            {/* Doc 3 */}
            <div className="bg-slate-900 border border-slate-800/60 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-400 flex items-center justify-center text-[10px] font-black">3</span>
                  Casier Judiciaire (Extrait)
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-900/30 font-semibold font-sans">Moralité</span>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-normal">
                À solliciter directement au greffe civil du parquet près le <b className="text-slate-300">Tribunal de Grande Instance</b> (TGI) ou parquet secondaire.
              </p>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/40">
                <a 
                  href="https://www.justice.gouv.cd" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-lg text-[10px] font-bold border border-slate-800 transition-all cursor-pointer"
                >
                  <Globe className="w-3 h-3" />
                  <span>Portail Justice RDC</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            <div className="text-[9.5px] text-slate-500 italic flex items-center gap-1.5 pt-1">
              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Chaque document est examiné sous un délai réglementaire de 24 heures par l'administration des opérations.</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "4. Téléchargement de l'Application Mobile",
      subtitle: "L'expérience GoMoto RDC optimisée et hors-ligne",
      colorClass: "text-blue-400",
      accentBg: "bg-blue-500/10 border-blue-500/20",
      icon: <Download className="w-12 h-12 text-blue-400 animate-pulse" />,
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            Pour une utilisation simplifiée sur la route et à faible débit :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono">Option PWA Ultra-Légère</span>
              <h6 className="font-extrabold text-white text-xs">Directement via Navigateur</h6>
              <p className="text-[10px] text-slate-450 leading-relaxed">
                Appuyez sur "Ajouter à l'écran d'accueil" depuis les options de Google Chrome ou Safari. L'application s'installera instantanément sans passer par le store et sauvegarde vos cartes locales.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Fichier APK</span>
              <h6 className="font-extrabold text-white text-xs">Lien direct de téléchargement</h6>
              <p className="text-[10px] text-slate-450 leading-relaxed">
                Un paquet d'installation APK compressé pour Android de moins de 6 Mo est disponible auprès des coordinateurs de zone ou téléchargeable directement sur nos portails de support.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "Prêt pour l'aventure !",
      subtitle: "Votre compte GoMoto RDC est validé et prêt à l'emploi",
      colorClass: "text-[#10b981]",
      accentBg: "bg-emerald-500/10 border-emerald-500/20",
      icon: <ShieldCheck className="w-14 h-14 text-emerald-400" />,
      content: (
        <div className="space-y-4 text-slate-300 text-sm text-center">
          <p className="leading-relaxed max-w-md mx-auto">
            Félicitations ! Vous disposez désormais de tous les outils requis pour naviguer, réserver ou administrer vos flottes de motos à travers toute la République Démocratique du Congo.
          </p>
          <div className="py-3 px-5 bg-slate-900 border border-slate-805 rounded-xl max-w-sm mx-auto text-left space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Cartographie GPS Active (Calculs optimisés)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Double devises CDF et USD supportée</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Système de détresse SOS connecté PNC d'État</span>
            </div>
          </div>
          <p className="text-[10.5px] text-slate-500">
            En continuant, vous attestez adhérer aux Conditions Générales d'Utilisation ainsi qu'au Code de la Route Congolais (Loi n° 78/022).
          </p>
        </div>
      )
    }
  ];

  const faqItems: FAQItem[] = [
    {
      id: "t1",
      category: "tarifs",
      question: "Comment est calculé le prix d'une course sur GoMoto RDC ?",
      answer: "Nos tarifs sont standardisés et calculés de manière équitable selon la distance réelle parcourue (mesurée par balise GPS). Plus de tracas au bord de la route : le montant exact s'affiche sur votre simulateur avant le départ. Le barème prévoit un forfait de base minimal complété par un coût calculé au kilomètre."
    },
    {
      id: "t2",
      category: "tarifs",
      question: "Quelle est la part reversée au partenaire motard ?",
      answer: "GoMoto RDC applique une répartition éthique ultra-équitable de 85/15. Le partenaire motard conserve 85% de la course brute pour rentabiliser son activité et couvrir ses frais d'entretien. GoMoto ne prélève qu'une redevance technologique de 15% pour soutenir le serveur, le GPS et l'assistance technique."
    },
    {
      id: "s1",
      category: "securite",
      question: "Qu'est-ce que le système de détresse SOS en temps réel ?",
      answer: "En cas de déviation imprévue ou d'urgence de sécurité, un bouton SOS d'alerte immédiate est intégré à l'application. Une pression de 2 secondes envoie instantanément la position GPS de la moto, l'identité du chauffeur et la plaque du véhicule à notre centre d'assistance et établit un canal de priorité vers la Police Nationale Congolaise (PNC)."
    },
    {
      id: "s2",
      category: "securite",
      question: "Comment s'assurer de la moralité et de l'aptitude des motards ?",
      answer: "Chaque chauffeur rejoint le réseau après vérification d'un profil strict : il doit déposer son casier judiciaire exempt d'infraction pénale, un permis officiellement certifié, réussir un entretien d'évaluation physique et signer la charte de civisme routier de GoMoto."
    },
    {
      id: "d1",
      category: "documents",
      question: "Quels documents administratifs sont requis pour l'homologation ?",
      answer: "Les motards doivent télécharger quatre documents obligatoires : 1. Une pièce d'identité valide (Carte d'Électeur ou Passeport), 2. Le Permis de Conduire national de catégorie A, 3. Un certificat de bonne vie et mœurs récent fourni par leur maison communale ou parquet, et 4. Des garanties de propriété ou d'immatriculation."
    },
    {
      id: "d2",
      category: "documents",
      question: "Où obtenir mon certificat de bonne vie et mœurs en RDC ?",
      answer: "Le certificat s'obtient auprès de la commune de votre lieu de résidence légale (Bureau de la population/Hôtel de Ville) ou en remplissant une requête au parquet civil près le Tribunal de Grande Instance compétent de votre district."
    },
    {
      id: "a1",
      category: "application",
      question: "Comment télécharger ou installer l'application mobile ?",
      answer: "Pour éviter l'encombrement du Google Play Store, ouvrez GoMoto Web depuis Chrome ou Safari sur votre mobile, et choisissez l'option 'Ajouter à l'écran d'accueil'. Cela crée une Progressive Web App (PWA) de moins de 1 Mo, fonctionnelle hors-ligne avec stockage local."
    }
  ];

  const filteredFaqs = useMemo(() => {
    return faqItems.filter(item => {
      const matchCat = activeFaqCat === "all" || item.category === activeFaqCat;
      const matchSearch = item.question.toLowerCase().includes(faqSearch.toLowerCase()) || 
                          item.answer.toLowerCase().includes(faqSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [faqSearch, activeFaqCat]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCompleteOnboarding = () => {
    localStorage.setItem(`gomoto_onboarding_shown_${userId}`, "true");
    onClose();
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-3 font-sans">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col text-white animate-in fade-in zoom-in-95 duration-200 max-h-[92vh]">
        
        {/* UPPER Glow Aura */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-blue-500/10 blur-[80px] pointer-events-none rounded-full" />
        
        {/* HEADER & TABS SWITCHER */}
        <div className="p-4 pb-2 border-b border-slate-900 relative z-10">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <h4 className="text-[10px] font-black tracking-widest text-blue-400 uppercase font-mono">
                Centre d'aide interactif GoMoto
              </h4>
            </div>
            <button 
              onClick={handleCompleteOnboarding}
              className="text-slate-500 hover:text-slate-300 p-1 hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
              title="Fermer le guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Core Navigation Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-900/60 rounded-2xl border border-slate-850">
            <button
              onClick={() => setActiveTab("guide")}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "guide" 
                  ? "bg-slate-800 text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Guide d'Utilisation</span>
            </button>
            <button
              onClick={() => setActiveTab("faq")}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "faq" 
                  ? "bg-slate-800 text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Foire aux Questions (FAQ)</span>
            </button>
          </div>
        </div>

        {/* CONTAINER WORKSPACE FOR SELECTED TAB */}
        {activeTab === "guide" ? (
          /* ================== TAB: INTERACTIVE GUIDE ================== */
          <div className="flex-1 flex flex-col overflow-y-auto select-none">
            <div className="p-6 md:p-8 flex-1 flex flex-col items-center space-y-5 text-center">
              
              {/* Step Graphic Container */}
              <div className={`p-4 rounded-3xl border ${currentStepData.accentBg} flex items-center justify-center transition-all duration-300`}>
                {currentStepData.icon}
              </div>

              {/* Title Content */}
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-lg font-black text-white tracking-tight">
                  {currentStepData.title}
                </h3>
                <p className="text-[11.5px] text-slate-400 font-medium">
                  {currentStepData.subtitle}
                </p>
              </div>

              {/* Interactive Slide Body */}
              <div className="w-full text-left pt-1.5 flex-1">
                {currentStepData.content}
              </div>
            </div>

            {/* Guide Step Actions */}
            <div className="bg-slate-950/60 p-4 border-t border-slate-900 flex items-center justify-between px-6 shrink-0">
              
              {/* Back Action button */}
              <button
                type="button"
                disabled={currentStep === 0}
                onClick={handlePrev}
                className="px-4 py-2.5 rounded-2xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Précédent</span>
              </button>

              {/* Step indicator progress dots */}
              <div className="flex items-center gap-1.5">
                {steps.map((_, idx) => (
                  <span 
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      currentStep === idx 
                        ? "w-5 bg-blue-500" 
                        : "w-1.5 bg-slate-800 hover:bg-slate-700"
                    }`}
                  />
                ))}
              </div>

              {/* Advance Action button */}
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/10"
              >
                <span>{currentStep === steps.length - 1 ? "Prêt !" : "Suivant"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          </div>
        ) : (
          /* ================== TAB: DYNAMIC FAQ ACCORDION ================== */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Search and Filters layout bar */}
            <div className="p-4 bg-slate-950 border-b border-slate-900 space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher une question (tarifs, SOS, documents...)"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 hover:bg-slate-900/85 focus:bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl text-xs placeholder:text-slate-550 focus:outline-none transition-all text-white"
                />
                {faqSearch && (
                  <button 
                    onClick={() => setFaqSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs text-sans font-bold"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {/* Categorised chips bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveFaqCat("all")}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all ${
                    activeFaqCat === "all" 
                      ? "bg-blue-500/15 border border-blue-500/30 text-blue-400" 
                      : "bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Tous
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFaqCat("tarifs")}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all flex items-center gap-1 ${
                    activeFaqCat === "tarifs" 
                      ? "bg-amber-500/15 border border-amber-500/30 text-amber-400" 
                      : "bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Coins className="w-3 h-3" /> Tarifs & Payements
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFaqCat("securite")}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all flex items-center gap-1 ${
                    activeFaqCat === "securite" 
                      ? "bg-red-500/15 border border-red-500/30 text-red-400" 
                      : "bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" /> Sécurité & SOS
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFaqCat("documents")}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all flex items-center gap-1 ${
                    activeFaqCat === "documents" 
                      ? "bg-purple-500/15 border border-purple-500/30 text-purple-400" 
                      : "bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FileText className="w-3 h-3" /> Documents officiels
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFaqCat("application")}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all flex items-center gap-1 ${
                    activeFaqCat === "application" 
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400" 
                      : "bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Smartphone className="w-3 h-3" /> Application PWA
                </button>
              </div>
            </div>

            {/* Accordion list viewport */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((item) => {
                  const isExpanded = expandedFaq === item.id;
                  let badge = "";
                  let badgeColor = "";
                  if (item.category === "tarifs") {
                    badge = "Tarifs";
                    badgeColor = "text-amber-400 bg-amber-400/5 border-amber-400/20";
                  } else if (item.category === "securite") {
                    badge = "Securité";
                    badgeColor = "text-red-400 bg-red-400/5 border-red-400/20";
                  } else if (item.category === "documents") {
                    badge = "Documents";
                    badgeColor = "text-purple-400 bg-purple-400/5 border-purple-400/20";
                  } else {
                    badge = "Application";
                    badgeColor = "text-emerald-400 bg-emerald-400/5 border-emerald-400/20";
                  }

                  return (
                    <div 
                      key={item.id}
                      className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                        isExpanded 
                          ? "bg-slate-900/60 border-slate-800" 
                          : "bg-slate-950 hover:bg-slate-900/20 border-slate-900"
                      }`}
                    >
                      {/* Accordion header button toggler */}
                      <button
                        type="button"
                        onClick={() => setExpandedFaq(isExpanded ? null : item.id)}
                        className="w-full p-4 flex items-start justify-between gap-3 text-left font-sans cursor-pointer focus:outline-none"
                      >
                        <div className="space-y-1.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider border ${badgeColor}`}>
                            {badge}
                          </span>
                          <h5 className="font-bold text-slate-100 text-[12.5px] leading-snug">
                            {item.question}
                          </h5>
                        </div>
                        <span className="text-slate-500 scale-90 shrink-0 p-1 bg-slate-900/50 rounded-xl">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4" />}
                        </span>
                      </button>

                      {/* Accordion body sliding with React standard or simple conditional */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 text-slate-350 text-[11.5px] leading-relaxed border-t border-slate-900 animate-in fade-in slide-in-from-top-1 duration-150">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center space-y-2">
                  <HelpCircle className="w-10 h-10 text-slate-650 mx-auto" />
                  <h6 className="text-xs font-bold text-slate-400">Aucun résultat trouvé</h6>
                  <p className="text-[11px] text-slate-550 max-w-sm mx-auto">
                    Ajustez vos mots clés de recherche pour trouver la réponse concernant GoMoto (p.ex. "permis", "SOS", "PWA", "85%").
                  </p>
                </div>
              )}
            </div>

            {/* Support hotline contact */}
            <div className="bg-slate-950 p-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Centre d'Aide Certifié Loi RDC</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                <span className="w-2 h-2 rounded bg-emerald-500 animate-pulse" />
                <span>Support Permanent : 89 222 (Kin)</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
