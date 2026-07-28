import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Section, KCard, StatusPill } from "@/components/konekta/kit";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/pro/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda · KONEKTA" },
      { name: "description", content: "Defina a sua disponibilidade semanal e veja os serviços agendados na KONEKTA." },
      { property: "og:title", content: "Agenda · KONEKTA" },
      { property: "og:description", content: "Disponibilidade e serviços agendados do prestador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProAgenda,
});

const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function ProAgenda() {
  const orders = useStore((s) => s.orders);
  const [open, setOpen] = useState<string[]>(["Seg", "Ter", "Qua", "Qui", "Sex"]);
  const scheduled = orders.filter((o) => ["aceite", "a-caminho", "em-execucao"].includes(o.status));

  function toggle(d: string) {
    setOpen((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
    toast.success("Disponibilidade atualizada");
  }

  return (
    <AppShell roles={["prestador"]}>
      <header className="px-5 pb-2 pt-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Agenda</h1>
        <p className="text-sm text-muted-foreground">Gerir disponibilidade e serviços marcados.</p>
      </header>

      <Section title="Disponibilidade semanal">
        <KCard>
          <div className="flex flex-wrap gap-2">
            {days.map((d) => {
              const on = open.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggle(d)}
                  className={`press min-h-12 min-w-12 rounded-2xl px-3 text-xs font-bold transition-colors ${
                    on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Dias ativos: {open.length === 0 ? "nenhum" : open.join(", ")}
          </p>
        </KCard>
      </Section>

      <Section title="Serviços agendados" className="space-y-3 pb-10">
        {scheduled.length === 0 ? (
          <KCard className="flex items-center gap-3">
            <CalendarDays size={18} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum serviço agendado.</p>
          </KCard>
        ) : (
          scheduled.map((o) => (
            <KCard key={o.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{o.service}</p>
                <p className="text-xs text-muted-foreground">{o.scheduledFor}</p>
              </div>
              <StatusPill tone="primary">Agendado</StatusPill>
            </KCard>
          ))
        )}
      </Section>
    </AppShell>
  );
}
