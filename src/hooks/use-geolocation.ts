"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { GeoLocation } from "@/types";

interface GeolocationState {
  location: GeoLocation | null;
  error: string | null;
  loading: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true,
  });

  // Use refs to avoid recreating the callback on every render
  const optionsRef = useRef({
    enableHighAccuracy: options.enableHighAccuracy ?? true,
    timeout: options.timeout ?? 10000,
    maximumAge: options.maximumAge ?? 60000,
  });

  // Track if we've already attempted to get location
  const hasAttemptedRef = useRef(false);

  const getLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setState({
        location: null,
        error: "Geolocation is not supported by your browser",
        loading: false,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
          error: null,
          loading: false,
        });
      },
      (error) => {
        let errorMessage = "Failed to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        setState((prev) => ({
          location: prev.location, // Keep previous location if we had one
          error: errorMessage,
          loading: false,
        }));
      },
      optionsRef.current
    );
  }, []);

  // Only request location once on mount
  useEffect(() => {
    if (!hasAttemptedRef.current) {
      hasAttemptedRef.current = true;
      getLocation();
    }
  }, [getLocation]);

  return {
    ...state,
    refresh: getLocation,
  };
}
