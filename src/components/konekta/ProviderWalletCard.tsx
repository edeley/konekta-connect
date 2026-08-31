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
  AlertTriangle,
  Banknote,
  Plus,
} from "lucide-react";
import { formatDb } from "@/lib/pricing-engine";
import { store, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProviderWalletCardProps {
  availableBalance?: number;
  pendingEscrow?: number;
  providerDebt?: number;
  currency?: "STD" | "Db";
  className?: string;
  onTopUpClick?: () => void;
  onDeclareCashClick?: () => void;
}

export function ProviderWalletCard({
  availableBalance = 450.0,
  pendingEscrow = 120.0,
  providerDebt = 0,
  currency = "STD",
  className,
  onTopUpClick,
  onDeclareCashClick,
}: ProviderWalletCardProps) {
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<
    "dobrapay" | "bistp" | "bgfi" | "afriland" | "dobra24" | "cst_money"
  >("bistp");
  const [payoutAmount, setPayoutAmount] = useState(
    String(availableBalance > 0 ? availableBalance : 100),
  );
  const [accountNumber, setAccountNumber] = useState("ST53.0001.0000.1234.5678.9");
  const [isProcessing, setIsProcessing] = useState(false);

  const isBlocked = providerDebt >= 500;

  const handleRequestPayout = () => {
    const amount = Number(payoutAmount);
    if (!amount || amount <= 0 || amount > availableBalance) {
      toast.error("Insira um montante válido dentro do saldo disponível.");
      return;
    }
    if (isBlocked) {
      toast.error(
        "Conta temporariamente suspensa por dívida pendente. Regularize a comissão para efetuar saques.",
      );
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPayoutOpen(false);
      store.requestPayout(amount);
      toast.success(
        `Pedido de levantamento de ${formatDb(amount)} enviado com sucesso! Processamento em 1-2 dias úteis via ${
          payoutMethod === "dobrapay"
            ? "DobraPay"
            : payoutMethod === "cst_money"
              ? "CST Mobile Money"
              : payoutMethod === "dobra24"
                ? "Dobra 24"
                : payoutMethod.toUpperCase()
        }.`,
      );
    }, 900);
  };

  return (
    <>
      <div
        className={cn(
          "rounded-3xl border border-border/80 bg-card p-5 space-y-4 shadow-sm",
          className,
        )}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Carteira Digital PRO
              </h3>
              <p className="text-sm font-extrabold text-foreground">Gestão de Ganhos & Custódia</p>
            </div>
          </div>

          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1",
              isBlocked
                ? "bg-destructive/15 text-destructive"
                : providerDebt > 0
                  ? "bg-amber-500/15 text-amber-900 dark:text-amber-300"
                  : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
            )}
          >
            {isBlocked ? (
              <>
                <AlertTriangle size={12} /> Bloqueado por Dívida
              </>
            ) : (
              <>
                <ShieldCheck size={12} /> Custódia Segura
              </>
            )}
          </span>
        </div>

        {/* 3 PILARES DE SALDO MD3 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* 1. SALDO DISPONÍVEL (Verde) */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
            <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-600" /> Saldo Disponível
            </span>
            <p className="text-xl font-black text-foreground tracking-tight font-mono">
              {formatDb(availableBalance)}
            </p>
            <span className="text-[10px] text-muted-foreground block">
              Pronto para saque bancário STP
            </span>
          </div>

          {/* 2. SALDO EM CUSTÓDIA / ESCROW (Âmbar) */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1">
            <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
              <Lock size={12} className="text-amber-600" /> Em Custódia (Escrow)
            </span>
            <p className="text-xl font-black text-foreground tracking-tight font-mono">
              {formatDb(pendingEscrow)}
            </p>
            <span className="text-[10px] text-muted-foreground block">
              Aguardando validação OTP do cliente
            </span>
          </div>

          {/* 3. DÍVIDA ACUMULADA (Vermelho / Aviso) */}
          <div
            className={cn(
              "p-3.5 rounded-2xl border space-y-1",
              providerDebt > 0
                ? "bg-destructive/10 border-destructive/30"
                : "bg-muted/40 border-border/80",
            )}
          >
            <span
              className={cn(
                "text-[11px] font-bold flex items-center gap-1",
                providerDebt > 0 ? "text-destructive" : "text-muted-foreground",
              )}
            >
              <AlertTriangle
                size={12}
                className={providerDebt > 0 ? "text-destructive" : "text-muted-foreground"}
              />{" "}
              Dívida de Comissões
            </span>
            <p
              className={cn(
                "text-xl font-black tracking-tight font-mono",
                providerDebt > 0 ? "text-destructive" : "text-foreground",
              )}
            >
              {formatDb(providerDebt)}
            </p>
            <span className="text-[10px] text-muted-foreground block">
              {providerDebt >= 500
                ? "Limite de 500 STN atingido"
                : providerDebt > 0
                  ? `Limite de suspensão: 500 STN`
                  : "Conta regularizada (0 STN)"}
            </span>
          </div>
        </div>

        {/* AÇÕES RÁPIDAS */}
        <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-muted-foreground">
            Taxa de plataforma deduzida na validação do OTP ou na confirmação presencial.
          </div>

          <div className="flex items-center gap-2">
            {onDeclareCashClick && (
              <button
                type="button"
                onClick={onDeclareCashClick}
                className="px-3 h-9 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-border"
              >
                <Banknote size={14} className="text-emerald-600" />
                <span>Declarar Dinheiro</span>
              </button>
            )}

            {providerDebt > 0 && onTopUpClick && (
              <button
                type="button"
                onClick={onTopUpClick}
                className="px-3 h-9 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/25 transition cursor-pointer border border-amber-500/30"
              >
                <RefreshCw size={13} />
                <span>Regularizar</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsPayoutOpen(true)}
              disabled={availableBalance <= 0 || isBlocked}
              className="px-3.5 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary/90 transition cursor-pointer disabled:opacity-50"
            >
              <ArrowUpRight size={14} />
              <span>Solicitar Saque</span>
            </button>
          </div>
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
                  Solicitar Levantamento Bancário STP
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
                  Canal de Recebimento STP
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "bistp" as const, label: "BISTP", icon: Building2 },
                    { id: "bgfi" as const, label: "BGFI Bank", icon: Building2 },
                    { id: "afriland" as const, label: "Afriland", icon: Building2 },
                    { id: "dobra24" as const, label: "Dobra 24", icon: Smartphone },
                    { id: "cst_money" as const, label: "CST Money", icon: Smartphone },
                    { id: "dobrapay" as const, label: "DobraPay", icon: Smartphone },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPayoutMethod(m.id)}
                        className={cn(
                          "p-2.5 rounded-2xl border text-center text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer",
                          payoutMethod === m.id
                            ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        <Icon size={16} />
                        <span className="truncate w-full">{m.label}</span>
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
                  className="w-full h-11 px-3.5 rounded-2xl bg-muted/60 border border-border text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  {payoutMethod === "dobra24" || payoutMethod === "cst_money"
                    ? "Número de Telemóvel (+239)"
                    : "IBAN / Conta Bancária STP"}
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={
                    payoutMethod === "dobra24" || payoutMethod === "cst_money"
                      ? "+239 991 2345"
                      : "ST53 0001 0000 1234 5678 9"
                  }
                  className="w-full h-11 px-3.5 rounded-2xl bg-muted/60 border border-border text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary font-mono"
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
