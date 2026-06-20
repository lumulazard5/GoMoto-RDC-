import React, { useEffect, useState, useRef } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { Navigation, MapPin, Compass, RefreshCw, AlertTriangle, ShieldCheck, Flag, ShieldAlert, Wifi } from "lucide-react";
import { DRCAddress } from "../types";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

interface DriverMapTrackingProps {
  address: DRCAddress;
  pickupAddress?: DRCAddress;
  dropoffAddress?: DRCAddress;
  driverPosition?: { x: number; y: number };
  passengerPosition?: { x: number; y: number };
  isRideActive?: boolean;
  rideStatus?: "searching" | "accepted" | "arrived" | "picked_up" | "completed" | "cancelled" | "idle";
  height?: string;
  onSwitchToLocalSimulator?: () => void;
}

// Bounding cities in RDC
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  kinshasa: { lat: -4.3276, lng: 15.3135 },
  lubumbashi: { lat: -11.6608, lng: 27.4794 },
  goma: { lat: -1.6792, lng: 29.2285 },
  kisangani: { lat: 0.5152, lng: 25.1909 },
  bukavu: { lat: -2.5074, lng: 28.8544 },
  matadi: { lat: -5.8197, lng: 13.4507 },
  mbuji_mayi: { lat: -6.1500, lng: 23.6000 },
  kananga: { lat: -5.8958, lng: 22.4178 },
};

const horizontalRoads = [60, 140, 220, 300, 380];
const verticalRoads = [60, 150, 240, 330, 420];

const roadNamesHorizontal = [
  "Avenue du 30 Juin",
  "Avenue de la Libération",
  "Avenue Kasa-Vubu",
  "Avenue Kabinda",
  "Avenue des Huileries"
];

const roadNamesVertical = [
  "Avenue Université",
  "Boulevard Lumumba",
  "Avenue Mondjiba",
  "Avenue Colonel Ebeya",
  "Avenue Nguma"
];

const DARK_MAP_OPTIONS = {
  styles: [
    { elementType: "geometry", stylers: [{ color: "#0f172a" }] }, // Slate-900 background
    { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }, { weight: 2 }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] }, // Slate-500 text
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [{ color: "#334155" }], // Slate-700
    },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#1e293b" }], // Slate-800
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#0f172a" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#334155" }], // Slate-700 roads
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1e293b" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#1e293b" }, { weight: 3 }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#475569" }], // Slate-650
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#1e293b" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#020617" }], // Deep Slate representation of Congo River
    }
  ],
  disableDefaultUI: false,
  gestureHandling: "greedy",
};

