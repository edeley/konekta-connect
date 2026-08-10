import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, Search, Star, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { categories, providers } from "@/lib/konekta-data";
import { useStore } from "@/lib/store";
import {
  Zap,
  Droplets,
  Sparkles,
  Paintbrush,
  Wrench,
  Leaf,
  Snowflake,
  Scissors,
} from "lucide-react";

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

const catIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  eletricista: Zap,
  canalizador: Droplets,
  limpeza: Sparkles,
  pintor: Paintbrush,
  mecanico: Wrench,
  jardinagem: Leaf,
  "ar-condicionado": Snowflake,
  beleza: Scissors,
};

function Home() {
  const user = useStore((s) => s.user);
  const balance = useStore((s) => s.balance);
  const unread = useStore((s) => s.notifications.filter((n) => !n.read).length);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return providers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.services.some((s) => s.toLowerCase().includes(q)),
    );
  }, [query]);

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <AppShell>
      <header className="rounded-b-3xl bg-primary px-5 pb-6 pt-7 text-primary-foreground">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-primary-foreground/80">Olá,</p>
            <h1 className="text-2xl font-extrabold leading-tight">
              {firstName || "Bem-vindo"}! 👋
            </h1>
            <p className="mt-0.5 text-sm text-primary-foreground/85">O que você precisa hoje?</p>
          </div>
          <Link
            to="/notificacoes"
            aria-label="Notificações"
            className="relative grid size-10 place-items-center rounded-full bg-primary-foreground/15"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute right-2 top-2 size-2 rounded-full bg-warning ring-2 ring-primary" />
            )}
          </Link>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-card px-4 py-3">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar serviços, prestadores..."
            aria-label="Buscar serviços"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </header>

      {query.trim() ? (
        <section className="mt-5 space-y-3 px-5">
          <h2 className="text-sm font-semibold">
            {results.length} resultado{results.length !== 1 ? "s" : ""}
          </h2>
          {results.map((p) => (
            <Link
              key={p.id}
              to="/prestador/$id"
              params={{ id: p.id }}
              className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border"
            >
              <img src={p.image} alt={p.name} className="size-12 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.category}</p>
              </div>
              <span className="text-xs font-semibold text-success">
                A partir de {p.priceFrom} STN
              </span>
            </Link>
          ))}
          {results.length === 0 && (
            <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
              Sem resultados para “{query}”.
            </p>
          )}
        </section>
      ) : (
        <>
          <section className="-mt-4 px-5">
            <Link
              to="/carteira"
              className="press flex items-center gap-3 rounded-2xl bg-success/10 p-4 ring-1 ring-success/20"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-success text-success-foreground">
                <Wallet size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] text-muted-foreground">Carteira digital</span>
                <span className="block text-lg font-extrabold text-foreground">
                  {balance.toLocaleString("pt-PT")} STN
                </span>
              </span>
              <span className="rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">
                Ativa
              </span>
            </Link>
          </section>

          <section className="mt-6 px-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Categorias</h2>
              <Link to="/categorias" className="text-xs font-semibold text-primary">
                Ver todas
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3">
              {categories.map((c) => {
                const Icon = catIcons[c.slug] ?? Sparkles;
                return (
                  <Link
                    key={c.slug}
                    to="/categorias/$slug"
                    params={{ slug: c.slug }}
                    className="press flex flex-col items-center gap-1.5"
                  >
                    <span className="grid size-14 place-items-center rounded-2xl bg-card text-primary ring-1 ring-border">
                      <Icon size={20} />
                    </span>
                    <span className="text-center text-[10px] font-medium leading-tight text-muted-foreground">
                      {c.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mt-7">
            <div className="flex items-center justify-between px-5">
              <h2 className="text-base font-semibold">Serviços populares</h2>
            </div>
            <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-5 pb-1">
              {providers.map((p) => (
                <Link
                  key={p.id}
                  to="/prestador/$id"
                  params={{ id: p.id }}
                  className="w-40 shrink-0 overflow-hidden rounded-2xl bg-card ring-1 ring-border"
                >
                  <img
                    src={p.image}
                    alt={p.category}
                    loading="lazy"
                    className="h-24 w-full object-cover"
                  />
                  <div className="space-y-0.5 p-3">
                    <p className="text-sm font-semibold">{p.category}</p>
                    <p className="text-[11px] text-muted-foreground">
                      A partir de {p.priceFrom} STN
                    </p>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Star size={11} className="fill-warning text-warning" />
                      <span className="font-semibold text-foreground">{p.rating}</span>
                      <span>({p.reviews})</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
