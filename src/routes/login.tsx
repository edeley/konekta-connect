import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { LoadingButton } from "@/components/auth/LoadingButton";
import { authFlow } from "@/lib/auth-flow";
import { DEMO_OTP, emailSchema, maskPhone, phoneSchema } from "@/lib/auth-schemas";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar na KONEKTA — Serviços em São Tomé e Príncipe" },
      {
        name: "description",
        content:
          "Entre na KONEKTA com o seu número +239 e receba um código de verificação. Contrate profissionais verificados em São Tomé e Príncipe.",
      },
      { property: "og:title", content: "Entrar na KONEKTA" },
      { property: "og:description", content: "Autenticação rápida por telemóvel +239." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [digits, setDigits] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const full = `+239${digits}`;
  const phoneValid = phoneSchema.safeParse(full).success;
  const emailValid = email.length > 0 && emailSchema.safeParse(email).success;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (mode === "phone") {
      if (!phoneValid) {
        setError("Número inválido. Use 9 dígitos começando por 9.");
        return;
      }
      setError(undefined);
      setLoading(true);
      setTimeout(() => {
        authFlow.setPhone(full);
        authFlow.resetOtp();
        setLoading(false);
        toast.success(`Código enviado para ${maskPhone(full)}`, {
          description: `Código de demonstração: ${DEMO_OTP}`,
        });
        navigate({ to: "/verify-otp" });
      }, 900);
      return;
    }

    if (!emailValid) {
      setError("Email inválido.");
      return;
    }
    setError(undefined);
    setLoading(true);
    setTimeout(() => {
      authFlow.setEmail(email);
      authFlow.setPhone(full.length > 4 ? full : "+239900000000");
      authFlow.resetOtp();
      setLoading(false);
      toast.success(`Código enviado para ${email}`, {
        description: `Código de demonstração: ${DEMO_OTP}`,
      });
      navigate({ to: "/verify-otp" });
    }, 900);
  };

  return (
    <AuthLayout>
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">Bem-vindo de volta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "phone"
            ? "Entre com o seu número de telemóvel"
            : "Entre com o seu endereço de email"}
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        {mode === "phone" ? (
          <PhoneInput value={digits} onChange={setDigits} error={error} disabled={loading} autoFocus />
        ) : (
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-sm font-semibold">
              Email <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40">
              <Mail size={16} className="text-muted-foreground" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                aria-invalid={!!error}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-11 w-full bg-transparent text-base outline-none"
              />
            </div>
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
          </div>
        )}

        <LoadingButton type="submit" loading={loading} disabled={mode === "phone" ? !phoneValid : !emailValid}>
          Enviar Código
        </LoadingButton>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          ou
          <span className="h-px flex-1 bg-border" />
        </div>

        <LoadingButton
          variant="outline"
          onClick={() => {
            setError(undefined);
            setMode(mode === "phone" ? "email" : "phone");
          }}
        >
          {mode === "phone" ? "Entrar com Email" : "Entrar com Telemóvel"}
        </LoadingButton>
      </form>

      <div className="mt-8 space-y-3 text-center text-sm">
        <p className="text-muted-foreground">
          Não tem conta?{" "}
          <Link to="/choose-role" className="font-semibold text-primary hover:underline">
            Cadastre-se
          </Link>
        </p>
        <Link to="/recover-access" className="block text-xs font-semibold text-muted-foreground hover:underline">
          Esqueceu o código? Recuperar acesso
        </Link>
      </div>
    </AuthLayout>
  );
}
