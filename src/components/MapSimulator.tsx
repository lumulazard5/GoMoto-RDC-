/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Coffee, Navigation, MapPin, Eye, Compass, RefreshCw } from "lucide-react";
import { DRCAddress } from "../types";

interface MapSimulatorProps {
  address: DRCAddress;
  pickupAddress?: DRCAddress;
  dropoffAddress?: DRCAddress;
  driverPosition?: { x: number; y: number };
  passengerPosition?: { x: number; y: number };
  isRideActive?: boolean;
  rideStatus?: "searching" | "accepted" | "picked_up" | "completed" | "cancelled";
  onMapClick?: (avenue: string, pos: { x: number; y: number }) => void;
  height?: string;
  role?: "client" | "driver" | "admin" | "owner";
}

interface Landmark {
  name: string;
  x: number;
  y: number;
  type: "office" | "hotel" | "stadium" | "nature" | "market";
}

interface SimulatedTaxi {
  id: string;
  name: string;
  x: number;
  y: number;
  angle: number;
  isOnline: boolean;
  status: "idle" | "busy";
}

export default function MapSimulator({
  address,
  pickupAddress,
  dropoffAddress,
  driverPosition,
  passengerPosition,
  isRideActive = false,
  rideStatus,
  onMapClick,
  height = "h-[320px]",
  role = "client",
}: MapSimulatorProps) {
  const [taxis, setTaxis] = useState<SimulatedTaxi[]>([]);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [selectedAvenue, setSelectedAvenue] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Roads grid coordinates
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

  // Generate landmarks based on geography
  useEffect(() => {
    const provinceLCase = address.province.toLowerCase();
    const cityLCase = address.city.toLowerCase();
    let localLandmarks: Landmark[] = [];

    if (provinceLCase.includes("kinshasa") || cityLCase.includes("kinshasa")) {
      localLandmarks = [
        { name: "Palais du Peuple", x: 100, y: 100, type: "office" },
        { name: "Gare Centrale (Gombe)", x: 380, y: 80, type: "office" },
        { name: "Stade des Martyrs", x: 100, y: 260, type: "stadium" },
        { name: "Grand Marché", x: 280, y: 160, type: "market" },
        { name: "Boulevard du 30 Juin", x: 200, y: 50, type: "nature" }
      ];
    } else if (provinceLCase.includes("katanga") || cityLCase.includes("lubumbashi")) {
      localLandmarks = [
        { name: "Place de la Poste", x: 380, y: 100, type: "office" },
        { name: "Stade TP Mazembe", x: 100, y: 180, type: "stadium" },
        { name: "Marché Central Mzee", x: 280, y: 260, type: "market" },
        { name: "Paroisse Sainte Marie", x: 190, y: 90, type: "office" }
      ];
    } else if (provinceLCase.includes("kivu") || cityLCase.includes("goma")) {
      localLandmarks = [
        { name: "Lac Kivu", x: 240, y: 360, type: "nature" },
        { name: "Rond-point Tchutcha", x: 180, y: 180, type: "office" },
        { name: "Aéroport de Goma", x: 390, y: 100, type: "stadium" },
        { name: "Marché Virunga", x: 100, y: 100, type: "market" }
      ];
    } else {
      localLandmarks = [
        { name: `Mairie de ${address.city}`, x: 200, y: 100, type: "office" },
        { name: `Marché Central de ${address.commune}`, x: 280, y: 200, type: "market" },
        { name: "Place de l'Indépendance", x: 120, y: 280, type: "stadium" },
        { name: `Rivière ${address.province}`, x: 150, y: 350, type: "nature" }
      ];
    }
    setLandmarks(localLandmarks);
  }, [address.province, address.city, address.commune]);

  // Handle taxi positioning & animation
  useEffect(() => {
    // Generate some available mobile taxis for display if not active in ride
    const initialTaxis: SimulatedTaxi[] = [
      { id: "taxi-1", name: "Chauffeur Héritier", x: 150, y: 140, angle: 90, isOnline: true, status: "idle" },
      { id: "taxi-2", name: "Chauffeur Grace", x: 330, y: 220, angle: 180, isOnline: true, status: "idle" },
      { id: "taxi-3", name: "Chauffeur Dieudonné", x: 60, y: 300, angle: 0, isOnline: true, status: "idle" },
      { id: "taxi-4", name: "Chauffeur Christian", x: 240, y: 380, angle: 270, isOnline: true, status: "idle" },
      { id: "taxi-5", name: "Chauffeur Rachel", x: 420, y: 60, angle: 45, isOnline: true, status: "idle" }
    ];
    setTaxis(initialTaxis);

    const interval = setInterval(() => {
      setTaxis((prev) =>
        prev.map((t) => {
          if (isRideActive && t.id === "taxi-1") {
            // Let driver-1 be the designated interactive driver, skip normal drift
            return t;
          }
          // Slow drift along the roads
          let nx = t.x;
          let ny = t.y;
          let nAngle = t.angle;

          // Align with horizontal or vertical road grids
          const isOnHorizontal = horizontalRoads.some(hr => Math.abs(hr - t.y) < 5);
          const isOnVertical = verticalRoads.some(vr => Math.abs(vr - t.x) < 5);

          if (isOnHorizontal && Math.random() > 0.3) {
            // Move horizontally
            nx += Math.cos((t.angle * Math.PI) / 180) * 1.5;
            if (nx < 40) { nx = 40; nAngle = 0; }
            if (nx > 440) { nx = 440; nAngle = 180; }
          } else if (isOnVertical) {
            // Move vertically
            ny += Math.sin((t.angle * Math.PI) / 180) * 1.5;
            if (ny < 40) { ny = 40; nAngle = 90; }
            if (ny > 400) { ny = 400; nAngle = 270; }
          } else {
            // Randomly snapping back
            const hr = horizontalRoads[Math.floor(Math.random() * horizontalRoads.length)];
            ny = hr;
          }

          // Random angle modifications at junctions
          const atHorizontalJunction = horizontalRoads.some(hr => Math.abs(hr - t.y) < 3);
          const atVerticalJunction = verticalRoads.some(vr => Math.abs(vr - t.x) < 3);
          if (atHorizontalJunction && atVerticalJunction && Math.random() > 0.9) {
            const angles = [0, 90, 180, 270];
            nAngle = angles[Math.floor(Math.random() * angles.length)];
          }

          return { ...t, x: nx, y: ny, angle: nAngle };
        })
      );
    }, 120);

    return () => clearInterval(interval);
  }, [isRideActive]);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onMapClick || isRideActive) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 480;
    const clickY = ((e.clientY - rect.top) / rect.height) * 440;

    // Determine nearest avenue based on coordinates to set location cleanly
    let closestRoadName = "";
    let minDist = 999;
    let finalX = clickX;
    let finalY = clickY;

    // Search horizontal
    horizontalRoads.forEach((yCoord, idx) => {
      const dist = Math.abs(clickY - yCoord);
      if (dist < minDist) {
        minDist = dist;
        closestRoadName = roadNamesHorizontal[idx];
        finalY = yCoord;
      }
    });

    // Search vertical
    verticalRoads.forEach((xCoord, idx) => {
      const dist = Math.abs(clickX - xCoord);
      if (dist < minDist) {
        minDist = dist;
        closestRoadName = roadNamesVertical[idx];
        finalX = xCoord;
        finalY = clickY; // Keep vertical click coordinate
      }
    });

    if (!closestRoadName) {
      closestRoadName = `Avenue ${address.avenue || "Général"}`;
    }

    setSelectedAvenue(closestRoadName);
    onMapClick(closestRoadName, { x: finalX, y: finalY });
  };

  return (
    <div id="map-simulator-container" ref={containerRef} className={`relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 ${height} select-none shadow-inner`}>
      {/* Map Backdrop Overlay Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none"></div>

      {/* SVG Canvas Map */}
      <svg
        id="moto-taxi-svg-map"
        viewBox="0 0 480 440"
        className="w-full h-full cursor-crosshair relative z-10"
        onClick={handleSvgClick}
      >
        {/* Land Background Zones */}
        <rect x="0" y="0" width="480" height="440" fill="#0b0f19" />
        
        {/* River outline if any nature type is on edge */}
        <path d="M 0 390 Q 120 400 240 370 T 480 390 L 480 440 L 0 440 Z" fill="#1b2838" opacity="0.6" />
        <text x="360" y="420" fill="#38bdf8" className="text-[10px] font-mono font-semibold" opacity="0.5">Fleuve Congo</text>

        {/* Highlighted blocks (neighborhood zones) */}
        <g opacity="0.25">
          <rect x="70" y="70" width="70" height="60" rx="4" fill="#334155" />
          <rect x="250" y="70" width="70" height="60" rx="4" fill="#334155" />
          <rect x="160" y="150" width="70" height="60" rx="4" fill="#334155" />
          <rect x="250" y="230" width="70" height="60" rx="4" fill="#334155" />
        </g>

        {/* Secondary decorative lines representing alleys */}
        <g stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3">
          <line x1="20" y1="100" x2="460" y2="100" />
          <line x1="20" y1="260" x2="460" y2="260" />
          <line x1="100" y1="20" x2="100" y2="420" />
          <line x1="380" y1="20" x2="380" y2="420" />
        </g>

        {/* Primary Road Network Guidelines */}
        {horizontalRoads.map((y, idx) => (
          <g key={`h-road-${idx}`}>
            <line
              x1="10"
              y1={y}
              x2="470"
              y2={y}
              stroke="#1e293b"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <line
              x1="10"
              y1={y}
              x2="470"
              y2={y}
              stroke="#0f172a"
              strokeWidth="7"
              strokeLinecap="round"
            />
            {/* Dashed center lane divider */}
            <line
              x1="10"
              y1={y}
              x2="470"
              y2={y}
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray="5,6"
            />
          </g>
        ))}

        {verticalRoads.map((x, idx) => (
          <g key={`v-road-${idx}`}>
            <line
              x1={x}
              y1="10"
              x2={x}
              y2="430"
              stroke="#1e293b"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <line
              x1={x}
              y1="10"
              x2={x}
              y2="430"
              stroke="#0f172a"
              strokeWidth="7"
              strokeLinecap="round"
            />
            {/* Dashed center lane divider */}
            <line
              x1={x}
              y1="10"
              x2={x}
              y2="430"
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray="5,6"
            />
          </g>
        ))}

        {/* Road names on road grid */}
        <g fill="#94a3b8" className="text-[7px] font-mono tracking-wider font-semibold pointer-events-none" opacity="0.6">
          <text x="75" y="55" transform="rotate(0)">Av. du 30 Juin</text>
          <text x="345" y="135" transform="rotate(0)">Av. de la Libération</text>
          <text x="145" y="215" transform="rotate(0)">Av. Kasa-Vubu</text>
          
          <text x="48" y="170" transform="rotate(-90 48 170)">Av. Université</text>
          <text x="138" y="320" transform="rotate(-90 138 320)">Blvd Lumumba</text>
          <text x="228" y="270" transform="rotate(-90 228 270)">Av. Mondjiba</text>
        </g>

        {/* Local landmarks */}
        {landmarks.map((l, i) => (
          <g key={`landmark-${i}`} transform={`translate(${l.x}, ${l.y})`} className="cursor-help pointer-events-all">
            <title>{l.name}</title>
            <circle cx="0" cy="0" r="5" fill="#1e1e2d" stroke="#f1f5f9" strokeWidth="1" />
            <circle cx="0" cy="0" r="2" fill={l.type === "stadium" ? "#ef4444" : l.type === "office" ? "#3b82f6" : l.type === "market" ? "#eab308" : "#10b981"} />
            <text x="8" y="3" fill="#cbd5e1" className="text-[7.5px] font-medium drop-shadow bg-slate-900 leading-none">{l.name}</text>
          </g>
        ))}

        {/* Other Available Motos Driving around */}
        {taxis.map((t) => {
          // If ride active and this is interactive driver-1, hide this drift instance and prioritize custom driving state
          if (isRideActive && t.id === "taxi-1") return null;
          return (
            <g key={t.id} transform={`translate(${t.x}, ${t.y}) rotate(${t.angle})`} className="transition-all duration-300 ease-out">
              {/* Pulsing radius */}
              <circle cx="0" cy="0" r="8" fill="#eab308" opacity="0.15" className="animate-ping" />
              {/* Outer boundary */}
              <circle cx="0" cy="0" r="6" fill="#eab308" stroke="#1c1917" strokeWidth="1" />
              {/* Front arrow marker */}
              <polygon points="5,-3 8,0 5,3" fill="#1c1917" />
              {/* Inner dot */}
              <circle cx="-1" cy="0" r="2.5" fill="#000" />
              {/* Moto handlebar winglets */}
              <line x1="-2" y1="-5" x2="1" y2="-5" stroke="#000" strokeWidth="1.2" />
              <line x1="-2" y1="5" x2="1" y2="5" stroke="#000" strokeWidth="1.2" />
            </g>
          );
        })}

        {/* ACTIVE TRIP ROUTE DRAWING */}
        {isRideActive && passengerPosition && driverPosition && (
          <>
            {/* Route path outline if trip accepted */}
            {rideStatus !== "searching" && (
              <polyline
                points={`${driverPosition.x},${driverPosition.y} 150,145 240,145 ${passengerPosition.x},${passengerPosition.y}`}
                fill="none"
                stroke="#eab308"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="4,4"
                opacity="0.8"
              />
            )}

            {/* Target Client Dropoff Marker */}
            {dropoffAddress && (
              <g id="map-dropoff-pin" transform="translate(330, 300)">
                <ellipse cx="0" cy="0" rx="6" ry="1.5" fill="#000" opacity="0.3" />
                <path d="M0 -22 C-5 -22 -9 -18 -9 -13 C-9 -5 0 0 0 0 C0 0 9 -5 9 -13 C9 -18 5 -22 0 -22 Z" fill="#ef4444" stroke="#1e293b" strokeWidth="1" />
                <circle cx="0" cy="-13" r="3.5" fill="#ffffff" />
                <text x="0" y="-26" fill="#ef4444" className="text-[7.5px] font-sans font-bold text-center" textAnchor="middle">ARRIVÉE</text>
              </g>
            )}

            {/* Client Pickup / Passenger Position Pin */}
            {passengerPosition && pickupAddress && (
              <g id="map-pickup-pin" transform={`translate(${passengerPosition.x}, ${passengerPosition.y})`}>
                <ellipse cx="0" cy="0" rx="6" ry="2" fill="#000" opacity="0.3" />
                {/* Pin pointer shape */}
                <path d="M0 -22 C-5 -22 -9 -18 -9 -13 C-9 -5 0 0 0 0 C0 0 9 -5 9 -13 C9 -18 5 -22 0 -22 Z" fill="#10b981" stroke="#1e293b" strokeWidth="1" />
                <circle cx="0" cy="-13" r="3.5" fill="#ffffff" />
                <text x="0" y="-26" fill="#10b981" className="text-[7.5px] font-sans font-bold text-center" textAnchor="middle">DEPART</text>
              </g>
            )}

            {/* Driving Moto (Assigned Driver-1) */}
            {driverPosition && (
              <g id="map-active-moto" transform={`translate(${driverPosition.x}, ${driverPosition.y})`} className="transition-all duration-300">
                <circle cx="0" cy="0" r="16" fill="#eab308" opacity="0.25" className="animate-pulse" />
                <circle cx="0" cy="0" r="9" fill="#eab308" stroke="#000" strokeWidth="1.5" />
                {/* Rider details */}
                <path d="M -5 -5 L 5 5" stroke="#000" strokeWidth="2" />
                <path d="M -5 5 L 5 -5" stroke="#000" strokeWidth="2" />
                <circle cx="0" cy="0" r="4.5" fill="#1c1917" />
                <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
                {/* Interactive Driver Tag */}
                <g transform="translate(14, -8)">
                  <rect x="-2" y="-7" width="48" height="11" rx="2" fill="#1c1917" stroke="#eab308" strokeWidth="0.8" />
                  <text x="2" y="1" fill="#fff" className="text-[6px] font-mono font-bold">MOTO - GO</text>
                </g>
              </g>
            )}
          </>
        )}

        {/* SINGLE CLICK PIN PLACER BEFORE ACTIVE RIDE */}
        {!isRideActive && selectedAvenue && onMapClick && (
          <g id="map-target-click-pin" transform="translate(240, 220)">
            <ellipse cx="0" cy="0" rx="5" ry="1.5" fill="#000" opacity="0.4" />
            <path d="M0 -18 C-4 -18 -7 -15 -7 -11 C-7 -4 0 0 0 0 C0 0 7 -4 7 -11 C7 -15 4 -18 0 -18 Z" fill="#eab308" stroke="#1c1917" strokeWidth="0.8" />
            <circle cx="0" cy="-11" r="2.5" fill="#000" />
            <text x="0" y="-22" fill="#eab308" className="text-[7.5px] font-mono font-semibold" textAnchor="middle">Point Sélectionné</text>
          </g>
        )}
      </svg>

      {/* Map Control Panels Overlay */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] text-white flex items-center gap-1.5 shadow-lg">
          <Compass className="w-3.5 h-3.5 text-yellow-500 animate-spin-slow" />
          <div>
            <span className="text-slate-400">Région : </span>
            <span className="font-semibold text-yellow-500">{address.province}</span>
          </div>
        </div>
        <div id="map-selected-commune-indicator" className="bg-slate-900/95 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-800 text-[8.5px] text-slate-300 flex items-center gap-1 shadow-md">
          <MapPin className="w-2.5 h-2.5 text-emerald-400" />
          <span>{address.city} • {address.commune} • {address.quartier || "Centre"}</span>
        </div>
      </div>

      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            // Re-shuffle static positions
            setTaxis((prev) =>
              prev.map((t) => ({
                ...t,
                x: 80 + Math.random() * 320,
                y: 80 + Math.random() * 280,
                angle: [0, 90, 180, 270][Math.floor(Math.random() * 4)],
              }))
            );
          }}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 p-2 rounded-full border border-slate-800 shadow-md transition-all cursor-pointer pointer-events-all hover:scale-105 active:scale-95"
          title="Rafraîchir les taxis à proximité"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {!isRideActive && (
        <div className="absolute bottom-3 left-3 right-12 z-20 bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[9px] text-slate-400 shadow-lg flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 animate-pulse" />
          <span>
            {selectedAvenue ? (
              <span>Point de repère : <b className="text-white">{selectedAvenue}</b>. Cliquez un autre carrefour de la carte pour le modifier.</span>
            ) : (
              <span>Cliquez sur l'avenue ou l'intersection de votre choix pour définir l'emplacement de course sur la carte.</span>
            )}
          </span>
        </div>
      )}

      {isRideActive && (
        <div className="absolute bottom-3 left-3 right-3 z-20 bg-slate-900/95 backdrop-blur-md p-2 rounded-xl border border-yellow-500/30 text-[10px] text-slate-200 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-yellow-500 animate-ping"></span>
            <span>
              {rideStatus === "searching" && "Recherche d'un motard (GoMoto) proche..."}
              {rideStatus === "accepted" && "Course acceptée ! Le chauffeur se dirige vers vous."}
              {rideStatus === "picked_up" && "Course en cours. Trajet sécurisé vers l'avenue."}
              {rideStatus === "completed" && "Course terminée avec succès ! Portefeuille mis à jour."}
            </span>
          </div>
          <div className="font-mono text-yellow-500 text-[9px] font-bold">MODE LIVE</div>
        </div>
      )}
    </div>
  );
}
