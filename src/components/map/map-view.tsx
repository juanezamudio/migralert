"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { cn } from "@/lib/utils";
import type { Report, GeoLocation } from "@/types";

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

interface MapViewProps {
  center?: GeoLocation;
  zoom?: number;
  reports?: Report[];
  onReportClick?: (report: Report) => void;
  className?: string;
}

// Activity type to marker color mapping
const activityColors: Record<string, string> = {
  checkpoint: "#F59E0B", // warning yellow
  raid: "#EF4444", // danger red
  patrol: "#3B82F6", // info blue
  detention: "#EF4444", // danger red
  other: "#6B7280", // gray
};

export function MapView({
  center,
  zoom = 12,
  reports = [],
  onReportClick,
  className,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Default center (US center) if no location provided
  const defaultCenter: GeoLocation = {
    latitude: 39.8283,
    longitude: -98.5795,
  };

  const mapCenter = center || defaultCenter;

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [mapCenter.longitude, mapCenter.latitude],
      zoom: center ? zoom : 4, // Zoom out if no user location
      attributionControl: false,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "bottom-right"
    );

    // Add attribution in a less intrusive spot
    map.current.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update center when location changes
  useEffect(() => {
    if (!map.current || !center) return;

    map.current.flyTo({
      center: [center.longitude, center.latitude],
      zoom: zoom,
      duration: 1500,
    });
  }, [center, zoom]);

  // Add user location marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !center) return;

    // Create user location marker
    const userMarkerEl = document.createElement("div");
    userMarkerEl.className = "user-location-marker";
    userMarkerEl.innerHTML = `
      <div class="pulse-ring"></div>
      <div class="marker-dot"></div>
    `;

    const userMarker = new mapboxgl.Marker({
      element: userMarkerEl,
      anchor: "center",
    })
      .setLngLat([center.longitude, center.latitude])
      .addTo(map.current);

    return () => {
      userMarker.remove();
    };
  }, [center, mapLoaded]);

  // Add report markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    reports.forEach((report) => {
      const color = activityColors[report.activityType] || activityColors.other;

      // Create custom marker element
      const markerEl = document.createElement("div");
      markerEl.className = "report-marker";
      markerEl.innerHTML = `
        <div class="marker-ping" style="background-color: ${color}"></div>
        <div class="marker-dot" style="background-color: ${color}"></div>
      `;

      const marker = new mapboxgl.Marker({
        element: markerEl,
        anchor: "center",
      })
        .setLngLat([report.location.longitude, report.location.latitude])
        .addTo(map.current!);

      // Add click handler
      markerEl.addEventListener("click", () => {
        onReportClick?.(report);
      });

      markersRef.current.push(marker);
    });
  }, [reports, mapLoaded, onReportClick]);

  return (
    <>
      <style jsx global>{`
        .user-location-marker {
          width: 24px;
          height: 24px;
          position: relative;
        }

        .user-location-marker .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: rgba(255, 107, 53, 0.3);
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .user-location-marker .marker-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          background-color: #ff6b35;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .report-marker {
          width: 32px;
          height: 32px;
          position: relative;
          cursor: pointer;
        }

        .report-marker .marker-ping {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          opacity: 0.4;
          animation: marker-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .report-marker .marker-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        }

        .report-marker:hover .marker-dot {
          transform: translate(-50%, -50%) scale(1.2);
          transition: transform 0.15s ease-out;
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }

        @keyframes marker-ping {
          0% {
            transform: scale(1);
            opacity: 0.4;
          }
          75%,
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        /* Override Mapbox controls for dark theme */
        .mapboxgl-ctrl-group {
          background: #1a1a1f !important;
          border: 1px solid #2a2a30 !important;
        }

        .mapboxgl-ctrl-group button {
          width: 36px !important;
          height: 36px !important;
        }

        .mapboxgl-ctrl-group button + button {
          border-top: 1px solid #2a2a30 !important;
        }

        .mapboxgl-ctrl-group button:hover {
          background-color: #242429 !important;
        }

        .mapboxgl-ctrl-icon {
          filter: invert(1);
        }

        .mapboxgl-ctrl-attrib {
          background: transparent !important;
        }

        .mapboxgl-ctrl-attrib a {
          color: #6b6b73 !important;
          font-size: 10px !important;
        }
      `}</style>
      <div
        ref={mapContainer}
        className={cn("w-full h-full", className)}
        aria-label="Map showing active reports"
      />
    </>
  );
}
