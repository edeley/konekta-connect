import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoadingButton } from "@/components/auth/LoadingButton";
import { Field } from "@/components/auth/Field";
import { authFlow } from "@/lib/auth-flow";
import { z } from "zod";
import { passwordSchema, passwordStrength } from "@/lib/auth-schemas";

const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    message: "As palavras-passe não coincidem",
    path: ["confirm"],
  });
import { cn } from "@/lib/utils";

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
      <div className="text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent text-primary">
          <Lock size={28} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Nova palavra-passe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha uma palavra-passe segura com pelo menos 8 caracteres.
        </p>
      </div>

      <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
        <Field label="Nova palavra-passe" required error={errors.password}>
          <div className="relative">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={show ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className="k-input pr-11"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
              className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground"
            >
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>

        <div className="space-y-1.5" aria-live="polite">
          <div className="flex gap-1">
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
                    : "bg-muted",
                )}
              />
            ))}
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground">{strength.label}</p>
        </div>

        <Field label="Confirmar palavra-passe" required error={errors.confirm}>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            type={show ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            className="k-input"
          />
        </Field>

        <LoadingButton type="submit" loading={loading} disabled={!valid}>
          Guardar palavra-passe
        </LoadingButton>
      </form>
    </AuthLayout>
  );
}
