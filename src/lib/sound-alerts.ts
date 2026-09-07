/**
 * KONEKTA Sound & Alarm Engine
 * Built with Web Audio API for native chimes and system alarm alerts in São Tomé e Príncipe.
 * Zero external audio assets required.
 */

class SoundAlertsEngine {
  private ctx: AudioContext | null = null;
  private alarmOscillators: OscillatorNode[] = [];
  private alarmInterval: number | null = null;
  private isAlarmPlaying = false;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Som de Notificação / Mensagem de Chat (chime suave de dois tons harmónicos)
   */
  public playMessageChime(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.16); // D6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);

      this.triggerVibration([80, 60, 100]);
    } catch {
      // Ignora bloqueios de áudio automáticos do navegador
    }
  }

  /**
   * Alarme de Horário de Serviço Agendado (Toque enérgico pulsado para despertar atenção)
   */
  public playAlarmSound(durationSeconds = 8): void {
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const playPulse = () => {
        if (!this.isAlarmPlaying) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "square";
        // Frequência de alarme digital penetrante
        osc.frequency.setValueAtTime(784, now); // G5
        osc.frequency.setValueAtTime(987.77, now + 0.1); // B5

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
      };

      // Toca pulsos a cada 280ms
      playPulse();
      const interval = window.setInterval(playPulse, 280);
      this.alarmInterval = interval;

      this.triggerVibration([250, 100, 250, 100, 400]);

      // Para automaticamente após a duração especificada
      window.setTimeout(() => {
        this.stopAlarmSound();
      }, durationSeconds * 1000);
    } catch {
      this.isAlarmPlaying = false;
    }
  }

  /**
   * Desliga o alarme sonoro ativo
   */
  public stopAlarmSound(): void {
    this.isAlarmPlaying = false;
    if (this.alarmInterval !== null) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  }

  public getIsAlarmPlaying(): boolean {
    return this.isAlarmPlaying;
  }

  /**
   * Vibração nativa do telemóvel
   */
  public triggerVibration(pattern: number[] = [200, 100, 200]): void {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignora se não for suportado pelo dispositivo
      }
    }
  }
}

export const soundAlerts = new SoundAlertsEngine();

/**
 * Utilitário para gerar e descarregar ficheiro de evento de calendário (.ics) com ALARME nativo do telemóvel.
 * Compatível com iOS (Apple Calendar), Android (Google Calendar / Samsung Calendar) e computadores.
 */
export function syncWithPhoneCalendarAndAlarms(appointment: {
  title: string;
  description: string;
  location?: string;
  startDate: Date;
  durationMinutes?: number;
  reminderMinutesBefore?: number;
}) {
  const duration = appointment.durationMinutes || 60;
  const reminderMinutes = appointment.reminderMinutesBefore ?? 15;
  const endDate = new Date(appointment.startDate.getTime() + duration * 60 * 1000);

  const formatIcsDate = (d: Date): string => {
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const startIso = formatIcsDate(appointment.startDate);
  const endIso = formatIcsDate(endDate);
  const nowIso = formatIcsDate(new Date());

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KONEKTA STP//Agendamento de Servicos//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:konekta-${Date.now()}@konekta.st`,
    `DTSTAMP:${nowIso}`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:${appointment.title}`,
    `DESCRIPTION:${appointment.description.replace(/\n/g, "\\n")}`,
    appointment.location ? `LOCATION:${appointment.location}` : "LOCATION:São Tomé e Príncipe",
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    `TRIGGER:-PT${reminderMinutes}M`,
    "ACTION:DISPLAY",
    `DESCRIPTION:Alarme KONEKTA: ${appointment.title}`,
    "END:VALARM",
    "BEGIN:VALARM",
    `TRIGGER:-PT${reminderMinutes}M`,
    "ACTION:AUDIO",
    "ATTACH;VALUE=URI:Basso",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `konekta-servico-${Date.now()}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Gera URL direto para adicionar ao Google Calendar com alarme
 */
export function getGoogleCalendarUrl(appointment: {
  title: string;
  description: string;
  location?: string;
  startDate: Date;
  durationMinutes?: number;
}): string {
  const duration = appointment.durationMinutes || 60;
  const endDate = new Date(appointment.startDate.getTime() + duration * 60 * 1000);

  const formatGoogleDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: appointment.title,
    details: appointment.description,
    location: appointment.location || "São Tomé e Príncipe",
    dates: `${formatGoogleDate(appointment.startDate)}/${formatGoogleDate(endDate)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
