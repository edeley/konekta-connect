import { toast } from "sonner";
import { store } from "./store";
import { getSTPPreciseGPS, identifySTPZone } from "./stp-geo";

export type SyncScheduleEvent = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm or period description
  providerName?: string;
  clientName?: string;
  categoryName?: string;
  urgency?: string;
  price?: number;
  latitude?: number;
  longitude?: number;
  alarmMinutesBefore?: number[]; // e.g. [15, 60]
  createdAt: number;
};

export type SavedAlarm = {
  id: string;
  eventId: string;
  title: string;
  targetTimestamp: number; // exact epoch ms
  minutesBefore: number;
  triggered: boolean;
  dateFormatted: string;
  timeFormatted: string;
};

export type GPSLocationResult = {
  latitude: number;
  longitude: number;
  accuracy: number;
  district: string;
  zone?: string;
  street?: string;
  formattedAddress: string;
  mapsUrl: string;
  directionsUrl: string;
  wazeUrl?: string;
  appleMapsUrl?: string;
  geoUri?: string;
  shareMessage?: string;
};

const SYNC_EVENTS_KEY = "konekta_sync_events";
const ALARMS_KEY = "konekta_scheduled_alarms";

// --- 1. GPS & GEOLOCATION (São Tomé e Príncipe Centroids & Proximity) ---
const STP_DISTRICT_COORDINATES = [
  { name: "Água Grande", lat: 0.3365, lng: 6.7273 }, // São Tomé Capital
  { name: "Mé-Zóchi", lat: 0.2989, lng: 6.6491 }, // Trindade
  { name: "Lobata", lat: 0.3601, lng: 6.6608 }, // Guadalupe
  { name: "Cantagalo", lat: 0.2201, lng: 6.7051 }, // Santana
  { name: "Lembá", lat: 0.3583, lng: 6.5504 }, // Neves
  { name: "Caué", lat: 0.1384, lng: 6.6471 }, // São João dos Angolares
  { name: "Pagué (Príncipe)", lat: 1.6385, lng: 7.4201 }, // Santo António do Príncipe
];

export function detectSTPDistrictFromCoords(lat: number, lng: number): string {
  // Find nearest district centroid using Euclidean distance
  let minDistance = Infinity;
  let closestDistrict = "Água Grande";

  for (const item of STP_DISTRICT_COORDINATES) {
    const dist = Math.hypot(lat - item.lat, lng - item.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestDistrict = item.name;
    }
  }
  return closestDistrict;
}

export async function getCurrentGPSLocation(): Promise<GPSLocationResult | null> {
  const result = await getSTPPreciseGPS();
  if (!result) return null;

  return {
    latitude: result.latitude,
    longitude: result.longitude,
    accuracy: result.accuracy,
    district: result.district,
    zone: result.zone,
    street: result.street,
    formattedAddress: result.formattedAddress,
    mapsUrl: result.mapsUrl,
    directionsUrl: result.directionsUrl,
    wazeUrl: result.wazeUrl,
    appleMapsUrl: result.appleMapsUrl,
    geoUri: result.geoUri,
    shareMessage: result.shareMessage,
  };
}

// Helper para abertura 100% segura de links externos e protocolos sem quebrar o iframe
export function safeOpenExternalUrl(url: string, target = "_blank") {
  if (typeof window === "undefined") return;
  try {
    const a = document.createElement("a");
    a.href = url;
    a.target = target;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
      } catch {
        // ignore
      }
    }, 100);
  } catch (err) {
    console.warn("safeOpenExternalUrl fallback error:", err);
    try {
      window.open(url, target);
    } catch {
      // ignore
    }
  }
}

