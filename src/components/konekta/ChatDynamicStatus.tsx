import { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  Lock,
  ChevronRight,
  KeyRound,
  Check,
  Star,
  Clock,
} from "lucide-react";
import { formatDb } from "@/lib/pricing-engine";
import type { Quote } from "@/lib/store";

export type ChatPhase =
  | "negotiating" // Sem orçamento ativo ou aguardando proposta
  | "quote_pending" // Orçamento formal enviado aguardando aceite e pagamento
  | "escrow_active" // Pago e retido em custódia KONEKTA (Modo Alinhamento de Execução)
  | "completed"; // Concluído e fundos libertados (Modo Avaliação)

interface ChatDynamicStatusProps {
  quote?: Quote | null;
  isClient: boolean;
  serviceTitle?: string;
  onOpenCheckout?: () => void;
  onOpenComposer?: () => void;
  onCompleteService?: () => void;
  onValidateOtp?: (otp: string) => void;
  onOpenReview?: () => void;
  onOpenMediation?: () => void;
}

export function ChatDynamicStatus({
  quote,
  isClient,
  serviceTitle,
  onOpenCheckout,
  onOpenComposer,
  onCompleteService,
  onValidateOtp,
  onOpenReview,
  onOpenMediation,
}: ChatDynamicStatusProps) {
  const [otpInput, setOtpInput] = useState("");
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);

  // Determina a fase do fluxo
  let phase: ChatPhase = "negotiating";
  if (quote) {
    if (quote.status === "pendente") phase = "quote_pending";
    else if (quote.status === "pago") phase = "escrow_active";
    else if (quote.status === "concluido") phase = "completed";
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpInput || otpInput.trim().length < 4) return;
    setIsSubmittingOtp(true);
    setTimeout(() => {
      onValidateOtp?.(otpInput.trim());
      setIsSubmittingOtp(false);
      setOtpInput("");
    }, 400);
  }

  return (
    <div className="px-4 pt-2.5 pb-1">
      <div className="rounded-2xl bg-card border border-border/80 p-3.5 shadow-xs space-y-3">
        {/* Top Header com Fase e Botão de Garantias */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {phase === "negotiating" && (
              <div className="size-7 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 grid place-items-center shrink-0">
                <Clock size={14} />
              </div>
            )}
            {phase === "quote_pending" && (
              <div className="size-7 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 grid place-items-center shrink-0 animate-pulse">
                <FileText size={14} />
              </div>
            )}
            {phase === "escrow_active" && (
              <div className="size-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 grid place-items-center shrink-0">
                <Lock size={14} />
              </div>
            )}
            {phase === "completed" && (
              <div className="size-7 rounded-xl bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 grid place-items-center shrink-0">
                <CheckCircle2 size={14} />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground block truncate">
                  {serviceTitle || "Serviço KONEKTA"}
                </span>
                <span
                  className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                    phase === "negotiating"
                      ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                      : phase === "quote_pending"
                        ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 animate-pulse"
                        : phase === "escrow_active"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {phase === "negotiating" && "Em Negociação"}
                  {phase === "quote_pending" && "Aguardando Pagamento"}
                  {phase === "escrow_active" && "Em Execução (Custódia Ativa)"}
                  {phase === "completed" && "Concluído & Liquidado"}
                </span>
              </div>
              <p className="text-xs font-bold text-foreground truncate">
                {phase === "negotiating" && "Negociação Direta Blindada"}
                {phase === "quote_pending" &&
                  (isClient
                    ? `Proposta: ${formatDb(quote?.gross || 0)}`
                    : `Orçamento Enviado: ${formatDb(quote?.gross || 0)}`)}
                {phase === "escrow_active" && `Custódia Garantida (${formatDb(quote?.gross || 0)})`}
                {phase === "completed" && `Finalizado (${formatDb(quote?.gross || 0)})`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenMediation}
            className="px-2 py-1 rounded-lg bg-muted/70 hover:bg-muted text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition shrink-0 cursor-pointer"
            title="Ver Garantias KONEKTA e Proteção Anti-Evasão"
          >
            <ShieldCheck size={12} className="text-primary" />
            <span>Garantias</span>
          </button>
        </div>

        {/* Action Card Contextual conforme a Etapa */}
        {phase === "negotiating" && (
          <div className="text-[11px] leading-relaxed text-muted-foreground bg-muted/35 p-2.5 rounded-xl border border-border/40 space-y-2">
            <p>
              Negocie os detalhes com proteção. O envio de dados sensíveis é filtrado. O prestador
              deve emitir a proposta formal no chat antes do início.
            </p>
            {!isClient && onOpenComposer && (
              <button
                type="button"
                onClick={onOpenComposer}
                className="w-full py-2 px-3 rounded-xl bg-primary hover:bg-brand-dark text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <FileText size={13} />
                <span>Criar e Enviar Proposta Formal</span>
              </button>
            )}
          </div>
        )}

        {phase === "quote_pending" && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-amber-900 dark:text-amber-200">
                Valor Total do Orçamento:
              </span>
              <strong className="text-sm font-black text-amber-950 dark:text-amber-100 font-mono">
                {formatDb(quote?.gross || 0)}
              </strong>
            </div>
            <p className="text-[11px] text-foreground/80 leading-relaxed">
              {isClient
                ? "O valor ficará retido com segurança na KONEKTA até a sua aprovação final."
                : "Aguardando o cliente aceitar a proposta e realizar a retenção do pagamento em custódia."}
            </p>
            {isClient && onOpenCheckout && (
              <button
                type="button"
                onClick={onOpenCheckout}
                className="w-full py-2.5 px-3 rounded-xl bg-primary hover:bg-brand-dark text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <Lock size={13} />
                <span>Aceitar e Pagar Orçamento ({formatDb(quote?.gross || 0)})</span>
                <ChevronRight size={13} />
              </button>
            )}
          </div>
        )}

        {phase === "escrow_active" && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <Lock size={14} className="text-emerald-600" />
                <span>Modo Execução · Pagamento em Custódia</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                100% Protegido
              </span>
            </div>

            {/* Código OTP para o Cliente */}
            {isClient ? (
              <div className="p-2.5 rounded-lg bg-card border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <KeyRound size={12} className="text-primary" /> Seu Código OTP de Validação:
                  </span>
                  <span className="text-base font-black font-mono tracking-widest text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                    {quote?.completionOtp || "1234"}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Forneça este código de 4 dígitos ao profissional <strong>apenas</strong> após
                  verificar o serviço concluído presencialmente.
                </p>
              </div>
            ) : (
              /* Validação de Código OTP para o Prestador */
              <form
                onSubmit={handleVerifyOtp}
                className="p-2.5 rounded-lg bg-card border border-emerald-500/30 space-y-2"
              >
                <p className="text-[11px] font-medium text-foreground">
                  Trabalho concluído? Peça o código OTP de 4 dígitos ao cliente para libertar os{" "}
                  <strong>{formatDb(quote?.net || 0)}</strong> na sua carteira:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="Código 4 dígitos"
                    className="w-32 text-center font-mono font-black text-sm tracking-widest px-3 py-2 rounded-xl bg-surface border border-border focus:ring-2 focus:ring-primary outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingOtp || otpInput.length < 4}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Check size={14} />
                    <span>{isSubmittingOtp ? "A validar..." : "Validar OTP & Concluir"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {phase === "completed" && (
          <div className="bg-muted/50 border border-border p-3 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Serviço Finalizado com Sucesso
              </span>
              <span className="text-[10px] font-bold text-muted-foreground font-mono">
                Liquidado
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              O pagamento foi libertado com sucesso e a comissão da plataforma foi liquidada.
            </p>
            {isClient && onOpenReview && (
              <button
                type="button"
                onClick={onOpenReview}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-900 dark:text-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Star size={13} className="text-amber-500 fill-amber-500" />
                <span>Avaliar Prestador de Serviços</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
