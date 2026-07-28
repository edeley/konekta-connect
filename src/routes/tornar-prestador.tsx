import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Briefcase, FileCheck2, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader, Section, KCard, ProgressSteps } from "@/components/konekta/kit";
import { store, useStore } from "@/lib/store";
import { categories } from "@/lib/konekta-data";
import { districts } from "@/lib/catalog";

export const Route = createFileRoute("/tornar-prestador")({
  head: () => ({
    meta: [
      { title: "Tornar-se prestador · KONEKTA" },
      { name: "description", content: "Ative o perfil de prestador na sua conta KONEKTA e comece a receber pedidos em São Tomé e Príncipe." },
      { property: "og:title", content: "Tornar-se prestador · KONEKTA" },
      { property: "og:description", content: "Uma conta, dois perfis. Ative o perfil de prestador em minutos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BecomeProviderPage,
});

function BecomeProviderPage() {
  const user = useStore((s) => s.user);
  const profiles = useStore((s) => s.profiles);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(categories[0].name);
  const [years, setYears] = useState("2");
  const [bio, setBio] = useState("");
  const [price, setPrice] = useState("400");
  const [district, setDistrict] = useState(districts[0]);
  const [radius, setRadius] = useState("10");
  const [idNumber, setIdNumber] = useState("");
  const [selfieOk, setSelfieOk] = useState(false);

  if (profiles.prestador) {
    return (
      <AppShell hideNav>
        <ScreenHeader title="Perfil de prestador" subtitle="Já ativo nesta conta" />
        <Section>
          <KCard>
            <p className="text-sm">O perfil de prestador já está associado à sua conta.</p>
            <button
              type="button"
              onClick={() => navigate({ to: "/pro" })}
              className="press mt-4 min-h-12 w-full rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground"
            >
              Ir para o painel
            </button>
          </KCard>
        </Section>
      </AppShell>
    );
  }

  function submit() {
    store.enableProviderProfile({
      category,
      yearsExperience: Number(years) || 0,
      bio: bio.trim() || `Profissional de ${category} em São Tomé e Príncipe.`,
      services: [{ name: `${category} — serviço base`, price: Number(price) || 0 }],
      district,
      city: district,
      radiusKm: Number(radius) || 5,
      documents: { idNumber, selfieOk },
    });
    toast.success("Perfil de prestador enviado para análise");
    navigate({ to: "/perfil" });
  }

  const inputCls =
    "min-h-12 w-full rounded-2xl bg-muted px-4 text-sm outline-none ring-1 ring-transparent focus:ring-primary";

  return (
    <AppShell hideNav hideFab>
      <ScreenHeader title="Quero prestar serviços" subtitle={`Conta de ${user?.name ?? "KONEKTA"}`} />

      <Section>
        <ProgressSteps step={step} total={3} />
      </Section>

      {step === 1 && (
        <Section title="Dados profissionais" className="space-y-3">
          <KCard className="space-y-3">
            <label className="block text-xs font-semibold text-muted-foreground">Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {categories.map((c) => (
                <option key={c.slug}>{c.name}</option>
              ))}
            </select>
            <label className="block text-xs font-semibold text-muted-foreground">Anos de experiência</label>
            <input value={years} onChange={(e) => setYears(e.target.value)} inputMode="numeric" className={inputCls} />
            <label className="block text-xs font-semibold text-muted-foreground">Preço base (Db)</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" className={inputCls} />
            <label className="block text-xs font-semibold text-muted-foreground">Sobre si</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Descreva a sua experiência…"
              className="w-full rounded-2xl bg-muted p-4 text-sm outline-none ring-1 ring-transparent focus:ring-primary"
            />
          </KCard>
        </Section>
      )}

      {step === 2 && (
        <Section title="Área de atuação" className="space-y-3">
          <KCard className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <MapPin size={14} /> Distrito
            </label>
            <select value={district} onChange={(e) => setDistrict(e.target.value)} className={inputCls}>
              {districts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <label className="block text-xs font-semibold text-muted-foreground">Raio de deslocação (km)</label>
            <input value={radius} onChange={(e) => setRadius(e.target.value)} inputMode="numeric" className={inputCls} />
          </KCard>
        </Section>
      )}

      {step === 3 && (
        <Section title="Documentos" className="space-y-3">
          <KCard className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <FileCheck2 size={14} /> Número do BI
            </label>
            <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className={inputCls} />
            <button
              type="button"
              onClick={() => setSelfieOk(true)}
              className={`press min-h-12 w-full rounded-2xl px-4 text-sm font-semibold ${
                selfieOk ? "bg-success/12 text-success" : "bg-muted text-foreground"
              }`}
            >
              {selfieOk ? "Selfie de verificação enviada" : "Enviar selfie de verificação"}
            </button>
          </KCard>
          <KCard className="flex items-start gap-3 bg-accent/60">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              Todos os pagamentos passam pela KONEKTA. Só poderá receber pedidos após aprovação dos
              documentos.
            </p>
          </KCard>
        </Section>
      )}

      <Section className="pb-12">
        <div className="flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="press min-h-12 flex-1 rounded-full bg-muted text-sm font-semibold"
            >
              Voltar
            </button>
          )}
          <button
            type="button"
            disabled={step === 3 && (!idNumber || !selfieOk)}
            onClick={() => (step < 3 ? setStep(step + 1) : submit())}
            className="press flex min-h-12 flex-[2] items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            <Briefcase size={16} />
            {step < 3 ? "Continuar" : "Enviar para análise"}
          </button>
        </div>
      </Section>
    </AppShell>
  );
}
