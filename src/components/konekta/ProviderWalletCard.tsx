import { useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  Lock,
  Clock,
  CheckCircle2,
  Building2,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  X,
  RefreshCw,
} from "lucide-react";
import { formatDb } from "@/lib/pricing-engine";
import { store, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProviderWalletCardProps {
  availableBalance?: number;
  pendingEscrow?: number;
  currency?: "STD" | "Db";
  className?: string;
}

export function ProviderWalletCard({
  availableBalance = 450.0,
  pendingEscrow = 120.0,
  currency = "STD",
  className,
}: ProviderWalletCardProps) {
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<"dobrapay" | "bancaria" | "cst_money">(
    "dobrapay",
  );
  const [payoutAmount, setPayoutAmount] = useState(String(availableBalance));
  const [accountNumber, setAccountNumber] = useState("+239 991 2345");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRequestPayout = () => {
    const amount = Number(payoutAmount);
    if (!amount || amount <= 0 || amount > availableBalance) {
      toast.error("Insira um montante válido dentro do saldo disponível.");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPayoutOpen(false);
      toast.success(
        `Pedido de levantamento de ${formatDb(amount)} enviado! Processamento em até 2 horas via ${
          payoutMethod === "dobrapay"
            ? "DobraPay"
            : payoutMethod === "cst_money"
              ? "CST Mobile Money"
              : "Transferência Bancária"
        }.`,
      );
    }, 900);
  };

  return (
    <>
      <div
        className={cn(
          "rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/30 p-5 space-y-4 shadow-2xs",
          className,
        )}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Wallet size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Carteira & Finanças
              </h3>
              <p className="text-sm font-extrabold text-foreground">Gestão de Ganhos KONEKTA</p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1">
            <ShieldCheck size={12} /> Custódia Ativa
          </span>
        </div>

        {/* VALORES DE SALDO */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* SALDO DISPONÍVEL */}
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground">Disponível p/ Saque</span>
            <p className="text-xl font-black text-primary tracking-tight">
              {formatDb(availableBalance)}
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
              <CheckCircle2 size={10} /> Livre de bloqueios
            </span>
          </div>

          {/* SALDO EM CUSTÓDIA */}
          <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/80 space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
              <Lock size={11} className="text-amber-500" /> Retido em Custódia
            </span>
            <p className="text-xl font-black text-foreground tracking-tight">
              {formatDb(pendingEscrow)}
            </p>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
              <Clock size={10} /> Aguardando PIN de conclusão
            </span>
          </div>
        </div>

        {/* AÇÕES E NOTAS */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-3">
          <div className="text-[11px] text-muted-foreground">
            Taxa de serviço KONEKTA de 15% já deduzida nos valores líquidos.
          </div>

          <button
            type="button"
            onClick={() => setIsPayoutOpen(true)}
            className="px-4 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-primary/90 transition cursor-pointer shrink-0"
          >
            <ArrowUpRight size={15} />
            <span>Solicitar Saque</span>
          </button>
        </div>
      </div>

      {/* MODAL DE SOLICITAÇÃO DE SAQUE / PAYOUT */}
      {isPayoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ArrowUpRight size={16} />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  Solicitar Levantamento (Payout)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPayoutOpen(false)}
                className="size-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  Método de Recebimento em São Tomé
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "dobrapay", label: "DobraPay", icon: Smartphone },
                    { id: "cst_money", label: "CST Money", icon: Smartphone },
                    { id: "bancaria", label: "BISTP / BGFI", icon: Building2 },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          setPayoutMethod(m.id as "dobrapay" | "cst_money" | "bancaria")
                        }
                        className={cn(
                          "p-2.5 rounded-2xl border text-center text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer",
                          payoutMethod === m.id
                            ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        <Icon size={16} />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  Montante a Levantar (Máx: {formatDb(availableBalance)})
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-2xl bg-muted/60 border border-border text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  {payoutMethod === "bancaria"
                    ? "IBAN / Conta Bancária (STP)"
                    : "Número de Telefone da Carteira"}
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={
                    payoutMethod === "bancaria" ? "ST53 0001 0001 2345 6789 01" : "+239 991 2345"
                  }
                  className="w-full h-11 px-3.5 rounded-2xl bg-muted/60 border border-border text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsPayoutOpen(false)}
                className="px-4 h-11 rounded-2xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRequestPayout}
                className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 shadow-md hover:bg-primary/90 transition cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>A processar...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Confirmar Transferência</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
