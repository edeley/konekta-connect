import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Circle, Clock, FileSearch, LifeBuoy } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoadingButton } from "@/components/auth/LoadingButton";
import { useAuthFlow } from "@/lib/auth-flow";
import { store, useStore } from "@/lib/store";

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

const steps = [
  { label: "Cadastro recebido", done: true },
  { label: "Verificação de documentos", done: false, current: true },
  { label: "Aprovação final", done: false },
  { label: "Conta ativa", done: false },
];

function PendingApprovalPage() {
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
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/12 px-3 py-1 text-xs font-bold text-warning">
          <Clock size={13} aria-hidden="true" /> Pendente
        </span>
        <div className="mx-auto mt-5 grid size-20 place-items-center rounded-3xl bg-warning/10 text-warning">
          <FileSearch size={38} aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight">A sua conta está em análise</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Estamos a verificar os seus documentos. Este processo leva até 24h.
        </p>
      </div>

      <ol className="card-soft mt-7 space-y-3 p-4">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-3 text-sm">
            {s.done ? (
              <CheckCircle2 size={18} className="text-success" aria-hidden="true" />
            ) : s.current ? (
              <Clock size={18} className="text-warning" aria-hidden="true" />
            ) : (
              <Circle size={18} className="text-muted-foreground/50" aria-hidden="true" />
            )}
            <span className={s.done || s.current ? "font-medium" : "text-muted-foreground"}>
              {s.label}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Receberá uma notificação quando a sua conta for aprovada.
      </p>

      <div className="mt-7 space-y-3">
        {isBoth ? (
          <>
            <LoadingButton onClick={exploreAsClient}>Explorar como Cliente</LoadingButton>
            <p className="text-center text-[11px] text-muted-foreground">
              Pode usar as funções de cliente enquanto aguarda a aprovação.
            </p>
          </>
        ) : (
          <LoadingButton variant="outline" onClick={() => navigate({ to: "/" })}>
            Voltar ao Início
          </LoadingButton>
        )}

        <Link
          to="/ajuda"
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <LifeBuoy size={13} aria-hidden="true" /> Precisa de ajuda? Contacte-nos
        </Link>
      </div>
    </AuthLayout>
  );
}
