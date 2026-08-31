import { useState, useRef, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  Package,
  Wrench,
  HelpCircle,
  Coins,
  ShieldCheck,
  ChevronRight,
  Lightbulb,
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
import { validateFormSafety } from "@/lib/escrow";
import {
  type SyncScheduleEvent,
  registerEventAndAlarms,
  downloadIcsCalendarFile,
  getCurrentGPSLocation,
} from "@/lib/sync-manager";
import {
  STP_QUICK_SERVICE_TEMPLATES,
  getStpDistrictData,
  type ServiceQuickTemplate,
} from "@/lib/stp-order-intelligence";

export const Route = createFileRoute("/novo-pedido")({
  head: () => ({
    meta: [
      { title: "Publicar Pedido · KONEKTA STP" },
      {
        name: "description",
        content:
          "Publique o seu pedido de serviço em São Tomé e Príncipe e receba orçamentos de profissionais credenciados em Dobras (STN).",
      },
      { property: "og:title", content: "Publicar Pedido · KONEKTA STP" },
      { property: "og:description", content: "Receba várias propostas de prestadores em STP." },
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
  const [materialStatus, setMaterialStatus] = useState<
    "tem_material" | "prestador_compra" | "avaliar"
  >("avaliar");
  const [budgetEstimate, setBudgetEstimate] = useState<string>("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [detectedGps, setDetectedGps] = useState<{
    zone: string;
    district: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    mapsUrl: string;
  } | null>(null);

  // Obter referências geográficas locais para o distrito atual
  const localGeo = useMemo(() => getStpDistrictData(district), [district]);

  // Modelos pré-configurados para a categoria selecionada
  const categoryTemplates = useMemo(() => {
    if (!categorySlug) return STP_QUICK_SERVICE_TEMPLATES.slice(0, 6);
    return STP_QUICK_SERVICE_TEMPLATES.filter((t) => t.categorySlug === categorySlug);
  }, [categorySlug]);

  const applyTemplate = (tpl: ServiceQuickTemplate) => {
    setCategorySlug(tpl.categorySlug);
    setTitle(tpl.title);
    setDescription(tpl.suggestedDesc);
    setMaterialStatus(tpl.materialStatus);
    setBudgetEstimate(tpl.estimatedBudgetSTN.toString());
    setUrgency(tpl.urgency);
    toast.success(`Modelo "${tpl.title}" aplicado com sucesso!`);
    setStep(2);
  };

  const handleGetGPS = async () => {
    setIsLocatingGPS(true);
    try {
      const res = await getCurrentGPSLocation();
      if (res) {
        // Encontra o distrito correspondente
        const matched =
          districts.find((d) => res.district.toLowerCase().includes(d.toLowerCase())) ||
          districts[0];
        setDistrict(matched);
        const zoneName = res.zone || matched;
        setDetectedGps({
          zone: zoneName,
          district: matched,
          latitude: res.latitude,
          longitude: res.longitude,
          accuracy: res.accuracy,
          mapsUrl: res.mapsUrl || `https://www.google.com/maps?q=${res.latitude},${res.longitude}`,
        });

        if (!address.trim() || address.startsWith("Localização GPS")) {
          setAddress(`${zoneName}, ${matched}`);
        }
        if (!reference.trim() || reference.startsWith("Coordenadas")) {
          setReference(`GPS do Telemóvel: ${zoneName} (±${Math.round(res.accuracy)}m)`);
        }
        toast.success(`Está em ${zoneName} (${matched})!`);
      }
    } catch {
      toast.error("Não foi possível aceder ao GPS.");
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
      (step === 2 && title.trim().length >= 4 && description.trim().length >= 10) ||
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
        toast.error("Apenas ficheiros de imagem são permitidos.");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`A imagem ${file.name} é demasiado grande (máx. 8MB).`);
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

    toast.success(`${filesArray.length} foto(s) anexada(s)!`);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handlePhotoCaptured = (photoDataUrl: string) => {
    setPhotos((prev) => [...prev, photoDataUrl]);
    toast.success("Foto tirada com sucesso!");
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    toast.info("Foto removida.");
  };

  const handleClearAllPhotos = () => {
    setPhotos([]);
    toast.info("Todas as fotos foram removidas.");
  };

  function publish() {
    if (!category) return;
    if (!formSafety.isValid) {
      toast.error(formSafety.reason || "Conteúdo não permitido detectado.");
      return;
    }

    const numericBudget = budgetEstimate ? Number(budgetEstimate) : undefined;

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
      budget: numericBudget,
      materialStatus,
      photos: photos.length,
      photosList: photos,
    });

    // Sincronização em segundo plano
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

    toast.success("Pedido publicado em STP com sucesso!", {
      description: "Os prestadores da sua zona receberão a notificação de imediato.",
    });
    navigate({ to: "/pedido/$id", params: { id: req.id } });
  }

  return (
    <AppShell hideNav hideFab>
      <ScreenHeader
        title="Publicar Pedido de Serviço"
        subtitle={`Passo ${step} de 4 · Mercado de São Tomé e Príncipe`}
      />
      <Section>
        <ProgressSteps step={step} total={4} />
      </Section>

      {/* PASSO 1: CATEGORIA + MODELOS FREQUENTES DE STP */}
      {step === 1 && (
        <div className="space-y-4">
          <Section title="Que tipo de profissional precisa?">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {categories.map((c) => {
                const active = categorySlug === c.slug;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setCategorySlug(c.slug)}
                    className={cn(
                      "press flex flex-col items-center justify-center text-center gap-1.5 rounded-2xl p-3.5 shadow-soft transition-all cursor-pointer border",
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]"
                        : "bg-card text-foreground border-border hover:border-primary/40",
                    )}
                  >
                    <span className="text-2xl">{categoryEmoji[c.slug] ?? "🛠️"}</span>
                    <span className="text-xs font-bold leading-tight line-clamp-1">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Modelos Inteligentes Mais Pedidos em STP */}
          <Section title="Pedidos Mais Frequentes em STP (Preenchimento Rápido)">
            <p className="text-xs text-muted-foreground -mt-2 mb-3">
              Toque num modelo para preencher a descrição, materiais e estimativa automaticamente.
            </p>
            <div className="space-y-2">
              {categoryTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  className="p-3.5 rounded-2xl bg-card border border-border hover:border-primary/50 shadow-soft cursor-pointer transition-all hover:bg-muted/30 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                          {tpl.badge}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          {tpl.categoryName}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition">
                        {tpl.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {tpl.suggestedDesc}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-foreground block">
                        ~{tpl.estimatedBudgetSTN} STN
                      </span>
                      <span className="text-[10px] text-primary font-bold inline-flex items-center gap-0.5 mt-1">
                        Usar <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* PASSO 2: DETALHES, MATERIAIS & FOTOS */}
      {step === 2 && (
        <Section title="Descreva o trabalho e os materiais">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Título do Pedido *</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Mínimo 4 caracteres
                </span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Reparação urgente de bomba de água em Pantufo"
                className="w-full rounded-2xl bg-card p-3.5 text-xs font-medium border border-border shadow-soft outline-none ring-primary/30 focus:ring-2"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Descrição detalhada *</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Mínimo 10 caracteres
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Explique o que aconteceu, se tem água/luz no local e dimensões aproximadas. Quanto mais detalhe der, mais precisos serão os orçamentos dos prestadores."
                className="w-full rounded-2xl bg-card p-3.5 text-xs leading-relaxed border border-border shadow-soft outline-none ring-primary/30 focus:ring-2"
              />
            </div>

            {/* Situação dos Materiais de Construção / Peças (Específico de STP) */}
            <div className="space-y-2 rounded-2xl bg-muted/40 p-3.5 border border-border">
              <div className="flex items-center gap-1.5">
                <Package size={14} className="text-primary" />
                <span className="text-xs font-bold text-foreground">
                  Como está a situação dos materiais / peças?
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    id: "tem_material",
                    label: "Já tenho os materiais",
                    desc: "Só preciso da mão de obra",
                    icon: "📦",
                  },
                  {
                    id: "prestador_compra",
                    label: "Prestador deve comprar",
                    desc: "Incluir no orçamento",
                    icon: "🛒",
                  },
                  {
                    id: "avaliar" as const,
                    label: "Avaliar na visita",
                    desc: "Prestador faz lista no local",
                    icon: "🔍",
                  },
                ].map((item) => {
                  const active = materialStatus === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMaterialStatus(item.id)}
                      className={cn(
                        "p-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between",
                        active
                          ? "bg-primary/10 border-primary text-primary shadow-2xs font-semibold"
                          : "bg-card border-border text-foreground hover:bg-muted/60",
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{item.icon}</span>
                        <span className="text-xs font-bold">{item.label}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Estimativa de Orçamento Voluntária */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Coins size={13} className="text-amber-500" />
                  Estimativa de Valor / Orçamento Pretendido (Opcional)
                </span>
                <span className="text-[10px] text-muted-foreground">Dobras (STN)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={budgetEstimate}
                  onChange={(e) => setBudgetEstimate(e.target.value)}
                  placeholder="Ex.: 450 (ou deixe em branco para receber propostas abertas)"
                  className="w-full rounded-2xl bg-card p-3.5 text-xs font-mono font-bold border border-border shadow-soft outline-none ring-primary/30 focus:ring-2"
                />
                <span className="absolute right-4 top-3.5 text-xs font-bold text-muted-foreground">
                  STN
                </span>
              </div>
            </div>

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

            {/* SEÇÃO DE FOTOGRAFIAS */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-foreground">
                    Fotografias do local / avaria
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    Ajuda os profissionais a estimar o material e o tempo exato
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

              {/* Inputs nativos */}
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

              {/* Botões de Ação */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  className="size-18 rounded-2xl border-2 border-dashed border-primary/70 bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-1 text-primary transition active:scale-95 cursor-pointer shadow-2xs group shrink-0"
                >
                  <Camera size={20} className="group-hover:scale-110 transition stroke-[2]" />
                  <span className="text-[10px] font-bold">Câmara</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="size-18 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/40 hover:bg-muted/70 flex flex-col items-center justify-center gap-1 text-foreground transition active:scale-95 cursor-pointer shadow-2xs group shrink-0"
                >
                  <div className="grid size-6 place-items-center rounded-full bg-primary/15 text-primary">
                    <Plus size={16} strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground">
                    Galeria
                  </span>
                </button>

                {photos.map((photoUrl, index) => (
                  <div
                    key={index}
                    className="relative size-18 rounded-2xl overflow-hidden border border-border bg-muted shadow-2xs group shrink-0"
                  >
                    <img
                      src={photoUrl}
                      alt={`Foto ${index + 1}`}
                      className="h-full w-full object-cover cursor-pointer hover:scale-105 transition"
                      onClick={() => setViewingPhoto(photoUrl)}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(index);
                      }}
                      className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/80 text-white hover:bg-destructive transition cursor-pointer shadow-xs"
                    >
                      <X size={12} />
                    </button>
                    <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 py-0.5 text-[8px] font-semibold text-white">
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* PASSO 3: LOCALIZAÇÃO SANTOMENSE COM BAIRROS & AGENDAMENTO */}
      {step === 3 && (
        <Section title="Onde e quando precisa do serviço em STP?">
          <div className="space-y-4">
            {/* 1. LOCALIZAÇÃO ADAPTADA A SÃO TOMÉ E PRÍNCIPE */}
            <KCard className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-primary" />
                  <p className="text-xs font-bold text-foreground">1. Distrito e Bairro</p>
                </div>
                <button
                  type="button"
                  onClick={handleGetGPS}
                  disabled={isLocatingGPS}
                  className="px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold flex items-center gap-1 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Navigation size={12} className={isLocatingGPS ? "animate-spin" : ""} />
                  <span>{isLocatingGPS ? "A detetar Zona..." : "📍 Usar GPS"}</span>
                </button>
              </div>

              {detectedGps && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      📍 Zona Identificada: {detectedGps.zone} ({detectedGps.district})
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                      ±{Math.round(detectedGps.accuracy)}m
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Os profissionais da sua zona receberão a rota para deslocação direta sem atrasos.
                  </p>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  Distrito de São Tomé e Príncipe *
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {districts.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDistrict(d)}
                      className={cn(
                        "press rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition border",
                        d === district
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80",
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sugestões Rápidas de Bairros Populares do Distrito */}
              <div className="space-y-1.5 p-2.5 rounded-xl bg-muted/40 border border-border">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <Lightbulb size={12} className="text-amber-500" />
                  Bairros populares em <strong>{district}</strong> (toque para escolher):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {localGeo.popularNeighborhoods.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setAddress(b)}
                      className="px-2 py-0.5 rounded-lg bg-card border border-border text-[11px] font-medium text-foreground hover:bg-primary/10 hover:text-primary transition cursor-pointer"
                    >
                      + {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campo de Morada / Bairro */}
              <div className="relative">
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Nome do Bairro, Rua ou Zona (ex.: Riboque, Quinta de Santo António)"
                  className="w-full rounded-2xl bg-card p-3.5 text-xs font-medium border border-border shadow-2xs outline-none ring-primary/30 focus:ring-2"
                />
              </div>

              {/* Ponto de Referência Local Santomense */}
              <div className="space-y-1.5">
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ponto de referência local (ex.: perto da escola, junto à igreja ou paragem de táxi)"
                  className="w-full rounded-2xl bg-card p-3.5 text-xs font-medium border border-border shadow-2xs outline-none ring-primary/30 focus:ring-2"
                />

                {/* Sugestões de Pontos de Referência */}
                <div className="flex items-center gap-1 overflow-x-auto py-1">
                  <span className="text-[10px] text-muted-foreground shrink-0">Exemplos:</span>
                  {localGeo.commonLandmarks.slice(0, 3).map((lm, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReference(lm)}
                      className="px-2 py-0.5 rounded-full bg-muted border border-border text-[10px] text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                    >
                      {lm}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                🔒 A sua morada exata só é facultada ao prestador que escolher contratar.
              </p>
            </KCard>

            {/* 2. AGENDAMENTO INTEGRADO */}
            <KCard className="space-y-3.5">
              <div>
                <p className="text-xs font-bold text-foreground">2. Data e Horário do Serviço</p>
                <p className="text-[11px] text-muted-foreground">
                  Quando gostaria que o profissional comparecesse no local?
                </p>
              </div>

              {/* Botões de Urgência */}
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
                  onClick={() => setUrgency("esta-semana")}
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
                  <span className="text-[10px] opacity-80">Esta Semana</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUrgency("sem-pressa")}
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

              {/* SELETOR DE DATA */}
              {urgency !== "sem-pressa" && (
                <div className="space-y-3 rounded-2xl bg-muted/40 p-3.5 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Calendar size={14} className="text-primary" />
                      Data pretendida:
                    </span>
                    <span className="text-xs font-semibold text-primary capitalize">
                      {formatDatePt(serviceDate)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setServiceDate(todayStr)}
                      className={cn(
                        "press rounded-full px-3 py-1 text-xs font-semibold cursor-pointer transition border",
                        serviceDate === todayStr
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border",
                      )}
                    >
                      Hoje
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceDate(tomorrowStr)}
                      className={cn(
                        "press rounded-full px-3 py-1 text-xs font-semibold cursor-pointer transition border",
                        serviceDate === tomorrowStr
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border",
                      )}
                    >
                      Amanhã
                    </button>
                  </div>

                  <div className="relative">
                    <label
                      htmlFor="service-date-picker"
                      className="flex w-full items-center justify-between rounded-xl bg-card p-3 text-xs font-semibold border border-border shadow-2xs cursor-pointer hover:border-primary/50 transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar size={15} className="text-primary shrink-0" />
                        <span className="truncate text-foreground">
                          {formatDatePt(serviceDate) || "Escolher data no calendário"}
                        </span>
                      </div>
                      <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                        Alterar Data
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
                    />
                  </div>
                </div>
              )}

              {/* SELETOR DE HORÁRIO */}
              {urgency !== "sem-pressa" && (
                <div className="space-y-3 rounded-2xl bg-muted/40 p-3.5 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Clock size={14} className="text-primary" />
                      Período preferencial:
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      {timeSlot === "exato" ? `às ${exactTime}` : timeSlotLabels[timeSlot]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      {
                        id: "manha" as const,
                        label: "☀️ Manhã",
                        time: "08:00 – 12:00",
                      },
                      {
                        id: "tarde" as const,
                        label: "🌤️ Tarde",
                        time: "13:00 – 17:00",
                      },
                      {
                        id: "noite" as const,
                        label: "🌙 Fim do dia",
                        time: "17:00 – 20:00",
                      },
                      {
                        id: "exato" as const,
                        label: "⏰ Hora exata",
                        time: "Definir hora",
                      },
                    ].map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setTimeSlot(slot.id)}
                        className={cn(
                          "press rounded-xl p-2.5 text-left text-xs font-semibold cursor-pointer border transition",
                          timeSlot === slot.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-muted-foreground border-border hover:border-primary/40",
                        )}
                      >
                        <span className="block font-bold">{slot.label}</span>
                        <span className="block text-[10px] opacity-80">{slot.time}</span>
                      </button>
                    ))}
                  </div>

                  {timeSlot === "exato" && (
                    <div className="pt-1">
                      <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                        Definir hora exata:
                      </label>
                      <input
                        type="time"
                        value={exactTime}
                        onChange={(e) => setExactTime(e.target.value)}
                        className="w-full rounded-xl bg-card p-2.5 text-xs font-bold border border-border shadow-2xs outline-none ring-primary/30 focus:ring-2"
                      />
                    </div>
                  )}
                </div>
              )}
            </KCard>
          </div>
        </Section>
      )}

      {/* PASSO 4: REVISÃO COMPLETA COM GARANTIA KONEKTA */}
      {step === 4 && (
        <Section title="Rever e Publicar Pedido">
          <KCard className="space-y-3.5">
            <Row label="Categoria" value={category?.name ?? "—"} />
            <Row label="Título" value={title} />
            <Row label="Descrição" value={description} />
            <Row
              label="Materiais"
              value={
                materialStatus === "tem_material"
                  ? "📦 Já tenho os materiais"
                  : materialStatus === "prestador_compra"
                    ? "🛒 Prestador deve comprar"
                    : "🔍 Avaliar na visita técnica"
              }
            />
            <Row
              label="Orçamento Pretendido"
              value={
                budgetEstimate
                  ? `${Number(budgetEstimate).toLocaleString("pt-PT")} STN`
                  : "Aberto a propostas"
              }
            />
            <Row label="Local em STP" value={address ? `${district} · ${address}` : district} />
            <Row label="Ponto de Referência" value={reference || "—"} />
            <Row label="Data e Horário" value={getScheduleSummary()} />
            <Row
              label="Fotografias"
              value={photos.length > 0 ? `${photos.length} foto(s) anexada(s)` : "Nenhuma foto"}
            />

            {/* Galeria de Fotos */}
            {photos.length > 0 && (
              <div className="pt-2 border-t border-border">
                <span className="text-xs font-semibold text-muted-foreground mb-2 block">
                  Fotos anexadas ({photos.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {photos.map((photoUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setViewingPhoto(photoUrl)}
                      className="relative size-14 rounded-xl overflow-hidden border border-border bg-muted shrink-0 cursor-pointer"
                    >
                      <img
                        src={photoUrl}
                        alt={`Foto ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </KCard>

          {/* Garantia KONEKTA de São Tomé e Príncipe */}
          <div className="mt-3.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-2.5">
            <ShieldCheck
              size={18}
              className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
            />
            <div className="space-y-0.5">
              <p className="font-bold">Proteção & Pagamento Seguro em STP</p>
              <p className="text-[11px] leading-relaxed opacity-90">
                A publicação do pedido é 100% gratuita. O seu pagamento só é libertado ao prestador
                após a conclusão do serviço e validação do seu PIN de segurança.
              </p>
            </div>
          </div>
        </Section>
      )}

      {/* BARRA FIXA DE AÇÃO */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md gap-3 bg-surface/95 p-4 backdrop-blur-md border-t border-border/40">
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
          className="h-12 flex-[2] rounded-2xl text-sm font-bold cursor-pointer"
          disabled={!canNext}
          onClick={() => (step === 4 ? publish() : setStep(step + 1))}
        >
          {step === 4 ? "Publicar Pedido Agora" : "Continuar"}
        </Button>
      </div>

      {/* Modal de Câmara ao Vivo */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onPhotoCaptured={handlePhotoCaptured}
        onOpenGallery={() => {
          setIsCameraModalOpen(false);
          galleryInputRef.current?.click();
        }}
      />

      {/* Visualizador de Foto Lightbox */}
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
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 font-medium text-foreground">{value || "—"}</span>
    </div>
  );
}
