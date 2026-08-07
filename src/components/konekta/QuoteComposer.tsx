import { useMemo, useState } from "react";
import { Calculator, X } from "lucide-react";
import { quoteFromNet, formatDb } from "@/lib/escrow";
import { useStore } from "@/lib/store";

/**
 * Modal de criação de orçamento do prestador.
 * O prestador indica quanto quer RECEBER; a taxa da plataforma é somada
 * automaticamente ao valor cobrado ao cliente.
 */
export function QuoteComposer({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { net: number; description: string }) => void;
}) {
  const feePct = useStore((s) => s.config.commissionPct);
  const [net, setNet] = useState("");
  const [description, setDescription] = useState("");

  const breakdown = useMemo(() => quoteFromNet(Number(net) || 0, feePct), [net, feePct]);
  const valid = breakdown.net > 0 && description.trim().length >= 3;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Criar orçamento"
    >
      <div
        className="w-full max-w-md space-y-4 rounded-t-3xl bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Enviar orçamento</h3>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full bg-muted" aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Descrição do serviço</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={90}
            placeholder="Ex: Substituição de quadro elétrico"
            className="k-input mt-1 w-full"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Quanto quer receber (líquido)</span>
          <div className="relative mt-1">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={net}
              onChange={(e) => setNet(e.target.value)}
              placeholder="1000"
              className="k-input w-full pr-12"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              Db
            </span>
          </div>
        </label>

        <div className="grid grid-cols-3 gap-2">
          {[500, 1000, 2500].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setNet(String(v))}
              className="press rounded-xl bg-muted py-2 text-sm font-medium"
            >
              {v} Db
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-accent p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Calculator size={14} /> Calculadora automática
          </div>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Recebe (líquido)</dt>
              <dd className="font-medium">{formatDb(breakdown.net)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Taxa KONEKTA ({breakdown.feePct}%)</dt>
              <dd className="font-medium">{formatDb(breakdown.fee)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <dt className="font-semibold">Valor cobrado ao cliente</dt>
              <dd className="text-lg font-bold text-primary">{formatDb(breakdown.gross)}</dd>
            </div>
          </dl>
        </div>

        <button
          type="button"
          disabled={!valid}
          onClick={() => {
            onSubmit({ net: breakdown.net, description });
            setNet("");
            setDescription("");
            onClose();
          }}
          className="press min-h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          Enviar orçamento no chat
        </button>
      </div>
    </div>
  );
}
