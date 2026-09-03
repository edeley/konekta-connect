import { useState } from "react";
import {
  AlertTriangle,
  X,
  ShieldAlert,
  Clock,
  Car,
  Wallet,
  CheckSquare,
  Square,
  CheckCircle2,
} from "lucide-react";
import { type Order, store } from "@/lib/store";
import { formatDb } from "@/lib/catalog";
import { toast } from "sonner";
import { getProvider } from "@/lib/konekta-data";

interface CancelServiceModalProps {
  open: boolean;
  onClose: () => void;
  order: Order;
  onCancelled?: () => void;
}

const CANCEL_REASONS = [
  "Mudança de planos ou imprevisto pessoal",
  "A avaria/problema foi resolvida antes da intervenção",
  "Atraso significativo ou prestador indisponível",
  "Necessidade de reagendar para outra data distante",
  "Outro motivo pessoal",
];

export function CancelServiceModal({ open, onClose, order, onCancelled }: CancelServiceModalProps) {
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0]);
  const [customNotes, setCustomNotes] = useState("");
  const [confirmedRisks, setConfirmedRisks] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!open) return null;

  const provider = getProvider(order.providerId);
  const isEnRouteOrInProgress = order.status === "a-caminho" || order.status === "em-execucao";

  const handleConfirmCancel = () => {
    if (!confirmedRisks) {
      toast.error("Por favor confirme a caixa de verificação dos riscos para continuar.");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Atualizar o estado do pedido para cancelado
      store.updateOrder(order.id, {
        status: "cancelado",
        notes: `${order.notes ? order.notes + " | " : ""}Cancelado pelo cliente. Motivo: ${selectedReason}${customNotes ? ` (${customNotes})` : ""}`,
      });

      // 2. Enviar mensagem informativa no chat com o prestador
      if (order.providerId) {
        store.sendMessage(
          order.providerId,
          `⚠️ **Aviso de Cancelamento de Serviço**\nO pedido ${order.id} (${order.service}) foi cancelado pelo cliente.\n• Motivo: ${selectedReason}${customNotes ? `\n• Detalhes: ${customNotes}` : ""}\n• Estado do reembolso: O saldo retido em custódia foi regularizado de acordo com a política de cancelamento da KONEKTA STP.`,
        );
      }

      toast.success("Serviço cancelado com sucesso.", {
        description:
          "O valor retido em custódia foi creditado na sua Carteira KONEKTA conforme os termos.",
      });

      if (onCancelled) {
        onCancelled();
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao cancelar o serviço. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-card text-card-foreground rounded-3xl p-5 sm:p-6 border border-border shadow-2xl space-y-5 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-destructive/10 text-destructive grid place-items-center shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                Cancelar Serviço / Pedido
              </h2>
              <p className="text-xs text-muted-foreground">
                Pedido #{order.id} · {order.service}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-muted text-muted-foreground hover:text-foreground grid place-items-center transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Resumo do Pedido */}
        <div className="p-3 rounded-2xl bg-muted/50 border border-border/80 flex items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">Prestador:</span>
            <strong className="text-foreground font-bold">
              {provider?.name || "Prestador Verificado"}
            </strong>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground block text-[11px]">Valor Retido:</span>
            <strong className="text-foreground font-black text-sm">{formatDb(order.total)}</strong>
          </div>
        </div>

        {/* Quadro de Avisos e Riscos */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-black text-amber-900 dark:text-amber-200">
            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Avisos e Riscos do Cancelamento em São Tomé e Príncipe</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-foreground flex items-start gap-2.5">
              <Clock size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950 dark:text-amber-200">
                  Perda da Reserva & Prioridade
                </p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  O horário reservado com o profissional será libertado imediatamente e não poderá
                  ser garantido em pedidos futuros.
                </p>
              </div>
            </div>

            {isEnRouteOrInProgress && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-foreground flex items-start gap-2.5">
                <Car size={16} className="text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-destructive">Taxa de Deslocação Aplicável</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Como o prestador já está a caminho ou no terreno, poderá ser debitada a taxa
                    mínima de deslocação (150 STN) para custear o combustível e tempo de transporte
                    no distrito.
                  </p>
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-foreground flex items-start gap-2.5">
              <Wallet
                size={16}
                className="text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5"
              />
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-200">
                  Reembolso em Custódia
                </p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  O valor em custódia retorna à sua Carteira Digital KONEKTA para uso imediato
                  noutros serviços ou levantamento bancário / agente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Motivo do Cancelamento */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground block">Motivo do cancelamento</label>
          <div className="space-y-1.5">
            {CANCEL_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedReason(r)}
                className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-medium transition flex items-center justify-between ${
                  selectedReason === r
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border bg-card text-foreground hover:bg-muted/60"
                }`}
              >
                <span>{r}</span>
                {selectedReason === r && (
                  <CheckCircle2 size={14} className="text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>

          <textarea
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            rows={2}
            placeholder="Observações adicionais (opcional)..."
            className="w-full mt-2 p-2.5 rounded-xl bg-muted text-xs text-foreground outline-none border border-border focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Checkbox de Confirmação dos Riscos */}
        <div
          onClick={() => setConfirmedRisks(!confirmedRisks)}
          className={`p-3 rounded-2xl border cursor-pointer transition flex items-start gap-3 select-none ${
            confirmedRisks
              ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20"
              : "bg-muted/40 border-border hover:bg-muted/70"
          }`}
        >
          <div className="mt-0.5 text-primary shrink-0">
            {confirmedRisks ? (
              <CheckSquare size={18} />
            ) : (
              <Square size={18} className="text-muted-foreground" />
            )}
          </div>
          <p className="text-xs font-semibold text-foreground leading-snug">
            Li e compreendi os riscos e regras de cancelamento da KONEKTA STP e confirmo que desejo
            cancelar o serviço assim mesmo.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:flex-1 py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition order-2 sm:order-1 cursor-pointer"
          >
            Manter Serviço Ativo
          </button>
          <button
            type="button"
            disabled={!confirmedRisks || isProcessing}
            onClick={handleConfirmCancel}
            className="w-full sm:flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2 shadow-xs cursor-pointer"
          >
            {isProcessing ? <span>A processar...</span> : <span>Confirmar Cancelamento</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
