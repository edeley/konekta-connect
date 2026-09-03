import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  MessageCircle,
  Plus,
  Star,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Phone,
  X,
  Send,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Section, KCard, StatusPill, EmptyState, BottomSheet } from "@/components/konekta/kit";
import { Button } from "@/components/ui/button";
import { getProvider } from "@/lib/konekta-data";
import { useStore, store, type Order } from "@/lib/store";
import { orderStateMeta } from "@/lib/states";
import { formatDb } from "@/lib/catalog";
import { requestStatusLabel, timeAgo } from "@/lib/requests";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ReviewModal } from "@/components/konekta/ReviewModal";
import { CancelServiceModal } from "@/components/konekta/CancelServiceModal";
import { openNativeMap } from "@/lib/sync-manager";

export const Route = createFileRoute("/pedidos")({
  head: () => ({
    meta: [
      { title: "Meus Pedidos · KONEKTA STP" },
      {
        name: "description",
        content:
          "Acompanhe pedidos publicados, propostas recebidas e serviços em curso na KONEKTA.",
      },
      { property: "og:title", content: "Meus Pedidos · KONEKTA" },
      {
        property: "og:description",
        content: "Propostas, serviços em curso e histórico num só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrdersPage,
});

const tabs = ["Propostas", "Ativos", "Histórico"] as const;
type Tab = (typeof tabs)[number];

function OrdersPage() {
  const orders = useStore((s) => s.orders);
  const requests = useStore((s) => s.requests);
  const [tab, setTab] = useState<Tab>("Propostas");
  const [evaluatingOrder, setEvaluatingOrder] = useState<Order | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [disputeOrder, setDisputeOrder] = useState<Order | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const active = orders.filter(
    (o) => o.status !== "concluido" && o.status !== "avaliado" && o.status !== "cancelado",
  );
  const history = orders.filter(
    (o) => o.status === "concluido" || o.status === "avaliado" || o.status === "cancelado",
  );
  const openRequests = requests.filter((r) => r.status !== "fechado");

  function handleReleasePayment(order: Order) {
    store.updateOrder(order.id, { status: "concluido" });
    const net = store.addEarning(`Serviço ${order.id} - ${order.service}`, order.total);
    toast.success("Pagamento liberado com sucesso!", {
      description: `${formatDb(order.total)} transferidos da custódia para o prestador.`,
    });
  }

  function handleSendDispute() {
    if (!disputeOrder || !disputeReason.trim()) return;
    toast.success("Solicitação de mediação enviada à equipa KONEKTA", {
      description: "Um mediador entrará em contacto consigo e com o prestador em até 2h.",
    });
    setDisputeOrder(null);
    setDisputeReason("");
  }

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Meus Pedidos</h1>
        <p className="text-xs text-muted-foreground font-medium">
          Propostas recebidas, serviços em execução e histórico
        </p>
      </header>

      <Section>
        <Link
          to="/novo-pedido"
          className="press flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-bold text-primary-foreground shadow-xs active:scale-98 transition-all"
        >
          <Plus size={16} /> Publicar Novo Pedido Aberto
        </Link>
        <div className="mt-3.5 flex gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "press flex-1 rounded-full py-2.5 text-xs font-bold transition-all border",
                tab === t
                  ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                  : "bg-card text-muted-foreground border-border hover:bg-muted",
              )}
            >
              {t} {t === "Propostas" && openRequests.length > 0 && `(${openRequests.length})`}
              {t === "Ativos" && active.length > 0 && `(${active.length})`}
            </button>
          ))}
        </div>
      </Section>

      {tab === "Propostas" && (
        <Section>
          {openRequests.length === 0 ? (
            <EmptyState
              title="Ainda não publicou pedidos abertos"
              description="Descreva o problema e receba propostas detalhadas de vários prestadores verificados em STP."
              action={
                <Link
                  to="/novo-pedido"
                  className="mt-2 inline-block px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold"
                >
                  Publicar pedido agora
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {openRequests.map((r) => {
                if (r.isDirect && r.directProviderId) {
                  return (
                    <Link
                      key={r.id}
                      to="/chat/$id"
                      params={{ id: r.directProviderId }}
                      className="block"
                    >
                      <KCard className="border border-border/80 shadow-2xs hover:border-primary/50 transition-all">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                              <span>🔒 Orçamento Privado</span> · {timeAgo(r.createdAt)}
                            </p>
                            <p className="truncate text-sm font-bold text-foreground mt-0.5">
                              {r.title}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium">
                              Com {r.directProviderName || "Prestador"} · {r.district}
                            </p>
                          </div>
                          <StatusPill tone="success">Chat Ativo</StatusPill>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
                          <span className="text-muted-foreground font-medium">
                            Proposta & Detalhes
                          </span>
                          <span className="font-bold text-primary flex items-center gap-1">
                            <MessageCircle size={14} /> Abrir Conversa
                          </span>
                        </div>
                      </KCard>
                    </Link>
                  );
                }

                return (
                  <Link key={r.id} to="/pedido/$id" params={{ id: r.id }} className="block">
                    <KCard className="border border-border/80 shadow-2xs hover:border-primary/50 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-muted-foreground">
                            {r.id} · {timeAgo(r.createdAt)}
                          </p>
                          <p className="truncate text-sm font-bold text-foreground mt-0.5">
                            {r.title}
                          </p>
                          <p className="text-xs text-muted-foreground font-medium">
                            {r.categoryName} · {r.district}
                          </p>
                        </div>
                        <StatusPill tone={r.status === "aberto" ? "primary" : "success"}>
                          {requestStatusLabel[r.status]}
                        </StatusPill>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
                        <span className="text-muted-foreground font-medium">
                          Propostas recebidas
                        </span>
                        <span className="font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {r.proposals.length} proposta{r.proposals.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </KCard>
                  </Link>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {(tab === "Ativos" || tab === "Histórico") && (
        <Section>
          {(tab === "Ativos" ? active : history).length === 0 ? (
            <EmptyState
              title={tab === "Ativos" ? "Sem serviços em curso" : "Sem histórico de pedidos"}
              description="Quando contratar um prestador, o progresso em tempo real e comprovativo aparecem aqui."
            />
          ) : (
            <div className="space-y-3.5">
              {(tab === "Ativos" ? active : history).map((o) => {
                const p = getProvider(o.providerId);
                const meta = orderStateMeta[o.status];
                return (
                  <KCard key={o.id} className="border border-border/80 shadow-2xs space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {p && (
                          <img
                            src={p.image}
                            alt={p.name}
                            loading="lazy"
                            className="size-12 shrink-0 rounded-2xl object-cover border border-border"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-muted-foreground">{o.id}</p>
                          <p className="truncate text-sm font-bold text-foreground">{o.service}</p>
                          <p className="truncate text-xs text-muted-foreground font-medium">
                            {p?.name ?? o.clientName ?? "Prestador"} · {o.scheduledFor}
                          </p>
                        </div>
                      </div>
                      <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                    </div>

                    {/* Barra de Progresso Realista */}
                    <div className="p-3 rounded-2xl bg-muted/50 border border-border/60 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <ShieldCheck
                            size={14}
                            className="text-emerald-700 dark:text-emerald-400"
                          />
                          Pagamento Protegido em Custódia
                        </span>
                        <span className="font-black text-primary">{formatDb(o.total)}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{meta.message}</p>

                      {/* Atalho do Mapa e Proteção */}
                      <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-border/40">
                        <button
                          type="button"
                          onClick={() =>
                            openNativeMap({
                              district: o.district || o.location || "São Tomé",
                              title: o.service,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-foreground text-[10px] font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                          title="Abrir localização no Mapa"
                        >
                          <span>📍</span> Ver no Mapa
                        </button>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Comunicação interna 100% segura
                        </span>
                      </div>

                      {/* Código de Conclusão OTP para o Cliente */}
                      {(o.status === "em-execucao" || o.status === "aguardando-codigo") && (
                        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-between gap-2">
                          <div className="text-[11px] font-bold text-foreground">
                            <span className="text-primary block text-[9px] uppercase tracking-wider">
                              Código de Conclusão:
                            </span>
                            Dê este código ao prestador ao terminar
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-card border border-primary/30 font-mono font-black text-sm text-primary tracking-widest">
                            {o.completionCode || "5821"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação para o Cliente */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Link
                        to="/pedido/$id"
                        params={{ id: o.id }}
                        className="press flex h-10 px-3 items-center justify-center gap-1 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition"
                      >
                        <span>Ver Detalhes</span>
                        <ChevronRight size={14} />
                      </Link>

                      <Link
                        to="/chat/$id"
                        params={{ id: o.providerId }}
                        className="press flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted"
                      >
                        <MessageCircle size={14} /> Falar no Chat
                      </Link>

                      {tab === "Ativos" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReleasePayment(o)}
                            className="press flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-2xs hover:bg-emerald-700"
                          >
                            <CheckCircle2 size={14} /> Concluir & Liberar
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancellingOrder(o)}
                            className="press h-10 px-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold flex items-center gap-1 transition"
                            title="Cancelar Serviço com Aviso de Riscos"
                          >
                            <X size={14} /> Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDisputeOrder(o)}
                            className="press h-10 px-3 rounded-xl bg-muted text-muted-foreground hover:text-destructive text-xs font-medium"
                            title="Pedir Apoio ou Mediação"
                          >
                            <AlertTriangle size={14} />
                          </button>
                        </>
                      )}

                      {o.status === "concluido" && (
                        <Button
                          className="h-10 flex-1 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-2xs gap-1.5"
                          onClick={() => setEvaluatingOrder(o)}
                        >
                          <Star size={14} className="fill-amber-400 text-amber-400" /> Avaliar &
                          Comentar
                        </Button>
                      )}

                      {o.status === "avaliado" && o.rating && (
                        <button
                          type="button"
                          onClick={() => setEvaluatingOrder(o)}
                          className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-bold text-emerald-800 dark:text-emerald-300 transition-colors"
                          title="Clique para ver ou atualizar a avaliação"
                        >
                          <Star size={14} className="fill-amber-500 text-amber-500" />{" "}
                          {o.rating.stars}/5 Avaliado
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setReceiptOrder(o)}
                        className="h-10 px-3 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground text-xs font-bold flex items-center gap-1"
                        title="Ver Comprovativo Digital"
                      >
                        <FileText size={14} /> Recibo
                      </button>
                    </div>
                  </KCard>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {/* Modal Completo de Avaliação e Comentário */}
      {evaluatingOrder && (
        <ReviewModal
          open={!!evaluatingOrder}
          onClose={() => setEvaluatingOrder(null)}
          providerId={evaluatingOrder.providerId}
          providerName={getProvider(evaluatingOrder.providerId)?.name || "Prestador"}
          providerImage={getProvider(evaluatingOrder.providerId)?.image}
          providerCategory={getProvider(evaluatingOrder.providerId)?.category}
          orderId={evaluatingOrder.id}
          serviceName={evaluatingOrder.service}
          initialRating={evaluatingOrder.rating?.stars ?? 5}
          initialComment={evaluatingOrder.rating?.comment ?? ""}
        />
      )}

      {/* Modal de Cancelamento de Serviço com Aviso de Riscos */}
      {cancellingOrder && (
        <CancelServiceModal
          open={!!cancellingOrder}
          onClose={() => setCancellingOrder(null)}
          order={cancellingOrder}
          onCancelled={() => setCancellingOrder(null)}
        />
      )}

      {/* Modal de Solicitação de Mediação */}
      {disputeOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDisputeOrder(null)}
        >
          <div
            className="w-full max-w-md bg-card rounded-3xl p-5 space-y-4 border border-border shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                  <AlertTriangle className="text-amber-500" size={18} />
                  Mediação & Apoio KONEKTA
                </h3>
                <p className="text-xs text-muted-foreground">Pedido {disputeOrder.id}</p>
              </div>
              <button
                onClick={() => setDisputeOrder(null)}
                className="size-8 rounded-full bg-muted grid place-items-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Teve algum atraso, falta de comparência ou problema com o serviço? Enquanto o caso
              estiver em análise pela nossa equipa,{" "}
              <strong>o valor em custódia não será transferido</strong>.
            </p>

            <textarea
              rows={4}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Descreva detalhadamente o motivo da sua solicitação..."
              className="w-full rounded-2xl bg-card border border-border p-3 text-xs outline-none focus:border-primary"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDisputeOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-muted text-xs font-bold text-muted-foreground"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!disputeReason.trim()}
                onClick={handleSendDispute}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
              >
                Enviar Solicitação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comprovativo Digital */}
      {receiptOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setReceiptOrder(null)}
        >
          <div
            className="w-full max-w-md bg-card rounded-3xl p-5 space-y-4 border border-border shadow-xl text-foreground"
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
                onClick={() => setReceiptOrder(null)}
                className="size-8 rounded-full bg-muted grid place-items-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground">Número do Pedido:</span>
                <span className="font-bold">{receiptOrder.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground">Serviço:</span>
                <span className="font-bold">{receiptOrder.service}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground">Agendado Para:</span>
                <span className="font-medium">{receiptOrder.scheduledFor}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground">Estado do Pagamento:</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  {receiptOrder.status === "concluido" || receiptOrder.status === "avaliado"
                    ? "Liquidado ao Prestador"
                    : "Retido em Custódia Segura"}
                </span>
              </div>
              <div className="flex justify-between py-2 bg-muted/60 px-3 rounded-xl">
                <span className="font-bold">Total do Serviço:</span>
                <span className="text-sm font-black text-primary">
                  {formatDb(receiptOrder.total)}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
              Emitido eletronicamente pela KONEKTA São Tomé e Príncipe · NIF 500123456
            </p>

            <button
              type="button"
              onClick={() => {
                toast.success("Comprovativo descarregado com sucesso.");
                setReceiptOrder(null);
              }}
              className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-bold text-xs"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