export default function DriverMapTracking({
  address,
  pickupAddress,
  dropoffAddress,
  driverPosition = { x: 60, y: 300 },
  passengerPosition = { x: 240, y: 220 },
  isRideActive = false,
  rideStatus = "idle",
  height = "h-[320px]",
  onSwitchToLocalSimulator,
}: DriverMapTrackingProps) {
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: -4.3276, lng: 15.3135 });
  const [zoom, setZoom] = useState(14);
  const [trafficJams, setTrafficJams] = useState<any[]>([]);

  // Find base city position
  const getBaseLocation = () => {
    const cityKey = (address.city || "").toLowerCase().replace(/[^a-z_]/g, "");
    if (CITY_COORDINATES[cityKey]) return CITY_COORDINATES[cityKey];

    const provKey = (address.province || "").toLowerCase().replace(/[^a-z_]/g, "");
    if (CITY_COORDINATES[provKey]) return CITY_COORDINATES[provKey];

    // Check partial
    for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
      if (cityKey.includes(key) || provKey.includes(key) || key.includes(cityKey)) {
        return coords;
      }
    }
    return CITY_COORDINATES.kinshasa; // Default fallback (Kinshasa)
  };

  const centerCoords = getBaseLocation();

  useEffect(() => {
    setMapCenter(centerCoords);
  }, [address.city, address.province]);

  // Load simulated traffic jams on mount and sync
  useEffect(() => {
    const getSavedJams = () => {
      const saved = localStorage.getItem("gomoto_traffic_jams");
      if (saved) {
        try {
          setTrafficJams(JSON.parse(saved));
        } catch (e) {
          console.warn("Could not load traffic jams", e);
        }
      } else {
        // Fallbacks
        setTrafficJams([
          { id: "j-1", avenue: "Boulevard Lumumba", severity: "heavy", comment: "Panne mécanique majeure", x: 150, y: 220 },
          { id: "j-2", avenue: "Avenue Kasa-Vubu", severity: "moderate", comment: "Contrôle de police routière", x: 240, y: 140 }
        ]);
      }
    };
    getSavedJams();

    const interval = setInterval(getSavedJams, 3000);
    return () => clearInterval(interval);
  }, []);

  // Convert simulator grid to Map Coordinates
  const getLatLngFromGrid = (pos: { x: number; y: number }) => {
    // 250, 250 is center grid
    const scale = 0.000045; // custom scale for physical offsets
    const lat = centerCoords.lat + (250 - pos.y) * scale;
    const lng = centerCoords.lng + (pos.x - 250) * scale * 1.3;
    return { lat, lng };
  };

  const getCoordinatesForAddress = (addr: DRCAddress) => {
    if (!addr.avenue) {
      const seed = (addr.commune || "").length || 5;
      const xOffset = ((seed % 7) - 3) * 0.002;
      const yOffset = (((seed * 3) % 7) - 3) * 0.002;
      return { lat: centerCoords.lat + yOffset, lng: centerCoords.lng + xOffset };
    }

    const roadName = addr.avenue.toLowerCase();
    const hIdx = roadNamesHorizontal.findIndex(name => roadName.includes(name.toLowerCase()));
    const vIdx = roadNamesVertical.findIndex(name => roadName.includes(name.toLowerCase()));

    let yGrid = 250;
    let xGrid = 250;

    if (hIdx !== -1) {
      yGrid = horizontalRoads[hIdx];
    } else {
      yGrid = 100 + (roadName.charCodeAt(0) % 4) * 80;
    }

    if (vIdx !== -1) {
      xGrid = verticalRoads[vIdx];
    } else {
      xGrid = 100 + ((roadName.charCodeAt(roadName.length - 1) || 0) % 4) * 90;
    }

    return getLatLngFromGrid({ x: xGrid, y: yGrid });
  };

  // Coordinates
  const driverLatLng = getLatLngFromGrid(driverPosition);
  const pickupLatLng = pickupAddress ? getCoordinatesForAddress(pickupAddress) : getLatLngFromGrid(passengerPosition);
  const dropoffLatLng = dropoffAddress ? getCoordinatesForAddress(dropoffAddress) : getLatLngFromGrid({ x: 330, y: 300 });

  // Custom Polyline drawing controller
  function MapRouteOverlay({ pathCoords }: { pathCoords: google.maps.LatLngLiteral[] }) {
    const map = useMap();
    const polylineRef = useRef<google.maps.Polyline | null>(null);

    useEffect(() => {
      if (!map) return;

      // Remove old polyline
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }

      // Draw shiny Route path
      polylineRef.current = new google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: "#fbbf24", // Yellow accent for GoMoto branding
        strokeOpacity: 0.85,
        strokeWeight: 5,
        icons: [
          {
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 2,
              fillColor: "#fbbf24",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 1,
            },
            offset: "50%",
            repeat: "100px",
          },
        ],
      });

      polylineRef.current.setMap(map);

      // Fit map bounds to view all active points
      try {
        const bounds = new google.maps.LatLngBounds();
        pathCoords.forEach(coord => bounds.extend(coord));
        map.fitBounds(bounds, 60); // 60px padding
      } catch (err) {
        console.warn("Could not adapt map bounds:", err);
      }

      return () => {
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
        }
      };
    }, [map, pathCoords]);

    return null;
  }

  // Determine active route components to plot
  const getActivePath = () => {
    if (!isRideActive || rideStatus === "idle") return [];

    if (rideStatus === "accepted") {
      // Heading to passenger pickup point
      return [driverLatLng, pickupLatLng];
    } else if (rideStatus === "arrived") {
      return [driverLatLng, pickupLatLng];
    } else if (rideStatus === "picked_up") {
      // In progress to final dropoff
      return [driverLatLng, dropoffLatLng];
    }
    return [driverLatLng, pickupLatLng, dropoffLatLng];
  };

  const pathCoords = getActivePath();

  if (!hasValidKey) {
    return (
      <div className="bg-slate-900 border-2 border-dashed border-slate-800 rounded-3xl p-6 text-slate-350 font-sans shadow-xl min-h-[340px] flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full filter blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/5 rounded-full filter blur-2xl pointer-events-none"></div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="flex items-center gap-1.5 text-xs text-yellow-500 font-extrabold uppercase tracking-widest">
              <Compass className="w-4 h-4 animate-spin-slow" />
              Navigation Google Maps (Conducteur)
            </span>
            <span className="bg-amber-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded text-[8px] font-bold uppercase flex items-center gap-1 font-mono">
              <Wifi className="w-2.5 h-2.5" /> GPS Off
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-black text-white leading-snug">Visualisation GPS en Temps Réel</h3>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Pour suivre l'itinéraire du passager et votre position sur la carte satellite / plan Google Maps, la configuration de votre clé d'API Google Maps est indispensable.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850/60 text-xs text-left space-y-3 shadow-inner">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Configuration de la Clé Google Maps
            </span>
            
            <div className="space-y-2.5 text-[10px] text-slate-350 leading-relaxed font-sans">
              <p>
                <strong>1. Obtenir une clé d'API :</strong> Visitez la{" "}
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
                <strong>2. Ajouter le Secret Securisé :</strong> Ouvrez les <b>Paramètres</b> (onglet ⚙️ en haut à droite) → <b>Secrets</b> → Ajoutez le secret <code>GOOGLE_MAPS_PLATFORM_KEY</code> avec votre clé, puis validez.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 pt-4 border-t border-slate-800">
          {onSwitchToLocalSimulator && (
            <button
              type="button"
              onClick={onSwitchToLocalSimulator}
              className="flex-1 bg-yellow-500 hover:bg-yellow-450 text-slate-950 font-black py-2.5 rounded-xl text-[10.5px] uppercase tracking-wider transition-all hover:scale-[1.01] active:translate-y-0.5 cursor-pointer shadow-md"
            >
              Basculer vers le Simulateur Tactique 2D 🇨🇩
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${height} bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative`}>
      {/* Absolute Header HUD Bar overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-800/80 text-[10px] text-white flex items-center gap-1.5 shadow-lg">
          <Navigation className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
          <div className="font-mono">
            <span className="text-slate-400">Mode : </span>
            <span className="font-extrabold text-yellow-500">
              {rideStatus === "idle" ? "Patrouille / Scan Bouchons" : `Navigation (${rideStatus.toUpperCase()})`}
            </span>
          </div>
        </div>

        <div className="flex gap-1.5 pointer-events-all">
          <button
            type="button"
            onClick={() => {
              setMapCenter(driverLatLng);
              setZoom(15);
            }}
            className="bg-slate-900/95 hover:bg-slate-800 text-slate-300 p-2 rounded-xl border border-slate-800/80 shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center"
            title="Centrer sur ma Moto"
          >
            <Compass className="w-3.5 h-3.5 text-yellow-500" />
          </button>
          {onSwitchToLocalSimulator && (
            <button
              type="button"
              onClick={onSwitchToLocalSimulator}
              className="bg-slate-900/95 hover:bg-slate-800 text-yellow-500 font-extrabold px-2.5 py-1.5 text-[9px] uppercase tracking-wider rounded-xl border border-slate-800/80 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Simulateur 🇨🇩
            </button>
          )}
        </div>
      </div>

      {/* Google Maps Canvas container */}
      <div className="flex-grow h-full w-full relative">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            center={mapCenter}
            zoom={zoom}
            onCenterChanged={(e) => setMapCenter({ lat: e.detail.center.lat, lng: e.detail.center.lng })}
            onZoomChanged={(e) => setZoom(e.detail.zoom)}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            style={{ width: "100%", height: "100%" }}
            {...DARK_MAP_OPTIONS}
          >
            {/* 1. DRIVER MOTORCYCLE PATH PIN */}
            <AdvancedMarker
              position={driverLatLng}
              onClick={() => setSelectedPin("moto")}
            >
              {/* CF3: Custom HTML markers need explicit CSS sizing */}
              <div 
                style={{ width: "40px", height: "40px" }}
                className="flex items-center justify-center relative cursor-pointer"
              >
                <div className="absolute inset-0 bg-yellow-500/20 rounded-full animate-ping pointer-events-none scale-125" />
                <div className="w-8 h-8 rounded-full bg-slate-950 border-2 border-yellow-500 flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                  <Navigation className="w-4 h-4 text-yellow-400 rotate-45 transform" />
                </div>
                {/* Driver identity badge */}
                <div className="absolute -bottom-1 bg-yellow-500 text-slate-950 font-black text-[7px] uppercase px-1 rounded shadow">
                  MOTO
                </div>
              </div>
            </AdvancedMarker>

            {/* 2. PASSENGER PICKUP MARKER (Only if active course) */}
            {isRideActive && rideStatus !== "idle" && (
              <AdvancedMarker
                position={pickupLatLng}
                onClick={() => setSelectedPin("pickup")}
              >
                <div style={{ width: "36px", height: "36px" }} className="flex items-center justify-center relative cursor-pointer">
                  <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg hover:scale-105">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute -bottom-1 bg-blue-600 text-white font-extrabold text-[7px] uppercase px-1 rounded shadow">
                    Prise en charge
                  </div>
                </div>
              </AdvancedMarker>
            )}

            {/* 3. FINAL DROPOFF DESTINATION MARKER */}
            {isRideActive && rideStatus !== "idle" && (
              <AdvancedMarker
                position={dropoffLatLng}
                onClick={() => setSelectedPin("dropoff")}
              >
                <div style={{ width: "36px", height: "36px" }} className="flex items-center justify-center relative cursor-pointer">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center shadow-lg hover:scale-105">
                    <Flag className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="absolute -bottom-1 bg-emerald-600 text-white font-extrabold text-[7px] uppercase px-1.5 rounded shadow">
                    Dépose
                  </div>
                </div>
              </AdvancedMarker>
            )}

            {/* 4. TRAFFIC ALERT PINS */}
            {rideStatus === "idle" && trafficJams.map((jam) => {
              const jamLatLng = getLatLngFromGrid({ x: jam.x, y: jam.y });
              return (
                <AdvancedMarker
                  key={jam.id}
                  position={jamLatLng}
                  onClick={() => setSelectedPin(jam.id)}
                >
                  <div style={{ width: "32px", height: "32px" }} className="flex items-center justify-center relative cursor-pointer transition-all hover:scale-110">
                    <div className="w-6 h-6 rounded-full bg-red-600 border border-slate-900 flex items-center justify-center shadow-md animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* 5. PATH LINE OVERLAY */}
            {pathCoords.length > 1 && <MapRouteOverlay pathCoords={pathCoords} />}

            {/* INFO WINDOWS POPUPS */}
            {selectedPin === "moto" && (
              <InfoWindow position={driverLatLng} onCloseClick={() => setSelectedPin(null)}>
                <div className="p-1.5 max-w-[170px] text-slate-800 font-sans text-[10px]">
                  <p className="font-bold border-b border-slate-100 pb-1 mb-1 text-slate-950 flex items-center gap-1 text-[11px]">
                    <span className="h-1.5 w-1.5 bg-yellow-500 rounded-full"></span> Position Driver
                  </p>
                  <span>Votre radar GPS est chiffré de bout en bout et connecté aux relais cellulaires.</span>
                </div>
              </InfoWindow>
            )}

            {selectedPin === "pickup" && pickupAddress && (
              <InfoWindow position={pickupLatLng} onCloseClick={() => setSelectedPin(null)}>
                <div className="p-1.5 max-w-[170px] text-slate-800 font-sans text-[10px]">
                  <p className="font-bold border-b border-slate-100 pb-1 mb-1 text-blue-600 text-[11px]">
                    📍 Prise en Charge
                  </p>
                  <span className="font-semibold">{pickupAddress.avenue}</span>
                  <p className="text-slate-500 italic mt-0.5">{pickupAddress.commune}</p>
                </div>
              </InfoWindow>
            )}

            {selectedPin === "dropoff" && dropoffAddress && (
              <InfoWindow position={dropoffLatLng} onCloseClick={() => setSelectedPin(null)}>
                <div className="p-1.5 max-w-[170px] text-slate-800 font-sans text-[10px]">
                  <p className="font-bold border-b border-slate-100 pb-1 mb-1 text-emerald-600 text-[11px]">
                    🏁 Point de Dépose
                  </p>
                  <span className="font-semibold">{dropoffAddress.avenue}</span>
                  <p className="text-slate-500 italic mt-0.5">{dropoffAddress.commune}</p>
                </div>
              </InfoWindow>
            )}

            {/* Traffic jam popup */}
            {trafficJams.map((jam) => {
              if (selectedPin !== jam.id) return null;
              const jamLatLng = getLatLngFromGrid({ x: jam.x, y: jam.y });
              return (
                <InfoWindow key={jam.id} position={jamLatLng} onCloseClick={() => setSelectedPin(null)}>
                  <div className="p-1.5 max-w-[180px] text-slate-800 font-sans text-[10px]">
                    <p className="font-black text-rose-600 border-b border-slate-100 pb-1 mb-1 flex items-center gap-1 text-[11px]">
                      ⚠️ BOUCHON REPORTÉ
                    </p>
                    <span className="font-bold block text-slate-900">{jam.avenue}</span>
                    <span className="text-[10px] text-rose-700 bg-red-50 font-bold px-1 py-0.5 rounded uppercase inline-block my-1">
                      Gravité : {jam.severity === "heavy" ? "Critique" : "Moyenne"}
                    </span>
                    <p className="text-slate-600 mt-1 italic leading-relaxed">« {jam.comment} »</p>
                  </div>
                </InfoWindow>
              );
            })}
          </Map>
        </APIProvider>
      </div>

      {/* Driver Footer panel with GPS indicator */}
      <div className="bg-slate-900 border-t border-slate-800 p-2 text-[9.5px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span>Point GPS : <b className="text-slate-205">{address.commune}, {address.city}</b></span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-slate-850 px-1.5 py-0.5 rounded text-yellow-500 font-extrabold uppercase text-[8px] font-mono">
            Vitesse : 24 km/h
          </span>
        </div>
      </div>
    </div>
  );
}
