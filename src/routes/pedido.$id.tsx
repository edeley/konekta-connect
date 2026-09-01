import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Clock,
  MapPin,
  MessageCircle,
  Sparkles,
  Image as ImageIcon,
  X,
  Calendar,
  Phone,
  Navigation,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Star,
  FileText,
  Lock,
  ArrowLeft,
  ChevronRight,
  UserCheck,
  Check,
  Wrench,
  Shield,
  Layers,
  KeyRound,
  Copy,
  CheckCheck,
  Send,
  User,
  Wallet,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  ScreenHeader,
  Section,
  KCard,
  StatusPill,
  EmptyState,
  Stars,
  BottomSheet,
} from "@/components/konekta/kit";
import { Button } from "@/components/ui/button";
import { useStore, store, type Order } from "@/lib/store";
import { formatDb } from "@/lib/catalog";
import { getProvider, type OrderStatus } from "@/lib/konekta-data";
import { orderStateMeta } from "@/lib/states";
import {
  requestStatusLabel,
  timeAgo,
  urgencyLabel,
  type Proposal,
  type ServiceRequest,
} from "@/lib/requests";
import { openNativeMap, downloadIcsCalendarFile } from "@/lib/sync-manager";
import { ClientPinCard } from "@/components/konekta/ClientPinCard";
import { PinVerificationSheet } from "@/components/konekta/PinVerificationSheet";
import { EscrowCheckoutCard } from "@/components/konekta/EscrowCheckoutCard";
import { DisputeDrawer } from "@/components/konekta/DisputeDrawer";
import { ReviewAndPostServiceSheet } from "@/components/konekta/ReviewAndPostServiceSheet";
import { ClientGpsRadarCard } from "@/components/konekta/ClientGpsRadarCard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pedido/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe do Serviço · KONEKTA STP" },
      {
        name: "description",
        content: "Acompanhe todos os detalhes, estado e validação do serviço na KONEKTA.",
      },
      { property: "og:title", content: "Detalhe do Serviço · KONEKTA STP" },
      {
        property: "og:description",
        content: "Estado em tempo real, código de conclusão OTP e proteção de custódia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RequestOrOrderDetail,
});

const ORDER_STEPS: { status: OrderStatus; label: string; description: string }[] = [
  { status: "pendente", label: "Pendente", description: "Aguardando confirmação e retenção" },
  {
    status: "aceite",
    label: "Retido em Custódia",
    description: "Pagamento seguro retido pela KONEKTA",
  },
  { status: "a-caminho", label: "A caminho", description: "Prestador em deslocação para o local" },
  {
    status: "em-execucao",
    label: "Em execução",
    description: "Trabalho iniciado e a decorrer no local",
  },
  {
    status: "aguardando-codigo",
    label: "Aguardando PIN",
    description: "Trabalho terminado · Aguarda validação do PIN de 4 dígitos",
  },
  { status: "concluido", label: "Concluído", description: "PIN validado e pagamento liquidado" },
  {
    status: "avaliado",
    label: "Avaliado",
    description: "Serviço finalizado e avaliação submetida",
  },
];

function RequestOrOrderDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const isProvider = user?.role === "prestador";

  // Pode ser uma Order ou um Request aberto
  const order = useStore((s) => s.orders.find((o) => o.id === id));
  const request = useStore((s) => s.requests.find((r) => r.id === id));

  // Estados locais para modais e interações
  const [chosenProposal, setChosenProposal] = useState<Proposal | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);

  // Estado para proposta do prestador em pedidos abertos
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [proposalPrice, setProposalPrice] = useState("");
  const [proposalMessage, setProposalMessage] = useState("");
  const [proposalAvailability, setProposalAvailability] = useState("Hoje");

  // =========================================================================
  // CASO 1: SE FOR UMA ENCOMENDA / ORDEM ATIVA (ORDER)
  // =========================================================================
  if (order) {
    const provider = getProvider(order.providerId);
    const meta = orderStateMeta[order.status] || {
      label: order.status,
      tone: "primary",
      message: "Acompanhe o estado do seu serviço.",
    };
    const isFinished = ["concluido", "avaliado"].includes(order.status);
    const currentStepIndex = ORDER_STEPS.findIndex((s) => s.status === order.status);
    const completionCode = order.completionCode || "5821";

    const handleAdvance = () => {
      if (order.status === "pendente") {
        store.updateOrder(order.id, { status: "aceite" });
        toast.success("Pedido aceite com sucesso!");
      } else if (order.status === "aceite") {
        store.updateOrder(order.id, { status: "a-caminho" });
        toast.success("Marcou que está a caminho do local.");
      } else if (order.status === "a-caminho") {
        store.startService(order.id);
        toast.success("Serviço marcado como iniciado no local (Check-in GPS)!");
      } else if (order.status === "em-execucao") {
        store.finishService(order.id);
        toast.success("Serviço terminado! Peça o código PIN de 4 dígitos ao cliente.");
      }
    };

    const handleClientDirectRelease = () => {
      store.clientReleasePayment(order.id);
      toast.success("Pagamento liquidado com sucesso para o prestador!");
      setIsReviewOpen(true);
    };

    return (
      <AppShell hideFab>
        {/* CABEÇALHO SUPERIOR */}
        <div className="bg-card border-b border-border/80 px-4 py-3 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  navigate({ to: isProvider ? "/pro/pedidos" : "/pedidos" });
                }
              }}
              className="size-9 rounded-xl bg-muted/60 hover:bg-muted grid place-items-center text-foreground transition active:scale-95 cursor-pointer shrink-0"
              title="Voltar"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="min-w-0 flex-1 text-center">
              <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
                {order.id}
              </span>
              <h1 className="text-sm font-black text-foreground truncate">{order.service}</h1>
            </div>

            <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-4 p-4 pb-28 animate-fadeIn">
          {/* ================================================================= */}
          {/* SECÇÃO 1: ESTADO DO SERVIÇO EM TEMPO REAL & STEPPER */}
          {/* ================================================================= */}
          <KCard className="border border-border shadow-soft space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {isProvider ? "Acompanhamento da Execução" : "Estado do Serviço em Tempo Real"}
                </p>
                <h2 className="text-base font-black text-foreground flex items-center gap-1.5 mt-0.5">
                  <Clock size={16} className="text-primary" />
                  Estado: {meta.label}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-primary font-mono block">
                  {formatDb(order.total)}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold">
                  {isFinished ? "Liquidado" : "Custódia Segura"}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-muted/40 p-3.5 border border-border/60">
              <p className="text-xs text-foreground font-medium leading-relaxed">{meta.message}</p>
              <div className="mt-2.5 flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">
                <ShieldCheck size={14} className="shrink-0" />
                <span>
                  {isFinished
                    ? "Pagamento liquidado com sucesso na carteira KONEKTA"
                    : "Valor 100% protegido pela Garantia de Custódia KONEKTA STP"}
                </span>
              </div>
            </div>

            {/* PROGRESS STEPPER VISUAL */}
            <div className="pt-2">
              <p className="text-[11px] font-bold text-muted-foreground mb-3">
                Linha de Progresso do Serviço:
              </p>
              <div className="space-y-3">
                {ORDER_STEPS.map((step, idx) => {
                  const isDone = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div key={step.status} className="flex items-start gap-3 relative">
                      {idx < ORDER_STEPS.length - 1 && (
                        <div
                          className={cn(
                            "absolute left-3.5 top-7 bottom-0 w-0.5 -mb-3 transition-colors",
                            idx < currentStepIndex ? "bg-primary" : "bg-border",
                          )}
                        />
                      )}
                      <div
                        className={cn(
                          "size-7 rounded-full grid place-items-center shrink-0 z-10 font-bold text-xs transition-all",
                          isDone
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : isCurrent
                              ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110 shadow-sm"
                              : "bg-muted text-muted-foreground border border-border",
                        )}
                      >
                        {isDone ? <Check size={14} /> : idx + 1}
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              "text-xs font-bold",
                              isCurrent
                                ? "text-primary"
                                : isDone
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                            )}
                          >
                            {step.label}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              Fase Atual
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </KCard>

          {/* ================================================================= */}
          {/* FASE: CHECKOUT EM CUSTÓDIA QUANDO O PEDIDO ESTÁ PENDENTE */}
          {/* ================================================================= */}
          {!isProvider && order.status === "pendente" && (
            <EscrowCheckoutCard
              orderId={order.id}
              serviceTitle={order.service}
              providerName={provider?.name || "Prestador Verificado"}
              providerAvatar={provider?.image}
              serviceAmount={order.total}
              escrowFeePercent={5}
              onCheckoutSuccess={() => {
                store.updateOrder(order.id, { status: "aceite" });
              }}
            />
          )}

          {/* ================================================================= */}
          {/* VISÃO DO CLIENTE: DISPLAY EXCLUSIVO DO PIN DE CUSTÓDIA */}
          {/* ================================================================= */}
          {!isProvider &&
            ["aceite", "a-caminho", "em-execucao", "aguardando-codigo"].includes(order.status) && (
              <ClientPinCard
                orderId={order.id}
                pinCode={completionCode}
                totalAmount={order.total}
                serviceTitle={order.service}
                onDirectRelease={handleClientDirectRelease}
              />
            )}

          {/* ================================================================= */}
          {/* VISÃO DO PRESTADOR: SHEET DE VALIDAÇÃO DO PIN COM AUTO-SUBMIT */}
          {/* ================================================================= */}
          {isProvider && order.status === "aguardando-codigo" && (
            <PinVerificationSheet
              orderId={order.id}
              providerId={order.providerId}
              totalAmount={order.total}
              serviceTitle={order.service}
              onSuccess={() => {
                toast.success("Serviço concluído com sucesso!");
              }}
            />
          )}

          {/* ================================================================= */}
          {/* BOTÕES DE CONTROLO DE EXECUÇÃO DO PRESTADOR */}
          {/* ================================================================= */}
          {isProvider && !isFinished && (
            <KCard className="border border-border p-4 rounded-3xl space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ações de Execução do Profissional
              </p>

              {order.status === "pendente" && (
                <Button
                  onClick={handleAdvance}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm"
                >
                  <CheckCircle2 size={16} /> Aceitar Pedido & Confirmar
                </Button>
              )}

              {order.status === "aceite" && (
                <Button
                  onClick={handleAdvance}
                  className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm"
                >
                  <Navigation size={16} /> Iniciar Deslocação (A Caminho)
                </Button>
              )}

              {order.status === "a-caminho" && (
                <Button
                  onClick={handleAdvance}
                  className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm"
                >
                  <Wrench size={16} /> Cheguei ao Local · Check-in GPS & Iniciar
                </Button>
              )}

              {order.status === "em-execucao" && (
                <Button
                  onClick={handleAdvance}
                  className="w-full h-12 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm"
                >
                  <CheckCircle2 size={16} /> Concluir Serviço & Solicitar PIN
                </Button>
              )}
            </KCard>
          )}

          {/* ================================================================= */}
          {/* SECÇÃO 2: INFORMAÇÕES DETALHADAS DO SERVIÇO & ESCOPO */}
          {/* ================================================================= */}
          <KCard className="border border-border shadow-soft space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Layers size={14} className="text-primary" />
              <span>Informações do Serviço & Escopo</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-foreground">{order.service}</h3>
              {order.category && (
                <p className="text-xs font-semibold text-primary">{order.category}</p>
              )}
            </div>

            <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {order.notes ||
                "Serviço solicitado e confirmado através da plataforma KONEKTA STP com parâmetros acordados entre cliente e profissional."}
            </p>

            {/* Fotografias Anexadas */}
            {order.photos && order.photos.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <ImageIcon size={14} className="text-primary" />
                  <span>Fotografias do Local / Avaria ({order.photos.length}):</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {order.photos.map((photoUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setViewingPhoto(photoUrl)}
                      className="relative size-20 rounded-2xl overflow-hidden border border-border bg-muted shadow-2xs group shrink-0 active:scale-95 transition cursor-pointer"
                      title="Ver foto ampliada"
                    >
                      <img
                        src={photoUrl}
                        alt={`Foto do serviço ${idx + 1}`}
                        className="h-full w-full object-cover group-hover:scale-105 transition"
                      />
                      <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Garantia do Serviço */}
            <div className="rounded-2xl bg-emerald-500/10 p-3 border border-emerald-500/25 flex items-start gap-2.5 text-xs text-emerald-950 dark:text-emerald-200">
              <Shield
                size={16}
                className="text-emerald-800 dark:text-emerald-400 shrink-0 mt-0.5"
              />
              <div>
                <p className="font-bold">Garantia & Qualidade KONEKTA</p>
                <p className="mt-0.5 text-[11px] opacity-90">
                  {order.warranty ||
                    "Garantia de conformidade KONEKTA STP. O valor só é libertado após validação por código PIN."}
                </p>
              </div>
            </div>
          </KCard>

          {/* ================================================================= */}
          {/* SECÇÃO 3: LOCALIZAÇÃO E HORÁRIO */}
          {/* ================================================================= */}
          <KCard className="border border-border shadow-soft space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <MapPin size={14} className="text-primary" />
              <span>Agendamento & Local de Encontro</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <Calendar size={12} /> Data & Hora Agendada
                </span>
                <p className="font-bold text-foreground text-sm">{order.scheduledFor}</p>
                <p className="text-[11px] text-muted-foreground">
                  Horário acordado para atendimento
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <MapPin size={12} /> Distrito & Ponto
                </span>
                <p className="font-bold text-foreground text-sm truncate">
                  {order.district || "São Tomé"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {order.address || "Localização indicada pelo cliente"}
                </p>
              </div>
            </div>

            {/* RADAR GPS & NAVEGAÇÃO TURNO-A-TURNO (ESTILO ENCONTRAR DISPOSITIVO) */}
            <div className="pt-2">
              <ClientGpsRadarCard
                latitude={order.latitude}
                longitude={order.longitude}
                accuracy={order.accuracy}
                address={order.address}
                district={order.district}
                referencePoint={order.referencePoint}
                clientName={order.clientName || client?.name || "Cliente KONEKTA"}
                clientPhone={client?.phone}
                orderTitle={order.service}
                isProviderView={isProvider}
              />
            </div>

            {/* AÇÃO ADICIONAL DE CALENDÁRIO */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() =>
                  downloadIcsCalendarFile({
                    id: order.id,
                    title: order.service,
                    description: order.notes || order.service,
                    location: order.address || order.district || "São Tomé",
                    dateStr: new Date().toISOString().split("T")[0],
                    timeStr: order.scheduledFor,
                    urgency: "media",
                    createdAt: order.createdAt || Date.now(),
                  })
                }
                className="w-full py-2.5 px-3 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
              >
                <Calendar size={14} className="text-primary" />
                <span>Sincronizar com a Agenda do Telemóvel (Google Calendar / iCal)</span>
              </button>
            </div>
          </KCard>

          {/* ================================================================= */}
          {/* SECÇÃO 4: RESUMO FINANCEIRO & RECIBO */}
          {/* ================================================================= */}
          <KCard className="border border-border shadow-soft space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <FileText size={14} className="text-primary" />
                <span>Resumo Financeiro & Liquidação</span>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiptOpen(true)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <FileText size={13} />
                Ver Recibo Digital
              </button>
            </div>

            <div className="space-y-2 text-xs divide-y divide-border/60">
              <div className="flex items-center justify-between pb-1.5">
                <span className="text-muted-foreground">Mão de Obra / Execução</span>
                <span className="font-bold">
                  {formatDb(order.breakdown?.labor || Math.round(order.total * 0.85))}
                </span>
              </div>

              {order.breakdown?.materials ? (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground">Materiais & Peças</span>
                  <span className="font-bold">{formatDb(order.breakdown.materials)}</span>
                </div>
              ) : null}

              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Taxa de Proteção KONEKTA Escrow (5%)</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  {formatDb(order.breakdown?.escrowFee || Math.round(order.total * 0.05))}{" "}
                  (Incluída)
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="font-black text-sm text-foreground">Total do Pedido</span>
                <span className="text-base font-black text-primary font-mono">
                  {formatDb(order.total)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-muted/40 p-3 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Método de Pagamento:</span>
              <span className="font-bold text-foreground uppercase">
                {order.paymentMethod === "dinheiro" ? "Dinheiro Seguro" : "Carteira KONEKTA"}
              </span>
            </div>
          </KCard>

          {/* ================================================================= */}
          {/* SECÇÃO 5: INTERVENIENTES & COMUNICAÇÃO NO CHAT */}
          {/* ================================================================= */}
          <KCard className="border border-border shadow-soft space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Intervenientes do Serviço
            </p>

            {/* SE FOR CLIENTE: VÊ O PROFISSIONAL E BOTÃO DE CHAT */}
            {!isProvider && provider && (
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={provider.image}
                    alt={provider.name}
                    className="size-12 rounded-2xl object-cover border border-border shrink-0 shadow-2xs"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-bold text-foreground">{provider.name}</p>
                      <UserCheck
                        size={14}
                        className="text-emerald-700 dark:text-emerald-400 shrink-0"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{provider.category}</p>
                    <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mt-0.5">
                      <Stars value={provider.rating} size={11} />
                      <span className="text-foreground">
                        {provider.rating} ({provider.reviews} avaliações)
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  to="/chat/$id"
                  params={{ id: provider.id }}
                  className="h-10 px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition border border-emerald-500/25 shrink-0"
                >
                  <MessageCircle size={15} />
                  <span>Falar no Chat</span>
                </Link>
              </div>
            )}

            {/* SE FOR PRESTADOR: VÊ O CLIENTE E BOTÃO DE CHAT */}
            {isProvider && (
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 grid place-items-center text-primary font-bold shrink-0">
                    <User size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">
                      {order.clientName || "Cliente KONEKTA"}
                    </p>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1">
                      <ShieldCheck size={12} /> Cliente Verificado STP
                    </p>
                  </div>
                </div>

                <Link
                  to="/chat/$id"
                  params={{ id: order.providerId }}
                  className="h-10 px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition border border-emerald-500/25 shrink-0"
                >
                  <MessageCircle size={15} />
                  <span>Falar no Chat</span>
                </Link>
              </div>
            )}

            {/* Botão de Avaliação se Concluído */}
            {!isProvider && (order.status === "concluido" || order.status === "avaliado") && (
              <button
                type="button"
                onClick={() => setIsReviewOpen(true)}
                className="w-full h-11 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-500/30 transition"
              >
                <Star size={15} className="fill-amber-500 text-amber-500" />
                {order.rating ? "Editar Avaliação do Serviço" : "Avaliar Profissional"}
              </button>
            )}

            {/* Botão de Disputa / Mediação */}
            {!isFinished && (
              <div className="pt-2 border-t border-border flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsDisputeOpen(true)}
                  className="text-xs font-bold text-muted-foreground hover:text-destructive flex items-center gap-1.5 transition"
                >
                  <ShieldAlert size={13} />
                  <span>Precisa de ajuda ou abrir disputa?</span>
                </button>
              </div>
            )}
          </KCard>
        </div>

        {/* MODAL / SHEET DE AVALIAÇÃO COM CHIPS & DUAL RATING */}
        {isReviewOpen && provider && (
          <ReviewAndPostServiceSheet
            isOpen={isReviewOpen}
            onClose={() => setIsReviewOpen(false)}
            orderId={order.id}
            providerId={provider.id}
            providerName={provider.name}
            serviceTitle={order.service}
            totalAmount={order.total}
          />
        )}

        {/* DRAWER DE DISPUTA / MEDIAÇÃO */}
        <DisputeDrawer
          isOpen={isDisputeOpen}
          onClose={() => setIsDisputeOpen(false)}
          orderId={order.id}
          clientId={user?.id || "client_me"}
          onDisputeOpened={() => {
            toast.info("A custódia deste pedido foi congelada para verificação.");
          }}
        />

        {/* MODAL DE COMPROVATIVO / RECIBO DIGITAL */}
        {isReceiptOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setIsReceiptOpen(false)}
          >
            <div
              className="w-full max-w-md bg-card rounded-3xl p-5 space-y-4 border border-border shadow-xl text-foreground animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-primary">
                    KONEKTA STP
                  </span>
                  <h3 className="text-base font-black text-foreground">
                    Comprovativo Digital de Serviço
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReceiptOpen(false)}
                  className="size-8 rounded-full bg-muted grid place-items-center text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Número do Pedido:</span>
                  <span className="font-bold">{order.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Serviço:</span>
                  <span className="font-bold">{order.service}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Profissional:</span>
                  <span className="font-bold">{provider?.name || "Prestador Verificado"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Agendado Para:</span>
                  <span className="font-medium">{order.scheduledFor}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Estado do Pagamento:</span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    {order.status === "concluido" || order.status === "avaliado"
                      ? "Liquidado ao Prestador"
                      : "Retido em Custódia Segura"}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 bg-muted/60 px-3.5 rounded-2xl">
                  <span className="font-bold">Total do Serviço:</span>
                  <span className="text-sm font-black text-primary font-mono">
                    {formatDb(order.total)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  toast.success("Comprovativo descarregado!");
                  setIsReceiptOpen(false);
                }}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:opacity-90 transition"
              >
                Descarregar Comprovativo em PDF
              </button>
            </div>
          </div>
        )}

        {/* LIGHTBOX DE FOTOGRAFIA */}
        {viewingPhoto && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xs animate-fadeIn"
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
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </AppShell>
    );
  }

  // =========================================================================
  // CASO 2: SE FOR UM PEDIDO ABERTO (SERVICE REQUEST COM PROPOSTAS)
  // =========================================================================
  if (request) {
    // SE FOR PRESTADOR: vê apenas a SUA PRÓPRIA proposta (NUNCA VÊ OUTROS PRESTADORES)
    // SE FOR CLIENTE: vê todas as propostas recebidas
    const userProposal = request.proposals.find(
      (p) => p.providerId === user?.id || p.providerId === "me",
    );
    const visibleProposals = isProvider
      ? userProposal
        ? [userProposal]
        : []
      : [...request.proposals].sort((a, b) => a.price - b.price);

    function accept() {
      if (!chosenProposal || !request) return;
      const createdOrder = store.acceptProposal(request.id, chosenProposal.id);
      setChosenProposal(null);
      if (createdOrder) {
        navigate({ to: "/pedido/$id", params: { id: createdOrder.id } });
      }
    }

    function handleSendProviderProposal() {
      if (!request || !proposalPrice) return;
      store.sendProposal(request.id, {
        price: Number(proposalPrice),
        message:
          proposalMessage.trim() || "Tenho disponibilidade imediata para executar o serviço.",
        availability: proposalAvailability,
      });
      setIsSubmittingProposal(false);
      setProposalPrice("");
      setProposalMessage("");
      toast.success("Proposta enviada com sucesso ao cliente!");
    }

    return (
      <AppShell hideFab>
        <ScreenHeader title={request.id} subtitle={request.categoryName} />

        <div className="max-w-2xl mx-auto space-y-4 p-4 pb-28 animate-fadeIn">
          {/* DETALHES DO PEDIDO ABERTO */}
          <KCard className="space-y-3 border border-border">
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 text-base font-bold tracking-tight">{request.title}</h2>
              <StatusPill tone={request.status === "aberto" ? "primary" : "success"}>
                {requestStatusLabel[request.status]}
              </StatusPill>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {request.description}
            </p>

            {/* Fotos Anexadas */}
            {request.photosList && request.photosList.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <ImageIcon size={14} className="text-primary" />
                  <span>Fotos da avaria ({request.photosList.length}):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {request.photosList.map((photoUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setViewingPhoto(photoUrl)}
                      className="relative size-20 rounded-2xl overflow-hidden border border-border bg-muted shadow-2xs group shrink-0 active:scale-95 transition cursor-pointer"
                      title="Ver fotografia em tamanho grande"
                    >
                      <img
                        src={photoUrl}
                        alt={`Foto ${idx + 1}`}
                        className="h-full w-full object-cover group-hover:scale-105 transition"
                      />
                      <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 py-0.5 text-[8px] font-semibold text-white">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-muted-foreground pt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                <MapPin size={12} /> {request.district}
              </span>
              {request.scheduleSummary ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1">
                  <Calendar size={12} /> {request.scheduleSummary}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                  <Clock size={12} /> {urgencyLabel[request.urgency]}
                </span>
              )}
              {request.materialStatus && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-2.5 py-1 font-bold">
                  {request.materialStatus === "tem_material"
                    ? "📦 Cliente tem material"
                    : request.materialStatus === "prestador_compra"
                      ? "🛒 Prestador compra peças"
                      : "🔍 Avaliar materiais no local"}
                </span>
              )}
              {request.budget ? (
                <span className="rounded-full bg-muted px-2.5 py-1">
                  Orçamento base: {formatDb(request.budget)}
                </span>
              ) : (
                <span className="rounded-full bg-primary/10 text-primary px-2.5 py-1 font-medium">
                  À espera de orçamentos
                </span>
              )}
              <span className="rounded-full bg-muted px-2.5 py-1">
                Publicado {timeAgo(request.createdAt)}
              </span>
            </div>

            {/* RADAR GPS & NAVEGAÇÃO TURNO-A-TURNO PARA O PEDIDO */}
            <div className="pt-2">
              <ClientGpsRadarCard
                latitude={request.latitude}
                longitude={request.longitude}
                accuracy={request.accuracy}
                address={request.address}
                district={request.district}
                referencePoint={request.reference}
                clientName={request.clientName || "Cliente KONEKTA"}
                orderTitle={request.title}
                isProviderView={isProvider}
              />
            </div>

            {/* Ações Rápidas de Agenda */}
            <div className="pt-2 border-t border-border flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  downloadIcsCalendarFile({
                    id: request.id,
                    title: request.title,
                    description: request.description,
                    location: request.district,
                    dateStr: new Date(request.createdAt).toISOString().split("T")[0],
                    timeStr: request.scheduleSummary || "09:00",
                    urgency: request.urgency,
                    createdAt: request.createdAt,
                  })
                }
                className="w-full py-2.5 px-3 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer shadow-2xs"
              >
                <Calendar size={14} className="text-primary" />
                <span>Sincronizar Data com a Agenda (iCal / Google Calendar)</span>
              </button>
            </div>
          </KCard>

          {/* ================================================================= */}
          {/* VISÃO DO PRESTADOR: ENVIO E ESTADO DA SUA PROPOSTA */}
          {/* ================================================================= */}
          {isProvider && (
            <Section title="A Minha Proposta para este Pedido">
              {userProposal ? (
                <KCard className="space-y-3 border-2 border-primary/30 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        Proposta Submetida
                      </p>
                      <p className="text-base font-black text-foreground mt-0.5">
                        {formatDb(userProposal.price)}
                      </p>
                    </div>
                    <StatusPill tone="primary">
                      {request.acceptedProposalId === userProposal.id
                        ? "Aceite pelo Cliente"
                        : "Aguardando Resposta"}
                    </StatusPill>
                  </div>
                  <p className="text-xs text-muted-foreground">{userProposal.message}</p>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Disponibilidade: {userProposal.availability}
                  </p>
                </KCard>
              ) : (
                <KCard className="space-y-3 border border-border">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">
                      Tem disponibilidade para este trabalho?
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Envie a sua proposta de preço e disponibilidade diretamente ao cliente.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsSubmittingProposal(true)}
                    className="w-full h-11 rounded-2xl bg-primary text-primary-foreground font-bold text-xs"
                  >
                    <Send size={15} /> Enviar Proposta de Orçamento
                  </Button>
                </KCard>
              )}
            </Section>
          )}

          {/* ================================================================= */}
          {/* VISÃO DO CLIENTE: TODAS AS PROPOSTAS RECEBIDAS DE PRESTADORES */}
          {/* ================================================================= */}
          {!isProvider && (
            <Section title={`Propostas Recebidas (${visibleProposals.length})`}>
              {visibleProposals.length === 0 ? (
                <EmptyState
                  icon={<Sparkles size={22} />}
                  title="À espera de propostas"
                  description="Os prestadores da categoria foram notificados. As propostas de prestadores verificados aparecem aqui em poucos minutos."
                />
              ) : (
                <div className="space-y-3">
                  {visibleProposals.map((p) => {
                    const provider = getProvider(p.providerId);
                    const accepted = request.acceptedProposalId === p.id;
                    return (
                      <KCard key={p.id} className="space-y-3 border border-border shadow-2xs">
                        <div className="flex items-center gap-3">
                          {provider ? (
                            <img
                              src={provider.image}
                              alt={p.providerName}
                              loading="lazy"
                              className="size-12 shrink-0 rounded-2xl object-cover"
                            />
                          ) : (
                            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-sm font-bold text-accent-foreground">
                              {p.providerName.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">{p.providerName}</p>
                            {provider && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Stars value={provider.rating} size={12} /> {provider.rating} (
                                {provider.reviews})
                              </span>
                            )}
                            <p className="text-[11px] text-muted-foreground">
                              Disponível: {p.availability}
                            </p>
                          </div>
                          <p className="shrink-0 text-base font-extrabold text-primary">
                            {formatDb(p.price)}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">{p.message}</p>
                        <div className="flex gap-2">
                          <Link
                            to="/chat/$id"
                            params={{ id: p.providerId }}
                            className="press flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-muted text-sm font-semibold"
                          >
                            <MessageCircle size={16} /> Falar no Chat
                          </Link>
                          <Button
                            className="h-11 flex-1 rounded-xl font-bold"
                            disabled={request.status !== "aberto"}
                            onClick={() => setChosenProposal(p)}
                          >
                            {accepted ? "Escolhido" : "Contratar"}
                          </Button>
                        </div>
                      </KCard>
                    );
                  })}
                </div>
              )}
            </Section>
          )}
        </div>

        {/* BOTTOM SHEET DO PRESTADOR PARA ENVIAR PROPOSTA */}
        <BottomSheet
          open={isSubmittingProposal}
          onClose={() => setIsSubmittingProposal(false)}
          title="Enviar Proposta"
          description={request.title}
        >
          <div className="space-y-3">
            <input
              value={proposalPrice}
              inputMode="numeric"
              onChange={(e) => setProposalPrice(e.target.value.replace(/\D/g, ""))}
              placeholder="Valor da proposta em Db"
              className="w-full rounded-2xl bg-muted/60 p-4 text-sm outline-none ring-primary/30 focus:ring-2"
            />
            <div className="flex gap-2">
              {["Hoje", "Amanhã", "Esta semana"].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setProposalAvailability(a)}
                  className={cn(
                    "press flex-1 rounded-xl px-3 py-2 text-xs font-semibold",
                    a === proposalAvailability
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
            <textarea
              value={proposalMessage}
              onChange={(e) => setProposalMessage(e.target.value)}
              rows={3}
              placeholder="Mensagem para o cliente (garantia, materiais incluídos...)"
              className="w-full rounded-2xl bg-muted/60 p-4 text-sm outline-none ring-primary/30 focus:ring-2"
            />
            <Button
              className="h-12 w-full rounded-2xl text-base font-bold"
              disabled={!proposalPrice}
              onClick={handleSendProviderProposal}
            >
              <Send size={16} /> Submeter Proposta
            </Button>
          </div>
        </BottomSheet>

        {/* BOTTOM SHEET DE CONFIRMAÇÃO DE CONTRATAÇÃO PELO CLIENTE */}
        <BottomSheet
          open={!!chosenProposal}
          onClose={() => setChosenProposal(null)}
          title={`Contratar ${chosenProposal?.providerName ?? ""}`}
          description="O valor fica retido com 100% de segurança pela KONEKTA e só é libertado após confirmar a conclusão pelo código."
        >
          <KCard className="bg-muted/60">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor acordado</span>
              <span className="font-extrabold">
                {chosenProposal ? formatDb(chosenProposal.price) : "—"}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Disponibilidade</span>
              <span className="font-semibold">{chosenProposal?.availability}</span>
            </div>
          </KCard>
          <Button className="h-12 w-full rounded-2xl text-base font-bold" onClick={accept}>
            Confirmar e Iniciar Serviço
          </Button>
        </BottomSheet>

        {/* MODAL LIGHTBOX */}
        {viewingPhoto && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xs animate-fadeIn"
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
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </AppShell>
    );
  }

  // =========================================================================
  // CASO 3: SE NÃO ENCONTRAR NENHUM
  // =========================================================================
  return (
    <AppShell hideFab>
      <ScreenHeader title="Pedido" />
      <Section>
        <EmptyState
          title="Pedido ou Serviço não encontrado"
          description="Este pedido já não está disponível ou foi concluído e arquivado."
          action={
            <Link
              to={isProvider ? "/pro/pedidos" : "/pedidos"}
              className="mt-2 text-sm font-semibold text-primary hover:underline"
            >
              Ver os meus pedidos
            </Link>
          }
        />
      </Section>
    </AppShell>
  );
}
