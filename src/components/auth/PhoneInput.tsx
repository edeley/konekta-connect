import { forwardRef, useId } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhoneDigits } from "@/lib/auth-schemas";

export type PhoneInputProps = {
  /** Apenas os 9 dígitos nacionais, sem prefixo. */
  value: string;
  onChange: (digits: string) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
  autoFocus?: boolean;
};

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  { value, onChange, error, disabled, label = "Telemóvel", autoFocus },
  ref,
) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label} <span className="text-destructive">*</span>
      </label>
      <div
        className={cn(
          "flex items-stretch overflow-hidden rounded-xl border bg-card transition-colors focus-within:ring-2 focus-within:ring-ring/40",
          error ? "border-destructive" : "border-border focus-within:border-primary",
          disabled && "opacity-60",
        )}
      >
        <span
          aria-hidden="true"
          className="grid select-none place-items-center bg-muted px-3.5 text-sm font-semibold text-muted-foreground"
        >
          +239
        </span>
        <input
          ref={ref}
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder="9XX XXXXXX"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          value={formatPhoneDigits(value)}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 9))}
          className="min-h-11 w-full bg-transparent px-3 text-base tracking-wide outline-none placeholder:text-muted-foreground/70"
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle size={13} aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
});
