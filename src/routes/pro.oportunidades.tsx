import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock, MapPin, Search, Send, Calendar } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Section, KCard, StatusPill, EmptyState, BottomSheet } from "@/components/konekta/kit";
import { Button } from "@/components/ui/button";
import { useStore, store } from "@/lib/store";
import { formatDb } from "@/lib/catalog";
import { timeAgo, urgencyLabel, type ServiceRequest } from "@/lib/requests";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pro/oportunidades")({
  head: () => ({
    meta: [
      { title: "Oportunidades · KONEKTA Prestador" },
      {
        name: "description",
        content:
          "Veja pedidos abertos de clientes em São Tomé e Príncipe e envie a sua proposta em segundos.",
      },
      { property: "og:title", content: "Oportunidades · KONEKTA Prestador" },
      { property: "og:description", content: "Pedidos abertos à espera da sua proposta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Leads,
});

function Leads() {
  const requests = useStore((s) => s.requests);
  const profile = useStore((s) => s.providerProfile);
  const userId = useStore((s) => s.user?.id);
  const [query, setQuery] = useState("");
  const [onlyMine, setOnlyMine] = useState(true);
  const [target, setTarget] = useState<ServiceRequest | null>(null);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [availability, setAvailability] = useState("Hoje");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests
      .filter((r) => r.status === "aberto" && !r.isDirect)
      .filter((r) => !onlyMine || !profile?.category || r.categoryName === profile.category)
      .filter(
        (r) =>
          !q ||
          r.title.toLowerCase().includes(q) ||
          r.categoryName.toLowerCase().includes(q) ||
          r.district.toLowerCase().includes(q),
      );
  }, [requests, query, onlyMine, profile?.category]);

  function submit() {
    if (!target || !price) return;
    store.sendProposal(target.id, {
      price: Number(price),
      message: message.trim() || "Tenho disponibilidade para este trabalho.",
      availability,
    });
    setTarget(null);
    setPrice("");
    setMessage("");
  }

  return (
    <AppShell roles={["prestador"]} hideFab>
      <header className="px-5 pb-2 pt-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Oportunidades</h1>
        <p className="text-sm text-muted-foreground">Pedidos abertos à espera de propostas</p>
      </header>

      <Section>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Procurar por serviço ou distrito"
            className="w-full rounded-2xl bg-card py-3.5 pl-10 pr-4 text-sm shadow-soft outline-none ring-primary/30 focus:ring-2"
          />
        </div>
        {profile?.category && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setOnlyMine(true)}
              className={cn(
                "press rounded-full px-3 py-1.5 text-xs font-semibold",
                onlyMine ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {profile.category}
            </button>
            <button
              type="button"
              onClick={() => setOnlyMine(false)}
              className={cn(
                "press rounded-full px-3 py-1.5 text-xs font-semibold",
                !onlyMine ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              Todas as categorias
            </button>
          </div>
        )}
      </Section>

      <Section title={`${list.length} pedido(s) disponível(is)`}>
        {list.length === 0 ? (
          <EmptyState
            title="Sem oportunidades agora"
            description="Assim que um cliente publicar um pedido na sua categoria, aparece aqui."
          />
        ) : (
          <div className="space-y-3">
            {list.map((r) => {
              const alreadySent = r.proposals.some((p) => p.providerId === userId);
              return (
                <KCard key={r.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {r.categoryName} · {r.clientName} · {timeAgo(r.createdAt)}
                      </p>
                    </div>
                    <StatusPill tone={r.urgency === "urgente" ? "warning" : "neutral"}>
                      {urgencyLabel[r.urgency]}
                    </StatusPill>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                      <MapPin size={12} /> {r.district}
                    </span>
                    {r.scheduleSummary ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1">
                        <Calendar size={12} /> {r.scheduleSummary}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <Clock size={12} /> {r.proposals.length} proposta(s)
                      </span>
                    )}
                    {r.budget ? (
                      <span className="rounded-full bg-muted px-2.5 py-1">
                        Base: {formatDb(r.budget)}
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2.5 py-1">
                        {r.proposals.length} proposta(s)
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to="/pedido/$id"
                      params={{ id: r.id }}
                      className="press flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-muted text-xs font-bold text-foreground hover:bg-muted/80 transition"
                    >
                      Ver Detalhes
                    </Link>
                    <Button
                      className="h-11 flex-1 rounded-xl font-bold text-xs"
                      disabled={alreadySent}
                      onClick={() => {
                        setTarget(r);
                        setPrice(r.budget ? String(r.budget) : "");
                      }}
                    >
                      {alreadySent ? "Proposta enviada" : "Enviar proposta"}
                    </Button>
                  </div>
                </KCard>
              );
            })}
          </div>
        )}
      </Section>

      <BottomSheet
        open={!!target}
        onClose={() => setTarget(null)}
        title="Enviar proposta"
        description={target?.title}
      >
        <input
          value={price}
          inputMode="numeric"
          onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
          placeholder="Valor da proposta em Db"
          className="w-full rounded-2xl bg-muted/60 p-4 text-sm outline-none ring-primary/30 focus:ring-2"
        />
        <div className="flex gap-2">
          {["Hoje", "Amanhã", "Esta semana"].map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAvailability(a)}
              className={cn(
                "press flex-1 rounded-xl px-3 py-2 text-xs font-semibold",
                a === availability
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {a}
            </button>
          ))}
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Mensagem para o cliente (o que inclui, garantia, material...)"
          className="w-full rounded-2xl bg-muted/60 p-4 text-sm outline-none ring-primary/30 focus:ring-2"
        />
        <Button
          className="h-12 w-full rounded-2xl text-base font-bold"
          disabled={!price}
          onClick={submit}
        >
          <Send size={16} /> Enviar proposta
        </Button>
      </BottomSheet>
    </AppShell>
  );
}
