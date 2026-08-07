import { CheckCircle2, Lock, ShieldCheck, Wallet } from "lucide-react";
import { formatDb } from "@/lib/escrow";
import type { Quote } from "@/lib/store";
import { cn } from "@/lib/utils";

const statusMeta: Record<Quote["status"], { label: string; className: string }> = {
  pendente: { label: "Aguarda pagamento", className: "bg-warning/15 text-warning" },
  pago: { label: "Pago · retido em escrow", className: "bg-primary/10 text-primary" },
  concluido: { label: "Concluído · valor libertado", className: "bg-success/15 text-success" },
  recusado: { label: "Recusado", className: "bg-destructive/10 text-destructive" },
};

/** Card interativo de orçamento dentro do chat (escrow). */
export function QuoteCard({
  quote,
  isClient,
  balance,
  onPay,
  onComplete,
  onDecline,
}: {
  quote: Quote;
  isClient: boolean;
  balance: number;
  onPay: () => void;
  onComplete: () => void;
  onDecline: () => void;
}) {
  const meta = statusMeta[quote.status];
  const insufficient = balance < quote.gross;

  return (
    <div className="mx-auto w-full max-w-[19rem] rounded-3xl bg-card p-4 shadow-soft ring-1 ring-border">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Orçamento oficial
        </span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", meta.className)}>
          {meta.label}
        </span>
      </div>

      <p className="mt-2 text-sm font-medium">{quote.description}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight">{formatDb(quote.gross)}</p>

      {!isClient && (
        <p className="mt-1 text-xs text-muted-foreground">
          Recebe {formatDb(quote.net)} · taxa {quote.feePct}% ({formatDb(quote.fee)})
        </p>
      )}

      <div className="mt-3 flex items-start gap-2 rounded-2xl bg-accent p-3 text-xs text-muted-foreground">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-primary" />
        <span>
          O valor fica retido pela KONEKTA e só é libertado quando confirmar que o serviço foi
          concluído.
        </span>
      </div>

      {isClient && quote.status === "pendente" && (
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={onPay}
            disabled={insufficient}
            className="press flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-success text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            <Wallet size={16} /> Pagar e reservar
          </button>
          {insufficient && (
            <p className="text-center text-[11px] text-destructive">
              Saldo insuficiente — carregue a carteira para reservar.
            </p>
          )}
          <button
            type="button"
            onClick={onDecline}
            className="press min-h-10 w-full rounded-2xl text-xs font-semibold text-muted-foreground"
          >
            Recusar orçamento
          </button>
        </div>
      )}

      {isClient && quote.status === "pago" && (
        <button
          type="button"
          onClick={onComplete}
          className="press mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground"
        >
          <CheckCircle2 size={16} /> Serviço finalizado
        </button>
      )}

      {quote.status === "concluido" && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-success">
          <CheckCircle2 size={14} /> {formatDb(quote.net)} libertados para o prestador
        </p>
      )}

      {quote.status === "pendente" && !isClient && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock size={12} /> Morada e telefone do cliente desbloqueiam após o pagamento
        </p>
      )}
    </div>
  );
}
