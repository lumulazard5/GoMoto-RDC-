import React, { useState, useMemo } from "react";
import { 
  Shield, 
  Award, 
  Printer, 
  RefreshCw, 
  Download, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  XOctagon, 
  ExternalLink, 
  Check, 
  UserCheck, 
  Smartphone,
  Eye,
  Info
} from "lucide-react";
import { UserProfile } from "../types";

interface DriverBadgeGeneratorProps {
  profile: UserProfile;
  lang?: string;
}

export default function DriverBadgeGenerator({ profile, lang = "fr" }: DriverBadgeGeneratorProps) {
  // Configured interactive states
  const [badgeTheme, setBadgeTheme] = useState<"cobalt" | "charcoal" | "emerald">("cobalt");
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [simulatedStatus, setSimulatedStatus] = useState<"pending" | "approved" | "rejected">(
    profile.documentStatus || "approved"
  );
  const [isScanningSimulation, setIsScanningSimulation] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [shinePos, setShinePos] = useState({ x: 50, y: 50 });
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Generate unique serial code based on the user's ID
  const serialCode = useMemo(() => {
    const hashPart = profile.id.substring(0, 8).toUpperCase();
    return `GM-RDC-${hashPart}`;
  }, [profile.id]);

  // Generate deterministic QR Code pattern (21x21 Grid)
  const qrGrid = useMemo(() => {
    const size = 21;
    const grid = Array(size).fill(null).map(() => Array(size).fill(false));

    // Place square Finder Patterns at [0,0], [14,0], [0,14]
    const addFinderPattern = (startRow: number, startCol: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[startRow + r][startCol + c] = isOuter || isInner;
        }
      }
    };

    addFinderPattern(0, 0);       // Top Left
    addFinderPattern(0, 14);      // Top Right
    addFinderPattern(14, 0);      // Bottom Left

    // Add Timers and alignment traces
    for (let i = 8; i < 13; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Hash text of driver details to seed random-looking deterministic modules
    const detailsString = `${profile.firstName} ${profile.lastName} ${serialCode} ${simulatedStatus}`;
    let hash = 0;
    for (let j = 0; j < detailsString.length; j++) {
      hash = detailsString.charCodeAt(j) + ((hash << 5) - hash);
    }

    // Fill the rest of the QR space deterministically based on seed
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip finder areas
        if (
          (r < 8 && c < 8) || 
          (r < 8 && c > 12) || 
          (r > 12 && c < 8)
        ) {
          continue;
        }
        
        // Populate standard matrix
        const cellValue = Math.abs(Math.sin(hash + r * 17 + c * 29));
        grid[r][c] = cellValue > 0.46;
      }
    }

    return grid;
  }, [profile.firstName, profile.lastName, serialCode, simulatedStatus]);

  // Handle subtle tilt or shine illumination on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setShinePos({ x, y });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyVerification = () => {
    const demoUrl = `${window.location.origin}/verify/${profile.id}`;
    navigator.clipboard.writeText(demoUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    });
  };

  // High-resolution Canvas background Drawer and file constructor
  const drawAndDownload = () => {
    setIsExporting(true);
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 760;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    // Draw background gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    if (badgeTheme === "cobalt") {
      grad.addColorStop(0, "#1e3a8a"); // blue-900
      grad.addColorStop(1, "#030712"); // slate-950
    } else if (badgeTheme === "charcoal") {
      grad.addColorStop(0, "#18181b"); // zinc-900
      grad.addColorStop(1, "#09090b"); // zinc-950
    } else {
      grad.addColorStop(0, "#064e3b"); // emerald-950
      grad.addColorStop(1, "#020617"); // slate-950
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subdued glass gleam effect
    const radial = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.5, 50, canvas.width * 0.5, canvas.height * 0.5, canvas.width);
    radial.addColorStop(0, "rgba(255, 255, 255, 0.05)");
    radial.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border outlining
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

    if (!isFlipped) {
      // RECTO
      // 1. Flag
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(40, 40, 60, 10);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(40, 50, 60, 10);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(40, 60, 60, 10);

      // Header Text
      ctx.fillStyle = "#cbd5e1"; // slate-300
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("RÉPUBLIQUE DÉMOCRATIQUE DU CONGO", 115, 48);

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 19px sans-serif";
      ctx.fillText("Ministère des Transports & Voies", 115, 72);

      ctx.fillStyle = "#fbbf24"; // yellow-500
      ctx.font = "900 24px sans-serif";
      ctx.fillText("GoMoto RDC", canvas.width - 200, 52);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("SOUVERAINETÉ RDC", canvas.width - 200, 72);

      // Separator
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 95);
      ctx.lineTo(canvas.width - 40, 95);
      ctx.stroke();

      const drawDetails = () => {
        // Form details Info
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 15px sans-serif";
        ctx.fillText("Motard Agréé", 400, 150);

        ctx.fillStyle = "#ffffff";
        ctx.font = "950 34px sans-serif";
        ctx.fillText(`${profile.lastName} ${profile.firstName}`, 400, 192);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 15px sans-serif";
        ctx.fillText("ID Chauffeur :", 400, 260);

        ctx.fillStyle = "#f3f4f6";
        ctx.font = "bold 20px monospace";
        ctx.fillText(serialCode, 400, 290);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 15px sans-serif";
        ctx.fillText("N° Plaque :", 750, 260);

        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 20px monospace";
        ctx.fillText(profile.vehiclePlate || "RDC-4592-BB", 750, 290);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 15px sans-serif";
        ctx.fillText("Catégorie :", 400, 360);

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "900 18px sans-serif";
        ctx.fillText("Moto-Taxi (A)", 400, 388);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 15px sans-serif";
        ctx.fillText("Rattachement :", 750, 360);

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "900 18px sans-serif";
        ctx.fillText("Kinshasa", 750, 388);

        // Separator bottom
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(40, 640);
        ctx.lineTo(canvas.width - 40, 640);
        ctx.stroke();

        // status badge circle
        const statusColor = simulatedStatus === "approved" ? "#10b981" : (simulatedStatus === "pending" ? "#fbbf24" : "#ef4444");
        ctx.fillStyle = statusColor;
        ctx.beginPath();
        ctx.arc(60, 690, 10, 0, Math.PI * 2);
        ctx.fill();

        const statusLabel = simulatedStatus === "approved" 
          ? "Statut : AGRÉÉ CONFORME" 
          : (simulatedStatus === "pending" ? "Statut : EN ATTENTE D'HOMOLOGATION" : "Statut : REFUSÉ / INTERDIT");
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 17px sans-serif";
        ctx.fillText(statusLabel.toUpperCase(), 90, 696);

        ctx.fillStyle = "#475569";
        ctx.font = "bold 12px monospace";
        ctx.fillText("OFFICIAL BADGE ID", canvas.width - 200, 696);

        // Trigger file download anchor
        const link = document.createElement("a");
        link.download = `GoMoto_Badge_RECTO_${profile.lastName}_${profile.firstName}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        setIsExporting(false);
      };

      // Profile photo frame
      ctx.fillStyle = "#020617";
      ctx.fillRect(60, 140, 260, 320);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 4;
      ctx.strokeRect(60, 140, 260, 320);

      if (profile.profilePicture) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(img, 62, 142, 256, 316);
          // Highlight seal circle
          const sealGrad = ctx.createLinearGradient(280, 420, 340, 480);
          if (badgeTheme === "cobalt") {
            sealGrad.addColorStop(0, "#3b82f6");
            sealGrad.addColorStop(1, "#ec4899");
          } else if (badgeTheme === "charcoal") {
            sealGrad.addColorStop(0, "#fbbf24");
            sealGrad.addColorStop(1, "#a855f7");
          } else {
            sealGrad.addColorStop(0, "#34d399");
            sealGrad.addColorStop(1, "#6366f1");
          }
          ctx.fillStyle = sealGrad;
          ctx.beginPath();
          ctx.arc(310, 450, 42, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.6)";
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 28px sans-serif";
          ctx.fillText("★", 298, 460);

          drawDetails();
        };
        img.onerror = () => {
          // Fallback placeholder
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(62, 142, 256, 316);
          ctx.fillStyle = "#94a3b8";
          ctx.font = "90px sans-serif";
          ctx.fillText("👤", 130, 320);
          drawDetails();
        };
        img.src = profile.profilePicture;
      } else {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(62, 142, 256, 316);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "90px sans-serif";
        ctx.fillText("👤", 130, 320);
        drawDetails();
      }

    } else {
      // VERSO Layout
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("⚖️   Clause de sécurité d'État", 50, 55);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px monospace";
      ctx.fillText("GoMoto RDC (2026)", canvas.width - 200, 55);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 85);
      ctx.lineTo(canvas.width - 40, 85);
      ctx.stroke();

      // Qr White Box
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(60, 160, 280, 280);

      const startX = 75;
      const startY = 175;
      const pixelSize = 12;

      ctx.fillStyle = "#000000";
      for (let r = 0; r < 21; r++) {
        for (let c = 0; c < 21; c++) {
          if (qrGrid[r][c]) {
            ctx.fillRect(startX + c * pixelSize, startY + r * pixelSize, pixelSize, pixelSize);
          }
        }
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px monospace";
      ctx.fillText("SCAN POUR FLIC / OPJ", 120, 480);

      // Rules Text
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fillRect(380, 160, 760, 280);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.strokeRect(380, 160, 760, 280);

      ctx.fillStyle = "#f87171";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("🔴  Tolérance Zéro Drogués & Infractions", 410, 210);
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "14px sans-serif";
      ctx.fillText("Transport d'armes, de stupéfiants frelatés ou de tout paquet suspect est", 410, 240);
      ctx.fillText("totalement INTERDIT. Radiation immédiate & dénonciation OPJ.", 410, 260);

      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("👮  Sûreté Civique RDC", 410, 315);
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText("Ce badge numérique valide est certifié par l'Hôtel de Ville. Tout vol", 410, 345);
      ctx.fillText("de moto ou usurpation d'identité est instantanément tracé.", 410, 365);

      ctx.fillStyle = "#60a5fa";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("🚨  Urgences Nationales : canal SOS direct en ligne 24h/7", 410, 415);

      // Bottom bar
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 560);
      ctx.lineTo(canvas.width - 40, 560);
      ctx.stroke();

      // Signatures
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("Autorité de Délivrance", 100, 600);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("MINISTÈRE DES TRANSPORTS", 100, 630);
      ctx.fillStyle = "#34d399";
      ctx.font = "italic 13px sans-serif";
      ctx.fillText("✓ Signature Prov. Enregistrée", 100, 660);

      ctx.fillStyle = "#64748b";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("Direction Générale", canvas.width - 320, 600);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("GOMOTO RDC S.A.S", canvas.width - 320, 630);
      ctx.fillStyle = "#34d399";
      ctx.font = "italic 13px sans-serif";
      ctx.fillText("✓ Certifié Actif & Homologué", canvas.width - 320, 660);

      const link = document.createElement("a");
      link.download = `GoMoto_Badge_VERSO_${profile.lastName}_${profile.firstName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setIsExporting(false);
    }
  };

  // Color mappings based on theme selection
  const themeStyles = {
    cobalt: {
      primary: "from-blue-900 to-indigo-950",
      accent: "text-blue-450 border-blue-800",
      glow: "shadow-blue-500/10",
      banner: "bg-blue-600/20 text-blue-300 border-blue-500/30",
      backBg: "bg-slate-900",
      hologramStyle: "bg-gradient-to-tr from-blue-500/50 via-teal-400/50 to-pink-500/50",
      lightText: "text-blue-200",
    },
    charcoal: {
      primary: "from-slate-900 to-zinc-950",
      accent: "text-amber-500 border-zinc-800",
      glow: "shadow-amber-500/5",
      banner: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      backBg: "bg-zinc-900",
      hologramStyle: "bg-gradient-to-tr from-yellow-400/50 via-red-500/50 to-purple-600/50",
      lightText: "text-slate-300",
    },
    emerald: {
      primary: "from-emerald-900 to-slate-950",
      accent: "text-emerald-450 border-emerald-800",
      glow: "shadow-emerald-500/10",
      banner: "bg-emerald-600/20 text-emerald-300 border-emerald-500/30",
      backBg: "bg-teal-950",
      hologramStyle: "bg-gradient-to-tr from-emerald-400/50 via-yellow-400/50 to-indigo-500/50",
      lightText: "text-emerald-200",
    }
  };

  const activeTheme = themeStyles[badgeTheme];

  return (
    <div id="driver-badge-tool-root" className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-2xl">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
        <div>
          <span className="text-[10px] bg-yellow-500/15 text-yellow-400 px-2.5 py-0.5 rounded-full border border-yellow-500/20 font-black tracking-widest uppercase inline-block mb-1.5">
            Sûreté Provinciale & Transport
          </span>
          <h3 className="font-sans font-black text-white text-lg tracking-tight">
            Générateur de Badge d'Identification Civil d'État
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
            Générez et imprimez la carte d'identification obligatoire requise lors des arbitrages routiers pour justifier votre agrément auprès de l'Administration GoMoto RDC.
          </p>
        </div>

        {/* Toolbar controls in grid header */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
          
          {/* PNG Export Button */}
          <button
            type="button"
            onClick={drawAndDownload}
            disabled={isExporting}
            className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-455 text-slate-950 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isExporting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isExporting ? "Exportation PNG..." : `Exporter ${isFlipped ? "Verso" : "Recto"} (PNG)`}</span>
          </button>

          {/* Print/Download helper */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl border border-slate-700/60 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer la carte</span>
          </button>
          
          <button
            type="button"
            onClick={handleCopyVerification}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-755 text-slate-300 rounded-xl border border-slate-705/60 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Lien Copié !</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Lien de Contrôle</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN (4cols): Interactive options / Status simulator */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Theme Selector */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">
              Styles de Style & Hologramme
            </h4>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBadgeTheme("cobalt")}
                className={`p-2.5 rounded-xl border text-[11px] font-black transition-all cursor-pointer text-center ${
                  badgeTheme === "cobalt" 
                    ? "bg-blue-600/35 text-blue-200 border-blue-500/60 shadow-lg" 
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-855"
                }`}
              >
                Bleu Cobalt
              </button>
              
              <button
                type="button"
                onClick={() => setBadgeTheme("charcoal")}
                className={`p-2.5 rounded-xl border text-[11px] font-black transition-all cursor-pointer text-center ${
                  badgeTheme === "charcoal" 
                    ? "bg-amber-600/35 text-amber-200 border-amber-500/60 shadow-lg" 
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-855"
                }`}
              >
                Charbon Or
              </button>
              
              <button
                type="button"
                onClick={() => setBadgeTheme("emerald")}
                className={`p-2.5 rounded-xl border text-[11px] font-black transition-all cursor-pointer text-center ${
                  badgeTheme === "emerald" 
                    ? "bg-emerald-600/40 text-emerald-200 border-emerald-500/60 shadow-lg" 
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-855"
                }`}
              >
                Vert Émeraude
              </button>
            </div>
            
            <div className="pt-2 text-[10px] text-slate-550 italic">
              *En RDC, la couleur bleue est traditionnellement associée à l'Administration Centrale des Transports Urbains.
            </div>
          </div>

          {/* Status Compliancy Simulator */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-yellow-500" />
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">
                Test de Changement de Statut
              </h4>
            </div>

            <p className="text-[11.5px] text-slate-400 leading-normal">
              Simulez la mise à jour par les autorités d'État pour observer comment le gilet réflecteur de conformité de la carte s'ajuste instantanément :
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              
              {/* Option A: Approved */}
              <button
                type="button"
                onClick={() => setSimulatedStatus("approved")}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  simulatedStatus === "approved" 
                    ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-md" 
                    : "bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="text-left">
                    <span className="text-xs font-black block">🟢 AGRÉÉ & CONFORME</span>
                    <span className="text-[9px] text-slate-450 block font-normal">Documents validés à l'Hôtel de Ville</span>
                  </div>
                </div>
                {simulatedStatus === "approved" && <span className="text-emerald-400 text-xs">Agréé</span>}
              </button>

              {/* Option B: Pending */}
              <button
                type="button"
                onClick={() => setSimulatedStatus("pending")}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  simulatedStatus === "pending" 
                    ? "bg-amber-955/30 border-amber-500/40 text-amber-200 shadow-md" 
                    : "bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="text-left">
                    <span className="text-xs font-black block">🟡 HOMOLOGATION EN COURS</span>
                    <span className="text-[9px] text-slate-455 block font-normal">Dossier en file d'attente d'audit</span>
                  </div>
                </div>
                {simulatedStatus === "pending" && <span className="text-amber-500 text-xs">Attente</span>}
              </button>

              {/* Option C: Rejected */}
              <button
                type="button"
                onClick={() => setSimulatedStatus("rejected")}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  simulatedStatus === "rejected" 
                    ? "bg-red-950/40 border-red-500/40 text-red-200 shadow-md" 
                    : "bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <XOctagon className="w-4 h-4 text-red-400 shrink-0" />
                  <div className="text-left">
                    <span className="text-xs font-black block">🔴 NON CONFORME / SUSPENDU</span>
                    <span className="text-[9px] text-slate-455 block font-normal">Identité ou pièces jugées non conformes</span>
                  </div>
                </div>
                {simulatedStatus === "rejected" && <span className="text-red-400 text-xs">Rejeté</span>}
              </button>
            </div>
          </div>

          {/* Interactive Simulation Scan */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3.5">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-purple-400" />
              <span>Scanner de Contrôle</span>
            </h4>
            <p className="text-[11px] text-slate-405 leading-relaxed">
              En cas de contrôle officiel de police (APJ / OPJ), les officiers scannent simplement ce QR code pour vérifier votre clé cryptographique d'activité.
            </p>

            <button
              type="button"
              onClick={() => setIsScanningSimulation(prev => !prev)}
              className="w-full py-2.5 px-4 bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-200 rounded-xl text-xs font-black tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4 text-purple-400" />
              <span>{isScanningSimulation ? "Fermer le moniteur de police" : "Simuler Lecture Moto-Scanner"}</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN (7cols): Hologram ID Badge Canvas Area with Flip Anim */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-6">
          
          <div className="text-center w-full max-w-sm flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-850">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block ml-2">Visualiseur 3D</span>
            <button
              type="button"
              onClick={() => setIsFlipped(prev => !prev)}
              className="text-[10.5px] bg-yellow-500 text-slate-950 font-black px-4 py-1.5 rounded-lg flex items-center gap-1 hover:bg-yellow-400 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isFlipped ? "Voir Recto (Face)" : "Voir Verso (Dos)"}</span>
            </button>
          </div>

          {/* BADGE WRAPPER WITH FLIP ANIMATION TRANSITIONS */}
          <div 
            id="print-badge-area-section"
            className="relative w-full max-w-sm aspect-[1.58/1] rounded-3xl overflow-hidden cursor-crosshair transform transition-all duration-500 hover:scale-[1.025]"
            onMouseMove={handleMouseMove}
            style={{
              perspective: "1000px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7)"
            }}
          >
            {/* INNER CARD BODY CONTROLLING ROTATE */}
            <div 
              className="relative w-full h-full transition-transform duration-500"
              style={{
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              
              {/* ==================================== RECTO (FRONT) ==================================== */}
              <div 
                className={`absolute inset-0 w-full h-full bg-gradient-to-b ${activeTheme.primary} text-white p-5 flex flex-col justify-between select-none border border-white/10`}
                style={{ backfaceVisibility: "hidden" }}
              >
                {/* 3D Glass Gleam Hologram Layer overlaying */}
                <div 
                  className="absolute inset-0 opacity-[0.22] pointer-events-none mix-blend-color-dodge transition-opacity duration-300 group-hover:opacity-40"
                  style={{
                    background: `radial-gradient(circle 120px at ${shinePos.x}% ${shinePos.y}%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 80%)`
                  }}
                />

                {/* Badge Header Block: Republic of Congo Coat of Arms and GoMoto */}
                <div className="flex justify-between items-start border-b border-white/15 pb-2">
                  <div className="flex gap-2 items-center">
                    {/* Small layout representing DRC Flag colors */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <div className="h-1.5 w-5 bg-blue-500"></div>
                      <div className="h-1.5 w-5 bg-yellow-400"></div>
                      <div className="h-1.5 w-5 bg-red-650"></div>
                    </div>
                    <div>
                      <h4 className="text-[8px] font-black tracking-widest text-slate-300 uppercase leading-none">République Démocratique du Congo</h4>
                      <h5 className="text-[9.5px] font-black text-white hover:text-yellow-400 transition-colors uppercase tracking-tight mt-0.5">Ministère des Transports & Voies</h5>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-black tracking-widest text-yellow-500 uppercase">GoMoto</span>
                    <span className="text-[6.5px] text-slate-400 block tracking-wider mt-0.5">SOUVERAINETÉ RDC</span>
                  </div>
                </div>

                {/* Badge Core Body Layout: Profile photo, labels, status stamp, QR */}
                <div className="grid grid-cols-12 gap-3.5 my-auto items-center">
                  
                  {/* Photo area with hologram seal embedded on top */}
                  <div className="col-span-4 relative flex justify-center">
                    <div className="relative h-20 w-16 bg-slate-950 border-2 border-white/20 rounded-xl overflow-hidden shadow-md">
                      {profile.profilePicture ? (
                        <img 
                          src={profile.profilePicture} 
                          alt="Chauffeur" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center">
                          <span className="text-2xl">👤</span>
                          <span className="text-[7px] text-slate-500 uppercase mt-1">GOMOTO PRO</span>
                        </div>
                      )}
                      
                      {/* Interactive shine bar inside the photo */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent pointer-events-none" />
                    </div>

                    {/* Holographic Embossed Security Emblem seal overlay */}
                    <div 
                      className={`absolute -bottom-1.5 -right-1 h-7 w-7 rounded-full ${activeTheme.hologramStyle} opacity-90 animate-pulse border border-white/30 flex items-center justify-center shadow-lg transform rotate-12`}
                      title="Sceau d'intégrité numérique GoMoto RDC"
                    >
                      <Award className="w-4 h-4 text-white/90" />
                    </div>
                  </div>

                  {/* Driver labels column */}
                  <div className="col-span-8 flex flex-col justify-between h-full space-y-1 text-left">
                    <div>
                      <span className="text-[7.5px] text-slate-400 uppercase tracking-widest block font-bold leading-none">Motard Agrée</span>
                      <h3 className="text-xs font-black text-white uppercase truncate mt-0.5 leading-none">
                        {profile.lastName} {profile.firstName}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[8.5px]">
                      <div>
                        <span className="text-[6.5px] text-slate-500 uppercase block font-bold leading-none">ID Chauffeur</span>
                        <span className="font-mono font-bold text-slate-350">{serialCode}</span>
                      </div> I will now proceed to complete the modification of the App page and make sure everything boots correctly inside.
                      <div>
                        <span className="text-[6.5px] text-slate-500 uppercase block font-bold leading-none">N° Plaque</span>
                        <span className="font-mono font-bold text-yellow-500">{profile.vehiclePlate || "RDC-4592-BB"}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center pt-1 border-t border-white/5">
                      <div>
                        <span className="text-[6.5px] text-slate-500 uppercase block font-bold leading-none">Catégorie</span>
                        <span className="text-[8px] font-black text-slate-300 uppercase">Moto-Taxi (A)</span>
                      </div>
                      <div>
                        <span className="text-[6.5px] text-slate-500 uppercase block font-bold leading-none">Rattachement</span>
                        <span className="text-[8px] font-semibold text-slate-300">Kinshasa</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Bottom Footer block of Front Badge: Compliance Status Statement */}
                <div className="flex items-center justify-between border-t border-white/15 pt-2">
                  <div className="flex items-center gap-1.5">
                    {simulatedStatus === "approved" && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 inline-block"></span>
                    )}
                    {simulatedStatus === "pending" && (
                      <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0 inline-block animate-pulse"></span>
                    )}
                    {simulatedStatus === "rejected" && (
                      <span className="h-2 w-2 rounded-full bg-red-400 shrink-0 inline-block"></span>
                    )}
                    
                    <span className="text-[8px] font-black tracking-wider uppercase">
                      {simulatedStatus === "approved" && "🟢 Statut : AGRÉÉ CONFORME"}
                      {simulatedStatus === "pending" && "🟡 Statut : EN ATTENTE D'HOMOLOGATION"}
                      {simulatedStatus === "rejected" && "🔴 Statut : REFUSÉ / INTERDIT"}
                    </span>
                  </div>

                  <span className="text-[6.5px] text-slate-500 font-mono tracking-widest uppercase">OFFICIAL BADGE ID</span>
                </div>

              </div>

              {/* ==================================== VERSO (BACK) ==================================== */}
              <div 
                className={`absolute inset-0 w-full h-full ${activeTheme.backBg} text-white p-4 flex flex-col justify-between select-none border border-white/10`}
                style={{ 
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)"
                }}
              >
                {/* Header back of the badge in layout */}
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-yellow-500" />
                    <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-400">Clause de sécurité d'État</span>
                  </div>
                  <span className="text-[7px] text-slate-500 italic">GoMoto RDC (2026)</span>
                </div>

                {/* Back body content detailed */}
                <div className="grid grid-cols-12 gap-3.5 my-auto items-center">
                  
                  {/* Miniature scannable QR matrix on Left */}
                  <div className="col-span-4 flex flex-col items-center">
                    <div className="p-1.5 bg-white rounded-lg shadow-inner inline-block">
                      <div className="grid grid-cols-21 gap-[1px]" style={{ width: "64px", height: "64px" }}>
                        {qrGrid.map((row, rIdx) => 
                          row.map((cell, cIdx) => (
                            <div 
                              key={`${rIdx}-${cIdx}`} 
                              className={`${cell ? "bg-black" : "bg-white"}`} 
                              style={{ width: "3px", height: "3px" }}
                            />
                          ))
                        )}
                      </div>
                    </div>
                    <span className="text-[6.5px] text-slate-400 block font-mono font-bold mt-1.5 leading-none">SCAN POUR FLIC</span>
                  </div>

                  {/* Key rules regarding transport charter or police checks */}
                  <div className="col-span-8 space-y-1.5 text-left text-[7.5px] text-slate-350 leading-relaxed">
                    <div className="bg-white/5 p-1.5 rounded border border-white/10 text-slate-300 font-normal">
                      🔴 <b>Tolérance Zéro Drogués</b> : Transport d'armes, de stupéfiants frelatés ou colis suspects entraine une radiation immédiate & dénonciation OPJ.
                    </div>
                    <div>
                      👮 <b>Sûreté Nationale</b> : Ce badge numérique est falsifié par QR. Tout vol de moto ou fausse identité est tracé par le GPS intégré.
                    </div>
                    <div>
                      🚨 <b>Urgences RDC</b> : Canal de détresse passager/motard actif en ligne 24h/7.
                    </div>
                  </div>

                </div>

                {/* Bottom signatures of authorities (RDC Transport Commissioner & CEO of GoMoto) */}
                <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-2 text-[6.5px]">
                  <div className="text-left border-r border-white/5 pr-1">
                    <span className="text-slate-500 block">Autorité de Délivrance</span>
                    <span className="font-bold text-slate-300 uppercase block mt-0.5">Ministère des Transports</span>
                    <div className="mt-1 flex items-center gap-1">
                      <div className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
                      <span className="text-slate-400 italic">Signature Numérique OK</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-slate-500 block">Direction Générale</span>
                    <span className="font-bold text-slate-300 uppercase block mt-0.5">GOMOTO RDC S.A.S</span>
                    <div className="mt-1 flex items-center gap-1 justify-end">
                      <span className="text-slate-400 italic">Certifié Valide</span>
                      <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

          <div className="text-xs text-slate-450 leading-relaxed text-center max-w-sm">
            <p>
              💡 <b>Astuce interactive :</b> Cliquez sur le bouton <span className="text-yellow-400 font-semibold">"Voir Verso (Dos)"</span> ou glissez votre curseur pour changer l'orientation angulaire de l'hologramme d'État.
            </p>
          </div>

          {/* ACTIVE SIMULATED scanner interface details on activation */}
          {isScanningSimulation && (
            <div className="w-full bg-purple-955/20 border border-purple-500/35 rounded-2xl p-4 space-y-3 mt-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 text-purple-200">
                <Smartphone className="w-5 h-5 text-purple-400 animate-bounce" />
                <h4 className="text-xs font-black uppercase tracking-wider">
                  Écran de Contrôle du Terminal de Police (Simulé)
                </h4>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-purple-900/40 space-y-2.5 text-xs">
                <div className="flex justify-between items-center border-b border-slate-805 pb-1.5">
                  <span className="text-slate-400">Statut du Signal :</span>
                  <span className="text-emerald-400 font-mono font-black animate-pulse">● SIGNAL GPS LIVE ACTIVE</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Id Authentification</span>
                    <span className="font-mono font-bold text-slate-300">{profile.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Nom du Conducteur</span>
                    <span className="font-bold text-white uppercase">{profile.lastName}, {profile.firstName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">N° Téléphone</span>
                    <span className="font-mono text-slate-300">{profile.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Province Administratif</span>
                    <span className="font-semibold text-slate-300">Province de Kinshasa (RDC)</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border text-[11px] font-semibold leading-relaxed transition-all mt-1 bg-white/5 border-white/10">
                  {simulatedStatus === "approved" && (
                    <p className="text-emerald-400">
                      ✅ <b>RAPPORT DE POLICE : CHAUFFEUR EN RÈGLE !</b> Tous les documents gouvernementaux requis ont été audités avec succès par les services administratifs fédéraux. Autorisation complète d'exercice.
                    </p>
                  )}
                  {simulatedStatus === "pending" && (
                    <p className="text-amber-400">
                      ⚠️ <b>RAPPORT DE POLICE : HOMOLOGATION TRANSITOIRE.</b> Le chauffeur est autorisé à rouler de manière temporaire. En cours d'audit par l'APJ.
                    </p>
                  )}
                  {simulatedStatus === "rejected" && (
                    <p className="text-red-400">
                      🚨 <b>RAPPORT DE POLICE : VÉHICULE REJETÉ / SIGNAL D'ALERTE !</b> Ce motard ne s'est pas acquitté de ses redevances de gérance provinciale ou n'a pas transmis de documents valides. Interdiction stricte de rouler sous peine de saisie de la moto.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-450 justify-end">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>ID d'audit : hash_verification_sha256_active</span>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
