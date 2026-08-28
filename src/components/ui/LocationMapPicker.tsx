import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Search, Navigation, Loader2, X, AlertCircle } from "lucide-react";

const LEAFLET_CSS_ID = "leaflet-css-injected";

function ensureLeafletCss() {
  if (document.getElementById(LEAFLET_CSS_ID)) return;
  const link = document.createElement("link");
  link.id = LEAFLET_CSS_ID;
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);
}

export interface LatLng {
  lat: number;
  lng: number;
}

interface LocationMapPickerProps {
  lat?: number;
  lng?: number;
  onChange: (coords: LatLng, address?: string) => void;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { "Accept-Language": "en" } }
    );
    const json = await res.json();
    return json.display_name || "";
  } catch {
    return "";
  }
}

async function searchPlace(query: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=5`,
      { headers: { "Accept-Language": "en" } }
    );
    return await res.json();
  } catch {
    return [];
  }
}

const DEFAULT_CENTER: LatLng = { lat: 20.5937, lng: 78.9629 };
const DEFAULT_ZOOM = 5;

const LocationMapPicker: React.FC<LocationMapPickerProps> = ({ lat, lng, onChange }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  const initialCoords: LatLng = lat && lng ? { lat, lng } : DEFAULT_CENTER;

  const makePinIcon = (L: any) =>
    L.divIcon({
      html: `<div style="width:36px;height:36px;background:linear-gradient(135deg,#6366f1,#3b82f6);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 14px rgba(99,102,241,0.45);"></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      className: "",
    });

  const handleLocationChange = useCallback(async (lat: number, lng: number) => {
    setReverseLoading(true);
    const address = await reverseGeocode(lat, lng);
    setCurrentAddress(address);
    onChange({ lat, lng }, address);
    setReverseLoading(false);
  }, [onChange]);

  useEffect(() => {
    ensureLeafletCss();
    import("leaflet").then((L) => {
      LRef.current = L.default ?? L;
      if (!mapContainerRef.current || mapRef.current) return;

      const map = LRef.current.map(mapContainerRef.current, {
        center: [initialCoords.lat, initialCoords.lng],
        zoom: lat && lng ? 14 : DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: true,
      });

      LRef.current.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      if (lat && lng) {
        markerRef.current = LRef.current.marker([lat, lng], { icon: makePinIcon(LRef.current), draggable: true }).addTo(map);
        markerRef.current.on("dragend", async () => {
          const pos = markerRef.current.getLatLng();
          await handleLocationChange(pos.lat, pos.lng);
        });
      }

      map.on("click", async (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng]);
        } else {
          markerRef.current = LRef.current.marker([clickLat, clickLng], { icon: makePinIcon(LRef.current), draggable: true }).addTo(map);
          markerRef.current.on("dragend", async () => {
            const pos = markerRef.current.getLatLng();
            await handleLocationChange(pos.lat, pos.lng);
          });
        }
        await handleLocationChange(clickLat, clickLng);
      });

      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchPlace(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const selectResult = (result: any) => {
    const rlat = parseFloat(result.lat);
    const rlng = parseFloat(result.lon);
    setSearchResults([]);
    setSearchQuery(result.display_name);
    if (mapRef.current && LRef.current) {
      mapRef.current.flyTo([rlat, rlng], 15, { animate: true, duration: 1.2 });
      if (markerRef.current) {
        markerRef.current.setLatLng([rlat, rlng]);
      } else {
        markerRef.current = LRef.current.marker([rlat, rlng], { icon: makePinIcon(LRef.current), draggable: true }).addTo(mapRef.current);
        markerRef.current.on("dragend", async () => {
          const pos = markerRef.current.getLatLng();
          await handleLocationChange(pos.lat, pos.lng);
        });
      }
    }
    handleLocationChange(rlat, rlng);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser");
      return;
    }
    setGeolocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeolocating(false);
        const { latitude, longitude } = pos.coords;
        if (mapRef.current) mapRef.current.flyTo([latitude, longitude], 16, { animate: true, duration: 1.2 });
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
        } else if (LRef.current && mapRef.current) {
          markerRef.current = LRef.current.marker([latitude, longitude], { icon: makePinIcon(LRef.current), draggable: true }).addTo(mapRef.current);
          markerRef.current.on("dragend", async () => {
            const pos = markerRef.current.getLatLng();
            await handleLocationChange(pos.lat, pos.lng);
          });
        }
        handleLocationChange(latitude, longitude);
      },
      (err) => {
        setGeolocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Location permission denied. Please allow location access in your browser.");
        } else {
          setGeoError("Unable to retrieve your location. Please check your connection.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search for a location..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition-all"
            />
            {searchQuery && (
              <button type="button" onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={12} />
              </button>
            )}
          </div>
          <button type="button" onClick={handleSearch} disabled={searching}
            className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-60">
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Search
          </button>
          <button type="button" onClick={handleGeolocate} disabled={geolocating} title="Use my location"
            className="px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 text-slate-700 transition-all flex items-center gap-2 font-medium shadow-sm active:scale-95 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed">
            {geolocating ? <Loader2 size={15} className="text-indigo-500 animate-spin" /> : <Navigation size={15} className="text-indigo-500" />}
            <span className="text-sm hidden sm:inline">{geolocating ? "Locating..." : "Use My Location"}</span>
          </button>
        </div>
        {geoError && (
          <div className="absolute top-full left-0 mt-2 flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100 shadow-sm z-50">
            <AlertCircle size={14} />
            {geoError}
            <button type="button" onClick={() => setGeoError("")} className="ml-2 hover:text-red-800"><X size={12} /></button>
          </div>
        )}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] overflow-hidden">
            {searchResults.map((r, i) => (
              <button key={i} type="button" onClick={() => selectResult(r)}
                className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-b border-slate-100 last:border-none flex items-start gap-2">
                <MapPin size={14} className="shrink-0 mt-0.5 text-indigo-500" />
                <span className="line-clamp-2 font-medium">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        <div ref={mapContainerRef} style={{ height: "320px", width: "100%", zIndex: 0 }} />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        )}
        {mapReady && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow pointer-events-none">
            Click on the map or drag the pin to set location
          </div>
        )}
      </div>
      {(reverseLoading || currentAddress) && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 flex items-start gap-2.5">
          {reverseLoading ? (
            <Loader2 size={14} className="mt-0.5 text-indigo-500 animate-spin shrink-0" />
          ) : (
            <MapPin size={14} className="mt-0.5 text-indigo-500 shrink-0" />
          )}
          <p className="text-xs font-medium text-indigo-800 leading-relaxed">
            {reverseLoading ? "Fetching address..." : currentAddress}
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationMapPicker;
