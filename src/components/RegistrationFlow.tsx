/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserProfile, UserRole, DocumentType, DRCAddress } from "../types";
import { AppLanguage, translations } from "../lib/translations";
import { 
  drcProvinces, 
  getQuartiersForCommune, 
  mockLocalities, 
  mockAvenues 
} from "../data/drcLocations";
import { 
  appVision, 
  appMission, 
  generalTerms, 
  driverPolicy, 
  clientPolicy, 
  ownerPolicy,
  legalRegulations 
} from "../data/legalTexts";
import { 
  Shield, 
  Check, 
  AlertTriangle, 
  Upload, 
  Camera, 
  User, 
  Scale, 
  Compass, 
  FileCheck,
  ChevronRight,
  Info,
  Building,
  Bike,
  Sparkles,
  Cpu,
  CheckCircle2,
  XCircle,
  RefreshCw
} from "lucide-react";

interface RegistrationFlowProps {
  onCompleteRegistration: (profile: UserProfile) => void;
  lang?: AppLanguage;
}

export default function RegistrationFlow({ onCompleteRegistration, lang = "fr" }: RegistrationFlowProps) {
  const [step, setStep] = useState<number>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>("client");
  
  // Document acceptances
  const [readDocs, setReadDocs] = useState<{
    vision: boolean;
    cgu: boolean;
    politiqueChauffeur: boolean;
    politiqueClient: boolean;
    politiqueProprietaire: boolean;
    reglementations: boolean;
  }>({
    vision: false,
    cgu: false,
    politiqueChauffeur: false,
    politiqueClient: false,
    politiqueProprietaire: false,
    reglementations: false,
  });

  const [activeDocTab, setActiveDocTab] = useState<string>("vision");

  // Registration states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+243 ");
  
  // Address selection states
  const [province, setProvince] = useState("Kinshasa");
  const [city, setCity] = useState("Kinshasa");
  const [commune, setCommune] = useState("Gombe");
  const [quartier, setQuartier] = useState("");
  const [localite, setLocalite] = useState("");
  const [avenue, setAvenue] = useState("");
  const [parcelNumber, setParcelNumber] = useState("");

  // Document states (Drivers & Owners)
  const [docType, setDocType] = useState<DocumentType>("carte_identite_nationale");
  const [docNumber, setDocNumber] = useState("");
  
  // Custom mock file states
  const [profilePic, setProfilePic] = useState<string>("");
  const [docFront, setDocFront] = useState<string>("");
  const [docBack, setDocBack] = useState<string>("");

  // Camera capture states for Driver's License
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraTarget, setCameraTarget] = useState<"front" | "back" | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const startCamera = async (target: "front" | "back") => {
    setCameraError(null);
    setCapturedPreview(null);
    setCameraTarget(target);
    setIsCameraActive(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Play error:", e));
        }
      }, 100);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError(
        lang === "fr" 
          ? "Impossible d'accéder à la caméra. Veuillez autoriser l'accès ou importer une image depuis votre appareil." 
          : "Unable to access camera. Please grant permission or upload an image."
      );
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setCameraTarget(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const b64 = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedPreview(b64);
      }
    } catch (err) {
      console.error("Error capturing frame:", err);
    }
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Pre-select Driving license (permis_de_conduire) for drivers
  useEffect(() => {
    if (selectedRole === "driver") {
      setDocType("permis_de_conduire");
    }
  }, [selectedRole]);

  // States of fake AI face compliance verification
  const [aiAnalysisStatus, setAiAnalysisStatus] = useState<"idle" | "scanning" | "success" | "failed">("idle");
  const [aiStepProgress, setAiStepProgress] = useState(0);
  const [currentAiCheckText, setCurrentAiCheckText] = useState("");
  const [shouldSimulateFail, setShouldSimulateFail] = useState(false);
  const [aiMetrics, setAiMetrics] = useState({
    faceDetected: false,
    goodLighting: false,
    noObstruction: false,
    resolutionOk: false,
    confidenceScore: 0
  });

  const [customQuartiers, setCustomQuartiers] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [referredByCode, setReferredByCode] = useState("");

  // Update cities/communes when provinces change
  useEffect(() => {
    const pObj = drcProvinces.find(p => p.name === province);
    if (pObj && pObj.cities.length > 0) {
      setCity(pObj.cities[0].name);
      setCommune(pObj.cities[0].communes[0]);
    }
  }, [province]);

  useEffect(() => {
    const list = getQuartiersForCommune(commune);
    setCustomQuartiers(list);
    setQuartier(list[0] || "");
  }, [commune]);

  // Set default values for other inputs
  useEffect(() => {
    if (!localite) setLocalite(mockLocalities[0]);
    if (!avenue) setAvenue(mockAvenues[0]);
  }, []);

  // Reset fake AI status if profilePic is cleared
  useEffect(() => {
    if (!profilePic) {
      setAiAnalysisStatus("idle");
      setAiStepProgress(0);
      setCurrentAiCheckText("");
      setAiMetrics({
        faceDetected: false,
        goodLighting: false,
        noObstruction: false,
        resolutionOk: false,
        confidenceScore: 0
      });
    }
  }, [profilePic]);

  const handleStartAiAnalysis = () => {
    if (!profilePic) return;
    setAiAnalysisStatus("scanning");
    setAiStepProgress(10);
    setCurrentAiCheckText("Initialisation du processeur de vision neurale GoMoto AI...");
    
    setTimeout(() => {
      setAiStepProgress(35);
      setCurrentAiCheckText("Géolocalisation d'image & Détection du contour facial biométrique...");
      setAiMetrics(prev => ({ ...prev, faceDetected: true }));
    }, 800);

    setTimeout(() => {
      setAiStepProgress(60);
      setCurrentAiCheckText("Évaluation spectrale : analyse de la luminosité et des contrastes...");
      setAiMetrics(prev => ({ ...prev, goodLighting: !shouldSimulateFail }));
    }, 1600);

    setTimeout(() => {
      setAiStepProgress(85);
      setCurrentAiCheckText("Filtre anti-obstruction (détection de lunettes sombres, casquette, masque)...");
      setAiMetrics(prev => ({ ...prev, noObstruction: !shouldSimulateFail }));
    }, 2400);

    setTimeout(() => {
      setAiStepProgress(100);
      if (shouldSimulateFail) {
        setAiAnalysisStatus("failed");
        setCurrentAiCheckText("Échec de conformité – Anomalie détectée (Luminosité basse ou obstruction faciale).");
        setAiMetrics(prev => ({ 
          ...prev, 
          resolutionOk: false,
          confidenceScore: 32 
        }));
        setErrorMsg("Échec de l'analyse d'IA : photo non conforme (Score: 32%). Veuillez désactiver la simulation d'échec ou choisir une autre photo.");
      } else {
        setAiAnalysisStatus("success");
        setCurrentAiCheckText("Analyse réussie – Profil biométrique valide (Visibilité faciale conforme).");
        setAiMetrics(prev => ({ 
          ...prev, 
          resolutionOk: true,
          confidenceScore: 98 
        }));
        setErrorMsg("");
      }
    }, 3200);
  };

  const handleAcceptDoc = (docKey: keyof typeof readDocs) => {
    setReadDocs(prev => ({ ...prev, [docKey]: true }));
    setErrorMsg("");
  };

  const handleNextStep = () => {
    if (step === 1) {
      // General terms and vision are required for everyone
      if (!readDocs.vision || !readDocs.cgu) {
        setErrorMsg("Veuillez consulter et cocher 'J'ai lu et j'accepte' pour 'Notre Vision' et 'CGU Général'.");
        return;
      }

      // Validations based on selected category
      if (selectedRole === "client") {
        if (!readDocs.politiqueClient) {
          setErrorMsg("En tant que Passager, vous devez consulter et accepter la 'Politique des Clients' pour continuer.");
          return;
        }
      } else if (selectedRole === "driver") {
        if (!readDocs.politiqueChauffeur || !readDocs.reglementations) {
          setErrorMsg("En tant que Chauffeur, vous devez consulter et accepter la 'Politique Chauffeur' et les 'Règlements Légaux RDC' pour continuer.");
          return;
        }
      } else if (selectedRole === "owner") {
        if (!readDocs.politiqueProprietaire) {
          setErrorMsg("En tant que Propriétaire de Flotte, vous devez consulter et accepter la 'Charte des Propriétaires de Flotte' pour continuer.");
          return;
        }
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      // Personal info validation
      if (!firstName.trim() || !lastName.trim()) {
        setErrorMsg("Le prénom et le nom sont obligatoires.");
        return;
      }
      if (!phone.replace(/\s+/g, "").match(/^\+243\d{9}$/) && phone.replace(/\s+/g, "").length < 10) {
        setErrorMsg("Veuillez saisir un numéro de téléphone valide en RDC (+243 suivi de 9 chiffres).");
        return;
      }
      if (!quartier || !localite || !avenue || !parcelNumber.trim()) {
        setErrorMsg("L'adresse complète de votre quartier, localité, numéro de parcelle et avenue est obligatoire.");
        return;
      }
      
      setErrorMsg("");
      setStep(4);
    } else if (step === 4) {
      // All users (including clients) need ID documents
      if (!docNumber.trim()) {
        setErrorMsg("Le numéro du document d'identité est obligatoire.");
        return;
      }
      if (!docFront || !docBack) {
        setErrorMsg("Les photos recto et verso de votre document d'identité sont obligatoires.");
        return;
      }

      // Everyone needs a profile pic and successful AI compliance report
      if (!profilePic) {
        setErrorMsg("La photo de profil est requise pour assurer la reconnaissance faciale.");
        return;
      }
      if (aiAnalysisStatus !== "success") {
        setErrorMsg("La photo de profil est requise et doit être validée par l'analyse automatique de conformité faciale par IA.");
        return;
      }
      submitRegistration();
    }
  };

  const submitRegistration = () => {
    const address: DRCAddress = {
      province,
      city,
      commune,
      quartier,
      localite,
      avenue,
      number: parcelNumber.trim() || "N/A"
    };

    const isReferred = referredByCode.trim().length > 0;
    const referralBonusCDF = isReferred ? 15000 : 0;
    const referralBonusUSD = isReferred ? 5 : 0;

    const baseCDF = selectedRole === "client" ? 25000 : 0;
    const baseUSD = selectedRole === "client" ? 10 : 0;

    const uLastName = lastName.trim().toUpperCase() || "USER";
    const cleanLastName = uLastName.replace(/[^A-Z]/g, "").slice(0, 7);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const generatedCode = `GOMOTO-${cleanLastName || "MEMBER"}-${randomSuffix}`;

    const newProfile: UserProfile = {
      id: "usr-" + Math.random().toString(36).substr(2, 9),
      role: selectedRole,
      lastName: uLastName,
      firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
      email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gomoto-rdc.com`,
      phone: phone.trim(),
      address,
      walletBalanceCDF: baseCDF + referralBonusCDF,
      walletBalanceUSD: baseUSD + referralBonusUSD,
      isRegistered: true,
      registrationDate: new Date().toLocaleDateString("fr-FR"),
      rating: 5.0,
      ridesCompleted: 0,
      isOnline: false,
      documentStatus: "pending",
      documentType: docType,
      documentNumber: docNumber,
      documentPhotoFront: docFront,
      documentPhotoBack: docBack,
      profilePicture: profilePic,
      myReferralCode: generatedCode,
      referredByCode: isReferred ? referredByCode.trim().toUpperCase() : undefined,
      referralCount: 0
    };

    if (selectedRole === "driver") {
      newProfile.vehiclePlate = "C-MC-" + Math.floor(1000 + Math.random() * 9000) + "KIN";
      newProfile.vehicleModel = "Haobin 150cc Jaune";
    }

    onCompleteRegistration(newProfile);
  };

  // Pre-generate custom base64 documents images so it is super neat and fast
  const handleMockPicture = (type: "profile" | "front" | "back") => {
    const mockFiles = {
      profile: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      front: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400",
      back: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400",
    };

    if (type === "profile") setProfilePic(mockFiles.profile);
    if (type === "front") setDocFront(mockFiles.front);
    if (type === "back") setDocBack(mockFiles.back);
  };

  const handleLocalFile = (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "front" | "back") => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      if (type === "profile") {
        setProfilePic(b64);
      } else if (type === "front") {
        setDocFront(b64);
      } else if (type === "back") {
        setDocBack(b64);
      }
    };
    reader.readAsDataURL(file);
    setErrorMsg("");
  };

  return (
    <div id="registration-window" className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm relative text-slate-800">
      
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative">
        <div className="absolute top-4 right-4 bg-white/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
          RDC COVERAGE • 26 PROVINCES
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white text-blue-600 p-2.5 rounded-2xl shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">GOMOTO RDC</h1>
            <p className="text-xs text-blue-100 font-medium">Inscription Officielle & Vérification d'Identité National</p>
          </div>
        </div>

        {/* Steps Breadcrumbs bar */}
        <div className="flex items-center gap-3 mt-6 text-xs font-bold text-white/90">
          <span className={`px-2.5 py-1 rounded-full ${step >= 1 ? "bg-white text-blue-700" : "bg-white/10"}`}>1. Chartes</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className={`px-2.5 py-1 rounded-full ${step >= 2 ? "bg-white text-blue-700" : "bg-white/10"}`}>2. Profil</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className={`px-2.5 py-1 rounded-full ${step >= 3 ? "bg-white text-blue-700" : "bg-white/10"}`}>3. Coordonnées</span>
          {selectedRole !== "client" && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className={`px-2.5 py-1 rounded-full ${step >= 4 ? "bg-white text-blue-700" : "bg-white/10"}`}>4. Documents</span>
            </>
          )}
        </div>
      </div>

      <div className="p-6 md:p-8">
        {errorMsg && (
          <div id="reg-error-callout" className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-start gap-2.5 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ================= STEP 1: READ DOCUMENTS AND POLICIES ================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
              <div className="flex items-center gap-2 text-blue-600 font-bold mb-1">
                <Info className="w-4 h-4" />
                <span>Lecture Préalable Obligatoire</span>
              </div>
              <p>
                Conformément aux directives de l'autorité urbaine de transport en RDC, tout utilisateur (Client, Chauffeur ou Propriétaire) doit obligatoirement s'enquérir des conditions d'utilisation générales, des commissions et des règlements de souveraineté avant de valider son compte.
              </p>
            </div>
            <div className="space-y-4">
              {/* Category selector recommendation badge */}
              <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
                <div>
                  <span className="font-extrabold text-blue-800 text-[11px] uppercase tracking-wider block">🏢 RECOMMANDATION DE LECTURE AUTOMATIQUE :</span>
                  <span className="text-[10px] text-slate-500">Sélectionnez et lisez en priorité les règlements de votre catégorie :</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-lg font-black text-[9px] uppercase border ${selectedRole === 'client' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>🚗 Passager</span>
                  <span className={`px-2 py-0.5 rounded-lg font-black text-[9px] uppercase border ${selectedRole === 'driver' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>🏍️ Chauffeur</span>
                  <span className={`px-2 py-0.5 rounded-lg font-black text-[9px] uppercase border ${selectedRole === 'owner' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>💼 Propriétaire</span>
                </div>
              </div>

              {/* Grouped Tab Buttons */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Choisir un document à afficher :</span>
                
                {/* 1. Global / Commun */}
                <div className="bg-slate-100/80 p-2 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase px-1 tracking-wider block">🌍 Documents Communs à tous :</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveDocTab("vision")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        activeDocTab === "vision" ? "bg-blue-600 text-white border border-transparent shadow-sm" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                      }`}
                    >
                      <span>Vision & Mission GoMoto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDocTab("cgu")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        activeDocTab === "cgu" ? "bg-blue-600 text-white border border-transparent shadow-sm" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                      }`}
                    >
                      <span>CGU Général</span>
                    </button>
                  </div>
                </div>

                {/* 2. Specific per category */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {/* Category Passager */}
                  <div className={`p-2 rounded-xl border flex flex-col gap-1.5 ${selectedRole === 'client' ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200/60'}`}>
                    <span className="text-[9px] font-extrabold text-blue-800 uppercase px-1 tracking-wider block">🚗 Espace Passager (Client) :</span>
                    <button
                      type="button"
                      onClick={() => setActiveDocTab("politiqueClient")}
                      className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                        activeDocTab === "politiqueClient" ? "bg-blue-600 text-white border border-transparent" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                      }`}
                    >
                      <span>Charte Passagers</span>
                      {selectedRole === "client" && <span className="text-[8px] bg-emerald-500 text-white px-1 rounded font-mono uppercase font-black">Requis</span>}
                    </button>
                  </div>

                  {/* Category Chauffeur */}
                  <div className={`p-2 rounded-xl border flex flex-col gap-1.5 ${selectedRole === 'driver' ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200/60'}`}>
                    <span className="text-[9px] font-extrabold text-amber-800 uppercase px-1 tracking-wider block">🏍️ Espace Chauffeur (Motard) :</span>
                    <div className="flex gap-1.5 flex-col w-full">
                      <button
                        type="button"
                        onClick={() => setActiveDocTab("politiqueChauffeur")}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                          activeDocTab === "politiqueChauffeur" ? "bg-blue-600 text-white border border-transparent" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                        }`}
                      >
                        <span className="truncate">Contrat Chauffeur</span>
                        {selectedRole === "driver" && <span className="text-[8px] bg-emerald-500 text-white px-1 rounded font-mono uppercase font-black">Requis</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDocTab("reglementations")}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                          activeDocTab === "reglementations" ? "bg-blue-600 text-white border border-transparent" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                        }`}
                      >
                        <span className="truncate">Règlements RDC</span>
                        {selectedRole === "driver" && <span className="text-[8px] bg-emerald-500 text-white px-1 rounded font-mono uppercase font-black">Requis</span>}
                      </button>
                    </div>
                  </div>

                  {/* Category Propriétaire */}
                  <div className={`p-2 rounded-xl border flex flex-col gap-1.5 ${selectedRole === 'owner' ? 'bg-purple-50 border-purple-300' : 'bg-slate-50 border-slate-200/60'}`}>
                    <span className="text-[9px] font-extrabold text-purple-800 uppercase px-1 tracking-wider block">💼 Espace Propriétaire :</span>
                    <button
                      type="button"
                      onClick={() => setActiveDocTab("politiqueProprietaire")}
                      className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                        activeDocTab === "politiqueProprietaire" ? "bg-blue-600 text-white border border-transparent" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                      }`}
                    >
                      <span className="truncate">Charte des Flottes</span>
                      {selectedRole === "owner" && <span className="text-[8px] bg-purple-600 text-white px-1 rounded font-mono uppercase font-black">Requis</span>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
 
             {/* Document display board */}
             <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 min-h-[220px] max-h-[300px] overflow-y-auto space-y-4 text-slate-700">
               {activeDocTab === "vision" && (
                 <div className="space-y-4">
                   <div>
                     <h3 className="text-blue-700 font-bold text-sm mb-1">{appVision.title}</h3>
                     <p className="text-xs text-slate-600 leading-relaxed">{appVision.description}</p>
                   </div>
                   <div className="grid grid-cols-1 gap-2.5 pt-2">
                     {appVision.points.map((p, idx) => (
                       <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200">
                         <h4 className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                           <Check className="w-3.5 h-3.5 text-emerald-500" />
                           <span>{p.title}</span>
                         </h4>
                         <p className="text-[10px] text-slate-500 mt-0.5">{p.text}</p>
                       </div>
                     ))}
                   </div>
                   <div className="border-t border-slate-200 pt-3">
                     <h3 className="text-blue-700 font-bold text-sm mb-1">{appMission.title}</h3>
                     <p className="text-xs text-slate-600 leading-relaxed">{appMission.content}</p>
                   </div>
                 </div>
               )}
 
               {activeDocTab === "cgu" && (
                 <div className="space-y-4 text-slate-600">
                   <div className="flex justify-between items-center text-[10px] text-slate-400">
                     <span className="font-bold text-blue-600 uppercase">GoMoto Congo</span>
                     <span>{generalTerms.lastUpdated}</span>
                   </div>
                   {generalTerms.sections.map((sect, i) => (
                     <div key={i} className="space-y-1.5">
                       <h4 className="text-xs font-bold text-slate-800">{sect.heading}</h4>
                       {sect.content.map((p, pi) => (
                         <p key={pi} className="text-[11px] text-slate-600 leading-relaxed">{p}</p>
                       ))}
                     </div>
                   ))}
                 </div>
               )}
 
               {activeDocTab === "politiqueChauffeur" && (
                 <div className="space-y-4 text-slate-600">
                   <div className="flex justify-between items-center text-[10px] text-slate-400">
                     <span className="font-bold text-blue-600 uppercase">Contrat Partenaire</span>
                     <span>{driverPolicy.lastUpdated}</span>
                   </div>
                   {driverPolicy.sections.map((sect, i) => (
                     <div key={i} className="space-y-1.5">
                       <h4 className="text-xs font-bold text-slate-800">{sect.heading}</h4>
                       {sect.content.map((p, pi) => (
                         <p key={pi} className="text-[11px] text-slate-600 leading-relaxed">{p}</p>
                       ))}
                     </div>
                   ))}
                 </div>
               )}
 
               {activeDocTab === "politiqueClient" && (
                 <div className="space-y-4 text-slate-600">
                   <div className="flex justify-between items-center text-[10px] text-slate-400">
                     <span className="font-bold text-blue-600 uppercase">Charte Passagers</span>
                     <span>{clientPolicy.lastUpdated}</span>
                   </div>
                   {clientPolicy.sections.map((sect, i) => (
                     <div key={i} className="space-y-1.5">
                       <h4 className="text-xs font-bold text-slate-800">{sect.heading}</h4>
                       {sect.content.map((p, pi) => (
                         <p key={pi} className="text-[11px] text-slate-600 leading-relaxed">{p}</p>
                       ))}
                     </div>
                   ))}
                 </div>
               )}

               {activeDocTab === "politiqueProprietaire" && (
                 <div className="space-y-4 text-slate-600">
                   <div className="flex justify-between items-center text-[10px] text-slate-400">
                     <span className="font-bold text-blue-600 uppercase">Charte Propriétaire de Flottes</span>
                     <span>{ownerPolicy.lastUpdated}</span>
                   </div>
                   {ownerPolicy.sections.map((sect, i) => (
                     <div key={i} className="space-y-1.5">
                       <h4 className="text-xs font-bold text-slate-800">{sect.heading}</h4>
                       {sect.content.map((p, pi) => (
                         <p key={pi} className="text-[11px] text-slate-600 leading-relaxed">{p}</p>
                       ))}
                     </div>
                   ))}
                 </div>
               )}
 
               {activeDocTab === "reglementations" && (
                 <div className="space-y-3">
                   <h3 className="text-blue-700 font-bold text-sm">{legalRegulations.title}</h3>
                   <div className="space-y-2">
                     {legalRegulations.requirements.map((req, idx) => (
                       <div key={idx} className="flex gap-2 items-start bg-white p-2.5 rounded-lg border border-slate-200">
                         <span className="bg-blue-50 text-blue-600 h-5 w-5 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0 mt-0.5">
                           {idx + 1}
                         </span>
                         <p className="text-[11px] text-slate-600 leading-relaxed">{req}</p>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
             </div>
 
             {/* Reader Acceptance Actions */}
             <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
               <h4 className="text-xs font-bold text-slate-700 mb-2">Cocher pour valider la lecture de vos rubriques obligatoires :</h4>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                 <label className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-lg cursor-pointer hover:bg-slate-50 transition-all">
                   <input
                     type="checkbox"
                     checked={readDocs.vision}
                     onChange={() => handleAcceptDoc("vision")}
                     className="h-4 w-4 rounded-md border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
                   />
                   <div>
                     <span className="text-[11px] font-semibold text-slate-700 block">1. Notre Vision & Mission</span>
                     <span className="text-[9px] text-slate-405 block font-bold uppercase">Commun</span>
                   </div>
                 </label>
 
                 <label className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-lg cursor-pointer hover:bg-slate-50 transition-all">
                   <input
                     type="checkbox"
                     checked={readDocs.cgu}
                     onChange={() => handleAcceptDoc("cgu")}
                     className="h-4 w-4 rounded-md border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
                   />
                   <div>
                     <span className="text-[11px] font-semibold text-slate-700 block">2. CGU Général</span>
                     <span className="text-[9px] text-slate-405 block font-bold uppercase">Commun</span>
                   </div>
                 </label>
 
                 {/* Role-specific obligations */}
                 {selectedRole === "client" && (
                   <label className="flex items-center gap-3 bg-blue-50/40 border border-blue-200 p-3 rounded-lg cursor-pointer hover:bg-blue-50/70 transition-all md:col-span-2">
                     <input
                       type="checkbox"
                       checked={readDocs.politiqueClient}
                       onChange={() => handleAcceptDoc("politiqueClient")}
                       className="h-4 w-4 rounded-md border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
                     />
                     <div>
                       <span className="text-[11px] font-extrabold text-blue-800 block">3. Charte des Passagers & Clients</span>
                       <span className="text-[9px] text-blue-500 font-extrabold uppercase">Requis pour vous (Passager)</span>
                     </div>
                   </label>
                 )}
 
                 {selectedRole === "driver" && (
                   <>
                     <label className="flex items-center gap-3 bg-amber-50/30 border border-amber-200 p-3 rounded-lg cursor-pointer hover:bg-amber-50/60 transition-all">
                       <input
                         type="checkbox"
                         checked={readDocs.politiqueChauffeur}
                         onChange={() => handleAcceptDoc("politiqueChauffeur")}
                         className="h-4 w-4 rounded-md border-slate-303 bg-white text-blue-600 focus:ring-blue-500"
                       />
                       <div>
                         <span className="text-[11px] font-extrabold text-amber-800 block">3. Contrat de Partenariat Chauffeur</span>
                         <span className="text-[9px] text-amber-600 font-extrabold uppercase font-mono">Requis (Chauffeur)</span>
                       </div>
                     </label>
 
                     <label className="flex items-center gap-3 bg-amber-50/30 border border-amber-200 p-3 rounded-lg cursor-pointer hover:bg-amber-50/60 transition-all">
                       <input
                         type="checkbox"
                         checked={readDocs.reglementations}
                         onChange={() => handleAcceptDoc("reglementations")}
                         className="h-4 w-4 rounded-md border-slate-303 bg-white text-blue-600 focus:ring-blue-500"
                       />
                       <div>
                         <span className="text-[11px] font-extrabold text-amber-800 block">4. Règlements Légaux Nationaux (RDC)</span>
                         <span className="text-[9px] text-amber-600 font-extrabold uppercase font-mono">Requis (Chauffeur)</span>
                       </div>
                     </label>
                   </>
                 )}
 
                 {selectedRole === "owner" && (
                   <label className="flex items-center gap-3 bg-purple-50/30 border border-purple-200 p-3 rounded-lg cursor-pointer hover:bg-purple-50/60 transition-all md:col-span-2">
                     <input
                       type="checkbox"
                       checked={readDocs.politiqueProprietaire}
                       onChange={() => handleAcceptDoc("politiqueProprietaire")}
                       className="h-4 w-4 rounded-md border-slate-303 bg-white text-blue-600 focus:ring-blue-500"
                     />
                     <div>
                       <span className="text-[11px] font-extrabold text-purple-800 block">3. Charte des Propriétaires de Flotte</span>
                       <span className="text-[9px] text-purple-600 font-extrabold uppercase font-mono">Requis pour vous (Propriétaire)</span>
                     </div>
                   </label>
                 )}
               </div>
             </div>

            {/* Quick role previews prior to selecting role */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Choisir mon Profil final :</h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("client")}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    selectedRole === "client" ? "bg-blue-50 border-blue-600 text-blue-700 font-bold" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="text-[10px]">Passager (Client)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("driver")}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    selectedRole === "driver" ? "bg-blue-50 border-blue-600 text-blue-700 font-bold" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Bike className="w-5 h-5" />
                  <span className="text-[10px]">Chauffeur (Motard)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("owner")}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    selectedRole === "owner" ? "bg-blue-50 border-blue-600 text-blue-700 font-bold" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Building className="w-5 h-5" />
                  <span className="text-[10px]">Propriétaire</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-sm shadow-sm"
            >
              <span>Valider les Chartes & Continuer</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================= STEP 2: PROFILE DE CONFIRMATION (RECAP ROLE) ================= */}
        {step === 2 && (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto bg-blue-50 h-20 w-20 rounded-full flex items-center justify-center text-blue-600 border border-blue-100 mb-2 shadow-inner">
              {selectedRole === "client" ? <User className="w-9 h-9" /> : selectedRole === "driver" ? <Bike className="w-9 h-9" /> : <Building className="w-9 h-9" />}
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Vous vous inscrivez en tant que :</h3>
              <div className="bg-blue-600 text-white px-4 py-2 rounded-xl inline-block font-bold tracking-wider uppercase text-xs">
                {selectedRole === "client" ? "🚗 Passager (Client)" : selectedRole === "driver" ? "🏍️ Chauffeur de Taxi-Moto" : "💼 Propriétaire de Motos"}
              </div>
              <p className="text-xs text-slate-650 mt-2 leading-relaxed">
                {selectedRole === "client" && "Profitez de trajets sécurisés et rapides à travers toutes les communes de votre ville. Payez facilement via mobile money."}
                {selectedRole === "driver" && "Rejoignez la plus grande flotte de RDC, activez votre présence en ligne en toute autonomie et multipliez vos gains par jour."}
                {selectedRole === "owner" && "Gérez votre flotte de motos d'investissement à distance, suivez les versements et affectez des conducteurs vérifiés."}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl max-w-md mx-auto border border-amber-200 text-[11px] text-slate-700 text-left flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-800">Règle administrative importante :</span>
                <p className="mt-0.5 text-slate-500">
                  Après finalisation de cette étape, votre prénom, nom, et pièces d'identité seront définitivement bloqués pour des raisons de conformité et de sécurité.
                </p>
              </div>
            </div>

            <div className="flex gap-4 max-w-md mx-auto pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-sm"
              >
                Je confirme ce choix
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: COORDONNÉES ET ADRESSE EXACTE ================= */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-705 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Informations Générales & Adresse Exacte</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prénom(s) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ex: Patient"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ex: MBUYI"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adresse E-mail (Optionnel)</label>
                <input
                  type="email"
                  placeholder="Ex: patient@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Numéro de Téléphone RDC <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="+243"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 font-mono rounded-xl px-4 py-2 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                />
                <span className="text-[9px] text-slate-450 mt-1 block font-medium">Format : +243 suivi de votre numéro (ex: +243 998877665)</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Adresse Exacte de Domicile (RDC)</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Province <span className="text-red-500">*</span></label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                  >
                    {drcProvinces.map((p) => (
                      <option key={p.id} value={p.name} className="text-slate-800">{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Ville / Territoire <span className="text-red-500">*</span></label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                  >
                    {drcProvinces.find(p => p.name === province)?.cities.map((c, i) => (
                      <option key={i} value={c.name} className="text-slate-800">{c.name}</option>
                    )) || <option value={city}>{city}</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Commune <span className="text-red-500">*</span></label>
                  <select
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                  >
                    {drcProvinces
                      .find(p => p.name === province)
                      ?.cities.find(c => c.name === city)
                      ?.communes.map((com, i) => (
                        <option key={i} value={com} className="text-slate-800">{com}</option>
                      )) || <option value={commune}>{commune}</option>}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Quartier <span className="text-red-500">*</span></label>
                  <select
                    value={quartier}
                    onChange={(e) => setQuartier(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                  >
                    {customQuartiers.map((q, i) => (
                      <option key={i} value={q} className="text-slate-800">{q}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Localité <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={localite}
                    onChange={(e) => setLocalite(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                    placeholder="Ex: Localité Urbaine"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Avenue Exacte <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={avenue}
                    onChange={(e) => setAvenue(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                    placeholder="Ex: Avenue Lumumba"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Numéro de Parcelle / Porte <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={parcelNumber}
                    onChange={(e) => setParcelNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                    placeholder="Ex: N° 45, N° 12-bis"
                  />
                </div>
              </div>
            </div>

            {/* SYSTÈME DE PARRAINAGE ET CODE PROMO GOMOTO */}
            <div className="bg-amber-50/50 border border-amber-200 p-4.5 rounded-2xl text-left space-y-2.5">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>Code de Parrainage (Optionnel)</span>
              </div>
              <p className="text-[10.5px] text-slate-600 leading-normal">
                Avez-vous été invité par un autre motard ou voyageur ? Saisissez son code GoMoto ci-dessous pour activer votre bonus de parrainage de <b>15 000 CDF / $5.00 USD</b> sur votre wallet respectif dès aujourd'hui !
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: GOMOTO-LUKUSA-777"
                  value={referredByCode}
                  onChange={(e) => setReferredByCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none font-mono uppercase font-bold"
                />
                <button
                  type="button"
                  onClick={() => setReferredByCode("GOMOTO-LUKUSA-777")}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold px-3 py-1 text-[10px] rounded-xl transition-all cursor-pointer border border-amber-300"
                >
                  Code Démo
                </button>
              </div>
              {referredByCode.trim() && (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-2.5 text-[10px] flex items-start gap-1.5 leading-normal">
                  <span>🎁</span>
                  <span>
                    <b>Bonus Activé !</b> En finalisant l'inscription, vous allez recevoir <b>+15 000 CDF</b> et <b>+$5.00 USD</b> en bonus de parrainage. Le parrain propriétaire du code obtiendra le même montant sur son wallet.
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold py-3 rounded-xl text-xs transition-all cursor-pointer"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{selectedRole === "client" ? "Étape Suivante (Photo & IA)" : "Étape Suivante (Documents)"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: MANDATORY DOCUMENTS & IA COMPLIANCE ================= */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-705 uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>
                {selectedRole === "client" 
                  ? "Vérification de Sécurité & Photo de Profil" 
                  : "Pièces d'Identité Nationales & Photos de Transit"}
              </span>
            </h3>

            {/* National Identity Documents Section (Mandatory for all roles!) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              {selectedRole === "client" && (
                <div className="flex items-center gap-2 text-blue-650 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span>Réglementation Nationale RDC : Pièces d'identité obligatoires pour tous les citoyens</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Type de Document d'Identité <span className="text-red-500">*</span></label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as DocumentType)}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:border-blue-600 outline-none"
                  >
                    <option value="carte_identite_nationale" className="text-slate-800">Carte d'Identité Nationale Congolaise</option>
                    <option value="passeport" className="text-slate-800">Passeport National</option>
                    <option value="permis_de_conduire" className="text-slate-800">Permis de Conduire Congolais</option>
                    <option value="document_etranger" className="text-slate-800">Document Étranger (Carte de Résident / ONU)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Numéro du Document d'Identité <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Saisissez le code ou numéro..."
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 font-mono rounded-xl px-3 py-2 text-xs focus:border-blue-600 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Profile Picture Slot with Integrated Biometric AI Checker Suite */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-105 pb-3">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Analyse Biométrique de Conformité Faciale (GoMoto AI-Vision)
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-blue-50 text-blue-650 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  <span>ALGORITHME ACTIF</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* Simulated Camera Feed/Preview Grid Panel */}
                <div id="camera-feed-viewport" className="md:col-span-12 lg:col-span-5 flex flex-col items-center">
                  <div className="relative h-44 w-44 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0 group">
                    {profilePic ? (
                      <>
                        <img referrerPolicy="no-referrer" src={profilePic} alt="Profile preview feed" className="h-full w-full object-cover" />
                        
                        {/* Dynamic Scanning Line Overlay */}
                        {aiAnalysisStatus === "scanning" && (
                          <div 
                            className="absolute left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_12px_#3b82f6] transition-all duration-300"
                            style={{ top: `${aiStepProgress}%` }}
                          />
                        )}

                        {/* Scanner Grid Lines Overlay during scan */}
                        {aiAnalysisStatus === "scanning" && (
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.06)_1px,transparent_1px)] bg-[size:12px_12px] opacity-70 animate-pulse" />
                        )}

                        {/* Status overlays */}
                        {aiAnalysisStatus === "success" && (
                          <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center border border-emerald-500 rounded-2xl">
                            <span className="bg-emerald-500 text-white px-2 py-1 rounded-lg text-[9px] font-bold shadow-md flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              VISAGE CONFORME ✓
                            </span>
                          </div>
                        )}

                        {aiAnalysisStatus === "failed" && (
                          <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center border border-red-500 rounded-2xl">
                            <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-[9px] font-bold shadow-md flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              VISAGE REJETÉ ✗
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <User className="w-12 h-12 text-slate-350 mx-auto mb-2" />
                        <span className="text-[10px] text-slate-450 font-semibold leading-relaxed">Aucun portrait importé</span>
                      </div>
                    )}
                  </div>

                  {/* Actions for selecting mock photo */}
                  <div className="flex flex-col gap-2 w-full mt-3">
                    <label className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{profilePic ? "Choisir / Prendre une autre Photo" : "Choisir / Prendre une Photo 📸"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLocalFile(e, "profile")}
                        className="hidden"
                      />
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => {
                        handleMockPicture("profile");
                        setErrorMsg("");
                      }}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-1.5 rounded-xl text-[9px] flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-250"
                    >
                      <span>Utiliser une photo démo (Simuler portrait)</span>
                    </button>
                    {profilePic && (
                      <button
                        type="button"
                        onClick={() => setProfilePic("")}
                        className="text-[9px] text-red-500 hover:text-red-700 underline font-bold mt-1"
                      >
                        Retirer la photo
                      </button>
                    )}
                  </div>
                </div>

                {/* AI Processing and Verification Dashboard log/metrics */}
                <div className="md:col-span-12 lg:col-span-7 space-y-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Télémétrie d'Analyse Faciale (Kinshasa AI Node)
                    </h4>

                    {/* Progress indicator during scanning */}
                    {aiAnalysisStatus === "scanning" && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                          <span>Analyse des motifs biométriques...</span>
                          <span className="font-mono">{aiStepProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full transition-all duration-350 rounded-full shadow-[0_0_8px_#2563eb]"
                            style={{ width: `${aiStepProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Output metric rows */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-white p-2 rounded-lg border border-slate-150 flex items-center justify-between">
                        <span className="text-slate-500">Visage Détecté</span>
                        <span className={`font-bold font-mono ${aiMetrics.faceDetected ? "text-emerald-600" : "text-slate-400"}`}>
                          {aiMetrics.faceDetected ? "Oui ✓" : "En cours"}
                        </span>
                      </div>

                      <div className="bg-white p-2 rounded-lg border border-slate-150 flex items-center justify-between">
                        <span className="text-slate-500">Exposition Lumineus.</span>
                        <span className={`font-bold font-mono ${aiAnalysisStatus === "idle" ? "text-slate-400" : (aiMetrics.goodLighting ? "text-emerald-600" : "text-red-500")}`}>
                          {aiAnalysisStatus === "idle" ? "En attente" : (aiMetrics.goodLighting ? "OK ✓" : "Insuffisante ✗")}
                        </span>
                      </div>

                      <div className="bg-white p-2 rounded-lg border border-slate-150 flex items-center justify-between">
                        <span className="text-slate-500">Obstruction Faciale</span>
                        <span className={`font-bold font-mono ${aiAnalysisStatus === "idle" ? "text-slate-400" : (aiMetrics.noObstruction ? "text-emerald-600" : "text-red-500")}`}>
                          {aiAnalysisStatus === "idle" ? "En attente" : (aiMetrics.noObstruction ? "Aucune ✓" : "Présente ✗")}
                        </span>
                      </div>

                      <div className="bg-white p-2 rounded-lg border border-slate-150 flex items-center justify-between">
                        <span className="text-slate-500">Résolution / Focus</span>
                        <span className={`font-bold font-mono ${aiAnalysisStatus === "idle" ? "text-slate-400" : (aiMetrics.resolutionOk ? "text-emerald-600" : "text-red-550")}`}>
                          {aiAnalysisStatus === "idle" ? "En attente" : (aiMetrics.resolutionOk ? "OK ✓" : "Faible ✗")}
                        </span>
                      </div>
                    </div>

                    {/* Big Score Box */}
                    {aiAnalysisStatus !== "idle" && (
                      <div className="bg-white p-2 rounded-lg border border-slate-150 flex items-center justify-between animate-none">
                        <span className="text-[10px] text-slate-500 font-bold">Indice de similitude & confiance :</span>
                        <span className={`font-bold font-mono text-xs ${aiAnalysisStatus === "success" ? "text-emerald-600" : "text-red-500"}`}>
                          {aiMetrics.confidenceScore ? `${aiMetrics.confidenceScore}%` : "Calcul..."}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Terminal log window text */}
                  {currentAiCheckText && (
                    <div className="p-2.5 rounded-xl border bg-slate-900 border-slate-800 text-[10px] font-mono text-emerald-450 flex items-start gap-1.5 leading-snug">
                      <Cpu className="w-3.5 h-3.5 text-emerald-450 flex-shrink-0 animate-pulse" />
                      <span>{currentAiCheckText}</span>
                    </div>
                  )}

                  {/* Options & Start verification actions */}
                  {profilePic ? (
                    <div className="space-y-3 pt-1">
                      {aiAnalysisStatus === "idle" && (
                        <button
                          type="button"
                          onClick={handleStartAiAnalysis}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm animate-none"
                        >
                          <Sparkles className="w-4 h-4 text-blue-100" />
                          <span>Lancer l'Analyse Faciale par IA Cloud</span>
                        </button>
                      )}

                      {aiAnalysisStatus === "scanning" && (
                        <button
                          disabled
                          type="button"
                          className="w-full bg-blue-50 text-blue-600 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-blue-200 cursor-not-allowed"
                        >
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Validation biométrique en cours, veuillez patienter...</span>
                        </button>
                      )}

                      {(aiAnalysisStatus === "success" || aiAnalysisStatus === "failed") && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleStartAiAnalysis}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer border border-slate-200"
                          >
                            <RefreshCw className="w-3 h-3 text-slate-500" />
                            <span>Relancer l'Analyse IA</span>
                          </button>
                        </div>
                      )}

                      {/* Simulation fail trigger toggle switch */}
                      <label className="flex items-center gap-2.5 cursor-pointer pt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-150 select-none">
                        <input
                          type="checkbox"
                          checked={shouldSimulateFail}
                          onChange={(e) => {
                            setShouldSimulateFail(e.target.checked);
                            if (aiAnalysisStatus !== "idle") {
                              setAiAnalysisStatus("idle");
                              setAiStepProgress(0);
                              setCurrentAiCheckText("");
                              setAiMetrics({
                                faceDetected: false,
                                goodLighting: false,
                                noObstruction: false,
                                resolutionOk: false,
                                confidenceScore: 0
                              });
                            }
                          }}
                          className="h-4 w-4 bg-white border border-slate-300 text-blue-600 focus:ring-blue-500 rounded cursor-pointer"
                        />
                        <div className="text-[10px] text-slate-550 leading-tight">
                          <span className="font-bold block text-slate-700">Simuler une anomalie d'image</span>
                          <span className="text-[9px] text-slate-500">Pour tester le rejet d'une photo floue ou obstruée par notre IA</span>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-250 flex items-start gap-2.5 text-[10px] text-slate-700">
                      <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>Veuillez importer ou simuler une photo de profil pour activer le moteur d'analyse biométrique GoMoto AI.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Identity Document Retro/Verso Images (Mandatory for everyone!) */}
            <div className="space-y-3 border-t border-slate-100 pt-5">
              <label className="block text-xs font-bold text-slate-705 uppercase tracking-widest">
                {docType === "permis_de_conduire" 
                  ? "2. Numérisation du Permis de Conduire National (Recto / Verso) *" 
                  : "2. Numérisation de la Pièce de Sécurité (Recto / Verso) *"}
              </label>

              {/* LIVE CAMERA VIEWER PANEL */}
              {isCameraActive && cameraTarget && (
                <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-inner space-y-4 animate-fade-in text-left">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-ping" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-200 font-mono">
                        Objectif Caméra Actif ({cameraTarget === "front" ? "RECTO du Permis" : "VERSO du Permis"})
                      </span>
                    </div>
                    <button 
                      type="button" 
                      onClick={stopCamera}
                      className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-2.5 py-1 transition-all text-[11px] font-bold cursor-pointer"
                    >
                      Annuler ✕
                    </button>
                  </div>

                  {/* Video Viewport / Capture frame */}
                  <div className="relative aspect-video max-w-md mx-auto bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                    {capturedPreview ? (
                      <img referrerPolicy="no-referrer" src={capturedPreview} alt="Snapshot preview" className="w-full h-full object-cover" />
                    ) : (
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover" 
                      />
                    )}

                    {/* Centering overlay outline */}
                    {!capturedPreview && (
                      <div className="absolute inset-0 border-2 border-dashed border-emerald-500 rounded-xl pointer-events-none m-4 sm:m-6 flex flex-col justify-between p-2">
                        <div className="flex justify-between">
                          <div className="w-5 h-5 border-t-2 border-l-2 border-emerald-500" />
                          <div className="w-5 h-5 border-t-2 border-r-2 border-emerald-500" />
                        </div>
                        <p className="text-[10px] bg-emerald-950/85 text-emerald-300 font-extrabold px-3 py-1 rounded-full select-none text-center self-center tracking-wider max-w-[80%] uppercase font-sans animate-pulse border border-emerald-500">
                          Aligner le {cameraTarget === "front" ? "RECTO" : "VERSO"} du Permis de Conduire
                        </p>
                        <div className="flex justify-between">
                          <div className="w-5 h-5 border-b-2 border-l-2 border-emerald-500" />
                          <div className="w-5 h-5 border-b-2 border-r-2 border-emerald-500" />
                        </div>
                      </div>
                    )}

                    {/* Captured preview tag */}
                    {capturedPreview && (
                      <div className="absolute inset-0 bg-emerald-950/20 flex items-center justify-center border border-emerald-500 rounded-xl">
                        <span className="bg-emerald-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 animate-bounce">
                          <Check className="w-3.5 h-3.5" /> Prévisualisation du Cliché
                        </span>
                      </div>
                    )}
                  </div>

                  {cameraError && (
                    <div className="bg-red-950/45 border border-red-800 p-3 rounded-xl flex items-start gap-2 text-xs text-red-200">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  {/* Actions buttons */}
                  <div className="flex gap-3 justify-center">
                    {capturedPreview ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setCapturedPreview(null)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 shadow-sm"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                          <span>Reprendre la photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (cameraTarget === "front") {
                              setDocFront(capturedPreview);
                            } else if (cameraTarget === "back") {
                              setDocBack(capturedPreview);
                            }
                            stopCamera();
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                        >
                          <Check className="w-4 h-4" />
                          <span>Valider & Utiliser ce cliché</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 px-4 rounded-xl text-xs transition-all cursor-pointer border border-slate-700"
                        >
                          Fermer l'appareil
                        </button>
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
                        >
                          <Camera className="w-4 h-4 animate-pulse" />
                          <span>Prendre la photo 📸</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Photo Recto */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center flex flex-col justify-between min-h-[190px]">
                  {docFront ? (
                    <div className="relative h-24 w-full rounded-lg overflow-hidden border border-slate-200 bg-white">
                      <img referrerPolicy="no-referrer" src={docFront} alt="Front ID" className="h-full w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setDocFront("")}
                        className="absolute inset-0 bg-black/65 flex items-center justify-center text-xs text-red-400 hover:text-red-300 font-bold transition-all"
                      >
                        Effacer l'image (Recto)
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-slate-500 flex-grow border border-dashed border-slate-300 bg-white rounded-lg h-24">
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-[9px] text-slate-500 font-semibold">
                        {docType === "permis_de_conduire" 
                          ? "Permis de Conduire (Face avant / Recto)" 
                          : "Photo de la pièce (Face avant / Recto)"}
                      </span>
                    </div>
                  )}
                  <div className="space-y-2 mt-2">
                    {/* Live Camera Button */}
                    <button
                      type="button"
                      onClick={() => startCamera("front")}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg text-[10px] flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Prendre par Caméra en Direct 📸</span>
                    </button>

                    <label className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded-lg text-[10px] cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Importer un fichier image (Recto)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLocalFile(e, "front")}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleMockPicture("front")}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold py-1 rounded-lg text-[9px] transition-all border border-slate-250 cursor-pointer"
                    >
                      Utiliser une démo Recto
                    </button>
                  </div>
                </div>

                {/* Photo Verso */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center flex flex-col justify-between min-h-[190px]">
                  {docBack ? (
                    <div className="relative h-24 w-full rounded-lg overflow-hidden border border-slate-200 bg-white">
                      <img referrerPolicy="no-referrer" src={docBack} alt="Back ID" className="h-full w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setDocBack("")}
                        className="absolute inset-0 bg-black/65 flex items-center justify-center text-xs text-red-400 hover:text-red-300 font-bold transition-all"
                      >
                        Effacer l'image (Verso)
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-slate-500 flex-grow border border-dashed border-slate-300 bg-white rounded-lg h-24">
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-[9px] text-slate-500 font-semibold">
                        {docType === "permis_de_conduire" 
                          ? "Permis de Conduire (Face arrière / Verso)" 
                          : "Photo de la pièce (Face arrière / Verso)"}
                      </span>
                    </div>
                  )}
                  <div className="space-y-2 mt-2">
                    {/* Live Camera Button */}
                    <button
                      type="button"
                      onClick={() => startCamera("back")}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg text-[10px] flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Prendre par Caméra en Direct 📸</span>
                    </button>

                    <label className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded-lg text-[10px] cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Importer un fichier image (Verso)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLocalFile(e, "back")}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleMockPicture("back")}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold py-1 rounded-lg text-[9px] transition-all border border-slate-250 cursor-pointer"
                    >
                      Utiliser une démo Verso
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Locked Data Clause Reminder */}
            <div className="bg-amber-50 border border-amber-205 p-3.5 rounded-xl text-[10.5px] text-slate-755 flex items-start gap-2.5">
              <Shield className="w-4.5 h-4.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-amber-800">Avertissement de Verrouillage National :</span>
                <span className="text-slate-600 leading-relaxed block mt-0.5 animate-none">
                  Une fois ces informations validées par l'administration, elles seront associées à votre profil de transport et à votre compte Mobile Money. Aucun changement ou rectification majeure ne pourra s'effectuer sans l'ouverture d'un recours officiel de conformité auprès de la direction de GoMoto RDC.
                </span>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-205">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 bg-slate-105 hover:bg-slate-200 text-slate-650 font-bold py-3 rounded-xl text-xs transition-all cursor-pointer"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <FileCheck className="w-4 h-4" />
                <span>Soumettre mon dossier d'inscription</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
