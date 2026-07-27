import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, Wallet, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressSteps } from "@/components/konekta/kit";
import { store, useStore } from "@/lib/store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Bem-vindo à KONEKTA — Serviços em São Tomé e Príncipe" },
      {
        name: "description",
        content: "Descubra como pedir um serviço de confiança em menos de 60 segundos com a KONEKTA.",
      },
      { property: "og:title", content: "Bem-vindo à KONEKTA" },
      { property: "og:description", content: "Peça um serviço de confiança em menos de 60 segundos." },
    ],
  }),
  component: Onboarding,
});

const slides = [
  {
    icon: Zap,
    title: "Peça em menos de 60 segundos",
    text: "Escolha a categoria, o profissional e a hora. Simples, rápido e sem chamadas.",
  },
  {
    icon: ShieldCheck,
    title: "Profissionais verificados",
    text: "Todos os prestadores passam por validação de identidade e avaliação dos clientes.",
  },
  {
    icon: Wallet,
    title: "Pagamento protegido",
    text: "O valor fica retido na carteira KONEKTA e só é libertado quando o serviço termina.",
  },
];

function Onboarding() {
  const [i, setI] = useState(0);
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const slide = slides[i];
  const Icon = slide.icon;

  const finish = () => {
    store.markOnboarded();
    navigate({ to: user ? "/" : "/auth", replace: true });
  };

  return (
    <main className="flex min-h-screen justify-center bg-surface">
      <div className="flex w-full max-w-md flex-col px-6 pb-10 pt-8">
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold tracking-tight text-primary">KONEKTA</span>
          <button onClick={finish} className="text-xs font-semibold text-muted-foreground">
            Saltar
          </button>
        </div>

        <div key={i} className="fade-up flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <div className="grid size-28 place-items-center rounded-3xl bg-accent text-accent-foreground">
            <Icon size={44} strokeWidth={1.6} />
          </div>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight">{slide.title}</h1>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{slide.text}</p>
        </div>

        <div className="space-y-5">
          <ProgressSteps step={i + 1} total={slides.length} />
          <Button
            className="h-13 w-full rounded-2xl py-6 text-base font-semibold"
            onClick={() => (i < slides.length - 1 ? setI(i + 1) : finish())}
          >
            {i < slides.length - 1 ? "Continuar" : "Começar agora"}
          </Button>
        </div>
      </div>
    </main>
  );
}
