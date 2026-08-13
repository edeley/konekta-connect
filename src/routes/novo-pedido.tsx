import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Check, MapPin, Navigation, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader, Section, KCard, ProgressSteps } from "@/components/konekta/kit";
import { Button } from "@/components/ui/button";
import { categories } from "@/lib/konekta-data";
import { categoryEmoji, districts, formatDb } from "@/lib/catalog";
import { store } from "@/lib/store";
import { urgencyLabel, type RequestUrgency } from "@/lib/requests";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/novo-pedido")({
  head: () => ({
    meta: [
      { title: "Publicar pedido · KONEKTA" },
      {
        name: "description",
        content:
          "Descreva o que precisa e receba propostas de prestadores verificados em São Tomé e Príncipe em minutos.",
      },
      { property: "og:title", content: "Publicar pedido · KONEKTA" },
      { property: "og:description", content: "Receba várias propostas e escolha a melhor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewRequest,
});

const urgencies: RequestUrgency[] = ["urgente", "esta-semana", "sem-pressa"];

function NewRequest() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [district, setDistrict] = useState(districts[0]);
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [urgency, setUrgency] = useState<RequestUrgency>("esta-semana");
  const [budget, setBudget] = useState("");
  const [photos, setPhotos] = useState(0);

  const category = categories.find((c) => c.slug === categorySlug);
  const canNext =
    (step === 1 && !!categorySlug) ||
    (step === 2 && title.trim().length >= 5 && description.trim().length >= 15) ||
    (step === 3 && !!district) ||
    step === 4;

  function publish() {
    if (!category) return;
    const req = store.createRequest({
      categorySlug: category.slug,
      categoryName: category.name,
      title: title.trim(),
      description: description.trim(),
      district,
      address: address.trim() || undefined,
      urgency,
      budget: budget ? Number(budget) : undefined,
      photos,
    });
    navigate({ to: "/pedido/$id", params: { id: req.id } });
  }

  return (
    <AppShell hideNav hideFab>
      <ScreenHeader title="Publicar pedido" subtitle={`Passo ${step} de 4`} />
      <Section>
        <ProgressSteps step={step} total={4} />
      </Section>

      {step === 1 && (
        <Section title="Que serviço precisa?">
          <div className="grid grid-cols-2 gap-3">
            {categories.map((c) => {
              const active = categorySlug === c.slug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setCategorySlug(c.slug)}
                  className={cn(
                    "press flex items-center gap-2 rounded-2xl p-4 text-left shadow-soft transition-colors",
                    active ? "bg-primary text-primary-foreground" : "bg-card",
                  )}
                >
                  <span className="text-xl">{categoryEmoji[c.slug] ?? "🛠️"}</span>
                  <span className="min-w-0 truncate text-sm font-semibold">{c.name}</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {step === 2 && (
        <Section title="Descreva o trabalho">
          <div className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Instalação de tomadas na sala"
              className="w-full rounded-2xl bg-card p-4 text-sm shadow-soft outline-none ring-primary/30 focus:ring-2"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Explique o que precisa, o estado atual e se já tem material. Quanto mais detalhe, melhores as propostas."
              className="w-full rounded-2xl bg-card p-4 text-sm shadow-soft outline-none ring-primary/30 focus:ring-2"
            />
            <button
              type="button"
              onClick={() => setPhotos((n) => n + 1)}
              className="press flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-soft"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Camera size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">Adicionar fotografias</span>
                <span className="block text-xs text-muted-foreground">
                  {photos > 0 ? `${photos} foto(s) anexada(s)` : "Opcional — ajuda o prestador a orçamentar"}
                </span>
              </span>
            </button>
          </div>
        </Section>
      )}

      {step === 3 && (
        <Section title="Onde vai ser o pedido?">
          <div className="space-y-3">
            <KCard>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Distrito do serviço</p>
              <div className="flex flex-wrap gap-2">
                {districts.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDistrict(d)}
                    className={cn(
                      "press rounded-full px-3 py-1.5 text-xs font-semibold",
                      d === district ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </KCard>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-4 text-muted-foreground" />
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Morada onde vai ser o serviço"
                className="w-full rounded-2xl bg-card p-4 pl-10 text-sm shadow-soft outline-none ring-primary/30 focus:ring-2"
              />
            </div>
            <div className="relative">
              <Navigation size={16} className="absolute left-4 top-4 text-muted-foreground" />
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ponto de referência ou de encontro (ex.: junto à farmácia)"
                className="w-full rounded-2xl bg-card p-4 pl-10 text-sm shadow-soft outline-none ring-primary/30 focus:ring-2"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A morada exata só é partilhada com o prestador que escolher.
            </p>
            <KCard>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Urgência</p>
              <div className="grid gap-2">
                {urgencies.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUrgency(u)}
                    className={cn(
                      "press flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold",
                      u === urgency ? "bg-accent text-accent-foreground" : "bg-muted/60 text-muted-foreground",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {u === "urgente" && <Zap size={14} />}
                      {urgencyLabel[u]}
                    </span>
                    {u === urgency && <Check size={16} />}
                  </button>
                ))}
              </div>
            </KCard>
            <div>
              <input
                value={budget}
                inputMode="numeric"
                onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))}
                placeholder="Orçamento previsto em Db (opcional)"
                className="w-full rounded-2xl bg-card p-4 text-sm shadow-soft outline-none ring-primary/30 focus:ring-2"
              />
            </div>
          </div>
        </Section>
      )}

      {step === 4 && (
        <Section title="Rever e publicar">
          <KCard className="space-y-3">
            <Row label="Categoria" value={category?.name ?? "—"} />
            <Row label="Título" value={title} />
            <Row label="Descrição" value={description} />
            <Row label="Local" value={address ? `${district} · ${address}` : district} />
            <Row label="Urgência" value={urgencyLabel[urgency]} />
            <Row label="Orçamento" value={budget ? formatDb(Number(budget)) : "Aberto a propostas"} />
            <Row label="Fotografias" value={photos > 0 ? `${photos}` : "Nenhuma"} />
          </KCard>
          <p className="mt-3 text-xs text-muted-foreground">
            O seu contacto só é partilhado com o prestador que escolher. Publicar é gratuito.
          </p>
        </Section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md gap-3 bg-surface/95 p-4 backdrop-blur-md">
        {step > 1 && (
          <Button variant="outline" className="h-12 flex-1 rounded-2xl" onClick={() => setStep(step - 1)}>
            Voltar
          </Button>
        )}
        <Button
          className="h-12 flex-[2] rounded-2xl text-base font-bold"
          disabled={!canNext}
          onClick={() => (step === 4 ? publish() : setStep(step + 1))}
        >
          {step === 4 ? "Publicar pedido" : "Continuar"}
        </Button>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 font-medium">{value || "—"}</span>
    </div>
  );
}
