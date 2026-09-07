import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { getSTPPreciseGPS, watchSTPPreciseGPS, type STPPreciseLocation } from "@/lib/stp-geo";
import { triggerDeviceVibration } from "@/lib/sync-manager";

export interface UseNativeGeolocationOptions {
  enableHighAccuracy?: boolean;
  autoRequestOnMount?: boolean;
  onLocationUpdate?: (location: STPPreciseLocation) => void;
}

export function useNativeGeolocation(options: UseNativeGeolocationOptions = {}) {
  const { enableHighAccuracy = true, autoRequestOnMount = false, onLocationUpdate } = options;

  const [isSupported, setIsSupported] = useState(true);
  const [permissionState, setPermissionState] = useState<
    "granted" | "prompt" | "denied" | "unknown"
  >("unknown");
  const [isLocating, setIsLocating] = useState(false);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [location, setLocation] = useState<STPPreciseLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unwatchRef = useRef<(() => void) | null>(null);
  const onLocationUpdateRef = useRef(onLocationUpdate);
  onLocationUpdateRef.current = onLocationUpdate;

  // 1. Verificar suporte a Geolocation e estado de permissão nativa do navegador
  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setIsSupported(false);
      setError("O seu navegador não suporta geolocalização nativa.");
      return;
    }

    if ("permissions" in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((status) => {
          setPermissionState(status.state as "granted" | "prompt" | "denied");
          status.onchange = () => {
            setPermissionState(status.state as "granted" | "prompt" | "denied");
          };
        })
        .catch(() => {
          setPermissionState("unknown");
        });
    }
  }, []);

  // 2. Solicitar localização de alta precisão (Satélites GPS + Geocoding)
  const requestLocation = useCallback(
    async (silent = false): Promise<STPPreciseLocation | null> => {
      if (typeof window === "undefined" || !("geolocation" in navigator)) {
        if (!silent) toast.error("Geolocalização não suportada neste dispositivo.");
        return null;
      }

      setIsLocating(true);
      setError(null);

      try {
        const result = await getSTPPreciseGPS();
        if (result) {
          setLocation(result);
          onLocationUpdateRef.current?.(result);
          return result;
        } else {
          setError("Não foi possível obter o sinal GPS com precisão suficiente.");
          return null;
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Erro ao aceder ao GPS do dispositivo.";
        setError(errMsg);
        if (!silent) {
          toast.error("Erro no GPS", { description: errMsg });
        }
        return null;
      } finally {
        setIsLocating(false);
      }
    },
    [],
  );

  // 3. Rastreamento contínuo em tempo real (Estilo Encontrar Dispositivo / Find My Device)
  const startLiveTracking = useCallback(() => {
    if (unwatchRef.current) {
      unwatchRef.current();
      unwatchRef.current = null;
    }

    setIsLiveTracking(true);
    triggerDeviceVibration([40, 60]);
    toast.info("🛰️ Rastreio contínuo GPS ativado", {
      description: "A monitorizar a posição do dispositivo em tempo real com satélites GNSS.",
    });

    const stopFn = watchSTPPreciseGPS(
      (newLoc) => {
        setLocation(newLoc);
        onLocationUpdateRef.current?.(newLoc);
      },
      (err) => {
        console.warn("Erro no rastreamento em tempo real:", err);
        setError("Sinal de satélite enfraquecido.");
      },
    );

    unwatchRef.current = stopFn;
  }, []);

  const stopLiveTracking = useCallback(() => {
    if (unwatchRef.current) {
      unwatchRef.current();
      unwatchRef.current = null;
    }
    setIsLiveTracking(false);
    toast.info("Rastreio contínuo desativado.");
  }, []);

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      if (unwatchRef.current) {
        unwatchRef.current();
      }
    };
  }, []);

  // Auto-solicitar se configurado
  useEffect(() => {
    if (autoRequestOnMount && isSupported && permissionState === "granted") {
      requestLocation(true);
    }
  }, [autoRequestOnMount, isSupported, permissionState, requestLocation]);

  return {
    isSupported,
    permissionState,
    isLocating,
    isLiveTracking,
    location,
    coordinates: location ? { latitude: location.latitude, longitude: location.longitude } : null,
    accuracy: location?.accuracy ?? null,
    error,
    requestLocation,
    startLiveTracking,
    stopLiveTracking,
  };
}
