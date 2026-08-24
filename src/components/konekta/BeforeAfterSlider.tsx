import { useState, useRef, useCallback, useEffect } from "react";
import { MoveHorizontal, Eye, Columns, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeAfterSliderProps {
  beforeImageUrl: string;
  afterImageUrl: string;
  title?: string;
  description?: string;
  category?: string;
  completedAt?: string;
  rating?: number;
  className?: string;
  initialPosition?: number; // 0 to 100
  aspectRatio?: "4/3" | "16/9" | "square";
  allowModeSwitch?: boolean;
}

export function BeforeAfterSlider({
  beforeImageUrl,
  afterImageUrl,
  title,
  description,
  category,
  completedAt,
  rating,
  className,
  initialPosition = 50,
  aspectRatio = "4/3",
  allowModeSwitch = true,
}: BeforeAfterSliderProps) {
  const [sliderPos, setSliderPos] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<"slider" | "side_by_side" | "toggle">("slider");
  const [toggledIsAfter, setToggledIsAfter] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  const aspectClass =
    aspectRatio === "16/9"
      ? "aspect-16/9"
      : aspectRatio === "square"
        ? "aspect-square"
        : "aspect-4/3";

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs transition-all",
        className,
      )}
    >
      {/* Header com Categoria, Título e Controles de Visualização */}
      {(title || allowModeSwitch) && (
        <div className="p-3.5 border-b border-border/60 flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {category && (
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                  {category}
                </span>
              )}
              {completedAt && (
                <span className="text-[11px] text-muted-foreground font-medium">{completedAt}</span>
              )}
            </div>
            {title && <h4 className="text-sm font-bold text-foreground mt-1 truncate">{title}</h4>}
          </div>

          {allowModeSwitch && (
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setViewMode("slider")}
                className={cn(
                  "px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer",
                  viewMode === "slider"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title="Modo Slider Interativo"
              >
                <MoveHorizontal size={12} className="text-primary" />
                <span>Slider</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("side_by_side")}
                className={cn(
                  "px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer",
                  viewMode === "side_by_side"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title="Modo Lado a Lado"
              >
                <Columns size={12} />
                <span>Lado a Lado</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("toggle")}
                className={cn(
                  "px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer",
                  viewMode === "toggle"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title="Alternar com Clique"
              >
                <Eye size={12} />
                <span>Alternar</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ÁREA DO WIDGET */}
      {viewMode === "slider" && (
        <div
          ref={containerRef}
          onMouseDown={(e) => {
            setIsDragging(true);
            handleMove(e.clientX);
          }}
          onTouchStart={(e) => {
            setIsDragging(true);
            handleMove(e.touches[0].clientX);
          }}
          className={cn(
            "relative w-full overflow-hidden select-none cursor-ew-resize group bg-muted/40",
            aspectClass,
          )}
        >
          {/* IMAGEM DEPOIS (Fundo base completo) */}
          <img
            src={afterImageUrl}
            alt="Depois do serviço"
            className="absolute inset-0 size-full object-cover pointer-events-none"
            loading="lazy"
          />

          {/* BADGE DEPOIS */}
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-md">
              <CheckCircle2 size={11} /> Depois
            </span>
          </div>

          {/* IMAGEM ANTES (Camada recortada pela posição do slider) */}
          <div
            className="absolute inset-0 size-full overflow-hidden pointer-events-none"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={beforeImageUrl}
              alt="Antes do serviço"
              className="absolute inset-0 size-full object-cover"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%",
                maxWidth: "none",
              }}
              loading="lazy"
            />
          </div>

          {/* BADGE ANTES */}
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900/80 text-white text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-md border border-white/10">
              Antes
            </span>
          </div>

          {/* LINHA DIVISÓRIA COM HANDLE INTERATIVO */}
          <div
            className="absolute top-0 bottom-0 z-20 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.5)] pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div
              className={cn(
                "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-9 rounded-full bg-white text-neutral-900 shadow-xl border border-black/10 flex items-center justify-center transition-transform",
                isDragging ? "scale-110 ring-4 ring-primary/40" : "group-hover:scale-105",
              )}
            >
              <MoveHorizontal size={16} className="text-primary font-black" />
            </div>
          </div>

          {/* Dica de arraste na base */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white/90 shadow-sm flex items-center gap-1">
              <Sparkles size={11} className="text-primary" /> Arraste para comparar
            </span>
          </div>
        </div>
      )}

      {/* MODO LADO A LADO */}
      {viewMode === "side_by_side" && (
        <div className="grid grid-cols-2 gap-1.5 p-2 bg-muted/20">
          <div className="relative rounded-xl overflow-hidden aspect-4/3 bg-muted border border-border/40">
            <img
              src={beforeImageUrl}
              alt="Antes"
              className="size-full object-cover"
              loading="lazy"
            />
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-neutral-900/80 text-white text-[9px] font-bold uppercase backdrop-blur-xs">
              Antes
            </span>
          </div>
          <div className="relative rounded-xl overflow-hidden aspect-4/3 bg-muted border border-border/40">
            <img
              src={afterImageUrl}
              alt="Depois"
              className="size-full object-cover"
              loading="lazy"
            />
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-primary/90 text-primary-foreground text-[9px] font-bold uppercase backdrop-blur-xs">
              Depois
            </span>
          </div>
        </div>
      )}

      {/* MODO ALTERNAR */}
      {viewMode === "toggle" && (
        <div
          onClick={() => setToggledIsAfter(!toggledIsAfter)}
          className={cn(
            "relative w-full overflow-hidden select-none cursor-pointer group bg-muted/40",
            aspectClass,
          )}
        >
          <img
            src={toggledIsAfter ? afterImageUrl : beforeImageUrl}
            alt={toggledIsAfter ? "Depois" : "Antes"}
            className="size-full object-cover transition-opacity duration-300"
            loading="lazy"
          />
          <div className="absolute top-3 left-3">
            <span
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-md transition-colors",
                toggledIsAfter
                  ? "bg-primary text-primary-foreground"
                  : "bg-neutral-900/80 text-white",
              )}
            >
              {toggledIsAfter ? "✨ Resultado Final (Depois)" : "⚠️ Estado Inicial (Antes)"}
            </span>
          </div>
          <div className="absolute bottom-3 right-3">
            <span className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-[11px] font-bold text-white shadow-lg flex items-center gap-1.5 hover:bg-black/80">
              <Eye size={13} className="text-primary" /> Clique para ver{" "}
              {toggledIsAfter ? "Antes" : "Depois"}
            </span>
          </div>
        </div>
      )}

      {/* Descrição do serviço */}
      {description && (
        <div className="p-3.5 bg-muted/30 border-t border-border/40">
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      )}
    </div>
  );
}
