import { useState } from "react";
import {
  ShieldCheck,
  Wallet,
  CreditCard,
  Banknote,
  Lock,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";
import { KCard } from "./kit";
import { Button } from "@/components/ui/button";
import { formatDb } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { OrderService } from "@/lib/order-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EscrowCheckoutCardProps {
  orderId: string;
  serviceTitle: string;
  providerName: string;
  providerAvatar?: string;
  serviceAmount: number;
  escrowFeePercent?: number; // e.g. 5% or 0%
  onCheckoutSuccess?: () => void;
  className?: string;
}

export function EscrowCheckoutCard({
  orderId,
  serviceTitle,
  providerName,
  providerAvatar,
  serviceAmount,
  escrowFeePercent = 5,
  onCheckoutSuccess,
  className,
}: EscrowCheckoutCardProps) {
  const balance = useStore((s) => s.balance);
  const [selectedMethod, setSelectedMethod] = useState<
    "pm_wallet" | "pm_dobrapay" | "pm_secure_cash"
  >("pm_wallet");
  const [isLoading, setIsLoading] = useState(false);

  const feeAmount = Math.round((serviceAmount * escrowFeePercent) / 100);
  const totalHeld = serviceAmount + feeAmount;
  const hasSufficientBalance = balance >= totalHeld;

  const handleAuthorizeHold = async () => {
    setIsLoading(true);
    try {
      const res = await OrderService.holdEscrow({
        orderId,
        paymentMethodId: selectedMethod,
        totalAmount: totalHeld,
        currency: "STN",
      });

      if (res.success) {
        toast.success("Pagamento retido com sucesso! Serviço confirmado com garantia KONEKTA.");
        onCheckoutSuccess?.();
      } else {
        toast.error(res.error || "Não foi possível autorizar a retenção em custódia.");
      }
    } catch {
      toast.error("Erro de ligação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KCard
      id={`escrow-checkout-card-${orderId}`}
      className={cn(
        "border-2 border-primary/30 bg-card shadow-soft space-y-4 p-5 rounded-3xl animate-scaleUp",
        className,
      )}
    >
      {/* CABEÇALHO COM BADGE DE CUSTÓDIA */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-primary">
            Checkout Seguro KONEKTA
          </span>
          <h3 className="text-base font-black text-foreground mt-0.5">Retenção de Pagamento</h3>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/10 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold border border-emerald-600/20">
          <ShieldCheck size={13} />
          <span>Garantia Escrow</span>
        </div>
      </div>

      {/* DETALHES DO PRESTADOR E SERVIÇO */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/60">
        <div className="size-11 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold text-sm overflow-hidden shrink-0">
          {providerAvatar ? (
            <img
              src={providerAvatar}
              alt={providerName}
              className="size-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            providerName.charAt(0)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-foreground truncate">{serviceTitle}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            Profissional: <span className="font-bold text-foreground">{providerName}</span>
          </p>
        </div>
      </div>

      {/* DISCRIMINAÇÃO TRANSPARENTE DOS VALORES (PRICE BREAKDOWN) */}
      <div className="space-y-2 rounded-2xl bg-muted/30 p-3.5 border border-border/50 text-xs">
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Valor do Serviço Acordado:</span>
          <span className="font-bold text-foreground font-mono">{formatDb(serviceAmount)}</span>
        </div>

        <div className="flex justify-between items-center text-muted-foreground">
          <span>Taxa de Proteção & Custódia KONEKTA:</span>
          <span className="font-bold text-emerald-800 dark:text-emerald-300 font-mono">
            {feeAmount > 0 ? `+${formatDb(feeAmount)}` : "Grátis (0 Db)"}
          </span>
        </div>

        <div className="border-t border-border/70 pt-2 flex justify-between items-center font-extrabold">
          <span className="text-foreground">Total a Reter em Custódia:</span>
          <span className="text-base text-primary font-black font-mono">{formatDb(totalHeld)}</span>
        </div>
      </div>

      {/* SELETOR DE MÉTODO DE PAGAMENTO */}
      <div className="space-y-2 pt-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Escolha o Método de Pagamento
        </p>

        <div className="grid grid-cols-1 gap-2">
          {/* CARTEIRA DIGITAL KONEKTA */}
          <button
            type="button"
            onClick={() => setSelectedMethod("pm_wallet")}
            className={cn(
              "w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition cursor-pointer",
              selectedMethod === "pm_wallet"
                ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                : "border-border bg-card hover:bg-muted/50",
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "size-9 rounded-xl grid place-items-center shrink-0",
                  selectedMethod === "pm_wallet"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Wallet size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Carteira KONEKTA STP</p>
                <p className="text-[11px] text-muted-foreground">
                  Saldo disponível:{" "}
                  <span
                    className={cn(
                      "font-bold font-mono",
                      hasSufficientBalance
                        ? "text-emerald-800 dark:text-emerald-300"
                        : "text-destructive",
                    )}
                  >
                    {formatDb(balance)}
                  </span>
                </p>
              </div>
            </div>
            {selectedMethod === "pm_wallet" && (
              <div className="size-5 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs">
                <Check size={12} />
              </div>
            )}
          </button>

          {/* DOBRA PAY / MOBILE MONEY */}
          <button
            type="button"
            onClick={() => setSelectedMethod("pm_dobrapay")}
            className={cn(
              "w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition cursor-pointer",
              selectedMethod === "pm_dobrapay"
                ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                : "border-border bg-card hover:bg-muted/50",
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "size-9 rounded-xl grid place-items-center shrink-0",
                  selectedMethod === "pm_dobrapay"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <CreditCard size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Dobra Pay / Mobile Money STP</p>
                <p className="text-[11px] text-muted-foreground">
                  Pagamento direto via telemóvel CST / Unitel STP
                </p>
              </div>
            </div>
            {selectedMethod === "pm_dobrapay" && (
              <div className="size-5 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs">
                <Check size={12} />
              </div>
            )}
          </button>

          {/* DINHEIRO SEGURO COM RETENÇÃO PRÉVIA */}
          <button
            type="button"
            onClick={() => setSelectedMethod("pm_secure_cash")}
            className={cn(
              "w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition cursor-pointer",
              selectedMethod === "pm_secure_cash"
                ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                : "border-border bg-card hover:bg-muted/50",
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "size-9 rounded-xl grid place-items-center shrink-0",
                  selectedMethod === "pm_secure_cash"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Banknote size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Dinheiro Físico com Reserva</p>
                <p className="text-[11px] text-muted-foreground">
                  Entrega no local apenas após validação de PIN
                </p>
              </div>
            </div>
            {selectedMethod === "pm_secure_cash" && (
              <div className="size-5 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs">
                <Check size={12} />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* AVISO DE CUSTÓDIA */}
      <div className="rounded-2xl bg-muted/40 p-3 flex items-start gap-2 text-[11px] text-muted-foreground">
        <Lock size={14} className="text-primary shrink-0 mt-0.5" />
        <span>
          O valor permanece <strong>congelado em custódia segura</strong>. O dinheiro não é entregue
          ao técnico até que você forneça o código PIN de conclusão.
        </span>
      </div>

      {/* BOTÃO DE CONFIRMAÇÃO DA RETENÇÃO */}
      <Button
        id={`btn-authorize-escrow-${orderId}`}
        onClick={handleAuthorizeHold}
        disabled={isLoading || (selectedMethod === "pm_wallet" && !hasSufficientBalance)}
        className="w-full h-13 rounded-2xl bg-primary text-primary-foreground font-black text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98"
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            <ShieldCheck size={17} />
            <span>Autorizar Retenção em Custódia ({formatDb(totalHeld)})</span>
          </>
        )}
      </Button>
    </KCard>
  );
}
