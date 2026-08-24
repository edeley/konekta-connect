import { useState } from "react";
import { ShieldCheck, KeyRound, Copy, CheckCheck, AlertCircle } from "lucide-react";
import { KCard } from "./kit";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClientPinCardProps {
  orderId: string;
  pinCode: string;
  totalAmount: number;
  serviceTitle: string;
  onDirectRelease?: () => void;
  className?: string;
}

export function ClientPinCard({
  orderId,
  pinCode,
  totalAmount,
  serviceTitle,
  onDirectRelease,
  className,
}: ClientPinCardProps) {
  const [copied, setCopied] = useState(false);
  const cleanPin = (pinCode || "4829").slice(0, 4);

  const handleCopy = () => {
    navigator.clipboard?.writeText(cleanPin);
    setCopied(true);
    toast.success("Código PIN de validação copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <KCard
      id={`client-pin-card-${orderId}`}
      className={cn(
        "border-2 border-primary/40 bg-linear-to-b from-primary/10 via-primary/5 to-transparent shadow-md space-y-4 p-5 rounded-3xl animate-scaleUp",
        className,
      )}
    >
      {/* CABEÇALHO COM BADGE DE SEGURANÇA */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
          <div className="size-7 rounded-lg bg-primary text-primary-foreground grid place-items-center shrink-0">
            <KeyRound size={15} />
          </div>
          <span>Código PIN de Custódia KONEKTA</span>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold border border-emerald-600/20">
          <ShieldCheck size={13} />
          <span>Valor Seguro Retido</span>
        </div>
      </div>

      {/* REGRA DE SEGURANÇA OSTENSIVA */}
      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 flex items-start gap-2.5">
        <AlertCircle size={17} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 dark:text-amber-200 font-semibold leading-relaxed">
          <strong>Aviso de Segurança:</strong> Forneça este código ao prestador{" "}
          <span className="underline decoration-amber-500 font-black">
            APENAS quando o serviço estiver 100% concluído a seu gosto
          </span>
          . A digitação deste PIN pelo técnico autoriza a libertação definitiva dos fundos.
        </p>
      </div>

      {/* DISPLAY DE 4 DÍGITOS ESTILIZADOS */}
      <div className="space-y-1 text-center py-1">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          O seu código de 4 dígitos
        </p>
        <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 pt-1.5">
          {cleanPin.split("").map((digit, index) => (
            <div
              key={index}
              className="size-14 sm:size-16 rounded-2xl bg-card border-2 border-primary/40 shadow-sm grid place-items-center text-2xl sm:text-3xl font-black text-primary font-mono tracking-tighter"
            >
              {digit}
            </div>
          ))}
        </div>
      </div>

      {/* AÇÕES DE CÓPIA E LIBERTAÇÃO MANUAL */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-primary/20">
        <button
          type="button"
          id={`btn-copy-pin-${orderId}`}
          onClick={handleCopy}
          className="press px-4 py-2.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground flex items-center gap-2 hover:bg-muted transition shadow-2xs"
        >
          {copied ? (
            <CheckCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Copy size={15} />
          )}
          <span>{copied ? "Copiado!" : "Copiar Código"}</span>
        </button>

        {onDirectRelease && (
          <button
            type="button"
            id={`btn-direct-release-${orderId}`}
            onClick={onDirectRelease}
            className="press px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <ShieldCheck size={15} />
            <span>Validar e Libertar pelo Telemóvel</span>
          </button>
        )}
      </div>
    </KCard>
  );
}
