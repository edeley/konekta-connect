/**
 * KONEKTA Real-Time Engine
 * Fornece sincronização em tempo real entre separadores/sessões,
 * indicadores de presença (online/visto por último), indicador de digitação (typing),
 * alertas sonoros nativos (Web Audio API) e rastreamento de ordens em tempo real.
 */

type RealtimeEventType =
  | "message:sent"
  | "message:typing"
  | "message:read"
  | "quote:sent"
  | "quote:accepted"
  | "order:status_changed"
  | "request:created"
  | "proposal:received";

export type RealtimeEvent = {
  type: RealtimeEventType;
  payload: Record<string, unknown>;
  timestamp: number;
  senderId?: string;
};

// Áudio sintético suave e profissional via Web Audio API (sem ficheiros externos)
class RealtimeSound {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  play(tone: "message" | "quote" | "status" | "pop" | "coin" | "notification" | "pin_error" | "pin_success") {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (tone === "message" || tone === "notification") {
        // Dois tons rápidos agradáveis (587Hz -> 880Hz)
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (tone === "quote" || tone === "coin" || tone === "pin_success") {
        // Acorde alegre ascendente para proposta/orçamento
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (tone === "status" || tone === "pin_error") {
        // Som sutil de confirmação
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else {
        // Pop suave
        osc.type = "sine";
        osc.frequency.setValueAtTime(700, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch {
      // Audio playback fails silently if blocked by user interaction policy
    }
  }
}

export const realtimeAudio = new RealtimeSound();

type EventCallback = (event: RealtimeEvent) => void;

class RealtimeBus {
  private channel: BroadcastChannel | null = null;
  private listeners = new Set<EventCallback>();
  private typingMap: Record<string, boolean> = {};
  private typingListeners = new Set<() => void>();

  constructor() {
    if (typeof window !== "undefined") {
      try {
        if ("BroadcastChannel" in window) {
          this.channel = new BroadcastChannel("konekta_realtime_v1");
          this.channel.onmessage = (e) => {
            if (e.data && typeof e.data === "object") {
              this.handleIncomingEvent(e.data as RealtimeEvent);
            }
          };
        }
      } catch (err) {
        console.warn("BroadcastChannel não suportado neste navegador:", err);
      }

      // Fallback para storage event
      window.addEventListener("storage", (e) => {
        if (e.key === "konekta_rt_event" && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue) as RealtimeEvent;
            this.handleIncomingEvent(parsed);
          } catch {
            // ignore
          }
        }
      });
    }
  }

  private handleIncomingEvent(event: RealtimeEvent) {
    if (event.type === "message:typing") {
      const providerId = event.payload.providerId as string;
      const isTyping = Boolean(event.payload.isTyping);
      if (providerId) {
        this.typingMap[providerId] = isTyping;
        this.notifyTyping();
      }
    }

    this.listeners.forEach((fn) => {
      try {
        fn(event);
      } catch (err) {
        console.error("Erro no listener de tempo real:", err);
      }
    });
  }

  emit(type: RealtimeEventType, payload: Record<string, unknown> = {}) {
    const event: RealtimeEvent = {
      type,
      payload,
      timestamp: Date.now(),
    };

    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch {
        // ignore
      }
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("konekta_rt_event", JSON.stringify(event));
      } catch {
        // ignore
      }
    }

    // Processa também localmente
    this.handleIncomingEvent(event);
  }

  subscribe(callback: EventCallback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Gestão de Digitação (Typing Indicator)
  setTyping(providerId: string, isTyping: boolean) {
    this.typingMap[providerId] = isTyping;
    this.notifyTyping();
    this.emit("message:typing", { providerId, isTyping });
  }

  getTyping(providerId: string): boolean {
    return Boolean(this.typingMap[providerId]);
  }

  subscribeTyping(fn: () => void) {
    this.typingListeners.add(fn);
    return () => {
      this.typingListeners.delete(fn);
    };
  }

  private notifyTyping() {
    this.typingListeners.forEach((fn) => fn());
  }
}

export const realtimeBus = new RealtimeBus();
