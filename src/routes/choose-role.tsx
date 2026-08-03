import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { UserSearch, Users, Wrench } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RoleCard } from "@/components/auth/RoleCard";
import { LoadingButton } from "@/components/auth/LoadingButton";
import { authFlow, type FlowRole } from "@/lib/auth-flow";

export const Route = createFileRoute("/choose-role")({
  head: () => ({
    meta: [
      { title: "Como quer usar a KONEKTA? — Cliente ou Prestador" },
      {
        name: "description",
        content:
          "Escolha se quer contratar profissionais, oferecer serviços ou as duas coisas na KONEKTA, em São Tomé e Príncipe.",
      },
      { property: "og:title", content: "Escolha o seu perfil na KONEKTA" },
      { property: "og:description", content: "Cliente, Prestador ou ambos — uma só conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChooseRolePage,
});

const options = [
  {
    value: "client" as FlowRole,
    icon: UserSearch,
    title: "Quero encontrar profissionais",
    description: "Contrate serviços de confiança",
    tone: "primary" as const,
  },
  {
    value: "provider" as FlowRole,
    icon: Wrench,
    title: "Quero oferecer serviços",
    description: "Trabalhe e ganhe dinheiro",
    tone: "warning" as const,
  },
  {
    value: "both" as FlowRole,
    icon: Users,
    title: "Quero contratar e trabalhar",
    description: "Use as duas funcionalidades",
    tone: "success" as const,
  },
];

function ChooseRolePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<FlowRole | null>(null);

  const proceed = () => {
    if (!selected) return;
    authFlow.setRole(selected);
    navigate({ to: selected === "client" ? "/register/client" : "/register/provider" });
  };

  return (
    <AuthLayout back step={1} totalSteps={2}>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Como quer usar a KONEKTA?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha a opção que melhor se adapta a si. Pode mudar mais tarde.
        </p>
      </div>

      <div className="mt-6 space-y-3" role="radiogroup" aria-label="Tipo de conta">
        {options.map((o) => (
          <RoleCard
            key={o.value}
            icon={o.icon}
            title={o.title}
            description={o.description}
            tone={o.tone}
            selected={selected === o.value}
            onClick={() => setSelected(o.value)}
          />
        ))}
      </div>

      <div className="mt-8">
        <LoadingButton disabled={!selected} onClick={proceed}>
          Continuar
        </LoadingButton>
      </div>
    </AuthLayout>
  );
}
