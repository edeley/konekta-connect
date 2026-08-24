import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Send,
  AlertCircle,
  ShieldCheck,
  Zap,
  CalendarClock,
  Compass,
  X,
  Camera,
  Plus,
  Clock,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CameraCaptureModal } from "@/components/CameraCaptureModal";
import { getProvider } from "@/lib/konekta-data";
import { store } from "@/lib/store";
import { validateFormSafety } from "@/lib/escrow";
import {
  evaluateDaySlotsSTP,
  formatSTPDate,
  formatSTPTime,
  STANDARD_STP_SLOTS,
  STP_TIMEZONE,
  useSTPClock,
} from "@/lib/stp-time";
import {
  downloadIcsCalendarFile,
  registerEventAndAlarms,
  getCurrentGPSLocation,
  type SyncScheduleEvent,
} from "@/lib/sync-manager";
import { toast } from "sonner";

export const Route = createFileRoute("/orcamento/$providerId")({
  head: ({ params }) => {
    const p = getProvider(params.providerId);
    return {
      meta: [
        {
          title: p ? `Pedir Orçamento a ${p.name} · KONEKTA` : "Pedir Orçamento · KONEKTA",
        },
        {
          name: "description",
          content: "Solicite um orçamento personalizado ao prestador de serviços.",
        },
        { property: "og:title", content: "Pedir Orçamento · KONEKTA" },
      ],
    };
  },
  component: RequestQuotePage,
});

