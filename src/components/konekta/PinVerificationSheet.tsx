import { useState, useRef, useEffect } from "react";
import {
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Wallet,
  ArrowRight,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KCard } from "./kit";
import { formatDb } from "@/lib/catalog";
import { OrderService, type SettlementResult } from "@/lib/order-service";
import { realtimeAudio } from "@/lib/realtime";
import { cn } from "@/lib/utils";

interface PinVerificationSheetProps {
  orderId: string;
  providerId: string;
  totalAmount: number;
  serviceTitle: string;
  onSuccess?: (settlement: SettlementResult) => void;
  className?: string;
}

export function PinVerificationSheet({
  orderId,
  providerId,
  totalAmount,
  serviceTitle,
  onSuccess,
  className,
}: PinVerificationSheetProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [settlementData, setSettlementData] = useState<SettlementResult | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus no primeiro campo ao montar
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, "").slice(-1); // Apenas 1 dígito numérico
    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);
    setErrorMessage("");

    // Se digitou e não é o último, foca no próximo
    if (cleanVal && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Se completou os 4 dígitos, aciona auto-submit
    if (cleanVal && index === 3 && newDigits.every((d) => d !== "")) {
      triggerSubmit(newDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      // Se está vazio e apertou backspace, volta para o anterior
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;

    const newDigits = ["", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    if (pasted.length === 4) {
      triggerSubmit(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, 3)]?.focus();
    }
  };

  const triggerSubmit = async (pinToVerify: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const result = await OrderService.verifyPinAndSettle({
        orderId,
        providerId,
        enteredPin: pinToVerify,
        lat: 0.336,
        lng: 6.731,
      });

      if (result.success) {
        realtimeAudio.play("coin");
        setSettlementData(result);
        onSuccess?.(result);
      } else {
        // Dispara animação de vibração (shake) e reseta campos
        setIsShaking(true);
        realtimeAudio.play("pop");
        setErrorMessage(
          result.error ||
            "PIN incorreto. Peça o código de 4 dígitos exibido no telemóvel do cliente.",
        );
        setTimeout(() => {
          setIsShaking(false);
          setDigits(["", "", "", ""]);
          inputRefs.current[0]?.focus();
        }, 600);
      }
    } catch {
      setErrorMessage("Erro de conexão ao validar o PIN. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // CASO DE SUCESSO: EXIBE RESUMO DA LIQUIDAÇÃO E REPASSE
  // =========================================================================
  if (settlementData?.settlement) {
    const s = settlementData.settlement;
    return (
      <KCard
        id={`settlement-success-card-${orderId}`}
        className="border-2 border-emerald-500/40 bg-emerald-500/10 shadow-lg space-y-4 p-5 rounded-3xl animate-scaleUp text-center"
      >
        <div className="size-16 rounded-3xl bg-emerald-600 text-white grid place-items-center mx-auto shadow-md">
          <CheckCircle2 size={32} />
        </div>

        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
            Validação Concluída com Sucesso
          </span>
          <h3 className="text-xl font-black text-foreground mt-0.5">Pagamento Liquidado!</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Os fundos foram transferidos em tempo real para a sua carteira digital KONEKTA.
          </p>
        </div>

        {/* DETALHE DA REPARTIÇÃO FINANCEIRA (SPLIT) */}
        <div className="rounded-2xl bg-card border border-border/80 p-4 space-y-2.5 text-left text-xs">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Valor Total Coletado em Custódia:</span>
            <span className="font-bold text-foreground font-mono">
              {formatDb(s.totalCollected)}
            </span>
          </div>

          <div className="flex justify-between items-center text-muted-foreground">
            <span>Comissão da Plataforma KONEKTA ({s.commissionPercent}%):</span>
            <span className="font-bold text-destructive font-mono">
              -{formatDb(s.platformCommission)}
            </span>
          </div>

          <div className="border-t border-border/60 pt-2 flex justify-between items-center font-bold">
            <span className="text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Wallet size={15} />
              <span>Líquido Creditado na Carteira:</span>
            </span>
            <span className="text-base text-emerald-800 dark:text-emerald-300 font-extrabold font-mono">
              +{formatDb(s.netProviderCredited)}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-muted/60 p-3 text-[11px] font-semibold text-muted-foreground flex items-center justify-center gap-2">
          <Shield size={14} className="text-primary" />
          <span>Novo saldo disponível na carteira: {formatDb(s.walletNewBalance)}</span>
        </div>
      </KCard>
    );
  }

  // =========================================================================
  // CASO PADRÃO: FORMULÁRIO DE 4 SLOTS OTP COM AUTO-SUBMIT
  // =========================================================================
  return (
    <KCard
      id={`pin-input-sheet-${orderId}`}
      className={cn(
        "border-2 border-amber-500/40 bg-linear-to-b from-amber-500/10 via-amber-500/5 to-transparent shadow-md space-y-4 p-5 rounded-3xl transition-all",
        isShaking && "animate-shake",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
          <div className="size-7 rounded-lg bg-amber-500 text-white grid place-items-center shrink-0">
            <KeyRound size={15} />
          </div>
          <span>Validação por Código PIN</span>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 text-[10px] font-black uppercase tracking-wider">
          4 Dígitos
        </span>
      </div>

      <div>
        <h4 className="text-sm font-black text-foreground">Conclusão do Serviço</h4>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          Peça o <strong>código de 4 dígitos</strong> exibido no telemóvel do cliente para confirmar
          a entrega e libertar os <strong>{formatDb(totalAmount)}</strong> na sua carteira.
        </p>
      </div>

      {/* OS 4 SLOTS DO OTP INPUT */}
      <div className="flex items-center justify-center gap-3 py-2">
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            disabled={isSubmitting}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            className={cn(
              "size-14 sm:size-16 rounded-2xl bg-card border-2 text-center text-2xl sm:text-3xl font-black font-mono text-foreground outline-none transition-all shadow-xs",
              digit
                ? "border-amber-500 ring-2 ring-amber-500/20"
                : "border-border hover:border-amber-500/50 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10",
              errorMessage && "border-destructive text-destructive",
            )}
          />
        ))}
      </div>

      {/* MENSAGEM DE ERRO OU SPINNER DE CARREGAMENTO */}
      {isSubmitting && (
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 py-1">
          <Loader2 size={16} className="animate-spin" />
          <span>A validar PIN e a calcular repartição de saldo...</span>
        </div>
      )}

      {errorMessage && !isSubmitting && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-2.5 flex items-center justify-center gap-2 text-xs font-bold text-destructive animate-fadeIn">
          <AlertTriangle size={15} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* BOTÃO MANUAL CASO QUEIRA FORÇAR O SUBMIT */}
      <Button
        id={`btn-submit-pin-${orderId}`}
        onClick={() => triggerSubmit(digits.join(""))}
        disabled={isSubmitting || digits.some((d) => d === "")}
        className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
      >
        {isSubmitting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            <CheckCircle2 size={16} />
            <span>Validar Código & Libertar Saldo</span>
          </>
        )}
      </Button>
    </KCard>
  );
}
