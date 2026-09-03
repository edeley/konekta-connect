import { useState } from "react";
import { Image as ImageIcon, X, Plus, MoveHorizontal, Eye, MessageCircle } from "lucide-react";
import { type PortfolioBeforeAfterItem } from "@/types/provider-profile";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { Link } from "@tanstack/react-router";

export type UnifiedPortfolioItem =
  | PortfolioBeforeAfterItem
  | {
      id: string;
      title: string;
      image: string;
      description?: string;
      category?: string;
      date?: string;
    };

interface PortfolioGalleryProps {
  portfolio?: UnifiedPortfolioItem[];
  providerId: string;
  providerName: string;
  isOwner?: boolean;
  onAddPhotoClick?: () => void;
}

export function PortfolioGallery({
  portfolio = [],
  providerId,
  providerName,
  isOwner = false,
  onAddPhotoClick,
}: PortfolioGalleryProps) {
  const [activeItem, setActiveItem] = useState<UnifiedPortfolioItem | null>(null);

  if (portfolio.length === 0 && !isOwner) {
    return null;
  }

  return (
    <section className="px-5 mt-6 space-y-3">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ImageIcon size={16} className="text-primary" />
            Portfólio & Transformações (Antes vs. Depois)
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
            {portfolio.length}
          </span>
        </div>

        {isOwner && onAddPhotoClick && (
          <button
            type="button"
            onClick={onAddPhotoClick}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            <Plus size={14} />
            Gerir Portfólio
          </button>
        )}
      </div>

      {portfolio.length === 0 && isOwner ? (
        <div className="p-5 rounded-2xl bg-card border border-dashed border-border text-center space-y-2.5">
          <div className="size-10 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <MoveHorizontal size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-foreground">
              Ainda não adicionou fotos de serviços Antes vs. Depois
            </p>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              Adicione fotos dos seus trabalhos para demonstrar autoridade e converter mais
              clientes.
            </p>
          </div>
          {onAddPhotoClick && (
            <button
              type="button"
              onClick={onAddPhotoClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-2xs hover:bg-primary/90 transition cursor-pointer"
            >
              <Plus size={13} />
              Adicionar Primeiro Trabalho
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {portfolio.map((rawItem) => {
            const isBeforeAfter = "beforeImageUrl" in rawItem && "afterImageUrl" in rawItem;
            const previewImage = isBeforeAfter
              ? (rawItem as PortfolioBeforeAfterItem).afterImageUrl
              : (rawItem as { image: string }).image;
            const subtitleDate = isBeforeAfter
              ? (rawItem as PortfolioBeforeAfterItem).completedAt
              : (rawItem as { date?: string }).date || "Concluído com sucesso";

            return (
              <button
                key={rawItem.id}
                type="button"
                onClick={() => setActiveItem(rawItem)}
                className="group relative rounded-2xl overflow-hidden bg-card border border-border text-left shadow-2xs transition hover:border-primary/60 hover:shadow-soft flex flex-col cursor-pointer"
              >
                <div className="relative aspect-16/10 w-full bg-muted overflow-hidden">
                  <img
                    src={previewImage}
                    alt={rawItem.title}
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Badges de Categoria e Antes/Depois */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between">
                    {rawItem.category ? (
                      <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white">
                        {rawItem.category}
                      </span>
                    ) : (
                      <span />
                    )}

                    {isBeforeAfter && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                        <MoveHorizontal size={10} /> Antes vs Depois
                      </span>
                    )}
                  </div>

                  {/* Título sobreposto na imagem */}
                  <div className="absolute bottom-2.5 inset-x-2.5">
                    <p className="text-xs font-bold text-white line-clamp-1 group-hover:text-primary-foreground transition-colors">
                      {rawItem.title}
                    </p>
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between space-y-1.5">
                  {rawItem.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {rawItem.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold pt-1 border-t border-border/40">
                    <span>{subtitleDate}</span>
                    <span className="text-primary font-bold flex items-center gap-1">
                      <Eye size={11} /> Ver Comparação
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* MODAL LIGHTBOX INTERATIVO COM SLIDER */}
      {activeItem && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="w-full max-w-xl bg-card rounded-3xl overflow-hidden border border-border shadow-2xl space-y-0 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do modal */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {activeItem.category && (
                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase">
                      {activeItem.category}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Trabalho de <strong>{providerName}</strong>
                  </span>
                </div>
                <h3 className="text-sm font-black text-foreground mt-0.5 truncate">
                  {activeItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Slider interativo */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {"beforeImageUrl" in activeItem && "afterImageUrl" in activeItem ? (
                <BeforeAfterSlider
                  beforeImageUrl={activeItem.beforeImageUrl}
                  afterImageUrl={activeItem.afterImageUrl}
                  aspectRatio="16/9"
                  allowModeSwitch={true}
                />
              ) : (
                <div className="relative aspect-16/10 rounded-2xl overflow-hidden bg-black border border-border">
                  <img
                    src={(activeItem as { image: string }).image}
                    alt={activeItem.title}
                    className="size-full object-contain"
                  />
                </div>
              )}

              {activeItem.description && (
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Detalhes da Execução
                  </h4>
                  <p className="text-xs text-foreground leading-relaxed">
                    {activeItem.description}
                  </p>
                </div>
              )}
            </div>

            {/* Footer com botão de pedir orçamento semelhante */}
            <div className="p-4 border-t border-border bg-card flex items-center gap-2 shrink-0">
              <Link
                to="/orcamento/$providerId"
                params={{ providerId }}
                search={{ service: activeItem.title }}
                className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 transition cursor-pointer"
                onClick={() => setActiveItem(null)}
              >
                <Plus size={14} />
                <span>Pedir Serviço Semelhante</span>
              </Link>

              <Link
                to="/chat/$id"
                params={{ id: providerId }}
                className="size-11 rounded-2xl border border-border bg-card text-foreground hover:bg-muted flex items-center justify-center transition cursor-pointer shrink-0"
                onClick={() => setActiveItem(null)}
                title="Falar no chat"
              >
                <MessageCircle size={16} className="text-primary" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
