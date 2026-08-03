import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { OTP_LENGTH } from "@/lib/auth-schemas";

export type OTPInputProps = {
  length?: number;
  onComplete: (code: string) => void;
  onChangeCode?: (code: string) => void;
  error?: string;
  disabled?: boolean;
  shake?: boolean;
};

export function OTPInput({
  length = OTP_LENGTH,
  onComplete,
  onChangeCode,
  error,
  disabled,
  shake,
}: OTPInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (shake) setValues(Array(length).fill(""));
  }, [shake, length]);

  const emit = (next: string[]) => {
    setValues(next);
    const code = next.join("");
    onChangeCode?.(code);
    if (code.length === length && !next.includes("")) onComplete(code);
  };

  const handleChange = (index: number, raw: string) => {
    if (disabled) return;
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...values];
    next[index] = digit;
    emit(next);
    if (digit && index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < length - 1) refs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!digits) return;
    const next = digits.split("").concat(Array(length - digits.length).fill(""));
    emit(next);
    refs.current[Math.min(digits.length, length - 1)]?.focus();
  };

  return (
    <div className="space-y-2">
      <div
        className={cn("flex justify-center gap-3", shake && "otp-shake")}
        role="group"
        aria-label="Código de verificação"
      >
        {values.map((v, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`otp-${i}`}
            aria-label={`Dígito ${i + 1}`}
            aria-invalid={!!error}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            disabled={disabled}
            value={v}
            autoFocus={i === 0}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={cn(
              "size-14 rounded-xl border bg-card text-center text-2xl font-bold outline-none transition-colors focus:ring-2 focus:ring-ring/40",
              error
                ? "border-destructive text-destructive"
                : v
                  ? "border-success text-foreground"
                  : "border-border focus:border-primary",
              disabled && "opacity-60",
            )}
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="flex items-center justify-center gap-1.5 text-xs text-destructive">
          <AlertCircle size={13} aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
}