// --- 2. MAPAS NATIVOS DO TELEMÓVEL (Google Maps, Apple Maps, Waze, Geo URI) ---
export function openGoogleMapsRoute(options: {
  latitude: number;
  longitude: number;
  label?: string;
  travelMode?: "driving" | "walking" | "two_wheeler";
}) {
  const mode = options.travelMode || "driving";
  const url = `https://www.google.com/maps/dir/?api=1&destination=${options.latitude},${options.longitude}&travelmode=${mode}`;
  triggerDeviceVibration([40, 60]);
  safeOpenExternalUrl(url, "_blank");
  toast.success("A abrir rota no Google Maps...", {
    description: `Destino: ${options.latitude.toFixed(5)}, ${options.longitude.toFixed(5)}`,
  });
}

export function openNativeMap(options: {
  address?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  title?: string;
  mode?: "route" | "pin";
  app?: "auto" | "google" | "apple" | "waze";
}) {
  triggerDeviceVibration([40]);
  const isIOS =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent || "") ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  const isAndroid = typeof navigator !== "undefined" && /Android/.test(navigator.userAgent || "");

  const hasCoords = Boolean(options.latitude && options.longitude);
  const isRoute = options.mode === "route" || (!options.mode && hasCoords);

  if (hasCoords) {
    const lat = options.latitude!;
    const lng = options.longitude!;
    const label = encodeURIComponent(options.title || "Cliente KONEKTA");

    if (options.app === "apple" || (options.app !== "google" && options.app !== "waze" && isIOS)) {
      // Abre o Apple Maps nativo no iPhone/iPad
      const appleUrl = isRoute
        ? `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`
        : `maps://maps.apple.com/?ll=${lat},${lng}&q=${label}`;
      safeOpenExternalUrl(appleUrl, "_blank");
      toast.success("A abrir Apple Maps nativo no telemóvel...");
      return;
    }

    if (options.app === "waze") {
      const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
      safeOpenExternalUrl(wazeUrl, "_blank");
      toast.success("A abrir Waze nativo no telemóvel...");
      return;
    }

    // Google Maps / Android / Universal
    if (isAndroid) {
      // No Android, o link de navegação aciona a app nativa Google Maps
      const androidRouteUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
      safeOpenExternalUrl(androidRouteUrl, "_blank");
      toast.success("A abrir rota no Google Maps nativo...");
      return;
    }

    const routeUrl = isRoute
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
      : `https://www.google.com/maps?q=${lat},${lng}&z=18`;

    safeOpenExternalUrl(routeUrl, "_blank");
    toast.success(isRoute ? "A abrir rota GPS no mapa..." : "A abrir ponto no mapa...");
    return;
  }

  // Se não houver coordenadas, pesquisa por endereço/distrito
  const query = encodeURIComponent(
    [options.address, options.district, "São Tomé e Príncipe"].filter(Boolean).join(", "),
  );

  if (isIOS) {
    safeOpenExternalUrl(`maps://maps.apple.com/?q=${query}`, "_blank");
  } else {
    safeOpenExternalUrl(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  }

  toast.info("A abrir mapa no telemóvel...");
}

/**
 * Partilha nativa do dispositivo (abre a folha de partilha do Android/iOS)
 */
export async function shareNativeLocation(options: {
  title: string;
  text: string;
  url?: string;
  latitude?: number;
  longitude?: number;
}) {
  triggerDeviceVibration([40]);
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url:
          options.url ||
          (options.latitude && options.longitude
            ? `https://www.google.com/maps?q=${options.latitude},${options.longitude}`
            : undefined),
      });
      toast.success("Localização partilhada via sistema nativo!");
      return;
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        console.warn("navigator.share error:", err);
      }
    }
  }

  // Fallback: copiar para a área de transferência
  const fallbackText = `${options.text}\n${options.url || ""}`.trim();
  try {
    await navigator.clipboard.writeText(fallbackText);
    toast.success("Dados copiados para a área de transferência!");
  } catch {
    toast.info("Copie as informações manualmente.");
  }
}

