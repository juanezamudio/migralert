"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { cn } from "@/lib/utils";
import type { Report, GeoLocation } from "@/types";
import { Locate, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useTheme } from "@/hooks";

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

interface MapViewProps {
  center?: GeoLocation;
  zoom?: number;
  reports?: Report[];
  onReportClick?: (report: Report) => void;
  onRefresh?: () => void;
  onLocate?: () => void;
  className?: string;
}

// Activity type to marker color mapping
const activityColors: Record<string, string> = {
  checkpoint: "#F59E0B", // warning yellow
  raid: "#EF4444", // danger red
  patrol: "#3B82F6", // info blue
  detention: "#EF4444", // danger red
  surveillance: "#8B5CF6", // purple
  other: "#6B7280", // gray
};

// Map panning bounds - prevents panning too far outside US region
// Format: [[west, south], [east, north]]
const MAP_BOUNDS: [[number, number], [number, number]] = [
  [-172, 15],  // Southwest: includes Hawaii, allows seeing some context
  [-64, 72],   // Northeast: includes Alaska and Maine
];

// US Territory bounding boxes - if zooming into these areas, it's allowed
// Each box: { west, south, east, north }
const US_TERRITORIES = [
  { name: "Continental US", west: -125, south: 24.5, east: -66, north: 49.5 },
  { name: "Alaska", west: -180, south: 51, east: -129, north: 72 },
  { name: "Hawaii", west: -161, south: 18.5, east: -154, north: 22.5 },
  { name: "Puerto Rico", west: -68, south: 17.5, east: -65, north: 18.6 },
  { name: "US Virgin Islands", west: -65.1, south: 17.6, east: -64.5, north: 18.5 },
];

// Blocked territories - reset map if user zooms into these areas
// Each has bounds and a minimum zoom level to trigger reset
const BLOCKED_TERRITORIES = [
  // Mexico - from Guatemala border to US border (excluding US)
  { name: "Mexico", west: -118, south: 14, east: -86, north: 24.4, minZoom: 5 },

  // Canada - east of Alaska (excluding Alaska overlap area)
  { name: "Canada East", west: -141, south: 49.5, east: -50, north: 85, minZoom: 5 },

  // Canada - west/BC area (careful not to overlap with Alaska)
  { name: "Canada West", west: -141, south: 49.5, east: -120, north: 60, minZoom: 5 },

  // Russia/Siberia - east side (positive longitude near dateline)
  { name: "Russia East", west: 160, south: 50, east: 180, north: 75, minZoom: 5 },

  // Russia/Siberia - Bering Strait area including Uelen and Chukotka Peninsula
  // Uelen is at ~66°N, -169.8°W - expanding bounds aggressively to ensure coverage
  { name: "Russia Bering", west: -180, south: 60, east: -165, north: 74, minZoom: 5 },

  // Central America
  { name: "Central America", west: -93, south: 7, east: -77, north: 18, minZoom: 5 },

  // Caribbean (excluding PR and USVI)
  { name: "Caribbean West", west: -86, south: 15, east: -70, north: 24, minZoom: 5 },

  // South America (northern portion visible in map bounds)
  { name: "South America", west: -82, south: -5, east: -34, north: 13, minZoom: 5 },
];

// Zoom level threshold for general foreign territory (fallback)
const FOREIGN_TERRITORY_CHECK_ZOOM = 6;

// Center of continental US for reset view
const US_CENTER: [number, number] = [-98.5795, 37.5];
const US_OVERVIEW_ZOOM = 4;

// Continental US bounds for fitBounds - adjusted to match US_CENTER at zoom 4
const US_BOUNDS: [[number, number], [number, number]] = [
  [-125, 24],  // Southwest - centered on US_CENTER
  [-66, 49],   // Northeast - centered on US_CENTER
];

