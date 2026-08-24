import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Clock, FileText, Settings } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { store, useStore } from "@/lib/store";
import { useAuthFlow } from "@/lib/auth-flow";

export const Route = createFileRoute("/pending-approval")({
  head: () => ({
    meta: [
      { title: "Conta em análise — KONEKTA" },
      {
        name: "description",
        content:
          "A sua conta de prestador KONEKTA está em análise. Verificamos os documentos em até 24h e enviamos uma notificação assim que for aprovada.",
      },
      { property: "og:title", content: "Conta em análise — KONEKTA" },
      { property: "og:description", content: "Verificação de documentos em até 24 horas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PendingApprovalPage,
});

export function PendingApprovalPage() {
  const navigate = useNavigate();
  const flowRole = useAuthFlow((s) => s.role);
  const profiles = useStore((s) => s.profiles);
  const isBoth = flowRole === "both" || (profiles.cliente && profiles.prestador);

  const exploreAsClient = () => {
    store.switchProfile("cliente");
    navigate({ to: "/", replace: true });
  };

  return (
    <AuthLayout showLogo>
      <div className="flex flex-col items-center text-center">
        {/* Badge Pendente */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 dark:bg-amber-950/60 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
          <Clock size={13} aria-hidden="true" /> Pendente
        </span>

        {/* Icon Document search */}
        <div className="mt-5 grid size-20 place-items-center rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-500">
          <FileText size={36} aria-hidden="true" />
        </div>

        <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
          A sua conta está em análise
        </h1>
        <p className="mt-2 max-w-xs text-xs text-muted-foreground leading-relaxed">
          Estamos a verificar os seus documentos. Este processo leva até 24h.
        </p>
      </div>

      {/* Card com Stepper */}
      <div className="mt-6 rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-3.5">
        <div className="flex items-center gap-3">
          <span className="grid size-5 place-items-center rounded-full bg-success/20 text-success shrink-0">
            <Check size={13} strokeWidth={3} />
          </span>
          <span className="text-sm font-bold text-foreground">Cadastro recebido</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="grid size-5 place-items-center rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 shrink-0">
            <Clock size={12} strokeWidth={2.5} />
          </span>
          <span className="text-sm font-bold text-foreground">Verificação de documentos</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="size-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
          <span className="text-sm font-medium text-muted-foreground">Aprovação final</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="size-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
          <span className="text-sm font-medium text-muted-foreground">Conta ativa</span>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Receberá uma notificação quando a sua conta for aprovada.
      </p>

      {/* Ações */}
      <div className="mt-6 space-y-3 text-center">
        <button
          type="button"
          onClick={exploreAsClient}
          className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-xs transition hover:bg-primary/90"
        >
          Explorar como Cliente
        </button>

        <p className="text-[11px] text-muted-foreground px-2">
          Pode usar as funções de cliente enquanto aguarda a aprovação.
        </p>

        <div className="pt-2">
          <Link
            to="/ajuda"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <Settings size={14} aria-hidden="true" /> Precisa de ajuda? Contacte-nos
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
