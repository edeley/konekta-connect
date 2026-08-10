import { useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { store } from "@/lib/store";
import { TextField } from "@/routes/login";

export const Route = createFileRoute("/register/client")({
  head: () => ({
    meta: [
      { title: "Registo de cliente — KONEKTA STP" },
      {
        name: "description",
        content:
          "Crie a sua conta de cliente na KONEKTA em menos de um minuto e peça serviços a profissionais verificados em São Tomé e Príncipe.",
      },
      { property: "og:title", content: "Registo de cliente — KONEKTA" },
      { property: "og:description", content: "Conta de cliente rápida: nome, telefone e localização." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterClient,
});

function RegisterClient() {
  const navigate = useNavigate();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    phone: "+239 ",
    email: "",
    district: "São Tomé, Água Grande",
    pass: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.phone.trim().length < 8 || form.pass.length < 6) {
      toast.error("Preencha nome, telefone e uma senha com 6+ caracteres.");
      return;
    }
    store.registerClient({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      district: form.district,
    });
    store.markOnboarded();
    toast.success("Conta criada com sucesso!");
    navigate({ to: "/" });
  };

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
          <h1 className="text-base font-semibold">Informações</h1>
        </header>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <TextField label="Nome completo" placeholder="Maria Costa" value={form.name} onChange={set("name")} />
          <TextField label="Telefone" placeholder="+239 ..." value={form.phone} onChange={set("phone")} />
          <TextField label="Email" type="email" placeholder="voce@exemplo.st" value={form.email} onChange={set("email")} />
          <TextField label="Localização" placeholder="São Tomé, Água Grande" value={form.district} onChange={set("district")} />
          <TextField
            label="Senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={form.pass}
            onChange={set("pass")}
          />
          <button
            type="submit"
            className="press w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground"
          >
            Continuar
          </button>
        </form>
      </div>
    </div>
  );
}
