import { useState } from "react";
import { Star, ThumbsUp, ThumbsDown, CheckCircle2, MessageSquare, Tag } from "lucide-react";
import { BottomSheet } from "@/components/konekta/kit";
import { store, useStore } from "@/lib/store";
import { validateFormSafety } from "@/lib/escrow";
import { toast } from "sonner";

const QUICK_TAGS = [
  "Pontualidade",
  "Trabalho Limpo",
  "Boa Comunicação",
  "Muito Educado",
  "Preço Justo",
  "Rigor Técnico",
  "Rápido e Eficiente",
  "Excelente Trabalho",
];

const RATING_DESCRIPTIONS: Record<number, { label: string; tone: string }> = {
  1: { label: "Muito Fraco — Tive problemas", tone: "text-destructive" },
  2: { label: "Razoável — Precisa de melhorias", tone: "text-amber-500" },
  3: { label: "Bom — Cumpriu o acordado", tone: "text-sun" },
  4: { label: "Muito Bom — Grande profissional", tone: "text-forest" },
  5: { label: "Excelente / Impecável! — Recomendo a 100%", tone: "text-forest font-semibold" },
};

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
  providerImage?: string;
  providerCategory?: string;
  orderId?: string;
  serviceName?: string;
  initialRating?: number;
  initialComment?: string;
  onSuccess?: () => void;
}

export function ReviewModal({
  open,
  onClose,
  providerId,
  providerName,
  providerImage,
  providerCategory,
  orderId,
  serviceName,
  initialRating = 5,
  initialComment = "",
  onSuccess,
}: ReviewModalProps) {
  const user = useStore((s) => s.user);
  const [stars, setStars] = useState<number>(initialRating);
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);
  const [comment, setComment] = useState(initialComment);
  const [selectedTags, setSelectedTags] = useState<string[]>(["Pontualidade", "Trabalho Limpo"]);
  const [recommended, setRecommended] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeRating = hoveredStars ?? stars;

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stars < 1) {
      toast.error("Selecione pelo menos 1 estrela para avaliar.");
      return;
    }

    const safety = validateFormSafety({
      Comentário: comment,
    });

    if (!safety.isValid) {
      toast.error(safety.reason || "Conteúdo não permitido no comentário.");
      return;
    }

    setIsSubmitting(true);

    try {
      store.addReview({
        providerId,
        orderId,
        rating: stars,
        comment: comment.trim(),
        tags: selectedTags,
        recommended,
        serviceName: serviceName || "Serviço Prestado",
        district: user?.district,
      });

      toast.success("Avaliação enviada com sucesso!", {
        description: "Obrigado por ajudar a comunidade KONEKTA!",
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch {
      toast.error("Erro ao enviar avaliação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Avaliar Prestador"
      description="A sua opinião sincera ajuda a valorizar os bons profissionais em São Tomé e Príncipe."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 pb-1">
        {/* Cartão do prestador */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-card ring-1 ring-border">
          {providerImage ? (
            <img
              src={providerImage}
              alt={providerName}
              className="size-12 rounded-xl object-cover ring-1 ring-border shrink-0"
            />
          ) : (
            <div className="size-12 rounded-xl bg-terracotta/10 text-terracotta font-bold grid place-items-center shrink-0">
              {providerName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm text-foreground truncate">{providerName}</h4>
            <p className="text-xs text-muted-foreground truncate">
              {providerCategory || "Prestador de Serviços"}
            </p>
            {serviceName && (
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-ocean/10 text-ocean text-[10px] font-medium truncate max-w-full">
                {serviceName}
              </span>
            )}
          </div>
        </div>

        {/* Seletor de Estrelas */}
        <div className="text-center space-y-1.5 py-1">
          <label className="text-xs font-semibold text-muted-foreground block">
            Classificação geral
          </label>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const filled = n <= activeRating;
              return (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} estrelas`}
                  onClick={() => setStars(n)}
                  onMouseEnter={() => setHoveredStars(n)}
                  onMouseLeave={() => setHoveredStars(null)}
                  className="p-1 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                >
                  <Star
                    size={32}
                    className={`transition-colors ${
                      filled
                        ? "fill-sun text-sun"
                        : "text-muted-foreground/30 hover:text-muted-foreground/50"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          {RATING_DESCRIPTIONS[activeRating] && (
            <p className={`text-xs ${RATING_DESCRIPTIONS[activeRating].tone}`}>
              {RATING_DESCRIPTIONS[activeRating].label}
            </p>
          )}
        </div>

        {/* Tags de Destaque */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Tag size={12} /> Pontos fortes do serviço
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAGS.map((tag) => {
              const selected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    selected
                      ? "bg-terracotta text-white font-medium shadow-2xs"
                      : "bg-card ring-1 ring-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Caixa de Comentário */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <MessageSquare size={12} /> Comentário sincero
            </label>
            <span className="text-[10px] text-muted-foreground">{comment.length} caracteres</span>
          </div>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Conte como correu o serviço (ex: pontualidade, qualidade da reparação, educação)..."
            className="w-full rounded-2xl bg-card ring-1 ring-border p-3.5 text-xs outline-none focus:ring-2 focus:ring-terracotta/40 placeholder:text-muted-foreground/60 transition-all"
          />
          {(() => {
            const check = validateFormSafety({ Comentário: comment });
            if (!check.isValid) {
              return (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive flex items-start gap-1.5 animate-fadeIn">
                  <span className="text-xs shrink-0">🛡️</span>
                  <span className="text-[11px] leading-tight">{check.reason}</span>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Recomendação */}
        <div className="p-3 rounded-2xl bg-card ring-1 ring-border flex items-center justify-between gap-3">
          <span className="text-xs text-foreground">Recomenda este profissional?</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setRecommended(true)}
              className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                recommended
                  ? "bg-forest text-white"
                  : "bg-card ring-1 ring-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <ThumbsUp size={12} /> Sim
            </button>
            <button
              type="button"
              onClick={() => setRecommended(false)}
              className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                !recommended
                  ? "bg-destructive text-white"
                  : "bg-card ring-1 ring-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <ThumbsDown size={12} /> Não
            </button>
          </div>
        </div>

        {/* Botão de Enviar */}
        <div className="pt-1 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-xl ring-1 ring-border bg-card font-medium text-xs text-foreground hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 flex-2 rounded-xl font-medium text-xs bg-terracotta text-white flex items-center justify-center gap-1.5 shadow-2xs hover:bg-terracotta/90 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 size={15} />
            {isSubmitting ? "A guardar..." : "Publicar Avaliação"}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
