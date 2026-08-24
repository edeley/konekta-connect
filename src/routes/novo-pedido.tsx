import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  Camera,
  Check,
  MapPin,
  Navigation,
  Zap,
  Plus,
  X,
  Maximize2,
  Image as ImageIcon,
  Calendar,
  Clock,
  CalendarCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader, Section, KCard, ProgressSteps } from "@/components/konekta/kit";
import { Button } from "@/components/ui/button";
import { CameraCaptureModal } from "@/components/CameraCaptureModal";
import { categories } from "@/lib/konekta-data";
import { categoryEmoji, districts } from "@/lib/catalog";
import { store } from "@/lib/store";
import { urgencyLabel, type RequestUrgency } from "@/lib/requests";
import { cn } from "@/lib/utils";
import { validateFormSafety, analyzeBlockedContent } from "@/lib/escrow";
import {
  type SyncScheduleEvent,
  registerEventAndAlarms,
  downloadIcsCalendarFile,
  getCurrentGPSLocation,
} from "@/lib/sync-manager";

export const Route = createFileRoute("/novo-pedido")({
  head: () => ({
    meta: [
      { title: "Publicar pedido · KONEKTA" },
      {
        name: "description",
        content:
          "Descreva o que precisa e receba propostas de prestadores verificados em São Tomé e Príncipe em minutos.",
      },
      { property: "og:title", content: "Publicar pedido · KONEKTA" },
      { property: "og:description", content: "Receba várias propostas e escolha a melhor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewRequest,
});

const timeSlotLabels: Record<string, string> = {
  qualquer: "Qualquer horário",
  manha: "Manhã (08:00 - 12:00)",
  tarde: "Tarde (13:00 - 17:00)",
  noite: "Fim do dia (17:00 - 20:00)",
  exato: "Horário exato",
};

function formatDatePt(dateStr: string) {
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

function NewRequest() {
  const navigate = useNavigate();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split("T")[0];

  const [step, setStep] = useState(1);
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [district, setDistrict] = useState(districts[0]);
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [urgency, setUrgency] = useState<RequestUrgency>("esta-semana");
  const [serviceDate, setServiceDate] = useState<string>(todayStr);
  const [timeSlot, setTimeSlot] = useState<"qualquer" | "manha" | "tarde" | "noite" | "exato">(
    "manha",
  );
  const [exactTime, setExactTime] = useState<string>("09:00");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);

  const handleGetGPS = async () => {
    setIsLocatingGPS(true);
    try {
      const res = await getCurrentGPSLocation();
      if (res) {
        // Match closest district
        const matched =
          districts.find((d) => res.district.toLowerCase().includes(d.toLowerCase())) ||
          districts[0];
        setDistrict(matched);
        if (!address.trim()) {
          setAddress(`Localização GPS (${res.latitude.toFixed(4)}, ${res.longitude.toFixed(4)})`);
        }
        if (!reference.trim()) {
          setReference(`Coordenadas do telemóvel (${res.district})`);
        }
      }
    } finally {
      setIsLocatingGPS(false);
    }
  };

  const category = categories.find((c) => c.slug === categorySlug);

  const formSafety = validateFormSafety({
    Título: title,
    Descrição: description,
    Morada: address,
    Referência: reference,
  });

  const canNext = !formSafety.isValid
    ? false
    : (step === 1 && !!categorySlug) ||
      (step === 2 && title.trim().length >= 5 && description.trim().length >= 15) ||
      (step === 3 && !!district) ||
      step === 4;

  const getTimeLabel = () => {
    if (timeSlot === "exato") return `às ${exactTime}`;
    return timeSlotLabels[timeSlot] || "Qualquer horário";
  };

  const getScheduleSummary = () => {
    if (urgency === "urgente") {
      return `⚡ Urgente (Hoje) · ${getTimeLabel()}`;
    }
    if (urgency === "sem-pressa") {
      return `🕒 Sem pressa (Horário flexível)`;
    }
    return `📅 ${formatDatePt(serviceDate)} · ${getTimeLabel()}`;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);

    filesArray.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Apenas ficheiros de imagem são permitidos");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`A imagem ${file.name} é demasiado grande (máx. 8MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setPhotos((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });

    toast.success(`${filesArray.length} foto(s) selecionada(s)!`);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handlePhotoCaptured = (photoDataUrl: string) => {
    setPhotos((prev) => [...prev, photoDataUrl]);
    toast.success("Foto tirada com sucesso!");
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    toast.info("Foto removida");
  };

  const handleClearAllPhotos = () => {
    setPhotos([]);
    toast.info("Todas as fotos foram removidas");
  };

  function publish() {
    if (!category) return;
    if (!formSafety.isValid) {
      toast.error(formSafety.reason || "Conteúdo não permitido detectado.");
      return;
    }
    const req = store.createRequest({
      categorySlug: category.slug,
      categoryName: category.name,
      title: title.trim(),
      description: description.trim(),
      district,
      address: address.trim() || undefined,
      reference: reference.trim() || undefined,
      urgency,
      preferredDate: serviceDate,
      preferredTime: timeSlot === "exato" ? exactTime : timeSlotLabels[timeSlot],
      scheduleSummary: getScheduleSummary(),
      photos: photos.length,
      photosList: photos,
    });

    // Sincronização automática em segundo plano
    const syncEvent: SyncScheduleEvent = {
      id: `req_${req.id}`,
      title: title.trim(),
      description: description.trim(),
      location: `${address.trim() || "São Tomé e Príncipe"}, ${district}${reference ? ` (Ref: ${reference.trim()})` : ""}`,
      dateStr: urgency === "sem-pressa" ? todayStr : serviceDate,
      timeStr: timeSlot === "exato" ? exactTime : timeSlotLabels[timeSlot] || "09:00",
      categoryName: category.name,
      urgency:
        urgency === "urgente"
          ? "🚨 Urgente"
          : urgency === "sem-pressa"
            ? "🕒 Sem pressa"
            : "📅 Agendado",
      createdAt: Date.now(),
    };

    registerEventAndAlarms(syncEvent, {
      alarm15m: true,
      alarm1h: true,
      alarmOnTime: true,
    });

    if (urgency !== "sem-pressa") {
      downloadIcsCalendarFile(syncEvent);
    }

    toast.success("Pedido publicado com sucesso!");
    navigate({ to: "/pedido/$id", params: { id: req.id } });
  }

  return (
    <AppShell hideNav hideFab>
      <ScreenHeader title="Publicar pedido" subtitle={`Passo ${step} de 4`} />
      <Section>
        <ProgressSteps step={step} total={4} />
      </Section>

      {step === 1 && (
        <Section title="Que serviço precisa?">
          <div className="grid grid-cols-2 gap-3">
            {categories.map((c) => {
              const active = categorySlug === c.slug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setCategorySlug(c.slug)}
                  className={cn(
                    "press flex items-center gap-2 rounded-2xl p-4 text-left shadow-soft transition-colors cursor-pointer",
                    active ? "bg-primary text-primary-foreground" : "bg-card",
                  )}
                >
                  <span className="text-xl">{categoryEmoji[c.slug] ?? "🛠️"}</span>
                  <span className="min-w-0 truncate text-sm font-semibold">{c.name}</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {step === 2 && (
        <Section title="Descreva o trabalho">
          <div className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Instalação de tomadas na sala"
              className="w-full rounded-2xl bg-card p-4 text-sm shadow-soft outline-none ring-primary/30 focus:ring-2"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Explique o que precisa, o estado atual e se já tem material. Quanto mais detalhe, melhores as propostas."
              className="w-full rounded-2xl bg-card p-4 text-sm shadow-soft outline-none ring-primary/30 focus:ring-2"
            />

            {/* Alerta de Segurança e Bloqueio Anti-Bypass */}
            {!formSafety.isValid && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5 animate-fadeIn">
                <span className="text-base shrink-0">🛡️</span>
                <div>
                  <p className="font-bold">Conteúdo Restrito no {formSafety.field}</p>
                  <p className="mt-0.5 opacity-90">{formSafety.reason}</p>
                </div>
              </div>
            )}

            {/* SEÇÃO DE FOTOGRAFIAS TOTALMENTE FUNCIONAL */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-sm font-bold text-foreground">
                    Fotografias do trabalho / avaria
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Opcional · Ajuda o prestador a orçamentar com rigor
                  </span>
                </div>
                {photos.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                      {photos.length} foto(s)
                    </span>
                    <button
                      type="button"
                      onClick={handleClearAllPhotos}
                      className="text-xs font-medium text-destructive hover:underline cursor-pointer"
                    >
                      Limpar
                    </button>
                  </div>
                )}
              </div>

              {/* Inputs nativos escondidos */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageUpload}
              />

              {/* Botões de Ação: Tirar Foto + Escolher da Galeria */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {/* 1. Botão Tirar Foto (Abre Câmara KONEKTA ou Câmara do telemóvel) */}
                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  className="size-20 rounded-2xl border-2 border-dashed border-primary/70 bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-1 text-primary transition active:scale-95 cursor-pointer shadow-2xs group shrink-0"
                  aria-label="Tirar fotografia com a câmara"
                  title="Tirar foto com a câmara"
                >
                  <Camera size={24} className="group-hover:scale-110 transition stroke-[2]" />
                  <span className="text-[10px] font-bold">Tirar foto</span>
                </button>

                {/* 2. Botão Escolher da Galeria */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="size-20 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/40 hover:bg-muted/70 flex flex-col items-center justify-center gap-1 text-foreground transition active:scale-95 cursor-pointer shadow-2xs group shrink-0"
                  aria-label="Escolher fotos da galeria"
                  title="Escolher fotos da galeria"
                >
                  <div className="grid size-7 place-items-center rounded-full bg-primary/15 text-primary">
                    <Plus size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground">
                    Galeria
                  </span>
                </button>

                {/* 3. Miniaturas das Fotografias Anexadas */}
                {photos.map((photoUrl, index) => (
                  <div
                    key={index}
                    className="relative size-20 rounded-2xl overflow-hidden border border-border bg-muted shadow-2xs group shrink-0"
                  >
                    <img
                      src={photoUrl}
                      alt={`Foto ${index + 1}`}
                      className="h-full w-full object-cover cursor-pointer hover:scale-105 transition"
                      onClick={() => setViewingPhoto(photoUrl)}
                    />
                    {/* Botão de Remover Foto */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(index);
                      }}
                      className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/80 text-white hover:bg-destructive transition cursor-pointer shadow-xs"
                      aria-label="Remover fotografia"
                      title="Remover foto"
                    >
                      <X size={12} />
                    </button>
                    {/* Botão de Ampliar / Zoom */}
                    <button
                      type="button"
                      onClick={() => setViewingPhoto(photoUrl)}
                      className="absolute bottom-1 right-1 grid size-5 place-items-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      title="Ver tamanho grande"
                    >
                      <Maximize2 size={10} />
                    </button>
                    <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 py-0.5 text-[8px] font-semibold text-white">
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>

              {photos.length === 0 && (
                <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                  <ImageIcon size={13} className="text-primary shrink-0" />
                  <span>Pode adicionar fotos do local, peças avariadas ou esquema elétrico.</span>
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {step === 3 && (
        <Section title="Onde e quando precisa do serviço?">
          <div className="space-y-4">
            {/* 1. LOCALIZAÇÃO */}
            <KCard className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-foreground">1. Local do serviço</p>
                <button
                  type="button"
                  onClick={handleGetGPS}
                  disabled={isLocatingGPS}
                  className="px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
                  title="Obter coordenadas GPS do telemóvel"
                >
                  <MapPin size={12} className={isLocatingGPS ? "animate-pulse" : ""} />
                  <span>{isLocatingGPS ? "A obter GPS..." : "📍 Usar GPS"}</span>
                </button>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  Distrito de São Tomé e Príncipe
                </p>
                <div className="flex flex-wrap gap-2">
                  {districts.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDistrict(d)}
                      className={cn(
                        "press rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition",
                        d === district
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted text-muted-foreground hover:bg-muted/80",
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-4 text-muted-foreground" />
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Morada ou Bairro onde vai ser o serviço"
                  className="w-full rounded-2xl bg-muted/50 p-4 pl-10 text-sm outline-none ring-primary/30 focus:ring-2"
                />
              </div>

              <div className="relative">
                <Navigation size={16} className="absolute left-4 top-4 text-muted-foreground" />
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ponto de referência (ex.: perto da escola, junto à ponte)"
                  className="w-full rounded-2xl bg-muted/50 p-4 pl-10 text-sm outline-none ring-primary/30 focus:ring-2"
                />
              </div>

              <p className="text-[11px] text-muted-foreground">
                🔒 A sua morada só é partilhada com o prestador que escolher contratar.
              </p>
            </KCard>

            {/* 2. QUANDO PRECISA (INTEGRAÇÃO COM CALENDÁRIO E HORÁRIO DO TELEMÓVEL) */}
            <KCard className="space-y-4">
              <div>
                <p className="text-xs font-bold text-foreground">2. Data e Horário do Serviço</p>
                <p className="text-xs text-muted-foreground">
                  Indique a sua preferência no calendário para os prestadores enviarem propostas
                  adequadas.
                </p>
              </div>

              {/* Botões de Seleção de Urgência / Agendamento */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUrgency("urgente");
                    setServiceDate(todayStr);
                  }}
                  className={cn(
                    "press flex flex-col items-center justify-center gap-1 rounded-2xl p-3 text-center transition cursor-pointer border",
                    urgency === "urgente"
                      ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                      : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted/70",
                  )}
                >
                  <Zap
                    size={18}
                    className={
                      urgency === "urgente"
                        ? "text-primary fill-primary/20"
                        : "text-muted-foreground"
                    }
                  />
                  <span className="text-xs font-bold">Urgente</span>
                  <span className="text-[10px] opacity-80">Hoje</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUrgency("esta-semana");
                  }}
                  className={cn(
                    "press flex flex-col items-center justify-center gap-1 rounded-2xl p-3 text-center transition cursor-pointer border",
                    urgency === "esta-semana"
                      ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                      : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted/70",
                  )}
                >
                  <Calendar
                    size={18}
                    className={urgency === "esta-semana" ? "text-primary" : "text-muted-foreground"}
                  />
                  <span className="text-xs font-bold">Agendar</span>
                  <span className="text-[10px] opacity-80">Calendário</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUrgency("sem-pressa");
                  }}
                  className={cn(
                    "press flex flex-col items-center justify-center gap-1 rounded-2xl p-3 text-center transition cursor-pointer border",
                    urgency === "sem-pressa"
                      ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                      : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted/70",
                  )}
                >
                  <Clock
                    size={18}
                    className={urgency === "sem-pressa" ? "text-primary" : "text-muted-foreground"}
                  />
                  <span className="text-xs font-bold">Sem pressa</span>
                  <span className="text-[10px] opacity-80">Flexível</span>
                </button>
              </div>

              {/* SELETOR DE DATA INTEGRADO AO CALENDÁRIO */}
              {urgency !== "sem-pressa" && (
                <div className="space-y-3 rounded-2xl bg-muted/40 p-3.5 border border-border/70">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Calendar size={14} className="text-primary" />
                      Data do serviço:
                    </span>
                    <span className="text-xs font-semibold text-primary capitalize">
                      {formatDatePt(serviceDate)}
                    </span>
                  </div>

                  {/* Atalhos rápidos de data */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setServiceDate(todayStr)}
                      className={cn(
                        "press rounded-full px-3 py-1 text-xs font-semibold cursor-pointer transition",
                        serviceDate === todayStr
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground border border-border",
                      )}
                    >
                      Hoje
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceDate(tomorrowStr)}
                      className={cn(
                        "press rounded-full px-3 py-1 text-xs font-semibold cursor-pointer transition",
                        serviceDate === tomorrowStr
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground border border-border",
                      )}
                    >
                      Amanhã
                    </button>
                  </div>

                  {/* Campo de Calendário Nativo do Telemóvel */}
                  <div className="relative">
                    <label
                      htmlFor="service-date-picker"
                      className="flex w-full items-center justify-between rounded-xl bg-card p-3 text-sm font-semibold border border-border shadow-2xs cursor-pointer hover:border-primary/50 transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar size={16} className="text-primary shrink-0" />
                        <span className="truncate text-foreground">
                          {formatDatePt(serviceDate) || "Toque para abrir o calendário"}
                        </span>
                      </div>
                      <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary">
                        Alterar no calendário
                      </span>
                    </label>
                    <input
                      id="service-date-picker"
                      ref={dateInputRef}
                      type="date"
                      min={todayStr}
                      value={serviceDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          setServiceDate(e.target.value);
                          if (e.target.value === todayStr) {
                            setUrgency("urgente");
                          } else {
                            setUrgency("esta-semana");
                          }
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      aria-label="Escolher data no calendário"
                    />
                  </div>
                </div>
              )}

              {/* SELETOR DE HORÁRIO / PERÍODO */}
              {urgency !== "sem-pressa" && (
                <div className="space-y-3 rounded-2xl bg-muted/40 p-3.5 border border-border/70">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Clock size={14} className="text-primary" />
                      Horário preferencial:
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      {timeSlot === "exato" ? `às ${exactTime}` : timeSlotLabels[timeSlot]}
                    </span>
                  </div>

                  {/* Botões rápidos de período */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => setTimeSlot("manha")}
                      className={cn(
                        "press rounded-xl p-2.5 text-left text-xs font-semibold cursor-pointer border transition",
                        timeSlot === "manha"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:border-primary/40",
                      )}
                    >
                      <span className="block font-bold">☀️ Manhã</span>
                      <span className="block text-[10px] opacity-80">08:00 – 12:00</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTimeSlot("tarde")}
                      className={cn(
                        "press rounded-xl p-2.5 text-left text-xs font-semibold cursor-pointer border transition",
                        timeSlot === "tarde"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:border-primary/40",
                      )}
                    >
                      <span className="block font-bold">🌤️ Tarde</span>
                      <span className="block text-[10px] opacity-80">13:00 – 17:00</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTimeSlot("noite")}
                      className={cn(
                        "press rounded-xl p-2.5 text-left text-xs font-semibold cursor-pointer border transition",
                        timeSlot === "noite"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:border-primary/40",
                      )}
                    >
                      <span className="block font-bold">🌙 Fim do dia</span>
                      <span className="block text-[10px] opacity-80">17:00 – 20:00</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTimeSlot("exato")}
                      className={cn(
                        "press rounded-xl p-2.5 text-left text-xs font-semibold cursor-pointer border transition",
                        timeSlot === "exato"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:border-primary/40",
                      )}
                    >
                      <span className="block font-bold">⏰ Horário exato</span>
                      <span className="block text-[10px] opacity-80">Definir hora</span>
                    </button>
                  </div>

                  {/* Se horário exato for escolhido */}
                  {timeSlot === "exato" && (
                    <div className="pt-1">
                      <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                        Definir hora exata:
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          value={exactTime}
                          onChange={(e) => setExactTime(e.target.value)}
                          className="w-full rounded-xl bg-card p-3 text-sm font-bold border border-border shadow-2xs outline-none ring-primary/30 focus:ring-2"
                        />
                      </div>
                    </div>
                  )}

                  {/* Opção Qualquer Horário */}
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => setTimeSlot("qualquer")}
                      className={cn(
                        "text-xs font-medium cursor-pointer underline hover:text-primary transition",
                        timeSlot === "qualquer"
                          ? "text-primary font-bold"
                          : "text-muted-foreground",
                      )}
                    >
                      {timeSlot === "qualquer"
                        ? "✓ Qualquer horário selecionado"
                        : "Tenho disponibilidade a qualquer horário"}
                    </button>
                  </div>
                </div>
              )}

              {/* CARD DE RESUMO DO AGENDAMENTO */}
              <div className="flex items-start gap-2.5 rounded-2xl bg-primary/5 p-3.5 border border-primary/20">
                <CalendarCheck size={18} className="text-primary shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-foreground">Agendamento definido para:</p>
                  <p className="text-primary font-semibold capitalize">{getScheduleSummary()}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Os prestadores enviarão os seus orçamentos tendo em conta esta data e horário.
                  </p>
                </div>
              </div>
            </KCard>
          </div>
        </Section>
      )}

      {step === 4 && (
        <Section title="Rever e publicar">
          <KCard className="space-y-3">
            <Row label="Categoria" value={category?.name ?? "—"} />
            <Row label="Título" value={title} />
            <Row label="Descrição" value={description} />
            <Row label="Local do pedido" value={address ? `${district} · ${address}` : district} />
            <Row label="Ponto de referência" value={reference || "—"} />
            <Row label="Data e Horário" value={getScheduleSummary()} />
            <Row
              label="Fotografias"
              value={photos.length > 0 ? `${photos.length} foto(s) anexada(s)` : "Nenhuma foto"}
            />

            {/* Galeria de Fotos no Resumo */}
            {photos.length > 0 && (
              <div className="pt-2 border-t border-border/60">
                <span className="text-xs font-semibold text-muted-foreground mb-2 block">
                  Pré-visualização das fotos ({photos.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {photos.map((photoUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setViewingPhoto(photoUrl)}
                      className="relative size-16 rounded-xl overflow-hidden border border-border bg-muted group shrink-0 active:scale-95 transition cursor-pointer"
                      title="Ver foto em tamanho grande"
                    >
                      <img
                        src={photoUrl}
                        alt={`Foto ${idx + 1}`}
                        className="h-full w-full object-cover group-hover:scale-110 transition"
                      />
                      <span className="absolute bottom-0.5 right-0.5 rounded bg-black/75 px-1 text-[8px] font-medium text-white">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </KCard>

          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-accent/40 p-3.5 text-xs text-accent-foreground">
            <Sparkles size={16} className="text-primary shrink-0" />
            <p>
              Os prestadores verificados de <strong>{category?.name}</strong> vão receber o seu
              pedido e enviar os respetivos <strong>orçamentos</strong> pelo chat da KONEKTA.
            </p>
          </div>
        </Section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md gap-3 bg-surface/95 p-4 backdrop-blur-md">
        {step > 1 && (
          <Button
            variant="outline"
            className="h-12 flex-1 rounded-2xl cursor-pointer"
            onClick={() => setStep(step - 1)}
          >
            Voltar
          </Button>
        )}
        <Button
          className="h-12 flex-[2] rounded-2xl text-base font-bold cursor-pointer"
          disabled={!canNext}
          onClick={() => (step === 4 ? publish() : setStep(step + 1))}
        >
          {step === 4 ? "Publicar pedido" : "Continuar"}
        </Button>
      </div>

      {/* Modal de Câmara ao Vivo KONEKTA */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onPhotoCaptured={handlePhotoCaptured}
        onOpenGallery={() => {
          setIsCameraModalOpen(false);
          galleryInputRef.current?.click();
        }}
      />

      {/* Modal de visualização de foto em ecrã inteiro (Lightbox) */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="relative max-h-[85vh] max-w-full">
            <img
              src={viewingPhoto}
              alt="Foto em tamanho grande"
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setViewingPhoto(null)}
              className="absolute -top-3 -right-3 grid size-9 place-items-center rounded-full bg-white text-black shadow-lg hover:bg-neutral-200 transition cursor-pointer"
              aria-label="Fechar visualização"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 font-medium">{value || "—"}</span>
    </div>
  );
}
