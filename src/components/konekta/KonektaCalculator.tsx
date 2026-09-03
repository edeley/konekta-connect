import { useState } from "react";
import {
  ShieldCheck,
  ArrowRight,
  Calculator,
  CheckCircle2,
  User,
  Wrench,
  Lock,
} from "lucide-react";
import { formatDb } from "@/lib/catalog";
import { cn } from "@/lib/utils";

interface KonektaCalculatorProps {
  initialTotal?: number;
  editable?: boolean;
  isClientView?: boolean;
  showSubtitle?: boolean;
  className?: string;
}

export function KonektaCalculator({
  initialTotal = 500,
  editable = true,
  isClientView: initialClientView = true,
  showSubtitle = true,
  className,
}: KonektaCalculatorProps) {
  const [amount, setAmount] = useState<number>(initialTotal);
  const [isClientMode, setIsClientMode] = useState<boolean>(initialClientView);

  // Platform Escrow Protection:
  // Client pays: Base amount + 5% Escrow Protection Fee
  // Provider gets: Base amount - 10% Platform Commission
  // Both sides enjoy guaranteed payment and dispute mediation
  const escrowFeePercent = 5;
  const providerCommissionPercent = 10;

  const escrowProtectionFee = Math.round((amount * escrowFeePercent) / 100);
  const clientTotalPayment = amount + escrowProtectionFee;

  const providerCommission = Math.round((amount * providerCommissionPercent) / 100);
  const providerNetPayout = amount - providerCommission;

  const presets = [
    { label: "Pequena Reparação", value: 150 },
    { label: "Eletricidade / Fuga", value: 500 },
    { label: "Instalação de AC", value: 1200 },
    { label: "Pintura / Remodelação", value: 3000 },
  ];

  return (
    <div
      id="konekta-price-calculator"
      className={cn(
        "rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-soft space-y-5",
        className,
      )}
    >
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Calculator size={15} />
            </span>
            <h3 className="text-base font-black text-foreground">Simulador de Preços & Custódia</h3>
          </div>
          {showSubtitle && (
            <p className="text-xs text-muted-foreground mt-1">
              Entenda como cada Dobra (Db) é protegida em garantia até a aprovação final.
            </p>
          )}
        </div>

        {/* View Toggle: Cliente vs Prestador */}
        <div className="inline-flex p-1 rounded-xl bg-muted/60 border border-border/50 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setIsClientMode(true)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition",
              isClientMode
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <User size={13} />
            <span>Visão do Cliente</span>
          </button>
          <button
            type="button"
            onClick={() => setIsClientMode(false)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition",
              !isClientMode
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Wrench size={13} />
            <span>Visão do Prestador</span>
          </button>
        </div>
      </div>

      {/* Preset Buttons */}
      {editable && (
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Exemplos de Serviços em São Tomé:
          </label>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setAmount(p.value)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold border transition",
                  amount === p.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                {p.label} ({formatDb(p.value)})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Slider & Input */}
      {editable && (
        <div className="space-y-2.5 rounded-2xl bg-muted/30 p-4 border border-border/60">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-foreground">
              Valor do Orçamento (Mão de Obra):
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="50"
                max="50000"
                step="50"
                value={amount}
                onChange={(e) => setAmount(Math.max(10, Number(e.target.value) || 0))}
                className="w-24 px-2 py-1 text-right text-sm font-black font-mono rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span className="text-xs font-bold text-muted-foreground">Db</span>
            </div>
          </div>

          <input
            type="range"
            min="100"
            max="10000"
            step="50"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>100 Db</span>
            <span>5.000 Db</span>
            <span>10.000 Db</span>
          </div>
        </div>
      )}

      {/* Calculation Display */}
      {isClientMode ? (
        /* CLIENT VIEW */
        <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Orçamento acordado com o profissional:</span>
            <span className="font-bold text-foreground font-mono">{formatDb(amount)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span>Taxa de Proteção & Escrow KONEKTA (5%):</span>
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-emerald-600/10 text-emerald-800 dark:text-emerald-300 font-bold">
                Sem Risco
              </span>
            </span>
            <span className="font-bold text-emerald-800 dark:text-emerald-300 font-mono">
              +{formatDb(escrowProtectionFee)}
            </span>
          </div>
          <div className="border-t border-border/80 pt-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-foreground block">
                Total a Depositar em Custódia:
              </span>
              <span className="text-[11px] text-muted-foreground">
                Retido em segurança até fornecer o código PIN
              </span>
            </div>
            <span className="text-lg sm:text-xl font-black text-primary font-mono">
              {formatDb(clientTotalPayment)}
            </span>
          </div>
        </div>
      ) : (
        /* PROVIDER VIEW */
        <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Valor bruto do serviço:</span>
            <span className="font-bold text-foreground font-mono">{formatDb(amount)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Taxa de Plataforma & Gestão KONEKTA (10%):</span>
            <span className="font-bold text-destructive font-mono">
              -{formatDb(providerCommission)}
            </span>
          </div>
          <div className="border-t border-border/80 pt-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-foreground block">
                Valor Líquido a Receber:
              </span>
              <span className="text-[11px] text-muted-foreground">
                Transferido automaticamente para sua conta/carteira após PIN
              </span>
            </div>
            <span className="text-lg sm:text-xl font-black text-emerald-800 dark:text-emerald-300 font-mono">
              {formatDb(providerNetPayout)}
            </span>
          </div>
        </div>
      )}

      {/* Trust Guarantee Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        <div className="flex items-start gap-2 p-3 rounded-xl bg-card border border-border/60 text-xs">
          <Lock size={15} className="text-primary shrink-0 mt-0.5" />
          <div className="text-[11px] leading-snug text-muted-foreground">
            <strong className="text-foreground block">Fundos Protegidos:</strong>O dinheiro fica
            guardado até o cliente validar a conclusão.
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-card border border-border/60 text-xs">
          <ShieldCheck
            size={15}
            className="text-emerald-800 dark:text-emerald-300 shrink-0 mt-0.5"
          />
          <div className="text-[11px] leading-snug text-muted-foreground">
            <strong className="text-foreground block">Garantia KONEKTA:</strong>
            Em caso de divergência, nossa mediação analisa e resolve.
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-card border border-border/60 text-xs">
          <CheckCircle2 size={15} className="text-primary shrink-0 mt-0.5" />
          <div className="text-[11px] leading-snug text-muted-foreground">
            <strong className="text-foreground block">Libertação por PIN:</strong>
            Pagamento liberado instantaneamente com o código de 4 dígitos.
          </div>
        </div>
      </div>
    </div>
  );
}
