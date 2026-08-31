import React, { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Tag,
  Search,
  FileText,
  Camera,
  Trash2,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  ChevronRight,
  Plus,
  Minus,
  Sun,
  Boxes,
  Maximize2,
  Car,
  CheckSquare,
  Receipt,
  Lock,
  Info,
} from "lucide-react";
import { STP_DISTRICTS } from "@/lib/auth-schemas";
import { store, useStore } from "@/lib/store";
import { useSTPClock } from "@/lib/stp-time";
import {
  type Provider,
  type ServiceItemDetail,
  type BillingMethodType,
  getProviderServicesWithPricing,
} from "@/lib/konekta-data";
import {
  type BillingModel,
  type MaterialsMode,
  type QuoteExtraItem,
  BILLING_MODELS,
  calculateQuote,
  formatDb,
} from "@/lib/pricing-engine";
import { STPSchedulePicker, type ScheduleSelection } from "./STPSchedulePicker";
import { validateFormSafety } from "@/lib/escrow";
import {
  type SyncScheduleEvent,
  registerEventAndAlarms,
  downloadIcsCalendarFile,
  getCurrentGPSLocation,
} from "@/lib/sync-manager";
import { toast } from "sonner";

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  provider: Provider;
  initialService?: string;
}

export function BookingModal({ open, onClose, provider, initialService }: BookingModalProps) {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const commissionPct = useStore((s) => s.config.commissionPct);
  const { time: stpTime, timeShort: stpTimeShort } = useSTPClock();

  // Obter serviços com preços individuais e métodos de cobrança
  const availableServices = useMemo(() => {
    return getProviderServicesWithPricing(provider);
  }, [provider]);

  // Serviço Selecionado
  const [selectedServiceId, setSelectedServiceId] = useState<string>(() => {
    if (initialService) {
      const match = availableServices.find(
        (s) =>
          s.name.toLowerCase() === initialService.toLowerCase() ||
          s.name.toLowerCase().includes(initialService.toLowerCase()),
      );
      if (match) return match.id;
    }
    return availableServices[0]?.id || "";
  });

  const currentService: ServiceItemDetail | undefined = useMemo(() => {
    return availableServices.find((s) => s.id === selectedServiceId) || availableServices[0];
  }, [availableServices, selectedServiceId]);

  // Mapeamento do método do serviço para os 8 modelos MVP
  const currentBillingModel: BillingModel = useMemo(() => {
    if (!currentService) return "fixo";
    if (currentService.billingMethod === "hora") return "hora";
    if (currentService.billingMethod === "diagnostico") return "visita";
    if (currentService.billingMethod === "orcamento") return "orcamento";
    if (currentService.unit === "m²" || currentService.unit === "m2") return "m2";
    if (currentService.unit === "dia") return "dia";
    if (
      currentService.unit &&
      currentService.unit !== "serviço" &&
      currentService.unit !== "hora" &&
      currentService.unit !== "dia" &&
      currentService.unit !== "m²"
    ) {
      return "unidade";
    }
    return "fixo";
  }, [currentService]);

  // Contadores de Quantidade Dinâmicos conforme o modelo
  const [quantity, setQuantity] = useState<number>(() => {
    if (currentBillingModel === "hora") return 2;
    if (currentBillingModel === "m2") return 25;
    if (currentBillingModel === "unidade") return 4;
    return 1;
  });

  // Extras Selecionados
  const [extras, setExtras] = useState<QuoteExtraItem[]>([
    { id: "e1", name: "Material de fixação e buchas", price: 150, selected: false },
    { id: "e2", name: "Limpeza pós-serviço e recolha de resíduos", price: 200, selected: false },
  ]);

  const handleToggleExtra = (id: string) => {
    setExtras((prev) => prev.map((e) => (e.id === id ? { ...e, selected: !e.selected } : e)));
  };

  // Detalhe do Problema pelo Cliente
  const [problemDescription, setProblemDescription] = useState<string>("");
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Agendamento Inteligente STP
  const [schedule, setSchedule] = useState<ScheduleSelection>({
    isUrgent: false,
    scheduledFor: "Hoje, 14:00",
    dateStr: "Hoje",
    timeSlot: "14:00",
  });

  // Localização em São Tomé com GPS Inteligente
  const [district, setDistrict] = useState<string>(user?.district || STP_DISTRICTS[0]);
  const [address, setAddress] = useState<string>(user?.address || "");
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [detectedGpsInfo, setDetectedGpsInfo] = useState<{
    zone: string;
    district: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    mapsUrl: string;
  } | null>(null);

  const handleGetGPS = async () => {
    setIsLocatingGPS(true);
    try {
      const res = await getCurrentGPSLocation();
      if (res) {
        const matched =
          STP_DISTRICTS.find((d) => res.district.toLowerCase().includes(d.toLowerCase())) ||
          STP_DISTRICTS[0];
        setDistrict(matched);
        const zoneName = res.zone || matched;
        setDetectedGpsInfo({
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
      }
    } finally {
      setIsLocatingGPS(false);
    }
  };

  // Estados de submissão
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deslocação e transporte acordados diretamente com o profissional (sem taxa forçada arbitrária)
  const displacementFee = useMemo(() => {
    if (!currentService) return 0;
    if (currentService.travelFeeAmount !== undefined) {
      return currentService.travelFeeAmount;
    }
    return 0; // Por defeito: 0 Db (sem valor forçado, a combinar diretamente com o profissional se necessário)
  }, [currentService]);

  const quoteCalculation = useMemo(() => {
    const basePrice = currentService?.price || provider.priceFrom || 500;
    return calculateQuote({
      billingModel: currentBillingModel,
      unitPrice: basePrice,
      quantity,
      minQuantity: currentBillingModel === "hora" ? 2 : 1,
      customUnitName: currentService?.unit,
      displacementFee,
      extras,
      urgencyFee: schedule.isUrgent ? 300 : 0,
      feePct: commissionPct,
    });
  }, [
    currentService,
    provider,
    currentBillingModel,
    quantity,
    displacementFee,
    extras,
    schedule.isUrgent,
    commissionPct,
  ]);

  if (!open) return null;

  // Gestão de Fotos de Anexo
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachedPhotos.length >= 3) {
      toast.error("Máximo de 3 fotografias por pedido.");
      return;
    }

    setIsUploadingPhoto(true);
    const file = files[0];
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttachedPhotos((prev) => [...prev, reader.result as string]);
        toast.success("Foto da avaria anexada com sucesso.");
      }
      setIsUploadingPhoto(false);
    };

    reader.onerror = () => {
      toast.error("Erro ao carregar a fotografia.");
      setIsUploadingPhoto(false);
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (index: number) => {
    setAttachedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Submissão do Pedido
  const handleConfirm = () => {
    setError(null);

    if (!currentService) {
      setError("Selecione um serviço para continuar.");
      return;
    }

    const formSafety = validateFormSafety({
      "Descrição do Problema": problemDescription,
      Morada: address,
    });

    if (!formSafety.isValid) {
      setError(formSafety.reason || "Conteúdo não permitido detectado.");
      return;
    }

    if (problemDescription.trim().length < 10) {
      setError(
        "Por favor, descreva o problema ou necessidade em pelo menos 10 caracteres para que o profissional possa avaliar.",
      );
      return;
    }

    const fullAddress = address.trim() ? `${address.trim()}, ${district}` : `${district}, São Tomé`;

    setIsSubmitting(true);

    try {
      const urgentNotice = schedule.isUrgent ? "\n⚡ ATENDIMENTO URGENTE SOLICITADO" : "";
      const gpsInfoText = detectedGpsInfo
        ? `\n📍 Localização GPS Detetada: ${detectedGpsInfo.zone}, ${detectedGpsInfo.district} (±${Math.round(detectedGpsInfo.accuracy)}m)\n🗺️ Rota no Mapa: ${detectedGpsInfo.mapsUrl}`
        : "";
      const orderNotes = `${problemDescription.trim()}\n\n[Resumo KONEKTA: ${quoteCalculation.humanSummary}]${urgentNotice}\nLocal: ${fullAddress}${gpsInfoText}\n(Toda a comunicação decorre no chat seguro da app KONEKTA)`;

      const order = store.createOrder({
        providerId: provider.id,
        service: currentService.name,
        total: quoteCalculation.isQuote ? 0 : quoteCalculation.gross,
        scheduledFor: schedule.scheduledFor,
        address: fullAddress,
        notes: orderNotes,
      });

      // Sincronização automática em segundo plano
      const syncEvent: SyncScheduleEvent = {
        id: `order_${order.id}`,
        title: `${currentService.name} - ${provider.name}`,
        description: problemDescription.trim() || `Serviço agendado com ${provider.name}`,
        location: fullAddress,
        latitude: detectedGpsInfo?.latitude,
        longitude: detectedGpsInfo?.longitude,
        dateStr:
          schedule.dateStr === "Hoje" ? new Date().toISOString().split("T")[0] : schedule.dateStr,
        timeStr: schedule.timeSlot || "09:00",
        providerName: provider.name,
        categoryName: provider.category,
        urgency: schedule.isUrgent ? "🚨 Urgente" : "📅 Agendado",
        createdAt: Date.now(),
      };

      registerEventAndAlarms(syncEvent, {
        alarm15m: true,
        alarm1h: true,
        alarmOnTime: true,
      });

      downloadIcsCalendarFile(syncEvent);

      toast.success(
        quoteCalculation.isQuote ? "Pedido de orçamento enviado!" : "Pedido agendado com sucesso!",
        {
          description: `Serviço: ${currentService.name} com ${provider.name}.`,
        },
      );

      setIsSubmitting(false);
      onClose();
      navigate({ to: "/pedido/$id", params: { id: order.id } });
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
      setError("Não foi possível registar o pedido. Tente novamente.");
    }
  };

  const currentMeta = BILLING_MODELS[currentBillingModel] || BILLING_MODELS.fixo;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[92vh] flex flex-col bg-card text-card-foreground rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom-6 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/70 shrink-0 bg-muted/20">
          <div className="flex items-center gap-3">
            <img
              src={provider.image}
              alt={provider.name}
              className="size-10 rounded-full object-cover border border-border"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-foreground">{provider.name}</h3>
                <ShieldCheck size={14} className="text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">
                {provider.category} • {provider.rating} ★ ({provider.reviews} avaliações)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-muted/80 hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {/* 1. SELEÇÃO DE SERVIÇO */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Tag size={13} className="text-primary" />
                1. Escolha o Serviço & Modelo de Cobrança
              </label>
              <span className="text-[11px] text-muted-foreground font-medium">
                {availableServices.length} opções
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {availableServices.map((srv) => {
                const isSelected = selectedServiceId === srv.id;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => {
                      setSelectedServiceId(srv.id);
                      setError(null);
                    }}
                    className={`text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/40"
                        : "bg-card hover:bg-muted/50 border-border/80"
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-foreground">{srv.name}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          {srv.billingMethod === "hora"
                            ? "Por Hora"
                            : srv.billingMethod === "diagnostico"
                              ? "Visita / Diagnóstico"
                              : srv.billingMethod === "orcamento"
                                ? "Sob Orçamento"
                                : srv.unit === "dia"
                                  ? "Por Dia"
                                  : srv.unit === "m²"
                                    ? "Por m²"
                                    : "Preço Fixo"}
                        </span>
                      </div>
                      {srv.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {srv.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      {srv.billingMethod === "orcamento" ? (
                        <div className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg">
                          Sob Orçamento
                        </div>
                      ) : (
                        <div>
                          <span className="text-sm font-black text-primary">
                            {formatDb(srv.price)}
                          </span>
                          <span className="block text-[10px] text-muted-foreground font-medium">
                            /{srv.unit || "serviço"}
                          </span>
                          <span className="block text-[9px] text-muted-foreground/80 font-medium mt-0.5">
                            {srv.travelFeeAmount && srv.travelFeeAmount > 0
                              ? `+${formatDb(srv.travelFeeAmount)} deslocação`
                              : "Deslocação a acertar se aplicável"}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. FORMULÁRIO DINÂMICO BASEADO NO MODELO DE COBRANÇA */}
          {currentBillingModel === "hora" && (
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Clock size={14} className="text-blue-600" />
                    Quantas horas de serviço estima?
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Tarifa: {formatDb(currentService?.price || 500)}/hora (mínimo 2h)
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(2, q - 1))}
                    disabled={quantity <= 2}
                    className="size-7 rounded-lg bg-muted grid place-items-center hover:bg-muted/80 disabled:opacity-40 transition"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-8 text-center text-xs font-bold font-mono">{quantity}h</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    disabled={quantity >= 10}
                    className="size-7 rounded-lg bg-primary text-primary-foreground grid place-items-center hover:bg-primary/90 disabled:opacity-40 transition"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentBillingModel === "dia" && (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sun size={14} className="text-amber-600" />
                    Quantos dias de trabalho?
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Diária completa em STP: {formatDb(currentService?.price || 1500)}/dia (08:00 às
                    17:00)
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="size-7 rounded-lg bg-muted grid place-items-center hover:bg-muted/80 disabled:opacity-40 transition"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-8 text-center text-xs font-bold font-mono">{quantity}d</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(30, q + 1))}
                    className="size-7 rounded-lg bg-primary text-primary-foreground grid place-items-center hover:bg-primary/90 transition"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentBillingModel === "unidade" && (
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Boxes size={14} className="text-emerald-600" />
                    Quantidade de {currentService?.unit || "unidades"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Preço por {currentService?.unit || "unidade"}:{" "}
                    {formatDb(currentService?.price || 100)}
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="size-7 rounded-lg bg-muted grid place-items-center hover:bg-muted/80 disabled:opacity-40 transition"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-8 text-center text-xs font-bold font-mono">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                    className="size-7 rounded-lg bg-primary text-primary-foreground grid place-items-center hover:bg-primary/90 transition"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentBillingModel === "m2" && (
            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Maximize2 size={14} className="text-indigo-600" />
                    Área aproximada em m²
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Tarifa: {formatDb(currentService?.price || 80)}/m²
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-20 h-9 px-2 text-center rounded-xl border border-border bg-card text-xs font-bold font-mono"
                  />
                  <span className="text-xs font-bold text-muted-foreground">m²</span>
                </div>
              </div>
            </div>
          )}

          {currentBillingModel === "visita" && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2.5">
              <Car size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 dark:text-amber-200">
                  Visita Técnica & Diagnóstico no Terreno
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  O valor de {formatDb(currentService?.price || 500)} inclui a deslocação do técnico
                  e diagnóstico minucioso da avaria. Se for necessária reparação com peças, o
                  prestador apresentará a proposta no chat.
                </p>
              </div>
            </div>
          )}

          {/* 3. EXTRAS OPCIONAIS */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles size={13} className="text-primary" />
              Extras & Materiais Recomendados
            </label>
            <div className="space-y-1.5">
              {extras.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleExtra(item.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition ${
                    item.selected
                      ? "bg-primary/10 border-primary font-bold text-foreground"
                      : "bg-card border-border/70 text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-4 rounded-md border flex items-center justify-center ${
                        item.selected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {item.selected && <CheckSquare size={12} />}
                    </div>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-bold text-primary font-mono">+{formatDb(item.price)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. DETALHE DO PROBLEMA PELO CLIENTE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <FileText size={13} className="text-primary" />
                Descreva o que precisa
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">
                {problemDescription.length} caracteres
              </span>
            </div>

            <textarea
              rows={3}
              value={problemDescription}
              onChange={(e) => {
                setProblemDescription(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ex: Preciso de pintar a sala e o corredor, ou instalar 3 novas tomadas na cozinha..."
              className="w-full text-xs p-3 rounded-2xl bg-muted/30 border border-border focus:border-primary focus:bg-card focus:outline-hidden text-foreground placeholder:text-muted-foreground/80 leading-relaxed resize-none"
            />

            {(() => {
              const check = validateFormSafety({
                "Descrição do Problema": problemDescription,
                Morada: address,
              });
              if (!check.isValid) {
                return (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-start gap-2">
                    <span className="text-xs shrink-0">🛡️</span>
                    <div>
                      <p className="font-bold">Conteúdo Restrito no {check.field}</p>
                      <p className="text-[11px] opacity-90">{check.reason}</p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Anexar Fotografias do Problema */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <Camera size={12} className="text-primary" />
                  Fotos do local / avaria (opcional)
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {attachedPhotos.length}/3 fotos
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {attachedPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative size-16 rounded-xl border border-border overflow-hidden shrink-0 group"
                  >
                    <img
                      src={photo}
                      alt={`Foto do problema ${idx + 1}`}
                      className="size-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute inset-0 bg-black/60 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition"
                      aria-label="Remover foto"
                    >
                      <Trash2 size={14} className="text-destructive" />
                    </button>
                  </div>
                ))}

                {attachedPhotos.length < 3 && (
                  <label className="size-16 rounded-xl border border-dashed border-border hover:border-primary/60 bg-muted/20 hover:bg-muted/40 grid place-items-center text-center cursor-pointer shrink-0 transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="hidden"
                    />
                    <div className="space-y-0.5">
                      <Camera size={16} className="mx-auto text-muted-foreground" />
                      <span className="block text-[9px] text-muted-foreground font-medium">
                        {isUploadingPhoto ? "..." : "+ Foto"}
                      </span>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* 5. DATA & HORÁRIO STP */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar size={13} className="text-primary" />
                Agendamento
              </label>
              <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                <Clock size={11} className="text-primary" />
                {stpTimeShort} GMT
              </span>
            </div>

            <STPSchedulePicker
              value={schedule.scheduledFor}
              onChange={setSchedule}
              allowUrgent={true}
            />
          </div>

          {/* 6. LOCALIZAÇÃO COM DETEÇÃO DE ZONA STP */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin size={13} className="text-primary" />
                Local do Atendimento (São Tomé e Príncipe)
              </label>
              <button
                type="button"
                onClick={handleGetGPS}
                disabled={isLocatingGPS}
                className="text-[11px] font-bold text-primary px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 transition active:scale-95 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
              >
                <Navigation size={12} className={isLocatingGPS ? "animate-spin" : ""} />
                <span>{isLocatingGPS ? "A detetar Zona..." : "📍 Usar GPS"}</span>
              </button>
            </div>

            {detectedGpsInfo && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Zona: {detectedGpsInfo.zone}, {detectedGpsInfo.district}</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                    ±{Math.round(detectedGpsInfo.accuracy)}m precisão
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  📍 O prestador receberá estas coordenadas e o link de rota Google Maps no pedido para chegar até si com máxima rapidez.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="text-xs px-3 py-2.5 rounded-xl bg-card border border-border focus:border-primary focus:outline-hidden font-medium text-foreground"
              >
                {STP_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Bairro / Morada / Ponto de Referência"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="text-xs px-3 py-2.5 rounded-xl bg-muted/30 border border-border focus:border-primary focus:bg-card focus:outline-hidden text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Rodapé do Modal com Discriminação Transparente & Custódia KONEKTA */}
        <div className="p-5 border-t border-border/70 bg-muted/20 shrink-0 space-y-3">
          {quoteCalculation.isQuote ? (
            <div className="bg-card rounded-2xl p-3.5 border border-border shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Serviço Selecionado:</span>
                <span className="font-semibold text-foreground">
                  {currentService?.name || "Serviço Personalizado"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <span className="text-xs font-bold text-foreground">Valor Estimado:</span>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg">
                  Sob Orçamento no Chat
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-4 border border-border/90 shadow-2xs space-y-3">
              {/* Cabeçalho da Discriminação */}
              <div className="flex items-center justify-between border-b border-border/70 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Receipt size={14} className="text-primary" /> O que está a pagar (Discriminação)
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={11} /> 100% Transparente
                </span>
              </div>

              {/* Linhas de Custos Detalhados */}
              <div className="space-y-2 text-xs">
                {/* 1. Mão de Obra / Serviço Base */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{currentService?.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {quoteCalculation.effectiveQuantity} {quoteCalculation.unitFormatted} ×{" "}
                      {formatDb(currentService?.price || 0)}
                    </p>
                  </div>
                  <span className="font-bold text-foreground shrink-0 font-mono">
                    {formatDb(quoteCalculation.baseAmount)}
                  </span>
                </div>

                {/* 2. Deslocação e Transporte do Técnico */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground flex items-center gap-1">
                      <Car size={13} className="text-muted-foreground shrink-0" />
                      Deslocação & Transporte
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {quoteCalculation.displacementAmount > 0
                        ? "Taxa de transporte acordada previamente"
                        : "Sem taxa fixa forçada (a acertar com o prestador se aplicável)"}
                    </p>
                  </div>
                  <span className="font-bold shrink-0 font-mono">
                    {quoteCalculation.displacementAmount > 0 ? (
                      `+${formatDb(quoteCalculation.displacementAmount)}`
                    ) : (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        0 Db (A combinar se houver)
                      </span>
                    )}
                  </span>
                </div>

                {/* 3. Extras e Materiais Selecionados */}
                {quoteCalculation.extrasAmount > 0 && (
                  <div className="flex items-start justify-between gap-2 pt-1 border-t border-border/40">
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-1">
                        <Sparkles size={13} className="text-amber-500 shrink-0" />
                        Extras & Materiais Selecionados
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {extras
                          .filter((e) => e.selected)
                          .map((e) => e.name)
                          .join(", ")}
                      </p>
                    </div>
                    <span className="font-bold text-foreground shrink-0 font-mono">
                      +{formatDb(quoteCalculation.extrasAmount)}
                    </span>
                  </div>
                )}

                {/* 4. Taxa de Atendimento Urgente */}
                {quoteCalculation.urgencyAmount > 0 && (
                  <div className="flex items-start justify-between gap-2 pt-1 border-t border-border/40">
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1">
                        ⚡ Atendimento Urgente Solicitado
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Prioridade de atendimento imediato em STP
                      </p>
                    </div>
                    <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0 font-mono">
                      +{formatDb(quoteCalculation.urgencyAmount)}
                    </span>
                  </div>
                )}

                {/* 5. Garantia 30 Dias */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-[11px]">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                    Garantia KONEKTA (30 Dias)
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    0 Db (Grátis)
                  </span>
                </div>
              </div>

              {/* Total Destacado */}
              <div className="pt-2.5 border-t border-border flex items-center justify-between bg-muted/40 -mx-4 -mb-4 p-3.5 rounded-b-2xl">
                <div>
                  <span className="text-xs font-black text-foreground uppercase tracking-wider block">
                    Total do Serviço
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                    <Lock size={10} className="text-primary" /> Protegido em custódia até validação
                    OTP
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-primary font-mono block">
                    {formatDb(quoteCalculation.gross)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20 animate-in fade-in">
              <AlertCircle size={15} className="shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Botão de Confirmação */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="press w-full bg-primary text-primary-foreground rounded-2xl py-3.5 font-bold text-sm shadow-md hover:bg-primary/95 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              "A processar pedido..."
            ) : (
              <>
                <CheckCircle2 size={17} />
                {quoteCalculation.isQuote
                  ? "Solicitar Orçamento no Chat"
                  : "Confirmar Pedido & Agendamento"}
              </>
            )}
          </button>

          {/* Proteção KONEKTA */}
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 font-medium text-center">
            <ShieldCheck size={13} className="text-primary shrink-0" />
            Pagamento 100% seguro em custódia até à conclusão do serviço.
          </p>
        </div>
      </div>
    </div>
  );
}
