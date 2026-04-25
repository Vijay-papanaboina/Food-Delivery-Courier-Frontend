import { useEffect, useRef, useState, useCallback } from "react";
import { deliveryApi } from "@/services/deliveryApi";
import { logger } from "@/lib/logger";

const TRACKING_INTERVAL_MS = 10_000; // 10 seconds

export type LocationStatus =
  | "idle"        // Not started yet
  | "active"      // Tracking and sending successfully
  | "error"       // Geolocation denied or unavailable
  | "sending"     // Currently sending to backend
  | "stale";      // Geolocation available but last send failed

interface UseLocationTrackingOptions {
  /** Set to false to pause tracking (e.g. when driver goes offline) */
  enabled?: boolean;
}

interface LocationTrackingState {
  status: LocationStatus;
  /** Last successfully sent coordinates */
  lastLocation: { latitude: number; longitude: number } | null;
  /** When location was last successfully sent */
  lastSentAt: Date | null;
  /** Current error message, if any */
  error: string | null;
}

/**
 * Tracks the driver's GPS location and sends updates to the backend
 * every 10 seconds via PUT /drivers/me/location.
 *
 * Usage:
 *   const { status, lastLocation } = useLocationTracking({ enabled: isOnline });
 */
export function useLocationTracking(
  options: UseLocationTrackingOptions = {}
): LocationTrackingState {
  const { enabled = true } = options;

  const [state, setState] = useState<LocationTrackingState>({
    status: "idle",
    lastLocation: null,
    lastSentAt: null,
    error: null,
  });

  // Use a ref for the interval so we can clear it without re-renders
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track whether a send is in-flight to avoid overlapping requests
  const sendingRef = useRef(false);

  const sendLocation = useCallback(async () => {
    if (sendingRef.current) return; // Skip if previous request still running

    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: "Geolocation is not supported by this browser",
      }));
      return;
    }

    sendingRef.current = true;
    setState((prev) => ({ ...prev, status: "sending" }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await deliveryApi.updateLocation(latitude, longitude);
          setState({
            status: "active",
            lastLocation: { latitude, longitude },
            lastSentAt: new Date(),
            error: null,
          });
          logger.info("Location sent", { latitude, longitude });
        } catch (err) {
          logger.error("Failed to send location to backend", { err });
          setState((prev) => ({
            ...prev,
            status: "stale",
            error: "Failed to send location. Retrying...",
          }));
        } finally {
          sendingRef.current = false;
        }
      },
      (geoError) => {
        sendingRef.current = false;
        let errorMessage = "Location access denied";
        if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          errorMessage = "Location unavailable";
        } else if (geoError.code === geoError.TIMEOUT) {
          errorMessage = "Location request timed out";
        }
        logger.warn("Geolocation error", { code: geoError.code, message: geoError.message });
        setState((prev) => ({
          ...prev,
          status: "error",
          error: errorMessage,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 5000, // Accept cached position up to 5 seconds old
      }
    );
  }, []);

  useEffect(() => {
    if (!enabled) {
      // Clean up interval if tracking is disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setState((prev) => ({ ...prev, status: "idle" }));
      return;
    }

    // Send immediately on mount / when enabled
    sendLocation();

    // Then send every 10 seconds
    intervalRef.current = setInterval(sendLocation, TRACKING_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, sendLocation]);

  return state;
}
