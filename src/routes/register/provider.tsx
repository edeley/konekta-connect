import { useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Check, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { store } from "@/lib/store";
import { categories } from "@/lib/konekta-data";
import { TextField } from "@/routes/login";

export const Route = createFileRoute("/register/provider")({
  head: () => ({
    meta: [
      { title: "Registo de prestador — KONEKTA STP" },
      {
        name: "description",
        content:
          "Torne-se prestador na KONEKTA: envie os seus dados e documentos e comece a receber pedidos em São Tomé e Príncipe.",
      },
      { property: "og:title", content: "Registo de prestador — KONEKTA" },
      { property: "og:description", content: "Cadastro simples com verificação de documentos em 24h." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterProvider,
});

const docs = [
  { key: "id", label: "Documento de identidade", required: true },
  { key: "residencia", label: "Comprovativo de residência", required: true },
  { key: "certificado", label: "Certificado profissional (opcional)", required: false },
];

function RegisterProvider() {
  const navigate = useNavigate();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    name: "",
    phone: "+239 ",
    email: "",
    category: categories[0].name,
    district: "São Tomé, Água Grande",
    pass: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submitInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.phone.trim().length < 8 || form.pass.length < 6) {
      toast.error("Preencha nome, telefone e uma senha com 6+ caracteres.");
      return;
    }
    setStep(1);
  };

  const finish = () => {
    if (!sent.id || !sent.residencia) {
      toast.error("Envie o documento de identidade e o comprovativo de residência.");
      return;
    }
    store.registerProvider(
      { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() || undefined },
      {
        category: form.category,
        yearsExperience: 1,
        bio: "",
        services: [],
        district: form.district,
        city: "São Tomé",
        radiusKm: 10,
        documents: { selfieOk: true },
      },
    );
    store.markOnboarded();
    navigate({ to: "/pending-approval" });
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto w-full max-w-md px-5 pb-16 pt-6">
        <header className="flex items-center gap-3">
          <button
            onClick={() => (step === 0 ? router.history.back() : setStep(0))}
            aria-label="Voltar"
            className="press grid size-9 place-items-center rounded-full bg-card ring-1 ring-border"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-base font-semibold">
            {step === 0 ? "Bem-vindo, prestador!" : "Envie os seus documentos"}
          </h1>
        </header>

        {step === 0 ? (
          <form onSubmit={submitInfo} className="mt-6 space-y-4">
            <TextField label="Nome completo" placeholder="João Silva" value={form.name} onChange={set("name")} />
            <TextField label="Telefone" placeholder="+239 ..." value={form.phone} onChange={set("phone")} />
            <TextField label="Email" type="email" placeholder="voce@exemplo.st" value={form.email} onChange={set("email")} />
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Categoria principal</span>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-success/50"
              >
                {categories.map((c) => (
                  <option key={c.slug}>{c.name}</option>
                ))}
              </select>
            </label>
            <TextField label="Localização" value={form.district} onChange={set("district")} />
            <TextField
              label="Senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.pass}
              onChange={set("pass")}
            />
            <button
              type="submit"
              className="press w-full rounded-xl bg-success py-3.5 text-sm font-bold text-success-foreground"
            >
              Continuar
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="text-xs text-muted-foreground">Faremos a verificação em até 24h.</p>
            {docs.map((d) => {
              const done = !!sent[d.key];
              return (
                <div
                  key={d.key}
                  className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <FileText size={16} />
                  </span>
                  <span className="min-w-0 flex-1 text-sm">{d.label}</span>
                  <button
                    type="button"
                    onClick={() => setSent((s) => ({ ...s, [d.key]: true }))}
                    className={`press flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      done ? "bg-success/10 text-success" : "bg-success text-success-foreground"
                    }`}
                  >
                    {done ? <Check size={13} /> : <Upload size={13} />}
                    {done ? "Enviado" : "Enviar"}
                  </button>
                </div>
              );
            })}
            <button
              onClick={finish}
              className="press mt-3 w-full rounded-xl bg-success py-3.5 text-sm font-bold text-success-foreground"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
