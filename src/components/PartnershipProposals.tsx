import React, { useState } from "react";
import { 
  FileText, 
  Building, 
  Copy, 
  Check, 
  Download, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Smartphone, 
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
  Printer,
  Send,
  Loader2
} from "lucide-react";

interface PartnershipProposalsProps {
  onClose?: () => void;
}

export default function PartnershipProposals({ onClose }: PartnershipProposalsProps) {
  // Customizable business variables
  const [directorName, setDirectorName] = useState("Patient MBUYI");
  const [companyName, setCompanyName] = useState("GoMoto RDC SAS");
  const [headquarters, setHeadquarters] = useState("Avenue de la Justice, No. 14, Commune de la Gombe, Kinshasa, RDC");
  const [phone, setPhone] = useState("+243 821 513 114");
  const [email, setEmail] = useState("contact@gomotordc.cd");
  const [rccmNumber, setRccmNumber] = useState("CD/KIN/RCCM/26-B-0418");
  const [idNat, setIdNat] = useState("01-93-N11849K");
  const [currentDate, setCurrentDate] = useState(() => {
    return new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  });

  const [activeLetter, setActiveLetter] = useState<"state" | "momo" | "telecom">("state");
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Interactive Email Panel Simulation
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailComment, setEmailComment] = useState("");
  const [emailSteps, setEmailSteps] = useState<string[]>([]);
  const [emailStepIndex, setEmailStepIndex] = useState(-1);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // Helper to copy text to clipboard
  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  // Helper to simulate download
  const handleSimulateDownload = (title: string, content: string) => {
    setDownloading(true);
    setTimeout(() => {
      const element = document.createElement("a");
      const file = new Blob([content], { type: "text/plain;charset=utf-8" });
      element.href = URL.createObjectURL(file);
      element.download = `${title.toLowerCase().replace(/\s+/g, "_")}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      setDownloading(false);
    }, 1000);
  };

  // LETTER 1: STATE CONGOLESE (Ministère des Transports & Hôtel de Ville)
  const stateLetterTitle = "Lettre d'Intégration & Plaidoyer de Régularisation du Secteur Moto";
  const stateLetterBody = `${companyName}
Département des Affaires Publiques & Réglementaires
Siège Social : ${headquarters}
Immatriculation RCCM : ${rccmNumber} | ID. NAT : ${idNat}
Téléphone : ${phone} | E-mail : ${email}

Kinshasa, le ${currentDate}

À l'attention de Monsieur le Ministre provincial des Transports, Voies de Communication et de Désenclavement
Hôtel de Ville de Kinshasa
République Démocratique du Congo

Objet : Plaidoyer pour l'intégration de la tech GoMoto et contribution à l'assainissement fiscal et sécuritaire du transport motorisé de Kinshasa

Monsieur le Ministre,

C'est avec un profond respect civique que nous, représentants de la société ${companyName}, venons auprès de votre autorité solliciter l'ouverture d'un cadre d'évaluation technique pour accompagner la politique provinciale d'assainissement urbain du transport public par taxi-moto.

Comme vous le savez, la ville-province de Kinshasa fait face à une expansion informelle critique du secteur des conducteurs de taxi-moto (familièrement appelés les « Wewa »). Cette inorganisation engendre des défis sécuritaires importants (accidentalité accrue, criminalité sous couverture d'anonymat) et une évasion fiscale quasi-totale des taxes d'État telles que la Vignette provinciale, l'Autorisation de transport urbain, et l'impôt sur les revenus locatifs des propriétaires d'engins.

En réponse à ces défis majeurs pour lesquels Votre Excellence déploie des efforts admirables, GoMoto RDC a conçu une solution technologique souveraine, intégrant des critères stricts approuvés par le Code de la Route congolais (Loi n° 78/022) :

1. Enregistrement Civil Verrouillé & Certifié : Aucun chauffeur n'est actif sur notre plateforme sans une validation légale de ses pièces (Permis Catégorie A, Carte d'Électeur, Attestation d'Assurance).
2. Conduite Encadrée par Géofencing GPS : Nous excluons de manière logicielle rigoureuse toute circulation dans les zones interdites de la Commune de la Gombe et du Boulevard du 30 Juin, éliminant les interpellations anarchiques et le désordre urbain.
3. Prélèvement Fiscal Collecté à la Source : GoMoto propose un canal d'arbitrage fiscal automatisé permettant de prélever de manière transparente les vignettes provinciales et taxes de stationnement à chaque course, afin de reverser mensuellement ces recettes directement dans les caisses de la DGRK (Direction Générale des Recettes de Kinshasa).
4. Sécurité Publique & Protection Individuelle : Tous nos conducteurs sont équipés de deux casques réglementaires (pour le pilote et le passager) et d'un bouton SOS d'alerte en temps réel relié à nos serveurs de contrôle.

Nous vous demandons humblement d'accorder à notre structure un protocole d'accord d'expérimentation (Sandbox Réglementaire) pour digitaliser, identifier et légitimer le transport des motards dans un écosystème digne, moderne et sécurisé, contribuant de ce fait au budget de développement de notre nation.

Dans l'attente d'une audience bilatérale dans les délais qu'il vous plaira de fixer, veuillez agréer, Monsieur le Ministre, l'assurance de notre dévouement républicain le plus entier.

Pour ${companyName},

__________________________
${directorName}
Directeur Général et Porteur de Projet`;

  // LETTER 2: MOBILE MONEY (Orange Money, M-Pesa, Airtel Money)
  const momoLetterTitle = "Proposition Contractuelle d'Intégration Mobile Money Apport de Comptes";
  const momoLetterBody = `${companyName}
Département FinTech & Passerelles de Paiement
Siège Social : ${headquarters}
RCCM : ${rccmNumber} | ID. NAT : ${idNat}
Téléphone : ${phone} | E-mail : ${email}

Kinshasa, le ${currentDate}

À l'attention de Monsieur le Directeur Général
[Insérer : Vodacash SA (M-Pesa) / Orange Money RDC S.A. / Airtel Money RDC S.A.]
R&D et Partenariats Stratégiques
Kinshasa, Gombe
République Démocratique du Congo

Objet : Proposition d'accord de partenariat exclusif de co-distribution et d'interconnexion API pour la bancarisation solidaire des artisans du transport routier par GoMoto RDC

Monsieur le Directeur Général,

Le marché du transport informel à deux roues à Kinshasa et dans les grandes provinces congolaises représente un volume transactionnel quotidien en espèces estimé à plusieurs millions de dollars américains, demeurant totalement en dehors de l'économie formelle et du circuit de vos portefeuilles de monnaie électronique.

Par la présente, la société ${companyName} vous propose une alliance stratégique d'interconnectivité financière à haute valeur ajoutée. Notre plateforme met en œuvre un modèle de transactions numériques exclusif nommé « Reparo » (Séquestre de Sécurité des Trajets), assurant que le passager prépaye numériquement sa course avant le démarrage du véhicule.

Ce partenariat est un levier majeur de croissance organique pour votre institution financière pour plusieurs motifs critiques :

1. Acquisition massive et pérenne de nouveaux clients : Pour recevoir leurs gains, chacun des milliers de conducteurs (« motards ») affiliés à GoMoto a l'obligation contractuelle d'activer un compte Mobile Money enregistré et opérationnel à son nom civil. Nous nous érigeons ainsi en premier guichet d'enregistrement physique pour votre réseau sur des cibles historiquement non bancarisées.
2. Augmentation exponentielle du volume global des dépôts : Les clients de notre plateforme effectuent des recharges de fonds directes depuis votre réseau vers notre API pour créditer leur solde de transport.
3. Fluidité technique par API directes : Nous sollicitons l'accès à vos passerelles d'intégration directe de production (APIs de Cash-In, Cash-Out et Push-STK) à un taux préférentiel négocié de commissionnement fixe (0.5% à 1% maximum) pour ne pas grever le pouvoir d'achat des chauffeurs.
4. Co-Branding de terrain : Campagnes de sensibilisation conjointes dans les ronds-points de Kinshasa et habillage des casques de protection arborant les couleurs de l'opérateur et de GoMoto.

Nous sommes convaincus que la transition numérique de ce secteur passe par une intégration harmonieuse et dynamique de nos plateformes respectives. Nous nous tenons à votre entière disposition pour vous présenter notre démonstrateur technologique et formuler les clauses de notre protocole d'accord transactionnel.

Veuillez recevoir, Monsieur le Directeur Général, l'expression de nos salutations distinguées et de notre haute considération économique.

Pour ${companyName},

__________________________
${directorName}
Directeur Général et Porteur de Projet`;

  // LETTER 3: TELECOM PROVIDERS (Secure Internet Package)
  const telecomLetterTitle = "Accord de Fourniture d'Option Internet Datée & APN Sécurisé pour Chauffeurs";
  const telecomLetterBody = `${companyName}
Département Technique & Infrastructures Télécoms
Siège Social : ${headquarters}
RCCM : ${rccmNumber} | ID. NAT : ${idNat}
Téléphone : ${phone} | E-mail : ${email}

Kinshasa, le ${currentDate}

À l'attention de Monsieur le Directeur Commercial Entreprises & Réseaux
[Insérer : Vodacom Congo RDC / Airtel RDC / Orange RDC]
Direction Commerciale B2B / Solutions Secteurs Mobiles
Kinshasa, Gombe
République Démocratique du Congo

Objet : Proposition d'accord-cadre pour la fourniture d'une flotte de connexion Internet Pro prioritaire cryptée avec APN dédié pour les conducteurs de taxi-moto GoMoto

Monsieur le Directeur B2B,

Le fonctionnement robuste d'une solution de transport connecté en zone urbaine dépend de la qualité de la couverture internet des terminaux mobiles de nos chauffeurs partenaires. Ces derniers doivent pouvoir transmettre leur position GPS en temps réel à nos serveurs de calcul, recevoir instantanément les courses demandées par les passagers et déclencher des alertes SOS en cas d'agression physique ou d'accident.

Néanmoins, les conditions du réseau cellulaire grand public subissent des aléas d'encombrement pénalisants dans de nombreuses contrées de la capitale. Pour pallier cela, notre société ${companyName} vous propose de souscrire à une offre de connectivité professionnelle packagée, spécialement configurée pour les flottes de chauffeurs GoMoto.

Nos spécifications clés d'accord-cadre portent sur :

1. Un Pack Télécom Mensuel Pro Préférentiel : Nous sollicitons un tarif exclusif de lot de données (Data Bundle) mensuel illimité ou plafonné de manière forfaitaire, facturable à hauteur de 12 500 Couronnes Fiscales / FC (environ $5.00 USD) par mois et par motard.
2. Configuration d'un APN (Access Point Name) Privé & Sécurisé : Une configuration réseau VPN/APN isolée (« gomoto.apn ») pour offrir un canal d'ondes prioritaire, même en cas de congestion saturée du réseau mobile général standard de Kinshasa. Cela assure la pérennité absolue de la localisation d'urgence et du traçage policier sécurisé.
3. Option de Facturation Intégrée : Les frais peuvent être directement débités à la source depuis les portefeuilles virtuels GoMoto de nos conducteurs et reversés de manière consolidée par virement pro à votre banque commerciale. Alternativement, ils sont pris en charge contractuellement par GoMoto en guise d'avantage social de recrutement.
4. Canaux d'activation en vrac : Un terminal de commande rapide géré au sein du tableau de bord de l'application mobile en direct pour que le chauffeur puisse souscrire ou modifier son renouvellement d'un simple geste tactile.

Ce partenariat mutuel ouvrira la porte à l'adhésion d'une communauté soudée de milliers de transporteurs indépendants, consommant de la bande passante de manière régulière d'un bout à l'autre de l'année.

Nous souhaitons convenir d'une réunion au sein de vos bureaux de la Gombe afin de valider la faisabilité technique de l'APN dédié et d'édicter la tarification finale de la convention commerciale.

Nous vous prions d'agréer, Monsieur le Directeur, l'expression de nos sentiments distingués.

Pour ${companyName},

__________________________
${directorName}
Directeur Général et Porteur de Projet`;

  const getLetterContent = () => {
    if (activeLetter === "state") return { title: stateLetterTitle, text: stateLetterBody };
    if (activeLetter === "momo") return { title: momoLetterTitle, text: momoLetterBody };
    return { title: telecomLetterTitle, text: telecomLetterBody };
  };

  const currentLetterInfo = getLetterContent();

  // Auto-fill recipient email and subject lines according to chosen partner
  const handleOpenEmailModal = () => {
    let toEmail = "transports@hoteldeville.cd";
    let defaultSubject = `Proposition de Partenariat Stratégique - GoMoto RDC & Ville de Kinshasa`;
    let coverLetter = `Monsieur le Secrétaire Général,\n\nVeuillez trouver ci-joint notre dossier complet de proposition d'expérimentation technologique (Sandbox réglementaire) pour l'intégration de la technologie GoMoto et le cryptage de la flotte de taxi-motos à Kinshasa.\n\nCordialement,\n${directorName}\nDirecteur Général, GoMoto RDC SAS`;
    
    if (activeLetter === "momo") {
      toEmail = "partnerships-b2b@vodacash.cd";
      defaultSubject = `Intégration APIs Directes FinTech GoMoto - Vodacash RDC S.A.`;
      coverLetter = `Monsieur le Directeur Général de Vodacash SA / Orange Money,\n\nNous vous prions de prendre connaissance de notre proposition de partenariat Fintech. Nous souhaitons intégrer vos APIs de production en vue d'assurer le dispatching financier des commissions GoMoto.\n\nSincèrement,\n${directorName}\nGoMoto RDC SAS`;
    } else if (activeLetter === "telecom") {
      toEmail = "corporate-solutions@vodacom.cd";
      defaultSubject = `Accord-Cadre Forfait Internet Chauffeurs APN Privé - GoMoto`;
      coverLetter = `Monsieur le Directeur National Solutions B2B,\n\nVous trouverez ci-joint notre proposition d'accord pour la livraison d'un forfait Internet Pro crypté à destination de notre flotte de conducteurs de taxi-moto.\n\nSalutations respectueuses,\n${directorName}\nGoMoto RDC SAS`;
    }
    
    setEmailTo(toEmail);
    setEmailSubject(defaultSubject);
    setEmailComment(coverLetter);
    setEmailSteps([]);
    setEmailStepIndex(-1);
    setIsSendingEmail(false);
    setEmailSentSuccess(false);
    setShowEmailModal(true);
  };

  const handleSendEmailSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);
    setEmailSentSuccess(false);
    
    const steps = [
      "Initialisation de la connexion sécurisée SMTP (SSL/TLS sur le port 465)...",
      "Génération du document PDF chiffré aux normes de sécurité GoMoto...",
      "Traitement des métadonnées et attachement du pli d'incorporation...",
      "Acheminement du courrier vers les passerelles de l'opérateur distant...",
      "Transmission validée par le proxy gouvernemental de la RDC.",
    ];

    setEmailSteps([]);
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < steps.length) {
        setEmailSteps(prev => [...prev, steps[currentIndex]]);
        setEmailStepIndex(currentIndex);
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsSendingEmail(false);
        setEmailSentSuccess(true);
      }
    }, 950);
  };

  // Helper to generate the exact letter formatting in a pristine PDF print view
  const handlePrintPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Blocage de fenêtres intempestives détecté. Veuillez autoriser les fenêtres pop-up pour imprimer ou enregistrer en PDF.");
      return;
    }
    
    const letterContent = getLetterContent();
    const formattedText = letterContent.text.replace(/\n/g, '<br />');

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${letterContent.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;600;800&display=swap');
            
            body {
              font-family: 'Playfair Display', Georgia, serif;
              color: #111827;
              line-height: 1.6;
              font-size: 14px;
              margin: 0;
              padding: 0;
              background-color: #ffffff;
            }
            .a4-page {
              padding: 50px 60px;
              max-width: 800px;
              margin: 0 auto;
              position: relative;
              background: #ffffff;
            }
            .top-stripe {
              height: 6px;
              background: #eab308;
              width: 100%;
              position: absolute;
              top: 0;
              left: 0;
            }
            .header-layout {
              font-family: 'Inter', sans-serif;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 18px;
              margin-bottom: 35px;
            }
            .logo-area {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .logo-badge {
              background: #111827;
              color: #eab308;
              font-weight: 800;
              padding: 8px 12px;
              border-radius: 50%;
              font-size: 14px;
            }
            .logo-text {
              display: flex;
              flex-direction: column;
            }
            .company-title {
              font-weight: 800;
              font-size: 13px;
              text-transform: uppercase;
              color: #111827;
              margin: 0;
            }
            .company-sub {
              font-size: 9px;
              color: #6b7280;
              text-transform: uppercase;
              font-weight: 600;
              margin: 0;
            }
            .confidential-tag {
              font-size: 9px;
              font-family: monospace;
              color: #9ca3af;
              font-weight: bold;
              border: 1px dashed #d1d5db;
              padding: 4px 8px;
              border-radius: 4px;
            }
            .letter-content {
              white-space: pre-wrap;
              color: #1f2937;
              text-align: justify;
            }
            .footer-notes {
              font-family: 'Inter', sans-serif;
              margin-top: 60px;
              border-top: 1px solid #e5e7eb;
              padding-top: 15px;
              text-align: center;
              font-size: 9px;
              color: #9ca3af;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            @media print {
              body {
                background-color: #ffffff;
                color: #000000;
              }
              .a4-page {
                box-shadow: none;
                padding: 30px;
              }
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="a4-page">
            <div class="top-stripe"></div>
            <div class="header-layout">
              <div class="logo-area">
                <div class="logo-badge">GM</div>
                <div class="logo-text">
                  <span class="company-title">${companyName}</span>
                  <span class="company-sub">Solutions Logistiques RDC</span>
                </div>
              </div>
              <div class="confidential-tag">DOCUMENT PROPOSITIONNEL CONFIDENTIEL</div>
            </div>
            
            <div class="letter-content">${letterContent.text}</div>
            
            <div class="footer-notes font-sans">
              <strong>Document d'Arbitrage et d'Apport d'Affaires • ${companyName}</strong><br />
              Kinshasa, Congo-Kinshasa • Régime fiscal d'immatriculation d'État
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };


  return (
    <div id="partnership-proposals-root" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in text-slate-100 font-sans">
        
        {/* HEADER */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm flex justify-between items-center flex-shrink-0">
          <div>
            <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block mb-0.5">📂 KIT ADMIN & BUSINESS DEVELOPMENT</span>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-500" />
              <span>Dossier des Lettres Administratives & Partenariats RDC</span>
            </h2>
          </div>
          
          <button 
            type="button" 
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold transition-all cursor-pointer"
          >
            Fermer le Kit
          </button>
        </div>

        {/* CONTAINER WORKSPACE */}
        <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
          
          {/* LEFT SIDE PANEL: CUSTOMIZER FORM */}
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-800 p-5 overflow-y-auto space-y-4 flex-shrink-0 bg-slate-950/40">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 mb-1 text-yellow-500">
                <Briefcase className="w-4 h-4" />
                <span>Personnaliser l'en-tête</span>
              </h3>
              <p className="text-[10px] text-slate-400">
                Modifiez ces données pour mettre à jour instantanément les variables à l'intérieur des lettres de présentation.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[8.5px] font-black text-slate-450 uppercase mb-1">Directeur / Porteur de Projet</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-500 text-xs"><User className="w-3.5 h-3.5" /></span>
                  <input
                    type="text"
                    value={directorName}
                    onChange={(e) => setDirectorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-yellow-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8.5px] font-black text-slate-450 uppercase mb-1">Nom de l'Entreprise</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-500 text-xs"><Building className="w-3.5 h-3.5" /></span>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-yellow-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8.5px] font-black text-slate-450 uppercase mb-1">Siège Commercial Kinshasa</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-500 text-xs"><MapPin className="w-3.5 h-3.5" /></span>
                  <textarea
                    rows={2}
                    value={headquarters}
                    onChange={(e) => setHeadquarters(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-yellow-500 leading-normal font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8.5px] font-black text-slate-450 uppercase mb-1">Téléphone RDC</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-yellow-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[8.5px] font-black text-slate-450 uppercase mb-1">Adresse E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-yellow-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8.5px] font-black text-slate-450 uppercase mb-1">Numéro RCCM d'État</label>
                  <input
                    type="text"
                    value={rccmNumber}
                    onChange={(e) => setRccmNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[10px] text-white outline-none focus:border-yellow-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[8.5px] font-black text-slate-450 uppercase mb-1">Identifiant National IDNAT</label>
                  <input
                    type="text"
                    value={idNat}
                    onChange={(e) => setIdNat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[10px] text-white outline-none focus:border-yellow-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8.5px] font-black text-slate-450 uppercase mb-1">Date d'évaluation</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-500 text-xs"><Calendar className="w-3.5 h-3.5" /></span>
                  <input
                    type="text"
                    value={currentDate}
                    onChange={(e) => setCurrentDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-yellow-500"
                  />
                </div>
              </div>
            </div>

            {/* QUICK FOOTNOTE */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl space-y-1 text-[9px] text-slate-400">
              <span className="font-extrabold text-yellow-500 flex items-center gap-1 uppercase tracking-wider block">
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Régularité Juridique :</span>
              </span>
              <p className="leading-normal">
                En RDC, pour que ces lettres aient un poids juridique officiel, elles doivent être imprimées sur du papier à en-tête d'une société commerciale immatriculée, dument signées et revêtues du cachet humide d'entreprise.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE WORKSPACE: LETTERS CONTROLLER & VEIWER */}
          <div className="flex-grow flex flex-col overflow-hidden bg-slate-950/20">
            
            {/* TABS INTERFACE */}
            <div className="p-3 border-b border-slate-800 bg-slate-900/30 flex flex-wrap gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveLetter("state")}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border transition-all flex items-center gap-2 ${
                  activeLetter === "state"
                    ? "bg-yellow-500 text-slate-950 border-yellow-500 font-extrabold shadow-sm"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                <span>🏢</span>
                <span>Lettre d'État Congolais</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveLetter("momo")}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border transition-all flex items-center gap-2 ${
                  activeLetter === "momo"
                    ? "bg-yellow-500 text-slate-950 border-yellow-500 font-extrabold shadow-sm"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                <span>💸</span>
                <span>Contrat Mobile Money</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveLetter("telecom")}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border transition-all flex items-center gap-2 ${
                  activeLetter === "telecom"
                    ? "bg-yellow-500 text-slate-950 border-yellow-500 font-extrabold shadow-sm"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                <span>📶</span>
                <span>Accord Télécom Internet</span>
              </button>
            </div>

            {/* ADMONITION & QUICK COPY BANNER */}
            <div className="bg-slate-900/60 p-3 px-5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-shrink-0 text-slate-100 font-sans">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div className="text-left">
                  <h4 className="text-[11px] font-extrabold text-white uppercase tracking-wider mb-0.5">{currentLetterInfo.title}</h4>
                  <p className="text-[10px] text-slate-400 leading-none">Contenu formaté en direct selon les normes épistolaires privées-publiques de la RDC.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleCopyToClipboard(currentLetterInfo.text, activeLetter)}
                  className="flex-1 sm:flex-none uppercase text-[8.5px] font-black tracking-widest px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedType === activeLetter ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                      <span className="text-emerald-400">Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateDownload(currentLetterInfo.title, currentLetterInfo.text)}
                  disabled={downloading}
                  className="flex-1 sm:flex-none uppercase text-[8.5px] font-black tracking-widest px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className={`w-3.5 h-3.5 ${downloading ? "animate-bounce" : ""}`} />
                  <span>{downloading ? "Dématérialisé..." : "TXT"}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintPDF}
                  className="flex-1 sm:flex-none uppercase text-[8.5px] font-black tracking-widest px-3 py-1.5 rounded-lg bg-yellow-500 text-slate-950 hover:bg-yellow-450 flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenEmailModal}
                  className="flex-1 sm:flex-none uppercase text-[8.5px] font-black tracking-widest px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-505 text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer par E-mail</span>
                </button>
              </div>
            </div>

            {/* BODY DISPLAY PREVIEW */}
            <div className="flex-grow p-6 overflow-y-auto bg-[#030712] border-t border-slate-900/60 flex justify-center">
              <div className="w-full max-w-3xl bg-white text-slate-900 font-serif border border-slate-200 rounded-2xl shadow-xl p-8 sm:p-10 text-left text-xs sm:text-sm leading-relaxed whitespace-pre-wrap relative min-h-[140%] md:min-h-0">
                
                {/* Simulated Letterhead Line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow-500 rounded-t-2xl"></div>

                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 font-sans">
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-full bg-slate-950 flex items-center justify-center font-black text-[13px] text-yellow-500 font-sans tracking-tight">GM</span>
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-900 uppercase block leading-none">{companyName}</span>
                      <span className="text-[8px] text-slate-500 uppercase leading-none mt-0.5 font-bold">Solutions Logistiques RDC</span>
                    </div>
                  </div>
                  <div className="text-right text-[8px] font-mono font-bold text-slate-400">
                    <span>DOCUMENT PROPOSITIONNEL CONFIDENTIEL</span>
                  </div>
                </div>

                {currentLetterInfo.text}

                <div className="mt-12 pt-6 border-t border-slate-200 text-center text-[9px] font-sans text-slate-400 space-y-1">
                  <p className="font-extrabold uppercase text-slate-500">Document d'Arbitrage et d'Apport d'Affaires • GoMoto RDC SAS</p>
                  <p>Kinshasa, Congo-Kinshasa • Régime fiscal d'immatriculation d'État</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* MODAL SIMULATION ENVOI EMAIL */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in text-slate-100 font-sans">
              
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-800 bg-slate-950/20 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Send className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-black text-yellow-500 uppercase tracking-widest leading-none">Transmission Directe</h3>
                    <h2 className="text-sm font-black text-white mt-1">Lancer l'expédition officielle RDC</h2>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowEmailModal(false)}
                  className="p-1 px-2.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer"
                >
                  Annuler
                </button>
              </div>

              {/* Form & Simulation Steps Content */}
              <form onSubmit={handleSendEmailSimulation} className="p-5 space-y-4">
                
                {/* Inputs if not sent yet */}
                {!emailSentSuccess && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[8.5px] font-black text-slate-400 uppercase tracking-wider">Destinataire d'État / Entreprise</label>
                      <input 
                        type="email" 
                        required
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-yellow-500 font-mono"
                        placeholder="destinataire@office-pro.cd"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8.5px] font-black text-slate-400 uppercase tracking-wider">Sujet de Transmission officielle</label>
                      <input 
                        type="text" 
                        required
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-yellow-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8.5px] font-black text-slate-400 uppercase tracking-wider">Message de Couverture accompagnant le PDF</label>
                      <textarea 
                        rows={4}
                        value={emailComment}
                        onChange={(e) => setEmailComment(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white leading-relaxed outline-none focus:border-yellow-500 font-sans"
                      />
                    </div>

                    <div className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex items-start gap-2.5">
                      <span className="text-yellow-500 mt-0.5">🔒</span>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        La lettre active, intitulée <strong className="text-slate-200">« {currentLetterInfo.title} »</strong>, sera automatiquement compilée électroniquement à la volée comme pièce jointe certifiée au format PDF.
                      </p>
                    </div>
                  </>
                )}

                {/* Simulated SMTP Connection Progress Bar / Logs */}
                {isSendingEmail && (
                  <div className="space-y-3 py-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 font-bold"><Loader2 className="w-3.5 h-3.5 text-yellow-500 animate-spin" /> Routage IP RDC en cours...</span>
                      <span className="font-mono font-bold text-yellow-500">{Math.round(((emailStepIndex + 1) / 5) * 100)}%</span>
                    </div>
                    
                    {/* Simulated Loading Bar */}
                    <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 transition-all duration-700 ease-out" 
                        style={{ width: `${((emailStepIndex + 1) / 5) * 100}%` }}
                      ></div>
                    </div>

                    {/* Step Logs Console */}
                    <div className="bg-slate-950 border border-slate-805 p-3.5 rounded-2xl font-mono text-[9px] text-slate-400 space-y-1 leading-relaxed">
                      {emailSteps.map((step, idx) => (
                        <div key={idx} className="flex gap-1.5 items-start">
                          <span className="text-emerald-500">✔</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success Screen */}
                {emailSentSuccess && (
                  <div className="text-center py-6 space-y-4 animate-fade-in">
                    <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                      <Check className="w-7 h-7 text-emerald-500" />
                    </div>
                    
                    <div className="space-y-1.5 max-w-sm mx-auto">
                      <h3 className="text-base font-black text-white">Transmission Électronique Validée</h3>
                      <p className="text-xs text-slate-400">
                        Le courrier officiel a été routé avec succès et la proposition commerciale de GoMoto RDC a été délivrée.
                      </p>
                    </div>

                    <div className="bg-slate-950 border border-slate-805 p-4 rounded-2xl text-left font-mono text-[10.5px] space-y-2">
                      <div className="flex justify-between border-b border-slate-850/60 pb-1.5 grayscale-0 text-slate-500">
                        <span>SERVEUR SMTP</span>
                        <span className="text-white font-bold">GOMOTO-SMTP-02</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                        <span className="text-slate-500">DESTINATAIRE</span>
                        <span className="text-emerald-400 font-bold">{emailTo}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                        <span className="text-slate-500">ACCUSÉ ID</span>
                        <span className="text-yellow-500 font-bold">GMRDC-PROPOS-{(Math.random() * 1000000).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 pt-0.5">
                        <span>CONFIRMATION IP</span>
                        <span className="text-white font-bold">197.242.144.15 (DRC-Proxy)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer buttons for Modal */}
                <div className="pt-2 border-t border-slate-800 flex justify-end gap-2 bg-slate-950/10 p-2 rounded-b-2xl">
                  {!emailSentSuccess ? (
                    <button
                      type="submit"
                      disabled={isSendingEmail}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-505 disabled:bg-emerald-800 text-white font-black text-xs uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Simulation en cours...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Confirmer et Expédier</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowEmailModal(false)}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-widest cursor-pointer"
                    >
                      Terminer & Fermer
                    </button>
                  )}
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );

}
