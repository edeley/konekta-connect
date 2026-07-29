import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, MapPin, Plus, Search, Star, Truck, Heart } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { categories, providers, getProvider, statusLabel } from "@/lib/konekta-data";
import { store, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KONEKTA — Serviços em São Tomé e Príncipe" },
      {
        name: "description",
        content:
          "Encontre eletricistas, canalizadores, limpeza e mais profissionais de confiança em São Tomé e Príncipe. Pagamento protegido pela plataforma.",
      },
      { property: "og:title", content: "KONEKTA — Serviços em São Tomé e Príncipe" },
      {
        property: "og:description",
        content: "Plataforma segura para contratar profissionais em São Tomé e Príncipe.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Home,
});

const tintClass = {
  cocoa: "bg-cocoa/10 text-cocoa",
  ocean: "bg-ocean/10 text-ocean",
  sun: "bg-sun/15 text-sun",
  terracotta: "bg-terracotta/10 text-terracotta",
} as const;

function Home() {
  const user = useStore((s) => s.user);
  const orders = useStore((s) => s.orders);
  const favorites = useStore((s) => s.favorites);
  const unread = useStore((s) => s.notifications.filter((n) => !n.read).length);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const activeOrder = orders.find((o) => o.status === "a-caminho" || o.status === "em-execucao" || o.status === "aceite");
  const activeProvider = activeOrder ? getProvider(activeOrder.providerId) : undefined;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return providers.filter((p) => {
      if (activeCat && p.category.toLowerCase() !== activeCat.toLowerCase()) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.services.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [query, activeCat]);

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <AppShell>
      <header className="pt-6 pb-4 px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-ocean" />
            <span className="text-sm font-medium text-muted-foreground">São Tomé, STP</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/favoritos"
              className="grid size-9 place-items-center rounded-full bg-card ring-1 ring-border"
              aria-label="Favoritos"
            >
              <Heart size={16} className="text-foreground" />
            </Link>
            <Link
              to="/notificacoes"
              className="relative grid size-9 place-items-center rounded-full bg-card ring-1 ring-border"
              aria-label="Notificações"
            >
              <Bell size={16} className="text-foreground" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-terracotta ring-2 ring-card" />
              )}
            </Link>
          </div>
        </div>

        <div>
          {firstName && (
            <p className="text-xs text-muted-foreground">Olá, {firstName} 👋</p>
          )}
          <h1 className="text-2xl font-semibold leading-tight text-foreground text-balance mt-1">
            Encontre o profissional certo para hoje
          </h1>
        </div>

        <Link
          to="/novo-pedido"
          className="press flex items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-soft"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-foreground/15">
            <Plus size={20} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold">Publicar um pedido</span>
            <span className="block text-xs text-primary-foreground/80">
              Receba propostas grátis de vários prestadores
            </span>
          </span>
        </Link>

      </header>

      <section className="px-4 sticky top-0 z-10 bg-surface/85 backdrop-blur-md py-2">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Procurar serviços..."
            className="w-full py-3 pl-10 pr-4 bg-card ring-1 ring-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-terracotta/40 transition"
          />
        </div>
      </section>

      {activeOrder && activeProvider ? (
        <section className="mt-4 px-4">
          <Link
            to="/pedidos"
            className="block bg-cocoa text-primary-foreground rounded-2xl p-4 relative overflow-hidden"
          >
            <div className="absolute -top-8 -right-8 size-32 bg-terracotta/30 blur-3xl rounded-full" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-primary-foreground/60">
                  {statusLabel[activeOrder.status]}
                </p>
                <p className="text-base font-semibold mt-1">{activeOrder.service}</p>
                <p className="text-xs text-primary-foreground/70 mt-0.5">
                  {activeProvider.name} · {activeOrder.scheduledFor}
                </p>
              </div>
              <div className="size-10 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                <Truck size={18} />
              </div>
            </div>
          </Link>
        </section>
      ) : null}

      <section className="mt-6">
        <div className="flex overflow-x-auto gap-2 px-4 no-scrollbar">
          <button
            onClick={() => setActiveCat(null)}
            className={`flex-shrink-0 py-2 px-4 rounded-full text-sm font-medium ring-1 transition ${
              activeCat === null
                ? "bg-cocoa text-primary-foreground ring-transparent"
                : "bg-card text-foreground ring-border"
            }`}
          >
            Todos
          </button>
          {categories.map((c) => {
            const active = activeCat === c.name;
            return (
              <button
                key={c.slug}
                onClick={() => setActiveCat(active ? null : c.name)}
                className={`flex-shrink-0 flex items-center gap-2 py-2 pr-3 pl-2 rounded-full text-sm font-medium ring-1 transition ${
                  active
                    ? "bg-cocoa text-primary-foreground ring-transparent"
                    : "bg-card text-foreground ring-border"
                }`}
              >
                <span className={`size-5 rounded-full ${active ? "bg-primary-foreground/20" : tintClass[c.tint]}`} />
                {c.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8 px-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {activeCat ? activeCat : "Prestadores em Destaque"}
          </h2>
          <span className="text-xs text-muted-foreground">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {filtered.length === 0 && (
          <div className="bg-card ring-1 ring-border rounded-2xl p-8 text-center">
            <p className="text-sm font-medium">Sem resultados</p>
            <p className="text-xs text-muted-foreground mt-1">Tente outra pesquisa ou categoria.</p>
          </div>
        )}

        {filtered.map((p) => {
          const isFav = favorites.includes(p.id);
          return (
            <Link
              key={p.id}
              to="/prestador/$id"
              params={{ id: p.id }}
              className="block bg-card rounded-2xl p-3 ring-1 ring-border space-y-3 relative"
            >
              <div className="relative">
                <img
                  src={p.image}
                  alt={p.name}
                  width={800}
                  height={600}
                  loading="lazy"
                  className="w-full aspect-video object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    store.toggleFavorite(p.id);
                  }}
                  className="absolute top-2 right-2 size-9 rounded-full bg-card/90 backdrop-blur grid place-items-center ring-1 ring-border"
                  aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  <Heart size={16} className={isFav ? "fill-terracotta text-terracotta" : "text-foreground"} />
                </button>
              </div>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-ocean uppercase tracking-wider">
                    {p.category}
                  </p>
                  <h3 className="text-base font-medium text-foreground">{p.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star size={13} className="fill-sun text-sun" />
                    <span className="font-medium text-foreground">{p.rating}</span>
                    <span>({p.reviews} avaliações)</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">A partir de</p>
                  <p className="text-lg font-semibold text-terracotta">{p.priceFrom} STN</p>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </AppShell>
  );
}