// --- 3. WHATSAPP DO TELEMÓVEL ---
export function cleanPhoneNumber(rawPhone: string): string {
  let cleaned = (rawPhone || "").replace(/\D/g, "");
  // If local STP phone without country code (e.g. 9912233 or 2223344)
  if (cleaned.length === 7) {
    cleaned = `239${cleaned}`;
  }
  return cleaned;
}

export function openWhatsApp(options: { phone?: string; message: string }) {
  const targetPhone = cleanPhoneNumber(options.phone || "2399912233");
  const encodedText = encodeURIComponent(options.message.trim());
  const waUrl = `https://wa.me/${targetPhone}?text=${encodedText}`;

  triggerDeviceVibration([40, 40]);
  safeOpenExternalUrl(waUrl, "_blank");
  toast.success("A abrir WhatsApp no telemóvel...");
}

// --- 4. SMS NATIVO DO TELEMÓVEL ---
export function openNativeSMS(options: { phone?: string; body: string }) {
  const targetPhone = cleanPhoneNumber(options.phone || "2399912233");
  const encodedBody = encodeURIComponent(options.body.trim());

  const isIOS =
    typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent || "");
  const smsUrl = isIOS
    ? `sms:${targetPhone}&body=${encodedBody}`
    : `sms:${targetPhone}?body=${encodedBody}`;

  triggerDeviceVibration([40, 40]);
  safeOpenExternalUrl(smsUrl, "_blank");
  toast.success("A abrir aplicação de SMS...");
}

// --- 5. EMAIL NATIVO DO TELEMÓVEL ---
export function openNativeEmail(options: { email?: string; subject: string; body: string }) {
  const targetEmail = options.email || "suporte@konekta.st";
  const encodedSubject = encodeURIComponent(options.subject);
  const encodedBody = encodeURIComponent(options.body);
  const mailtoUrl = `mailto:${targetEmail}?subject=${encodedSubject}&body=${encodedBody}`;

  safeOpenExternalUrl(mailtoUrl, "_blank");
  toast.success("A abrir correio eletrónico no telemóvel...");
}

// --- 6. CHAMADA TELEFÓNICA NATIVA ---
export function openNativePhoneCall(phone: string) {
  const targetPhone = cleanPhoneNumber(phone || "2399912233");
  triggerDeviceVibration([60]);
  safeOpenExternalUrl(`tel:+${targetPhone}`, "_blank");
}

// --- 7. VIBRAÇÃO HÁPTICA DO DISPOSITIVO ---
export function triggerDeviceVibration(pattern: number | number[] = [100, 50, 100]) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration error on unsupported platforms
    }
  }
}

// --- 8. ÁUDIO & ALARMES SONOROS DO SISTEMA ---
export function playAlarmSound(type: "alarm" | "chime" | "urgent" = "alarm") {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === "urgent") {
      // 3 urgent beeps
      [0, 0.2, 0.4].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, now + offset);
        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.15);
      });
    } else if (type === "alarm") {
      // Melodic alarm tone (C5 -> E5 -> G5 -> C6)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.25, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.35);
      });
    } else {
      // Gentle chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (err) {
    console.error("Audio playback error:", err);
  }
}

// --- 9. NOTIFICAÇÕES NATIVAS DO SISTEMA ---
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      return true;
    }
  }

  return false;
}

export function showSystemNotification(title: string, body: string, icon = "/icon.png") {
  if (typeof window === "undefined") return;

  // In-app alert + sound + vibration
  playAlarmSound("alarm");
  triggerDeviceVibration([200, 100, 200, 100, 300]);

  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon,
        badge: icon,
        tag: `konekta_${Date.now()}`,
      });
    } catch {
      // Fallback in case of restricted environment
    }
  }

  // Also record in store notifications
  store.notify({
    title,
    body,
    tone: "info",
  });
}

