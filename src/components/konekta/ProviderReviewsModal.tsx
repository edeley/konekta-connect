import React, { useState, useMemo } from "react";
import {
  X,
  Star,
  ShieldCheck,
  ThumbsUp,
  Award,
  Sparkles,
  MessageSquare,
  Share2,
  CheckCircle2,
  Calendar,
  MapPin,
  CornerDownRight,
  Send,
} from "lucide-react";
import { useStore, seedReviews, type ProviderReview } from "@/lib/store";
import { toast } from "sonner";

interface ProviderReviewsModalProps {
  open: boolean;
  onClose: () => void;
  providerId?: string;
  providerName?: string;
}

export function ProviderReviewsModal({
  open,
  onClose,
  providerId = "edmilson-varela",
  providerName = "Edmilson Varela",
}: ProviderReviewsModalProps) {
  const allReviews = useStore((s) => s.reviews);
  const reviewsList = allReviews.length > 0 ? allReviews : seedReviews;

  const [starFilter, setStarFilter] = useState<number | "all">("all");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const providerReviews = useMemo(() => {
    const list = reviewsList.filter((r) => r.providerId === providerId);
    return list.length > 0 ? list : seedReviews;
  }, [reviewsList, providerId]);

  const stats = useMemo(() => {
    const total = providerReviews.length;
    if (total === 0) {
      return {
        avg: 4.9,
        total: 12,
        recommendPct: 98,
        counts: { 5: 11, 4: 1, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
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

  if (!open) return null;

  const handleSendReply = (reviewId: string) => {
    if (!replyText.trim()) return;
    toast.success("Resposta enviada com sucesso ao cliente!");
    setReplyingToId(null);
    setReplyText("");
  };

  const handleShareProfile = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Link do seu perfil e avaliações copiado!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 grid place-items-center">
              <Star size={20} className="fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Reputação & Avaliações</h2>
              <p className="text-xs text-muted-foreground">
                Classificação dos clientes KONEKTA em São Tomé
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground grid place-items-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Card de Resumo das Notas */}
          <div className="p-4 rounded-2xl bg-linear-to-br from-amber-50/80 to-emerald-50/50 dark:from-amber-950/20 dark:to-emerald-950/20 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-black text-foreground">{stats.avg}</p>
                <div className="flex items-center justify-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      className={
                        s <= Math.round(stats.avg)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }
                    />
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                  {stats.total} avaliações
                </p>
              </div>

              <div className="h-12 w-px bg-border/80 hidden sm:block" />

              <div className="space-y-1 text-xs text-foreground/80">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                  <ThumbsUp size={13} className="text-emerald-600" />
                  <span>{stats.recommendPct}% recomendam este serviço</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                  <ShieldCheck size={13} className="text-sky-500" />
                  <span>Avaliações 100% verificadas por pagamento</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleShareProfile}
              className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted flex items-center gap-1.5 shadow-2xs transition"
            >
              <Share2 size={13} />
              Partilhar
            </button>
          </div>

          {/* Filtro por Estrelas */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setStarFilter("all")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 ${
                starFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Todas ({stats.total})
            </button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setStarFilter(rating)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition shrink-0 ${
                  starFilter === rating
                    ? "bg-amber-500 text-white shadow-2xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{rating}</span>
                <Star size={11} className="fill-current" />
                <span className="text-[10px] opacity-80">({stats.counts[rating] || 0})</span>
              </button>
            ))}
          </div>

          {/* Lista de Avaliações */}
          <div className="space-y-3 pt-1">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                Nenhuma avaliação encontrada com esta pontuação.
              </div>
            ) : (
              filteredReviews.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-full bg-emerald-500/10 text-emerald-700 font-bold text-xs grid place-items-center border border-emerald-500/20">
                        {r.clientName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-foreground">{r.clientName}</p>
                          <CheckCircle2 size={12} className="text-emerald-600" />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {r.serviceName || "Serviço Residencial"} · {r.district || "São Tomé"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          className={
                            s <= r.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-foreground/90 leading-relaxed">{r.comment}</p>

                  {r.tags && r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {r.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-semibold text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Resposta do Prestador */}
                  {r.reply ? (
                    <div className="mt-2 p-2.5 rounded-xl bg-muted/60 border border-border/60 text-xs space-y-1">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-foreground">
                        <CornerDownRight size={12} className="text-primary" />
                        <span>Sua Resposta:</span>
                      </div>
                      <p className="text-muted-foreground pl-4 text-[11px]">{r.reply.text}</p>
                    </div>
                  ) : replyingToId === r.id ? (
                    <div className="mt-2 pt-2 border-t border-border/60 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escreva um agradecimento ao cliente..."
                        rows={2}
                        className="w-full p-2 text-xs rounded-xl bg-muted border border-border focus:outline-hidden focus:ring-1 focus:ring-primary"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyingToId(null)}
                          className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendReply(r.id)}
                          className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1"
                        >
                          <Send size={11} />
                          Responder
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToId(r.id);
                          setReplyText("");
                        }}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <MessageSquare size={12} />
                        Agradecer / Responder
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Award size={14} className="text-amber-500" />
            <span>Mantenha pontualidade e bom atendimento para subir de nível</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
