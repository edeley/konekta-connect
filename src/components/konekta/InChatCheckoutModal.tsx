import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Wallet,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Package,
  Award,
  Clock,
  ArrowRight,
} from "lucide-react";
import { BottomSheet } from "@/components/konekta/kit";
import { formatDb } from "@/lib/pricing-engine";
import { store, useStore, type Quote } from "@/lib/store";
import { toast } from "sonner";

interface InChatCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  quote: Quote;
  providerName: string;
}

export function InChatCheckoutModal({
  open,
  onClose,
  quote,
  providerName,
}: InChatCheckoutModalProps) {
  const balance = useStore((s) => s.balance);
  const [selectedMethod, setSelectedMethod] = useState<"wallet" | "dobra24">("wallet");
  const [dobra24CardNumber, setDobra24CardNumber] = useState("9240 1234 5678 9012");
  const [processing, setProcessing] = useState(false);

  const isWalletInsufficient = balance < quote.gross;
  const neededTopup = isWalletInsufficient ? quote.gross - balance : 0;

  function handleConfirmPayment() {
    if (isWalletInsufficient) {
      toast.error("Saldo insuficiente na carteira", {
        description: `Faltam ${formatDb(neededTopup)}. Faça o carregamento na carteira e envie o comprovativo — o saldo entra assim que o administrador confirmar.`,
      });
      return;
    }

    setProcessing(true);

    setTimeout(() => {
      const success = store.payQuote(quote.providerId, quote.id);
      setProcessing(false);

      if (success) {
        toast.success("Pagamento Retido em Custódia!", {
          description: `O valor de ${formatDb(quote.gross)} está 100% protegido pela KONEKTA. O prestador foi notificado para iniciar os trabalhos.`,
        });
        onClose();
      } else {
        toast.error("Não foi possível processar o pagamento. Tente novamente.");
      }
    }, 600);
  }


  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Checkout Interno · Pagamento Protegido"
      description={`Aceite da proposta formal emitida por ${providerName}`}
    >
      <div className="space-y-4 pt-1 pb-4">
        {/* Resumo da Proposta */}
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Serviço Contratado
              </span>
              <p className="text-xs font-bold text-foreground mt-0.5">{quote.description}</p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
              Garantia 30 Dias
            </span>
          </div>

          {/* Detalhes de Prazo / Materiais */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap pt-1 border-t border-border/40">
            {quote.estimatedDuration && (
              <span className="flex items-center gap-1">
                <Clock size={12} className="text-primary" /> {quote.estimatedDuration}
              </span>
            )}
            {quote.warranty && (
              <span className="flex items-center gap-1">
                <Award size={12} className="text-primary" /> {quote.warranty}
              </span>
            )}
            {quote.materialsCost && quote.materialsCost > 0 && (
              <span className="flex items-center gap-1">
                <Package size={12} className="text-primary" /> Materiais:{" "}
                {formatDb(quote.materialsCost)}
              </span>
            )}
          </div>

          {/* Valores Totais */}
          <div className="pt-2 border-t border-border flex items-baseline justify-between">
            <div>
              <span className="text-xs font-bold text-foreground">Total a Reter em Custódia:</span>
              <p className="text-[10px] text-muted-foreground">
                Taxa KONEKTA ({quote.feePct}%) já incluída no valor
              </p>
            </div>
            <span className="text-xl font-black text-primary font-mono">
              {formatDb(quote.gross)}
            </span>
          </div>
        </div>

        {/* Garantia de Escrow KONEKTA */}
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 text-xs flex items-start gap-2.5">
          <ShieldCheck
            size={16}
            className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
          />
          <div className="space-y-0.5 leading-relaxed text-[11px]">
            <p className="font-bold">Como funciona a Custódia KONEKTA (Escrow):</p>
            <p className="text-foreground/80">
              O seu dinheiro não vai direto para o prestador. Ele fica 100% seguro na plataforma e
              só será libertado após você confirmar que o serviço foi finalizado com satisfação.
            </p>
          </div>
        </div>

        {/* Seleção do Método de Pagamento */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground block">
            Forma de Pagamento / Cobrança:
          </label>

          <div className="grid grid-cols-1 gap-2">
            {/* Saldo da Carteira */}
            <button
              type="button"
              onClick={() => setSelectedMethod("wallet")}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                selectedMethod === "wallet"
                  ? "bg-primary/10 border-primary shadow-2xs ring-1 ring-primary"
                  : "bg-card border-border hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-primary/15 text-primary grid place-items-center shrink-0">
                  <Wallet size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Saldo KONEKTA</p>
                  <p className="text-[11px] text-muted-foreground">
                    Disponível: <strong className="text-foreground">{formatDb(balance)}</strong>
                  </p>
                </div>
              </div>

              {isWalletInsufficient ? (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                  Falta {formatDb(neededTopup)}
                </span>
              ) : (
                <span className="size-5 rounded-full bg-primary text-white grid place-items-center text-[10px] font-bold">
                  ✓
                </span>
              )}
            </button>

            {/* Cartão Dobra 24 STP */}
            <button
              type="button"
              onClick={() => setSelectedMethod("dobra24")}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                selectedMethod === "dobra24"
                  ? "bg-primary/10 border-primary shadow-2xs ring-1 ring-primary"
                  : "bg-card border-border hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 grid place-items-center shrink-0">
                  <CreditCard size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Dobra 24 · Cartão Multicaixa</p>
                  <p className="text-[11px] text-muted-foreground">
                    Pagamento direto sem sair da conversa
                  </p>
                </div>
              </div>

              {selectedMethod === "dobra24" && (
                <span className="size-5 rounded-full bg-primary text-white grid place-items-center text-[10px] font-bold">
                  ✓
                </span>
              )}
            </button>
          </div>

          {selectedMethod === "dobra24" && (
            <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2 animate-in fade-in">
              <label className="text-[11px] font-semibold text-muted-foreground block">
                Número do Cartão Dobra 24 (São Tomé e Príncipe):
              </label>
              <input
                type="text"
                value={dobra24CardNumber}
                onChange={(e) => setDobra24CardNumber(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-card border border-border text-xs font-mono font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="9240 0000 0000 0000"
              />
            </div>
          )}
        </div>

        {/* Botão de Finalização */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={processing}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            {processing ? (
              <>
                <span className="size-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Processando Retenção em Custódia...</span>
              </>
            ) : (
              <>
                <Lock size={15} />
                <span>
                  {isWalletInsufficient && selectedMethod === "wallet"
                    ? `Carregar ${formatDb(neededTopup)} & Pagar Agora`
                    : `Confirmar & Pagar ${formatDb(quote.gross)}`}
                </span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
