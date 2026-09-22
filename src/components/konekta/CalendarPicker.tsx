import { useState, useMemo, useRef } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarPickerProps {
  value: string; // Formato YYYY-MM-DD
  onChange: (dateStr: string) => void;
  minDate?: string; // Formato YYYY-MM-DD
  className?: string;
  defaultExpanded?: boolean;
}

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const WEEKDAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDatePt(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("pt-PT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function CalendarPicker({
  value,
  onChange,
  minDate,
  className,
  defaultExpanded = true,
}: CalendarPickerProps) {
  const nativeInputRef = useRef<HTMLInputElement>(null);

  const todayStr = useMemo(() => toLocalDateString(new Date()), []);
  const effectiveMinDate = minDate || todayStr;

  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  // Mês visível no calendário
  const [viewDate, setViewDate] = useState<Date>(() => {
    return value ? parseLocalDate(value) : new Date();
  });

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Navegar meses
  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  // Pode voltar atrás no mês se não for anterior ao mês atual do minDate
  const canGoPrev = useMemo(() => {
    const minD = parseLocalDate(effectiveMinDate);
    const minMonthYear = new Date(minD.getFullYear(), minD.getMonth(), 1);
    const currentViewMonthYear = new Date(viewYear, viewMonth, 1);
    return currentViewMonthYear > minMonthYear;
  }, [effectiveMinDate, viewYear, viewMonth]);

  // Dias do mês atual para a grelha
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // Monday as 0, Sunday as 6
    const startOffset = (firstDay.getDay() + 6) % 7;

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isPast: boolean;
      isSelected: boolean;
      isToday: boolean;
    }[] = [];

    // Dias do mês anterior para preenchimento
    for (let i = startOffset - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const d = new Date(viewYear, viewMonth - 1, dNum);
      const dStr = toLocalDateString(d);
      days.push({
        dateStr: dStr,
        dayNumber: dNum,
        isCurrentMonth: false,
        isPast: dStr < effectiveMinDate,
        isSelected: dStr === value,
        isToday: dStr === todayStr,
      });
    }

    // Dias do mês atual
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const d = new Date(viewYear, viewMonth, i);
      const dStr = toLocalDateString(d);
      days.push({
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: true,
        isPast: dStr < effectiveMinDate,
        isSelected: dStr === value,
        isToday: dStr === todayStr,
      });
    }

    // Preencher resto da semana
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(viewYear, viewMonth + 1, i);
      const dStr = toLocalDateString(d);
      days.push({
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: false,
        isPast: dStr < effectiveMinDate,
        isSelected: dStr === value,
        isToday: dStr === todayStr,
      });
    }

    return days;
  }, [viewYear, viewMonth, effectiveMinDate, value, todayStr]);

  // Atalhos rápidos de data
  const quickShortcuts = useMemo(() => {
    const today = new Date();

    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const in3Days = new Date();
    in3Days.setDate(today.getDate() + 3);

    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    // Próximo sábado
    const nextWeekend = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
    const daysUntilSaturday = dayOfWeek === 6 ? 7 : (6 - dayOfWeek + 7) % 7 || 7;
    nextWeekend.setDate(today.getDate() + daysUntilSaturday);

    return [
      { label: "Hoje", dateStr: toLocalDateString(today) },
      { label: "Amanhã", dateStr: toLocalDateString(tomorrow) },
      { label: "+3 Dias", dateStr: toLocalDateString(in3Days) },
      { label: "Fim de Semana", dateStr: toLocalDateString(nextWeekend) },
      { label: "Próx. Semana", dateStr: toLocalDateString(nextWeek) },
    ];
  }, []);

  const handleSelectDate = (dateStr: string) => {
    onChange(dateStr);
    const selectedD = parseLocalDate(dateStr);
    setViewDate(selectedD);
  };

  const handleOpenNativePicker = () => {
    const input = nativeInputRef.current;
    if (input) {
      try {
        if ("showPicker" in input && typeof input.showPicker === "function") {
          input.showPicker();
        } else {
          input.focus();
        }
      } catch {
        input.focus();
      }
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Botão / Cartão de visualização da data selecionada */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded((prev) => !prev);
          }
        }}
        className={cn(
          "flex w-full items-center justify-between rounded-xl bg-card p-3 text-xs font-semibold border transition cursor-pointer shadow-2xs select-none",
          isExpanded
            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
            : "border-border hover:border-primary/50",
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <CalendarIcon size={16} />
          </div>
          <div className="min-w-0 text-left">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Data selecionada do serviço
            </div>
            <div className="truncate text-xs font-bold text-foreground capitalize">
              {formatDatePt(value) || "Clique para escolher a data"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
            {isExpanded ? "Ocultar Calendário" : "Alterar Data ▾"}
          </span>
        </div>
      </div>

      {/* Calendário Interativo Visual */}
      {isExpanded && (
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Atalhos Rápidos */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1">
              Atalhos:
            </span>
            {quickShortcuts.map((sc) => {
              const isSelected = value === sc.dateStr;
              return (
                <button
                  key={sc.label}
                  type="button"
                  onClick={() => handleSelectDate(sc.dateStr)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold transition cursor-pointer border",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-2xs font-bold"
                      : "bg-muted/50 text-foreground border-border/70 hover:bg-muted hover:border-primary/40",
                  )}
                >
                  {sc.label}
                </button>
              );
            })}
          </div>

          {/* Cabeçalho do Mês e Navegação */}
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5 pt-1">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={handlePrevMonth}
              aria-label="Mês anterior"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground transition",
                canGoPrev
                  ? "hover:bg-muted cursor-pointer active:scale-95"
                  : "opacity-30 cursor-not-allowed",
              )}
            >
              <ChevronLeft size={16} />
            </button>

            <div className="text-center font-bold text-xs sm:text-sm text-foreground capitalize">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Próximo mês"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted cursor-pointer active:scale-95 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Cabeçalho dos Dias da Semana */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_NAMES.map((w, idx) => (
              <span
                key={w}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider py-0.5",
                  idx >= 5 ? "text-primary/70" : "text-muted-foreground",
                )}
              >
                {w}
              </span>
            ))}
          </div>

          {/* Grelha dos Dias do Mês */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dayItem) => {
              const { dateStr, dayNumber, isCurrentMonth, isPast, isSelected, isToday } = dayItem;

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={isPast}
                  onClick={() => handleSelectDate(dateStr)}
                  className={cn(
                    "relative flex h-9 sm:h-10 w-full flex-col items-center justify-center rounded-xl text-xs font-semibold transition select-none",
                    // Selecionado
                    isSelected &&
                      "bg-primary text-primary-foreground font-bold shadow-sm ring-2 ring-primary/40",
                    // Não selecionado mas clicável
                    !isSelected &&
                      !isPast &&
                      isCurrentMonth &&
                      "text-foreground hover:bg-primary/10 hover:text-primary cursor-pointer active:scale-95",
                    // Mês adjacente
                    !isSelected &&
                      !isPast &&
                      !isCurrentMonth &&
                      "text-muted-foreground/60 hover:bg-muted/70 cursor-pointer",
                    // Passado / Desabilitado
                    isPast && "text-muted-foreground/30 cursor-not-allowed line-through",
                    // Hoje
                    isToday && !isSelected && "border border-primary/50 font-bold text-primary",
                  )}
                >
                  <span>{dayNumber}</span>
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Opção Alternativa: Seletor Direto do Sistema */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
            <div className="flex items-center gap-2">
              <label
                htmlFor="konekta-native-date-input"
                className="text-[11px] text-muted-foreground font-medium"
              >
                Ou digite/escolha a data:
              </label>
              <input
                id="konekta-native-date-input"
                ref={nativeInputRef}
                type="date"
                min={effectiveMinDate}
                value={value}
                onChange={(e) => {
                  if (e.target.value) {
                    handleSelectDate(e.target.value);
                  }
                }}
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenNativePicker}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted/80 transition cursor-pointer"
            >
              <CalendarDays size={13} className="text-primary" />
              Seletor do Sistema
            </button>
          </div>

          {/* Confirmação e Fechar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={13} />
              <span>Data confirmada para o serviço</span>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <Check size={13} />
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
