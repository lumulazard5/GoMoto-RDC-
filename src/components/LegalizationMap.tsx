import React, { useState, useMemo, useEffect } from "react";
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow, 
  Pin, 
  useMap 
} from "@vis.gl/react-google-maps";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  Coins, 
  FileCheck2, 
  Search, 
  Info, 
  Navigation,
  Globe,
  Plus,
  Scale,
  Compass,
  AlertCircle,
  Star,
  MessageSquare
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

// API Key configuration following Constitution Rules and Skeletons
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

export interface LegalizationCenter {
  id: string;
  name: string;
  type: "ministere" | "hotel_de_ville" | "parquet" | "maison_communale";
  typeName: string;
  lat: number;
  lng: number;
  city: "Kinshasa" | "Lubumbashi" | "Goma";
  address: string;
  hours: string;
  fees: string;
  documents: string[];
  requirements: string[];
  processingTime: string;
  phone?: string;
  link?: string;
}

// Complete actual legalization centers database in RDC
const LEGALIZATION_CENTERS: LegalizationCenter[] = [
  {
    id: "lc-1",
    name: "Ministère des Affaires Étrangères - Direction de la Chancellerie",
    type: "ministere",
    typeName: "Ministère National",
    lat: -4.3039,
    lng: 15.3122,
    city: "Kinshasa",
    address: "Place de la Reconstruction (Ex-Place de l'Échangeur / Avenue de la Justice), Commune de la Gombe, Kinshasa",
    hours: "Lundi - Vendredi: 08h30 - 15h30",
    fees: "20 à 30 USD (payable en Francs Congolais au taux budgétaire officiel)",
    documents: [
      "Attestations d'études ou diplômes certifiés",
      "Passeports et actes civils destinés à l'international",
      "Actes notariés et procurations authentifiées"
    ],
    requirements: [
      "Original du document visé au préalable par le ministère de tutelle",
      "Carte d'Électeur CENI valide",
      "Formulaire d'enregistrement physique rempli"
    ],
    processingTime: "48 à 72 Heures ouvrables",
    phone: "+243 81 500 4000",
    link: "https://www.diplomatie.gouv.cd"
  },
  {
    id: "lc-2",
    name: "Hôtel de Ville de Kinshasa - Division Urbaine de l'État Civil",
    type: "hotel_de_ville",
    typeName: "Hôtel de Ville",
    lat: -4.3094,
    lng: 15.3090,
    city: "Kinshasa",
    address: "Avenue du 24 Novembre, face au Palais de la Nation, Gombe, Kinshasa",
    hours: "Lundi - Samedi: 08h00 - 16h00",
    fees: "15,000 CDF à 25,000 CDF (selon la nature de l'acte)",
    documents: [
      "Actes de Naissance et Certificats de Célibat",
      "Contrats de Mariage civils locaux",
      "Procès-verbaux et actes de notoriété publique"
    ],
    requirements: [
      "Copie certifiée conforme préliminaire de la commune d'origine",
      "Présence conjointe des témoins ou signataires si l'acte est à rédiger",
      "Quittance de paiement de la taxe d'État Civil"
    ],
    processingTime: "24 Heures (Express disponible en 4h)"
  },
  {
    id: "lc-3",
    name: "Parquet Général près le Tribunal de Grande Instance (TGI) de la Gombe",
    type: "parquet",
    typeName: "Palais de Justice",
    lat: -4.3025,
    lng: 15.3140,
    city: "Kinshasa",
    address: "Avenue de la Justice, face au bâtiment de la Cour de Cassation, Gombe, Kinshasa",
    hours: "Lundi - Vendredi: 09h00 - 15h00",
    fees: "12,000 CDF pour l'Extrait de Casier Judiciaire",
    documents: [
      "Extrait de Casier Judiciaire (Attestation de Bonne conduite, vie & mœurs)",
      "Procurations spéciales et actes à portée juridique",
      "Attestations d'affiliation ou de non-poursuite pénale"
    ],
    requirements: [
      "Fiche d'empreintes digitales (prélevées sur place par les agents d'identification)",
      "2 photos passeport fond blanc identiques",
      "Carte d'identité nationale / carte d'électeur originale"
    ],
    processingTime: "24 à 48 heures",
    phone: "+243 89 222 0001"
  },
  {
    id: "lc-4",
    name: "Maison Communale de Ngaliema - Département Notariat & État Civil",
    type: "maison_communale",
    typeName: "Maison Communale",
    lat: -4.3541,
    lng: 15.2530,
    city: "Kinshasa",
    address: "Avenue de la Montagne, Quartier Macampagne, Ngaliema, Kinshasa",
    hours: "Lundi - Samedi: 08h00 - 15h00",
    fees: "10,000 CDF pour attestation individuelle",
    documents: [
      "Attestation de Résidence locale",
      "Certificat de Naissance rédigé (dans les 90 jours)",
      "Légalisation de signatures privées (Procuration, Vente de moto)"
    ],
    requirements: [
      "Preuve d'habitation signée par le chef d'avenue/quartier",
      "Pièce d'identité originale et présence physique du signataire",
      "Copie du contrat d'achat si document de mutation d'engin"
    ],
    processingTime: "Immédiat ou le jour-même"
  },
  {
    id: "lc-5",
    name: "Maison Communale de Limete - Bureau Légalisations",
    type: "maison_communale",
    typeName: "Maison Communale",
    lat: -4.3562,
    lng: 15.3370,
    city: "Kinshasa",
    address: "Boulevard Lumumba, Proche de la 12ème Rue Limete résidentiel, Kinshasa",
    hours: "Lundi - Vendredi: 08h00 - 15h30",
    fees: "10,000 CDF à 15,000 CDF",
    documents: [
      "Actes de vente de motocyclettes / Mutation de Carte Rose",
      "Attestations de Prise en charge familiale",
      "Certificats d'indigence ou de bonne moralité"
    ],
    requirements: [
      "Acte d'achat original visé par un témoin légal",
      "Présence légale du vendeur et de l'acheteur de la moto",
      "Pièces d'identité CENI des deux parties"
    ],
    processingTime: "Moins de 2 heures"
  },
  {
    id: "lc-6",
    name: "Hôtel de Ville de Lubumbashi - Bureau Provincial de Légalisations",
    type: "hotel_de_ville",
    typeName: "Hôtel de Ville",
    lat: -11.6607,
    lng: 27.4794,
    city: "Lubumbashi",
    address: "Avenue Kasa-Vubu, face à la Grand Place du Centenaire, Lubumbashi, Haut-Katanga",
    hours: "Lundi - Vendredi: 08h30 - 15h30",
    fees: "18,000 CDF par fiche certifiée",
    documents: [
      "Autorisations de transport public de véhicules",
      "Légalisation de documents scolaires provinciaux",
      "Actes civils et pièces de d'identité certifiées conformes"
    ],
    requirements: [
      "Original du document requis",
      "Preuve de résidence dans la province du Haut-Katanga",
      "Timbre fiscal provincial acheté au guichet agréé"
    ],
    processingTime: "24 Heures"
  },
  {
    id: "lc-7",
    name: "Tribunal de Grande Instance (TGI) de Goma - Greffe Civil",
    type: "parquet",
    typeName: "Palais de Justice",
    lat: -1.6775,
    lng: 29.2198,
    city: "Goma",
    address: "Avenue du Rond-point Signers, Centre-ville, Goma, Nord-Kivu",
    hours: "Lundi - Vendredi: 09h00 - 14h30",
    fees: "12,000 CDF",
    documents: [
      "Extrait de Casier Judiciaire pour le Kivu",
      "Attestations judiciaires de conformité",
      "Authentification de contrats d'exploitation d'engins"
    ],
    requirements: [
      "Relevé d'empreintes digitales auprès du bureau judiciaire local",
      "Carte d'Électeur ou attestation de perte de pièces",
      "Deux photos fond blanc récentes"
    ],
    processingTime: "48 heures",
    phone: "+243 99 440 2200"
  }
];

