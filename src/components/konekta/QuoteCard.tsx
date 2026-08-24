import {
  CheckCircle2,
  Lock,
  ShieldCheck,
  Wallet,
  Star,
  Layers,
  Car,
  Flame,
  Clock,
  Award,
  ChevronRight,
  Package,
} from "lucide-react";
import { formatDb } from "@/lib/pricing-engine";
import { BILLING_MODELS } from "@/lib/pricing-engine";
import type { Quote } from "@/lib/store";
import { cn } from "@/lib/utils";

const statusMeta: Record<Quote["status"], { label: string; className: string }> = {
  pendente: { label: "Aguarda pagamento", className: "bg-warning/15 text-warning" },
  pago: { label: "Pago · retido em escrow", className: "bg-primary/10 text-primary" },
  concluido: { label: "Concluído · valor libertado", className: "bg-success/15 text-success" },
  recusado: { label: "Recusado", className: "bg-destructive/10 text-destructive" },
};

/** Card interativo e rico de orçamento dentro do chat (escrow e modelos de cobrança). */
export function QuoteCard({
  quote,
  isClient,
  balance,
  onPay,
  onComplete,
  onDecline,
  onReview,
  onReleaseMilestone,
}: {
  quote: Quote;
  isClient: boolean;
  balance: number;
  onPay: () => void;
  onComplete: () => void;
  onDecline: () => void;
  onReview?: () => void;
  onReleaseMilestone?: (milestoneId: string) => void;
}) {
  const meta = statusMeta[quote.status];
  const insufficient = balance < quote.gross;
  const modelMeta = quote.billingModel ? BILLING_MODELS[quote.billingModel] : null;

  return (
    <div className="mx-auto w-full max-w-[21rem] rounded-3xl bg-card p-4 shadow-soft ring-1 ring-border space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-primary" />
          Orçamento Oficial
        </span>
        <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold", meta.className)}>
          {meta.label}
        </span>
      </div>

      {/* Descrição Principal */}
      <div>
        <p className="text-sm font-bold text-foreground leading-snug">{quote.description}</p>
        {modelMeta && (
          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
              {modelMeta.label}
            </span>
            {quote.quantity && quote.unitPrice && (
              <span className="text-[11px] font-medium text-muted-foreground">
                {quote.quantity} {quote.unitLabel || modelMeta.unitSuffix} ×{" "}
                {formatDb(quote.unitPrice)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Discriminação de Componentes (Materiais, Deslocação, Extras, Urgência) */}
      {(Boolean(quote.displacementFee) ||
        quote.materialsMode === "prestador" ||
        quote.materialsMode === "cliente" ||
        Boolean(quote.urgencyFee) ||
        (quote.extras && quote.extras.length > 0)) && (
        <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-1.5">
          {quote.materialsMode === "prestador" &&
            quote.materialsCost &&
            quote.materialsCost > 0 && (
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Package size={12} /> Materiais (Prestador):
                </span>
                <span className="font-semibold text-foreground">
                  {formatDb(quote.materialsCost)}
                </span>
              </div>
            )}

          {quote.materialsMode === "cliente" && (
            <div className="flex justify-between items-center text-muted-foreground text-[11px]">
              <span>Materiais:</span>
              <span className="italic">Fornecidos pelo cliente</span>
            </div>
          )}

          {Boolean(quote.displacementFee && quote.displacementFee > 0) && (
            <div className="flex justify-between items-center text-muted-foreground">
              <span className="flex items-center gap-1">
                <Car size={12} /> Deslocação:
              </span>
              <span className="font-semibold text-foreground">
                +{formatDb(quote.displacementFee!)}
              </span>
            </div>
          )}

          {Boolean(quote.urgencyFee && quote.urgencyFee > 0) && (
            <div className="flex justify-between items-center text-warning">
              <span className="flex items-center gap-1">
                <Flame size={12} /> Urgência ({quote.urgencyReason || "Rápido"}):
              </span>
              <span className="font-semibold">+{formatDb(quote.urgencyFee!)}</span>
            </div>
          )}

          {quote.extras && quote.extras.length > 0 && (
            <div className="pt-1 border-t border-border/40 space-y-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                Adicionais incluídos:
              </span>
              {quote.extras.map((ex) => (
                <div key={ex.id} className="flex justify-between text-[11px] text-muted-foreground">
                  <span>+ {ex.name}</span>
                  <span className="font-medium">{formatDb(ex.price)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Marcos de Pagamento em caso de Projeto */}
      {quote.milestones && quote.milestones.length > 0 && (
        <div className="p-3 rounded-2xl bg-surface border border-border space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <span className="flex items-center gap-1.5">
              <Layers size={13} className="text-primary" />
              Etapas do Projeto ({quote.milestones.length})
            </span>
          </div>
          <div className="space-y-1.5">
            {quote.milestones.map((m, idx) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2 rounded-xl bg-card border border-border text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-5 rounded-full bg-muted text-[10px] font-bold grid place-items-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-medium truncate">{m.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold">{formatDb(m.amount)}</span>
                  {m.status === "libertado" ? (
                    <span className="px-1.5 py-0.5 rounded bg-success/15 text-success text-[10px] font-bold">
                      Pago
                    </span>
                  ) : isClient && quote.status === "pago" && onReleaseMilestone ? (
                    <button
                      type="button"
                      onClick={() => onReleaseMilestone(m.id)}
                      className="px-2 py-0.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold hover:bg-primary/90"
                    >
                      Libertar
                    </button>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">
                      Pendente
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Garantia & Prazo */}
      {(quote.warranty || quote.estimatedDuration) && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
          {quote.warranty && (
            <span className="flex items-center gap-1">
              <Award size={12} className="text-primary" /> {quote.warranty}
            </span>
          )}
          {quote.estimatedDuration && (
            <span className="flex items-center gap-1">
              <Clock size={12} /> {quote.estimatedDuration}
            </span>
          )}
        </div>
      )}

      {/* Valor Total Destacado */}
      <div className="pt-2 border-t border-border space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Valor Total Cobrado:</span>
          <p className="text-2xl font-black tracking-tight text-sky-700 dark:text-sky-400 font-mono">
            {formatDb(quote.gross)}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Taxa KONEKTA ({quote.feePct}%):</span>
          <span className="font-semibold text-muted-foreground">-{formatDb(quote.fee)}</span>
        </div>

        <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/40 px-3 py-2 rounded-xl">
          <span>
            {isClient ? "Valor Entregue ao Prestador:" : "Você Recebe (Líquido na Carteira):"}
          </span>
          <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono">
            {formatDb(quote.net)}
          </span>
        </div>
      </div>

      {/* Banner de Proteção Escrow */}
      <div className="flex items-start gap-2 rounded-2xl bg-primary/5 p-3 text-xs text-muted-foreground border border-primary/10">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" />
        <span>
          O pagamento fica retido com 100% de garantia pela KONEKTA e só é libertado quando o
          serviço for concluído.
        </span>
      </div>

      {/* Ações para o Cliente */}
      {isClient && quote.status === "pendente" && (
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onPay}
            disabled={insufficient}
            className="press flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-success text-sm font-bold text-primary-foreground disabled:opacity-50 shadow-md"
          >
            <Wallet size={16} /> Pagar e Reservar ({formatDb(quote.gross)})
          </button>
          {insufficient && (
            <p className="text-center text-[11px] text-destructive font-medium">
              Saldo insuficiente ({formatDb(balance)}) — carregue a carteira para reservar.
            </p>
          )}
          <button
            type="button"
            onClick={onDecline}
            className="press min-h-9 w-full rounded-2xl text-xs font-semibold text-muted-foreground hover:bg-muted/50"
          >
            Recusar proposta
          </button>
        </div>
      )}

      {isClient && quote.status === "pago" && (
        <button
          type="button"
          onClick={onComplete}
          className="press flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-md"
        >
          <CheckCircle2 size={16} /> Confirmar Serviço Concluído
        </button>
      )}

      {quote.status === "concluido" && (
        <div className="space-y-2 pt-1">
          <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-success bg-success/10 py-2 rounded-xl">
            <CheckCircle2 size={14} /> {formatDb(quote.net)} libertados para o prestador
          </p>
          {isClient && onReview && (
            <button
              type="button"
              onClick={onReview}
              className="press flex min-h-10 w-full items-center justify-center gap-1.5 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-xs hover:bg-amber-500/25 transition-colors"
            >
              <Star size={14} className="fill-amber-500 text-amber-500" /> Avaliar & Deixar
              Comentário
            </button>
          )}
        </div>
      )}

      {quote.status === "pendente" && !isClient && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground bg-muted/40 py-2 rounded-xl">
          <Lock size={12} /> Contactos desbloqueiam após o cliente efetuar o pagamento
        </p>
      )}
    </div>
  );
}
