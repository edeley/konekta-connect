import { useState } from "react";
import {
  MapPin,
  Compass,
  Navigation,
  Check,
  Globe,
  Sliders,
  CheckCircle2,
  Info,
} from "lucide-react";
import { type ProviderCoverage, STP_DISTRICTS } from "@/types/provider-profile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CoverageConfiguratorProps {
  initialCoverage?: ProviderCoverage;
  onSave?: (coverage: ProviderCoverage) => void;
  className?: string;
  isReadOnly?: boolean;
}

export function CoverageConfigurator({
  initialCoverage,
  onSave,
  className,
  isReadOnly = false,
}: CoverageConfiguratorProps) {
  const [radiusKm, setRadiusKm] = useState(initialCoverage?.radiusKm || 15);
  const [centerLat, setCenterLat] = useState(initialCoverage?.centerLat || 0.336);
  const [centerLng, setCenterLng] = useState(initialCoverage?.centerLng || 6.731);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(
    initialCoverage?.districts || ["Água Grande", "Mé-Zóchi", "Cantagalo"],
  );
  const [isLocating, setIsLocating] = useState(false);

  const toggleDistrict = (district: string) => {
    if (isReadOnly) return;
    if (selectedDistricts.includes(district)) {
      if (selectedDistricts.length === 1) {
        toast.error("Deve manter pelo menos 1 distrito selecionado.");
        return;
      }
      setSelectedDistricts(selectedDistricts.filter((d) => d !== district));
    } else {
      setSelectedDistricts([...selectedDistricts, district]);
    }
  };

  const handleSelectAllDistricts = () => {
    if (isReadOnly) return;
    if (selectedDistricts.length === STP_DISTRICTS.length) {
      setSelectedDistricts(["Água Grande"]);
    } else {
      setSelectedDistricts([...STP_DISTRICTS]);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada no seu navegador.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setCenterLat(Number(pos.coords.latitude.toFixed(4)));
        setCenterLng(Number(pos.coords.longitude.toFixed(4)));
        toast.success("Coordenadas GPS atualizadas com base na sua localização atual!");
      },
      () => {
        setIsLocating(false);
        // Fallback suave para São Tomé
        setCenterLat(0.3364);
        setCenterLng(6.7315);
        toast.info("Localização definida para o centro de São Tomé.");
      },
      { timeout: 8000 },
    );
  };

  const handleSave = () => {
    const payload: ProviderCoverage = {
      centerLat,
      centerLng,
      radiusKm,
      districts: selectedDistricts,
      baseAddress: "São Tomé e Príncipe",
    };
    if (onSave) onSave(payload);
    toast.success(`Área de cobertura atualizada para raio de ${radiusKm} km!`);
  };

  return (
    <div
      className={cn("rounded-2xl border border-border bg-card p-4 space-y-4 shadow-2xs", className)}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Compass size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Raio e Área de Atendimento</h3>
            <p className="text-[11px] text-muted-foreground">
              {radiusKm} km de raio a partir do seu ponto base
            </p>
          </div>
        </div>

        {!isReadOnly && (
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="px-2.5 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Usar GPS do aparelho"
          >
            <Navigation size={13} className={cn("text-primary", isLocating && "animate-spin")} />
            <span>{isLocating ? "A buscar..." : "GPS Atual"}</span>
          </button>
        )}
      </div>

      {/* MAPA ILUSTRATIVO DO RAIO COM RADIAL VISUAL */}
      <div className="relative aspect-16/9 sm:aspect-21/9 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 overflow-hidden flex items-center justify-center p-4 select-none">
        {/* Grade de fundo simulando coordenadas cartográficas */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />

        {/* CÍRCULOS DE COBERTURA DINÂMICOS */}
        <div
          className="absolute rounded-full border border-primary/40 bg-primary/10 animate-pulse transition-all duration-300 pointer-events-none"
          style={{
            width: `${Math.min(260, radiusKm * 7)}px`,
            height: `${Math.min(260, radiusKm * 7)}px`,
          }}
        />

        <div
          className="absolute rounded-full border border-dashed border-primary/60 transition-all duration-300 pointer-events-none"
          style={{
            width: `${Math.min(180, radiusKm * 4.5)}px`,
            height: `${Math.min(180, radiusKm * 4.5)}px`,
          }}
        />

        {/* PIN CENTRAL COM O PRESTADOR */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="size-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center ring-4 ring-primary/30">
            <MapPin size={18} />
          </div>
          <span className="mt-1 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-xs text-[10px] font-bold text-white shadow-md border border-white/10">
            {centerLat.toFixed(3)}° N, {centerLng.toFixed(3)}° E
          </span>
        </div>

        {/* BADGES LATERAIS DO MAPA */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
            <Globe size={11} className="text-primary" /> São Tomé & Príncipe
          </span>
        </div>

        <div className="absolute bottom-2.5 right-2.5 z-10">
          <span className="px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-extrabold uppercase shadow-sm">
            Raio: {radiusKm} km
          </span>
        </div>
      </div>

      {/* SLIDER DE RAIO EM KM */}
      {!isReadOnly && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-foreground flex items-center gap-1.5">
              <Sliders size={13} className="text-primary" /> Ajustar Raio Máximo de Deslocação
            </label>
            <span className="font-extrabold text-primary text-sm">{radiusKm} km</span>
          </div>

          <input
            type="range"
            min="3"
            max="40"
            step="1"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />

          <div className="flex justify-between text-[10px] font-semibold text-muted-foreground px-0.5">
            <span>3 km (Bairro)</span>
            <span>15 km (Distrito)</span>
            <span>40 km (Toda a Ilha)</span>
          </div>
        </div>
      )}

      {/* SELEÇÃO DE DISTRITOS ATENDIDOS */}
      <div className="space-y-2 pt-1 border-t border-border/60">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground">
            Distritos Atendidos ({selectedDistricts.length}/{STP_DISTRICTS.length})
          </label>
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleSelectAllDistricts}
              className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
            >
              {selectedDistricts.length === STP_DISTRICTS.length
                ? "Limpar Seleção"
                : "Selecionar Todos"}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STP_DISTRICTS.map((d) => {
            const isSelected = selectedDistricts.includes(d);
            return (
              <button
                key={d}
                type="button"
                disabled={isReadOnly}
                onClick={() => toggleDistrict(d)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground",
                  isReadOnly && "cursor-default",
                )}
              >
                {isSelected && <Check size={12} className="stroke-[3]" />}
                <span>{d}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BOTÃO DE SALVAR */}
      {!isReadOnly && onSave && (
        <button
          type="button"
          onClick={handleSave}
          className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 shadow-md hover:bg-primary/90 transition cursor-pointer"
        >
          <CheckCircle2 size={16} />
          <span>Salvar Área de Cobertura</span>
        </button>
      )}
    </div>
  );
}
