import { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  Headphones,
  Scale,
  Send,
} from "lucide-react";
import { BottomSheet } from "@/components/konekta/kit";
import { toast } from "sonner";

interface ChatMediationModalProps {
  open: boolean;
  onClose: () => void;
  providerName: string;
}

export function ChatMediationModal({ open, onClose, providerName }: ChatMediationModalProps) {
  const [tab, setTab] = useState<"garantias" | "disputa">("garantias");
  const [disputeReason, setDisputeReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmitDispute() {
    if (!disputeReason.trim()) {
      toast.error("Descreva o motivo da contestação.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Pedido de Mediação Aberto!", {
        description:
          "A equipa de suporte e moderação KONEKTA irá analisar o histórico da conversa, fotos e áudios em até 2 horas.",
      });
      setDisputeReason("");
      onClose();
    }, 600);
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Segurança, Garantias & Mediação KONEKTA"
      description="Proteção para clientes e prestadores em São Tomé e Príncipe"
    >
      <div className="space-y-4 pt-1 pb-4">
        {/* Tabs de navegação */}
        <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setTab("garantias")}
            className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === "garantias"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck size={14} className="text-primary" />
            <span>Por que usar o App?</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("disputa")}
            className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === "disputa"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Scale size={14} className="text-amber-600 dark:text-amber-400" />
            <span>Abrir Mediação</span>
          </button>
        </div>

        {tab === "garantias" ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Para proteger a comissão da plataforma e garantir a integridade dos serviços, todas as
              etapas devem ocorrer dentro do ecossistema KONEKTA:
            </p>

            {/* Tabela de Estratégias de Incentivo ao Uso Interno */}
            <div className="space-y-2.5">
              {/* 1. Garantia da Plataforma */}
              <div className="p-3 rounded-2xl bg-card border border-border space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 grid place-items-center shrink-0">
                    <ShieldCheck size={15} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Cliente Protegido
                    </span>
                    <h4 className="text-xs font-bold text-foreground">Garantia da Plataforma</h4>
                  </div>
                </div>
                <p className="text-[11px] text-foreground/80 leading-relaxed pl-9">
                  O cliente só tem direito a suporte oficial, garantia de 30 dias contra avarias e
                  reembolso total se o pagamento for realizado e retido no app. Negociações por fora
                  perdem todas as garantias.
                </p>
              </div>

              {/* 2. Garantia de Recebimento */}
              <div className="p-3 rounded-2xl bg-card border border-border space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 grid place-items-center shrink-0">
                    <Lock size={15} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Prestador Assegurado
                    </span>
                    <h4 className="text-xs font-bold text-foreground">Garantia de Recebimento</h4>
                  </div>
                </div>
                <p className="text-[11px] text-foreground/80 leading-relaxed pl-9">
                  O prestador tem a certeza absoluta de que o dinheiro do cliente já está 100%
                  custodiado no app antes de comprar materiais ou iniciar o trabalho, evitando
                  calotes e atrasos.
                </p>
              </div>

              {/* 3. Histórico e Disputas */}
              <div className="p-3 rounded-2xl bg-card border border-border space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 grid place-items-center shrink-0">
                    <FileText size={15} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Auditoria Imparcial
                    </span>
                    <h4 className="text-xs font-bold text-foreground">Histórico e Mediação</h4>
                  </div>
                </div>
                <p className="text-[11px] text-foreground/80 leading-relaxed pl-9">
                  Registro completo e auditado de áudios, fotos de diagnóstico e mensagens de texto
                  acessível pela equipa jurídica e de moderação da KONEKTA em caso de contestação.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <ShieldAlert
                size={16}
                className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
              />
              <div className="space-y-0.5 text-[11px]">
                <p className="font-bold">Mediação de Disputas KONEKTA</p>
                <p className="text-foreground/80">
                  Se houve discordância sobre a qualidade do serviço ou não cumprimento do prazo com{" "}
                  <strong>{providerName}</strong>, a KONEKTA analisará todo o histórico da conversa
                  e fotos enviadas para decidir o desbloqueio ou reembolso dos fundos em custódia.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Motivo da Contestação / Descrição do Problema:
              </label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={4}
                placeholder="Explique detalhadamente o ocorrido..."
                className="w-full p-3 rounded-2xl bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmitDispute}
              disabled={isSubmitting || !disputeReason.trim()}
              className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>A submeter processo...</span>
              ) : (
                <>
                  <Send size={14} />
                  <span>Submeter para Mediação KONEKTA</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
