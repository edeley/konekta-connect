import { useState } from "react";
import {
  ShieldCheck,
  Star,
  CheckCircle2,
  Clock,
  Award,
  Zap,
  Phone,
  MessageCircle,
  Calendar,
  Share2,
  Heart,
  Eye,
  Settings,
  Lock,
  Sparkles,
  MapPin,
} from "lucide-react";
import { type ProviderProfileContract, type ProviderUIStateMode } from "@/types/provider-profile";
import { Link } from "@tanstack/react-router";
import { formatDb } from "@/lib/pricing-engine";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProviderHeaderAuthorityProps {
  contract: ProviderProfileContract;
  isOwner?: boolean;
  viewMode?: ProviderUIStateMode;
  onToggleViewMode?: (mode: ProviderUIStateMode) => void;
  onOpenBooking?: () => void;
  onOpenKycModal?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function ProviderHeaderAuthority({
  contract,
  isOwner = false,
  viewMode = "VIEW_MODE_PUBLIC",
  onToggleViewMode,
  onOpenBooking,
  onOpenKycModal,
  isFavorite = false,
  onToggleFavorite,
}: ProviderHeaderAuthorityProps) {
  const { personalInfo, metrics, kycStatus, isOnline, coverage } = contract;

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${personalInfo.fullName} — ${personalInfo.primaryCategory} no KONEKTA STP`,
          text: `Contrate ${personalInfo.fullName}, profissional verificado na KONEKTA com nota ${metrics.rating}⭐.`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link do perfil copiado para a área de transferência!");
    }
  };

  return (
    <div className="relative space-y-4">
      {/* BARRA SUPERIOR DO PRESTADOR LOGADO: ALTERNADOR VISÃO PÚBLICA VS PRIVADA */}
      {isOwner && (
        <div className="rounded-2xl bg-neutral-900 text-white p-3 flex items-center justify-between gap-3 shadow-lg border border-neutral-800 animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <span className="size-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold truncate">
              {viewMode === "VIEW_MODE_PUBLIC"
                ? "👁️ Pré-visualização: Visão Pública (O que o cliente enxerga)"
                : "🛠️ Painel Privado do Prestador"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() =>
                onToggleViewMode?.(
                  viewMode === "VIEW_MODE_PUBLIC" ? "VIEW_MODE_SELF" : "VIEW_MODE_PUBLIC",
                )
              }
              className="px-3 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              {viewMode === "VIEW_MODE_PUBLIC" ? (
                <>
                  <Settings size={12} />
                  <span>Modo Gestão</span>
                </>
              ) : (
                <>
                  <Eye size={12} />
                  <span>Ver Como Cliente</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* CARTÃO PRINCIPAL DE AUTORIDADE */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 space-y-4 shadow-2xs relative overflow-hidden">
        {/* Fundo decorativo sutil */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        {/* HEADER: AVATAR, NOME, SELO KYC, BOTÕES DE AÇÃO */}
        <div className="flex items-start gap-4">
          {/* AVATAR COM ANEL DE STATUS */}
          <div className="relative shrink-0">
            <div className="size-20 sm:size-24 rounded-3xl overflow-hidden border-2 border-border shadow-md bg-muted">
              <img
                src={personalInfo.avatarUrl}
                alt={personalInfo.fullName}
                className="size-full object-cover"
              />
            </div>
            {/* Status Online */}
            <span
              className={cn(
                "absolute -bottom-1 -right-1 size-5 rounded-full border-2 border-card flex items-center justify-center shadow-xs",
                isOnline ? "bg-emerald-500" : "bg-neutral-400",
              )}
              title={isOnline ? "Prestador Online no Aplicativo" : "Prestador Offline"}
            >
              <span className="size-2 rounded-full bg-white" />
            </span>
          </div>

          {/* DADOS PRINCIPAIS */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider">
                {personalInfo.primaryCategory}
              </span>

              {/* AÇÕES (Compartilhar & Favorito) */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleShare}
                  className="size-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
                  title="Compartilhar Perfil"
                >
                  <Share2 size={14} />
                </button>
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={onToggleFavorite}
                    className={cn(
                      "size-8 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center transition cursor-pointer",
                      isFavorite
                        ? "text-red-500 bg-red-500/10"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title="Favoritar Prestador"
                  >
                    <Heart size={14} className={isFavorite ? "fill-red-500" : ""} />
                  </button>
                )}
              </div>
            </div>

            <h1 className="text-lg sm:text-xl font-black text-foreground tracking-tight truncate">
              {personalInfo.fullName}
            </h1>

            {/* SELO DE VERIFICAÇÃO KYC */}
            <div className="pt-0.5">
              {kycStatus === "VERIFIED" ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-extrabold shadow-2xs">
                  <ShieldCheck size={14} className="stroke-[2.5]" />
                  <span>Identidade Verificada · Profissional Checado</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenKycModal}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold hover:underline cursor-pointer"
                >
                  <ShieldCheck size={14} />
                  <span>Verificação em Análise</span>
                </button>
              )}
            </div>

            {/* Localização / Distrito */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-0.5">
              <MapPin size={12} className="text-primary" />
              <span>
                {personalInfo.district} · Atende em raio de {coverage.radiusKm} km
              </span>
            </div>
          </div>
        </div>

        {/* MÉTRICAS DE REPUTAÇÃO E AUTORIDADE (GRID DE 4 CARTÕES) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/60">
          {/* NOTA & AVALIAÇÕES */}
          <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/60 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span className="text-sm font-black text-foreground">
                {metrics.rating.toFixed(1)}
              </span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground truncate">
              {metrics.totalReviews} avaliações
            </p>
          </div>

          {/* TRABALHOS CONCLUÍDOS */}
          <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/60 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-primary">
              <CheckCircle2 size={14} />
              <span className="text-sm font-black text-foreground">{metrics.completedJobs}</span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground truncate">
              Serviços Concluídos
            </p>
          </div>

          {/* TEMPO DE RESPOSTA */}
          <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/60 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Zap size={14} />
              <span className="text-sm font-black text-foreground">
                ~{metrics.responseTimeMinutes} min
              </span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground truncate">
              Tempo de Resposta
            </p>
          </div>

          {/* TAXA DE CONCLUSÃO */}
          <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/60 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-primary">
              <Award size={14} />
              <span className="text-sm font-black text-foreground">
                {metrics.completionRatePct}%
              </span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground truncate">Taxa de Sucesso</p>
          </div>
        </div>

        {/* PRIVACIDADE DE CONTATO & BOTÕES DE AÇÃO RÁPIDA (CLIENTE) */}
        <div className="pt-2 border-t border-border/60 space-y-3">
          {/* AVISO DE PRIVACIDADE DE CONTATO */}
          <div className="p-2.5 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock size={13} className="text-primary shrink-0" />
              <span className="text-[11px]">
                Contacto Protegido:{" "}
                <strong className="text-foreground">{personalInfo.phoneMasked}</strong>
              </span>
            </div>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              KONEKTA Seguro
            </span>
          </div>

          {/* BOTÕES DE CHAT E AGENDAMENTO / ORÇAMENTO */}
          <div className="flex items-center gap-2">
            <Link
              to="/chat/$id"
              params={{ id: contract.providerId }}
              className="flex-1 h-12 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-2xs cursor-pointer"
            >
              <MessageCircle size={16} className="text-primary" />
              <span>Mensagem no Chat</span>
            </Link>

            <Link
              to="/orcamento/$providerId"
              params={{ providerId: contract.providerId }}
              className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md hover:bg-primary/90 cursor-pointer"
            >
              <Calendar size={16} />
              <span>Pedir Orçamento</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
