import { useState, useEffect, useRef, useCallback } from "react";
import { ShieldCheck, Smartphone, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { BottomSheet } from "@/components/konekta/kit";
import { sendSmsOtp, verifySmsOtp, normalizeStpPhone } from "@/lib/sms-otp";
import { toast } from "sonner";

interface SmsOtpVerificationModalProps {
  open: boolean;
  onClose: () => void;
  phone: string;
  title?: string;
  reason?: string;
  onVerified: () => void;
}

export function SmsOtpVerificationModal({
  open,
  onClose,
  phone,
  title = "Verificação por SMS OTP",
  reason = "Confirmação de segurança KONEKTA",
  onVerified,
}: SmsOtpVerificationModalProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const formattedPhone = normalizeStpPhone(phone || "+239 990 0000");

  // Detetar operadora de STP
  const carrier = formattedPhone.includes("+23998")
    ? "Unitel STP"
    : formattedPhone.includes("+23999") || formattedPhone.includes("+23990")
      ? "CST Móvel"
      : "Rede Móvel STP";

  const handleSendCode = useCallback(async () => {
    setIsSending(true);
    setErrorMsg(null);
    try {
      const res = await sendSmsOtp(phone, reason);
      if (res.success) {
        setCooldown(res.cooldownSeconds);
        if (res.demoCode) {
          setDemoCode(res.demoCode);
        }
        toast.success("SMS com código enviado!", {
          description: `Enviado para ${res.formattedPhone} (${carrier})`,
        });
        setTimeout(() => inputsRef.current[0]?.focus(), 100);
      } else {
        setErrorMsg(res.message);
        toast.error(res.message);
      }
    } catch {
      setErrorMsg("Erro ao conectar à rede SMS Twilio. Tente novamente.");
    } finally {
      setIsSending(false);
    }
  }, [phone, reason, carrier]);

  useEffect(() => {
    if (open) {
      handleSendCode();
    } else {
      setCode(["", "", "", "", "", ""]);
      setErrorMsg(null);
    }
  }, [open, handleSendCode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  function handleDigitChange(index: number, value: string) {
    const char = value.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    const newCode = [...code];
    newCode[index] = char;
    setCode(newCode);
    setErrorMsg(null);

    // Auto avanço para o próximo input
    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // Se todos preenchidos, valida automaticamente
    if (char && index === 5 && newCode.every((d) => d !== "")) {
      submitCode(newCode.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const split = pasted.split("");
      setCode(split);
      submitCode(pasted);
    }
  }

  async function submitCode(fullCode: string) {
    if (fullCode.length !== 6) {
      setErrorMsg("Insira o código de 6 dígitos completo.");
      return;
    }
    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const res = await verifySmsOtp(phone, fullCode);
      if (res.success) {
        toast.success(res.message);
        onVerified();
        onClose();
      } else {
        setErrorMsg(res.message);
        toast.error(res.message);
      }
    } catch {
      setErrorMsg("Falha ao validar código. Verifique a sua conexão.");
    } finally {
      setIsVerifying(false);
    }
  }

  function useDemoCode() {
    if (!demoCode) return;
    const split = demoCode.split("");
    setCode(split);
    submitCode(demoCode);
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={title} description={reason}>
      <div className="space-y-4 py-2">
        {/* Banner do Número */}
        <div className="p-3.5 rounded-2xl bg-muted border border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
              <Smartphone size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground font-mono">{formattedPhone}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <span>Operadora: {carrier}</span>
                <span>·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Gateway Twilio
                </span>
              </p>
            </div>
          </div>
          <ShieldCheck size={20} className="text-primary/70 shrink-0" />
        </div>

        {/* Informação */}
        <p className="text-xs text-muted-foreground text-center">
          Introduza o código de verificação de 6 dígitos enviado por SMS para o seu telemóvel.
        </p>

        {/* Inputs de 6 Dígitos */}
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {code.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputsRef.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border bg-card text-foreground outline-none transition-all ${
                digit
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
              }`}
            />
          ))}
        </div>

        {/* Mensagem de Erro */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Ajuda de Teste Rápido / Demo Code */}
        {demoCode && (
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">Código Recebido (Simulação):</span>
              <span className="font-mono font-bold text-sm bg-card px-2 py-0.5 rounded-md border border-border">
                {demoCode}
              </span>
            </div>
            <button
              type="button"
              onClick={useDemoCode}
              className="text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:underline cursor-pointer"
            >
              Preencher
            </button>
          </div>
        )}

        {/* Botão de Validação */}
        <button
          type="button"
          disabled={isVerifying || code.some((d) => d === "")}
          onClick={() => submitCode(code.join(""))}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:opacity-95 disabled:opacity-40 transition"
        >
          {isVerifying ? (
            <span>A validar SMS...</span>
          ) : (
            <>
              <CheckCircle2 size={16} /> Confirmar Código OTP
            </>
          )}
        </button>

        {/* Reenviar Código */}
        <div className="text-center pt-1">
          {cooldown > 0 ? (
            <p className="text-xs text-muted-foreground">
              Reenviar novo código SMS em <strong className="text-foreground">{cooldown}s</strong>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isSending}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={isSending ? "animate-spin" : ""} />
              {isSending ? "A reenviar..." : "Não recebeu o SMS? Reenviar código"}
            </button>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
