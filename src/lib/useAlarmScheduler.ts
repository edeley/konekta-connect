import { useState, useEffect } from "react";
import { soundAlerts } from "./sound-alerts";
import { useStore, type Order } from "./store";

export interface ActiveAlarmInfo {
  order: Order;
  timeRemainingMinutes: number;
  triggerTime: number;
}

export function useAlarmScheduler() {
  const orders = useStore((s) => s.orders);
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarmInfo | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const triggeredOrdersKey = "knk_triggered_alarms";
    const getTriggeredIds = (): string[] => {
      try {
        const item = sessionStorage.getItem(triggeredOrdersKey);
        return item ? JSON.parse(item) : [];
      } catch {
        return [];
      }
    };

    const addTriggeredId = (id: string) => {
      try {
        const current = getTriggeredIds();
        if (!current.includes(id)) {
          sessionStorage.setItem(triggeredOrdersKey, JSON.stringify([...current, id]));
        }
      } catch {
        // ignore
      }
    };

    const checkAlarms = () => {
      const soundEnabled = localStorage.getItem("knk_alarm_sound") !== "false";
      const vibrationEnabled = localStorage.getItem("knk_alarm_vibration") !== "false";
      const leadTimeMinutes = parseInt(localStorage.getItem("knk_alarm_lead_time") || "15", 10);

      const triggered = getTriggeredIds();
      const now = Date.now();

      const activeOrders = orders.filter(
        (o) =>
          (o.status === "pendente" || o.status === "aceite" || o.status === "em_andamento") &&
          !triggered.includes(o.id),
      );

      for (const order of activeOrders) {
        if (!order.scheduledFor) continue;

        let scheduledTimestamp: number | null = null;
        const parsed = new Date(order.scheduledFor);
        if (!isNaN(parsed.getTime())) {
          scheduledTimestamp = parsed.getTime();
        }

        if (!scheduledTimestamp) continue;

        const diffMinutes = Math.round((scheduledTimestamp - now) / (1000 * 60));

        // Toca se estiver dentro da janela de antecedência configurada (ex: <= 15 min e >= -60 min)
        if (diffMinutes <= leadTimeMinutes && diffMinutes >= -30) {
          addTriggeredId(order.id);

          if (soundEnabled) {
            soundAlerts.playAlarmSound(10);
          }
          if (vibrationEnabled) {
            soundAlerts.triggerVibration([300, 150, 300, 150, 600]);
          }

          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification("⏰ Alarme de Serviço KONEKTA!", {
                body: `${order.service} agendado para ${order.scheduledFor}. Abra a app para mais informações.`,
                icon: "/favicon.ico",
              });
            } catch {
              // ignore
            }
          }

          setActiveAlarm({
            order,
            timeRemainingMinutes: diffMinutes,
            triggerTime: now,
          });
          break;
        }
      }
    };

    checkAlarms();
    const interval = setInterval(checkAlarms, 15000);
    return () => clearInterval(interval);
  }, [orders]);

  const dismissAlarm = () => {
    soundAlerts.stopAlarmSound();
    setActiveAlarm(null);
  };

  const snoozeAlarm = (minutes = 5) => {
    soundAlerts.stopAlarmSound();
    setActiveAlarm(null);
    // Permite tocar novamente após os minutos de soneca
    if (activeAlarm) {
      setTimeout(
        () => {
          const soundEnabled = localStorage.getItem("knk_alarm_sound") !== "false";
          if (soundEnabled) soundAlerts.playAlarmSound(8);
          setActiveAlarm({
            ...activeAlarm,
            timeRemainingMinutes: Math.max(0, activeAlarm.timeRemainingMinutes - minutes),
            triggerTime: Date.now(),
          });
        },
        minutes * 60 * 1000,
      );
    }
  };

  return {
    activeAlarm,
    dismissAlarm,
    snoozeAlarm,
  };
}
