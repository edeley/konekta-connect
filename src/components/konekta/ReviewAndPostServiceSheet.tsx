import { useState } from "react";
import { Star, CheckCircle2, ThumbsUp, Wallet, ShieldCheck, MessageCircle } from "lucide-react";
import { BottomSheet } from "./kit";
import { Button } from "@/components/ui/button";
import { formatDb } from "@/lib/catalog";
import { store } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReviewAndPostServiceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  providerId: string;
  providerName: string;
  serviceTitle: string;
  totalAmount: number;
  onReviewSubmitted?: () => void;
}

const CRITERIA_CHIPS = [
  "Pontualidade",
  "Rigor Técnico",
  "Trabalho Limpo",
  "Excelente Comunicação",
  "Preço Justo",
  "Transparência",
  "Material de Qualidade",
  "Simpatia & Respeito",
];

export function ReviewAndPostServiceSheet({
  isOpen,
  onClose,
  orderId,
  providerId,
  providerName,
  serviceTitle,
  totalAmount,
  onReviewSubmitted,
}: ReviewAndPostServiceSheetProps) {
  const [stars, setStars] = useState(5);
  const [hoverStars, setHoverStars] = useState(0);
  const [selectedChips, setSelectedChips] = useState<string[]>([
    "Pontualidade",
    "Rigor Técnico",
    "Trabalho Limpo",
  ]);
  const [comment, setComment] = useState("");
  const [recommended, setRecommended] = useState(true);

  const toggleChip = (chip: string) => {
    if (selectedChips.includes(chip)) {
      setSelectedChips(selectedChips.filter((c) => c !== chip));
    } else {
      setSelectedChips([...selectedChips, chip]);
    }
  };

  const handleSubmit = () => {
    store.rateOrder(
      orderId,
      stars,
      comment.trim() || "Serviço concluído com sucesso e qualidade.",
      selectedChips,
      recommended,
    );

    toast.success("Avaliação enviada com sucesso! Obrigado por ajudar a comunidade KONEKTA.");
    onReviewSubmitted?.();
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div id={`review-post-service-${orderId}`} className="space-y-4 max-w-lg mx-auto">
        {/* CABEÇALHO COM BANNER DE SUCESSO */}
        <div className="text-center space-y-1">
          <div className="size-14 rounded-3xl bg-emerald-600 text-white grid place-items-center mx-auto shadow-md">
            <CheckCircle2 size={28} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            Serviço Finalizado & Liquidado
          </span>
          <h3 className="text-lg font-black text-foreground">Como correu o atendimento?</h3>
          <p className="text-xs text-muted-foreground">
            Avalie a sua experiência com <strong className="text-foreground">{providerName}</strong>{" "}
            em <span className="font-semibold">{serviceTitle}</span>.
          </p>
        </div>

        {/* CLASSIFICAÇÃO DE 1 A 5 ESTRELAS */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((starValue) => {
            const isFilled = (hoverStars || stars) >= starValue;
            return (
              <button
                key={starValue}
                type="button"
                onMouseEnter={() => setHoverStars(starValue)}
                onMouseLeave={() => setHoverStars(0)}
                onClick={() => setStars(starValue)}
                className="size-11 sm:size-12 rounded-2xl grid place-items-center transition active:scale-90 cursor-pointer"
              >
                <Star
                  size={28}
                  className={cn(
                    "transition-colors",
                    isFilled ? "fill-amber-400 text-amber-400" : "text-border hover:text-amber-200",
                  )}
                />
              </button>
            );
          })}
        </div>

        {/* CRITÉRIOS DE AVALIAÇÃO (CHIPS) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground block">
            O que mais se destacou positivamente?
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CRITERIA_CHIPS.map((chip) => {
              const active = selectedChips.includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleChip(chip)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer",
                    active
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted border border-border",
                  )}
                >
                  <ThumbsUp size={12} />
                  <span>{chip}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* COMENTÁRIO OPCIONAL */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground block">Comentário Público:</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Descreva a pontualidade, qualidade do acabamento e recomendações para futuros clientes..."
            className="w-full rounded-2xl bg-muted/40 border border-border p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition"
          />
        </div>

        {/* RECOMENDAÇÃO */}
        <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-muted/30 border border-border/70 cursor-pointer">
          <input
            type="checkbox"
            checked={recommended}
            onChange={(e) => setRecommended(e.target.checked)}
            className="size-4 rounded accent-primary"
          />
          <div className="text-xs">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <ThumbsUp size={14} className="text-emerald-800 dark:text-emerald-300" />
              <span>Recomendo este profissional a outros são-tomenses</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Aumenta a pontuação de confiança na rede KONEKTA.
            </p>
          </div>
        </label>

        {/* BOTÃO DE SUBMISSÃO */}
        <Button
          id={`btn-submit-review-${orderId}`}
          onClick={handleSubmit}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black text-xs flex items-center justify-center gap-2 shadow-sm transition"
        >
          <CheckCircle2 size={16} />
          <span>Publicar Avaliação Oficial ({stars} Estrelas)</span>
        </Button>
      </div>
    </BottomSheet>
  );
}
