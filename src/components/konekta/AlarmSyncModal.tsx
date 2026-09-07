import { useState, useEffect } from "react";
import {
  Bell,
  Volume2,
  Clock,
  Calendar,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  X,
  Radio,
  VolumeX,
} from "lucide-react";
import {
  soundAlerts,
  syncWithPhoneCalendarAndAlarms,
  getGoogleCalendarUrl,
} from "@/lib/sound-alerts";
import { useStore, store, type Order } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AlarmSyncModalProps {
  open: boolean;
  onClose: () => void;
  orderToSync?: Order | null;
}

export function AlarmSyncModal({ open, onClose, orderToSync }: AlarmSyncModalProps) {
  const orders = useStore((s) => s.orders);
  const user = useStore((s) => s.user);

  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("knk_alarm_sound") !== "false";
  });
  const [vibrationEnabled, setVibrationEnabled] = useState(() => {
    return localStorage.getItem("knk_alarm_vibration") !== "false";
  });
  const [leadTimeMinutes, setLeadTimeMinutes] = useState<number>(() => {
    const saved = localStorage.getItem("knk_alarm_lead_time");
    return saved ? parseInt(saved, 10) : 15;
  });
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  if (!open) return null;

  // Filtra pedidos relevantes futuros
  const upcomingOrders = orderToSync
    ? [orderToSync]
    : orders.filter(
        (o) => o.status === "pendente" || o.status === "aceite" || o.status === "em_andamento",
      );

  const handleSavePreferences = () => {
    localStorage.setItem("knk_alarm_sound", String(soundEnabled));
    localStorage.setItem("knk_alarm_vibration", String(vibrationEnabled));
    localStorage.setItem("knk_alarm_lead_time", String(leadTimeMinutes));
    toast.success("Preferências de alarme guardadas com sucesso!");
    onClose();
  };

  const handleTestSound = () => {
    if (isPlayingTest) {
      soundAlerts.stopAlarmSound();
      setIsPlayingTest(false);
    } else {
      setIsPlayingTest(true);
      soundAlerts.playAlarmSound(5);
      setTimeout(() => {
        setIsPlayingTest(false);
      }, 5000);
    }
  };

  const requestNativeNotification = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Notificações não suportadas pelo seu navegador.");
      return;
    }
    const perm = await Notification.requestPermission();
    setNotificationPermission(perm);
    if (perm === "granted") {
      toast.success("Notificações e alertas ativados no telemóvel!");
      new Notification("KONEKTA STP", {
        body: "Alarme e alertas de serviço ativados com sucesso.",
        icon: "/favicon.ico",
      });
    } else {
      toast.error("Permissão de notificações recusada no navegador.");
    }
  };

  const handleSyncOrder = (order: Order) => {
    // Parse da data agendada
    let eventDate = new Date();
    if (order.scheduledFor) {
      const parsed = new Date(order.scheduledFor);
      if (!isNaN(parsed.getTime())) {
        eventDate = parsed;
      } else {
        // Formatos comuns como "Hoje às 19:00" ou "2026-09-10 19:00"
        eventDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // fallback 2h
      }
    }

    syncWithPhoneCalendarAndAlarms({
      title: `Serviço KONEKTA: ${order.service}`,
      description: `Pedido ${order.id}\nLocal: ${order.address || "São Tomé e Príncipe"}\nDistrito: ${order.district || "Água Grande"}\nValor: ${order.total} STN`,
      location: `${order.address ? order.address + ", " : ""}${order.district || "São Tomé e Príncipe"}`,
      startDate: eventDate,
      durationMinutes: 90,
      reminderMinutesBefore: leadTimeMinutes,
    });

    toast.success("Ficheiro de alarme gerado!", {
      description: "Abra o ficheiro descarregado para configurar o alarme do seu telemóvel.",
    });
  };

  const leadOptions = [
    { value: 0, label: "No momento exato (0 min)", desc: "Toca à hora marcada" },
    { value: 15, label: "15 minutos antes", desc: "Recomendado para deslocação" },
    { value: 30, label: "30 minutos antes", desc: "Para preparar materiais" },
    { value: 60, label: "1 hora antes", desc: "Alerta com boa antecedência" },
    { value: 1440, label: "1 dia antes", desc: "Para serviços na próxima semana/mês" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-card/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Bell size={20} />
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Sincronizar Alarme do Telemóvel
              </h2>
              <p className="text-xs text-muted-foreground">
                Alertas sonoros e notificações de agendamento
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status das Notificações do Dispositivo */}
          <div className="p-4 rounded-2xl bg-muted/60 border border-border space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Smartphone size={15} className="text-primary" /> Notificações do Navegador /
                  Sistema
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Permite que a KONEKTA envie alertas mesmo com o ecrã bloqueado ou aplicação em
                  segundo plano.
                </p>
              </div>

              {notificationPermission === "granted" ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 bg-emerald-500/15 px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={13} /> Ativo
                </span>
              ) : (
                <button
                  type="button"
                  onClick={requestNativeNotification}
                  className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 shrink-0"
                >
                  Permitir
                </button>
              )}
            </div>
          </div>

          {/* Configuração dos Sons & Vibração */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Comportamento do Alarme
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={cn(
                  "flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all",
                  soundEnabled
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-muted/40 border-border text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-2.5">
                  {soundEnabled ? (
                    <Volume2 size={18} className="text-primary" />
                  ) : (
                    <VolumeX size={18} />
                  )}
                  <div>
                    <span className="text-xs font-bold block">Som do Alarme</span>
                    <span className="text-[10px] text-muted-foreground">Toque audível</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "w-8 h-4.5 rounded-full transition-colors relative flex items-center px-0.5",
                    soundEnabled ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                >
                  <div
                    className={cn(
                      "size-3.5 rounded-full bg-white transition-transform",
                      soundEnabled ? "translate-x-3.5" : "translate-x-0",
                    )}
                  />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVibrationEnabled(!vibrationEnabled)}
                className={cn(
                  "flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all",
                  vibrationEnabled
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-muted/40 border-border text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Radio size={18} className={vibrationEnabled ? "text-primary" : ""} />
                  <div>
                    <span className="text-xs font-bold block">Vibração</span>
                    <span className="text-[10px] text-muted-foreground">Pulsos de alerta</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "w-8 h-4.5 rounded-full transition-colors relative flex items-center px-0.5",
                    vibrationEnabled ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                >
                  <div
                    className={cn(
                      "size-3.5 rounded-full bg-white transition-transform",
                      vibrationEnabled ? "translate-x-3.5" : "translate-x-0",
                    )}
                  />
                </div>
              </button>
            </div>

            {/* Botão para testar o som do alarme */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestSound}
                className={cn(
                  "w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2",
                  isPlayingTest
                    ? "bg-destructive text-destructive-foreground border-destructive animate-pulse"
                    : "bg-muted/70 text-foreground border-border hover:bg-muted",
                )}
              >
                <Volume2 size={15} />
                <span>
                  {isPlayingTest ? "Parar Som de Teste" : "Ouvir Toque de Alarme KONEKTA"}
                </span>
              </button>
            </div>
          </div>

          {/* Quando deve tocar o alarme */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Momento do Alarme
            </h3>

            <div className="space-y-2">
              {leadOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLeadTimeMinutes(opt.value)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all",
                    leadTimeMinutes === opt.value
                      ? "bg-primary/10 border-primary text-foreground"
                      : "bg-card border-border hover:bg-muted/50 text-muted-foreground",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Clock
                      size={16}
                      className={leadTimeMinutes === opt.value ? "text-primary" : ""}
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground">{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                    </div>
                  </div>
                  {leadTimeMinutes === opt.value && (
                    <CheckCircle2 size={16} className="text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Serviços com Alarme Prontos a Sincronizar */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Agendamentos para Sincronizar ({upcomingOrders.length})
            </h3>

            {upcomingOrders.length === 0 ? (
              <div className="p-4 rounded-2xl bg-muted/30 border border-border text-center text-xs text-muted-foreground">
                Nenhum agendamento pendente no momento. Quando marcar um serviço, o alarme tocará
                conforme configurado acima.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto">
                {upcomingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-foreground">{order.service}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock size={12} /> {order.scheduledFor || "A definir"} ·{" "}
                        {order.district || "São Tomé"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSyncOrder(order)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[11px] hover:opacity-90 shrink-0 flex items-center gap-1.5 shadow-xs"
                    >
                      <Calendar size={13} />
                      <span>Alarme Telemóvel</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 border-t border-border bg-card/95 backdrop-blur-md flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSavePreferences}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
          >
            Guardar Configuração
          </button>
        </div>
      </div>
    </div>
  );
}