function RequestQuotePage() {
  const { providerId } = Route.useParams();
  const router = useRouter();
  const navigate = useNavigate();
  const provider = getProvider(providerId);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [photoSourceMenu, setPhotoSourceMenu] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [district, setDistrict] = useState("Água Grande (São Tomé)");
  const [address, setAddress] = useState("");
  const [referencePoint, setReferencePoint] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<"esta-semana" | "urgente">("esta-semana");

  const { time: stpCurrentTime, timeShort: stpTimeShort } = useSTPClock();

  // Agendamento normal dentro da agenda - se hoje não tiver mais vagas livres, começa por padrão em Amanhã (1)
  const initialOffset = useMemo(() => {
    const todayEval = evaluateDaySlotsSTP(
      0,
      ["08:30", "10:00"],
      STANDARD_STP_SLOTS,
      20,
      new Date(),
    );
    return todayEval.hasAnyAvailable ? 0 : 1;
  }, []);

  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(initialOffset);
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  // Detalhes e horários flexíveis de urgência
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [urgentTimingMode, setUrgentTimingMode] = useState<
    "imediato" | "hoje_manha" | "hoje_tarde" | "hoje_noite" | "personalizado"
  >("imediato");
  const [urgentCustomDate, setUrgentCustomDate] = useState(todayStr);
  const [urgentCustomTime, setUrgentCustomTime] = useState("10:00");
  const [urgentDetail, setUrgentDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  const formSafety = useMemo(() => {
    return validateFormSafety({
      Título: title,
      Descrição: description,
      Morada: address,
      "Ponto de Referência": referencePoint,
      "Detalhes de Urgência": urgentDetail,
    });
  }, [title, description, address, referencePoint, urgentDetail]);

  const handleGetGPS = async () => {
    setIsLocatingGPS(true);
    try {
      const res = await getCurrentGPSLocation();
      if (res) {
        setGpsCoords({ lat: res.latitude, lng: res.longitude });
        // Auto-match district
        if (res.district.includes("Água Grande")) setDistrict("Água Grande (São Tomé)");
        else if (res.district.includes("Mé-Zóchi")) setDistrict("Mé-Zóchi (Trindade)");
        else if (res.district.includes("Cantagalo")) setDistrict("Cantagalo (Santana)");
        else if (res.district.includes("Lobata")) setDistrict("Lobata (Guadalupe)");
        else if (res.district.includes("Lembá")) setDistrict("Lembá (Neves)");
        else if (res.district.includes("Caué")) setDistrict("Caué (São João dos Angolares)");
        else if (res.district.includes("Príncipe")) setDistrict("Região Autónoma do Príncipe");

        if (!address.trim()) {
          setAddress(`Localização GPS (${res.latitude.toFixed(4)}, ${res.longitude.toFixed(4)})`);
        }
        if (!referencePoint.trim()) {
          setReferencePoint(`Coordenadas de GPS obtidas via telemóvel`);
        }
      }
    } finally {
      setIsLocatingGPS(false);
    }
  };

  // Gera os próximos 5 dias com fuso STP
  const nextDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isTomorrow = i === 1;
      const dayName =
        i === 0
          ? "Hoje"
          : isTomorrow
            ? "Amanhã"
            : d.toLocaleDateString("pt-PT", { timeZone: STP_TIMEZONE, weekday: "short" });
      const dateFormatted = d.toLocaleDateString("pt-PT", {
        timeZone: STP_TIMEZONE,
        day: "numeric",
        month: "short",
      });

      // Avalia se o dia tem vagas restantes
      const dayEval = evaluateDaySlotsSTP(
        i,
        i === 0 ? ["08:30", "10:00"] : i === 1 ? ["14:00"] : [],
        STANDARD_STP_SLOTS,
        20,
        stpCurrentTime,
      );

      days.push({
        offset: i,
        dayName,
        dateFormatted,
        fullDateStr: d.toISOString().split("T")[0],
        hasAvailableSlots: dayEval.hasAnyAvailable,
        allPast: dayEval.allPast,
      });
    }
    return days;
  }, [stpCurrentTime]);

  // Ocupações de serviços em curso para cada dia
  const dayScheduleState = useMemo(() => {
    const occupiedSlotsMap: Record<number, string[]> = {
      0: ["08:30", "10:00"],
      1: ["14:00"],
      2: ["10:00", "15:30"],
      3: ["11:30"],
      4: [],
    };

    const occupiedSlots = occupiedSlotsMap[selectedDayOffset] || [];
    return { occupiedSlots };
  }, [selectedDayOffset]);

  // Avaliação em tempo real de TODOS os slots do dia selecionado (passados, ocupados e disponíveis)
  const daySlotsEvaluation = useMemo(() => {
    return evaluateDaySlotsSTP(
      selectedDayOffset,
      dayScheduleState.occupiedSlots,
      STANDARD_STP_SLOTS,
      20,
      stpCurrentTime,
    );
  }, [selectedDayOffset, dayScheduleState.occupiedSlots, stpCurrentTime]);

  // Apenas as vagas LIVRES E VÁLIDAS
  const freeSlotsForDay = useMemo(() => {
    return daySlotsEvaluation.availableSlots;
  }, [daySlotsEvaluation]);

  // Slot efetivo selecionado (garante que nunca aponta para um horário passado ou ocupado)
  const effectiveSelectedSlot = useMemo(() => {
    if (selectedSlot && freeSlotsForDay.includes(selectedSlot)) return selectedSlot;
    return freeSlotsForDay[0] || "";
  }, [freeSlotsForDay, selectedSlot]);

  // Resumo da disponibilidade e horário
  const scheduleSummary = useMemo(() => {
    if (urgency === "urgente") {
      let timingDesc = "Imediato / Atendimento Já (dentro de 30-45 min)";
      if (urgentTimingMode === "hoje_manha") timingDesc = "Hoje de Manhã (08:00 - 12:00)";
      else if (urgentTimingMode === "hoje_tarde") timingDesc = "Hoje de Tarde (13:00 - 17:00)";
      else if (urgentTimingMode === "hoje_noite") timingDesc = "Fim do Dia (17:00 - 20:00)";
      else if (urgentTimingMode === "personalizado") {
        timingDesc = `Marcado para ${urgentCustomDate} às ${urgentCustomTime} GMT`;
      }
      return `🚨 URGENTE: ${timingDesc}${
        urgentDetail.trim() ? ` — Nota: ${urgentDetail.trim()}` : ""
      }`;
    }
    const chosenDay = nextDays.find((d) => d.offset === selectedDayOffset);
    if (!effectiveSelectedSlot) {
      return `📅 ${chosenDay?.dayName} (${chosenDay?.dateFormatted}) — Sem horários normais disponíveis (Selecione outro dia ou Atendimento Urgente)`;
    }
    return `📅 Agendado na Agenda: ${chosenDay?.dayName} (${chosenDay?.dateFormatted}) às ${effectiveSelectedSlot} GMT`;
  }, [
    urgency,
    urgentTimingMode,
    urgentCustomDate,
    urgentCustomTime,
    urgentDetail,
    selectedDayOffset,
    effectiveSelectedSlot,
    nextDays,
  ]);

  // Upload de fotos da galeria ou ficheiros
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    filesArray.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Apenas ficheiros de imagem são permitidos.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setPhotos((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    toast.success(`${filesArray.length} foto(s) anexada(s)!`);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // Foto capturada diretamente via câmara ao vivo
  const handlePhotoCaptured = (photoDataUrl: string) => {
    setPhotos((prev) => [...prev, photoDataUrl]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    toast.info("Foto removida");
  };

  const handleOpenCamera = () => {
    // Abre o visor da câmara ao vivo
    setIsCameraModalOpen(true);
  };

  const handleOpenNativeCamera = () => {
    cameraInputRef.current?.click();
  };

  const handleOpenGallery = () => {
    galleryInputRef.current?.click();
  };

  if (!provider) {
    return (
      <AppShell hideNav hideFab>
        <div className="min-h-screen grid place-items-center p-6 text-center">
          <div className="space-y-4">
            <AlertCircle size={40} className="mx-auto text-muted-foreground" />
            <h1 className="text-lg font-bold text-foreground">Prestador não encontrado</h1>
            <button
              onClick={() => router.history.back()}
              className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl"
            >
              Voltar atrás
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Por favor, preencha os campos obrigatórios");
      return;
    }
    if (!formSafety.isValid) {
      toast.error(formSafety.reason || "Conteúdo não permitido detectado.");
      return;
    }
    if (!address.trim()) {
      toast.error("Por favor, indique a morada/rua onde será feito o serviço");
      return;
    }
    if (!referencePoint.trim()) {
      toast.error("Por favor, indique o ponto de referência do local do serviço");
      return;
    }

    setSubmitting(true);

    try {
      store.createDirectQuoteRequest({
        providerId: provider.id,
        providerName: provider.name,
        categorySlug: provider.category.toLowerCase(),
        categoryName: provider.category,
        title: title.trim(),
        description: description.trim(),
        district,
        address: address.trim(),
        referencePoint: referencePoint.trim(),
        urgency,
        scheduleSummary,
        photos,
      });

      // Sincronização automática com calendário do telemóvel e alarmes
      const targetDateStr =
        urgency === "urgente"
          ? urgentTimingMode === "personalizado"
            ? urgentCustomDate
            : todayStr
          : nextDays.find((d) => d.offset === selectedDayOffset)?.fullDateStr || todayStr;

      const targetTimeStr =
        urgency === "urgente"
          ? urgentTimingMode === "imediato"
            ? `${stpTimeShort} GMT (Imediato)`
            : urgentTimingMode === "hoje_manha"
              ? "09:00"
              : urgentTimingMode === "hoje_tarde"
                ? "14:00"
                : urgentTimingMode === "hoje_noite"
                  ? "18:00"
                  : urgentCustomTime
          : effectiveSelectedSlot || "09:00";

      const syncEvent: SyncScheduleEvent = {
        id: `quote_${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        location: `${address.trim()}, ${district} (Ref: ${referencePoint.trim()})`,
        dateStr: targetDateStr,
        timeStr: targetTimeStr,
        providerName: provider.name,
        categoryName: provider.category,
        urgency: urgency === "urgente" ? "🚨 Urgente" : "📅 Normal",
        createdAt: Date.now(),
      };

      // Sincronização automática silenciosa em segundo plano
      registerEventAndAlarms(syncEvent, {
        alarm15m: true,
        alarm1h: true,
        alarmOnTime: true,
      });

      downloadIcsCalendarFile(syncEvent);

      toast.success(`Pedido privado enviado a ${provider.name}!`);
      navigate({ to: "/chat/$id", params: { id: provider.id } });
    } catch {
      toast.error("Erro ao enviar pedido de orçamento");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell hideNav hideFab>
      <div className="min-h-screen bg-surface flex justify-center pb-20">
        <div className="w-full max-w-md bg-surface p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.history.back()}
              className="size-10 rounded-full bg-card ring-1 ring-border flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition"
              aria-label="Voltar"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Pedir Orçamento</h1>
              <p className="text-xs text-muted-foreground">
                Solicite uma proposta a {provider.name}
              </p>
            </div>
          </div>

          {/* Cartão do Prestador */}
          <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3.5 shadow-2xs">
            <img
              src={provider.image}
              alt={provider.name}
              className="size-12 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate">{provider.name}</h3>
              <p className="text-xs text-muted-foreground">{provider.category}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block">Base aprox.</span>
              <span className="text-xs font-bold text-primary">{provider.priceFrom} STN</span>
            </div>
          </div>

          {/* Formulário de Pedido */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                O que precisa que seja feito? *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Instalação de lâmpadas LED e reparação do quadro"
                className="w-full bg-card border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Descrição detalhada do trabalho *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explique o estado atual, materiais necessários e qualquer detalhe relevante para o prestador calcular o valor..."
                className="w-full bg-card border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none leading-relaxed"
              />
              {!formSafety.isValid && (
                <div className="mt-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2 animate-fadeIn">
                  <span className="text-sm shrink-0">🛡️</span>
                  <div>
                    <p className="font-bold">Conteúdo Restrito no {formSafety.field}</p>
                    <p className="mt-0.5 opacity-90">{formSafety.reason}</p>
                  </div>
                </div>
              )}
            </div>

            {/* SEÇÃO DE FOTOS DO PROBLEMA COM ÍCONE CIRCULAR TRACEJADO E SINAL DE MAIS (+) */}
            <div className="space-y-3 bg-card border border-border rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Fotos do problema / avaria
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Opcional · Tire foto com a câmara ou escolha da galeria
                  </span>
                </div>
                {photos.length > 0 && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                    {photos.length} foto(s)
                  </span>
                )}
              </div>

              {/* Inputs invisíveis para Câmara Nativa e Galeria */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageUpload}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />

              {/* Botões: Câmera Circular Tracejada + Botão de Sinal de Mais (+) e Miniaturas */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {/* 1. Ícone Circular Tracejado com Câmera para TIRAR FOTO */}
                <button
                  type="button"
                  onClick={handleOpenCamera}
                  className="size-20 rounded-full border-2 border-dashed border-primary/70 hover:border-primary bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-0.5 text-primary transition active:scale-95 group shrink-0 shadow-2xs cursor-pointer"
                  aria-label="Tirar foto com a câmara do telemóvel"
                  title="Tirar foto com a câmara"
                >
                  <Camera
                    size={26}
                    className="group-hover:scale-110 transition text-primary stroke-[2]"
                  />
                  <span className="text-[8px] font-bold text-primary tracking-tight">
                    Tirar foto
                  </span>
                </button>

                {/* 2. Botão com Sinal de Mais (+) ao lado para ESCOLHER DA GALERIA */}
                <button
                  type="button"
                  onClick={handleOpenGallery}
                  className="size-20 rounded-2xl border-2 border-dashed border-primary/40 hover:border-primary bg-muted/40 hover:bg-primary/5 flex flex-col items-center justify-center gap-1 text-primary transition active:scale-95 shrink-0 cursor-pointer"
                  aria-label="Escolher fotos da galeria"
                  title="Escolher fotos da galeria"
                >
                  <div className="size-7 rounded-full bg-primary/15 text-primary flex items-center justify-center shadow-2xs">
                    <Plus size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-[9px] font-bold text-foreground">Galeria</span>
                </button>

                {/* 3. Fotos anexadas */}
                {photos.map((imgUrl, index) => (
                  <div
                    key={index}
                    className="relative size-20 rounded-2xl overflow-hidden border border-border bg-muted group shadow-2xs shrink-0"
                  >
                    <img
                      src={imgUrl}
                      alt={`Foto do problema ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1 right-1 size-5 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-rose-600 transition shadow-sm"
                      aria-label="Remover foto"
                    >
                      <X size={12} />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[8px] px-1 py-0.5 rounded font-medium">
                      Foto {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* LOCALIZAÇÃO E PONTO DE REFERÊNCIA DO LOCAL DO SERVIÇO */}
            <div className="space-y-3 bg-muted/30 border border-border/80 rounded-2xl p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <MapPin size={15} className="text-primary" />
                  <span>Onde será realizado o serviço?</span>
                </div>
                <button
                  type="button"
                  onClick={handleGetGPS}
                  disabled={isLocatingGPS}
                  className="px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
                  title="Obter coordenadas exatas do GPS do telemóvel"
                >
                  <Compass size={12} className={isLocatingGPS ? "animate-spin" : ""} />
                  <span>{isLocatingGPS ? "A obter GPS..." : "📍 Usar GPS"}</span>
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Indique a localização exata do local da obra, reparação ou instalação.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Distrito do Local do Serviço
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Água Grande (São Tomé)">Água Grande (São Tomé)</option>
                  <option value="Mé-Zóchi (Trindade)">Mé-Zóchi (Trindade)</option>
                  <option value="Cantagalo (Santana)">Cantagalo (Santana)</option>
                  <option value="Lobata (Guadalupe)">Lobata (Guadalupe)</option>
                  <option value="Lembá (Neves)">Lembá (Neves)</option>
                  <option value="Caué (São João dos Angolares)">
                    Caué (São João dos Angolares)
                  </option>
                  <option value="Região Autónoma do Príncipe">Região Autónoma do Príncipe</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Morada / Bairro / Rua do Serviço *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Bairro do Hospital, Rua 12 de Julho"
                  className="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Ponto de Referência do Local do Serviço *
                </label>
                <div className="relative">
                  <Compass size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={referencePoint}
                    onChange={(e) => setReferencePoint(e.target.value)}
                    placeholder="Ex: Próximo à bomba da Total, portão verde em frente ao minimercado"
                    className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            </div>

            {/* SECÇÃO: QUANDO PRETENDE O SERVIÇO */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-bold text-foreground">
                Quando pretende o serviço? *
              </label>

              {/* Toggle de 2 Opções */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setUrgency("esta-semana")}
                  className={`py-3 px-3 rounded-2xl text-xs font-bold border transition flex flex-col items-center gap-1 text-center ${
                    urgency === "esta-semana"
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card border-border text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="text-lg">📅</span>
                  <span>Na Agenda Normal</span>
                  <span className="text-[10px] opacity-85 font-normal">Ver horários livres</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUrgency("urgente")}
                  className={`py-3 px-3 rounded-2xl text-xs font-bold border transition flex flex-col items-center gap-1 text-center ${
                    urgency === "urgente"
                      ? "bg-rose-500 text-white border-rose-600 shadow-sm"
                      : "bg-card border-border text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="text-lg">🚨</span>
                  <span>Urgente / Emergência</span>
                  <span className="text-[10px] opacity-85 font-normal">O mais rápido possível</span>
                </button>
              </div>

              {/* MODO URGENTE */}
              {urgency === "urgente" ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3.5">
                  <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="shrink-0" />
                      <span className="font-bold text-xs">Atendimento Imediato com Prioridade</span>
                    </div>
                    <span className="text-[10px] bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full">
                      Alta Prioridade
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    O prestador será notificado com alerta sonoro e prioridade máxima para responder
                    e deslocar-se.
                  </p>

                  {/* Escolha do Momento da Urgência */}
                  <div className="space-y-2 pt-1 border-t border-rose-500/20">
                    <label className="block text-[11px] font-bold text-foreground">
                      Horário pretendido para a emergência:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setUrgentTimingMode("imediato")}
                        className={`p-2.5 rounded-xl text-left border transition ${
                          urgentTimingMode === "imediato"
                            ? "bg-rose-500 text-white border-rose-600 font-bold shadow-2xs"
                            : "bg-card border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        <span className="block text-xs font-bold">⚡ Imediato</span>
                        <span className="block text-[10px] opacity-80">Próximos 30-45 min</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUrgentTimingMode("hoje_manha")}
                        className={`p-2.5 rounded-xl text-left border transition ${
                          urgentTimingMode === "hoje_manha"
                            ? "bg-rose-500 text-white border-rose-600 font-bold shadow-2xs"
                            : "bg-card border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        <span className="block text-xs font-bold">🌅 Hoje de Manhã</span>
                        <span className="block text-[10px] opacity-80">08:00 - 12:00</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUrgentTimingMode("hoje_tarde")}
                        className={`p-2.5 rounded-xl text-left border transition ${
                          urgentTimingMode === "hoje_tarde"
                            ? "bg-rose-500 text-white border-rose-600 font-bold shadow-2xs"
                            : "bg-card border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        <span className="block text-xs font-bold">☀️ Hoje de Tarde</span>
                        <span className="block text-[10px] opacity-80">13:00 - 17:00</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUrgentTimingMode("personalizado")}
                        className={`p-2.5 rounded-xl text-left border transition ${
                          urgentTimingMode === "personalizado"
                            ? "bg-rose-500 text-white border-rose-600 font-bold shadow-2xs"
                            : "bg-card border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        <span className="block text-xs font-bold">⏱️ Data & Relógio</span>
                        <span className="block text-[10px] opacity-80">Definir data e hora</span>
                      </button>
                    </div>

                    {/* Inputs de Data e Horário no Relógio se Personalizado */}
                    {urgentTimingMode === "personalizado" && (
                      <div className="mt-2 grid grid-cols-2 gap-2 p-3 bg-card border border-rose-500/30 rounded-xl">
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                            Data da Urgência:
                          </label>
                          <input
                            type="date"
                            value={urgentCustomDate}
                            min={todayStr}
                            onChange={(e) => setUrgentCustomDate(e.target.value)}
                            className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                            Hora no Relógio (STP):
                          </label>
                          <input
                            type="time"
                            value={urgentCustomTime}
                            onChange={(e) => setUrgentCustomTime(e.target.value)}
                            className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-foreground mb-1">
                      Nota sobre a emergência (Opcional):
                    </label>
                    <input
                      type="text"
                      value={urgentDetail}
                      onChange={(e) => setUrgentDetail(e.target.value)}
                      placeholder="Ex: Fuga de água abundante, corte total de eletricidade..."
                      className="w-full bg-card border border-rose-500/30 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>
              ) : (
                /* MODO NORMAL: AGENDA DO PRESTADOR */
                <div className="rounded-2xl border border-border/80 bg-card p-3.5 space-y-3.5 text-xs shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-primary" />
                      Agenda de {provider.name.split(" ")[0]}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      ● Vagas disponíveis
                    </span>
                  </div>

                  {/* 1. Escolha o dia */}
                  <div className="space-y-1.5 pt-1 border-t border-border/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-muted-foreground">
                        1. Escolha o dia:
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                        <Clock size={11} className="text-primary" />
                        Hora STP: {stpTimeShort} GMT
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {nextDays.slice(0, 4).map((d) => (
                        <button
                          key={d.offset}
                          type="button"
                          onClick={() => setSelectedDayOffset(d.offset)}
                          className={`p-2 rounded-xl text-center border transition relative ${
                            selectedDayOffset === d.offset
                              ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                              : "bg-card border-border text-foreground hover:bg-muted"
                          }`}
                        >
                          <span className="block text-[11px] capitalize">{d.dayName}</span>
                          <span className="block text-[9px] opacity-80">{d.dateFormatted}</span>
                          {d.offset === 0 && d.allPast && (
                            <span className="block text-[8px] text-rose-500 font-bold mt-0.5">
                              Encerrado
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alerta se todos os horários de hoje já tiverem passado */}
                  {selectedDayOffset === 0 && daySlotsEvaluation.allPast && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Horários normais de hoje já encerrados</p>
                        <p className="opacity-90 text-[10px] mt-0.5">
                          Já passa das {stpTimeShort} GMT em São Tomé. Selecione{" "}
                          <strong>Amanhã</strong> ou altere para{" "}
                          <strong>🚨 Urgente / Emergência</strong>.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 2. Selecione o horário livre */}
                  <div className="space-y-2 pt-1 border-t border-border/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-muted-foreground">
                        2. Horários disponíveis:
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                        <Clock size={11} className="text-primary" />
                        {stpTimeShort} GMT
                      </span>
                    </div>

                    {freeSlotsForDay.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {freeSlotsForDay.map((time) => {
                          const isSelected = effectiveSelectedSlot === time;
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedSlot(time)}
                              className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 text-center ${
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                                  : "bg-card border-border text-foreground hover:border-primary/50 hover:bg-muted"
                              }`}
                            >
                              <Clock
                                size={12}
                                className={isSelected ? "text-primary-foreground" : "text-primary"}
                              />
                              <span>{time}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-muted/50 border border-border text-center space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Sem horários disponíveis para{" "}
                          {nextDays
                            .find((d) => d.offset === selectedDayOffset)
                            ?.dayName.toLowerCase()}
                          .
                        </p>
                        {selectedDayOffset === 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedDayOffset(1)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-2xs"
                          >
                            <Calendar size={12} />
                            Ver horários de Amanhã
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Resumo do agendamento escolhido */}
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3 flex items-start gap-2 text-foreground">
              <CalendarClock size={16} className="shrink-0 text-primary mt-0.5" />
              <div className="text-xs">
                <span className="font-bold block text-primary">Previsão e Local do Serviço:</span>
                <span className="text-muted-foreground text-[11px] leading-tight block">
                  {scheduleSummary}
                </span>
                {address && (
                  <span className="text-[11px] text-foreground font-medium block mt-0.5">
                    📍 {address} {referencePoint ? `(Ponto de Ref: ${referencePoint})` : ""} ·{" "}
                    {district}
                  </span>
                )}
                {photos.length > 0 && (
                  <span className="text-[10px] text-primary font-semibold block mt-1">
                    📸 {photos.length} foto(s) anexada(s) ao pedido
                  </span>
                )}
              </div>
            </div>

            {/* Banner Informativo de Privacidade */}
            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-3.5 flex items-start gap-2.5 text-emerald-800 dark:text-emerald-300">
              <ShieldCheck
                size={18}
                className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400"
              />
              <div className="text-xs space-y-0.5">
                <span className="font-bold block">🔒 Pedido Direto e 100% Privado</span>
                <p className="leading-relaxed opacity-90">
                  Este pedido e as fotos serão enviados exclusivamente para a conversa privada com{" "}
                  {provider.name}. Não é publicado para outros profissionais.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                !formSafety.isValid ||
                !title.trim() ||
                !description.trim() ||
                !address.trim() ||
                !referencePoint.trim()
              }
              className="w-full py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition shadow-sm disabled:opacity-50"
            >
              <Send size={15} />
              <span>
                {submitting
                  ? "A enviar..."
                  : `Enviar Pedido Privado a ${provider.name.split(" ")[0]}`}
              </span>
            </button>
          </form>
        </div>
      </div>

      {/* Modal de Captura de Foto com a Câmara ao Vivo do Telemóvel */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onPhotoCaptured={handlePhotoCaptured}
        onOpenGallery={handleOpenGallery}
      />
    </AppShell>
  );
}
