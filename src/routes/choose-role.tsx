import { useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Briefcase, User } from "lucide-react";

export const Route = createFileRoute("/choose-role")({
  head: () => ({
    meta: [
      { title: "Criar conta na KONEKTA — Cliente ou Prestador" },
      {
        name: "description",
        content:
          "Escolha se quer contratar serviços como cliente ou oferecer serviços como prestador na KONEKTA STP.",
      },
      { property: "og:title", content: "Criar conta na KONEKTA" },
      { property: "og:description", content: "Cliente ou prestador — escolha o tipo de conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChooseRole,
});

const options = [
  {
    key: "cliente" as const,
    icon: User,
    title: "Sou Cliente",
    desc: "Quero contratar serviços",
  },
  {
    key: "prestador" as const,
    icon: Briefcase,
    title: "Sou Prestador",
    desc: "Quero oferecer serviços",
  },
];

function ChooseRole() {
  const navigate = useNavigate();
  const router = useRouter();
  const [role, setRole] = useState<"cliente" | "prestador">("cliente");

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto w-full max-w-md px-5 pb-16 pt-6">
        <header className="flex items-center gap-3">
          <button
            onClick={() => router.history.back()}
            aria-label="Voltar"
            className="press grid size-9 place-items-center rounded-full bg-card ring-1 ring-border"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-base font-semibold">Criar conta</h1>
        </header>

        <p className="mt-6 text-xs text-muted-foreground">Selecione o tipo de conta</p>

        <div className="mt-3 space-y-3">
          {options.map((o) => {
            const active = role === o.key;
            const Icon = o.icon;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => setRole(o.key)}
                className={`press flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left ring-1 transition ${
                  active ? "ring-2 ring-primary" : "ring-border"
                }`}
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{o.title}</span>
                  <span className="block text-xs text-muted-foreground">{o.desc}</span>
                </span>
                <span
                  className={`size-4 rounded-full ring-2 ${
                    active ? "bg-primary ring-primary" : "bg-transparent ring-border"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <button
          onClick={() =>
            navigate({ to: role === "cliente" ? "/register/client" : "/register/provider" })
          }
          className="press mt-6 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
