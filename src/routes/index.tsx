import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, MapPin, Search, Star, Truck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { categories, providers, orders, getProvider, statusLabel } from "@/lib/konekta-data";

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
  const activeOrder = orders.find((o) => o.status === "a-caminho" || o.status === "em-execucao");
  const activeProvider = activeOrder ? getProvider(activeOrder.providerId) : undefined;

  return (
    <AppShell>
      <header className="pt-6 pb-4 px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-ocean" />
            <span className="text-sm font-medium text-muted-foreground">São Tomé, STP</span>
          </div>
          <button className="relative p-2 rounded-full ring-1 ring-border bg-card">
            <Bell size={16} className="text-foreground" />
            <span className="absolute top-1.5 right-1.5 size-2 bg-terracotta rounded-full ring-2 ring-card" />
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-semibold leading-tight text-foreground text-balance">
            Encontre o profissional certo para hoje
          </h1>
        </div>
      </header>

      <section className="px-4 sticky top-0 z-10 bg-surface/85 backdrop-blur-md py-2">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3 text-muted-foreground" />
          <input
            type="text"
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
          {categories.map((c, idx) => (
            <button
              key={c.slug}
              className={`flex-shrink-0 flex items-center gap-2 py-2 pr-3 pl-2 rounded-full text-sm font-medium ring-1 transition ${
                idx === 0
                  ? "bg-cocoa text-primary-foreground ring-transparent"
                  : "bg-card text-foreground ring-border"
              }`}
            >
              <span className={`size-5 rounded-full ${idx === 0 ? "bg-primary-foreground/20" : tintClass[c.tint]}`} />
              {c.name}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8 px-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Prestadores em Destaque</h2>
          <button className="text-sm font-medium text-terracotta">Ver todos</button>
        </div>

        {providers.map((p) => (
          <Link
            key={p.id}
            to="/prestador/$id"
            params={{ id: p.id }}
            className="block bg-card rounded-2xl p-3 ring-1 ring-border space-y-3"
          >
            <img
              src={p.image}
              alt={p.name}
              width={800}
              height={600}
              loading="lazy"
              className="w-full aspect-video object-cover rounded-xl"
            />
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
        ))}
      </section>
    </AppShell>
  );
}
