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
  Play,
  Square,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Share2,
  Sparkles,
} from "lucide-react";
import {
  soundAlerts,
  syncWithPhoneCalendarAndAlarms,
  openNativeDeviceClock,
  AVAILABLE_ALARM_TONES,
  type AlarmToneOption,
} from "@/lib/sound-alerts";
import { useStore, type Order } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AlarmSyncModalProps {
  open: boolean;
  onClose: () => void;
  orderToSync?: Order | null;
}

export function AlarmSyncModal({ open, onClose, orderToSync }: AlarmSyncModalProps) {
  const orders = useStore((s) => s.orders);

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
  const [selectedTone, setSelectedTone] = useState<string>(() => {
    return localStorage.getItem("knk_alarm_tone") || "konekta_energy";
  });
  const [playingToneId, setPlayingToneId] = useState<string | null>(null);
  const [isPlayingFullAlarm, setIsPlayingFullAlarm] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === "denied") {
        setShowHelpGuide(true);
      }
    }
  }, [open]);

  // Se fechar o modal, para qualquer som que esteja a tocar
  useEffect(() => {
    if (!open) {
      soundAlerts.stopAlarmSound();
      setPlayingToneId(null);
      setIsPlayingFullAlarm(false);
    }
  }, [open]);

  if (!open) return null;

  // Filtra pedidos relevantes futuros
  const upcomingOrders = orderToSync
    ? [orderToSync]
    : orders.filter(
        (o) => o.status === "pendente" || o.status === "aceite" || o.status === "em-execucao",
      );

  const handleSelectTone = (toneId: string) => {
    setSelectedTone(toneId);
    localStorage.setItem("knk_alarm_tone", toneId);
    toast.success("Toque selecionado!", {
      description: "Este toque será usado para todos os alarmes e alertas.",
      duration: 2500,
    });
  };

  const handleTogglePreviewTone = (toneId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingToneId === toneId) {
      soundAlerts.stopAlarmSound();
      setPlayingToneId(null);
    } else {
      setPlayingToneId(toneId);
      setIsPlayingFullAlarm(false);
      soundAlerts.playToneSample(toneId);
      setTimeout(() => {
        setPlayingToneId((curr) => (curr === toneId ? null : curr));
      }, 2500);
    }
  };

  const handleTestFullAlarm = () => {
    if (isPlayingFullAlarm) {
      soundAlerts.stopAlarmSound();
      setIsPlayingFullAlarm(false);
      setPlayingToneId(null);
    } else {
      setIsPlayingFullAlarm(true);
      setPlayingToneId(null);
      soundAlerts.playAlarmSound(6, selectedTone);
      toast.info("A reproduzir alarme de teste...", { duration: 3000 });
      setTimeout(() => {
        setIsPlayingFullAlarm(false);
      }, 6000);
    }
  };

  const handleSavePreferences = () => {
    soundAlerts.stopAlarmSound();
    localStorage.setItem("knk_alarm_sound", String(soundEnabled));
    localStorage.setItem("knk_alarm_vibration", String(vibrationEnabled));
    localStorage.setItem("knk_alarm_lead_time", String(leadTimeMinutes));
    localStorage.setItem("knk_alarm_tone", selectedTone);
    toast.success("Configuração de alarme guardada com sucesso!");
    onClose();
  };

  const requestNativeNotification = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.info("Notificações web não suportadas. Use a Sincronização Nativa com o Telemóvel.");
      return;
    }

    if (Notification.permission === "denied") {
      setShowHelpGuide(true);
      toast.info("Notificações bloqueadas nas definições do navegador.", {
        description:
          "O som do alarme e a sincronização com o relógio do telemóvel já estão 100% ativos!",
        duration: 4000,
      });
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === "granted") {
        toast.success("Notificações ativadas no telemóvel!");
        new Notification("KONEKTA STP", {
          body: "Sons e alarmes sincronizados com sucesso.",
          icon: "/favicon.ico",
        });
      } else if (perm === "denied") {
        setShowHelpGuide(true);
        toast.info("Notificações em segundo plano bloqueadas.", {
          description: "O alarme sonoro e a vibração continuam a funcionar normalmente.",
          duration: 4000,
        });
      }
    } catch {
      // Fallback amigável
      toast.info("Use a Sincronização com o Telemóvel para alarme no relógio nativo.");
    }
  };

  const handleSyncOrder = async (order?: Order) => {
    let eventDate = new Date();
    let serviceTitle = "Serviço Geral KONEKTA";
    let locationStr = "São Tomé e Príncipe";

    if (order) {
      serviceTitle = `Serviço KONEKTA: ${order.service}`;
      locationStr = `${order.address ? order.address + ", " : ""}${order.district || "São Tomé e Príncipe"}`;
      if (order.scheduledFor) {
        const parsed = new Date(order.scheduledFor);
        if (!isNaN(parsed.getTime())) {
          eventDate = parsed;
        } else {
          eventDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
        }
      }
    } else {
      eventDate = new Date(Date.now() + 60 * 60 * 1000);
    }

    try {
      const res = await syncWithPhoneCalendarAndAlarms({
        title: serviceTitle,
        description: `Agendamento KONEKTA STP.\nLocal: ${locationStr}\nAlarme configurado para ${leadTimeMinutes} minutos antes.`,
        location: locationStr,
        startDate: eventDate,
        durationMinutes: 90,
        reminderMinutesBefore: leadTimeMinutes,
      });

      if (res.shared) {
        toast.success("Alarme enviado para a app do seu telemóvel!", {
          description: "Confirme a adição ao seu Relógio ou Calendário.",
        });
      } else {
        toast.success("Alarme gerado com sucesso!", {
          description: "Abra o ficheiro descarregado para configurar o despertador do telemóvel.",
        });
      }
    } catch {
      toast.error("Não foi possível gerar o alarme automaticamente.");
    }
  };

  const handleOpenPhoneClock = () => {
    const nextDate = new Date(Date.now() + (leadTimeMinutes || 15) * 60 * 1000);
    openNativeDeviceClock(nextDate, "Serviço KONEKTA");
    toast.info("A abrir Relógio / Despertador do telemóvel...");
  };

  const leadOptions = [
    { value: 0, label: "À hora marcada (0 min)", desc: "Toca no momento exato" },
    { value: 15, label: "15 minutos antes", desc: "Recomendado para deslocação" },
    { value: 30, label: "30 minutos antes", desc: "Preparação de materiais" },
    { value: 60, label: "1 hora antes", desc: "Alerta com boa antecedência" },
    { value: 1440, label: "1 dia antes", desc: "Para agendamentos futuros" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-card border border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 border-b border-border bg-card/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Bell size={20} />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                Sincronizar Alarme do Telemóvel
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Escolha o toque, configure o som e sincronize com o seu telemóvel
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* ================= SEÇÃO 1: SINCRONIZAÇÃO NATIVA COM O SISTEMA DO TELEMÓVEL ================= */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/25 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Smartphone size={16} /> Sincronização Direta com o Sistema do Telemóvel
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Conecte os alarmes da KONEKTA diretamente à aplicação <strong>Relógio</strong> ou{" "}
                  <strong>Calendário</strong> do seu telemóvel (Android / iPhone) para tocar mesmo
                  com o ecrã desligado e sem depender da internet.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleSyncOrder(upcomingOrders[0])}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Share2 size={15} />
                <span>📲 Sincronizar com Alarme Nativo</span>
              </button>

              <button
                type="button"
                onClick={handleOpenPhoneClock}
                className="w-full py-2.5 px-3 rounded-xl bg-card hover:bg-muted text-foreground border border-border font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Clock size={15} className="text-primary" />
                <span>⏰ Abrir Despertador do Telemóvel</span>
              </button>
            </div>
          </div>

          {/* ================= SEÇÃO 2: ESCOLHER O TOQUE DO ALARME & NOTIFICAÇÃO ================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" /> Escolha o Toque do Alarme &
                Notificação
              </h3>
              <span className="text-[10px] text-muted-foreground">Toque para ouvir e escolher</span>
            </div>

            <div className="space-y-2">
              {AVAILABLE_ALARM_TONES.map((tone) => {
                const isSelected = selectedTone === tone.id;
                const isPlaying = playingToneId === tone.id;

                return (
                  <div
                    key={tone.id}
                    onClick={() => handleSelectTone(tone.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer",
                      isSelected
                        ? "bg-primary/10 border-primary/60 shadow-xs ring-1 ring-primary/30"
                        : "bg-muted/30 border-border hover:bg-muted/60",
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{tone.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-foreground truncate">{tone.name}</p>
                          {isSelected && (
                            <span className="text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md shrink-0">
                              Ativo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {tone.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={(e) => handleTogglePreviewTone(tone.id, e)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all",
                          isPlaying
                            ? "bg-destructive text-destructive-foreground animate-pulse"
                            : "bg-background border border-border text-foreground hover:bg-muted",
                        )}
                      >
                        {isPlaying ? <Square size={12} /> : <Play size={12} />}
                        <span>{isPlaying ? "Parar" : "Ouvir"}</span>
                      </button>

                      <div
                        className={cn(
                          "size-5 rounded-full border-2 flex items-center justify-center transition-colors",
                          isSelected ? "border-primary bg-primary text-white" : "border-border",
                        )}
                      >
                        {isSelected && <CheckCircle2 size={12} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= SEÇÃO 3: ESTADO DAS NOTIFICAÇÕES DO NAVEGADOR ================= */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Bell size={15} className="text-primary" /> Notificações do Navegador (Ecrã
                  Bloqueado)
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Permite que a aplicação emita alertas na barra superior do telemóvel quando houver
                  mensagens ou agendamentos.
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
                  className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 shrink-0 transition-colors"
                >
                  {notificationPermission === "denied" ? "Como Permitir" : "Permitir"}
                </button>
              )}
            </div>

            {/* Guia explicativo amigável caso as notificações estejam bloqueadas pelo navegador */}
            {notificationPermission === "denied" && (
              <div className="pt-2 border-t border-border/60 space-y-2">
                <div
                  onClick={() => setShowHelpGuide(!showHelpGuide)}
                  className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-semibold cursor-pointer hover:underline"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle size={14} /> As notificações estão bloqueadas no Chrome? Veja como
                    desbloquear
                  </span>
                  {showHelpGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>

                {showHelpGuide && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-2 text-foreground">
                    <p className="font-semibold text-amber-700 dark:text-amber-400">
                      💡 Passo a passo para permitir no Chrome do telemóvel:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>
                        Toque no ícone do cadeado 🔒 ou opções na barra de endereço do navegador (ao
                        lado do link).
                      </li>
                      <li>
                        Selecione <strong>Definições do site</strong> ou <strong>Permissões</strong>
                        .
                      </li>
                      <li>
                        Em <strong>Notificações</strong>, altere de Bloqueado para{" "}
                        <strong>Permitir</strong>.
                      </li>
                    </ol>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        Nota: Mesmo bloqueado no Chrome, o som e o alarme do telemóvel funcionam a
                        100%!
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== "undefined" && "Notification" in window) {
                            setNotificationPermission(Notification.permission);
                            if (Notification.permission === "granted") {
                              toast.success("Notificações agora estão ativas!");
                            } else {
                              toast.info("Ainda bloqueado. Atualize após alterar no Chrome.");
                            }
                          }
                        }}
                        className="text-[10px] font-bold text-primary underline hover:opacity-80"
                      >
                        Verificar Novamente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ================= SEÇÃO 4: COMPORTAMENTO DO ALARME & VIBRAÇÃO ================= */}
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
                    <span className="text-[10px] text-muted-foreground">
                      {soundEnabled ? "Toque audível ativado" : "Silenciado"}
                    </span>
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
                    <span className="text-[10px] text-muted-foreground">
                      {vibrationEnabled ? "Pulsos de alerta ativos" : "Desativada"}
                    </span>
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

            {/* Botão de teste completo */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestFullAlarm}
                className={cn(
                  "w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2",
                  isPlayingFullAlarm
                    ? "bg-destructive text-destructive-foreground border-destructive animate-pulse"
                    : "bg-muted/70 text-foreground border-border hover:bg-muted",
                )}
              >
                <Volume2 size={15} />
                <span>
                  {isPlayingFullAlarm
                    ? "Parar Alarme de Teste"
                    : `Testar Alarme Completo (${AVAILABLE_ALARM_TONES.find((t) => t.id === selectedTone)?.name || "KONEKTA"})`}
                </span>
              </button>
            </div>
          </div>

          {/* ================= SEÇÃO 5: ANTECEDÊNCIA DO ALARME ================= */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Momento em que o Alarme Toca
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

          {/* ================= SEÇÃO 6: AGENDAMENTOS PRONTOS PARA SINCRONIZAR ================= */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Agendamentos Ativos ({upcomingOrders.length})
            </h3>

            {upcomingOrders.length === 0 ? (
              <div className="p-4 rounded-2xl bg-muted/30 border border-border text-center text-xs text-muted-foreground">
                Nenhum agendamento pendente no momento. Quando marcar um serviço, o alarme tocará
                com o toque selecionado acima.
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
                      className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[11px] hover:opacity-90 shrink-0 flex items-center gap-1.5 shadow-xs transition-opacity"
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
        <div className="sticky bottom-0 p-4 border-t border-border bg-card/95 backdrop-blur-md flex items-center justify-end gap-2 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSavePreferences}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-all"
          >
            Guardar Configuração
          </button>
        </div>
      </div>
    </div>
  );
}
