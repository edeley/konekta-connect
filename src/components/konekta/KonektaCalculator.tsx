import React, { useState, useEffect } from "react";
import { Calculator, Banknote, BadgePercent, Wallet, ShieldCheck, Sparkles } from "lucide-react";
import { formatDb } from "@/lib/pricing-engine";
import { useStore } from "@/lib/store";

export interface KonektaCalculatorProps {
  initialTotal?: number;
  initialNet?: number;
  baseAmount?: number;
  baseLabel?: string;
  feePct?: number;
  editable?: boolean;
  onChange?: (values: { total: number; fee: number; net: number; feePct: number }) => void;
  showSubtitle?: boolean;
  subtitleText?: string;
  className?: string;
  isClientView?: boolean;
}

export function KonektaCalculator({
  initialTotal,
  initialNet,
  baseAmount,
  baseLabel,
  feePct: customFeePct,
  editable = true,
  onChange,
  showSubtitle = true,
  subtitleText = "Garantia de Custódia Integrada",
  className = "",
  isClientView = false,
}: KonektaCalculatorProps) {
  const storeFeePct = useStore((s) => s.config.commissionPct);
  const feePct = customFeePct ?? storeFeePct ?? 20;

  // Estado interno para o valor total cobrado ao cliente (o cliente paga o total, a taxa é retirada do prestador)
  const [totalInput, setTotalInput] = useState<string>(() => {
    if (initialTotal !== undefined && initialTotal > 0) return String(initialTotal);
    if (baseAmount !== undefined && baseAmount > 0) return String(baseAmount);
    if (initialNet !== undefined && initialNet > 0) {
      return String(initialNet);
    }
    return "500";
  });

  // Atualiza se mudar as props externas
  useEffect(() => {
    if (initialTotal !== undefined && initialTotal > 0) {
      setTotalInput(String(initialTotal));
    } else if (baseAmount !== undefined && baseAmount > 0) {
      setTotalInput(String(baseAmount));
    } else if (initialNet !== undefined && initialNet > 0) {
      setTotalInput(String(initialNet));
    }
  }, [initialTotal, baseAmount, initialNet, feePct]);

  const totalNumber = Math.max(0, Number(totalInput) || 0);
  const feeNumber = Math.round((totalNumber * feePct) / 100);
  const netNumber = Math.max(0, totalNumber - feeNumber);

  const handleTotalChange = (valStr: string) => {
    setTotalInput(valStr);
    const num = Math.max(0, Number(valStr) || 0);
    const fee = Math.round((num * feePct) / 100);
    const net = Math.max(0, num - fee);
    onChange?.({ total: num, fee, net, feePct });
  };

  const handleQuickPreset = (presetTotal: number) => {
    handleTotalChange(String(presetTotal));
  };

  return (
    <div
      className={`rounded-3xl bg-slate-50/80 dark:bg-card/90 border border-slate-200/80 dark:border-border p-4 sm:p-5 shadow-sm space-y-3.5 transition-all ${className}`}
    >
      {/* Cabeçalho da Calculadora */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 grid place-items-center">
            <Calculator size={16} />
          </div>
          <span className="text-sm font-bold text-sky-700 dark:text-sky-400 tracking-tight">
            Calculadora KONEKTA
          </span>
        </div>

        {showSubtitle && (
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">
            {subtitleText}
          </span>
        )}
      </div>

      {/* Linha Opcional: Detalhe da Base de Cálculo */}
      {baseLabel && (
        <div className="flex items-center justify-between gap-3 text-xs sm:text-sm text-slate-700 dark:text-foreground/90 font-medium px-1">
          <span className="truncate">{baseLabel}:</span>
          <span className="font-bold shrink-0 font-mono">
            {formatDb(baseAmount ?? totalNumber)}
          </span>
        </div>
      )}

      {/* Linha 1: Valor Total Cobrado ao Cliente */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-foreground truncate">
            Valor Total Cobrado ao Cliente:
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-sky-600 dark:text-sky-400">
            <Banknote size={20} strokeWidth={2.2} />
          </div>

          {editable ? (
            <div className="relative flex items-center">
              <input
                type="number"
                min="0"
                step="25"
                value={totalInput}
                onChange={(e) => handleTotalChange(e.target.value)}
                placeholder="500"
                className="w-28 sm:w-32 h-10 px-2.5 text-right font-black text-base sm:text-lg text-sky-700 dark:text-sky-300 bg-card rounded-xl border-2 border-sky-400 dark:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-400/30 transition shadow-2xs font-mono"
              />
              <span className="ml-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">Db</span>
            </div>
          ) : (
            <div className="h-10 px-3 flex items-center justify-end rounded-xl border-2 border-sky-400 dark:border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300 font-black text-base sm:text-lg font-mono">
              {totalNumber} Db
            </div>
          )}
        </div>
      </div>

      {/* Linha 2: Taxa KONEKTA (Descontada do Prestador) */}
      <div className="flex items-center justify-between gap-3 text-xs sm:text-sm text-slate-600 dark:text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <span>Taxa KONEKTA ({feePct}%):</span>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-semibold font-mono">
          <div className="text-slate-400 dark:text-muted-foreground">
            <BadgePercent size={18} strokeWidth={2} />
          </div>
          <span className="w-24 text-right text-slate-600 dark:text-slate-400">
            -{feeNumber} Db
          </span>
        </div>
      </div>

      {/* Linha 3: Destaque em Verde - Você Recebe (Líquido na Carteira) */}
      <div className="rounded-2xl bg-emerald-100/90 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800/60 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-200">
            {isClientView ? "Valor Entregue ao Prestador:" : "Você Recebe (Líquido na Carteira):"}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="text-emerald-600 dark:text-emerald-400">
            <Wallet size={20} strokeWidth={2.3} />
          </div>
          <span className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
            {netNumber} Db
          </span>
        </div>
      </div>

      {/* Atalhos Rápidos para Facilitar o Cálculo */}
      {editable && (
        <div className="flex items-center justify-between gap-1 pt-1 overflow-x-auto">
          <span className="text-[10px] font-semibold text-muted-foreground shrink-0 flex items-center gap-1">
            <Sparkles size={11} className="text-sky-500" /> Valores frequentes:
          </span>
          <div className="flex items-center gap-1.5">
            {[100, 250, 500, 750, 1000, 1500, 2500].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleQuickPreset(preset)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                  totalNumber === preset
                    ? "bg-sky-600 text-white shadow-2xs"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {preset} Db
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nota de transparência */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground pt-0.5">
        <ShieldCheck size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>
          Preço transparente: a taxa KONEKTA é suportada pelo prestador. Sem custos ocultos.
        </span>
      </div>
    </div>
  );
}
