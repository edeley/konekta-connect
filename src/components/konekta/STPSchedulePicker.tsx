import { useState, useMemo, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Zap,
  CheckCircle2,
  Sun,
  Sunrise,
  Sunset,
  AlertTriangle,
} from "lucide-react";
import {
  useSTPClock,
  STANDARD_STP_SLOTS,
  isSlotInPastSTP,
  evaluateDaySlotsSTP,
  formatSTPDate,
} from "@/lib/stp-time";

export type ScheduleSelection = {
  isUrgent: boolean;
  scheduledFor: string; // ex: "Hoje, 14:00" ou "Segunda, 17 Ago - 10:00" ou "Urgente (Hoje, o mais rápido possível)"
  dateStr: string;
  timeSlot: string;
};

interface STPSchedulePickerProps {
  value?: string;
  onChange: (selection: ScheduleSelection) => void;
  allowUrgent?: boolean;
}

export function STPSchedulePicker({ value, onChange, allowUrgent = true }: STPSchedulePickerProps) {
  const { time: stpTime, timeShort: stpTimeShort } = useSTPClock();

  // Modo Urgente vs Programado
  const [isUrgent, setIsUrgent] = useState<boolean>(() => {
    return value ? value.toLowerCase().includes("urgente") : false;
  });

  // Dias Próximos (Próximos 7 dias)
  const nextDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const dayOffset = i;
      const evalResult = evaluateDaySlotsSTP(dayOffset, [], STANDARD_STP_SLOTS, 20, today);

      let label = "";
      if (i === 0) label = "Hoje";
      else if (i === 1) label = "Amanhã";
      else {
        label = d.toLocaleDateString("pt-PT", {
          timeZone: "Africa/Sao_Tome",
          weekday: "short",
        });
        label = label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
      }

      const dayNum = d.toLocaleDateString("pt-PT", {
        timeZone: "Africa/Sao_Tome",
        day: "numeric",
      });
      const monthShort = d
        .toLocaleDateString("pt-PT", {
          timeZone: "Africa/Sao_Tome",
          month: "short",
        })
        .replace(".", "");

      const fullFormattedDate = formatSTPDate(d, "full");

      days.push({
        offset: i,
        date: d,
        label,
        formattedShort: `${dayNum} ${monthShort}`,
        fullDate: fullFormattedDate,
        hasAvailable: evalResult.hasAnyAvailable,
        availableSlotsCount: evalResult.availableSlots.length,
      });
    }
    return days;
  }, []);

  // Dia Selecionado
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(() => {
    const todaySlots = evaluateDaySlotsSTP(0, [], STANDARD_STP_SLOTS, 20, new Date());
    return todaySlots.hasAnyAvailable ? 0 : 1;
  });

  const activeDay = nextDays.find((d) => d.offset === selectedDayOffset) || nextDays[0];

  // Avaliação dos Slots do Dia Selecionado
  const daySlotEvaluation = useMemo(() => {
    return evaluateDaySlotsSTP(selectedDayOffset, [], STANDARD_STP_SLOTS, 20, stpTime);
  }, [selectedDayOffset, stpTime]);

  // Horário Selecionado
  const [selectedSlot, setSelectedSlot] = useState<string>(() => {
    if (daySlotEvaluation.availableSlots.length > 0) {
      return daySlotEvaluation.availableSlots[0];
    }
    return "09:30";
  });

  const emitSelection = useCallback(
    (urgent: boolean, dayOffset: number, slot: string) => {
      const targetDay = nextDays.find((d) => d.offset === dayOffset) || nextDays[0];
      if (urgent) {
        onChange({
          isUrgent: true,
          scheduledFor: `⚡ Urgente (Hoje o mais rápido possível, aprox. ${stpTimeShort})`,
          dateStr: "Hoje",
          timeSlot: "Imediato",
        });
      } else {
        const dayPrefix =
          dayOffset === 0
            ? "Hoje"
            : dayOffset === 1
              ? "Amanhã"
              : `${targetDay.label}, ${targetDay.formattedShort}`;

        onChange({
          isUrgent: false,
          scheduledFor: `${dayPrefix}, ${slot}`,
          dateStr: targetDay.fullDate,
          timeSlot: slot,
        });
      }
    },
    [nextDays, onChange, stpTimeShort],
  );

  const handleToggleUrgent = (urgent: boolean) => {
    setIsUrgent(urgent);
    emitSelection(urgent, selectedDayOffset, selectedSlot);
  };

  const handleSelectDay = (dayOffset: number) => {
    setSelectedDayOffset(dayOffset);
    setIsUrgent(false);
    const slotsForDay = evaluateDaySlotsSTP(dayOffset, [], STANDARD_STP_SLOTS, 20, stpTime);
    let chosenSlot = selectedSlot;
    if (slotsForDay.availableSlots.length > 0) {
      if (!slotsForDay.availableSlots.includes(selectedSlot)) {
        chosenSlot = slotsForDay.availableSlots[0];
      }
    }
    setSelectedSlot(chosenSlot);
    emitSelection(false, dayOffset, chosenSlot);
  };

  const handleSelectSlot = (slot: string) => {
    setIsUrgent(false);
    setSelectedSlot(slot);
    emitSelection(false, selectedDayOffset, slot);
  };

  // Divisão dos slots por turnos
  const morningSlots = STANDARD_STP_SLOTS.slice(0, 3); // 08:00, 09:30, 11:00
  const afternoonSlots = STANDARD_STP_SLOTS.slice(3, 6); // 12:30, 14:00, 15:30
  const eveningSlots = STANDARD_STP_SLOTS.slice(6, 8); // 17:00, 18:30

  const renderSlotButton = (slot: string) => {
    const isPast = isSlotInPastSTP(slot, selectedDayOffset, 20, stpTime);
    const isSelected = selectedSlot === slot && !isUrgent && !isPast;

    return (
      <button
        key={slot}
        type="button"
        disabled={isPast}
        onClick={() => handleSelectSlot(slot)}
        className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-between gap-1.5 transition-all ${
          isSelected
            ? "bg-primary text-primary-foreground border-primary shadow-xs ring-1 ring-primary/40 font-bold"
            : isPast
              ? "bg-muted/40 border-border/40 text-muted-foreground/50 cursor-not-allowed line-through"
              : "bg-card hover:bg-muted/70 border-border/80 text-foreground"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <Clock
            size={12}
            className={
              isSelected
                ? "text-primary-foreground"
                : isPast
                  ? "text-muted-foreground/40"
                  : "text-primary"
            }
          />
          <span>{slot}</span>
        </div>
        {isPast && (
          <span className="text-[9px] font-normal text-muted-foreground/60 no-underline">
            Passou
          </span>
        )}
        {isSelected && <CheckCircle2 size={12} className="text-primary-foreground shrink-0" />}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Opção de Atendimento Imediato / Urgente */}
      {allowUrgent && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleToggleUrgent(false)}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
              !isUrgent
                ? "bg-primary/10 border-primary text-primary shadow-2xs"
                : "bg-card border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            <CalendarIcon size={14} />
            Agendar Horário
          </button>

          <button
            type="button"
            onClick={() => handleToggleUrgent(true)}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
              isUrgent
                ? "bg-amber-500 text-amber-950 border-amber-500 shadow-xs ring-2 ring-amber-500/30"
                : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
            }`}
          >
            <Zap size={14} className={isUrgent ? "fill-amber-950" : "fill-amber-500"} />⚡ Urgente
            (Hoje)
          </button>
        </div>
      )}

      {/* Bloco de Urgência Ativado */}
      {isUrgent ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300">
              <Zap size={16} />
            </span>
            <div>
              <h4 className="text-xs font-bold text-amber-950 dark:text-amber-100">
                Atendimento Prioritário Imediato
              </h4>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                O prestador será notificado para deslocação no menor tempo possível hoje.
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-[11px] text-amber-900 dark:text-amber-200 font-mono">
            <span>Hora atual em São Tomé:</span>
            <span className="font-bold">{stpTimeShort} GMT</span>
          </div>
        </div>
      ) : (
        /* Agendamento Normal com Dias e Horários */
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Seletor Horizontal de Dias (7 dias) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Escolha o Dia</span>
              <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                <Clock size={11} className="text-primary" />
                Agora: {stpTimeShort} GMT
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none snap-x">
              {nextDays.map((day) => {
                const isSelected = selectedDayOffset === day.offset;
                return (
                  <button
                    key={day.offset}
                    type="button"
                    onClick={() => handleSelectDay(day.offset)}
                    className={`shrink-0 w-20 py-2.5 px-2 rounded-2xl border text-center transition-all flex flex-col items-center gap-0.5 snap-start ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold scale-[1.02]"
                        : day.hasAvailable
                          ? "bg-card hover:bg-muted border-border text-foreground"
                          : "bg-muted/30 border-border/50 text-muted-foreground/60 opacity-60"
                    }`}
                  >
                    <span className="text-[10px] font-medium uppercase tracking-wider">
                      {day.label}
                    </span>
                    <span className="text-sm font-black tracking-tight">{day.formattedShort}</span>
                    <div className="mt-0.5 flex items-center gap-1">
                      <span
                        className={`size-1.5 rounded-full ${
                          isSelected
                            ? "bg-primary-foreground"
                            : day.hasAvailable
                              ? "bg-emerald-500"
                              : "bg-muted-foreground/40"
                        }`}
                      />
                      <span className="text-[9px] font-medium">
                        {day.availableSlotsCount > 0
                          ? `${day.availableSlotsCount} vagas`
                          : "Sem vagas"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Horários Divididos por Turnos */}
          <div className="space-y-3 bg-muted/20 border border-border/60 rounded-2xl p-3.5">
            {/* Manhã */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                <Sunrise size={12} className="text-amber-500" />
                Manhã (08h - 12h)
              </span>
              <div className="grid grid-cols-3 gap-1.5">{morningSlots.map(renderSlotButton)}</div>
            </div>

            {/* Tarde */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                <Sun size={12} className="text-amber-600" />
                Tarde (12h - 17h)
              </span>
              <div className="grid grid-cols-3 gap-1.5">{afternoonSlots.map(renderSlotButton)}</div>
            </div>

            {/* Fim de Tarde / Noite */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                <Sunset size={12} className="text-indigo-500" />
                Fim de Tarde (17h - 19h)
              </span>
              <div className="grid grid-cols-2 gap-1.5">{eveningSlots.map(renderSlotButton)}</div>
            </div>

            {/* Aviso se hoje não tiver mais vagas */}
            {selectedDayOffset === 0 && !daySlotEvaluation.hasAnyAvailable && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs">
                <AlertTriangle size={14} className="shrink-0" />
                <span>
                  Todos os horários de hoje já passaram. Por favor, escolha amanhã ou outro dia no
                  calendário.
                </span>
              </div>
            )}
          </div>

          {/* Resumo do Horário Selecionado */}
          <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Horário Escolhido:</span>
            <span className="font-bold text-primary flex items-center gap-1">
              <CalendarIcon size={12} />
              {selectedDayOffset === 0
                ? "Hoje"
                : selectedDayOffset === 1
                  ? "Amanhã"
                  : `${activeDay.label}`}{" "}
              às {selectedSlot} (GMT)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
