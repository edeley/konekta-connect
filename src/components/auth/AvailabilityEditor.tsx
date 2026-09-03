import { Copy, Plus, X } from "lucide-react";
import { WEEK_DAYS } from "@/lib/registo-catalog";
import { cn } from "@/lib/utils";

export type TimeRange = { from: string; to: string };
export type DayAvailability = { active: boolean; ranges: TimeRange[] };
export type Availability = Record<string, DayAvailability>;

export const DEFAULT_AVAILABILITY: Availability = Object.fromEntries(
  WEEK_DAYS.map((d) => [
    d.id,
    d.id === "sab" || d.id === "dom"
      ? { active: false, ranges: [{ from: "08:00", to: "12:00" }] }
      : { active: true, ranges: [{ from: "08:00", to: "16:00" }] },
  ]),
) as Availability;

export function summarizeAvailability(a: Availability) {
  const active = WEEK_DAYS.filter((d) => a[d.id]?.active);
  if (!active.length) return "Sem dias definidos";
  return active
    .map((d) => `${d.label} ${a[d.id].ranges.map((r) => `${r.from}–${r.to}`).join(" e ")}`)
    .join(" · ");
}

export function AvailabilityEditor({
  value,
  onChange,
  disabled,
}: {
  value: Availability;
  onChange: (next: Availability) => void;
  disabled?: boolean;
}) {
  const patch = (id: string, next: Partial<DayAvailability>) =>
    onChange({ ...value, [id]: { ...value[id], ...next } });

  const setRange = (id: string, index: number, next: Partial<TimeRange>) =>
    patch(id, { ranges: value[id].ranges.map((r, i) => (i === index ? { ...r, ...next } : r)) });

  const addRange = (id: string) =>
    patch(id, { ranges: [...value[id].ranges, { from: "14:00", to: "18:00" }] });

  const removeRange = (id: string, index: number) =>
    patch(id, { ranges: value[id].ranges.filter((_, i) => i !== index) });

  const copyToAll = (id: string) => {
    const source = value[id];
    onChange(
      Object.fromEntries(
        WEEK_DAYS.map((d) => [
          d.id,
          d.id === id
            ? source
            : { active: source.active, ranges: source.ranges.map((r) => ({ ...r })) },
        ]),
      ) as Availability,
    );
  };

  return (
    <div className={cn("space-y-2", disabled && "pointer-events-none opacity-50")}>
      {WEEK_DAYS.map((day) => {
        const d = value[day.id] ?? { active: false, ranges: [{ from: "08:00", to: "16:00" }] };
        return (
          <div key={day.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={d.active}
                onClick={() => patch(day.id, { active: !d.active })}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  d.active ? "bg-success" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-5 rounded-full bg-card shadow-soft transition-all",
                    d.active ? "left-[1.4rem]" : "left-0.5",
                  )}
                />
              </button>
              <span className="flex-1 text-sm font-bold">{day.label}</span>
              {d.active ? (
                <button
                  type="button"
                  onClick={() => copyToAll(day.id)}
                  className="flex items-center gap-1 text-[11px] font-bold text-primary"
                >
                  <Copy size={12} aria-hidden="true" /> Aplicar a todos
                </button>
              ) : (
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Indisponível
                </span>
              )}
            </div>

            {d.active && (
              <div className="mt-2 space-y-2">
                {d.ranges.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="time"
                      aria-label={`${day.label} — início ${i + 1}`}
                      value={r.from ?? ""}
                      onChange={(e) => setRange(day.id, i, { from: e.target.value })}
                      className="min-h-11 flex-1 rounded-lg border border-border bg-surface px-2 text-xs font-semibold outline-none focus:border-primary"
                    />
                    <span className="text-xs text-muted-foreground">até</span>
                    <input
                      type="time"
                      aria-label={`${day.label} — fim ${i + 1}`}
                      value={r.to ?? ""}
                      onChange={(e) => setRange(day.id, i, { to: e.target.value })}
                      className="min-h-11 flex-1 rounded-lg border border-border bg-surface px-2 text-xs font-semibold outline-none focus:border-primary"
                    />
                    {d.ranges.length > 1 && (
                      <button
                        type="button"
                        aria-label="Remover horário"
                        onClick={() => removeRange(day.id, i)}
                        className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-destructive"
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))}
                {d.ranges.length < 3 && (
                  <button
                    type="button"
                    onClick={() => addRange(day.id)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-primary"
                  >
                    <Plus size={12} aria-hidden="true" /> Adicionar período (ex.: manhã e tarde)
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
