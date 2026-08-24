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
  Sparkles,
} from "lucide-react";
import { getProvider } from "@/lib/konekta-data";
import { store, useStore, type Quote, type TechnicalVisit } from "@/lib/store";
import { realtimeBus } from "@/lib/realtime";
import { AuthGate } from "@/components/AuthGate";
import { QuoteCard } from "@/components/konekta/QuoteCard";
import { QuoteComposer } from "@/components/konekta/QuoteComposer";
import { ReviewModal } from "@/components/konekta/ReviewModal";
import { BottomSheet } from "@/components/konekta/kit";
import { formatDb } from "@/lib/catalog";
import { analyzeBlockedContent, containsBlockedContent } from "@/lib/escrow";
import { openNativeMap, downloadIcsCalendarFile } from "@/lib/sync-manager";
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
  const router = useRouter();
  const [text, setText] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [reviewQuote, setReviewQuote] = useState<Quote | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(realtimeBus.getTyping(id));
  const scrollRef = useRef<HTMLDivElement>(null);

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
  const [submittingVisit, setSubmittingVisit] = useState(false);

  // Diagnostic Report modal for Pro after on-site inspection
  const [diagnosticModalOpen, setDiagnosticModalOpen] = useState(false);
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null);
  const [diagnosticText, setDiagnosticText] = useState("");
  const [proposedQuoteAmount, setProposedQuoteAmount] = useState("");

  const activeTechnicalVisit = technicalVisits.find(
    (v) => v.providerId === id && v.status !== "cancelado",
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
        (m) => m.quote && (m.quote.status === "pago" || m.quote.status === "concluido"),
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
    const fee = config.technicalVisitFee || 150;

    setSubmittingVisit(true);
    setTimeout(() => {
      const res = store.proposeTechnicalVisit({
        providerId: id,
        providerName: provider?.name || "Prestador KONEKTA",
        serviceTitle: visitReason.trim() || "Avaliação técnica no terreno para orçamento",
        district: visitDistrict,
        address: visitAddress.trim(),
        scheduledDate: visitDate,
        scheduledTime: visitTime,
        visitFee: fee,
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
          </header>

          {/* Banner de Proteção e Anti-Bypass Rigoroso */}
          <div className="px-4 mt-3 space-y-2">
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
                  O valor pago encontra-se em custódia segura. A libertação do montante ao prestador
                  é feita exclusivamente após a conclusão satisfatória do serviço.
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

            {/* Card de Visita Técnica no Terreno (Uber STP) */}
            {activeTechnicalVisit && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Car size={14} /> Visita Técnica no Terreno
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200">
                    {activeTechnicalVisit.status === "pendente"
                      ? "⏳ Proposta Pendente"
                      : activeTechnicalVisit.status === "aceite"
                        ? "✅ Visita Confirmada"
                        : activeTechnicalVisit.status === "a_caminho"
                          ? "🚗 Técnico a Caminho"
                          : "🏁 Concluída"}
                  </span>
                </div>

                <p className="text-[11px] text-foreground/80">
                  <strong>{activeTechnicalVisit.serviceTitle}</strong> ·{" "}
                  {activeTechnicalVisit.scheduledDate} às {activeTechnicalVisit.scheduledTime}
                </p>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-500/20">
                  <span className="text-muted-foreground">Taxa de deslocação (custódia):</span>
                  <strong className="text-emerald-800 dark:text-emerald-300 font-bold">
                    {formatDb(activeTechnicalVisit.visitFee)}
                  </strong>
                </div>

                {/* Ações do Cliente quando a proposta está pendente */}
                {isClient && activeTechnicalVisit.status === "pendente" && (
                  <div className="pt-2 space-y-1.5">
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      O profissional propôs uma visita presencial para inspecionar o local e fazer
                      um orçamento exato.
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
                {!isClient && activeTechnicalVisit.status !== "concluido" && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {activeTechnicalVisit.status === "pendente" && (
                      <p className="col-span-2 text-[11px] text-muted-foreground italic text-center py-1">
                        Aguardando confirmação e bloqueio da taxa pelo cliente...
                      </p>
                    )}
                    {activeTechnicalVisit.status === "aceite" && (
                      <button
                        type="button"
                        onClick={() => store.startTechnicalVisit(activeTechnicalVisit.id)}
                        className="py-2.5 rounded-xl bg-amber-600 text-white font-bold text-[11px] col-span-2 flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                      >
                        <Car size={13} /> Iniciar Deslocação (A Caminho - Uber STP)
                      </button>
                    )}
                    {activeTechnicalVisit.status === "a_caminho" && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveVisitId(activeTechnicalVisit.id);
                          setDiagnosticModalOpen(true);
                        }}
                        className="py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-[11px] col-span-2 flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                      >
                        <Check size={13} /> Concluir Diagnóstico & Emitir Orçamento
                      </button>
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
                        const ok = store.payQuote(id, m.quote!.id);
                        toast[ok ? "success" : "error"](
                          ok ? "Pagamento retido em custódia segura" : "Saldo insuficiente",
                        );
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
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setComposerOpen(true)}
                      className="press flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-accent text-xs font-semibold text-accent-foreground hover:bg-accent/80 transition cursor-pointer"
                      title="Enviar orçamento diretamente caso fotos e dados bastem"
                    >
                      <Tag size={13} className="text-primary" /> Orçamento Direto
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisitModalOpen(true)}
                      className="press flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-900 dark:text-amber-200 hover:bg-amber-500/25 transition cursor-pointer"
                      title="Propor visita técnica no terreno para avaliar antes de orçar"
                    >
                      <Car size={13} /> Propor Visita
                    </button>
                  </div>
                )}

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

                <form onSubmit={handleSend} className="flex gap-2">
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
                    className="size-11 rounded-xl bg-primary text-primary-foreground grid place-items-center disabled:opacity-40 cursor-pointer"
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

      {/* Modal de Avaliação pós-serviço no Chat */}
      {reviewQuote && (
        <ReviewModal
          open={!!reviewQuote}
          onClose={() => setReviewQuote(null)}
          providerId={id}
          providerName={provider.name}
          providerImage={provider.image}
          providerCategory={provider.category}
          serviceName={reviewQuote.title}
        />
      )}
    </AuthGate>
  );
}
