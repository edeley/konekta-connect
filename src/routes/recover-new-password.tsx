import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { authFlow } from "@/lib/auth-flow";
import { z } from "zod";
import { passwordSchema, passwordStrength } from "@/lib/auth-schemas";
import { cn } from "@/lib/utils";

const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    message: "As palavras-passe não coincidem",
    path: ["confirm"],
  });

export const Route = createFileRoute("/recover-new-password")({
  head: () => ({
    meta: [
      { title: "Criar nova palavra-passe — KONEKTA" },
      {
        name: "description",
        content:
          "Defina uma nova palavra-passe segura para a sua conta KONEKTA e volte a aceder aos seus pedidos e carteira.",
      },
      { property: "og:title", content: "Criar nova palavra-passe — KONEKTA" },
      { property: "og:description", content: "Escolha uma palavra-passe forte e segura." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecoverNewPasswordPage,
});

function RecoverNewPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const strength = passwordStrength(password);
  const valid = newPasswordSchema.safeParse({ password, confirm }).success;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = newPasswordSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setLoading(true);
    setTimeout(() => {
      authFlow.clear();
      setLoading(false);
      toast.success("Palavra-passe alterada com sucesso");
      navigate({ to: "/login", replace: true });
    }, 800);
  };

  return (
    <AuthLayout back showLogo>
      <div className="flex flex-col items-center text-center">
        {/* Icon Lock in soft blue box */}
        <div className="grid size-16 place-items-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
          <Lock size={28} aria-hidden="true" />
        </div>

        <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
          Nova palavra-passe
        </h1>
        <p className="mt-1.5 max-w-xs text-xs text-muted-foreground leading-relaxed">
          Escolha uma palavra-passe segura com pelo menos 8 caracteres.
        </p>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        {/* Campo Nova palavra-passe */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            Nova palavra-passe <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={show ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className={cn(
                "w-full rounded-2xl border bg-card px-4 py-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-primary/40",
                errors.password ? "border-destructive" : "border-border/80",
              )}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
              className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive font-medium">{errors.password}</p>
          )}

          {/* Password strength bar */}
          <div className="pt-1 space-y-1" aria-live="polite">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i < strength.score
                      ? strength.score <= 1
                        ? "bg-destructive"
                        : strength.score === 2
                          ? "bg-warning"
                          : "bg-success"
                      : "bg-muted/60",
                  )}
                />
              ))}
            </div>
            <p className="text-[11px] font-medium text-muted-foreground">{strength.label}</p>
          </div>
        </div>

        {/* Campo Confirmar palavra-passe */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            Confirmar palavra-passe <span className="text-destructive">*</span>
          </label>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            type={show ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            className={cn(
              "w-full rounded-2xl border bg-card px-4 py-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-primary/40",
              errors.confirm ? "border-destructive" : "border-border/80",
            )}
          />
          {errors.confirm && (
            <p className="text-xs text-destructive font-medium">{errors.confirm}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !valid}
          className="mt-2 w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "A guardar..." : "Guardar palavra-passe"}
        </button>
      </form>
    </AuthLayout>
  );
}
