import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  Check,
  Briefcase,
  User as UserIcon,
  Lock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { BottomSheet } from "./kit";
import { store, useStore, type ProfileKind } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const meta: Record<ProfileKind, { label: string; hint: string; icon: typeof UserIcon }> = {
  cliente: { label: "Cliente", hint: "Pedir serviços e pagar com segurança", icon: UserIcon },
  prestador: { label: "Prestador", hint: "Receber chamados e gerir serviços", icon: Briefcase },
};

/** Alternar entre perfis da mesma conta, respeitando regulação de verificação e perfil duplo. */
export function ProfileSwitcher({ className }: { className?: string }) {
  const user = useStore((s) => s.user);
  const profiles = useStore((s) => s.profiles);
  const providerProfile = useStore((s) => s.providerProfile);
  const [open, setOpen] = useState(false);
  const [openSingleNotice, setOpenSingleNotice] = useState(false);
  const [openPendingNotice, setOpenPendingNotice] = useState(false);
  const navigate = useNavigate();

  if (!user || user.role === "admin") return null;
  const active: ProfileKind = user.role === "prestador" ? "prestador" : "cliente";
  const dual = Boolean(profiles.cliente && profiles.prestador);
  const isApproved = providerProfile?.status === "aprovado";

  function handleTriggerClick() {
    if (!dual) {
      setOpenSingleNotice(true);
      return;
    }
    setOpen(true);
  }

  function pick(kind: ProfileKind) {
    if (kind === active) {
      setOpen(false);
      return;
    }

    if (kind === "prestador") {
      if (!isApproved) {
        setOpen(false);
        setOpenPendingNotice(true);
        return;
      }
    }

    const success = store.switchProfile(kind);
    if (success) {
      setOpen(false);
      toast.success(`Perfil alterado para ${meta[kind].label}`);
      navigate({ to: kind === "prestador" ? "/pro" : "/", replace: true });
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleTriggerClick}
        className={cn(
          "press flex min-h-12 items-center gap-2 rounded-full bg-accent px-4 py-2 text-accent-foreground shadow-xs cursor-pointer",
          className,
        )}
      >
        <span className="text-[11px] font-medium opacity-70">Perfil</span>
        <span className="text-sm font-bold">{meta[active].label}</span>
        <ChevronDown size={16} />
      </button>

      {/* MODAL PRINCIPAL DE ALTERNÂNCIA DE PERFIL DUPLO */}
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Alternar Perfil da Conta"
        description="Conta com Perfil Duplo (Ambos). Alterne entre pedir serviços e atender clientes."
      >
        <div className="space-y-2.5 pt-1">
          {(["cliente", "prestador"] as ProfileKind[]).map((kind) => {
            const M = meta[kind].icon;
            const isCurrent = kind === active;
            const isProviderBlocked = kind === "prestador" && !isApproved;

            return (
              <button
                key={kind}
                type="button"
                onClick={() => pick(kind)}
                className={cn(
                  "press flex min-h-14 w-full items-center gap-3 rounded-2xl p-4 text-left transition-all border cursor-pointer",
                  isCurrent
                    ? "bg-slate-900 text-white border-slate-800 shadow-sm"
                    : isProviderBlocked
                      ? "bg-amber-500/10 text-slate-800 dark:text-slate-200 border-amber-500/30 hover:bg-amber-500/15"
                      : "bg-muted/60 text-foreground border-border/40 hover:bg-accent/50",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-xl",
                    isCurrent
                      ? "bg-white/10 text-white"
                      : isProviderBlocked
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "bg-card text-primary",
                  )}
                >
                  <M size={18} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-bold">{meta[kind].label}</span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950">
                        Ativo
                      </span>
                    )}
                    {isProviderBlocked && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 flex items-center gap-1">
                        <Lock size={10} />
                        <span>Aguardando Aprovação</span>
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "block text-xs mt-0.5",
                      isCurrent
                        ? "text-slate-300"
                        : isProviderBlocked
                          ? "text-amber-700 dark:text-amber-300"
                          : "text-muted-foreground",
                    )}
                  >
                    {isProviderBlocked
                      ? "Documentos em validação pela KONEKTA STP."
                      : meta[kind].hint}
                  </span>
                </span>

                {isCurrent && <Check size={18} className="text-emerald-400 shrink-0" />}
                {isProviderBlocked && <Lock size={16} className="text-amber-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="press min-h-12 w-full rounded-2xl py-3 text-sm font-semibold text-muted-foreground mt-2"
        >
          Fechar
        </button>
      </BottomSheet>

      {/* AVISO: CONTA DE PERFIL ÚNICO */}
      <BottomSheet
        open={openSingleNotice}
        onClose={() => setOpenSingleNotice(false)}
        title="Conta de Perfil Único"
        description="Regulação de Perfis KONEKTA em São Tomé e Príncipe"
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-1">
              <p className="font-bold">Apenas contas com perfil duplo podem alternar.</p>
              <p>
                A sua conta atual está registada como <strong>Cliente</strong>. Para ter permissão
                de prestar serviços e alternar entre cliente e prestador na mesma conta, é
                necessário ativar o perfil de prestador e submeter os documentos para validação.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpenSingleNotice(false);
              navigate({ to: "/tornar-prestador" });
            }}
            className="press flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-bold text-sm px-4 py-3 shadow-sm"
          >
            <span>Tornar-me Prestador (Ativar Perfil Ambos)</span>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={() => setOpenSingleNotice(false)}
            className="press min-h-12 w-full rounded-2xl py-3 text-sm font-semibold text-muted-foreground"
          >
            Voltar
          </button>
        </div>
      </BottomSheet>

      {/* AVISO: PRESTADOR PENDENTE DE APROVAÇÃO PELA EMPRESA */}
      <BottomSheet
        open={openPendingNotice}
        onClose={() => setOpenPendingNotice(false)}
        title="Acesso de Prestador Bloqueado"
        description="A sua conta ainda não foi aprovada pela equipa KONEKTA"
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <Lock size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-1">
              <p className="font-bold">Validação Documental em Curso</p>
              <p>
                A sua conta possui o modo duplo, mas o seu perfil de prestador ainda não foi
                aprovado pela administração da KONEKTA STP.
              </p>
              <p className="text-[11px] opacity-90">
                Pode continuar a utilizar o aplicativo normalmente como <strong>Cliente</strong>. O
                painel de prestador ficará disponível assim que a verificação for concluída.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpenPendingNotice(false);
              navigate({ to: "/pending-approval" });
            }}
            className="press flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 text-slate-950 font-bold text-sm px-4 py-3 shadow-sm"
          >
            <span>Ver Estado da Verificação</span>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={() => setOpenPendingNotice(false)}
            className="press min-h-12 w-full rounded-2xl py-3 text-sm font-semibold text-muted-foreground"
          >
            Entendido, Continuar como Cliente
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
