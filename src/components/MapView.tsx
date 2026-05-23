import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapMarker, NewsArticle } from "../types/news";

interface MapViewProps {
  markers: MapMarker[];
  onMarkerClick: (article: NewsArticle) => void;
  sidebarCollapsed: boolean;
  panelOpen: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  general: "#3b82f6",
  politics: "#f59e0b",
  technology: "#06b6d4",
  science: "#10b981",
};

function createMarkerElement(category: string): HTMLDivElement {
  const color = CATEGORY_COLORS[category] || "#6b7280";
  const el = document.createElement("div");
  el.className = "map-marker";
  el.style.cssText = `
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: ${color};
    border: 2px solid rgba(255,255,255,0.3);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    box-shadow: 0 0 8px ${color}66;
  `;
  el.addEventListener("mouseenter", () => {
    el.style.transform = "scale(1.4)";
    el.style.boxShadow = `0 0 16px ${color}aa`;
  });
  el.addEventListener("mouseleave", () => {
    el.style.transform = "scale(1)";
    el.style.boxShadow = `0 0 8px ${color}66`;
  });
  return el;
}

export default function MapView({
  markers,
  onMarkerClick,
  sidebarCollapsed,
  panelOpen,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) {
      console.error("VITE_MAPBOX_TOKEN is not set");
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [20, 20],
      zoom: 2,
      projection: "mercator",
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add new markers
    for (const markerData of markers) {
      const el = createMarkerElement(markerData.article.category);

      el.addEventListener("click", () => {
        onMarkerClick(markerData.article);
        map.flyTo({
          center: [markerData.longitude, markerData.latitude],
          zoom: Math.max(map.getZoom(), 4),
          duration: 800,
        });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([markerData.longitude, markerData.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    }
  }, [markers, onMarkerClick]);

  return (
    <div
      className="absolute inset-0 transition-all duration-300"
      style={{
        left: sidebarCollapsed ? "3.5rem" : "13rem",
        right: panelOpen ? "24rem" : "0",
        top: "3.5rem",
      }}
    >
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
