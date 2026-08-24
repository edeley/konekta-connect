import { useState, useMemo } from "react";
import {
  Star,
  ThumbsUp,
  MessageSquare,
  ShieldCheck,
  Award,
  Plus,
  CornerDownRight,
} from "lucide-react";
import { type ProviderReview } from "@/lib/store";

interface ReviewsListProps {
  providerId: string;
  providerName: string;
  reviews: ProviderReview[];
  onOpenReviewModal: () => void;
  isOwner?: boolean;
}

export function ReviewsList({
  providerId,
  providerName,
  reviews,
  onOpenReviewModal,
  isOwner = false,
}: ReviewsListProps) {
  const [starFilter, setStarFilter] = useState<number | "all">("all");

  const providerReviews = useMemo(() => {
    return reviews.filter((r) => r.providerId === providerId);
  }, [reviews, providerId]);

  const stats = useMemo(() => {
    const total = providerReviews.length;
    if (total === 0) {
      return {
        avg: 5.0,
        total: 0,
        recommendPct: 100,
        counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
      };
    }

    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    let recommendCount = 0;

    providerReviews.forEach((r) => {
      sum += r.rating;
      counts[r.rating] = (counts[r.rating] || 0) + 1;
      if (r.recommended !== false) recommendCount++;
    });

    return {
      avg: Number((sum / total).toFixed(1)),
      total,
      recommendPct: Math.round((recommendCount / total) * 100),
      counts,
    };
  }, [providerReviews]);

  const filteredReviews = useMemo(() => {
    if (starFilter === "all") return providerReviews;
    return providerReviews.filter((r) => r.rating === starFilter);
  }, [providerReviews, starFilter]);

  return (
    <section className="px-5 mt-6 space-y-3">
      {/* Cabeçalho da secção */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Avaliações ({stats.total})
        </h2>
        {!isOwner && (
          <button
            type="button"
            onClick={onOpenReviewModal}
            className="h-8 px-3 rounded-full text-xs font-medium bg-terracotta text-white flex items-center gap-1 shadow-2xs hover:bg-terracotta/90 transition-colors"
          >
            <Plus size={13} /> Deixar Avaliação
          </button>
        )}
      </div>

      {/* Resumo de Reputação */}
      {stats.total > 0 && (
        <div className="bg-card rounded-2xl ring-1 ring-border p-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className="text-center shrink-0 pr-3 border-r border-border">
              <span className="text-2xl font-bold text-foreground">{stats.avg}</span>
              <div className="flex items-center justify-center gap-0.5 mt-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={12}
                    className={
                      n <= Math.round(stats.avg) ? "fill-sun text-sun" : "text-muted-foreground/30"
                    }
                  />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {stats.total} {stats.total === 1 ? "opinião" : "opiniões"}
              </p>
            </div>

            <div className="flex-1 space-y-1 min-w-0">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stats.counts[stars] || 0;
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => setStarFilter(starFilter === stars ? "all" : stars)}
                    className={`w-full flex items-center gap-2 text-[10px] group transition-opacity ${
                      starFilter !== "all" && starFilter !== stars ? "opacity-40" : "opacity-100"
                    }`}
                  >
                    <span className="w-2.5 text-right font-medium text-muted-foreground">
                      {stars}
                    </span>
                    <Star size={9} className="fill-sun text-sun shrink-0" />
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-sun rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-5 text-right text-muted-foreground text-[9px]">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-border text-xs">
            <div className="flex items-center gap-1.5 text-forest font-medium text-[11px]">
              <ThumbsUp size={12} />
              <span>{stats.recommendPct}% dos clientes recomendam</span>
            </div>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck size={11} className="text-ocean" /> Verificado KONEKTA
            </span>
          </div>
        </div>
      )}

      {/* Filtros rápidos se houver mais de 2 avaliações */}
      {providerReviews.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setStarFilter("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all ${
              starFilter === "all"
                ? "bg-foreground text-background"
                : "bg-card ring-1 ring-border text-muted-foreground hover:bg-muted"
            }`}
          >
            Todas ({providerReviews.length})
          </button>
          {[5, 4, 3].map((stars) => {
            const count = stats.counts[stars] || 0;
            if (count === 0) return null;
            return (
              <button
                key={stars}
                type="button"
                onClick={() => setStarFilter(starFilter === stars ? "all" : stars)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 flex items-center gap-1 transition-all ${
                  starFilter === stars
                    ? "bg-foreground text-background"
                    : "bg-card ring-1 ring-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <span>{stars}</span>
                <Star size={10} className="fill-sun text-sun" />
                <span>({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Lista de Avaliações */}
      {filteredReviews.length === 0 ? (
        <div className="bg-card rounded-2xl ring-1 ring-border p-5 text-center space-y-2">
          <div className="size-10 rounded-full bg-muted mx-auto grid place-items-center text-muted-foreground">
            <MessageSquare size={18} />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">
              {starFilter !== "all"
                ? `Nenhuma avaliação de ${starFilter} estrelas`
                : "Ainda sem avaliações registradas"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Seja o primeiro a partilhar a sua experiência com {providerName}.
            </p>
          </div>
          {!isOwner && (
            <button
              type="button"
              onClick={onOpenReviewModal}
              className="mt-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-terracotta text-white"
            >
              <Plus size={12} /> Avaliar agora
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredReviews.map((r) => (
            <div key={r.id} className="bg-card rounded-2xl ring-1 ring-border p-4 space-y-2">
              {/* Autor, Estrelas e Data */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {r.clientName}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-forest bg-forest/10 px-1.5 py-0.2 rounded-full shrink-0">
                      <ShieldCheck size={9} /> Verificado
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                    <span>
                      {new Date(r.createdAt).toLocaleDateString("pt-PT", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    {r.district && <span>· {r.district}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-0.5 shrink-0 bg-sun/10 px-2 py-0.5 rounded-full">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={10}
                      className={i < r.rating ? "fill-sun text-sun" : "text-muted-foreground/20"}
                    />
                  ))}
                </div>
              </div>

              {/* Tags de destaque */}
              {r.tags && r.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {r.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Comentário do cliente */}
              {r.comment && (
                <p className="text-xs text-muted-foreground leading-relaxed">"{r.comment}"</p>
              )}

              {/* Resposta do prestador (se houver) */}
              {r.reply && (
                <div className="mt-2 p-2.5 rounded-xl bg-muted/50 border-l-2 border-terracotta space-y-0.5">
                  <div className="flex items-center gap-1 text-[10px] font-medium text-foreground">
                    <CornerDownRight size={10} className="text-terracotta" />
                    <span>Resposta do profissional</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed pl-3.5">
                    {r.reply.text}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
