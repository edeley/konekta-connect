import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Wallet,
  ArrowUpRight,
  Lock,
  CheckCircle2,
  Building2,
  Smartphone,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertTriangle,
  Banknote,
  RefreshCw,
  X,
  ChevronRight,
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
  availableBalance: propBalance,
  pendingEscrow: propEscrow,
  providerDebt: propDebt,
  className,
  onTopUpClick,
  onDeclareCashClick,
}: ProviderWalletCardProps) {
  // Store dynamic data with fallbacks
  const storeBalance = useStore((s) => s.providerBalance);
  const storePending = useStore((s) => s.providerPendingBalance);
  const storeDebt = useStore((s) => s.providerDebt);
  const isBlocked = useStore((s) => s.isProviderBlockedForDebt);

  const balance = propBalance !== undefined ? propBalance : storeBalance;
  const escrow = propEscrow !== undefined ? propEscrow : storePending;
  const debt = propDebt !== undefined ? propDebt : storeDebt;

  const [hideBalance, setHideBalance] = useState(false);
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<
    "dobrapay" | "bistp" | "bgfi" | "afriland" | "dobra24" | "cst_money"
  >("bistp");
  const [payoutAmount, setPayoutAmount] = useState(String(balance > 0 ? balance : 100));
  const [accountNumber, setAccountNumber] = useState("ST53.0001.0000.1234.5678.9");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRequestPayout = () => {
    const amount = Number(payoutAmount);
    if (!amount || amount <= 0 || amount > balance) {
      toast.error("Insira um montante válido dentro do saldo disponível.");
      return;
    }
    if (isBlocked || debt >= 500) {
      toast.error(
        "Conta suspensa por dívida pendente. Regularize as comissões na sua carteira antes de efetuar saques.",
      );
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPayoutOpen(false);
      store.requestPayout(amount);
      toast.success(
        `Pedido de levantamento de ${formatDb(amount)} registado! Transferência em curso para ${
          payoutMethod === "dobrapay"
            ? "DobraPay"
            : payoutMethod === "cst_money"
              ? "CST Mobile Money"
              : payoutMethod === "dobra24"
                ? "Dobra 24"
                : payoutMethod.toUpperCase()
        }.`,
      );
    }, 800);
  };

  return (
    <>
      <div
        className={cn(
          "rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white p-5 shadow-xl border border-slate-800 space-y-4 relative overflow-hidden",
          className,
        )}
      >
        {/* Subtle background glow */}
        <div className="absolute -top-12 -right-12 size-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        {/* HEADER DO CARD */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center backdrop-blur-xs">
              <Wallet size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Finanças KONEKTA
              </span>
              <h3 className="text-xs font-semibold text-slate-300">Resumo dos seus ganhos</h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setHideBalance(!hideBalance)}
              className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              title={hideBalance ? "Mostrar saldos" : "Ocultar saldos por privacidade"}
            >
              {hideBalance ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <Link
              to="/pro/ganhos"
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 transition"
            >
              <span>Ver Carteira</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* VALORES PRINCIPAIS */}
        <div className="grid grid-cols-2 gap-3 pt-1 relative z-10">
          {/* SALDO DISPONÍVEL */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
            <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-400" /> Disponível para Saque
            </span>
            <p className="text-2xl font-black font-mono tracking-tight text-white">
              {hideBalance ? "••••••" : formatDb(balance)}
            </p>
            <span className="text-[10px] text-slate-400 block truncate">
              Livre para transferência STP
            </span>
          </div>

          {/* SALDO EM CUSTÓDIA */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
            <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
              <Lock size={12} className="text-amber-400" /> Em Custódia (Escrow)
            </span>
            <p className="text-2xl font-black font-mono tracking-tight text-amber-200">
              {hideBalance ? "••••••" : formatDb(escrow)}
            </p>
            <span className="text-[10px] text-slate-400 block truncate">
              Libera com validação do OTP
            </span>
          </div>
        </div>

        {/* ESTADO DE COMISSÃO & DÍVIDA */}
        {debt > 0 ? (
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle size={15} className="text-amber-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-amber-200 block">
                  Comissões de serviços a liquidar: {formatDb(debt)}
                </span>
                <span className="text-[10px] text-amber-300/80 block truncate">
                  {debt >= 500
                    ? "Limite de 500 Db atingido. Regularize para reativar novos chamados."
                    : "Amortize a comissão bancária quando for conveniente."}
                </span>
              </div>
            </div>
            <Link
              to="/pro/ganhos"
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shrink-0 hover:bg-amber-400 transition"
            >
              Regularizar
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/10">
            <span className="flex items-center gap-1.5 text-emerald-300">
              <ShieldCheck size={13} className="text-emerald-400" /> Conta 100% regularizada (0 Db
              em dívida)
            </span>
            <span className="text-[10px] text-slate-400">Protegido por OTP</span>
          </div>
        )}

        {/* BOTÕES DE AÇÃO RÁPIDA */}
        <div className="grid grid-cols-2 gap-2 pt-1 relative z-10">
          <button
            type="button"
            onClick={() => setIsPayoutOpen(true)}
            disabled={balance <= 0 || isBlocked}
            className="h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            <ArrowUpRight size={15} />
            <span>Levantar Dinheiro</span>
          </button>

          {onDeclareCashClick ? (
            <button
              type="button"
              onClick={onDeclareCashClick}
              className="h-11 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-white/15 active:scale-98"
            >
              <Banknote size={15} className="text-emerald-400" />
              <span>Declarar em Dinheiro</span>
            </button>
          ) : (
            <Link
              to="/pro/ganhos"
              className="h-11 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-white/15 active:scale-98"
            >
              <Wallet size={15} className="text-emerald-400" />
              <span>Ver Extrato Completo</span>
            </Link>
          )}
        </div>
      </div>

      {/* MODAL / BOTTOM SHEET DE SOLICITAÇÃO DE LEVANTAMENTO */}
      {isPayoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ArrowUpRight size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Levantar Saldo da Carteira</h3>
                  <p className="text-[10px] text-muted-foreground">
                    Transferência direta para a sua conta em São Tomé
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPayoutOpen(false)}
                className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Selecione o Banco ou Carteira STP:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
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
                            ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        <Icon size={16} />
                        <span className="truncate w-full text-[11px]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  Montante a Levantar (Saldo disponível: {formatDb(balance)})
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
                    ? "Nº de Telemóvel (+239)"
                    : "IBAN da Conta Bancária STP"}
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={
                    payoutMethod === "dobra24" || payoutMethod === "cst_money"
                      ? "+239 991 2345"
                      : "ST53.0001.0000.1234.5678.9"
                  }
                  className="w-full h-11 px-3.5 rounded-2xl bg-muted/60 border border-border text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary font-mono"
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
                    <span>A registar transferência...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Confirmar Levantamento</span>
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
