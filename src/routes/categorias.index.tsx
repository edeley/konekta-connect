import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search,
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
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { categories } from "@/lib/konekta-data";
import { searchProviders } from "@/lib/catalog";

export const Route = createFileRoute("/categorias/")({
  head: () => ({
    meta: [
      { title: "Categorias de Serviços — KONEKTA STP" },
      {
        name: "description",
        content:
          "Explore todas as especialidades profissionais verificadas em São Tomé e Príncipe com proteção de garantia e pagamento seguro.",
      },
      { property: "og:title", content: "Categorias de Serviços — KONEKTA" },
      {
        property: "og:description",
        content: "Especialidades de confiança em São Tomé e Príncipe.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CategoriasPage,
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

const descriptions: Record<string, string> = {
  eletricista: "Instalações de 220V, quadros de proteção, inversores solares e piquete de avarias.",
  canalizador: "Fugas em tubagens, canalizações de esgoto, bombas submersíveis e depósitos.",
  limpeza: "Higienização profunda, tratamento pós-obra e limpeza industrial ou residencial.",
  pintor: "Pintura de fachadas com isolamento anti-salitre, impermeabilização e vernizes.",
  mecanico: "Manutenção de grupos geradores, motores diesel/gasolina e mecânica geral.",
  jardinagem: "Poda de segurança, corte de relva, desmatação e paisagismo tropical.",
  "ar-condicionado":
    "Instalação, recarga de gás ecológico R410A/R32 e higienização antibacteriana.",
  beleza: "Serviços estéticos e cuidados pessoais prestados no conforto do domicílio.",
};

function CategoriasPage() {
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .map((c) => ({ ...c, count: searchProviders("", c.slug).length }))
      .filter(
        (c) =>
          !q || c.name.toLowerCase().includes(q) || descriptions[c.slug]?.toLowerCase().includes(q),
      );
  }, [query]);

  return (
    <AppShell wide={true}>
      <div className="px-4 pt-4 sm:px-6 space-y-4">
        {/* Header de Navegação Limpo */}
        <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Voltar ao Início</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider">
            <ShieldCheck size={13} />
            <span>Rede STP Credenciada</span>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Especialidades Técnicas e Serviços
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Selecione a categoria técnica pretendida para consultar profissionais certificados,
            tabelas de referência e solicitar propostas discriminadas com custódia de pagamento.
          </p>
        </div>

        <div className="sticky top-2 z-10 bg-surface/95 py-2 backdrop-blur-md">
          <label htmlFor="busca-categoria" className="sr-only">
            Pesquisar especialidade
          </label>
          <div className="relative flex items-center">
            <Search
              size={16}
              className="absolute left-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="busca-categoria"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquise por serviço (ex: eletricista, bomba de água, gerador, ar condicionado)..."
              className="w-full rounded-xl bg-card py-2.5 pl-10 pr-4 text-xs sm:text-sm text-foreground border border-border shadow-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-3">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Search size={22} />
            </div>
            <h2 className="text-sm font-bold text-foreground">Nenhuma especialidade encontrada</h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Não encontrou a especialidade? Publique um pedido aberto com a descrição do trabalho e
              a nossa rede notificará técnicos qualificados.
            </p>
            <Link
              to="/novo-pedido"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-brand-dark transition"
            >
              <span>Publicar Pedido Aberto</span>
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => {
              const Icon = categoryIconMap[c.slug] ?? Hammer;
              return (
                <li key={c.slug}>
                  <Link
                    to="/categorias/$slug"
                    params={{ slug: c.slug }}
                    className="press flex h-full items-start gap-3.5 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-soft group"
                  >
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/15 group-hover:bg-primary group-hover:text-white transition-colors"
                      aria-hidden="true"
                    >
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-1">
                        <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                          {c.name}
                        </span>
                        <ChevronRight
                          size={15}
                          className="text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                        />
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {descriptions[c.slug] ?? "Profissionais credenciados e disponíveis em STP."}
                      </span>
                      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                        <span>
                          {c.count}{" "}
                          {c.count === 1
                            ? "profissional credenciado"
                            : "profissionais credenciados"}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
