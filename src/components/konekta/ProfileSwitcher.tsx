import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, Check, Briefcase, User as UserIcon } from "lucide-react";
import { BottomSheet } from "./kit";
import { store, useStore, type ProfileKind } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const meta: Record<ProfileKind, { label: string; hint: string; icon: typeof UserIcon }> = {
  cliente: { label: "Cliente", hint: "Pedir serviços e pagar", icon: UserIcon },
  prestador: { label: "Prestador", hint: "Receber pedidos e ganhar", icon: Briefcase },
};

/** Etapa 3 — alternar entre perfis da mesma conta, sem terminar sessão. */
export function ProfileSwitcher({ className }: { className?: string }) {
  const user = useStore((s) => s.user);
  const profiles = useStore((s) => s.profiles);
  const providerProfile = useStore((s) => s.providerProfile);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (!user || user.role === "admin") return null;
  const active: ProfileKind = user.role === "prestador" ? "prestador" : "cliente";
  const dual = profiles.cliente && profiles.prestador;

  function pick(kind: ProfileKind) {
    setOpen(false);
    if (kind === active) return;
    if (kind === "prestador" && !profiles.prestador) return;
    store.switchProfile(kind);
    toast.success(`Perfil ${meta[kind].label} ativo`);
    navigate({ to: kind === "prestador" ? "/pro" : "/", replace: true });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (dual ? setOpen(true) : navigate({ to: "/tornar-prestador" }))}
        className={cn(
          "press flex min-h-12 items-center gap-2 rounded-full bg-accent px-4 py-2 text-accent-foreground",
          className,
        )}
      >
        <span className="text-[11px] font-medium opacity-70">Perfil atual</span>
        <span className="text-sm font-bold">{meta[active].label}</span>
        <ChevronDown size={16} />
      </button>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Mudar de perfil"
        description="A mesma conta, dois perfis independentes. A sessão mantém-se ativa."
      >
        {(["cliente", "prestador"] as ProfileKind[]).map((kind) => {
          const M = meta[kind].icon;
          const enabled = profiles[kind];
          const pending = kind === "prestador" && providerProfile?.status !== "aprovado";
          return (
            <button
              key={kind}
              type="button"
              disabled={!enabled}
              onClick={() => pick(kind)}
              className={cn(
                "press flex min-h-14 w-full items-center gap-3 rounded-2xl p-4 text-left transition-colors",
                kind === active ? "bg-accent" : "bg-muted/60 hover:bg-accent/50",
                !enabled && "opacity-50",
              )}
            >
              <span className="grid size-10 place-items-center rounded-xl bg-card text-primary">
                <M size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{meta[kind].label}</span>
                <span className="block text-xs text-muted-foreground">
                  {kind === "prestador" && pending ? "Conta em análise" : meta[kind].hint}
                </span>
              </span>
              {kind === active && <Check size={18} className="text-primary" />}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="press min-h-12 w-full rounded-2xl py-3 text-sm font-semibold text-muted-foreground"
        >
          Cancelar
        </button>
      </BottomSheet>
    </>
  );
}
