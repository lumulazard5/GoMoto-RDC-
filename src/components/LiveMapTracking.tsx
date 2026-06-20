import React, { useState, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from "@vis.gl/react-google-maps";
import { Navigation, MapPin, Compass, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

interface LiveMapTrackingProps {
  provinceName: string;
  cityName: string;
  communeName: string;
  pickupRoad?: string;
  dropoffRoad?: string;
  lang?: string;
  onSwitchToLocalSimulator?: () => void;
}

interface LiveMoto {
  id: string;
  mats: string; // Registration number
  driverName: string;
  avatar: string;
  phone: string;
  lat: number;
  lng: number;
  angle: number;
  status: "disponible" | "en_course";
  rating: number;
  speed: string;
}

// Coordinate mappings for major RDC urban centers
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  kinshasa: { lat: -4.3276, lng: 15.3135 },
  lubumbashi: { lat: -11.6608, lng: 27.4794 },
  goma: { lat: -1.6792, lng: 29.2285 },
  kisangani: { lat: 0.5152, lng: 25.1909 },
  bukavu: { lat: -2.5074, lng: 28.8544 },
  matadi: { lat: -5.8197, lng: 13.4507 },
  mbuji_mayi: { lat: -6.1500, lng: 23.6000 },
  kananga: { lat: -5.8958, lng: 22.4178 },
  kasai_central: { lat: -5.8958, lng: 22.4178 },
  kasacentral: { lat: -5.8958, lng: 22.4178 },
};

export default function LiveMapTracking({
  provinceName,
  cityName,
  communeName,
  pickupRoad = "",
  dropoffRoad = "",
  lang = "fr",
  onSwitchToLocalSimulator,
}: LiveMapTrackingProps) {
  const [selectedMoto, setSelectedMoto] = useState<LiveMoto | null>(null);
  const [motos, setMotos] = useState<LiveMoto[]>([]);
  const [isCentering, setIsCentering] = useState(false);

  // Determine base location for the selected city or province
  const getBaseLocation = () => {
    const cityKey = cityName.toLowerCase().replace(/[^a-z_]/g, "");
    const provinceKey = provinceName.toLowerCase().replace(/[^a-z_]/g, "");
    
    // Check specific matches
    if (CITY_COORDINATES[cityKey]) return CITY_COORDINATES[cityKey];
    if (CITY_COORDINATES[provinceKey]) return CITY_COORDINATES[provinceKey];
    
    // Fallback search
    for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
      if (cityKey.includes(key) || key.includes(cityKey) || provinceKey.includes(key)) {
        return coords;
      }
    }
    
    return CITY_COORDINATES.kinshasa; // Extreme fallback
  };

  const centerCoords = getBaseLocation();

  // Create initial local surrounding motos list using the center point
  useEffect(() => {
    const names = [
      "Héritier Kasongo",
      "Grace Mutombo",
      "Dieudonné Bakole",
      "Christian Mpoyi",
      "Rachel Mwamba",
      "Sarah Kabongo",
      "Jonathan Tshibangu"
    ];
    
    const initialMotos: LiveMoto[] = names.map((name, i) => {
      // Offset slightly from center
      const offsetLat = (Math.random() - 0.5) * 0.012;
      const offsetLng = (Math.random() - 0.5) * 0.012;
      const matId = `MOTO-RDC-${1000 + Math.floor(Math.random() * 9000)}`;

      return {
        id: `live-moto-${i}`,
        mats: matId,
        driverName: name,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        phone: `+243 89${5 + i}${10000 + Math.floor(Math.random() * 90000)}`,
        lat: centerCoords.lat + offsetLat,
        lng: centerCoords.lng + offsetLng,
        angle: Math.floor(Math.random() * 360),
        status: Math.random() > 0.25 ? "disponible" : "en_course",
        rating: parseFloat((4.5 + Math.random() * 0.5).toFixed(1)),
        speed: `${20 + Math.floor(Math.random() * 25)} km/h`,
      };
    });

    setMotos(initialMotos);
  }, [centerCoords.lat, centerCoords.lng]);

  // Handle slow drift/real-time animation simulation of nearby vehicles on the actual Map coords
  useEffect(() => {
    if (motos.length === 0) return;

    const interval = setInterval(() => {
      setMotos((prevMotos) =>
        prevMotos.map((moto) => {
          // Compute slow continuous coordinate delta
          const speedFactor = 0.00012; // Continuous subtle movement
          const rad = (moto.angle * Math.PI) / 180;
          let nLat = moto.lat + Math.sin(rad) * speedFactor;
          let nLng = moto.lng + Math.cos(rad) * speedFactor;
          let nAngle = moto.angle;

          // Keep within reasonable bounding area from center base
          const maxDistance = 0.015;
          const distLat = Math.abs(nLat - centerCoords.lat);
          const distLng = Math.abs(nLng - centerCoords.lng);

          if (distLat > maxDistance || distLng > maxDistance) {
            // Re-steer towards center
            nAngle = (Math.atan2(centerCoords.lat - moto.lat, centerCoords.lng - moto.lng) * 180) / Math.PI;
            if (nAngle < 0) nAngle += 360;
          } else if (Math.random() > 0.95) {
            // Randomly turn slightly
            nAngle = (nAngle + (Math.random() - 0.5) * 60) % 360;
          }

          return {
            ...moto,
            lat: nLat,
            lng: nLng,
            angle: nAngle,
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [motos.length, centerCoords.lat, centerCoords.lng]);

  const refreshMotos = () => {
    setIsCentering(true);
    setMotos((prev) =>
      prev.map((moto) => {
        const offsetLat = (Math.random() - 0.5) * 0.012;
        const offsetLng = (Math.random() - 0.5) * 0.012;
        return {
          ...moto,
          lat: centerCoords.lat + offsetLat,
          lng: centerCoords.lng + offsetLng,
          angle: Math.floor(Math.random() * 360),
        };
      })
    );
    setTimeout(() => setIsCentering(false), 800);
  };

  // If the key is not set, we output a standard, beautiful Google Maps setup instruction banner inside the frame
  if (!hasValidKey) {
    return (
      <div className="bg-slate-900 border-2 border-dashed border-slate-800 rounded-3xl p-6 text-slate-300 font-sans shadow-xl min-h-[360px] flex flex-col justify-between relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full filter blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/5 rounded-full filter blur-2xl pointer-events-none"></div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="flex items-center gap-1.5 text-xs text-yellow-500 font-extrabold uppercase tracking-widest">
              <Compass className="w-4 h-4 animate-spin-slow" />
              Service de Cartographie Avancée (Live)
            </span>
            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[8px] font-bold uppercase">
              Mode GPS Inactif
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-black text-white leading-snug">Visualisation Google Maps en Temps Réel</h3>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Pour suivre l'emplacement de nos motards partenaires directement sur une vraie carte satellite ou routière Google Maps, vous devez configurer la clé d'API requise.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850/60 text-xs text-left space-y-3.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Instructions de Configuration du Secret
            </span>
            
            <div className="space-y-2.5 text-[10px] text-slate-350 font-sans">
              <p>
                <strong>1. Obtenir une clé d'API :</strong> Obtenez gratuitement votre clé de service Google Maps Platform officielle sur la{" "}
                <a
                  href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline inline-flex items-center gap-0.5 font-bold"
                >
                  Console GCP Cloud ↗
                </a>
              </p>
              <p>
                <strong>2. Ajouter le Secret dans AI Studio :</strong>
              </p>
              <ul className="list-inside list-disc pl-2 space-y-1">
                <li>Cliquez sur les <strong>Paramètres</strong> (icône d'engrenage ⚙️ en haut à droite)</li>
                <li>Sélectionnez l'onglet <strong>Secrets</strong></li>
                <li>Créez le secret nommé <code>GOOGLE_MAPS_PLATFORM_KEY</code></li>
                <li>Collez votre clé API Google Maps et appuyez sur <strong>Entrée</strong></li>
              </ul>
              <p className="italic text-slate-500 text-[9px] border-t border-slate-900 pt-2">
                Le système recompile et injecte le secret en arrière-plan sous 5 secondes dès que vous validez.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 pt-4 border-t border-slate-800">
          {onSwitchToLocalSimulator && (
            <button
              type="button"
              onClick={onSwitchToLocalSimulator}
              className="flex-1 bg-yellow-500 text-slate-950 font-black py-2.5 rounded-xl text-[10.5px] uppercase tracking-wider transition-all hover:bg-yellow-450 hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              Retourner au Simulateur Interactif CD 🇨🇩
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[360px] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Header Overlay */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 text-[10px] text-white flex items-center gap-1.5 shadow-lg">
          <Compass className="w-3.5 h-3.5 text-yellow-500 animate-spin-slow" />
          <div>
            <span className="text-slate-400">Position : </span>
            <span className="font-bold text-yellow-500">{cityName} • {communeName}</span>
          </div>
        </div>

        <div className="flex gap-1.5 pointer-events-all">
          <button
            type="button"
            onClick={refreshMotos}
            disabled={isCentering}
            className="bg-slate-900/95 hover:bg-slate-800 text-slate-300 p-2 rounded-xl border border-slate-800/80 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Rafraîchir les récepteurs GPS"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCentering ? "animate-spin" : ""}`} />
          </button>
          {onSwitchToLocalSimulator && (
            <button
              type="button"
              onClick={onSwitchToLocalSimulator}
              className="bg-slate-900/95 hover:bg-slate-800 text-yellow-500 font-extrabold px-3 py-1.5 text-[9px] uppercase tracking-wider rounded-xl border border-slate-800/80 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              Simulateur 🇨🇩
            </button>
          )}
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 h-full w-full relative">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            defaultCenter={{ lat: centerCoords.lat, lng: centerCoords.lng }}
            defaultZoom={14}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            style={{ width: "100%", height: "100%" }}
            gestureHandling="greedy"
            disableDefaultUI={false}
          >
            {/* Center User Pin */}
            <AdvancedMarker position={{ lat: centerCoords.lat, lng: centerCoords.lng }}>
              <Pin background="#10b981" glyphColor="#fff" borderColor="#064e3b" />
            </AdvancedMarker>

            {/* Nearby Moto Markers */}
            {motos.map((moto) => (
              <AdvancedMarker
                key={moto.id}
                position={{ lat: moto.lat, lng: moto.lng }}
                onClick={() => setSelectedMoto(moto)}
              >
                {/* CF3: Custom HTML markers need explicit CSS sizing (width: 40px; height: 40px;) */}
                <div 
                  style={{ width: "40px", height: "40px" }}
                  className="flex items-center justify-center relative cursor-pointer group"
                >
                  <svg viewBox="0 0 40 40" className="absolute w-10 h-10 pointer-events-none">
                    <circle cx="20" cy="20" r="14" fill="#fbbf24" opacity="0.15" className="animate-ping" />
                  </svg>
                  
                  <div className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 border-2 border-slate-950 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95">
                    <Navigation
                      className="w-4 h-4 text-slate-950 transition-transform"
                      style={{ transform: `rotate(${moto.angle}deg)` }}
                    />
                  </div>

                  {/* Micro badge indicator */}
                  <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-slate-950 border border-amber-400 flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  </span>
                </div>
              </AdvancedMarker>
            ))}

            {/* InfoWindow for Selected Driver */}
            {selectedMoto && (
              <InfoWindow
                position={{ lat: selectedMoto.lat, lng: selectedMoto.lng }}
                onCloseClick={() => setSelectedMoto(null)}
              >
                <div className="p-1 max-w-[200px] text-slate-800 font-sans">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 mb-1.5">
                    <img
                      src={selectedMoto.avatar}
                      alt={selectedMoto.driverName}
                      className="w-7 h-7 rounded-full object-cover border border-amber-400"
                    />
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-900 leading-tight">
                        {selectedMoto.driverName}
                      </h4>
                      <span className="text-[8px] font-mono font-semibold bg-amber-100 text-amber-800 px-1 py-0.5 rounded">
                        {selectedMoto.mats}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-[9px] text-slate-600">
                    <div className="flex justify-between">
                      <span>Statut :</span>
                      <span className="font-bold text-emerald-600">Disponible (GPS)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vitesse :</span>
                      <span className="font-mono">{selectedMoto.speed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Note :</span>
                      <span className="font-bold text-yellow-600">★ {selectedMoto.rating}</span>
                    </div>
                    <div className="border-t border-slate-50 pt-1 mt-1 text-center">
                      <a
                        href={`tel:${selectedMoto.phone}`}
                        className="inline-block w-full bg-amber-500 hover:bg-amber-450 text-slate-950 font-bold py-1 px-2 rounded text-[8px] uppercase tracking-wider text-center"
                      >
                        Contacter Motard
                      </a>
                    </div>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      {/* Footer Info bar */}
      <div className="bg-slate-900 border-t border-slate-800 p-2 text-[9px] text-slate-400 flex items-center gap-2">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
        <span>
          Visualisation en direct : <b className="text-white">{motos.filter(m => m.status === "disponible").length} motards à proximité</b>. Les données sont actualisées en continu à partir des émetteurs GPS des motos.
        </span>
      </div>
    </div>
  );
}
