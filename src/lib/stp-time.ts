import { useEffect, useState } from "react";

/**
 * Utilitários de Tempo e Data em Tempo Real sincronizados com São Tomé e Príncipe (GMT / UTC+0)
 * Fuso horário oficial: Africa/Sao_Tome (sem mudança de hora / sem DST)
 */

export const STP_TIMEZONE = "Africa/Sao_Tome";
export const STP_LOCALE = "pt-ST";

/**
 * Retorna os minutos decorridos no dia atual em São Tomé (0 a 1439)
 */
export function getSTPCurrentMinutes(date: Date | number = new Date()): number {
  const d = typeof date === "number" ? new Date(date) : date;
  const timeStr = d.toLocaleTimeString("pt-PT", {
    timeZone: STP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Converte string de hora (ex: "11:30", "08:00") em minutos do dia
 */
export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Verifica se um determinado horário de agendamento já passou em São Tomé
 * @param slot string no formato "HH:mm" (ex: "11:30")
 * @param dayOffset 0 = Hoje, 1 = Amanhã, 2 = Depois de Amanhã...
 * @param bufferMinutes margem de antecedência mínima para deslocação (padrão 20 min)
 */
export function isSlotInPastSTP(
  slot: string,
  dayOffset: number,
  bufferMinutes: number = 20,
  referenceDate: Date | number = new Date(),
): boolean {
  // Se for qualquer dia futuro (Amanhã em diante), não passou
  if (dayOffset > 0) return false;

  const slotMinutes = parseTimeToMinutes(slot);
  const currentSTPMinutes = getSTPCurrentMinutes(referenceDate);

  // Se o horário for menor ou igual à hora atual + margem de deslocação, já passou
  return slotMinutes <= currentSTPMinutes + bufferMinutes;
}

/**
 * Formata hora no fuso de São Tomé (ex: "13:24", "13:24:05")
 */
export function formatSTPTime(
  date: Date | number = new Date(),
  options?: { includeSeconds?: boolean; includeTimezone?: boolean },
): string {
  const d = typeof date === "number" ? new Date(date) : date;
  const timeStr = d.toLocaleTimeString("pt-PT", {
    timeZone: STP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: options?.includeSeconds ? "2-digit" : undefined,
    hour12: false,
  });

  return options?.includeTimezone ? `${timeStr} GMT` : timeStr;
}

/**
 * Formata data no fuso de São Tomé (ex: "14 de Agosto de 2026", "Sex, 14 ago")
 */
export function formatSTPDate(
  date: Date | number = new Date(),
  style: "short" | "medium" | "full" | "weekday-short" = "medium",
): string {
  const d = typeof date === "number" ? new Date(date) : date;

  if (style === "short") {
    return d.toLocaleDateString("pt-PT", {
      timeZone: STP_TIMEZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  if (style === "weekday-short") {
    return d.toLocaleDateString("pt-PT", {
      timeZone: STP_TIMEZONE,
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  if (style === "full") {
    return d.toLocaleDateString("pt-PT", {
      timeZone: STP_TIMEZONE,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return d.toLocaleDateString("pt-PT", {
    timeZone: STP_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formata data e hora completas (ex: "14 ago, 13:25 GMT")
 */
export function formatSTPDateTime(date: Date | number = new Date()): string {
  const d = typeof date === "number" ? new Date(date) : date;
  const datePart = d.toLocaleDateString("pt-PT", {
    timeZone: STP_TIMEZONE,
    day: "numeric",
    month: "short",
  });
  const timePart = d.toLocaleTimeString("pt-PT", {
    timeZone: STP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${datePart}, ${timePart} GMT`;
}

/**
 * Saudação inteligente no horário de São Tomé e Príncipe
 */
export function getSTPGreeting(date: Date | number = new Date()): {
  greeting: string;
  iconName: string;
  period: "manha" | "tarde" | "noite";
} {
  const d = typeof date === "number" ? new Date(date) : date;
  const hourStr = d.toLocaleTimeString("pt-PT", {
    timeZone: STP_TIMEZONE,
    hour: "numeric",
    hour12: false,
  });
  const hour = parseInt(hourStr, 10);

  if (hour >= 5 && hour < 12) {
    return { greeting: "Bom dia", iconName: "🌅", period: "manha" };
  }
  if (hour >= 12 && hour < 18) {
    return { greeting: "Boa tarde", iconName: "☀️", period: "tarde" };
  }
  return { greeting: "Boa noite", iconName: "🌙", period: "noite" };
}

/**
 * Tempo relativo inteligente com precisão em STP
 */
export function timeAgoSTP(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return "Agora mesmo";
  if (diffMin < 60) return `Há ${diffMin} min`;
  if (diffHours < 24) {
    const timeStr = formatSTPTime(timestamp);
    return diffHours === 1 ? `Há 1 hora (${timeStr})` : `Há ${diffHours}h (${timeStr})`;
  }
  if (diffDays === 1) {
    return `Ontem às ${formatSTPTime(timestamp)}`;
  }
  if (diffDays < 7) {
    return `Há ${diffDays} dias`;
  }
  return formatSTPDateTime(timestamp);
}

/**
 * Definição dos slots padrão de atendimento em STP
 */
export const STANDARD_STP_SLOTS = [
  "08:00",
  "09:30",
  "11:00",
  "12:30",
  "14:00",
  "15:30",
  "17:00",
  "18:30",
];

export type SlotInfo = {
  time: string;
  isPast: boolean;
  isOccupied: boolean;
  isAvailable: boolean;
  statusLabel: "Disponível" | "Horário já passou" | "Ocupado";
};

/**
 * Retorna os slots detalhados e filtrados em tempo real para um determinado dia
 */
export function evaluateDaySlotsSTP(
  dayOffset: number,
  occupiedSlots: string[] = [],
  allSlots: string[] = STANDARD_STP_SLOTS,
  bufferMinutes: number = 20,
  referenceDate: Date = new Date(),
): {
  slots: SlotInfo[];
  availableSlots: string[];
  hasAnyAvailable: boolean;
  allPast: boolean;
} {
  const slots: SlotInfo[] = allSlots.map((time) => {
    const isPast = isSlotInPastSTP(time, dayOffset, bufferMinutes, referenceDate);
    const isOccupied = occupiedSlots.includes(time);
    const isAvailable = !isPast && !isOccupied;

    let statusLabel: SlotInfo["statusLabel"] = "Disponível";
    if (isPast) statusLabel = "Horário já passou";
    else if (isOccupied) statusLabel = "Ocupado";

    return {
      time,
      isPast,
      isOccupied,
      isAvailable,
      statusLabel,
    };
  });

  const availableSlots = slots.filter((s) => s.isAvailable).map((s) => s.time);
  const pastSlotsCount = slots.filter((s) => s.isPast).length;
  const allPast = dayOffset === 0 && pastSlotsCount === slots.length;

  return {
    slots,
    availableSlots,
    hasAnyAvailable: availableSlots.length > 0,
    allPast,
  };
}

/**
 * Gera slots rápidos e válidos para agendamento direto
 * Se hoje ainda tiver vagas futuras, inclui Hoje. Se já passaram todas, inclui Amanhã e dias seguintes.
 */
export function getQuickDynamicSlotsSTP(referenceDate: Date = new Date()): string[] {
  const currentMinutes = getSTPCurrentMinutes(referenceDate);
  const result: string[] = [];

  // Avalia slots de Hoje
  const todayFutureSlots = STANDARD_STP_SLOTS.filter(
    (slot) => parseTimeToMinutes(slot) > currentMinutes + 30,
  );

  if (todayFutureSlots.length > 0) {
    result.push(`Hoje, ${todayFutureSlots[0]}`);
    if (todayFutureSlots.length > 1) {
      result.push(`Hoje, ${todayFutureSlots[1]}`);
    }
  }

  // Completa com horários de Amanhã e Depois
  result.push("Amanhã, 09:30");
  result.push("Amanhã, 14:00");
  if (result.length < 4) {
    result.push("Amanhã, 16:30");
  }

  return result.slice(0, 4);
}

/**
 * Hook do relógio em tempo real de São Tomé e Príncipe (atualiza a cada segundo)
 */
export function useSTPClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const timeFormatted = formatSTPTime(time, { includeSeconds: true });
  const timeShort = formatSTPTime(time, { includeSeconds: false });
  const dateFormatted = formatSTPDate(time, "full");
  const dateShort = formatSTPDate(time, "weekday-short");
  const greetingData = getSTPGreeting(time);
  const currentMinutes = getSTPCurrentMinutes(time);

  return {
    time,
    timeFormatted,
    timeShort,
    dateFormatted,
    dateShort,
    greeting: greetingData.greeting,
    greetingIcon: greetingData.iconName,
    period: greetingData.period,
    currentMinutes,
    timezone: "GMT / UTC+0 (São Tomé)",
  };
}
