import { useState } from "react";
import {
  Calendar,
  Clock,
  Check,
  Copy,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  Moon,
} from "lucide-react";
import { type ProviderWeeklySchedule, DEFAULT_WEEKLY_SCHEDULE } from "@/types/provider-profile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ScheduleGridEditorProps {
  initialSchedule?: ProviderWeeklySchedule[];
  onSave?: (schedule: ProviderWeeklySchedule[]) => void;
  className?: string;
  isReadOnly?: boolean;
}

export function ScheduleGridEditor({
  initialSchedule = DEFAULT_WEEKLY_SCHEDULE,
  onSave,
  className,
  isReadOnly = false,
}: ScheduleGridEditorProps) {
  const [schedule, setSchedule] = useState<ProviderWeeklySchedule[]>(initialSchedule);

  const toggleDay = (dayOfWeek: number) => {
    if (isReadOnly) return;
    setSchedule(
      schedule.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, enabled: !day.enabled } : day,
      ),
    );
  };

  const updateSlot = (
    dayOfWeek: number,
    slotIndex: number,
    field: "start" | "end",
    value: string,
  ) => {
    if (isReadOnly) return;
    setSchedule(
      schedule.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) return day;
        const newSlots = [...day.slots];
        newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
        return { ...day, slots: newSlots };
      }),
    );
  };

  const addSlot = (dayOfWeek: number) => {
    if (isReadOnly) return;
    setSchedule(
      schedule.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) return day;
        return {
          ...day,
          slots: [...day.slots, { start: "14:00", end: "18:00" }],
        };
      }),
    );
  };

  const removeSlot = (dayOfWeek: number, slotIndex: number) => {
    if (isReadOnly) return;
    setSchedule(
      schedule.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) return day;
        if (day.slots.length === 1) {
          return { ...day, enabled: false };
        }
        return {
          ...day,
          slots: day.slots.filter((_, idx) => idx !== slotIndex),
        };
      }),
    );
  };

  const copyToAllWeekdays = () => {
    if (isReadOnly) return;
    const monday = schedule.find((d) => d.dayOfWeek === 1);
    if (!monday) return;

    setSchedule(
      schedule.map((d) => {
        // Dias 1 a 5 (Seg a Sex)
        if (d.dayOfWeek >= 1 && d.dayOfWeek <= 5) {
          return {
            ...d,
            enabled: monday.enabled,
            slots: JSON.parse(JSON.stringify(monday.slots)),
          };
        }
        return d;
      }),
    );
    toast.success("Horário da Segunda-feira replicado para todos os dias úteis (Seg-Sex)!");
  };

  const handleSave = () => {
    if (onSave) onSave(schedule);
    toast.success("Grade de horários e disponibilidade salva com sucesso!");
  };

  return (
    <div
      className={cn("rounded-2xl border border-border bg-card p-4 space-y-4 shadow-2xs", className)}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Calendar size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Horários de Atendimento Semanal</h3>
            <p className="text-[11px] text-muted-foreground">
              Define os dias e horários para agendamento direto de serviços
            </p>
          </div>
        </div>

        {!isReadOnly && (
          <button
            type="button"
            onClick={copyToAllWeekdays}
            className="px-2.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Copiar horário da Segunda para Seg-Sex"
          >
            <Copy size={12} />
            <span className="hidden sm:inline">Copiar Seg-Sex</span>
          </button>
        )}
      </div>

      {/* GRADE DOS 7 DIAS */}
      <div className="space-y-2">
        {schedule.map((day) => {
          return (
            <div
              key={day.dayOfWeek}
              className={cn(
                "p-3 rounded-2xl border transition-all",
                day.enabled
                  ? "bg-card border-border/80 shadow-2xs"
                  : "bg-muted/30 border-border/40 opacity-70",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-[120px]">
                  {!isReadOnly ? (
                    <button
                      type="button"
                      onClick={() => toggleDay(day.dayOfWeek)}
                      className={cn(
                        "size-6 rounded-lg text-[11px] font-bold flex items-center justify-center transition cursor-pointer",
                        day.enabled
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {day.enabled ? "✓" : "—"}
                    </button>
                  ) : (
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        day.enabled ? "bg-emerald-500" : "bg-neutral-400",
                      )}
                    />
                  )}
                  <span className="text-xs font-bold text-foreground">{day.dayName}</span>
                </div>

                {/* SLOTS DE HORÁRIO OU FOLGA */}
                <div className="flex-1 flex flex-wrap items-center justify-end gap-2">
                  {day.enabled ? (
                    day.slots.map((slot, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-xl border border-border/60"
                      >
                        <Clock size={11} className="text-primary shrink-0" />
                        <input
                          type="time"
                          disabled={isReadOnly}
                          value={slot.start}
                          onChange={(e) => updateSlot(day.dayOfWeek, sIdx, "start", e.target.value)}
                          className="bg-transparent text-xs font-bold text-foreground w-[52px] outline-none"
                        />
                        <span className="text-[10px] text-muted-foreground">às</span>
                        <input
                          type="time"
                          disabled={isReadOnly}
                          value={slot.end}
                          onChange={(e) => updateSlot(day.dayOfWeek, sIdx, "end", e.target.value)}
                          className="bg-transparent text-xs font-bold text-foreground w-[52px] outline-none"
                        />
                        {!isReadOnly && day.slots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSlot(day.dayOfWeek, sIdx)}
                            className="text-muted-foreground hover:text-destructive p-0.5 cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Moon size={12} /> Folga programada
                    </span>
                  )}

                  {!isReadOnly && day.enabled && day.slots.length < 3 && (
                    <button
                      type="button"
                      onClick={() => addSlot(day.dayOfWeek)}
                      className="size-7 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer"
                      title="Adicionar turno (ex: tarde)"
                    >
                      <Plus size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* BOTÃO SALVAR */}
      {!isReadOnly && onSave && (
        <button
          type="button"
          onClick={handleSave}
          className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 shadow-md hover:bg-primary/90 transition cursor-pointer"
        >
          <CheckCircle2 size={16} />
          <span>Salvar Grade de Horários</span>
        </button>
      )}
    </div>
  );
}