export function MapView({
  center,
  zoom = 12,
  reports = [],
  onReportClick,
  onRefresh,
  onLocate,
  className,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { theme, mounted: themeMounted } = useTheme();

  // Use US_CENTER as default when no user location
  const defaultCenter: GeoLocation = {
    latitude: US_CENTER[1],
    longitude: US_CENTER[0],
  };

  const mapCenter = center || defaultCenter;

  // Map style based on theme
  const mapStyle = theme === "light"
    ? "mapbox://styles/mapbox/light-v11"
    : "mapbox://styles/mapbox/dark-v11";

  // Ref to track if we're currently resetting (prevents infinite loop)
  const isResettingRef = useRef(false);

  // Check if a point is within any US territory
  const isWithinUSTerritory = useCallback((lng: number, lat: number): boolean => {
    for (const t of US_TERRITORIES) {
      if (lng >= t.west && lng <= t.east && lat >= t.south && lat <= t.north) {
        return true;
      }
    }
    return false;
  }, []);

  // Check if a point is within a blocked territory and return the min zoom if so
  const getBlockedTerritoryMinZoom = useCallback((lng: number, lat: number): number | null => {
    for (const territory of BLOCKED_TERRITORIES) {
      if (
        lng >= territory.west &&
        lng <= territory.east &&
        lat >= territory.south &&
        lat <= territory.north
      ) {
        return territory.minZoom;
      }
    }
    return null;
  }, []);

  // Map control handlers
  const handleZoomIn = useCallback(() => {
    map.current?.zoomIn({ duration: 300 });
  }, []);

  const handleZoomOut = useCallback(() => {
    map.current?.zoomOut({ duration: 300 });
  }, []);

  const handleResetView = useCallback(() => {
    map.current?.flyTo({
      center: US_CENTER,
      zoom: US_OVERVIEW_ZOOM,
      duration: 1000,
    });
  }, []);

  const handleLocate = useCallback(() => {
    if (onLocate) {
      onLocate();
    } else if (center) {
      map.current?.flyTo({
        center: [center.longitude, center.latitude],
        zoom: 14,
        duration: 1000,
      });
    }
  }, [center, onLocate]);

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [onRefresh]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !themeMounted) return;

    // Configure initial view based on whether user location is available
    const mapOptions: mapboxgl.MapOptions = {
      container: mapContainer.current,
      style: mapStyle,
      minZoom: 3,
      maxZoom: 18,
      maxBounds: MAP_BOUNDS,
      attributionControl: false,
    };

    if (center) {
      // User has location - center on them
      mapOptions.center = [center.longitude, center.latitude];
      mapOptions.zoom = zoom;
    } else {
      // No location - use bounds to fit continental US
      mapOptions.bounds = US_BOUNDS;
      mapOptions.fitBoundsOptions = { padding: 20 };
    }

    map.current = new mapboxgl.Map(mapOptions);

    const mapInstance = map.current;

    // Check if user is zooming into foreign territory and reset if needed
    const checkForeignTerritory = () => {
      // Skip if we're already in the middle of a reset
      if (isResettingRef.current) return;

      const currentZoom = mapInstance.getZoom();
      const currentCenter = mapInstance.getCenter();
      const { lng, lat } = currentCenter;

      let shouldReset = false;

      // FIRST: Check if in a specifically blocked territory (Mexico, Canada, Russia, etc.)
      // This takes priority over US territory check (handles edge cases like Bering Strait)
      const blockedMinZoom = getBlockedTerritoryMinZoom(lng, lat);
      if (blockedMinZoom !== null && currentZoom >= blockedMinZoom) {
        shouldReset = true;
      }

      // If not in a blocked territory, check if within US territory (allow it)
      if (!shouldReset && isWithinUSTerritory(lng, lat)) {
        return;
      }

      // Fallback: any other foreign territory at higher zoom
      if (!shouldReset && currentZoom >= FOREIGN_TERRITORY_CHECK_ZOOM) {
        shouldReset = true;
      }

      if (shouldReset) {
        // Reset to US overview
        isResettingRef.current = true;
        mapInstance.fitBounds(US_BOUNDS, {
          padding: 20,
          duration: 800,
        });

        // Clear the flag after animation completes
        setTimeout(() => {
          isResettingRef.current = false;
        }, 1000);
      }
    };

    // Check after zoom or pan ends
    mapInstance.on("zoomend", checkForeignTerritory);
    mapInstance.on("moveend", checkForeignTerritory);

    // Add attribution in a less intrusive spot
    mapInstance.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    mapInstance.on("load", () => {
      setMapLoaded(true);
    });

    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, [isWithinUSTerritory, getBlockedTerritoryMinZoom, themeMounted, mapStyle]);

  // Update map style when theme changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    map.current.setStyle(mapStyle);
  }, [mapStyle, mapLoaded]);

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

        /* Position bottom-left attribution above the nav */
        .mapboxgl-ctrl-bottom-left {
          bottom: 100px !important;
          left: 16px !important;
        }

        .mapboxgl-ctrl-attrib {
          background: transparent !important;
        }

        .mapboxgl-ctrl-attrib a {
          color: #6b6b73 !important;
          font-size: 10px !important;
        }
      `}</style>

      <div className={cn("relative w-full h-full", className)}>
        {/* Map container */}
        <div
          ref={mapContainer}
          className="w-full h-full"
          aria-label="Map showing active reports"
        />

        {/* Custom controls panel - right side */}
        <div className="absolute top-20 right-4 flex flex-col gap-2 z-10">
          {/* Location button */}
          <button
            onClick={handleLocate}
            className="w-10 h-10 bg-surface border border-border rounded-xl flex items-center justify-center text-foreground-secondary hover:text-foreground hover:bg-surface-hover transition-colors shadow-lg"
            aria-label="Go to my location"
            title="My location"
          >
            <Locate className="w-5 h-5" />
          </button>

          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-10 h-10 bg-surface border border-border rounded-xl flex items-center justify-center text-foreground-secondary hover:text-foreground hover:bg-surface-hover transition-colors shadow-lg disabled:opacity-50"
              aria-label="Refresh reports"
              title="Refresh reports"
            >
              <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
            </button>
          )}

          {/* Divider */}
          <div className="w-6 h-px bg-border mx-auto" />

          {/* Zoom controls */}
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 bg-surface border border-border rounded-xl flex items-center justify-center text-foreground-secondary hover:text-foreground hover:bg-surface-hover transition-colors shadow-lg"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <button
            onClick={handleZoomOut}
            className="w-10 h-10 bg-surface border border-border rounded-xl flex items-center justify-center text-foreground-secondary hover:text-foreground hover:bg-surface-hover transition-colors shadow-lg"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          {/* Reset view button */}
          <button
            onClick={handleResetView}
            className="w-10 h-10 bg-surface border border-border rounded-xl flex items-center justify-center text-foreground-secondary hover:text-foreground hover:bg-surface-hover transition-colors shadow-lg"
            aria-label="Reset to full US view"
            title="View all US"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
