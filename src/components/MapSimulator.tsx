/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Coffee, 
  Navigation, 
  MapPin, 
  Eye, 
  Compass, 
  RefreshCw,
  AlertTriangle,
  Bell,
  X,
  Volume2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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

  // --- TRAFFIC JAM DISPATCHER ENGINE ---
  interface TrafficJam {
    id: string;
    avenue: string;
    severity: "moderate" | "heavy" | "blocked";
    comment: string;
    reportedBy: string;
    timestamp: string;
    x: number;
    y: number;
    type?: "horizontal" | "vertical";
    roadIndex?: number;
  }

  const [trafficJams, setTrafficJams] = useState<TrafficJam[]>([]);
  const [showJamModal, setShowJamModal] = useState(false);
  const [reportedAvenue, setReportedAvenue] = useState("");
  const [jamSeverity, setJamSeverity] = useState<"moderate" | "heavy" | "blocked">("moderate");
  const [jamComment, setJamComment] = useState("");
  const [activeNotification, setActiveNotification] = useState<{ id: string; title: string; message: string; severity: string } | null>(null);

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

  const getRoadDetails = (name: string) => {
    const hIdx = roadNamesHorizontal.indexOf(name);
    if (hIdx !== -1) {
      return { type: "horizontal" as const, coord: horizontalRoads[hIdx], index: hIdx };
    }
    const vIdx = roadNamesVertical.indexOf(name);
    if (vIdx !== -1) {
      return { type: "vertical" as const, coord: verticalRoads[vIdx], index: vIdx };
    }
    return null;
  };

  const DEFAULT_TRAFFIC_JAMS: TrafficJam[] = [
    {
      id: "tf-1",
      avenue: "Boulevard Lumumba",
      severity: "heavy",
      comment: "Panne d'autobus Transco au carrefour",
      reportedBy: "Chauffeur Héritier",
      timestamp: "Il y a 10 min",
      x: 150,
      y: 220,
      type: "vertical",
      roadIndex: 1
    },
    {
      id: "tf-2",
      avenue: "Avenue Kasa-Vubu",
      severity: "moderate",
      comment: "Contrôle PNC de routine",
      reportedBy: "Chauffeur Sarah",
      timestamp: "Il y a 5 min",
      x: 240,
      y: 140,
      type: "horizontal",
      roadIndex: 2
    }
  ];

  // Request browser Notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(e => console.warn("Error requesting notification rights:", e));
    }
  }, []);

  // Sync traffic alerts from/to localStorage in real-time
  useEffect(() => {
    const loadTrafficJams = () => {
      const saved = localStorage.getItem("gomoto_traffic_jams");
      if (saved) {
        try {
          setTrafficJams(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse traffic jams, defaulting", e);
          setTrafficJams(DEFAULT_TRAFFIC_JAMS);
        }
      } else {
        localStorage.setItem("gomoto_traffic_jams", JSON.stringify(DEFAULT_TRAFFIC_JAMS));
        setTrafficJams(DEFAULT_TRAFFIC_JAMS);
      }
    };

    loadTrafficJams();

    const handleSync = () => {
      loadTrafficJams();
    };

    window.addEventListener("gomoto-traffic-update", handleSync);
    return () => {
      window.removeEventListener("gomoto-traffic-update", handleSync);
    };
  }, []);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playBeep = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      const now = audioCtx.currentTime;
      playBeep(587.33, now, 0.15); // D5
      playBeep(698.46, now + 0.14, 0.25); // F5 (creates a nice premium warning beep)
    } catch (e) {
      console.warn("Unable to play synthesized audio alert:", e);
    }
  };

  const sendLocalPushNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          tag: "gomoto-traffic",
          requireInteraction: false
        });
      } catch (e) {
        console.warn("Unable to dispatch native desktop notification, using UI banner.", e);
      }
    }
  };

  const handleReportTrafficJam = () => {
    const avenueToReport = reportedAvenue || selectedAvenue || roadNamesHorizontal[0];
    const details = getRoadDetails(avenueToReport);
    
    // Position selection along the specified road grid
    let tx = 240;
    let ty = 220;
    if (details) {
      if (details.type === "horizontal") {
        ty = details.coord;
        tx = 80 + Math.floor(Math.random() * 320);
      } else {
        tx = details.coord;
        ty = 80 + Math.floor(Math.random() * 280);
      }
    }

    const newJam: TrafficJam = {
      id: "tf-" + Math.random().toString(36).substring(2, 9),
      avenue: avenueToReport,
      severity: jamSeverity,
      comment: jamComment || "Embouteillage et trafic dense",
      reportedBy: role === "driver" ? "Chauffeur Motard GoMoto" : "Chauffeur Partenaire",
      timestamp: new Date().toLocaleTimeString("fr-CD", { hour: "2-digit", minute: "2-digit" }),
      x: tx,
      y: ty,
      type: details?.type,
      roadIndex: details?.index
    };

    const updated = [newJam, ...trafficJams].slice(0, 12);
    localStorage.setItem("gomoto_traffic_jams", JSON.stringify(updated));
    setTrafficJams(updated);
    setShowJamModal(false);
    setJamComment("");

    // Broadcast update event to all instances of MapSimulator (e.g., driver and client tabs)
    window.dispatchEvent(new Event("gomoto-traffic-update"));

    // Sound signal
    playNotificationSound();

    // Trigger local push notification
    const severityLabel = jamSeverity === "moderate" ? "Trafic Ralenti 🟠" : jamSeverity === "heavy" ? "Embouteillage Critique 🔴" : "Route Bloquée 🚫";
    const titleText = `🚨 EMBOUTEILLAGE EN DIRECT : ${avenueToReport}`;
    const descText = `${severityLabel} : ${newJam.comment}`;

    sendLocalPushNotification(titleText, descText);

    // Beautiful UI interactive local push popup
    setActiveNotification({
      id: newJam.id,
      title: titleText,
      message: `${descText}. Prenez vos dispositions et contournez la zone si possible !`,
      severity: jamSeverity
    });

    setTimeout(() => {
      setActiveNotification(prev => prev?.id === newJam.id ? null : prev);
    }, 7000);
  };

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
    } else if (provinceLCase.includes("central") || provinceLCase.includes("kasai") || cityLCase.includes("kananga")) {
      localLandmarks = [
        { name: "Aéroport de Kananga", x: 390, y: 80, type: "stadium" },
        { name: "Cathédrale Saint-Clément", x: 150, y: 120, type: "office" },
        { name: "Marché Central de Kananga", x: 280, y: 190, type: "market" },
        { name: "Stade des Jeunes", x: 100, y: 280, type: "stadium" },
        { name: "Rond-point Monument", x: 220, y: 80, type: "office" }
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

        {/* REAL-TIME TRAFFIC JAMS HOTSPOTS OVERLAY (For all users) */}
        {trafficJams.map((jam) => {
          const isHorizontal = jam.type === "horizontal";
          const strokeColor = jam.severity === "moderate" ? "#f97316" : jam.severity === "heavy" ? "#ef4444" : "#991b1b";
          const severityLabel = jam.severity === "moderate" ? "Trafic Ralenti" : jam.severity === "heavy" ? "Embouteillage Critique" : "Avenue Bloquée";
          
          return (
            <g key={`jam-layer-${jam.id}`} className="transition-all duration-300">
              {/* Highlight road segment flow line */}
              {isHorizontal ? (
                <line
                  x1="18"
                  y1={jam.y}
                  x2="462"
                  y2={jam.y}
                  stroke={strokeColor}
                  strokeWidth="5"
                  opacity="0.65"
                  strokeLinecap="round"
                  strokeDasharray="6,4"
                  className="animate-[pulse_1.5s_infinite]"
                />
              ) : (
                <line
                  x1={jam.x}
                  y1="18"
                  x2={jam.x}
                  y2="422"
                  stroke={strokeColor}
                  strokeWidth="5"
                  opacity="0.65"
                  strokeLinecap="round"
                  strokeDasharray="6,4"
                  className="animate-[pulse_1.5s_infinite]"
                />
              )}

              {/* Glowing Hazard Pulse ring & Icon */}
              <g transform={`translate(${jam.x}, ${jam.y})`} className="cursor-help">
                <title>{`[🚨 ${severityLabel}] ${jam.avenue} : ${jam.comment}\nSignalé par : ${jam.reportedBy} à ${jam.timestamp}`}</title>
                <circle cx="0" cy="0" r="14" fill={strokeColor} opacity="0.25" className="animate-ping" />
                <circle cx="0" cy="0" r="8" fill="#0f172a" stroke={strokeColor} strokeWidth="1.8" />
                <text x="0" y="2.5" fill={strokeColor} className="text-[7.5px] font-extrabold font-sans text-center" textAnchor="middle">⚠️</text>
              </g>

              {/* Floating micro name tags directly above the hazard icon */}
              <g transform={`translate(${jam.x}, ${jam.y - 12})`} className="pointer-events-none select-none">
                <rect x="-38" y="-6" width="76" height="12" rx="3" fill="#020617" stroke={strokeColor} strokeWidth="1" className="shadow-lg opacity-90" />
                <text x="0" y="2.5" fill="#f8fafc" className="text-[5.5px] font-mono font-black tracking-wider text-center" textAnchor="middle">
                  {jam.avenue.substring(0, 11)}..
                </text>
              </g>
            </g>
          );
        })}

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

      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5">
        {role === "driver" && (
          <button
            type="button"
            onClick={() => {
              setReportedAvenue(selectedAvenue || "");
              setShowJamModal(true);
            }}
            className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-3 py-2 rounded-xl text-[10px] tracking-wider uppercase flex items-center gap-1.5 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer pointer-events-all"
            title="Signaler un embouteillage en temps réel"
          >
            <AlertTriangle className="w-3.5 h-3.5 fill-white text-red-600 animate-pulse" />
            <span>Signaler Bouchon 🚨</span>
          </button>
        )}
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

      {/* DYNAMIC PUSH NOTIFICATION POPUP BANNER */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            key={activeNotification.id}
            initial={{ opacity: 0, y: -70, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -45, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute top-3 left-3 right-3 z-50 bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-3 shadow-xl flex items-start gap-3 text-left max-w-sm mx-auto shadow-rose-950/20"
          >
            <div className={`p-2 rounded-lg shrink-0 ${
              activeNotification.severity === "moderate" ? "bg-amber-500/10 text-amber-450 border border-amber-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}>
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[7.5px] font-black tracking-widest text-[#eab308] uppercase font-mono">GoMoto Flash Trafic RDC</span>
                <span className="text-[7px] font-mono text-slate-500">A l'instant</span>
              </div>
              <h4 className="text-[10px] font-black text-rose-100 truncate font-sans">{activeNotification.title}</h4>
              <p className="text-[9px] text-slate-350 leading-snug font-sans">{activeNotification.message}</p>
            </div>

            <button
              type="button"
              onClick={() => setActiveNotification(null)}
              className="text-slate-500 hover:text-slate-300 shrink-0 self-start p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOTO TRAFFIC REPORTERS DRAWER MODAL */}
      {showJamModal && (
        <div id="traffic-jam-form-overlay" className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 select-text pointer-events-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full max-w-[340px] space-y-3.5 shadow-2xl text-left">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500 fill-red-500/20" />
                <h4 className="text-[10.5px] font-black text-slate-100 uppercase tracking-widest font-mono">Signaler Embouteillage</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowJamModal(false)}
                className="text-slate-500 hover:text-slate-350 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="space-y-1">
                <label className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Avenue / Rue Concernée</label>
                <select
                  value={reportedAvenue}
                  onChange={(e) => setReportedAvenue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-yellow-500 transition-all font-sans text-[11px]"
                >
                  <option value="">-- Choisir une avenue --</option>
                  {[...roadNamesHorizontal, ...roadNamesVertical].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {selectedAvenue && (
                  <button
                    type="button"
                    onClick={() => setReportedAvenue(selectedAvenue)}
                    className="text-[8px] text-yellow-500/70 hover:text-yellow-500 transition-all mt-0.5 text-left font-semibold cursor-pointer"
                  >
                    Utiliser le point sélectionné sur la carte (<b>{selectedAvenue}</b>)
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Intensité du bouchon</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setJamSeverity("moderate")}
                    className={`py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                      jamSeverity === "moderate"
                        ? "bg-amber-500/10 border-amber-500 text-amber-400 font-extrabold shadow-sm"
                        : "bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-450"
                    }`}
                  >
                    Modéré 🟠
                  </button>
                  <button
                    type="button"
                    onClick={() => setJamSeverity("heavy")}
                    className={`py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                      jamSeverity === "heavy"
                        ? "bg-red-500/10 border-red-500 text-red-400 font-extrabold shadow-sm"
                        : "bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-450"
                    }`}
                  >
                    Critique 🔴
                  </button>
                  <button
                    type="button"
                    onClick={() => setJamSeverity("blocked")}
                    className={`py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                      jamSeverity === "blocked"
                        ? "bg-purple-950/40 border-purple-600 text-purple-400 font-extrabold shadow-sm"
                        : "bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-450"
                    }`}
                  >
                    Bloqué 🚫
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Description rapide / Cause</label>
                <input
                  type="text"
                  value={jamComment}
                  onChange={(e) => setJamComment(e.target.value)}
                  placeholder="Ex: Accident, travaux PNC, inondation..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-yellow-500 transition-all font-sans text-[10.5px]"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["Accident 💥", "Contrôle 👮", "Travaux 🚧", "Pluie/Eau 🌧️"].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setJamComment(tag)}
                      className="bg-slate-950 hover:bg-slate-850 border border-slate-850/60 text-[7.5px] font-mono text-slate-400 px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1 font-sans">
              <button
                type="button"
                onClick={() => setShowJamModal(false)}
                className="flex-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-450 font-bold py-1.5 rounded-xl text-[10.5px] transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleReportTrafficJam}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-1.5 rounded-xl text-[10.5px] transition-all shadow-md cursor-pointer disabled:opacity-50"
                disabled={!reportedAvenue && !selectedAvenue}
              >
                Emettre Info 🚨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
