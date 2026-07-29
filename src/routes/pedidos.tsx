import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, Plus, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Section, KCard, StatusPill, EmptyState, BottomSheet } from "@/components/konekta/kit";
import { Button } from "@/components/ui/button";
import { getProvider } from "@/lib/konekta-data";
import { useStore, store } from "@/lib/store";
import { orderStateMeta } from "@/lib/states";
import { formatDb } from "@/lib/catalog";
import { requestStatusLabel, timeAgo } from "@/lib/requests";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pedidos")({
  head: () => ({
    meta: [
      { title: "Meus Pedidos · KONEKTA" },
      {
        name: "description",
        content: "Acompanhe pedidos publicados, propostas recebidas e serviços em curso na KONEKTA.",
      },
      { property: "og:title", content: "Meus Pedidos · KONEKTA" },
      { property: "og:description", content: "Propostas, serviços em curso e histórico num só lugar." },
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
  const [rating, setRating] = useState<{ id: string; stars: number; comment: string } | null>(null);

  const active = orders.filter((o) => o.status !== "concluido" && o.status !== "avaliado");
  const history = orders.filter((o) => o.status === "concluido" || o.status === "avaliado");
  const openRequests = requests.filter((r) => r.status !== "fechado");

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Meus Pedidos</h1>
        <p className="text-sm text-muted-foreground">Propostas, serviços em curso e histórico</p>
      </header>

      <Section>
        <Link
          to="/novo-pedido"
          className="press flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft"
        >
          <Plus size={18} /> Publicar novo pedido
        </Link>
        <div className="mt-4 flex gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "press flex-1 rounded-full py-2 text-xs font-bold",
                tab === t ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground shadow-soft",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </Section>

      {tab === "Propostas" && (
        <Section>
          {openRequests.length === 0 ? (
            <EmptyState
              title="Ainda não publicou pedidos"
              description="Descreva o que precisa e receba propostas de vários prestadores."
              action={
                <Link to="/novo-pedido" className="mt-2 text-sm font-semibold text-primary">
                  Publicar pedido
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {openRequests.map((r) => (
                <Link key={r.id} to="/pedido/$id" params={{ id: r.id }} className="block">
                  <KCard>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-muted-foreground">
                          {r.id} · {timeAgo(r.createdAt)}
                        </p>
                        <p className="truncate text-sm font-bold">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.categoryName} · {r.district}
                        </p>
                      </div>
                      <StatusPill tone={r.status === "aberto" ? "primary" : "success"}>
                        {requestStatusLabel[r.status]}
                      </StatusPill>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
                      <span className="text-muted-foreground">Propostas recebidas</span>
                      <span className="font-extrabold text-primary">{r.proposals.length}</span>
                    </div>
                  </KCard>
                </Link>
              ))}
            </div>
          )}
        </Section>
      )}

      {(tab === "Ativos" || tab === "Histórico") && (
        <Section>
          {(tab === "Ativos" ? active : history).length === 0 ? (
            <EmptyState
              title={tab === "Ativos" ? "Sem serviços em curso" : "Sem histórico"}
              description="Quando contratar um prestador, o serviço aparece aqui."
            />
          ) : (
            <div className="space-y-3">
              {(tab === "Ativos" ? active : history).map((o) => {
                const p = getProvider(o.providerId);
                const meta = orderStateMeta[o.status];
                return (
                  <KCard key={o.id}>
                    <Link
                      to="/prestador/$id"
                      params={{ id: o.providerId }}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {p && (
                          <img
                            src={p.image}
                            alt={p.name}
                            loading="lazy"
                            className="size-12 shrink-0 rounded-2xl object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-muted-foreground">{o.id}</p>
                          <p className="truncate text-sm font-bold">{o.service}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {p?.name} · {o.scheduledFor}
                          </p>
                        </div>
                      </div>
                      <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                    </Link>

                    <p className="mt-2 text-xs text-muted-foreground">{meta.message}</p>

                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-extrabold">{formatDb(o.total)}</span>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Link
                        to="/chat/$id"
                        params={{ id: o.providerId }}
                        className="press flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-muted text-sm font-semibold"
                      >
                        <MessageCircle size={15} /> Mensagem
                      </Link>
                      {o.status === "concluido" && (
                        <Button
                          className="h-11 flex-1 rounded-xl font-bold"
                          onClick={() => setRating({ id: o.id, stars: 5, comment: "" })}
                        >
                          <Star size={15} /> Avaliar
                        </Button>
                      )}
                      {o.status === "avaliado" && o.rating && (
                        <span className="flex h-11 flex-1 items-center justify-center gap-1 rounded-xl bg-success/12 text-sm font-semibold text-success">
                          <Star size={15} className="fill-success" /> {o.rating.stars}/5
                        </span>
                      )}
                    </div>
                  </KCard>
                );
              })}
            </div>
          )}
        </Section>
      )}

      <BottomSheet
        open={!!rating}
        onClose={() => setRating(null)}
        title="Avaliar serviço"
        description="A sua avaliação ajuda outros clientes em São Tomé e Príncipe."
      >
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} estrelas`}
              onClick={() => setRating((r) => (r ? { ...r, stars: n } : r))}
            >
              <Star
                size={30}
                className={n <= (rating?.stars ?? 0) ? "fill-warning text-warning" : "text-border"}
              />
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          value={rating?.comment ?? ""}
          onChange={(e) => setRating((r) => (r ? { ...r, comment: e.target.value } : r))}
          placeholder="Comentário (opcional)"
          className="w-full rounded-2xl bg-muted/60 p-4 text-sm outline-none ring-primary/30 focus:ring-2"
        />
        <Button
          className="h-12 w-full rounded-2xl text-base font-bold"
          onClick={() => {
            if (!rating) return;
            store.rateOrder(rating.id, rating.stars, rating.comment || undefined);
            setRating(null);
          }}
        >
          Enviar avaliação
        </Button>
      </BottomSheet>
    </AppShell>
  );
}
