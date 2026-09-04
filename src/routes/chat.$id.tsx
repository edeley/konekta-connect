import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Lock,
  MapPin,
  Send,
  ShieldCheck,
  ShieldAlert,
  Tag,
  FileText,
  Clock,
  X,
  Check,
  Car,
  Calendar,
  AlertTriangle,
  Banknote,
  Edit3,
  Camera,
  Image as ImageIcon,
  Upload,
  Scale,
  Compass,
  CheckCircle,
  Navigation,
  Paperclip,
} from "lucide-react";
import { getProvider } from "@/lib/konekta-data";
import {
  store,
  useStore,
  type Order,
  type Quote,
  type TechnicalVisit,
  type InPersonCashDeclaration,
} from "@/lib/store";
import {
  calculateFinalServiceCharge,
  evaluatePriceDivergence,
  getCategoryBenchmark,
  type AlgorithmicValidationResult,
} from "@/lib/price-benchmark";
import { realtimeBus } from "@/lib/realtime";
import { AuthGate } from "@/components/AuthGate";
import { QuoteCard } from "@/components/konekta/QuoteCard";
import { QuoteComposer } from "@/components/konekta/QuoteComposer";
import { ReviewModal } from "@/components/konekta/ReviewModal";
import { CancelServiceModal } from "@/components/konekta/CancelServiceModal";
import { ChatDynamicStatus } from "@/components/konekta/ChatDynamicStatus";
import { ChatQuickReplies } from "@/components/konekta/ChatQuickReplies";
import { InChatCheckoutModal } from "@/components/konekta/InChatCheckoutModal";
import { ChatMediationModal } from "@/components/konekta/ChatMediationModal";
import { BottomSheet } from "@/components/konekta/kit";
import { formatDb } from "@/lib/catalog";
import { analyzeBlockedContent, containsBlockedContent } from "@/lib/escrow";
import {
  openNativeMap,
  downloadIcsCalendarFile,
  getCurrentGPSLocation,
  openGoogleMapsRoute,
  triggerDeviceVibration,
} from "@/lib/sync-manager";
import { ClientGpsRadarCard } from "@/components/konekta/ClientGpsRadarCard";
import { toast } from "sonner";

