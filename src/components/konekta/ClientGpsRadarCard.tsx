import { useState, useRef, useEffect, useMemo } from "react";
import {
  Navigation,
  Compass,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Share2,
  Radio,
  Car,
  Footprints,
  Satellite,
  Volume2,
  VolumeX,
  RefreshCw,
  Maximize2,
  Minimize2,
  Crosshair,
  Layers,
  LocateFixed,
  AlertCircle,
  Smartphone,
  Route,
} from "lucide-react";
import { toast } from "sonner";
import { openWhatsApp, triggerDeviceVibration } from "@/lib/sync-manager";
import { calculateDistanceKm, getSTPPreciseGPS, type STPPreciseLocation } from "@/lib/stp-geo";

interface ClientGpsRadarCardProps {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  address?: string;
  district?: string;
  referencePoint?: string;
  clientName?: string;
  orderTitle?: string;
  isProviderView?: boolean;
  onLocationRefreshed?: (loc: STPPreciseLocation) => void;
}

export function ClientGpsRadarCard({
  latitude,
  longitude,
  accuracy = 8,
  address,
  district = "Água Grande",
  referencePoint,
  clientName = "Cliente",
  orderTitle = "Serviço KONEKTA",
  isProviderView = true,
  onLocationRefreshed,
}: ClientGpsRadarCardProps) {
  const [copied, setCopied] = useState(false);
  const [travelMode, setTravelMode] = useState<"driving" | "walking">("driving");
  const [mapView, setMapView] = useState<"map" | "satellite" | "radar">("map");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshingGps, setIsRefreshingGps] = useState(false);
  const [isPlayingBeaconSound, setIsPlayingBeaconSound] = useState(false);

  // Coordenadas do prestador para cálculo da rota e distância exata
  const [providerCoords, setProviderCoords] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
  } | null>(null);
  const [isGettingProviderGps, setIsGettingProviderGps] = useState(false);

  // Coordenadas ativas do cliente
  const [currentLat, setCurrentLat] = useState(latitude);
  const [currentLng, setCurrentLng] = useState(longitude);
  const [currentAccuracy, setCurrentAccuracy] = useState(accuracy);
  const [currentAddress, setCurrentAddress] = useState(address);
  const [currentDistrict, setCurrentDistrict] = useState(district);

  useEffect(() => {
    if (latitude) setCurrentLat(latitude);
    if (longitude) setCurrentLng(longitude);
    if (accuracy) setCurrentAccuracy(accuracy);
    if (address) setCurrentAddress(address);
    if (district) setCurrentDistrict(district);
  }, [latitude, longitude, accuracy, address, district]);

  // Fallback para coordenadas centrais de São Tomé (Sé Catedral / Praça) se não houver coordenadas definidas
  const effectiveLat = currentLat ?? 0.3364;
  const effectiveLng = currentLng ?? 6.7315;
  const hasExactGps = Boolean(currentLat && currentLng);

  // URLs de navegação e visualização no Google Maps
  const googleMapsPinUrl = `https://www.google.com/maps?q=${effectiveLat},${effectiveLng}&z=18`;
  const googleMapsRouteUrl = providerCoords
    ? `https://www.google.com/maps/dir/?api=1&origin=${providerCoords.lat},${providerCoords.lng}&destination=${effectiveLat},${effectiveLng}&travelmode=${travelMode}`
    : `https://www.google.com/maps/dir/?api=1&destination=${effectiveLat},${effectiveLng}&travelmode=${travelMode}`;
  const wazeUrl = `https://waze.com/ul?ll=${effectiveLat},${effectiveLng}&navigate=yes`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${effectiveLat},${effectiveLng}&dirflg=${travelMode === "driving" ? "d" : "w"}`;

  // Iframe do Google Maps nativo
  // t=m (mapa normal), t=k (satélite puro), t=h (híbrido)
  const mapTypeParam = mapView === "satellite" ? "k" : "m";
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${effectiveLat},${effectiveLng}&t=${mapTypeParam}&z=17&output=embed`;

  // Cálculo da distância em linha reta e tempo estimado de deslocação
  const distanceInfo = useMemo(() => {
    if (!providerCoords) return null;
    const directDistanceKm = calculateDistanceKm(
      providerCoords.lat,
      providerCoords.lng,
      effectiveLat,
      effectiveLng,
    );

    // Fator de rota rodoviária em São Tomé (~1.25x devido às curvas e relevo)
    const roadDistanceKm = directDistanceKm * 1.25;

    // Velocidade média estimada em STP: Carro/Mota ~30 km/h, A pé ~4.5 km/h
    const speedKmh = travelMode === "driving" ? 30 : 4.5;
    const timeMinutes = Math.max(1, Math.round((roadDistanceKm / speedKmh) * 60));

    // Rumo da bússola em graus
    const y =
      Math.sin((effectiveLng - providerCoords.lng) * (Math.PI / 180)) *
      Math.cos(effectiveLat * (Math.PI / 180));
    const x =
      Math.cos(providerCoords.lat * (Math.PI / 180)) * Math.sin(effectiveLat * (Math.PI / 180)) -
      Math.sin(providerCoords.lat * (Math.PI / 180)) *
        Math.cos(effectiveLat * (Math.PI / 180)) *
        Math.cos((effectiveLng - providerCoords.lng) * (Math.PI / 180));
    const bearingDeg = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);

    const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
    const directionName = directions[Math.round(bearingDeg / 45) % 8];

    return {
      directKm: directDistanceKm,
      roadKm: roadDistanceKm,
      timeMinutes,
      bearingDeg,
      directionName,
    };
  }, [providerCoords, effectiveLat, effectiveLng, travelMode]);

  // Audio Context Ref para sinal acústico estilo Encontrar Dispositivo (Find My Device)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const beaconIntervalRef = useRef<number | null>(null);

  const stopBeaconSound = () => {
    if (beaconIntervalRef.current) {
      clearInterval(beaconIntervalRef.current);
      beaconIntervalRef.current = null;
    }
    setIsPlayingBeaconSound(false);
  };

  const playBeaconSound = () => {
    if (isPlayingBeaconSound) {
      stopBeaconSound();
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        toast.info("O seu navegador não suporta sinal acústico.");
        return;
      }

      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtx();
      } else if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }

      setIsPlayingBeaconSound(true);
      triggerDeviceVibration([150, 80, 150]);
      toast.info("🔊 Sinal acústico de localização ativado", {
        description: "A emitir pulsos sonoros e vibração no dispositivo.",
      });

      const playPulse = () => {
        try {
          const ctx = audioCtxRef.current;
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          // Tom característico de radar / find-device (880Hz -> 1320Hz)
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

          gain.gain.setValueAtTime(0.01, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.28);
          triggerDeviceVibration([80]);
        } catch (err) {
          console.warn("Erro no oscilador:", err);
        }
      };

      playPulse();
      beaconIntervalRef.current = window.setInterval(playPulse, 1400);

      // Desliga automaticamente após 15 segundos
      setTimeout(() => {
        stopBeaconSound();
      }, 15000);
    } catch (err) {
      console.warn("AudioContext error:", err);
      setIsPlayingBeaconSound(false);
    }
  };

  useEffect(() => {
    return () => {
      stopBeaconSound();
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        try {
          audioCtxRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Obter localização nativa do prestador para traçar a rota exata
  const handleGetProviderLocation = async () => {
    setIsGettingProviderGps(true);
    triggerDeviceVibration([40]);
    try {
      const loc = await getSTPPreciseGPS();
      if (loc) {
        setProviderCoords({
          lat: loc.latitude,
          lng: loc.longitude,
          accuracy: loc.accuracy,
        });
        toast.success("A sua posição foi calculada com sucesso!", {
          description: `Distância até ao cliente calculada em tempo real.`,
        });
      }
    } catch {
      toast.error("Não foi possível detetar a sua posição atual.");
    } finally {
      setIsGettingProviderGps(false);
    }
  };

  // Recarregar/Atualizar GPS com permissões nativas do navegador
  const handleRefreshClientGps = async () => {
    setIsRefreshingGps(true);
    triggerDeviceVibration([40, 60]);
    try {
      const freshLoc = await getSTPPreciseGPS();
      if (freshLoc) {
        setCurrentLat(freshLoc.latitude);
        setCurrentLng(freshLoc.longitude);
        setCurrentAccuracy(freshLoc.accuracy);
        setCurrentAddress(freshLoc.formattedAddress || freshLoc.zone);
        setCurrentDistrict(freshLoc.district);
        onLocationRefreshed?.(freshLoc);
        toast.success("🛰️ Posição GPS atualizada com satélites GNSS!", {
          description: `${freshLoc.formattedAddress} (±${Math.round(freshLoc.accuracy)}m)`,
        });
      }
    } catch {
      toast.error("Falha ao atualizar coordenadas GPS.");
    } finally {
      setIsRefreshingGps(false);
    }
  };

  const handleCopyCoords = () => {
    const coordsStr = `${effectiveLat.toFixed(6)}, ${effectiveLng.toFixed(6)}`;
    navigator.clipboard.writeText(coordsStr);
    setCopied(true);
    triggerDeviceVibration([40]);
    toast.success("Coordenadas GPS copiadas!", {
      description: coordsStr,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyRoute = () => {
    navigator.clipboard.writeText(googleMapsRouteUrl);
    setCopied(true);
    triggerDeviceVibration([40]);
    toast.success("Rota segura do Google Maps copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="client-gps-radar-card"
      className={`rounded-3xl border border-primary/25 bg-card/95 backdrop-blur-md overflow-hidden shadow-soft transition-all ${
        isFullscreen ? "fixed inset-4 z-50 flex flex-col max-w-4xl mx-auto shadow-2xl" : ""
      }`}
    >
      {/* CABEÇALHO ESTILO GOOGLE FIND MY DEVICE / RADAR */}
      <div className="bg-gradient-to-r from-primary/15 via-primary/10 to-transparent p-3.5 sm:p-4 border-b border-border/70">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex items-center justify-center size-9 shrink-0 rounded-2xl bg-primary text-primary-foreground shadow-xs">
              <Smartphone size={18} />
              {/* Radar Ping Animation */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground truncate">
                  {isProviderView
                    ? "Localizador de Dispositivo · Cliente"
                    : "A sua Localização GPS Partilhada"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 flex items-center gap-1 shrink-0">
                  <Satellite size={10} />
                  {hasExactGps ? "Sinal GNSS Fixo" : "Zona Estimada"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {isProviderView
                  ? "Orientação por satélite e rota curva-a-curva até ao local exato"
                  : "O prestador de serviço utilizará este mapa para chegar sem atrasos"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Atualizar GPS */}
            <button
              type="button"
              onClick={handleRefreshClientGps}
              disabled={isRefreshingGps}
              className="p-2 rounded-xl bg-background/80 hover:bg-muted border border-border text-foreground text-xs font-semibold transition active:scale-95 cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Atualizar Coordenadas GPS via Satélite"
            >
              <RefreshCw
                size={14}
                className={isRefreshingGps ? "animate-spin text-primary" : "text-muted-foreground"}
              />
            </button>

            {/* Copiar Coordenadas */}
            <button
              type="button"
              onClick={handleCopyCoords}
              className="p-2 rounded-xl bg-background/80 hover:bg-muted border border-border text-foreground text-xs font-semibold flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-2xs"
              title="Copiar Coordenadas GPS"
            >
              {copied ? (
                <Check size={14} className="text-emerald-600" />
              ) : (
                <Copy size={14} className="text-muted-foreground" />
              )}
              <span className="text-[10px] font-mono font-bold hidden sm:inline">
                {effectiveLat.toFixed(4)}, {effectiveLng.toFixed(4)}
              </span>
            </button>

            {/* Tela Cheia Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-background/80 hover:bg-muted border border-border text-foreground text-xs font-semibold transition active:scale-95 cursor-pointer shadow-2xs"
              title={isFullscreen ? "Minimizar Mapa" : "Expandir Mapa em Ecrã Inteiro"}
            >
              {isFullscreen ? (
                <Minimize2 size={14} className="text-muted-foreground" />
              ) : (
                <Maximize2 size={14} className="text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* SELETOR DE VISTA DO MAPA (Google Maps Rua / Satélite / Radar Tático) */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-border/50">
          <div className="flex items-center gap-1 bg-muted/70 p-0.5 rounded-xl border border-border/60">
            <button
              type="button"
              onClick={() => setMapView("map")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition ${
                mapView === "map"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers size={12} />
              <span>Google Maps</span>
            </button>

            <button
              type="button"
              onClick={() => setMapView("satellite")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition ${
                mapView === "satellite"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Satellite size={12} />
              <span>Satélite HD</span>
            </button>

            <button
              type="button"
              onClick={() => setMapView("radar")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition ${
                mapView === "radar"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Crosshair size={12} />
              <span>Radar Find My Device</span>
            </button>
          </div>

          {/* Botão de Som Estilo "Find My Device" */}
          <button
            type="button"
            onClick={playBeaconSound}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer border ${
              isPlayingBeaconSound
                ? "bg-amber-500 text-slate-950 border-amber-600 animate-pulse font-black"
                : "bg-background/80 hover:bg-muted text-muted-foreground border-border"
            }`}
            title="Tocar som no dispositivo para localização imediata no local"
          >
            {isPlayingBeaconSound ? <VolumeX size={13} /> : <Volume2 size={13} />}
            <span className="hidden xs:inline">
              {isPlayingBeaconSound ? "Parar Som" : "Tocar Alerta"}
            </span>
          </button>
        </div>
      </div>

      {/* ÁREA DO MAPA NATIVO GOOGLE MAPS / RADAR TÁTICO */}
      <div
        className={`relative w-full ${
          isFullscreen ? "flex-1 min-h-[350px]" : "h-56 sm:h-64"
        } bg-slate-950 overflow-hidden border-b border-border/60 select-none`}
      >
        {mapView === "radar" ? (
          /* RADAR TÁTICO VECTORIAL DE ALTA PRECISÃO (ESTILO FIND MY DEVICE) */
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Fundo de Grade Militar */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#10b981_1px,transparent_1px),linear-gradient(to_bottom,#10b981_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Círculos Concêntricos de Alcance Radar */}
            <div className="absolute size-48 rounded-full border border-emerald-500/20 animate-ping opacity-40 pointer-events-none" />
            <div className="absolute size-44 rounded-full border border-emerald-500/25 pointer-events-none" />
            <div className="absolute size-32 rounded-full border border-emerald-500/35 pointer-events-none" />
            <div className="absolute size-16 rounded-full border border-emerald-400/50 pointer-events-none" />

            {/* Eixo Cruzado (Crosshairs) */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-emerald-500/30 pointer-events-none" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-emerald-500/30 pointer-events-none" />

            {/* Ponto Central do Dispositivo */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center size-9 rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50 ring-4 ring-emerald-400/40 animate-bounce">
                <MapPin size={20} className="fill-slate-950" />
              </div>
              <span className="mt-1.5 px-2.5 py-0.5 rounded-md bg-slate-900/90 text-emerald-400 text-[10px] font-mono font-bold tracking-tight border border-emerald-500/40 shadow-xs">
                {currentAddress || currentDistrict}
              </span>
            </div>
          </div>
        ) : (
          /* GOOGLE MAPS INTERATIVO EMBED (RUA OU SATÉLITE COM PIN EXATO) */
          <div className="absolute inset-0 w-full h-full">
            <iframe
              title="Google Maps Cliente KONEKTA"
              width="100%"
              height="100%"
              src={googleMapsEmbedUrl}
              style={{ border: 0, filter: mapView === "satellite" ? "contrast(1.05)" : "none" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </div>
        )}

        {/* Overlay com Coordenadas Flutuantes & Precisão do Satélite */}
        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400 shadow-md flex items-center gap-1.5 pointer-events-none z-10">
          <MapPin size={11} className="text-emerald-400 shrink-0" />
          <span>
            {effectiveLat.toFixed(6)}, {effectiveLng.toFixed(6)}
          </span>
          <span className="text-slate-400 font-sans text-[9px]">
            (±{Math.round(currentAccuracy)}m)
          </span>
        </div>

        {/* Botão para Abrir no Google Maps Oficial em Nova Aba */}
        <a
          href={googleMapsPinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[10px] font-bold shadow-md flex items-center gap-1 transition active:scale-95 cursor-pointer z-10"
        >
          <span>Abrir Google Maps</span>
          <ExternalLink size={11} />
        </a>
      </div>

      {/* PAINEL DE TELEMETRIA E ROTA DO PRESTADOR */}
      <div className="p-3.5 sm:p-4 space-y-3.5">
        {/* INFORMAÇÃO DE DISTÂNCIA E TEMPO ESTIMADO SE O PRESTADOR ATIVOU O GPS */}
        {distanceInfo ? (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">
                <Route size={16} />
              </div>
              <div>
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <span>Distância até ao Cliente:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                    {distanceInfo.roadKm.toFixed(1)} km
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Tempo estimado: <strong>~{distanceInfo.timeMinutes} min</strong> (
                  {travelMode === "driving" ? "carro/mota" : "a pé"}) · Rumo:{" "}
                  {distanceInfo.bearingDeg}° {distanceInfo.directionName}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGetProviderLocation}
              disabled={isGettingProviderGps}
              className="p-2 rounded-xl bg-background border border-border text-foreground hover:bg-muted text-[10px] font-bold shrink-0 transition"
              title="Recalcular distância a partir da minha localização"
            >
              <RefreshCw size={13} className={isGettingProviderGps ? "animate-spin" : ""} />
            </button>
          </div>
        ) : isProviderView ? (
          <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
              <LocateFixed size={14} className="text-primary shrink-0" />
              <span>Calcular distância e tempo de chegada exato a partir do seu telemóvel</span>
            </div>
            <button
              type="button"
              onClick={handleGetProviderLocation}
              disabled={isGettingProviderGps}
              className="px-2.5 py-1 rounded-xl bg-primary text-primary-foreground font-bold text-[11px] flex items-center gap-1 transition active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isGettingProviderGps ? (
                <RefreshCw size={11} className="animate-spin" />
              ) : (
                <Compass size={11} />
              )}
              <span>A Minha Posição</span>
            </button>
          </div>
        ) : null}

        {/* DETALHES DO ENDEREÇO CONVERTIDO POR GEOCODING */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
            <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
              <MapPin size={11} className="text-primary" /> Endereço Legível (Geocoding)
            </span>
            <p className="font-bold text-foreground leading-snug">
              {currentAddress || currentDistrict}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium">
              {currentDistrict}, São Tomé e Príncipe
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
            <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
              <Radio size={11} className="text-primary" /> Precisão & Ponto de Referência
            </span>
            <p className="font-bold text-foreground leading-snug">
              {referencePoint || "Localização obtida por satélites de GPS nativo"}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Satellite size={11} /> Raio de Incerteza GNSS: ±{Math.round(currentAccuracy)} metros
            </p>
          </div>
        </div>

        {/* SELETOR DE MODO DE TRANSPORTE (Carro/Mota vs A Pé) */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Modo de Deslocação:
          </span>
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTravelMode("driving")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                travelMode === "driving"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Car size={13} />
              <span>Carro / Moto</span>
            </button>
            <button
              type="button"
              onClick={() => setTravelMode("walking")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                travelMode === "walking"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Footprints size={13} />
              <span>A Pé</span>
            </button>
          </div>
        </div>

        {/* BOTÃO PRINCIPAL: INICIAR NAVEGAÇÃO / TRAÇAR ROTA NO GOOGLE MAPS */}
        <a
          href={googleMapsRouteUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => triggerDeviceVibration([40, 60])}
          className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer text-center"
        >
          <Navigation size={18} className="animate-pulse shrink-0" />
          <span>🧭 Iniciar Rota no Google Maps (Navegação GPS com Voz)</span>
        </a>

        {/* OUTROS APLICATIVOS DE NAVEGAÇÃO & PARTILHA DIRETA */}
        <div className="grid grid-cols-3 gap-2 pt-0.5">
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-[11px] font-bold flex items-center justify-center gap-1 transition text-center shadow-2xs"
          >
            <span>Waze</span>
            <ExternalLink size={11} className="text-muted-foreground" />
          </a>

          <a
            href={appleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-[11px] font-bold flex items-center justify-center gap-1 transition text-center shadow-2xs"
          >
            <span>Apple Maps</span>
            <ExternalLink size={11} className="text-muted-foreground" />
          </a>

          <button
            type="button"
            onClick={handleCopyRoute}
            className="py-2 px-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-[11px] font-bold flex items-center justify-center gap-1 transition text-center shadow-2xs cursor-pointer"
          >
            <Copy size={12} className="text-primary" />
            <span>Copiar Rota</span>
          </button>
        </div>
      </div>
    </div>
  );
}
