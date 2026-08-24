import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { categories } from "@/lib/konekta-data";
import { categoryEmoji, searchProviders } from "@/lib/catalog";

export const Route = createFileRoute("/categorias/")({
  head: () => ({
    meta: [
      { title: "Categorias de serviços — KONEKTA" },
      {
        name: "description",
        content:
          "Explore todas as categorias de serviços disponíveis na KONEKTA em São Tomé e Príncipe: eletricista, canalizador, limpeza, pintura e mais.",
      },
      { property: "og:title", content: "Categorias de serviços — KONEKTA" },
      {
        property: "og:description",
        content: "Todas as categorias de profissionais verificados em São Tomé e Príncipe.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://konekta-connect.lovable.app/categorias" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://konekta-connect.lovable.app/categorias" }],
  }),
  component: CategoriasPage,
});

const descriptions: Record<string, string> = {
  eletricista: "Instalações, avarias e quadros elétricos.",
  canalizador: "Fugas, desentupimentos e torneiras.",
  limpeza: "Limpeza doméstica, profunda e pós-obra.",
  pintor: "Pintura de interiores e exteriores.",
  mecanico: "Reparação e manutenção automóvel.",
  jardinagem: "Corte de relva, poda e manutenção.",
  "ar-condicionado": "Instalação e manutenção de AC.",
  beleza: "Cabelo, unhas e estética ao domicílio.",
};

function CategoriasPage() {
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .map((c) => ({ ...c, count: searchProviders("", c.slug).length }))
      .filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <PublicLayout crumbs={[{ label: "Início", to: "/" }, { label: "Categorias" }]}>
      <h1 className="text-3xl font-black tracking-tight text-foreground">
        Explore as nossas categorias
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Escolha uma categoria para ver os profissionais disponíveis perto de si.
      </p>

      <div className="sticky top-16 z-10 -mx-4 mt-6 bg-surface/85 px-4 py-3 backdrop-blur-md">
        <label htmlFor="busca-categoria" className="sr-only">
          Pesquisar categoria
        </label>
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3 text-muted-foreground" aria-hidden="true" />
          <input
            id="busca-categoria"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar categoria..."
            className="w-full rounded-xl bg-card py-3 pl-10 pr-4 text-sm ring-1 ring-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-4xl" aria-hidden="true">
            🔍
          </p>
          <h2 className="mt-3 font-semibold text-foreground">Nenhuma categoria encontrada</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tente outro termo de pesquisa.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <li key={c.slug}>
              <Link
                to="/categorias/$slug"
                params={{ slug: c.slug }}
                className="press flex h-full items-start gap-3 rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-soft"
              >
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-xl"
                  aria-hidden="true"
                >
                  {categoryEmoji[c.slug] ?? "🛠️"}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">{c.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {descriptions[c.slug] ?? "Profissionais disponíveis na KONEKTA."}
                  </span>
                  <span className="mt-1 block text-xs font-medium text-primary">
                    {c.count} {c.count === 1 ? "profissional" : "profissionais"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PublicLayout>
  );
}
