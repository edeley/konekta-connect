import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, CheckCircle2, ChevronRight, Lock, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Section, KCard, StatusPill, EmptyState } from "@/components/konekta/kit";
import { store, useStore } from "@/lib/store";
import { formatDb } from "@/lib/catalog";
import { orderStateMeta } from "@/lib/states";

export const Route = createFileRoute("/pro/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos recebidos · KONEKTA" },
      {
        name: "description",
        content: "Aceite, execute e conclua os pedidos dos seus clientes na KONEKTA.",
      },
      { property: "og:title", content: "Pedidos recebidos · KONEKTA" },
      { property: "og:description", content: "Gestão de pedidos do prestador KONEKTA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProOrders,
});

const tabs = [
  { key: "novos", label: "Novos" },
  { key: "ativos", label: "Ativos" },
  { key: "historico", label: "Histórico" },
] as const;

function ProOrders() {
  const orders = useStore((s) => s.orders);
  const profile = useStore((s) => s.providerProfile);
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab");
      if (t === "ativos" || t === "historico" || t === "novos") return t;
    }
    return "novos";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab");
      if (t === "ativos" || t === "historico" || t === "novos") {
        setTab(t);
      }
    }
  }, []);

  const filtered = orders.filter((o) =>
    tab === "novos"
      ? o.status === "pendente"
      : tab === "ativos"
        ? ["aceite", "a-caminho", "em-execucao"].includes(o.status)
        : ["concluido", "avaliado"].includes(o.status),
  );

  return (
    <AppShell roles={["prestador"]}>
      <header className="px-5 pb-2 pt-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Pedidos recebidos</h1>
        <p className="text-sm text-muted-foreground">
          Gestão de pedidos e comunicação direta durante a execução.
        </p>
      </header>

      <Section>
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`press min-h-10 flex-1 rounded-full px-3 text-xs font-semibold transition-colors ${
                tab === t.key
                  ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                  : "bg-card text-muted-foreground shadow-soft hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Section>

      <Section className="space-y-3 pb-10">
        {filtered.length === 0 ? (
          <EmptyState
            title="Sem pedidos nesta lista"
            description="Novos pedidos e serviços aparecem aqui em tempo real."
          />
        ) : (
          filtered.map((o) => {
            const meta = orderStateMeta[o.status];
            const isFinished = ["concluido", "avaliado"].includes(o.status);

            return (
              <KCard key={o.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{o.service}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.id} · {o.clientName ?? "Cliente"} · {o.scheduledFor}
                    </p>
                  </div>
                  <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                </div>

                <p className="text-xs text-muted-foreground">{meta.message}</p>

                {/* Preço e Ações */}
                <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Valor do Serviço:
                    </span>
                    <span className="text-base font-extrabold text-primary font-mono">
                      {formatDb(o.total)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to="/pedido/$id"
                      params={{ id: o.id }}
                      className="h-10 px-3 rounded-full bg-muted hover:bg-muted/80 text-foreground text-xs font-bold flex items-center gap-1 transition"
                    >
                      <span>Ver Detalhes</span>
                      <ChevronRight size={14} />
                    </Link>

                    {/* Botão de Chat Seguro: disponível apenas enquanto o pedido estiver ativo / em execução */}
                    {!isFinished ? (
                      <Link
                        to="/chat/$id"
                        params={{ id: o.providerId }}
                        className="h-10 px-3.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition border border-emerald-500/25"
                      >
                        <MessageCircle size={15} />
                        Falar no Chat
                      </Link>
                    ) : (
                      <span className="h-10 px-3 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold flex items-center gap-1.5">
                        <Lock size={12} />
                        Chat Encerrado
                      </span>
                    )}

                    {!isFinished &&
                      (o.status === "aguardando-codigo" ? (
                        <Link
                          to="/pedido/$id"
                          params={{ id: o.id }}
                          className="press min-h-10 rounded-full bg-amber-600 hover:bg-amber-700 px-4 text-xs font-bold text-white shadow-xs flex items-center gap-1.5"
                        >
                          <KeyRound size={14} />
                          <span>Inserir Código</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled={profile?.status !== "aprovado"}
                          onClick={() => {
                            if (o.status === "pendente") {
                              store.updateOrder(o.id, { status: "aceite" });
                              toast.success("Pedido aceite!");
                            } else if (o.status === "aceite") {
                              store.updateOrder(o.id, { status: "a-caminho" });
                              toast.success("A caminho do local!");
                            } else if (o.status === "a-caminho") {
                              store.startService(o.id);
                              toast.success("Serviço iniciado!");
                            } else if (o.status === "em-execucao") {
                              store.finishService(o.id);
                              toast.success(
                                "Trabalho marcado como terminado! Peça o código ao cliente.",
                              );
                            }
                          }}
                          className="press min-h-10 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground disabled:opacity-50 shadow-xs"
                        >
                          {o.status === "pendente" && "Aceitar"}
                          {o.status === "aceite" && "A Caminho"}
                          {o.status === "a-caminho" && "Iniciar"}
                          {o.status === "em-execucao" && "Terminar"}
                        </button>
                      ))}
                  </div>
                </div>
              </KCard>
            );
          })
        )}
      </Section>
    </AppShell>
  );
}
