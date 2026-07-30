import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { categoryBySlug, categoryEmoji, formatDb, searchProviders } from "@/lib/catalog";

export const Route = createFileRoute("/categorias/$slug")({
  loader: ({ params }) => {
    const category = categoryBySlug(params.slug);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Categoria indisponível — KONEKTA" }, { name: "robots", content: "noindex" }] };
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
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  notFoundComponent: CategoriaNaoEncontrada,
  component: CategoriaPage,
});

function CategoriaNaoEncontrada() {
  return (
    <PublicLayout crumbs={[{ label: "Início", to: "/" }, { label: "Categorias", to: "/categorias" }, { label: "Não encontrada" }]}>
      <h1 className="text-2xl font-black text-foreground">Categoria não encontrada</h1>
      <p className="mt-2 text-muted-foreground">Esta categoria não existe ou foi removida.</p>
      <Link
        to="/categorias"
        className="press mt-6 inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
      >
        Ver todas as categorias
      </Link>
    </PublicLayout>
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

  return (
    <PublicLayout
      crumbs={[{ label: "Início", to: "/" }, { label: "Categorias", to: "/categorias" }, { label: category.name }]}
    >
      <div className="flex items-start gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-2xl" aria-hidden="true">
          {categoryEmoji[category.slug] ?? "🛠️"}
        </span>
        <div className="min-w-0">
          <h1 className="text-3xl font-black tracking-tight text-foreground">{category.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {providers.length} {providers.length === 1 ? "profissional disponível" : "profissionais disponíveis"} em São Tomé e Príncipe.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <label htmlFor="filtro-avaliacao" className="text-sm text-muted-foreground">
            Avaliação mínima
          </label>
          <select
            id="filtro-avaliacao"
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="rounded-lg bg-surface px-3 py-2 text-sm ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value={0}>Todas</option>
            <option value={4}>4+ estrelas</option>
            <option value={4.5}>4,5+ estrelas</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="ordenar" className="text-sm text-muted-foreground">
            Ordenar por
          </label>
          <select
            id="ordenar"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg bg-surface px-3 py-2 text-sm ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="relevancia">Relevância</option>
            <option value="preco-asc">Preço: menor primeiro</option>
            <option value="preco-desc">Preço: maior primeiro</option>
            <option value="avaliacao">Melhor avaliado</option>
          </select>
        </div>
      </div>

      {providers.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-4xl" aria-hidden="true">
            🧭
          </p>
          <h2 className="mt-3 font-semibold text-foreground">Nenhum profissional encontrado</h2>
          <p className="mt-1 text-sm text-muted-foreground">Experimente reduzir a avaliação mínima.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <li key={p.id} className="flex flex-col rounded-2xl border border-border bg-card p-4">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={p.image}
                  alt={`Fotografia de ${p.name}`}
                  loading="lazy"
                  className="size-14 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.category}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-foreground">
                    <Star size={12} className="fill-warning text-warning" aria-hidden="true" />
                    {p.rating.toFixed(1)}
                    <span className="text-muted-foreground">({p.reviews})</span>
                  </p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.bio}</p>
              <p className="mt-3 text-sm font-semibold text-foreground">Desde {formatDb(p.priceFrom)}</p>
              <div className="mt-4 flex gap-2">
                <Link
                  to="/prestador/$id"
                  params={{ id: p.id }}
                  className="press flex-1 rounded-xl bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground"
                >
                  Ver perfil
                </Link>
                <Link
                  to="/novo-pedido"
                  className="press flex-1 rounded-xl px-3 py-2 text-center text-sm font-semibold text-foreground ring-1 ring-border"
                >
                  Pedir
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PublicLayout>
  );
}
