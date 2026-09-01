import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { openWhatsApp, triggerDeviceVibration } from "@/lib/sync-manager";

interface ClientGpsRadarCardProps {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  address?: string;
  district?: string;
  referencePoint?: string;
  clientName?: string;
  clientPhone?: string;
  orderTitle?: string;
  isProviderView?: boolean;
}

export function ClientGpsRadarCard({
  latitude,
  longitude,
  accuracy = 8,
  address,
  district = "Água Grande",
  referencePoint,
  clientName = "Cliente",
  clientPhone,
  orderTitle = "Serviço KONEKTA",
  isProviderView = true,
}: ClientGpsRadarCardProps) {
  const [copied, setCopied] = useState(false);
  const [travelMode, setTravelMode] = useState<"driving" | "walking">("driving");

  // Fallback para coordenadas centrais de São Tomé se não tiver GPS fixo
  const effectiveLat = latitude ?? 0.3364;
  const effectiveLng = longitude ?? 6.7315;
  const hasExactGps = Boolean(latitude && longitude);

  const mapsPinUrl = `https://www.google.com/maps?q=${effectiveLat},${effectiveLng}&z=18`;
  const mapsRouteUrl = `https://www.google.com/maps/dir/?api=1&destination=${effectiveLat},${effectiveLng}&travelmode=${travelMode}`;
  const wazeUrl = `https://waze.com/ul?ll=${effectiveLat},${effectiveLng}&navigate=yes`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${effectiveLat},${effectiveLng}&dirflg=${travelMode === "driving" ? "d" : "w"}`;

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

  const handleShareWhatsApp = () => {
    const msg = `📍 *Localização do Cliente KONEKTA*\n👤 *Cliente:* ${clientName}\n📍 *Zona:* ${address || district}\n${referencePoint ? `🚩 *Ref:* ${referencePoint}\n` : ""}🌐 *Coordenadas:* ${effectiveLat.toFixed(6)}, ${effectiveLng.toFixed(6)} (±${Math.round(accuracy)}m)\n🧭 *Iniciar Rota no Google Maps:* ${mapsRouteUrl}`;
    openWhatsApp({
      phone: clientPhone,
      message: msg,
    });
  };

  return (
    <div
      id="client-gps-radar-card"
      className="rounded-3xl border border-primary/25 bg-card/95 backdrop-blur-md overflow-hidden shadow-soft transition-all"
    >
      {/* CABEÇALHO COM ESTILO GOOGLE FIND MY DEVICE / RADAR */}
      <div className="bg-gradient-to-r from-primary/15 via-primary/10 to-transparent p-4 border-b border-border/70">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center size-9 rounded-2xl bg-primary text-primary-foreground shadow-xs">
              <Compass size={18} className="animate-spin-slow" />
              {/* Radar Ping Animation */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  {isProviderView
                    ? "Localizador Exato do Cliente"
                    : "A sua Localização GPS Partilhada"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 flex items-center gap-1">
                  <Satellite size={10} />
                  {hasExactGps ? "GPS Ativo" : "Zona"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isProviderView
                  ? "Orientação e rota de navegação passo a passo até ao local exato"
                  : "O prestador receberá estas coordenadas para chegar sem desvios"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyCoords}
            className="shrink-0 p-2 rounded-xl bg-background/80 hover:bg-muted border border-border text-foreground text-xs font-semibold flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-2xs"
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
        </div>
      </div>

      {/* DISPLAY VISUAL DE RADAR VETORIAL & MAPA DE SATÉLITE (Sem iFrames frágeis) */}
      <div className="relative w-full h-44 sm:h-48 bg-slate-950 overflow-hidden border-b border-border/60 flex items-center justify-center select-none">
        {/* Fundo de Grade de Coordenadas Militares / Radar */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#10b981_1px,transparent_1px),linear-gradient(to_bottom,#10b981_1px,transparent_1px)] bg-[size:24px_24px]" />

        {/* Círculos Concêntricos de Alcance Radar */}
        <div className="absolute size-32 rounded-full border border-emerald-500/30 animate-ping opacity-40 pointer-events-none" />
        <div className="absolute size-44 rounded-full border border-emerald-500/25 pointer-events-none" />
        <div className="absolute size-28 rounded-full border border-emerald-500/40 pointer-events-none" />
        <div className="absolute size-14 rounded-full border border-emerald-400/60 pointer-events-none" />

        {/* Eixo Cruzado (Crosshairs) */}
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-emerald-500/30 pointer-events-none" />
        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-emerald-500/30 pointer-events-none" />

        {/* Ponto Central / Beacon do Cliente */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center size-8 rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50 ring-4 ring-emerald-400/30 animate-bounce">
            <MapPin size={18} className="fill-slate-950" />
          </div>
          <span className="mt-1 px-2 py-0.5 rounded-md bg-slate-900/90 text-emerald-400 text-[10px] font-mono font-bold tracking-tight border border-emerald-500/40 shadow-xs">
            {address || district}
          </span>
        </div>

        {/* Overlay com Coordenadas Flutuantes */}
        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400 shadow-xs flex items-center gap-1.5 pointer-events-none">
          <MapPin size={11} className="text-emerald-400" />
          <span>
            {effectiveLat.toFixed(6)}, {effectiveLng.toFixed(6)}
          </span>
          <span className="text-slate-400 font-sans text-[9px]">(±{Math.round(accuracy)}m)</span>
        </div>

        {/* Botão para Abrir Mapa Completo de Satélite */}
        <a
          href={mapsPinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-[10px] font-bold shadow-xs flex items-center gap-1 transition active:scale-95 cursor-pointer"
        >
          <span>Abrir no Google Maps</span>
          <ExternalLink size={11} />
        </a>
      </div>

      {/* DETALHES DE ENDEREÇO & PONTO DE ENCONTRO */}
      <div className="p-4 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
            <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
              <MapPin size={11} className="text-primary" /> Zona / Endereço
            </span>
            <p className="font-bold text-foreground leading-snug">{address || district}</p>
            <p className="text-[11px] text-muted-foreground font-medium">
              {district}, São Tomé e Príncipe
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
            <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
              <Radio size={11} className="text-primary" /> Precisão & Ponto de Referência
            </span>
            <p className="font-bold text-foreground leading-snug">
              {referencePoint || "Localização GPS precisa do smartphone"}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Satellite size={11} /> Precisão de Satélite: ±{Math.round(accuracy)} metros
            </p>
          </div>
        </div>

        {/* SELETOR DE MODO DE TRANSPORTE (Carro / A Pé) */}
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

        {/* BOTÃO PRINCIPAL: INICIAR NAVEGAÇÃO / ROTA GOOGLE MAPS */}
        <a
          href={mapsRouteUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => triggerDeviceVibration([40, 60])}
          className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer text-center"
        >
          <Navigation size={18} className="animate-pulse shrink-0" />
          <span>🧭 Iniciar Rota no Google Maps (Navegação GPS)</span>
        </a>

        {/* OUTROS APLICATIVOS DE NAVEGAÇÃO & PARTILHA */}
        <div className="grid grid-cols-3 gap-2 pt-1">
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
            onClick={handleShareWhatsApp}
            className="py-2 px-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-[11px] font-bold flex items-center justify-center gap-1 transition text-center shadow-2xs cursor-pointer"
          >
            <Share2 size={12} className="text-emerald-600" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