// --- 10. PARSE DATE AND TIME PARA FUSO STP ---
export function parseEventDateTime(dateStr: string, timeStr: string): Date {
  const today = new Date();
  let targetDate = new Date();

  // If dateStr is YYYY-MM-DD
  if (dateStr && dateStr.includes("-")) {
    const [y, m, d] = dateStr.split("-").map(Number);
    targetDate = new Date(y, m - 1, d);
  } else {
    targetDate = new Date(today);
  }

  let hours = 9;
  let minutes = 0;

  // Extract HH:mm from timeStr if present
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
  } else if (timeStr.toLowerCase().includes("manha") || timeStr.toLowerCase().includes("manhã")) {
    hours = 9;
    minutes = 0;
  } else if (timeStr.toLowerCase().includes("tarde")) {
    hours = 14;
    minutes = 0;
  } else if (timeStr.toLowerCase().includes("noite") || timeStr.toLowerCase().includes("fim")) {
    hours = 18;
    minutes = 0;
  } else if (
    timeStr.toLowerCase().includes("imediato") ||
    timeStr.toLowerCase().includes("urgente")
  ) {
    // Current time + 30 mins
    const now = new Date();
    hours = now.getHours();
    minutes = now.getMinutes() + 30;
  }

  targetDate.setHours(hours, minutes, 0, 0);
  return targetDate;
}

