/**
 * KONEKTA Sound & Alarm Engine
 * Built with Web Audio API for native chimes and system alarm alerts in São Tomé e Príncipe.
 * Zero external audio assets required.
 */

export interface AlarmToneOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  recommendedFor: string;
}

export const AVAILABLE_ALARM_TONES: AlarmToneOption[] = [
  {
    id: "konekta_energy",
    name: "Toque Oficial KONEKTA",
    description: "Pulso duplo penetrante e dinâmico, garantindo despertar imediato.",
    icon: "⚡",
    recommendedFor: "Padrão recomendado",
  },
  {
    id: "classic_clock",
    name: "Despertador Clássico STP",
    description: "Bi-bip tradicional de relógio despertador de cabeceira.",
    icon: "⏰",
    recommendedFor: "Serviços matinais",
  },
  {
    id: "gentle_chime",
    name: "Sino Harmónico Suave",
    description: "Acordes harmónicos relaxantes com decaimento suave.",
    icon: "🔔",
    recommendedFor: "Lembretes e mensagens",
  },
  {
    id: "urgent_siren",
    name: "Alarme de Urgência",
    description: "Frequência modulada e acelerada para chamados imediatos no terreno.",
    icon: "🚨",
    recommendedFor: "Serviços SOS / Imediatos",
  },
  {
    id: "sonar_radar",
    name: "Radar de Proximidade",
    description: "Pulsos acústicos estilo sonar GPS para técnicos a caminho.",
    icon: "📡",
    recommendedFor: "Deslocação no terreno",
  },
];

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
   * Toca uma pré-visualização curta (amostra de 2 segundos) de qualquer toque disponível.
   */
  public playToneSample(toneId: string): void {
    this.stopAlarmSound();
    this.playAlarmSound(2.5, toneId);
  }

  /**
   * Alarme de Horário de Serviço Agendado com suporte a múltiplos toques
   */
  public playAlarmSound(durationSeconds = 8, requestedToneId?: string): void {
    if (this.isAlarmPlaying) {
      this.stopAlarmSound();
    }
    this.isAlarmPlaying = true;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const toneId =
        requestedToneId ||
        (typeof window !== "undefined"
          ? localStorage.getItem("knk_alarm_tone") || "konekta_energy"
          : "konekta_energy");

      let intervalMs = 280;

      const playPulse = () => {
        if (!this.isAlarmPlaying || !this.ctx) return;
        const now = this.ctx.currentTime;

        switch (toneId) {
          case "classic_clock": {
            // Bi-bip tradicional (880Hz e 1046Hz)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.setValueAtTime(1046, now + 0.08);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.16);
            break;
          }

          case "gentle_chime": {
            // Tríade harmónica suave (587Hz -> 740Hz -> 880Hz)
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc1.type = "sine";
            osc2.type = "triangle";
            osc1.frequency.setValueAtTime(587.33, now);
            osc1.frequency.exponentialRampToValueAtTime(740, now + 0.15);
            osc2.frequency.setValueAtTime(880, now);
            osc2.frequency.exponentialRampToValueAtTime(1174, now + 0.2);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.35);
            osc2.stop(now + 0.35);
            break;
          }

          case "urgent_siren": {
            // Sirene modulada rápida (600Hz a 1200Hz)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.linearRampToValueAtTime(1200, now + 0.12);
            osc.frequency.linearRampToValueAtTime(600, now + 0.24);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.24);
            break;
          }

          case "sonar_radar": {
            // Pulso sonar penetrante (1200Hz com eco)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.18);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);
            break;
          }

          case "konekta_energy":
          default: {
            // Padrão KONEKTA digital penetrante (G5 784Hz / B5 987Hz)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "square";
            osc.frequency.setValueAtTime(784, now);
            osc.frequency.setValueAtTime(987.77, now + 0.08);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
            break;
          }
        }
      };

      if (toneId === "gentle_chime") intervalMs = 450;
      else if (toneId === "sonar_radar") intervalMs = 380;
      else if (toneId === "classic_clock") intervalMs = 260;
      else intervalMs = 280;

      playPulse();
      this.alarmInterval = window.setInterval(playPulse, intervalMs);

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
export async function syncWithPhoneCalendarAndAlarms(appointment: {
  title: string;
  description: string;
  location?: string;
  startDate: Date;
  durationMinutes?: number;
  reminderMinutesBefore?: number;
}): Promise<{ shared: boolean; googleUrl: string }> {
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

  const fileName = `konekta-alarme-${Date.now()}.ics`;
  const file = new File([icsContent], fileName, { type: "text/calendar;charset=utf-8" });
  let sharedViaNative = false;

  // 1. Tentar Web Share API nativo no Android/iOS (abre o Seletor do Sistema: Calendário / Alarme / Relógio)
  if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
    try {
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Alarme KONEKTA: ${appointment.title}`,
          text: `Agendamento e alarme sincronizado KONEKTA`,
          files: [file],
        });
        sharedViaNative = true;
      }
    } catch {
      // Utilizador cancelou partilha ou browser rejeitou
    }
  }

  // 2. Se não partilhou nativamente, aciona descarregamento do ficheiro .ics
  if (!sharedViaNative) {
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  const googleUrl = getGoogleCalendarUrl(appointment);
  return { shared: sharedViaNative, googleUrl };
}

/**
 * Tenta configurar ou abrir o alarme nativo do telemóvel Android/iOS
 */
export function openNativeDeviceClock(startDate: Date, title: string): void {
  const hours = startDate.getHours();
  const minutes = startDate.getMinutes();

  // No Android, dispara Intent do Relógio Nativo / Alarme
  const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
  if (isAndroid) {
    const msg = encodeURIComponent(`KONEKTA: ${title}`);
    const intentUrl = `intent:#Intent;action=android.intent.action.SET_ALARM;i.android.intent.extra.HOUR=${hours};i.android.intent.extra.MINUTES=${minutes};s.android.intent.extra.MESSAGE=${msg};b.android.intent.extra.SKIP_UI=false;end`;
    try {
      window.location.href = intentUrl;
      return;
    } catch {
      // fallback
    }
  }

  // Fallback: Google Calendar
  const gUrl = getGoogleCalendarUrl({
    title: `Alarme KONEKTA: ${title}`,
    description: `Serviço agendado no KONEKTA às ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
    startDate,
  });
  window.open(gUrl, "_blank");
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