export const Route = createFileRoute("/chat/$id")({
  head: ({ params }) => {
    const p = getProvider(params.id);
    return {
      meta: [
        { title: p ? `${p.name} · Conversa · KONEKTA` : "Conversa · KONEKTA" },
        { name: "description", content: "Conversa protegida dentro da plataforma KONEKTA." },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center p-8 text-center">
      <div>
        <h1 className="text-xl font-semibold">Conversa não encontrada</h1>
        <Link to="/chat" className="mt-4 inline-block text-primary font-medium">
          Ver conversas
        </Link>
      </div>
    </div>
  ),
  component: ChatDetail,
});

function ChatDetail() {
  const { id } = Route.useParams();
  const provider = getProvider(id);
  const messages = useStore((s) => s.messages[id] ?? []);
  const balance = useStore((s) => s.balance);
  const technicalVisits = useStore((s) => s.technicalVisits);
  const config = useStore((s) => s.config);
  const orders = useStore((s) => s.orders);
  const role = useStore((s) => s.user?.role ?? "cliente");
  const isProviderBlockedForDebt = useStore((s) => s.isProviderBlockedForDebt);
  const providerDebt = useStore((s) => s.providerDebt);
  const router = useRouter();
  const [text, setText] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [reviewQuote, setReviewQuote] = useState<Quote | null>(null);
  const [checkoutQuote, setCheckoutQuote] = useState<Quote | null>(null);
  const [mediationModalOpen, setMediationModalOpen] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(realtimeBus.getTyping(id));
  const scrollRef = useRef<HTMLDivElement>(null);

  // Orçamento ativo mais recente
  const activeQuote = useMemo(() => {
    const quoteMsgs = messages.filter((m) => m.kind === "quote" && m.quote);
    if (quoteMsgs.length === 0) return null;
    return quoteMsgs[quoteMsgs.length - 1].quote || null;
  }, [messages]);

  // Verifica se todos os pedidos associados já foram concluídos
  const relatedOrders = orders.filter((o) => o.providerId === id);
  const isAllOrdersFinished =
    relatedOrders.length > 0 &&
    relatedOrders.every((o) => ["concluido", "avaliado"].includes(o.status));

  // Technical Visit Modal State (Proposta enviada pelo Profissional)
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [visitTime, setVisitTime] = useState("10:00");
  const [visitDistrict, setVisitDistrict] = useState("Água Grande");
  const [visitAddress, setVisitAddress] = useState("");
  const [visitReason, setVisitReason] = useState("");
  const [visitDeductFee, setVisitDeductFee] = useState(true);
  const [submittingVisit, setSubmittingVisit] = useState(false);

  // Modal de Declaração de Orçamento no Terreno (Prestador lança após avaliação)
  const [onSiteBudgetModalOpen, setOnSiteBudgetModalOpen] = useState(false);
  const [onSiteAmount, setOnSiteAmount] = useState("");
  const [onSiteDiagnostic, setOnSiteDiagnostic] = useState("");
  const [onSiteDeductVisitFee, setOnSiteDeductVisitFee] = useState(true);

  // Modal de Validação / Ajuste do Orçamento Presencial pelo Cliente
  const [clientValidationModalOpen, setClientValidationModalOpen] = useState(false);
  const [clientAgreedAmountInput, setClientAgreedAmountInput] = useState("");
  const [clientValidationNotes, setClientValidationNotes] = useState("");

  // Modal de Declaração de Pagamento Presencial (Em Mão)
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [cashDeclaredAmount, setCashDeclaredAmount] = useState("");
  const [cashServiceTitle, setCashServiceTitle] = useState("");

  // Modal / Input de Correção do Cliente para Pagamento Presencial
  const [adjustingDeclaration, setAdjustingDeclaration] = useState<InPersonCashDeclaration | null>(
    null,
  );
  const [adjustedAmountInput, setAdjustedAmountInput] = useState("");
  const [clientNotesInput, setClientNotesInput] = useState("");

  // Diagnostic Report modal for Pro after on-site inspection
  const [diagnosticModalOpen, setDiagnosticModalOpen] = useState(false);
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null);
  const [diagnosticText, setDiagnosticText] = useState("");
  const [proposedQuoteAmount, setProposedQuoteAmount] = useState("");

  const [isLocatingGPS, setIsLocatingGPS] = useState(false);

  // Compartilhar localização GPS exata em tempo real no chat
  async function handleShareGPSLocation() {
    setIsLocatingGPS(true);
    triggerDeviceVibration([40]);
    try {
      const res = await getCurrentGPSLocation();
      if (res) {
        const zoneText = res.zone || res.district;
        const msg = `📍 Localização GPS Nativa Partilhada:\nEstá em: ${zoneText}, ${res.district}\n🌐 Coordenadas: ${res.latitude.toFixed(6)}, ${res.longitude.toFixed(6)} (Precisão: ±${Math.round(res.accuracy)}m)\n🧭 Iniciar Rota no Mapa: ${res.directionsUrl}`;
        store.sendMessage(id, msg);
        triggerDeviceVibration([50, 40]);
        toast.success(`📍 Localização (${zoneText}) enviada no chat!`, {
          description: "O prestador já tem o link direto para navegar no mapa.",
        });
      }
    } catch {
      toast.error("Não foi possível obter o GPS.");
    } finally {
      setIsLocatingGPS(false);
    }
  }
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
  );
  const [photoCaption, setPhotoCaption] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Pedido ativo associado a este prestador
  const activeOrder = useMemo(() => {
    return (
      relatedOrders.find(
        (o) => o.status !== "concluido" && o.status !== "avaliado" && o.status !== "cancelado",
      ) || null
    );
  }, [relatedOrders]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecione um ficheiro de imagem válido.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("A imagem selecionada é muito grande (máximo 8MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSelectedPhotoUrl(dataUrl);
        setPhotoModalOpen(true);
        triggerDeviceVibration([40]);
        toast.success("Foto carregada. Adicione uma descrição e envie.");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const activeTechnicalVisit = technicalVisits.find(
    (v) => v.providerId === id && v.status !== "cancelado",
  );

  const moderationDisputes = useStore((s) => s.moderationDisputes);
  const activeDispute = moderationDisputes.find(
    (d) =>
      d.visitId === activeTechnicalVisit?.id ||
      (activeTechnicalVisit?.moderationCaseId && d.id === activeTechnicalVisit.moderationCaseId),
  );

  useEffect(() => {
    const unsub = realtimeBus.subscribeTyping(() => {
      setIsTyping(realtimeBus.getTyping(id));
    });
    return unsub;
  }, [id]);

  const isClient = role !== "prestador";
  const unlocked = useMemo(
    () =>
      messages.some(
        (m) =>
          (m.quote && (m.quote.status === "pago" || m.quote.status === "concluido")) ||
          m.inPersonDeclaration?.status === "confirmado_pelo_cliente",
      ),
    [messages],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isTyping]);

  if (!provider) return null;

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const analysis = analyzeBlockedContent(text);
    const result = store.sendMessage(id, text);

    if (result === "blocked") {
      toast.error("Mensagem Bloqueada por Segurança", {
        description:
          analysis.reason ||
          "Para sua segurança e garantia de custódia (escrow), todas as negociações e pagamentos devem ser mantidos internamente no KONEKTA.",
        duration: 5000,
      });
    }
    if (result !== "empty") setText("");
  }

  // O Profissional envia a proposta de visita técnica no terreno para melhor orçamentação
  function handleProposeTechnicalVisit(e: React.FormEvent) {
    e.preventDefault();
    if (!isClient && isProviderBlockedForDebt) {
      toast.error("Conta Bloqueada por Dívida", {
        description:
          "Regularize a sua dívida de comissões na sua Carteira PRO para propor visitas técnicas.",
      });
      return;
    }
    const fee = config.technicalVisitFee || 150;

    setSubmittingVisit(true);
    setTimeout(() => {
      const res = store.proposeTechnicalVisit({
        providerId: id,
        providerName: provider?.name || "Prestador KONEKTA",
        serviceTitle: visitReason.trim() || "Avaliação técnica no terreno para orçamento",
        category: provider?.category,
        district: visitDistrict,
        address: visitAddress.trim(),
        scheduledDate: visitDate,
        scheduledTime: visitTime,
        visitFee: fee,
        deductVisitFeeOnService: visitDeductFee,
      });

      setSubmittingVisit(false);
      if (res.ok) {
        toast.success(res.message);
        setVisitModalOpen(false);
      } else {
        toast.error(res.message);
      }
    }, 400);
  }

  // Check-in presencial no terreno pelo Prestador com validação de Zona STP
  async function handleProviderCheckIn(visitId: string) {
    let loc = `${activeTechnicalVisit?.district || "São Tomé"} (GPS validado)`;
    try {
      const gps = await getCurrentGPSLocation();
      if (gps) {
        loc = `${gps.zone || gps.district}, ${gps.district} (GPS: ${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)})`;
      }
    } catch {
      // Continua com o distrito por defeito
    }

    const res = store.providerCheckInVisit(visitId, loc);
    if (res.ok) {
      toast.success("Check-in presencial registado com sucesso!", {
        description: `Localização validada: ${loc}. Pode iniciar o diagnóstico técnico.`,
      });
    } else {
      toast.error(res.message);
    }
  }

  // Prestador lança o orçamento no terreno
  function handleProviderSubmitOnSiteBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTechnicalVisit) return;
    const amountVal = Number(onSiteAmount);
    if (!amountVal || amountVal <= 0) {
      toast.error("Insira o valor do orçamento presencial.");
      return;
    }

    const res = store.providerDeclareOnSiteBudget({
      visitId: activeTechnicalVisit.id,
      declaredAmount: amountVal,
      diagnosticReport: onSiteDiagnostic.trim(),
      deductVisitFee: onSiteDeductVisitFee,
    });

    if (res.ok) {
      toast.success(res.message);
      setOnSiteBudgetModalOpen(false);
      setOnSiteAmount("");
      setOnSiteDiagnostic("");
    } else {
      toast.error(res.message);
    }
  }

  // Cliente valida o orçamento presencial
  function handleClientValidateBudget(agreed: boolean, customAmount?: number) {
    if (!activeTechnicalVisit) return;

    if (agreed) {
      const res = store.clientValidateOnSiteBudget({
        visitId: activeTechnicalVisit.id,
        agreed: true,
      });
      if (res.ok) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } else {
      if (customAmount !== undefined) {
        const res = store.clientValidateOnSiteBudget({
          visitId: activeTechnicalVisit.id,
          agreed: false,
          clientAmount: customAmount,
          notes: clientValidationNotes,
        });

        if (res.ok) {
          if (res.result?.tier === "tier_3_moderation") {
            toast.error("Divergência Crítica (>40%)", {
              description:
                "O pedido foi congelado e encaminhado para o Painel de Moderação KONEKTA.",
              duration: 6000,
            });
          } else {
            toast.success(res.message);
          }
          setClientValidationModalOpen(false);
          setClientAgreedAmountInput("");
          setClientValidationNotes("");
        } else {
          toast.error(res.message);
        }
      } else {
        setClientAgreedAmountInput(
          String(activeTechnicalVisit.declaredAmountByProvider || activeTechnicalVisit.visitFee),
        );
        setClientValidationModalOpen(true);
      }
    }
  }

  // O Profissional declara quanto cobrou ao cliente em dinheiro presencialmente
  function handleDeclareCashPayment(e: React.FormEvent) {
    e.preventDefault();
    const amountVal = Number(cashDeclaredAmount);
    if (!amountVal || amountVal <= 0) {
      toast.error("Insira o valor recebido em mão.");
      return;
    }

    const res = store.declareInPersonCashPayment({
      providerId: id,
      providerName: provider?.name || "Prestador KONEKTA",
      clientId: "usr-client",
      clientName: "Cliente KONEKTA",
      serviceTitle: cashServiceTitle.trim() || "Serviço Presencial no Terreno",
      visitId: activeTechnicalVisit?.id,
      declaredAmount: amountVal,
    });

    if (res.ok) {
      toast.success(res.message);
      setCashModalOpen(false);
      setCashDeclaredAmount("");
      setCashServiceTitle("");
    } else {
      toast.error(res.message);
    }
  }

  // O Cliente confirma o valor declarado pelo prestador
  function handleClientConfirmCash(declarationId: string, agreed: boolean) {
    if (agreed) {
      const res = store.clientConfirmInPersonPayment(declarationId, { agreed: true });
      if (res.ok) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } else {
      const decl = messages.find(
        (m) => m.inPersonDeclaration?.id === declarationId,
      )?.inPersonDeclaration;
      if (decl) {
        setAdjustingDeclaration(decl);
        setAdjustedAmountInput(String(decl.declaredAmount));
      }
    }
  }

  // O Cliente submete o ajuste do valor real pago
  function handleSubmitAdjustedCash(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustingDeclaration) return;
    const actual = Number(adjustedAmountInput);
    if (!actual || actual <= 0) {
      toast.error("Insira o montante efetivamente pago.");
      return;
    }

    const res = store.clientConfirmInPersonPayment(adjustingDeclaration.id, {
      agreed: false,
      actualAmountPaid: actual,
      clientNotes: clientNotesInput.trim(),
    });

    if (res.ok) {
      toast.success(res.message);
      setAdjustingDeclaration(null);
      setAdjustedAmountInput("");
      setClientNotesInput("");
    } else {
      toast.error(res.message);
    }
  }

  function handleSendPhotoDiagnostic(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPhotoUrl) {
      toast.error("Selecione ou anexe uma foto para diagnóstico.");
      return;
    }
    setIsUploadingPhoto(true);
    setTimeout(() => {
      store.sendPhotoMessage(id, selectedPhotoUrl, photoCaption);
      setIsUploadingPhoto(false);
      setPhotoModalOpen(false);
      setPhotoCaption("");
      toast.success("Foto para diagnóstico enviada com sucesso!", {
        description: "O prestador foi notificado e irá analisar a avaria.",
      });
    }, 600);
  }

  // O Cliente aceita a visita técnica e a taxa de deslocação é retida em custódia
  function handleClientAcceptVisit(visitId: string) {
    const fee = config.technicalVisitFee || 150;
    if (balance < fee) {
      toast.error("Saldo insuficiente na carteira", {
        description: `Precisa de no mínimo ${formatDb(fee)} para garantir a deslocação do técnico em custódia.`,
      });
      return;
    }

    const res = store.clientAcceptTechnicalVisit(visitId);
    if (res.ok) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  }

  function handleCompleteDiagnostic(e: React.FormEvent) {
    e.preventDefault();
    if (!activeVisitId || !diagnosticText.trim()) {
      toast.error("Por favor insira o diagnóstico da visita técnica.");
      return;
    }

    store.completeTechnicalVisit(
      activeVisitId,
      diagnosticText.trim(),
      Number(proposedQuoteAmount) || undefined,
    );
    toast.success("Visita técnica concluída e relatório/orçamento enviado com sucesso!");
    setDiagnosticModalOpen(false);
    setDiagnosticText("");
    setProposedQuoteAmount("");
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-surface flex justify-center">
        <div className="w-full max-w-md min-h-screen flex flex-col">
          <header className="sticky top-0 z-10 bg-card/95 backdrop-blur ring-1 ring-border px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => router.history.back()}
              className="size-9 rounded-full bg-muted grid place-items-center cursor-pointer"
              aria-label="Voltar"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="relative">
              <img
                src={provider.image}
                alt={provider.name}
                className="size-10 rounded-full object-cover"
              />
              <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{provider.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  {isTyping ? "A escrever..." : "Online agora"}
                </p>
                <span className="text-[10px] text-muted-foreground">· {provider.category}</span>
              </div>
            </div>
            {isClient && activeOrder && (
              <button
                type="button"
                onClick={() => setCancelModalOrder(activeOrder)}
                className="px-2.5 py-1.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-[11px] font-bold flex items-center gap-1 transition shrink-0"
                title="Cancelar Serviço com Aviso de Riscos"
              >
                <X size={13} />
                <span className="hidden sm:inline">Cancelar</span>
              </button>
            )}
          </header>

          {/* Banner de Aviso caso o Prestador esteja Bloqueado por Dívida */}
          {!isClient && isProviderBlockedForDebt && (
            <div className="mx-4 mt-3 p-3.5 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive text-xs space-y-1.5 animate-pulse">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle size={16} />
                <span>Conta KONEKTA PRO Suspensa por Dívida</span>
              </div>
              <p className="text-[11px] leading-relaxed text-foreground/90">
                A sua dívida acumulada de comissões atingiu <strong>{providerDebt} STN</strong>{" "}
                (limite máximo de 500 STN). Não pode enviar novos orçamentos ou propor visitas
                enquanto não regularizar a sua conta na Carteira PRO.
              </p>
              <Link
                to="/pro/ganhos"
                className="inline-flex items-center gap-1.5 font-bold text-xs underline pt-1 text-destructive hover:opacity-80"
              >
                Ir para Carteira & Liquidar Dívida →
              </Link>
            </div>
          )}

          {/* Barra de Status Dinâmico da Negociação / Custódia */}
          <ChatDynamicStatus
            quote={activeQuote}
            isClient={isClient}
            serviceTitle={provider.category}
            onOpenCheckout={() => {
              if (activeQuote) setCheckoutQuote(activeQuote);
            }}
            onOpenComposer={() => setComposerOpen(true)}
            onCompleteService={() => {
              if (activeQuote) {
                store.completeQuote(id, activeQuote.id);
                toast.success("Serviço concluído — valor libertado ao prestador");
                if (isClient) setReviewQuote(activeQuote);
              }
            }}
            onValidateOtp={(otp) => {
              if (!activeQuote) return;
              const res = store.validateChatCompletionOtp(id, activeQuote.id, otp);
              if (res.success) {
                toast.success("Código OTP Validado! Fundos libertados na sua Carteira PRO.");
              } else {
                toast.error(res.error || "Código OTP incorreto.");
              }
            }}
            onOpenReview={() => {
              if (activeQuote) setReviewQuote(activeQuote);
            }}
            onOpenMediation={() => setMediationModalOpen(true)}
          />

          {/* Banner de Proteção e Anti-Bypass Rigoroso */}
          <div className="px-4 mt-1 space-y-2">
            {/* Indicador de Conversação com Especialista e Proteção de Documentos */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-card border border-border/70 text-[10px] text-muted-foreground shadow-2xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                <span>Especialista Verificado</span>
              </span>
              <span className="text-[10px] text-muted-foreground truncate ml-1">
                Contexto seguro ativo · Documentos privados
              </span>
            </div>

            {unlocked ? (
              <div className="rounded-2xl bg-success/10 border border-success/30 px-3.5 py-3 text-[11px] text-success space-y-2">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck size={14} /> Serviço Ativo e Protegido
                  </p>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Custódia KONEKTA Ativa
                  </span>
                </div>
                <p className="text-foreground/80 text-[11px]">
                  O valor encontra-se protegido pela garantia KONEKTA. A libertação dos fundos e
                  avaliações ocorrem de forma mútua e segura dentro da app.
                </p>
                <div className="pt-1.5 border-t border-success/20 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openNativeMap({
                        district: provider?.district || "São Tomé",
                        title: provider?.name,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-card border border-border text-foreground font-bold text-[11px] flex items-center gap-1.5 transition active:scale-95 shadow-2xs cursor-pointer"
                  >
                    <MapPin size={12} className="text-primary" /> Ver no Mapa
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-card border border-border/80 p-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <ShieldCheck size={14} className="text-primary" /> Negociação Segura KONEKTA
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    100% Protegido
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Todas as comissões e pagamentos são protegidos por custódia interna. Para a sua
                  segurança, o sistema impede contactos e negociações fora da app.
                </p>
              </div>
            )}

            {/* Card de Visita Técnica no Terreno (Uber STP & Validação em Duas Camadas) */}
            {activeTechnicalVisit && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Car size={14} /> Visita Técnica no Terreno
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      activeTechnicalVisit.status === "visita_paga_e_aprovada"
                        ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                        : activeTechnicalVisit.status === "em_moderacao"
                          ? "bg-red-500/20 text-red-800 dark:text-red-300"
                          : activeTechnicalVisit.status === "orcamento_presencial_solicitado" ||
                              activeTechnicalVisit.status === "confirmacao_cliente"
                            ? "bg-blue-500/20 text-blue-800 dark:text-blue-300"
                            : activeTechnicalVisit.status === "a_caminho"
                              ? "bg-purple-500/20 text-purple-800 dark:text-purple-300"
                              : "bg-amber-500/20 text-amber-900 dark:text-amber-200"
                    }`}
                  >
                    {activeTechnicalVisit.status === "pendente"
                      ? "⏳ Proposta Pendente"
                      : activeTechnicalVisit.status === "aguardando_visita" ||
                          activeTechnicalVisit.status === "aceite"
                        ? "✅ Visita Confirmada (Custódia)"
                        : activeTechnicalVisit.status === "a_caminho"
                          ? "🚗 Técnico a Caminho"
                          : activeTechnicalVisit.status === "orcamento_presencial_solicitado" ||
                              activeTechnicalVisit.status === "confirmacao_cliente"
                            ? "📋 Orçamento Lançado"
                            : activeTechnicalVisit.status === "divergencia_preco"
                              ? "⚠️ Divergência em Análise"
                              : activeTechnicalVisit.status === "visita_paga_e_aprovada"
                                ? "✨ Orçamento Aprovado"
                                : activeTechnicalVisit.status === "em_moderacao"
                                  ? "🚨 Em Moderação Admin"
                                  : "🏁 Concluída"}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-bold text-foreground">
                    {activeTechnicalVisit.serviceTitle}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    📍 {activeTechnicalVisit.district} · 📅 {activeTechnicalVisit.scheduledDate} às{" "}
                    {activeTechnicalVisit.scheduledTime}
                  </p>
                </div>

                {/* Badge de Check-in GPS */}
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-amber-500/20">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Compass size={12} className="text-primary" /> Presença no Terreno:
                  </span>
                  <span
                    className={`font-semibold ${
                      activeTechnicalVisit.checkedIn
                        ? "text-emerald-800 dark:text-emerald-300"
                        : "text-amber-800 dark:text-amber-300"
                    }`}
                  >
                    {activeTechnicalVisit.checkedIn
                      ? "📍 Check-in GPS Validado"
                      : "⏳ Aguardando Chegada"}
                  </span>
                </div>

                {/* Taxa de Deslocação e Abatimento */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Taxa de deslocação (retida):</span>
                  <strong className="text-foreground font-bold">
                    {formatDb(activeTechnicalVisit.visitFee)}
                  </strong>
                </div>

                {activeTechnicalVisit.deductVisitFeeOnService && (
                  <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium bg-emerald-500/10 px-2 py-1 rounded-lg">
                    ✨ Taxa de visita 100% abatida caso o serviço orçado seja aprovado.
                  </p>
                )}

                {/* ALERTA DE MODERAÇÃO ADMINISTRATIVA (>40% divergência) */}
                {activeTechnicalVisit.status === "em_moderacao" && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-900 dark:text-red-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-red-800 dark:text-red-300">
                      <ShieldAlert size={15} /> Caso em Análise pelo Painel de Moderação
                    </div>
                    <p className="text-[11px] text-red-950/80 dark:text-red-200/80 leading-relaxed">
                      Protocolo:{" "}
                      <strong>{activeTechnicalVisit.moderationCaseId || "MOD-STP"}</strong>. Foi
                      identificada uma divergência crítica entre os valores informados pelo
                      prestador ({formatDb(activeTechnicalVisit.declaredAmountByProvider || 0)}) e
                      pelo cliente ({formatDb(activeTechnicalVisit.clientConfirmedAmount || 0)}).
                    </p>
                    <p className="text-[10px] font-semibold text-red-900 dark:text-red-300">
                      🔒 Os fundos permanecem congelados em custódia segura até parecer da equipa
                      KONEKTA.
                    </p>
                  </div>
                )}

                {/* FLUXO: ORÇAMENTO PRESENCIAL LANÇADO - AÇÕES DO CLIENTE */}
                {isClient &&
                  (activeTechnicalVisit.status === "orcamento_presencial_solicitado" ||
                    activeTechnicalVisit.status === "confirmacao_cliente") && (
                    <div className="pt-2 border-t border-amber-500/20 space-y-2">
                      <div className="p-2.5 rounded-xl bg-card border border-border/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">
                            Orçamento Presencial Lançado:
                          </span>
                          <span className="text-sm font-black text-primary">
                            {formatDb(activeTechnicalVisit.declaredAmountByProvider || 0)}
                          </span>
                        </div>
                        {activeTechnicalVisit.diagnosticReport && (
                          <p className="text-[11px] text-muted-foreground mt-1 italic">
                            &quot;{activeTechnicalVisit.diagnosticReport}&quot;
                          </p>
                        )}
                        {activeTechnicalVisit.deductVisitFeeOnService && (
                          <div className="flex items-center justify-between text-[11px] pt-1 mt-1 border-t border-border/40 text-emerald-800 dark:text-emerald-300 font-semibold">
                            <span>Taxa de visita abatida:</span>
                            <span>- {formatDb(activeTechnicalVisit.visitFee)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs font-bold pt-1 text-foreground">
                          <span>Complemento em Custódia:</span>
                          <span>
                            {formatDb(
                              Math.max(
                                0,
                                (activeTechnicalVisit.declaredAmountByProvider || 0) -
                                  (activeTechnicalVisit.deductVisitFeeOnService
                                    ? activeTechnicalVisit.visitFee
                                    : 0),
                              ),
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleClientValidateBudget(true)}
                          className="py-2.5 px-2 rounded-xl bg-primary text-primary-foreground font-bold text-[11px] flex items-center justify-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer text-center"
                        >
                          <Check size={13} /> Confirmar & Pagar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleClientValidateBudget(false)}
                          className="py-2.5 px-2 rounded-xl bg-card border border-border text-foreground font-bold text-[11px] flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer text-center"
                        >
                          <Scale size={13} className="text-amber-600" /> Corrigir Valor
                        </button>
                      </div>
                    </div>
                  )}

                {/* FLUXO: ORÇAMENTO APROVADO & PAGO */}
                {activeTechnicalVisit.status === "visita_paga_e_aprovada" && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 text-[11px] space-y-1">
                    <div className="flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle size={14} /> Orçamento Validado & Bloqueado em Custódia
                    </div>
                    <p>
                      O montante total está 100% garantido pelo KONEKTA Escrow. O profissional pode
                      concluir o serviço.
                    </p>
                    {!isClient && (
                      <button
                        type="button"
                        onClick={() =>
                          store.completeTechnicalVisit(
                            activeTechnicalVisit.id,
                            "Serviço presencial executado com sucesso.",
                          )
                        }
                        className="w-full mt-1.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Check size={14} /> Finalizar e Libertar Pagamento
                      </button>
                    )}
                  </div>
                )}

                {/* Ações do Cliente quando a proposta está pendente */}
                {isClient && activeTechnicalVisit.status === "pendente" && (
                  <div className="pt-2 space-y-1.5 border-t border-amber-500/20">
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      O profissional propôs uma visita presencial para inspecionar o local e emitir
                      o orçamento definitivo.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleClientAcceptVisit(activeTechnicalVisit.id)}
                      className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                    >
                      <Check size={14} /> Aceitar Visita & Bloquear{" "}
                      {formatDb(activeTechnicalVisit.visitFee)} em Custódia
                    </button>
                  </div>
                )}

                {/* Ações do Prestador na Visita Técnica */}
                {!isClient &&
                  activeTechnicalVisit.status !== "concluido" &&
                  activeTechnicalVisit.status !== "em_moderacao" &&
                  activeTechnicalVisit.status !== "visita_paga_e_aprovada" && (
                    <div className="space-y-2 pt-1 border-t border-amber-500/20">
                      {activeTechnicalVisit.status === "pendente" && (
                        <p className="text-[11px] text-muted-foreground italic text-center py-1">
                          Aguardando confirmação e bloqueio da taxa pelo cliente...
                        </p>
                      )}

                      {(activeTechnicalVisit.status === "aceite" ||
                        activeTechnicalVisit.status === "aguardando_visita") && (
                        <button
                          type="button"
                          onClick={() => store.startTechnicalVisit(activeTechnicalVisit.id)}
                          className="w-full py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                        >
                          <Car size={14} /> Iniciar Deslocação (A Caminho - Uber STP)
                        </button>
                      )}

                      {activeTechnicalVisit.status === "a_caminho" && (
                        <div className="space-y-2">
                          {!activeTechnicalVisit.checkedIn && (
                            <button
                              type="button"
                              onClick={() => handleProviderCheckIn(activeTechnicalVisit.id)}
                              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                            >
                              <MapPin size={14} /> Fazer Check-in GPS no Local
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setOnSiteAmount("");
                              setOnSiteDiagnostic("");
                              setOnSiteBudgetModalOpen(true);
                            }}
                            className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                          >
                            <FileText size={14} /> Lançar Orçamento no Terreno
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCashServiceTitle(activeTechnicalVisit.serviceTitle);
                              setCashModalOpen(true);
                            }}
                            className="w-full py-2 rounded-xl bg-card border border-border text-foreground font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                          >
                            <Banknote size={13} className="text-amber-600" /> Declarar Pagamento
                            Recebido em Mão
                          </button>
                        </div>
                      )}

                      {(activeTechnicalVisit.status === "orcamento_presencial_solicitado" ||
                        activeTechnicalVisit.status === "confirmacao_cliente") && (
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-900 dark:text-blue-200 text-[11px] text-center font-medium">
                          Orçamento de{" "}
                          <strong>
                            {formatDb(activeTechnicalVisit.declaredAmountByProvider || 0)}
                          </strong>{" "}
                          enviado. Aguardando validação do cliente no app.
                        </div>
                      )}
                    </div>
                  )}
              </div>
            )}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
            {messages.map((m) => {
              if (m.kind === "quote" && m.quote) {
                return (
                  <div key={m.id} className="py-1">
                    <QuoteCard
                      quote={m.quote}
                      isClient={isClient}
                      balance={balance}
                      onPay={() => {
                        if (m.quote) setCheckoutQuote(m.quote);
                      }}
                      onComplete={() => {
                        store.completeQuote(id, m.quote!.id);
                        toast.success("Serviço concluído — valor libertado ao prestador");
                        if (isClient && m.quote) {
                          setReviewQuote(m.quote);
                        }
                      }}
                      onDecline={() => store.declineQuote(id, m.quote!.id)}
                      onReview={() => setReviewQuote(m.quote!)}
                      onReleaseMilestone={(milestoneId) => {
                        const ok = store.releaseMilestone(id, m.quote!.id, milestoneId);
                        if (ok) {
                          toast.success("Valor da etapa libertado para a carteira do prestador");
                        }
                      }}
                    />
                  </div>
                );
              }

              // Card de Pedido de Orçamento Direto com Radar GPS & Navegação
              if (m.kind === "quote_request" && m.quoteRequest) {
                const qr = m.quoteRequest;
                return (
                  <div key={m.id} className="py-2 w-full flex justify-center">
                    <div className="w-full max-w-[95%] p-4 rounded-3xl bg-card border-2 border-primary/30 shadow-md space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-foreground">
                          <FileText size={16} className="text-primary" />
                          <span>Pedido de Orçamento Direto</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                          {qr.urgency === "urgente" ? "🚨 Urgente" : "📅 Agendado"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-foreground leading-snug">
                          {qr.title}
                        </h4>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                          {qr.description}
                        </p>
                      </div>

                      {/* Radar GPS e Navegação Google Maps / Waze / Apple Maps */}
                      <ClientGpsRadarCard
                        latitude={qr.latitude}
                        longitude={qr.longitude}
                        accuracy={qr.accuracy}
                        address={qr.address}
                        district={qr.district}
                        referencePoint={qr.referencePoint}
                        clientName={qr.providerName ? "Cliente" : "Cliente"}
                        orderTitle={qr.title}
                        isProviderView={!isClient}
                      />

                      {/* Fotos em anexo se houver */}
                      {qr.photos && qr.photos.length > 0 && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-[11px] font-bold text-muted-foreground mb-1.5">
                            Fotos do Local / Equipamento ({qr.photos.length}):
                          </p>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {qr.photos.map((ph, idx) => (
                              <img
                                key={idx}
                                src={ph}
                                alt={`Foto ${idx + 1}`}
                                className="size-16 rounded-xl object-cover border border-border shrink-0 shadow-2xs"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ação rápida para o Prestador responder com Orçamento */}
                      {!isClient && (
                        <div className="pt-2 border-t border-border flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setComposerOpen(true);
                            }}
                            className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition active:scale-95"
                          >
                            <FileText size={14} />
                            <span>Elaborar e Enviar Orçamento Oficial</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Card Interativo de Confirmação Mútua de Pagamento Presencial (Em Mão)
              if (m.kind === "in_person_confirmation" && m.inPersonDeclaration) {
                const dec = m.inPersonDeclaration;
                const isPending = dec.status === "aguardando_confirmacao";
                const isConfirmed = dec.status === "confirmado_pelo_cliente";
                const isAdjusted = dec.status === "ajustado_pelo_cliente";

                return (
                  <div key={m.id} className="py-2 w-full flex justify-center">
                    <div className="w-full max-w-[94%] p-4 rounded-2xl bg-card border-2 border-amber-500/40 shadow-md space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 dark:text-amber-300">
                          <Banknote size={16} className="text-amber-600" />
                          <span>Pagamento Presencial Declarado</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isConfirmed
                              ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                              : isAdjusted
                                ? "bg-blue-500/20 text-blue-800 dark:text-blue-300"
                                : "bg-amber-500/20 text-amber-900 dark:text-amber-200 animate-pulse"
                          }`}
                        >
                          {isConfirmed
                            ? "✅ Confirmado pelo Cliente"
                            : isAdjusted
                              ? "✏️ Ajustado pelo Cliente"
                              : "⏳ Aguardando Confirmação"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-foreground">{dec.serviceTitle}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-muted-foreground">Valor em Dinheiro:</span>
                          <span className="text-base font-black text-foreground font-mono">
                            {formatDb(dec.actualAmountPaid ?? dec.declaredAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Comissão KONEKTA ({dec.commissionPct}%):</span>
                          <span className="font-bold text-amber-700 dark:text-amber-400">
                            {formatDb(dec.commissionAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Ações do Cliente */}
                      {isClient && isPending && (
                        <div className="pt-2 border-t border-border space-y-2">
                          <p className="text-[11px] text-foreground/80 leading-tight">
                            O prestador declarou que você lhe pagou{" "}
                            <strong>{formatDb(dec.declaredAmount)}</strong> em dinheiro. Este valor
                            foi realmente o cobrado?
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleClientConfirmCash(dec.id, true)}
                              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition active:scale-95"
                            >
                              <Check size={14} /> Sim, Confirmo
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClientConfirmCash(dec.id, false)}
                              className="py-2.5 px-3 rounded-xl bg-muted border border-border text-foreground font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95 hover:bg-muted/80"
                            >
                              <Edit3 size={14} /> Não, Corrigir Valor
                            </button>
                          </div>
                        </div>
                      )}

                      {!isClient && isPending && (
                        <p className="text-[10px] text-muted-foreground italic text-center pt-1 border-t border-border">
                          Aguardando validação do cliente. A comissão de{" "}
                          {formatDb(dec.commissionAmount)} será debitada da sua conta KONEKTA PRO.
                        </p>
                      )}

                      {(isConfirmed || isAdjusted) && (
                        <div className="pt-1.5 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Garantia KONEKTA ativada para este serviço</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Auditoria 100% Ok
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              if (m.kind === "system") {
                return (
                  <div key={m.id} className="py-2 w-full flex justify-center">
                    <div className="max-w-[92%] px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs shadow-2xs space-y-1.5 text-left">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-800 dark:text-amber-300">
                        <ShieldAlert
                          size={15}
                          className="shrink-0 text-amber-600 dark:text-amber-400"
                        />
                        <span>Aviso de Segurança KONEKTA</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-foreground/90">{m.text}</p>
                      <p className="text-[9px] text-right text-muted-foreground pt-0.5 font-mono">
                        {new Date(m.at).toLocaleTimeString("pt-PT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              }

              if (m.kind === "photo" || (m.photos && m.photos.length > 0)) {
                const isMe = m.from === "me";
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-xs rounded-2xl overflow-hidden text-xs shadow-2xs ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-xs"
                          : "bg-card border border-border text-foreground rounded-bl-xs"
                      }`}
                    >
                      <div
                        className="relative group cursor-pointer"
                        onClick={() => setViewingPhoto(m.photos?.[0] || null)}
                      >
                        <img
                          src={m.photos?.[0]}
                          alt="Foto diagnóstico"
                          className="w-full h-44 sm:h-48 object-cover hover:opacity-95 transition-opacity"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/65 text-white text-[10px] font-bold backdrop-blur-md flex items-center gap-1">
                          <Camera size={11} className="text-amber-300" /> Diagnóstico STP
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="leading-relaxed font-medium">{m.text}</p>
                        <p
                          className={`text-[9px] mt-1 text-right opacity-70 ${
                            isMe ? "text-primary-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {new Date(m.at).toLocaleTimeString("pt-PT", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              const isMe = m.from === "me";
              return (
                <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-xs"
                        : "bg-card border border-border text-foreground rounded-bl-xs shadow-2xs"
                    }`}
                  >
                    <p className="leading-relaxed">{m.text}</p>
                    <p
                      className={`text-[9px] mt-1 text-right opacity-70 ${
                        isMe ? "text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {new Date(m.at).toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="mr-auto bg-card ring-1 ring-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5 shadow-2xs">
                <span className="text-xs text-muted-foreground mr-1">
                  {provider.name.split(" ")[0]} está a escrever
                </span>
                <span className="size-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.3s]" />
                <span className="size-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.15s]" />
                <span className="size-1.5 rounded-full bg-primary/70 animate-bounce" />
              </div>
            )}
          </div>

          {/* Barra de Ações & Envio de Mensagem */}
          <div className="sticky bottom-0 bg-card ring-1 ring-border px-3 py-3 space-y-2">
            {isAllOrdersFinished ? (
              <div className="p-3 rounded-2xl bg-muted/80 border border-border text-center space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-foreground">
                  <Lock size={14} className="text-muted-foreground" />
                  <span>Serviço Concluído · Chat Encerrado</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Este serviço foi concluído e os valores foram liquidados com sucesso. O chat foi
                  fechado.
                </p>
                <div className="pt-1 flex items-center justify-center gap-2">
                  <Link
                    to="/chat"
                    className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition"
                  >
                    Voltar às conversas
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {isClient ? (
                  <div className="flex gap-2">
                    <Link
                      to="/orcamento/$providerId"
                      params={{ providerId: id }}
                      className="press flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent text-xs font-semibold text-accent-foreground hover:bg-accent/80 transition"
                    >
                      <FileText size={14} className="text-primary" /> Solicitar Orçamento Oficial
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setComposerOpen(true)}
                      disabled={isProviderBlockedForDebt}
                      className="press flex min-h-10 items-center justify-center gap-1 rounded-xl bg-accent text-[11px] font-semibold text-accent-foreground hover:bg-accent/80 transition cursor-pointer disabled:opacity-40"
                      title="Enviar orçamento diretamente caso fotos e dados bastem"
                    >
                      <Tag size={12} className="text-primary" /> Orçamento
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisitModalOpen(true)}
                      disabled={isProviderBlockedForDebt}
                      className="press flex min-h-10 items-center justify-center gap-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-900 dark:text-amber-200 hover:bg-amber-500/25 transition cursor-pointer disabled:opacity-40"
                      title="Propor visita técnica no terreno para avaliar antes de orçar"
                    >
                      <Car size={12} /> Visita
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashModalOpen(true)}
                      className="press flex min-h-10 items-center justify-center gap-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-900 dark:text-emerald-200 hover:bg-emerald-500/25 transition cursor-pointer"
                      title="Declarar valor cobrado em mão para liquidação de comissão"
                    >
                      <Banknote size={12} /> Em Mão
                    </button>
                  </div>
                )}

                {/* Respostas Rápidas / Mensagens Pré-definidas Contextuais */}
                <ChatQuickReplies
                  isClient={isClient}
                  hasActiveQuote={Boolean(activeQuote)}
                  isEscrowPaid={Boolean(
                    activeQuote &&
                    (activeQuote.status === "pago" || activeQuote.status === "concluido"),
                  )}
                  onSelect={(reply) => {
                    setText(reply);
                  }}
                />

                {/* Aviso pró-ativo em tempo real ao digitar termos restritos com detecção de país */}
                {!unlocked &&
                  text.trim().length > 2 &&
                  (() => {
                    const analysis = analyzeBlockedContent(text);
                    if (!analysis.blocked) return null;
                    return (
                      <div className="flex items-start gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-[11px] animate-in fade-in">
                        <ShieldAlert
                          size={14}
                          className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5"
                        />
                        <span className="leading-tight font-medium">
                          {analysis.reason ||
                            "Detectado contacto ou termo restrito. As negociações devem ser feitas na app."}
                        </span>
                      </div>
                    );
                  })()}

                <form onSubmit={handleSend} className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => setPhotoModalOpen(true)}
                    className="size-11 rounded-xl bg-muted hover:bg-muted/80 text-foreground grid place-items-center cursor-pointer transition shrink-0 border border-border"
                    title="Enviar foto para diagnóstico à distância"
                  >
                    <Camera size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={handleShareGPSLocation}
                    disabled={isLocatingGPS}
                    className="size-11 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary grid place-items-center cursor-pointer transition shrink-0 border border-primary/20 disabled:opacity-50"
                    title="Partilhar Zona e Localização GPS em tempo real"
                  >
                    <Navigation
                      size={18}
                      className={isLocatingGPS ? "animate-spin text-primary" : ""}
                    />
                  </button>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escreva uma mensagem no chat protegido..."
                    maxLength={500}
                    className={`flex-1 py-2.5 px-3.5 bg-surface ring-1 rounded-xl text-xs focus:outline-none focus:ring-2 text-foreground placeholder:text-muted-foreground ${
                      !unlocked && text.trim().length > 2 && containsBlockedContent(text)
                        ? "ring-amber-500/60 focus:ring-amber-500/40"
                        : "ring-border focus:ring-primary/40"
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!text.trim()}
                    className="size-11 rounded-xl bg-primary text-primary-foreground grid place-items-center disabled:opacity-40 cursor-pointer shrink-0"
                    aria-label="Enviar"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Prestador Lança Orçamento no Terreno após Avaliação */}
      <BottomSheet
        open={onSiteBudgetModalOpen}
        onClose={() => setOnSiteBudgetModalOpen(false)}
        title="Lançar Orçamento Presencial no Terreno"
        description="Indique o valor final orçado após inspecionar o local. O cliente validará no app e o valor ficará retido em custódia (Escrow)."
      >
        <form onSubmit={handleProviderSubmitOnSiteBudget} className="space-y-3 pt-2">
          {activeTechnicalVisit && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                <span>Serviço Inspecionado:</span>
                <span>{activeTechnicalVisit.serviceTitle}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Taxa de deslocação já retida:</span>
                <strong className="text-foreground">
                  {formatDb(activeTechnicalVisit.visitFee)}
                </strong>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Valor Total do Serviço Presencial (STN / Db) *
            </label>
            <input
              type="number"
              min="1"
              value={onSiteAmount}
              onChange={(e) => setOnSiteAmount(e.target.value)}
              placeholder="Ex: 850"
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20 font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Diagnóstico Técnico / Discriminação do Trabalho
            </label>
            <textarea
              value={onSiteDiagnostic}
              onChange={(e) => setOnSiteDiagnostic(e.target.value)}
              rows={3}
              placeholder="Ex: Substituição de válvula de corte + reparação do tubo condutor e teste de estanqueidade..."
              className="w-full p-3 rounded-xl bg-muted text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/60 border border-border text-xs">
            <div>
              <span className="font-bold text-foreground block">Abater Taxa de Visita</span>
              <span className="text-[10px] text-muted-foreground">
                Descontar os {formatDb(activeTechnicalVisit?.visitFee || 150)} já pagos no valor
                final
              </span>
            </div>
            <input
              type="checkbox"
              checked={onSiteDeductVisitFee}
              onChange={(e) => setOnSiteDeductVisitFee(e.target.checked)}
              className="size-4 text-primary rounded"
            />
          </div>

          {Number(onSiteAmount) > 0 && activeTechnicalVisit && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Valor Bruto:</span>
                <span>{formatDb(Number(onSiteAmount))}</span>
              </div>
              {onSiteDeductVisitFee && (
                <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-medium">
                  <span>Dedução da visita:</span>
                  <span>- {formatDb(activeTechnicalVisit.visitFee)}</span>
                </div>
              )}
              <div className="flex items-center justify-between font-bold text-foreground pt-1 border-t border-emerald-500/20">
                <span>Complemento a reter do cliente:</span>
                <span className="text-primary font-black">
                  {formatDb(
                    Math.max(
                      0,
                      Number(onSiteAmount) -
                        (onSiteDeductVisitFee ? activeTechnicalVisit.visitFee : 0),
                    ),
                  )}
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
          >
            <Send size={15} />
            Submeter Orçamento para Validação do Cliente
          </button>
        </form>
      </BottomSheet>

      {/* Modal: Cliente Valida Orçamento Presencial / Informa Divergência */}
      <BottomSheet
        open={clientValidationModalOpen}
        onClose={() => setClientValidationModalOpen(false)}
        title="Validação do Orçamento Presencial"
        description="Se acordou um montante diferente com o prestador no terreno, declare-o aqui para validação algorítmica e proteção KONEKTA."
      >
        <div className="space-y-3.5 pt-2">
          {activeTechnicalVisit && (
            <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Valor declarado pelo prestador:</span>
                <strong className="text-foreground">
                  {formatDb(activeTechnicalVisit.declaredAmountByProvider || 0)}
                </strong>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Taxa de deslocação já retida:</span>
                <span>{formatDb(activeTechnicalVisit.visitFee)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Valor Acordado no Terreno (STN / Db) *
            </label>
            <input
              type="number"
              min="1"
              value={clientAgreedAmountInput}
              onChange={(e) => setClientAgreedAmountInput(e.target.value)}
              placeholder="Ex: 750"
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20 font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Justificação da Diferença / Observações (opcional)
            </label>
            <textarea
              value={clientValidationNotes}
              onChange={(e) => setClientValidationNotes(e.target.value)}
              rows={2}
              placeholder="Ex: Foi acordado fazer apenas a substituição sem a pintura final..."
              className="w-full p-3 rounded-xl bg-muted text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Análise Algorítmica em Tempo Real */}
          {activeTechnicalVisit &&
            Number(clientAgreedAmountInput) > 0 &&
            (() => {
              const providerVal = activeTechnicalVisit.declaredAmountByProvider || 0;
              const clientVal = Number(clientAgreedAmountInput);
              const benchmark = getCategoryBenchmark(activeTechnicalVisit.category);
              const preview = evaluatePriceDivergence({
                declaredByProvider: providerVal,
                confirmedByClient: clientVal,
                benchmarkAverage: benchmark.averagePrice,
                category: activeTechnicalVisit.category,
              });

              return (
                <div
                  className={`p-3 rounded-xl text-xs space-y-1.5 border ${
                    preview.tier === "tier_1_auto"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                      : preview.tier === "tier_2_benchmark"
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-950 dark:text-blue-200"
                        : "bg-red-500/10 border-red-500/30 text-red-950 dark:text-red-200"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>Divergência Calculada:</span>
                    <span className="font-mono text-sm">
                      {preview.divergencePercent.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {preview.tier === "tier_1_auto" &&
                      "✅ Divergência ≤ 15%: Aceitação automática do valor informado pelo cliente e ajuste de custódia."}
                    {preview.tier === "tier_2_benchmark" &&
                      `🔍 Divergência entre 15% e 40%: Verificação algorítmica face à média de mercado em São Tomé (${formatDb(benchmark.avgPrice || benchmark.averagePrice || 0)}).`}
                    {preview.tier === "tier_3_moderation" &&
                      "🚨 Divergência crítica (> 40%): O pedido será congelado em custódia e encaminhado para o Painel de Moderação Administrativa KONEKTA."}
                  </p>
                </div>
              );
            })()}

          <button
            type="button"
            onClick={() => handleClientValidateBudget(false, Number(clientAgreedAmountInput))}
            disabled={!Number(clientAgreedAmountInput)}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs disabled:opacity-40"
          >
            <Scale size={15} />
            Submeter Validação de Orçamento
          </button>
        </div>
      </BottomSheet>

      {/* Modal: Profissional Declara Pagamento Presencial (Em Mão) */}
      <BottomSheet
        open={cashModalOpen}
        onClose={() => setCashModalOpen(false)}
        title="Declarar Pagamento Presencial (Em Mão)"
        description="Registe o montante cobrado diretamente ao cliente. A comissão KONEKTA será processada após confirmação do cliente."
      >
        <form onSubmit={handleDeclareCashPayment} className="space-y-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span>Taxa de Comissão:</span>
              <span className="text-sm font-black text-primary">{config.commissionPct || 10}%</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              O cliente receberá uma notificação no chat para confirmar o valor. Caso a sua dívida
              de comissões atinja 500 STN, a conta é suspensa até à respetiva liquidação.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Título / Descrição do Serviço Realizado *
            </label>
            <input
              type="text"
              value={cashServiceTitle}
              onChange={(e) => setCashServiceTitle(e.target.value)}
              placeholder="Ex: Reparação de canalização / Deslocação técnica"
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Valor Cobrado ao Cliente (STN) *
            </label>
            <input
              type="number"
              min="1"
              value={cashDeclaredAmount}
              onChange={(e) => setCashDeclaredAmount(e.target.value)}
              placeholder="Ex: 450"
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20 font-mono"
              required
            />
            {Number(cashDeclaredAmount) > 0 && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Comissão da app:{" "}
                <strong className="text-foreground">
                  {Math.round((Number(cashDeclaredAmount) * (config.commissionPct || 10)) / 100)}{" "}
                  STN
                </strong>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
          >
            <Banknote size={16} />
            Enviar Declaração para Confirmação do Cliente
          </button>
        </form>
      </BottomSheet>

      {/* Modal: Cliente Corrige / Ajusta Valor Pago Presencialmente */}
      <BottomSheet
        open={!!adjustingDeclaration}
        onClose={() => setAdjustingDeclaration(null)}
        title="Retificar Valor Pago Presencialmente"
        description="Se o valor cobrado foi diferente do declarado pelo prestador, insira o montante exato pago."
      >
        <form onSubmit={handleSubmitAdjustedCash} className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Valor Real Pago ao Profissional (STN) *
            </label>
            <input
              type="number"
              min="1"
              value={adjustedAmountInput}
              onChange={(e) => setAdjustedAmountInput(e.target.value)}
              placeholder="Ex: 350"
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20 font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Observação / Justificação (opcional)
            </label>
            <textarea
              value={clientNotesInput}
              onChange={(e) => setClientNotesInput(e.target.value)}
              rows={2}
              placeholder="Ex: O técnico concedeu um desconto de 50 STN no material..."
              className="w-full p-3 rounded-xl bg-muted text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
          >
            <Check size={16} />
            Validar Valor Corrigido
          </button>
        </form>
      </BottomSheet>

      {/* Modal: Profissional Propõe Visita Técnica no Terreno para Orçar */}
      <BottomSheet
        open={visitModalOpen}
        onClose={() => setVisitModalOpen(false)}
        title="Propor Visita Técnica no Terreno"
        description="Agende uma inspeção presencial para avaliar as condições e elaborar um orçamento rigoroso."
      >
        <form onSubmit={handleProposeTechnicalVisit} className="space-y-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span>Taxa de Deslocação Uber STP:</span>
              <span className="text-sm font-black text-primary">
                {formatDb(config.technicalVisitFee || 150)}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              O cliente aceita a proposta e o valor fica retido em custódia na KONEKTA, sendo
              creditado a si após a conclusão da visita.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Motivo da Avaliação no Terreno *
            </label>
            <input
              type="text"
              value={visitReason}
              onChange={(e) => setVisitReason(e.target.value)}
              placeholder="Ex: Medições técnicas no local, diagnóstico de tubagens..."
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Data Proposta</label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-muted text-xs font-medium text-foreground outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Hora Proposta</label>
              <input
                type="time"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-muted text-xs font-medium text-foreground outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Distrito / Local</label>
            <select
              value={visitDistrict}
              onChange={(e) => setVisitDistrict(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-muted text-xs font-medium text-foreground outline-none"
            >
              <option value="Água Grande">Água Grande</option>
              <option value="Mé-Zóchi">Mé-Zóchi</option>
              <option value="Lobata">Lobata</option>
              <option value="Cantagalo">Cantagalo</option>
              <option value="Lembá">Lembá</option>
              <option value="Caué">Caué</option>
              <option value="Príncipe">Região Autónoma do Príncipe</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Ponto de Encontro / Morada
            </label>
            <input
              type="text"
              value={visitAddress}
              onChange={(e) => setVisitAddress(e.target.value)}
              placeholder="Ex: Perto do Hotel Miramar, casa azul"
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-medium text-foreground outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submittingVisit}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <Car size={16} />
            Enviar Proposta de Visita ao Cliente
          </button>
        </form>
      </BottomSheet>

      {/* Modal: Prestador conclui Diagnóstico e gera Orçamento */}
      <BottomSheet
        open={diagnosticModalOpen}
        onClose={() => setDiagnosticModalOpen(false)}
        title="Relatório de Diagnóstico no Terreno"
        description="Registe o relatório técnico e envie o orçamento final para o cliente."
      >
        <form onSubmit={handleCompleteDiagnostic} className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Diagnóstico / Solução Técnica Apurada *
            </label>
            <textarea
              value={diagnosticText}
              onChange={(e) => setDiagnosticText(e.target.value)}
              rows={3}
              placeholder="Descreva o que foi analisado no terreno e o que precisa de ser feito..."
              className="w-full p-3 rounded-xl bg-muted text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Valor do Orçamento Proposto (Db)
            </label>
            <input
              type="number"
              min="1"
              value={proposedQuoteAmount}
              onChange={(e) => setProposedQuoteAmount(e.target.value)}
              placeholder="Ex: 850"
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Será gerado um cartão oficial de orçamento com cálculo automático de custódia.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <Check size={16} /> Concluir Visita & Enviar Orçamento
          </button>
        </form>
      </BottomSheet>

      {/* Visualizador de Foto em Tamanho Grande */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setViewingPhoto(null)}
        >
          <button
            type="button"
            onClick={() => setViewingPhoto(null)}
            className="absolute top-4 right-4 size-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition cursor-pointer"
            aria-label="Fechar foto"
          >
            <X size={20} />
          </button>
          <img
            src={viewingPhoto}
            alt="Foto ampliada do pedido"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-white/80 text-xs mt-3 text-center">
            Toque fora da imagem ou no botão para fechar
          </p>
        </div>
      )}

      {!isClient && (
        <QuoteComposer
          open={composerOpen}
          onClose={() => setComposerOpen(false)}
          onSubmit={(input) => {
            store.sendQuote(id, { ...input, from: "me" });
            toast.success("Orçamento enviado no chat");
          }}
        />
      )}

      {/* Modal: Diagnóstico à Distância / Envio de Foto */}
      <BottomSheet
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        title="Diagnóstico à Distância (Foto da Avaria)"
        description="Envie uma foto clara do problema para o técnico avaliar se precisa de peças ou visita antes de se deslocar no terreno."
      >
        <form onSubmit={handleSendPhotoDiagnostic} className="space-y-4">
          {/* Opção 1: Upload Direto da Câmara ou Galeria do Telemóvel */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground block">
              1. Carregar Foto do Dispositivo ou Tirar Foto
            </label>
            {/* Inputs nativos para acionar diretamente câmara ou galeria do telemóvel */}
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleImageFileChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
            <input
              type="file"
              ref={galleryInputRef}
              onChange={handleImageFileChange}
              accept="image/*"
              className="hidden"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="py-3 px-3 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
              >
                <Camera size={22} className="stroke-[2]" />
                <span>Câmara Nativa</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="py-3 px-3 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/40 hover:bg-muted text-foreground font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
              >
                <ImageIcon size={22} className="text-primary stroke-[2]" />
                <span>Galeria de Fotos</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              2. Ou selecione um exemplo comum de avaria em São Tomé
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "Tubo / Torneira com fuga",
                  url: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80",
                },
                {
                  label: "Quadro elétrico / Disjuntor",
                  url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",
                },
                {
                  label: "Ar Condicionado / Climatização",
                  url: "https://images.unsplash.com/photo-1631545806609-43c391796d19?w=800&auto=format&fit=crop&q=80",
                },
                {
                  label: "Humidade / Parede / Teto",
                  url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80",
                },
              ].map((sample) => (
                <button
                  key={sample.url}
                  type="button"
                  onClick={() => setSelectedPhotoUrl(sample.url)}
                  className={`p-2 rounded-xl border text-left flex flex-col gap-1.5 transition ${
                    selectedPhotoUrl === sample.url
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <img
                    src={sample.url}
                    alt={sample.label}
                    className="w-full h-16 rounded-lg object-cover"
                  />
                  <span className="text-[11px] font-bold text-foreground line-clamp-1">
                    {sample.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Link da Imagem ou URL da Foto
            </label>
            <input
              type="url"
              value={selectedPhotoUrl}
              onChange={(e) => setSelectedPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-10 px-3 rounded-xl bg-muted text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Descrição ou Sintoma da Avaria
            </label>
            <textarea
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
              rows={2}
              placeholder="Ex: A torneira começou a pingar e verte água na base do armário..."
              className="w-full p-2.5 rounded-xl bg-muted text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Pré-visualização da Imagem Selecionada */}
          {selectedPhotoUrl && (
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img
                src={selectedPhotoUrl}
                alt="Pré-visualização do diagnóstico"
                className="w-full h-36 object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-semibold">
                Pré-visualização
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-950 dark:text-blue-200 text-xs flex items-center gap-2">
            <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="leading-tight">
              O diagnóstico por foto poupa tempo e custos de deslocação desnecessários entre
              distritos em São Tomé.
            </span>
          </div>

          <button
            type="submit"
            disabled={isUploadingPhoto || !selectedPhotoUrl}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:opacity-95 transition disabled:opacity-50"
          >
            {isUploadingPhoto ? (
              <span>A enviar foto...</span>
            ) : (
              <>
                <Send size={16} /> Enviar Diagnóstico ao Prestador
              </>
            )}
          </button>
        </form>
      </BottomSheet>

      {/* Modal de Cancelamento de Serviço com Aviso de Riscos */}
      {cancelModalOrder && (
        <CancelServiceModal
          open={!!cancelModalOrder}
          onClose={() => setCancelModalOrder(null)}
          order={cancelModalOrder}
          onCancelled={() => {
            setCancelModalOrder(null);
          }}
        />
      )}

      {/* Modal de Avaliação pós-serviço no Chat */}
      {reviewQuote && (
        <ReviewModal
          open={!!reviewQuote}
          onClose={() => setReviewQuote(null)}
          providerId={id}
          providerName={provider.name}
          providerImage={provider.image}
          providerCategory={provider.category}
          serviceName={reviewQuote.title || reviewQuote.description}
        />
      )}

      {/* Modal de Checkout Interno no Chat (Escrow + Dobra 24) */}
      {checkoutQuote && (
        <InChatCheckoutModal
          open={Boolean(checkoutQuote)}
          onClose={() => setCheckoutQuote(null)}
          quote={checkoutQuote}
          providerName={provider.name}
        />
      )}

      {/* Modal de Garantias, Auditoria e Mediação KONEKTA */}
      <ChatMediationModal
        open={mediationModalOpen}
        onClose={() => setMediationModalOpen(false)}
        providerName={provider.name}
      />
    </AuthGate>
  );
}