// --- 11. GERAÇÃO E DOWNLOAD DE CALENDÁRIO (.ICS) ---
export function generateIcsContent(event: SyncScheduleEvent): string {
  const startDate = parseEventDateTime(event.dateStr, event.timeStr);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours default duration

  const formatIcsDate = (d: Date) => {
    return d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  };

  const dtStart = formatIcsDate(startDate);
  const dtEnd = formatIcsDate(endDate);
  const dtStamp = formatIcsDate(new Date());
  const uid = `konekta-${event.id}-${Date.now()}@konekta.st`;

  const title = `KONEKTA: ${event.title}${event.providerName ? ` c/ ${event.providerName}` : ""}`;
  const description = [
    `Serviço KONEKTA: ${event.title}`,
    event.providerName ? `Prestador: ${event.providerName}` : "",
    event.categoryName ? `Categoria: ${event.categoryName}` : "",
    event.urgency ? `Prioridade: ${event.urgency}` : "",
    event.location ? `Local: ${event.location}` : "",
    event.description ? `Detalhes: ${event.description}` : "",
    `Contacto e Suporte: KONEKTA São Tomé e Príncipe`,
  ]
    .filter(Boolean)
    .join("\\n");

  const location = event.location || "São Tomé e Príncipe";

  // Standard alarms (1 hour and 15 mins before)
  const valarms = `
BEGIN:VALARM
TRIGGER:-PT60M
ACTION:DISPLAY
DESCRIPTION:Lembrete KONEKTA: Serviço agendado em 1 hora!
END:VALARM
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:KONEKTA: O seu serviço começa em 15 minutos!
END:VALARM`;

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//KONEKTA//Agendamento e Servicos STP//PT
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtStamp}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
STATUS:CONFIRMED${valarms}
END:VEVENT
END:VCALENDAR`;
}

export function downloadIcsCalendarFile(event: SyncScheduleEvent) {
  if (typeof window === "undefined") return;
  try {
    const icsData = generateIcsContent(event);
    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `konekta-servico-${event.id}.ics`);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }, 200);
    toast.success("Ficheiro de calendário (.ics) gerado para o telemóvel!");
  } catch (err) {
    console.warn("downloadIcsCalendarFile error:", err);
  }
}

export function getGoogleCalendarUrl(event: SyncScheduleEvent): string {
  const startDate = parseEventDateTime(event.dateStr, event.timeStr);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  const formatGCalDate = (d: Date) => {
    return d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  };

  const dates = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;
  const title = encodeURIComponent(
    `KONEKTA: ${event.title}${event.providerName ? ` (${event.providerName})` : ""}`,
  );
  const details = encodeURIComponent(
    `Serviço KONEKTA: ${event.title}\nPrestador: ${event.providerName || "Verificado"}\nDetalhes: ${
      event.description || ""
    }\nLocal: ${event.location || "São Tomé"}`,
  );
  const location = encodeURIComponent(event.location || "São Tomé e Príncipe");

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

// --- 12. GESTÃO DE ALARMES & VIGILÂNCIA DE RELÓGIO STP ---
export function getStoredAlarms(): SavedAlarm[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ALARMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAlarm(alarm: SavedAlarm) {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredAlarms().filter((a) => a.id !== alarm.id);
    localStorage.setItem(ALARMS_KEY, JSON.stringify([alarm, ...current]));
  } catch {
    // ignore
  }
}

export function removeAlarm(alarmId: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredAlarms().filter((a) => a.id !== alarmId);
    localStorage.setItem(ALARMS_KEY, JSON.stringify(current));
    toast.info("Alarme removido");
  } catch {
    // ignore
  }
}

export function registerEventAndAlarms(
  event: SyncScheduleEvent,
  options?: { alarm15m?: boolean; alarm1h?: boolean; alarmOnTime?: boolean },
) {
  if (typeof window === "undefined") return;

  // Save event
  try {
    const rawEvents = localStorage.getItem(SYNC_EVENTS_KEY);
    const events: SyncScheduleEvent[] = rawEvents ? JSON.parse(rawEvents) : [];
    const updatedEvents = [event, ...events.filter((e) => e.id !== event.id)];
    localStorage.setItem(SYNC_EVENTS_KEY, JSON.stringify(updatedEvents));
  } catch (err) {
    console.error("Error saving sync event:", err);
  }

  const targetDate = parseEventDateTime(event.dateStr, event.timeStr);
  const targetEpoch = targetDate.getTime();

  // Create alarms based on options
  const alarmsToSet = [];
  if (options?.alarm15m !== false) alarmsToSet.push(15);
  if (options?.alarm1h) alarmsToSet.push(60);
  if (options?.alarmOnTime) alarmsToSet.push(0);

  alarmsToSet.forEach((mins) => {
    const alarmTime = targetEpoch - mins * 60 * 1000;
    if (alarmTime > Date.now() - 60000) {
      const alarm: SavedAlarm = {
        id: `alarm_${event.id}_${mins}m`,
        eventId: event.id,
        title:
          mins === 0
            ? `⏰ KONEKTA: É agora! ${event.title}`
            : `⏰ KONEKTA: Em ${mins} minutos - ${event.title}`,
        targetTimestamp: alarmTime,
        minutesBefore: mins,
        triggered: false,
        dateFormatted: targetDate.toLocaleDateString("pt-PT"),
        timeFormatted: targetDate.toLocaleTimeString("pt-PT", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      saveAlarm(alarm);
    }
  });

  // Request notifications permission quietly
  requestNotificationPermission();
}

// --- 13. MONITOR DE ALARMES EM SEGUNDO PLANO ---
let monitorStarted = false;

export function initAlarmWatcher() {
  if (typeof window === "undefined" || monitorStarted) return;
  monitorStarted = true;

  const checkAlarms = () => {
    try {
      const alarms = getStoredAlarms();
      const now = Date.now();
      let updated = false;

      alarms.forEach((alarm) => {
        if (
          !alarm.triggered &&
          now >= alarm.targetTimestamp &&
          now <= alarm.targetTimestamp + 15 * 60 * 1000
        ) {
          // Trigger alarm
          alarm.triggered = true;
          updated = true;

          showSystemNotification(
            alarm.title,
            `Lembrete de serviço KONEKTA agendado para ${alarm.dateFormatted} às ${alarm.timeFormatted}.`,
          );

          toast.warning(alarm.title, {
            description: `Serviço agendado às ${alarm.timeFormatted}. O prestador ou cliente aguarda.`,
            duration: 10000,
          });
        }
      });

      if (updated) {
        localStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
      }
    } catch {
      // ignore
    }
  };

  // Check every 20 seconds
  setInterval(checkAlarms, 20000);
  checkAlarms();
}
