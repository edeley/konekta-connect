import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ShieldCheck, Sparkles, HandCoins } from "lucide-react";
import { store, useStore } from "@/lib/store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar · KONEKTA" },
      { name: "description", content: "Aceda à KONEKTA para contratar profissionais de confiança em São Tomé e Príncipe." },
      { property: "og:title", content: "Entrar na KONEKTA" },
      { property: "og:description", content: "Serviços de confiança em São Tomé e Príncipe." },
    ],
  }),
  component: AuthPage,
});

const phoneRe = /^[0-9\s+()-]{7,20}$/;

const loginSchema = z.object({
  phone: z.string().trim().regex(phoneRe, "Número inválido"),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "Indique o seu nome").max(60),
  phone: z.string().trim().regex(phoneRe, "Número inválido"),
  email: z.string().trim().email("Email inválido").max(120).optional().or(z.literal("")),
});

function AuthPage() {
  const user = useStore((s) => s.user);
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/", replace: true });
  }, [user, navigate]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    try {
      if (mode === "login") {
        const parsed = loginSchema.parse({ phone: fd.get("phone") });
        store.signIn({ phone: parsed.phone });
      } else {
        const parsed = registerSchema.parse({
          name: fd.get("name"),
          phone: fd.get("phone"),
          email: fd.get("email"),
        });
        store.signIn({ name: parsed.name, phone: parsed.phone, email: parsed.email || undefined });
      }
      navigate({ to: "/", replace: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0]?.message ?? "Verifique os dados");
      } else {
        setError("Ocorreu um erro. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex justify-center">
      <div className="w-full max-w-md min-h-screen flex flex-col">
        <div className="relative overflow-hidden bg-cocoa text-primary-foreground px-6 pt-12 pb-14 rounded-b-[2rem]">
          <div className="absolute -top-16 -right-16 size-56 bg-terracotta/40 blur-3xl rounded-full" />
          <div className="absolute -bottom-20 -left-10 size-48 bg-ocean/30 blur-3xl rounded-full" />
          <div className="relative">
            <div className="flex items-center gap-2 text-primary-foreground/70 text-xs tracking-[0.25em] uppercase">
              <span className="size-2 rounded-full bg-terracotta" />
              KONEKTA · STP
            </div>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-balance">
              Serviços de confiança, ligados a si.
            </h1>
            <p className="mt-2 text-sm text-primary-foreground/70 leading-relaxed">
              Eletricistas, canalizadores, limpeza e mais — com pagamento protegido pela plataforma.
            </p>
          </div>
        </div>

        <div className="flex-1 px-5 -mt-8 relative pb-8">
          <div className="bg-card ring-1 ring-border rounded-2xl p-5 shadow-sm">
            <div className="flex gap-1 p-1 bg-muted rounded-xl">
              <button
                type="button"
                onClick={() => { setMode("login"); setError(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                  mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => { setMode("register"); setError(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                  mode === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Criar conta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3" key={mode}>
              {mode === "register" && (
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Nome completo</span>
                  <input
                    name="name"
                    type="text"
                    autoComplete="name"
                    maxLength={60}
                    required
                    placeholder="Aida Neto"
                    className="mt-1 w-full py-3 px-3 bg-surface ring-1 ring-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40"
                  />
                </label>
              )}
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Telemóvel</span>
                <div className="mt-1 flex items-stretch bg-surface ring-1 ring-border rounded-xl focus-within:ring-2 focus-within:ring-terracotta/40">
                  <span className="px-3 grid place-items-center text-sm text-muted-foreground border-r border-border">
                    +239
                  </span>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    placeholder="991 2345"
                    className="flex-1 py-3 px-3 bg-transparent text-sm focus:outline-none"
                  />
                </div>
              </label>
              {mode === "register" && (
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Email (opcional)</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={120}
                    placeholder="voce@exemplo.st"
                    className="mt-1 w-full py-3 px-3 bg-surface ring-1 ring-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40"
                  />
                </label>
              )}

              {error && (
                <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 bg-terracotta text-primary-foreground rounded-xl py-3 font-semibold text-sm disabled:opacity-60"
              >
                {loading ? "A processar..." : mode === "login" ? "Entrar" : "Criar conta"}
              </button>

              <p className="text-[11px] text-muted-foreground text-center pt-1">
                Ao continuar aceita os Termos e a Política de Privacidade da KONEKTA.
              </p>
            </form>
          </div>

          <ul className="mt-6 space-y-3">
            {[
              { icon: ShieldCheck, title: "Pagamento protegido", text: "O prestador só recebe após confirmar o serviço." },
              { icon: Sparkles, title: "Profissionais verificados", text: "Identidade e reputação validadas." },
              { icon: HandCoins, title: "Preços transparentes", text: "Sem taxas escondidas nem surpresas." },
            ].map((f) => (
              <li key={f.title} className="flex gap-3 items-start bg-card ring-1 ring-border rounded-xl p-3">
                <div className="size-9 rounded-lg bg-terracotta/10 text-terracotta grid place-items-center shrink-0">
                  <f.icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
