import { useState } from "react";
import { Lock, ShieldAlert, ArrowRight, Zap, RefreshCw } from "lucide-react";
import { store, useStore } from "@/lib/store";
import { formatDb } from "@/lib/catalog";
import { SaoWalletRechargeModal } from "./SaoWalletRechargeModal";
import { toast } from "sonner";

export function ProviderDebtLockOverlay() {
  const user = useStore((s) => s.user);
  const isBlocked = useStore((s) => s.isProviderBlockedForDebt);
  const providerBalance = useStore((s) => s.providerBalance);
  const debtLimit = useStore((s) => s.config?.debtBlockLimit || 50);

  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [isProcessingQuick, setIsProcessingQuick] = useState(false);

  // O bloqueio é acionado se a flag estiver ativa ou o saldo for <= -50 STN
  const shouldBlock = isBlocked || providerBalance <= -debtLimit;

  if (!shouldBlock) return null;

  function handleQuickDemoUnblock() {
    setIsProcessingQuick(true);
    // Simula recarga que zera a dívida e deixa saldo positivo
    const rechargeAmount = Math.abs(providerBalance) + 50;
    const res = store.simulateInstantRecharge({
      amount: rechargeAmount,
      method: "sao_wallet_digital",
      reference: `SW-AUTO-DEMO-${Date.now().toString().slice(-4)}`,
      userRole: "prestador",
    });

    setIsProcessingQuick(false);
    if (res.ok) {
      toast.success("🔓 Conta Desbloqueada Automaticamente!", {
        description: `Recarga de ${rechargeAmount} STN processada. Novo saldo: ${store.getState().providerBalance} STN.`,
      });
    } else {
      toast.error(res.message);
    }
  }

  return (
    <>
      <div
        id="provider-lock-screen"
        className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 select-none animate-in fade-in"
      >
        <div className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-emerald-600 shadow-2xl space-y-6 text-center">
          {/* Ícone de Bloqueio em Verde e Branco */}
          <div className="size-20 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
            <Lock size={36} strokeWidth={2.5} />
          </div>

          {/* Título Oficial */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full bg-emerald-100/70 dark:bg-emerald-900/40 inline-block">
              STATUS: BLOQUEADO_SALDO_DEVEDOR
            </span>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              CONTA BLOQUEADA
            </h1>
          </div>

          {/* Mensagem e Saldo Atual */}
          <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed text-left bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <p>
              A sua conta encontra-se temporariamente bloqueada devido ao saldo negativo ter
              atingido o limite máximo permitido de <strong>-{debtLimit} Dobras</strong>.
            </p>

            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-800/60 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                Saldo Atual da Carteira:
              </span>
              <span className="text-base font-black font-mono text-rose-600 dark:text-rose-400">
                {formatDb(providerBalance)}
              </span>
            </div>

            <p>
              Para reativar a sua conta e voltar a receber pedidos de trabalho, efetue o
              carregamento da sua carteira digital.
            </p>
          </div>

          {/* Botão de Ação Principal */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              id="btn-recharge-unblock"
              onClick={() => setShowRechargeModal(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              <span>RECARREGAR CARTEIRA AGORA (São Wallet / Agente)</span>
              <ArrowRight size={16} />
            </button>

            {/* Atalho de Demonstração para Preview */}
            <button
              type="button"
              onClick={handleQuickDemoUnblock}
              disabled={isProcessingQuick}
              className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap size={13} className="text-amber-500" />
              <span>Simular Regularização Imediata (Modo Demonstração)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Recarga São Wallet */}
      <SaoWalletRechargeModal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        defaultAmount={Math.max(50, Math.abs(providerBalance) + 50)}
        isPro={true}
      />
    </>
  );
}
