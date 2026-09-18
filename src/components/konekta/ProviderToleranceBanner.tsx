import { useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatDb } from "@/lib/catalog";
import { SaoWalletRechargeModal } from "./SaoWalletRechargeModal";

export function ProviderToleranceBanner() {
  const providerBalance = useStore((s) => s.providerBalance);
  const debtLimit = useStore((s) => s.config?.debtBlockLimit || 50);
  const [showRechargeModal, setShowRechargeModal] = useState(false);

  // Zona de tolerância: saldo negativo mas ainda superior a -50 STN
  const inToleranceZone = providerBalance < 0 && providerBalance > -debtLimit;

  if (!inToleranceZone) return null;

  return (
    <>
      <div className="w-full bg-amber-50 dark:bg-amber-950/50 border-b border-amber-300 dark:border-amber-700/60 px-4 py-2.5 flex items-center justify-between text-amber-950 dark:text-amber-200 text-xs shadow-2xs animate-in slide-in-from-top-1">
        <div className="flex items-center gap-2 pr-2">
          <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="leading-tight text-[11px] sm:text-xs">
            <strong>Saldo negativo ({formatDb(providerBalance)}):</strong> Carregue a sua carteira
            para evitar o bloqueio automático da conta (limite: -{debtLimit} Dobras).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowRechargeModal(true)}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-2xs active:scale-95 cursor-pointer"
        >
          <span>Recarregar</span>
          <ArrowRight size={12} />
        </button>
      </div>

      <SaoWalletRechargeModal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        defaultAmount={Math.max(50, Math.abs(providerBalance) + 50)}
        isPro={true}
      />
    </>
  );
}
