import React from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface MapDisplayProps {
  lat: number;
  lng: number;
}

export default function MapDisplay({ lat, lng }: MapDisplayProps) {
  if (!hasValidKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-slate-900 border border-slate-700 rounded-2xl p-6 text-slate-300 font-sans text-xs">
        <div className="text-center w-full max-w-sm">
          <h2 className="text-red-400 font-bold uppercase mb-2">Google Maps API Key Required for GPS</h2>
          <p className="mb-2"><strong>Step 1:</strong> <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener" className="text-blue-400 hover:underline">Get an API Key</a></p>
          <p className="mb-2"><strong>Step 2:</strong> Add your key as a secret securely:</p>
          <ul className="text-left leading-relaxed list-disc list-inside mb-4 pl-4 text-[10px]">
            <li>Open <strong>Settings</strong> (⚙️ gear icon, <strong>top-right corner</strong>)</li>
            <li>Select <strong>Secrets</strong></li>
            <li>Type <code>GOOGLE_MAPS_PLATFORM_KEY</code>, press <strong>Enter</strong></li>
            <li>Paste your API key, press <strong>Enter</strong></li>
          </ul>
          <p className="italic text-[10px]">Rebuilds automatically.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full min-h-[300px] rounded-2xl overflow-hidden border-2 border-red-900/50 relative">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={{lat, lng}}
          defaultZoom={15}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{width: '100%', height: '100%'}}
        >
          <AdvancedMarker position={{lat, lng}}>
            <Pin background="#ef4444" glyphColor="#fff" borderColor="#7f1d1d" />
          </AdvancedMarker>
        </Map>
      </APIProvider>
      
      {/* Target Crosshair Overlay to simulate tactical system */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 border border-red-500/30 rounded-full animate-ping opacity-50"></div>
        <div className="w-24 h-24 border border-red-500/20 rounded-full absolute"></div>
        <div className="w-0.5 h-4 bg-red-500/50 absolute top-1/2 -translate-y-6"></div>
        <div className="w-0.5 h-4 bg-red-500/50 absolute top-1/2 translate-y-2"></div>
        <div className="w-4 h-0.5 bg-red-500/50 absolute left-1/2 -translate-x-6"></div>
        <div className="w-4 h-0.5 bg-red-500/50 absolute left-1/2 translate-x-2"></div>
      </div>
    </div>
  );
}
