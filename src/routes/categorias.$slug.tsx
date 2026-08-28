import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Star,
  Zap,
  Droplets,
  Brush,
  Paintbrush,
  Wrench,
  Sprout,
  Wind,
  Scissors,
  Hammer,
  ShieldCheck,
  MapPin,
  Clock,
  Check,
  ArrowLeft,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { categoryBySlug, formatDb, searchProviders } from "@/lib/catalog";

export const Route = createFileRoute("/categorias/$slug")({
  loader: ({ params }) => {
    const category = categoryBySlug(params.slug);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Categoria indisponível — KONEKTA" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.category.name} em São Tomé e Príncipe — KONEKTA`;
    const description = `Profissionais de ${loaderData.category.name.toLowerCase()} verificados em São Tomé e Príncipe. Compare preços, avaliações e agende online.`;
    const url = `https://konekta-connect.lovable.app/categorias/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
      ],
    };
  },
  notFoundComponent: CategoriaNaoEncontrada,
  component: CategoriaPage,
});

const categoryIconMap: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  eletricista: Zap,
  canalizador: Droplets,
  limpeza: Brush,
  pintor: Paintbrush,
  mecanico: Wrench,
  jardinagem: Sprout,
  "ar-condicionado": Wind,
  beleza: Scissors,
};

function CategoriaNaoEncontrada() {
  return (
    <AppShell wide={true}>
      <div className="px-4 py-8 sm:px-6 text-center space-y-3">
        <h1 className="text-2xl font-black text-foreground">Categoria não encontrada</h1>
        <p className="text-xs text-muted-foreground">Esta categoria não existe ou foi descontinuada.</p>
        <Link
          to="/categorias"
          className="press mt-4 inline-flex rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-brand-dark"
        >
          Ver todas as especialidades
        </Link>
      </div>
    </AppShell>
  );
}

type SortKey = "relevancia" | "preco-asc" | "preco-desc" | "avaliacao";

function CategoriaPage() {
  const { category } = Route.useLoaderData();
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<SortKey>("relevancia");

  const providers = useMemo(() => {
    const list = searchProviders("", category.slug).filter((p) => p.rating >= minRating);
    const sorted = [...list];
    if (sort === "preco-asc") sorted.sort((a, b) => a.priceFrom - b.priceFrom);
    if (sort === "preco-desc") sorted.sort((a, b) => b.priceFrom - a.priceFrom);
    if (sort === "avaliacao") sorted.sort((a, b) => b.rating - a.rating);
    return sorted;
  }, [category.slug, minRating, sort]);

  const Icon = categoryIconMap[category.slug] ?? Hammer;

  return (
    <AppShell wide={true}>
      <div className="px-4 pt-4 sm:px-6 space-y-4">
        {/* Header de Navegação */}
        <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
          <Link
            to="/categorias"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Todas as Especialidades</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider">
            <ShieldCheck size={13} />
            <span>Rede STP Certificada</span>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20"
            aria-hidden="true"
          >
            <Icon size={24} />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {category.name}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              {providers.length}{" "}
              {providers.length === 1
                ? "profissional credenciado disponível"
                : "profissionais credenciados disponíveis"}{" "}
              em São Tomé e Príncipe.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center gap-2">
            <label htmlFor="filtro-avaliacao" className="text-xs font-bold text-muted-foreground">
              Classificação
            </label>
            <select
              id="filtro-avaliacao"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="rounded-lg bg-surface px-2.5 py-1.5 text-xs text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value={0}>Todas as avaliações</option>
              <option value={4}>4+ estrelas</option>
              <option value={4.5}>4.5+ estrelas</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="ordenar" className="text-xs font-bold text-muted-foreground">
              Ordenar por
            </label>
            <select
              id="ordenar"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg bg-surface px-2.5 py-1.5 text-xs text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="relevancia">Relevância técnica</option>
              <option value="preco-asc">Preço: menor primeiro</option>
              <option value="preco-desc">Preço: maior primeiro</option>
              <option value="avaliacao">Melhor classificado</option>
            </select>
          </div>
        </div>

        {providers.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center space-y-2">
            <h2 className="text-sm font-bold text-foreground">
              Nenhum profissional encontrado com os filtros atuais
            </h2>
            <p className="text-xs text-muted-foreground">
              Experimente reduzir a classificação mínima ou publicar um pedido aberto.
            </p>
            <Link
              to="/novo-pedido"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-brand-dark transition mt-2"
            >
              <span>Publicar Pedido de {category.name}</span>
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <li key={p.id}>
                <Link
                  to="/prestador/$id"
                  params={{ id: p.id }}
                  className="card-triider flex flex-col justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-soft transition-all group h-full"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="relative size-12 shrink-0">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="size-full rounded-lg object-cover border border-border"
                        />
                        <span className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-700 text-white flex items-center justify-center ring-2 ring-card">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {p.name}
                        </h2>
                        <p className="text-xs text-muted-foreground">{p.category}</p>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 mt-0.5">
                          <Star size={11} className="fill-amber-500 text-amber-500" />
                          <span>{p.rating}</span>
                          <span className="text-muted-foreground font-normal">
                            ({p.reviews} intervenções)
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {p.bio}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-primary" />
                        <span>Água Grande & Mé-Zóchi</span>
                      </span>
                      <span className="flex items-center gap-1 text-emerald-800 font-medium">
                        <Clock size={12} />
                        <span>~15 min resposta</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        A partir de
                      </span>
                      <span className="text-sm font-black text-primary">{formatDb(p.priceFrom)}</span>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold group-hover:bg-brand-dark transition-colors">
                      Ver Perfil
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
