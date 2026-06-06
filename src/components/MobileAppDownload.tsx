/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from "react";
import { 
  Smartphone, 
  Tablet, 
  Download, 
  Share2, 
  QrCode, 
  Info, 
  CheckCircle2, 
  Cpu, 
  AlertCircle, 
  Settings, 
  Zap, 
  Sparkles, 
  ArrowRight, 
  Check,
  Play,
  AppWindow
} from "lucide-react";

export default function MobileAppDownload() {
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadFinished, setDownloadFinished] = useState(false);
  const [selectedOS, setSelectedOS] = useState<"android" | "ios" | "pwa">("android");
  const [showQrCode, setShowQrCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const startApkDownload = () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadProgress(0);
    setDownloadFinished(false);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloading(false);
          setDownloadFinished(true);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);
  };

  const handleCopyLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div 
      id="gomoto-mobile-gateway" 
      className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm p-6 md:p-8 space-y-6 text-slate-800 text-left"
    >
      {/* Title & Introduction */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-blue-100">
            <Zap className="w-3 h-3 text-blue-600 fill-blue-600" />
            <span>Compatibilité Mobile Totale</span>
          </div>
          <h2 className="text-xl font-black text-blue-900 tracking-tight">
            Téléchargement & Installation Mobile (Android, iPhone & Tablettes)
          </h2>
          <p className="text-xs text-slate-500 leading-normal max-w-2xl">
            L'application <b>GoMoto RDC</b> est entièrement optimisée pour fonctionner sur l'ensemble du parc mobile congolais. Que vous possédiez un smartphone Android récent, un modèle d'importation sans services Google Play (Tecno, Infinix, Huawei), un iPhone ou une tablette de répartition, notre architecture assure un fonctionnement fluide et économe en données Internet.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">
            Version Active v2.8.5
          </span>
        </div>
      </div>

      {/* Selector Tabs (Android vs iOS vs PWA) */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-105 rounded-2xl border border-slate-200/60 max-w-md">
        <button
          type="button"
          onClick={() => setSelectedOS("android")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
            selectedOS === "android"
              ? "bg-white text-blue-700 shadow-sm border border-slate-200"
              : "text-slate-550 hover:text-slate-850"
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
          <span>Android</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedOS("ios")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
            selectedOS === "ios"
              ? "bg-white text-blue-700 shadow-sm border border-slate-200"
              : "text-slate-550 hover:text-slate-850"
          }`}
        >
          <Smartphone className="w-4 h-4 text-blue-500 fill-blue-500/20" />
          <span>iPhone / iPad</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedOS("pwa")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
            selectedOS === "pwa"
              ? "bg-white text-blue-700 shadow-sm border border-slate-200"
              : "text-slate-550 hover:text-slate-850"
          }`}
        >
          <AppWindow className="w-4 h-4 text-purple-500" />
          <span>Mode Web / Tablette</span>
        </button>
      </div>

      {/* Dynamic Tabs Content panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Specific OS Installation Procedures */}
        <div className="lg:col-span-7 space-y-5">
          {selectedOS === "android" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[9px] font-mono text-emerald-600 font-black uppercase tracking-wider block">
                  🚀 Solution Standard pour Téléphones Android RDC
                </span>
                <h3 className="font-bold text-xs text-slate-800">
                  Idéal pour toutes sortes de téléphones Android (Infinix, Tecno, Samsung, Itel, Huawei, Xiaomi)
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  En République Démocratique du Congo, le téléchargement direct d'APK est la méthode la plus rapide et la plus économique pour éviter les frais de bande passante du Play Store. Notre APK est pré-optimisé pour économiser votre forfait de données Mo (Mégaoctets).
                </p>

                {/* Primary Simulation Action for APK Download */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">FICHIER CONGOLAIS CERTIFIÉ :</span>
                      <span className="text-xs font-extrabold font-mono text-slate-700">
                        GoMoto_RDC_v2.8.5_prod.apk
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-650 px-2 py-0.5 rounded border">
                      Taille : 18.4 Mo
                    </span>
                  </div>

                  {!downloading && !downloadFinished ? (
                    <button
                      type="button"
                      onClick={startApkDownload}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>Télécharger l'APK Direct de GoMoto (Gratuit - 18 Mo)</span>
                    </button>
                  ) : downloading ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span>Téléchargement de l'APK en cours...</span>
                        <span>{downloadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-150 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-150"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 text-center italic">
                        Connexion sécurisée aux serveurs miroirs de Kinshasa et Lubumbashi...
                      </p>
                    </div>
                  ) : (
                    <div className="bg-emerald-50/60 border border-emerald-250 p-3.5 rounded-xl text-xs space-y-2 text-left">
                      <div className="flex items-center gap-2 text-emerald-800 font-black">
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                        <span>Téléchargement de l'APK Réussi !</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        Le fichier <b>GoMoto_RDC_v2.8.5_prod.apk</b> a été téléchargé avec succès sur votre stockage local. Pour l'installer sur votre téléphone de marque Infinix, Tecno ou autre, activez simplement l'option <i>"Autoriser l'installation d'applications de sources inconnues"</i> dans vos paramètres de sécurité Android.
                      </p>
                      <div className="pt-1.5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDownloadFinished(false)}
                          className="text-[9px] bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded hover:bg-slate-50 font-bold"
                        >
                          Réinstaller / Recommencer
                        </button>
                        <span className="text-[8.5px] text-slate-450 self-center font-mono uppercase bg-slate-100 rounded px-1.5 py-0.5">
                          MD5: bd2a18f40776bbecda8e
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Offline Xender/Bluetooth local transfer tips */}
              <div className="bg-blue-50/40 border border-blue-200/80 p-4.5 rounded-2xl text-xs text-slate-700 space-y-2.5">
                <div className="flex items-center gap-2 text-blue-800 font-bold">
                  <Share2 className="w-4 h-4 text-blue-600" />
                  <span>Le saviez-vous ? Partage hors-ligne via Xender ou Bluetooth 🤝</span>
                </div>
                <p className="leading-relaxed text-[11px] text-slate-600">
                  Dans les communes de Kinshasa (Bandal, Lemba, Gombe) ou Lubumbashi, nos motards partenaires partagent l'application GoMoto RDC de téléphone portable à téléphone portable en utilisant l'application <b>Xender</b> ou via <b>Bluetooth</b>. Cela ne consomme aucun mégaoctet d'Internet ! Une fois l'APK téléchargé ci-dessus, vous pouvez le partager gratuitement avec tous vos collègues chauffeurs de flotte ou passagers.
                </p>
              </div>

              {/* Troubleshooting Instructions */}
              <div className="border border-slate-150 rounded-2xl p-4 text-xs space-y-2">
                <span className="font-extrabold text-slate-750 uppercase text-[9.5px] block tracking-wide">
                  Instructions pour terminaux Android Chinois (sans Google Play) :
                </span>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-500 text-[11px] leading-relaxed">
                  <li>Ouvrez le gestionnaire de fichiers ou le dossier <i>Téléchargements</i> de votre téléphone.</li>
                  <li>Cliquez sur le fichier <b>GoMoto_RDC_v2.8.5_prod.apk</b>.</li>
                  <li>Si une alerte système s'affiche, cliquez sur <b>Paramètres</b> et cochez la case <b>"Autoriser depuis cette source"</b>.</li>
                  <li>Cliquez sur <b>Installer</b>. L'application est immédiatement prête à l'emploi avec authentification mobile !</li>
                </ol>
              </div>
            </div>
          )}

          {selectedOS === "ios" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[9px] font-mono text-blue-600 font-black uppercase tracking-wider block">
                  🍏 Solution Apple iOS pour iPhone & iPad
                </span>
                <h3 className="font-bold text-xs text-slate-800">
                  Installation rapide sur iPhone de toutes générations et Tablettes iPad
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  L'application GoMoto est disponible pour les utilisateurs d'iPhones. Nous offrons une double intégration : via l'App Store officiel ou via notre version Progressive Web App sécurisée qui s'ajoute directement sur votre écran d'accueil sans occuper d'espace de stockage physique inutile.
                </p>

                {/* Simulated App Store Badge Button */}
                <div className="flex flex-wrap gap-3">
                  <a 
                    href="#appstore" 
                    onClick={(e) => { e.preventDefault(); alert("Redirection simulée vers l'App Store Apple (GoMoto RDC Mobile client)..."); }}
                    className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-3 transition-transform hover:scale-102 cursor-pointer border border-slate-800 shadow-md"
                  >
                    <span className="text-xl">🍏</span>
                    <div className="text-left leading-tight">
                      <span className="text-[8.5px] uppercase block tracking-wider text-slate-400 font-medium font-mono">Télécharger dans l'</span>
                      <span className="text-xs font-black font-sans">App Store</span>
                    </div>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      alert("Pour installer GoMoto sur votre iPhone sans l'App Store :\n1. Ouvrez cette page sur Safari\n2. Appuyez sur le bouton de Partage (icône flèche vers le haut)\n3. Sélectionnez 'Sur l'écran d'accueil'\n\nL'application sera instantanément épinglée !");
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>Guide d'installation sans compte App Store</span>
                  </button>
                </div>
              </div>

              <div className="bg-amber-50/40 border border-amber-200/80 p-4.5 rounded-2xl text-[11px] text-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Compatibilité Tablettes iPad pour gérants de Flotte</span>
                </div>
                <p className="leading-relaxed text-slate-600">
                  Les propriétaires de flotte de taxi-moto en RDC qui utilisent des iPads pour le suivi cartographique centralisé peuvent afficher l'interface d'administration sous format dashboard haute résolution. L'interface s'auto-ajuste parfaitement au format horizontal des tablettes.
                </p>
              </div>
            </div>
          )}

          {selectedOS === "pwa" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[9px] font-mono text-purple-600 font-black uppercase tracking-wider block">
                  ⚙️ Version Progressive Web App (PWA) universelle & univers d'Écran
                </span>
                <h3 className="font-bold text-xs text-slate-800">
                  Accès instantané sans téléchargement pour navigateurs Opera Mini, Chrome, Safari ou Firefox
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Si vous possédez un téléphone d'entrée de gamme ou un terminal sous Android Go avec un stockage très limité (8 Go / 16 Go de mémoire interne), le mode PWA est la solution parfaite. L'application s'exécute directement dans le navigateur tout en proposant les notifications push et la traçabilité de géolocalisation.
                </p>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      alert("Félicitations ! Votre navigateur prend en charge le mode PWA d'État GoMoto. Cette démo web est pleinement synchronisée.");
                    }}
                    className="bg-purple-700 hover:bg-purple-800 text-white font-extrabold py-2 px-4 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Lancer la version PWA instantanée</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Check className={`w-3.5 h-3.5 text-emerald-600 ${copiedLink ? "scale-100" : "scale-0 hidden"}`} />
                    <span>{copiedLink ? "Lien Copié !" : "Copier le lien de partage"}</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Consommation RAM</span>
                  <span className="text-base font-mono font-black text-slate-750 block">&lt; 15 Mo</span>
                </div>
                <div className="space-y-0.5 border-t sm:border-t-0 sm:border-x border-slate-200 py-2 sm:py-0">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Données de course</span>
                  <span className="text-base font-mono font-black text-slate-750 block">0.2 Ko / trajet</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Mises à jour</span>
                  <span className="text-base font-mono font-black text-slate-750 block">Automatiques</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: QR Code scanning & Visual Smartphone Shell */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Quick Scan QR Code Box */}
          <div className="bg-slate-950 text-white rounded-3xl p-5 border border-slate-850/80 text-center space-y-4">
            <div className="space-y-1">
              <span className="text-[8px] font-mono text-yellow-500 font-extrabold uppercase tracking-widest block">
                PARTAGE PAR FLOTTE RAPIDE
              </span>
              <h4 className="text-xs font-black uppercase text-slate-200">
                Scanner pour télécharger sur mobile
              </h4>
              <p className="text-[10.5px] text-slate-400 leading-normal">
                Pointez l'appareil photo ou le scanner de votre smartphone (Android, iPhone, tablette) pour charger le portail de téléchargement d'images d'identité et de l'APK Congolais.
              </p>
            </div>

            {/* Simulated interactive QR Code */}
            <div className="bg-white p-3 rounded-2xl max-w-[155px] mx-auto border-2 border-slate-800 transition-all shadow-lg hover:rotate-2 relative group">
              <img 
                referrerPolicy="no-referrer"
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150" 
                alt="QR Code Logo Overlay" 
                className="hidden"
              />
              {/* Custom CSS representation of a QR Code layout using grids to look insanely realistic */}
              <div className="grid grid-cols-5 gap-1.5 h-32 w-32 mx-auto" id="simulated-qrcode">
                <div className="bg-slate-950 border border-slate-200 rounded-sm"></div>
                <div className="bg-slate-900 border border-slate-200 rounded-sm"></div>
                <div className="bg-transparent"></div>
                <div className="bg-slate-950 border border-slate-200 rounded-sm"></div>
                <div className="bg-slate-950 border border-slate-200 rounded-sm"></div>

                <div className="bg-slate-950 border border-slate-200 rounded-sm"></div>
                <div className="bg-slate-950 rounded-sm"></div>
                <div className="bg-slate-950 rounded-sm"></div>
                <div className="bg-transparent"></div>
                <div className="bg-slate-900 rounded-sm"></div>

                <div className="bg-transparent"></div>
                <div className="bg-slate-950 rounded-sm"></div>
                <div className="bg-slate-950 rounded-sm"></div>
                <div className="bg-slate-950 rounded-sm"></div>
                <div className="bg-transparent"></div>

                <div className="bg-slate-950 border border-slate-200 rounded-sm"></div>
                <div className="bg-transparent"></div>
                <div className="bg-slate-950 rounded-sm"></div>
                <div className="bg-slate-900 rounded-sm"></div>
                <div className="bg-slate-950 border border-slate-200 rounded-sm"></div>

                <div className="bg-slate-950 border border-slate-200 rounded-sm"></div>
                <div className="bg-slate-900 border border-slate-200 rounded-sm"></div>
                <div className="bg-transparent"></div>
                <div className="bg-slate-950 border border-slate-200 rounded-sm"></div>
                <div className="bg-slate-950 border border-slate-200 rounded-sm"></div>
              </div>

              {/* Overlay Logo */}
              <div className="absolute inset-0 m-auto h-8 w-8 bg-blue-600 rounded-lg text-white font-bold flex items-center justify-center text-[10px] shadow border border-white">
                🏍️
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowQrCode(prev => !prev);
                alert("Génération d'un QR code de transfert offline direct. Vous pouvez l'imprimer pour vos agences de flotte ou vos gilets de motards.");
              }}
              className="bg-slate-900 hover:bg-slate-850 text-yellow-500 border border-slate-800 font-extrabold text-[10px] py-1.5 px-3 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 uppercase"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Générer Sceau QR Unique</span>
            </button>
          </div>

          {/* Quick Stats list / Compatibility Grid */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3.5">
            <span className="text-[9.5px] font-mono text-slate-500 font-black uppercase tracking-wider block">
              INDICES DE MATÉRIEL PRIS EN CHARGE :
            </span>

            <div className="space-y-3 text-xs leading-normal">
              <div className="flex gap-2.5 items-start">
                <Smartphone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-extrabold text-slate-750">Mobiles Android (Toutes Marques)</h5>
                  <p className="text-[11px] text-slate-500">
                    Pris en charge à 100% (Techno, Infinix, Itel, Samsung Galaxy, Huawei, Honor, Oppo, Realme, Vivo, Motorola, Google Pixel). Systèmes requis : Android 5.0 (Lollipop) jusqu'à Android 15+.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start border-t border-slate-200/80 pt-3">
                <Tablet className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-extrabold text-slate-755">Tablettes, iPad, terminaux de caisse</h5>
                  <p className="text-[11px] text-slate-500">
                    Pris en charge à 100%. Optimisé pour les tablettes robustes montées sur le guidon ou utilisées par les inspecteurs de voirie de redevance syndicale.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
        
      </div>
      
    </div>
  );
}