// Helper to center the map when double clicking some city
const CITY_CENTERS = {
  Kinshasa: { lat: -4.325, lng: 15.322 },
  Lubumbashi: { lat: -11.6607, lng: 27.4794 },
  Goma: { lat: -1.6775, lng: 29.2198 }
};

// Component to handle pan controls smoothly in vis.gl
function MapHandler({ targetCenter }: { targetCenter: google.maps.LatLngLiteral | null }) {
  const map = useMap();
  useEffect(() => {
    if (map && targetCenter) {
      map.panTo(targetCenter);
      map.setZoom(14);
    }
  }, [map, targetCenter]);
  return null;
}

export default function LegalizationMap() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<"all" | "Kinshasa" | "Lubumbashi" | "Goma">("all");
  const [selectedType, setSelectedType] = useState<"all" | "ministere" | "hotel_de_ville" | "parquet" | "maison_communale">("all");
  const [selectedCenter, setSelectedCenter] = useState<LegalizationCenter | null>(LEGALIZATION_CENTERS[0]);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>("lc-1");
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral | null>(null);

  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!selectedCenter) return;
    
    const fetchReviews = async () => {
      setLoadingReviews(true);
      setFeedbackMsg(null);
      try {
        const res = await fetch(`/api/legalization/reviews?centerId=${selectedCenter.id}`);
        if (!res.ok) {
          throw new Error("Impossible de charger les avis.");
        }
        const data = await res.json();
        setReviews(data);
      } catch (err: any) {
        console.error("Error loading reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [selectedCenter]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCenter) return;
    if (!newComment.trim()) {
      setFeedbackMsg({ type: "error", text: "Veuillez saisir un commentaire." });
      return;
    }

    setSubmittingReview(true);
    setFeedbackMsg(null);

    try {
      let idToken = "";
      if (user) {
        const isVirtual = user.uid.startsWith("virtual-");
        if (isVirtual) {
          idToken = user.uid;
        } else {
          const firebaseAuth = (await import("../firebase")).auth;
          idToken = (await firebaseAuth.currentUser?.getIdToken()) || "";
        }
      }

      if (!idToken) {
        throw new Error("Vous devez être authentifié pour soumettre un avis.");
      }

      const response = await fetch("/api/legalization/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          centerId: selectedCenter.id,
          rating: newRating,
          comment: newComment.trim()
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Une erreur s'est produite.");
      }

      setFeedbackMsg({ type: "success", text: "Avis enregistré avec succès !" });
      setNewComment("");
      setNewRating(5);
      setReviews(prev => [result.review, ...prev]);
    } catch (err: any) {
      console.error("Error submitting review:", err);
      setFeedbackMsg({ type: "error", text: err.message || "Erreur lors de la soumission." });
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filter service points
  const filteredCenters = useMemo(() => {
    return LEGALIZATION_CENTERS.filter(center => {
      const matchesSearch = center.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            center.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            center.documents.some(doc => doc.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCity = selectedCity === "all" || center.city === selectedCity;
      const matchesType = selectedType === "all" || center.type === selectedType;
      return matchesSearch && matchesCity && matchesType;
    });
  }, [searchQuery, selectedCity, selectedType]);

  const handleSelectCenter = (center: LegalizationCenter) => {
    setSelectedCenter(center);
    setActiveMarkerId(center.id);
    setMapCenter({ lat: center.lat, lng: center.lng });
  };

  // Setup splash view if API is not set up securely
  if (!hasValidKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] bg-slate-900 border-2 border-slate-800 rounded-3xl p-8 text-slate-300 font-sans text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient from-blue-500/10 to-transparent pointer-events-none" />
        <div className="p-4 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-3xl animate-pulse">
          <Scale className="w-10 h-10" />
        </div>
        <div className="max-w-md space-y-3">
          <h3 className="text-lg font-black text-white uppercase tracking-wider font-sans">
            Clé d'API Google Maps Requise
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pour visualiser de manière dynamique la carte officielle GoMoto des points de légalisation administrative en RDC (Communes, Parquets et Ministères), une clé d'API certifiée Google Maps Platform est requise.
          </p>
        </div>

        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-850 text-left space-y-3 max-w-sm text-[11px] leading-relaxed">
          <div className="flex gap-2">
            <span className="w-4 h-4 rounded bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[9px] shrink-0">1</span>
            <p>
              Obtenez une clé API : <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-blue-400 font-bold underline hover:text-blue-300">Google Cloud Console</a>
            </p>
          </div>
          <div className="flex gap-2">
            <span className="w-4 h-4 rounded bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[9px] shrink-0">2</span>
            <p>
              Ouvrez les <b className="text-slate-200">Settings (⚙️)</b> en haut à droite.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="w-4 h-4 rounded bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[9px] shrink-0">3</span>
            <p>
              Accédez à <b className="text-slate-200">Secrets</b>, tapez <code className="font-mono bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-amber-400">GOOGLE_MAPS_PLATFORM_KEY</code> puis collez votre clé d'API d'État.
            </p>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 italic">
          L'application compile et recharge votre carte interactive automatiquement.
        </p>

        {/* Demo Fallback Data display for users in need */}
        <div className="w-full max-w-lg border border-slate-800/80 rounded-2xl p-4 bg-slate-950/40 text-left space-y-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Points de service enregistrés (Lutte anti-tracasseries RDC) :</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
            {LEGALIZATION_CENTERS.slice(0, 4).map(c => (
              <div key={c.id} className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-850">
                <p className="font-bold text-white leading-tight truncate">{c.name}</p>
                <p className="text-slate-450 mt-1 truncate">{c.address}</p>
                <p className="text-amber-500 text-[9px] font-mono mt-0.5">{c.fees}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-3xl p-4 sm:p-6 text-white space-y-6 shadow-2xl relative overflow-hidden">
      
      {/* Background radial soft light blur */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 blur-[100px] pointer-events-none rounded-full" />
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10 border-b border-slate-900 pb-5">
        <div className="space-y-1.5 text-left">
          <span className="text-[9px] font-mono font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
            Régularisation Légale & Documents
          </span>
          <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-500" />
            <span>Guichet de Recours & Légalisations d'État</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
            Retrouvez de manière interactive les bureaux municipaux, cours de justice et préfectures homologuées pour certifier vos permis de conduire, casiers judiciaires et titres civils.
          </p>
        </div>
        
        {/* Support Alert Box */}
        <div className="bg-blue-950/40 p-3 rounded-2xl border border-blue-900/30 flex items-start gap-2 max-w-sm text-left">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-300 leading-normal">
            <b>Conseil de Sécurité :</b> Les certificats obtenus en ligne sur des sites non étatiques ne sont pas reçus par la PNC. Présentez-vous exclusivement à ces points désignés munis de votre carte d'électeur originale.
          </p>
        </div>
      </div>

      {/* Grid Layout Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 relative z-10">
        
        {/* Search, Filter and Information lists (Left 5 cols) */}
        <div className="md:col-span-5 space-y-4 flex flex-col max-h-[550px]">
          
          {/* Controls Panel */}
          <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-3 shrink-0">
            {/* Search Input bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom, acte visé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 pl-9 pr-3 py-1.5 focus:py-2 text-xs border border-slate-800 focus:border-blue-500/60 rounded-xl outline-none placeholder:text-slate-600 transition-all text-white text-sans"
              />
            </div>

            {/* Quick dropdown filters */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {/* City filter selection */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Ville :</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white font-semibold focus:outline-none focus:border-blue-500/50"
                >
                  <option value="all">Toutes les Villes</option>
                  <option value="Kinshasa">Kinshasa</option>
                  <option value="Lubumbashi">Lubumbashi</option>
                  <option value="Goma">Goma</option>
                </select>
              </div>

              {/* Type Category selection */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Organe :</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white font-semibold focus:outline-none focus:border-blue-500/50"
                >
                  <option value="all">Tous les Organes</option>
                  <option value="ministere">Ministère National</option>
                  <option value="hotel_de_ville">Hôtels de Ville</option>
                  <option value="parquet">Palais / Parquets</option>
                  <option value="maison_communale">Maisons Communales</option>
                </select>
              </div>
            </div>
          </div>

          {/* Service points interactive selection list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin max-h-[380px]">
            {filteredCenters.length > 0 ? (
              filteredCenters.map(center => {
                const isSelected = selectedCenter?.id === center.id;
                return (
                  <div
                    key={center.id}
                    onClick={() => handleSelectCenter(center)}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                      isSelected 
                        ? "bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-500/5" 
                        : "bg-slate-900 border-slate-850 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider font-mono ${
                        center.type === "ministere" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        center.type === "parquet" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                        center.type === "hotel_de_ville" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {center.typeName}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 font-sans">
                        📍 {center.city}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-[12px] text-white mt-2 leading-snug">
                      {center.name}
                    </h4>

                    <p className="text-[10.5px] text-slate-400 mt-1 lines-clamp-2 leading-relaxed">
                      {center.address}
                    </p>

                    <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500 pt-2 border-t border-slate-850/60 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {center.processingTime}
                      </span>
                      <span className="text-amber-500 font-extrabold">
                        {center.fees.split("(")[0]}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-slate-900/40 border border-slate-850 rounded-2xl space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-650 mx-auto" />
                <h5 className="font-bold text-slate-400 text-xs">Aucun point de service trouvé</h5>
                <p className="text-[10px] text-slate-500 leading-normal max-w-xs mx-auto">
                  Ajustez vos filtres par ville ou catégorie d'organe ou vérifiez l'orthographe de votre recherche.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Map and Full location details (Right 7 cols) */}
        <div className="md:col-span-7 space-y-4">
          
          {/* Map canvas wrapping API Provider (explicit sizing, CF2 compliant) */}
          <div className="h-[280px] sm:h-[320px] rounded-2xl border border-slate-800 overflow-hidden relative shadow-inner">
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                defaultCenter={CITY_CENTERS.Kinshasa}
                defaultZoom={12}
                mapId="L legalization_points_map"
                internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                style={{ width: "100%", height: "100%" }}
              >
                {LEGALIZATION_CENTERS.map(center => {
                  const isSelected = selectedCenter?.id === center.id;
                  return (
                    <AdvancedMarker
                      key={center.id}
                      position={{ lat: center.lat, lng: center.lng }}
                      onClick={() => handleSelectCenter(center)}
                      title={center.name}
                    >
                      <Pin 
                        background={isSelected ? "#2563eb" : center.type === "ministere" ? "#ef4444" : center.type === "parquet" ? "#a855f7" : center.type === "hotel_de_ville" ? "#f59e0b" : "#10b981"} 
                        glyphColor="#ffffff" 
                        borderColor={isSelected ? "#1d4ed8" : "#0f172a"}
                      />
                    </AdvancedMarker>
                  );
                })}
                <MapHandler targetCenter={mapCenter} />
              </Map>
            </APIProvider>

            {/* Quick Map utility HUD Overlay panel on top right */}
            <div className="absolute top-2.5 left-2.5 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 text-[10px] font-mono select-none pointer-events-none flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: "12s" }} />
              <span>Système de Géolocalisation Actif</span>
            </div>
            
            {/* Direct center cities trigger list bottom edge */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-800 flex items-center gap-2 max-w-[90%]">
              <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest font-mono">Secteurs :</span>
              {Object.keys(CITY_CENTERS).map(city => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    const coords = CITY_CENTERS[city as keyof typeof CITY_CENTERS];
                    setMapCenter(coords);
                    setSelectedCity(city as any);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-bold hover:bg-slate-900 hover:text-white transition-all text-slate-300"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Details panel for selected center */}
          {selectedCenter && (
            <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl text-left space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/60 pb-3">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                      {selectedCenter.typeName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      📍 {selectedCenter.city}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white leading-snug">
                    {selectedCenter.name}
                  </h4>
                </div>

                {selectedCenter.link && (
                  <a
                    href={selectedCenter.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] rounded-lg shadow-md transition-all self-stretch sm:self-auto text-center justify-center cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Visiter le portail</span>
                  </a>
                )}
              </div>

              {/* Grid content attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Hours, location, contact */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block font-mono">Adresse physique</span>
                      <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">{selectedCenter.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block font-mono">Heures de service</span>
                      <p className="text-slate-300 text-[11px] mt-0.5">{selectedCenter.hours}</p>
                    </div>
                  </div>

                  {selectedCenter.phone && (
                    <div className="flex items-start gap-2.5">
                      <Phone className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block font-mono">Ligne d'assistance</span>
                        <p className="text-slate-300 text-[11px] mt-0.5">{selectedCenter.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2.5">
                    <Coins className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block font-mono">Tarifs officiels légaux d'État</span>
                      <p className="text-amber-500 text-[11px] font-bold mt-0.5">{selectedCenter.fees}</p>
                    </div>
                  </div>
                </div>

                {/* Documents & Requirements checklist */}
                <div className="space-y-3.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-850/60 structure">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block font-mono flex items-center gap-1">
                      <FileCheck2 className="w-3.5 h-3.5 text-blue-400" /> Documents légalisés
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-300 pl-1 list-none text-left">
                      {selectedCenter.documents.map((doc, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-850/50">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block font-mono">Exigences requises</span>
                    <ul className="space-y-1 text-[11px] text-slate-300 pl-1 list-none text-left">
                      {selectedCenter.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Avis Citoyens & Recours d'arbitrage */}
              <div className="border-t border-slate-800/80 pt-5 mt-5 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  <h5 className="text-xs font-black uppercase tracking-wider text-white">
                    Avis & Certifications Citoyennes (Persistance Réelle)
                  </h5>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Recent Reviews */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
                      Retours récents des utilisateurs de GoMoto :
                    </span>
                    
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                      {loadingReviews ? (
                        <p className="text-[11px] text-slate-500 italic">Chargement des avis citoyens...</p>
                      ) : reviews.length > 0 ? (
                        reviews.map((r) => (
                          <div key={r.id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 text-left space-y-1.5 animate-in fade-in">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-mono text-slate-400 font-semibold">
                                👤 {r.userEmail ? r.userEmail.replace(/^(.)(.*)(@.*)$/, (_: any, f: string, m: string, rest: string) => f + "****" + rest) : "Citoyen Anonyme"}
                              </span>
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/15 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider font-mono">
                                {r.userRole === "driver" ? "Chauffeur" : r.userRole === "owner" ? "Propriétaire" : r.userRole === "admin" ? "Admin" : r.userRole || "Citoyen"}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-amber-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < r.rating ? "fill-amber-400" : "text-slate-700"}`}
                                />
                              ))}
                              <span className="text-[9.5px] text-slate-500 ml-1 font-mono">
                                {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                            
                            <p className="text-slate-300 text-[11px] leading-relaxed italic">
                              "{r.comment}"
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 bg-slate-950/20 border border-slate-850/60 rounded-xl text-center space-y-1">
                          <p className="text-[11px] text-slate-500 leading-normal">
                            Aucun avis pour l'instant. Soyez le premier citoyen certifié à partager son expérience de légalisation !
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Submit Form */}
                  <div className="space-y-3 bg-slate-950/30 p-4 rounded-xl border border-slate-850/60">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
                      Certifier votre passage :
                    </span>

                    {user ? (
                      <form onSubmit={handleSubmitReview} className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 block font-sans">
                            Sélectionner votre Note :
                          </label>
                          <div className="flex items-center gap-1.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setNewRating(i + 1)}
                                className="transition-transform hover:scale-110 shrink-0"
                              >
                                <Star
                                  className={`w-5 h-5 cursor-pointer ${
                                    i < newRating ? "text-amber-400 fill-amber-400" : "text-slate-700"
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="text-xs font-bold text-slate-400 ml-2 font-mono">{newRating} / 5</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-sans">
                            Votre commentaire de conformité :
                          </label>
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Ex: Personnel accueillant, frais réglementaires d'État payés de 20 USD. Légalisation reçue après 2h d'attente."
                            rows={3}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-lg p-2 text-xs focus:outline-none transition-all outline-none text-white text-sans resize-none placeholder:text-slate-600 leading-relaxed"
                          />
                        </div>

                        {feedbackMsg && (
                          <p className={`text-[10px] font-bold px-2 py-1 rounded text-left ${
                            feedbackMsg.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-red-500/10 text-red-400 border border-red-500/15"
                          }`}>
                            {feedbackMsg.text}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10.5px] py-1.5 rounded-lg shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {submittingReview ? "Transmission..." : "Enregistrer mon Avis"}
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-3 py-2 text-center">
                        <AlertCircle className="w-6 h-6 text-yellow-500 mx-auto" />
                        <p className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto">
                          Vous devez être connecté avec votre compte GoMoto pour soumettre un avis citoyen sur ce point de légalisation d'État en temps réel.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
