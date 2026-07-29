import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, MapPin, MessageCircle, Sparkles } from "lucide-react";
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
import { useStore, store } from "@/lib/store";
import { formatDb } from "@/lib/catalog";
import { getProvider } from "@/lib/konekta-data";
import { requestStatusLabel, timeAgo, urgencyLabel, type Proposal } from "@/lib/requests";

export const Route = createFileRoute("/pedido/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe do pedido · KONEKTA" },
      {
        name: "description",
        content: "Compare as propostas recebidas dos prestadores e escolha a melhor para o seu pedido.",
      },
      { property: "og:title", content: "Detalhe do pedido · KONEKTA" },
      { property: "og:description", content: "Compare propostas e contrate com segurança." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RequestDetail,
});

function RequestDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const request = useStore((s) => s.requests.find((r) => r.id === id));
  const [chosen, setChosen] = useState<Proposal | null>(null);

  if (!request) {
    return (
      <AppShell hideFab>
        <ScreenHeader title="Pedido" />
        <Section>
          <EmptyState
            title="Pedido não encontrado"
            description="Este pedido já não está disponível."
            action={
              <Link to="/pedidos" className="mt-2 text-sm font-semibold text-primary">
                Ver os meus pedidos
              </Link>
            }
          />
        </Section>
      </AppShell>
    );
  }

  const sorted = [...request.proposals].sort((a, b) => a.price - b.price);

  function accept() {
    if (!chosen || !request) return;
    const order = store.acceptProposal(request.id, chosen.id);
    setChosen(null);
    if (order) navigate({ to: "/pedidos" });
  }

  return (
    <AppShell hideFab>
      <ScreenHeader title={request.id} subtitle={request.categoryName} />

      <Section>
        <KCard className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 text-base font-bold tracking-tight">{request.title}</h2>
            <StatusPill tone={request.status === "aberto" ? "primary" : "success"}>
              {requestStatusLabel[request.status]}
            </StatusPill>
          </div>
          <p className="text-sm text-muted-foreground">{request.description}</p>
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
              <MapPin size={12} /> {request.district}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
              <Clock size={12} /> {urgencyLabel[request.urgency]}
            </span>
            {request.budget && (
              <span className="rounded-full bg-muted px-2.5 py-1">Orçamento {formatDb(request.budget)}</span>
            )}
            <span className="rounded-full bg-muted px-2.5 py-1">Publicado {timeAgo(request.createdAt)}</span>
          </div>
        </KCard>
      </Section>

      <Section title={`Propostas (${sorted.length})`}>
        {sorted.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={22} />}
            title="À espera de propostas"
            description="Os prestadores da categoria foram notificados. Normalmente as primeiras propostas chegam em poucos minutos."
          />
        ) : (
          <div className="space-y-3">
            {sorted.map((p) => {
              const provider = getProvider(p.providerId);
              const accepted = request.acceptedProposalId === p.id;
              return (
                <KCard key={p.id} className="space-y-3">
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
                          <Stars value={provider.rating} size={12} /> {provider.rating} ({provider.reviews})
                        </span>
                      )}
                      <p className="text-[11px] text-muted-foreground">Disponível: {p.availability}</p>
                    </div>
                    <p className="shrink-0 text-base font-extrabold text-primary">{formatDb(p.price)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.message}</p>
                  <div className="flex gap-2">
                    <Link
                      to="/chat/$id"
                      params={{ id: p.providerId }}
                      className="press flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-muted text-sm font-semibold"
                    >
                      <MessageCircle size={16} /> Falar
                    </Link>
                    <Button
                      className="h-11 flex-1 rounded-xl font-bold"
                      disabled={request.status !== "aberto"}
                      onClick={() => setChosen(p)}
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

      <BottomSheet
        open={!!chosen}
        onClose={() => setChosen(null)}
        title={`Contratar ${chosen?.providerName ?? ""}`}
        description="O valor fica retido pela KONEKTA e só é libertado após confirmar a conclusão."
      >
        <KCard className="bg-muted/60">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Valor acordado</span>
            <span className="font-extrabold">{chosen ? formatDb(chosen.price) : "—"}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Disponibilidade</span>
            <span className="font-semibold">{chosen?.availability}</span>
          </div>
        </KCard>
        <Button className="h-12 w-full rounded-2xl text-base font-bold" onClick={accept}>
          Confirmar e pagar pela carteira
        </Button>
      </BottomSheet>
    </AppShell>
  );
}
