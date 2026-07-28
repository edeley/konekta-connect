import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/splash")({
  head: () => ({
    meta: [
      { title: "KONEKTA — A ligar-te aos melhores profissionais" },
      { name: "description", content: "Abrir a KONEKTA, a plataforma de serviços de São Tomé e Príncipe." },
      { property: "og:title", content: "KONEKTA" },
      { property: "og:description", content: "A ligar-te aos melhores profissionais de São Tomé e Príncipe." },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const onboarded = useStore((s) => s.onboarded);

  useEffect(() => {
    const t = setTimeout(() => {
      if (user) navigate({ to: user.role === "prestador" ? "/pro" : "/", replace: true });
      else if (onboarded) navigate({ to: "/auth", replace: true });
      else navigate({ to: "/onboarding", replace: true });
    }, 1400);
    return () => clearTimeout(t);
  }, [navigate, user, onboarded]);

  return (
    <main className="grid min-h-screen place-items-center bg-primary px-6 text-primary-foreground">
      <div className="fade-up flex flex-col items-center gap-4">
        <div className="grid size-20 place-items-center rounded-3xl bg-primary-foreground/15 text-3xl font-black">
          K
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">KONEKTA</h1>
        <p className="text-sm text-primary-foreground/80">Serviços de confiança em São Tomé e Príncipe</p>
        <div className="mt-4 size-6 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
      </div>
    </main>
  );
}
