import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Section, KCard, StatusPill } from "@/components/konekta/kit";
import { STPClockBadge } from "@/components/konekta/STPClockBadge";
import { useStore } from "@/lib/store";
import { useSTPClock, STANDARD_STP_SLOTS, isSlotInPastSTP } from "@/lib/stp-time";

export const Route = createFileRoute("/pro/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda em Tempo Real · KONEKTA" },
      {
        name: "description",
        content:
          "Defina a sua disponibilidade semanal e veja os serviços agendados em tempo real na KONEKTA.",
      },
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
  const { time: stpTime, timeShort: stpTimeShort, dateFormatted: stpDateFormatted } = useSTPClock();
  const scheduled = orders.filter((o) => ["aceite", "a-caminho", "em-execucao"].includes(o.status));

  function toggle(d: string) {
    setOpen((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
    toast.success("Disponibilidade atualizada");
  }

  return (
    <AppShell roles={["prestador"]}>
      <header className="px-5 pb-2 pt-8 space-y-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Agenda do Prestador</h1>
          <p className="text-sm text-muted-foreground">
            Gerir horários e serviços sincronizados com São Tomé.
          </p>
        </div>
        <STPClockBadge showGreeting={true} />
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
            Dias com marcações abertas: {open.length === 0 ? "nenhum" : open.join(", ")}
          </p>
        </KCard>
      </Section>

      <Section title="Vagas de Hoje em Aberto">
        <KCard className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Clock size={14} className="text-primary" />
              Horários disponíveis hoje ({stpTimeShort} GMT)
            </span>
            <span className="text-[10px] text-muted-foreground">Tempo real STP</span>
          </div>

          {(() => {
            const openTodaySlots = STANDARD_STP_SLOTS.filter(
              (slot) => !isSlotInPastSTP(slot, 0, 15, stpTime),
            );

            if (openTodaySlots.length === 0) {
              return (
                <div className="py-3 text-center rounded-xl bg-muted/40 border border-border/60">
                  <p className="text-xs text-muted-foreground font-medium">
                    Todos os horários de hoje já foram encerrados ou decorridos.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-4 gap-2">
                {openTodaySlots.map((slot) => (
                  <div
                    key={slot}
                    className="p-2 rounded-xl text-center border bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs shadow-2xs"
                  >
                    <span>{slot}</span>
                    <span className="block text-[8px] font-normal opacity-80 mt-0.5">Livre</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </KCard>
      </Section>

      <Section title="Serviços agendados" className="space-y-3 pb-10">
        {scheduled.length === 0 ? (
          <KCard className="flex items-center gap-3">
            <CalendarDays size={18} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum serviço agendado de momento.</p>
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
