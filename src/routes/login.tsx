import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { store } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar na KONEKTA — Serviços em São Tomé e Príncipe" },
      {
        name: "description",
        content:
          "Entre na sua conta KONEKTA com email ou telefone e contrate profissionais verificados em São Tomé e Príncipe.",
      },
      { property: "og:title", content: "Entrar na KONEKTA" },
      { property: "og:description", content: "Acesso rápido à sua conta de cliente ou prestador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

export function BrandMark({ tone = "primary" }: { tone?: "primary" | "success" }) {
  const bg = tone === "success" ? "bg-success" : "bg-primary";
  const fg = tone === "success" ? "text-success" : "text-primary";
  return (
    <div className="flex items-center gap-2">
      <span className={`grid size-9 place-items-center rounded-full ${bg} text-sm font-bold text-primary-foreground`}>
        K
      </span>
      <div className="leading-tight">
        <p className={`text-base font-extrabold tracking-tight ${fg}`}>KONEKTA STP</p>
        <p className="text-[10px] text-muted-foreground">Conectamos quem precisa a quem sabe fazer</p>
      </div>
    </div>
  );
}

export function TextField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-border outline-none transition focus:ring-2 focus:ring-primary/50"
      />
    </label>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || pass.length < 6) {
      toast.error("Preencha o email/telefone e uma senha com 6+ caracteres.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const isEmail = id.includes("@");
      store.signIn({
        phone: isEmail ? "+239 900 0000" : id.trim(),
        email: isEmail ? id.trim() : undefined,
        name: "Maria Costa",
        role: "cliente",
      });
      store.markOnboarded();
      setLoading(false);
      navigate({ to: "/" });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto w-full max-w-md px-5 pb-16 pt-10">
        <BrandMark />

        <h1 className="mt-8 text-3xl font-extrabold tracking-tight">Bem-vindo!</h1>
        <p className="mt-1 text-sm text-muted-foreground">Entre na sua conta de cliente.</p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <TextField
            label="Email ou telefone"
            placeholder="+239 ..."
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
          <TextField
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          <div className="text-right">
            <Link to="/recover-access" className="text-xs font-semibold text-primary">
              Esqueci minha senha
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="press w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link to="/choose-role" className="font-bold text-primary">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
