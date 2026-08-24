import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default marker icon path issue in bundled environments.
// Webpack/Vite break the built-in icon URL detection, so we set them explicitly.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
  popupContent?: string;
}

interface MapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  markers?: MapMarker[];
  route?: { lat: number; lng: number }[];
  onMapReady?: (map: L.Map) => void;
}

/**
 * Interactive map component using Leaflet + OpenStreetMap tiles.
 * Replaces the former Google Maps component — no API key required.
 *
 * Features:
 * - OSM tile layer (free, no billing)
 * - Markers with popups
 * - Route polyline visualization
 * - Auto-fit bounds to markers
 * - Handles missing/invalid coordinates gracefully
 */
export function MapView({
  className = "",
  initialCenter = { lat: 20.5937, lng: 78.9629 }, // Default: India center
  initialZoom = 5,
  markers = [],
  route = [],
  onMapReady,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  // Initialize the map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: true,
    });

    // OpenStreetMap tile layer — free, no API key needed
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);

    if (onMapReady) {
      onMapReady(map);
    }

    // Cleanup on unmount
    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      routeLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when they change
  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const validMarkers = markers.filter(
      (m) =>
        m.lat != null &&
        m.lng != null &&
        isFinite(m.lat) &&
        isFinite(m.lng) &&
        !(m.lat === 0 && m.lng === 0) &&
        Math.abs(m.lat) <= 90 &&
        Math.abs(m.lng) <= 180
    );

    if (validMarkers.length === 0) return;

    validMarkers.forEach((m, idx) => {
      const marker = L.marker([m.lat, m.lng]).addTo(layer);
      const label = m.title || m.popupContent || `Stop ${idx + 1}`;
      marker.bindPopup(`<strong>${label}</strong>`);
      marker.bindTooltip(`${idx + 1}`, {
        permanent: true,
        direction: "center",
        className: "leaflet-marker-number",
      });
    });

    // Fit the map to show all markers
    const bounds = L.latLngBounds(
      validMarkers.map((m) => [m.lat, m.lng] as [number, number])
    );
    try {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } catch {
      // fitBounds can fail if bounds are invalid
    }
  }, [markers]);

  // Update route polyline when it changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old route
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    const validRoute = route.filter(
      (p) =>
        p.lat != null &&
        p.lng != null &&
        isFinite(p.lat) &&
        isFinite(p.lng) &&
        !(p.lat === 0 && p.lng === 0)
    );

    if (validRoute.length < 2) return;

    const polyline = L.polyline(
      validRoute.map((p) => [p.lat, p.lng] as [number, number]),
      {
        color: "#d96d4b",
        weight: 3,
        opacity: 0.7,
        dashArray: "8, 6",
      }
    ).addTo(map);

    routeLayerRef.current = polyline;
  }, [route]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: "300px", width: "100%", zIndex: 0 }}
    />
  );
}

export default MapView;
