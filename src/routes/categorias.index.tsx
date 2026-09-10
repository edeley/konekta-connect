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
  Layers,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getActiveCategories, getAllActiveServices, formatDb } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { RequestUnservedServiceModal } from "@/components/konekta/RequestUnservedServiceModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/categorias/")({
  head: () => ({
    meta: [
      { title: "Categorias e Serviços Ativos — KONEKTA STP" },
      {
        name: "description",
        content:
          "Consulte todas as especialidades e serviços com prestadores credenciados e ativos no terreno em São Tomé e Príncipe.",
      },
      { property: "og:title", content: "Categorias e Serviços Ativos — KONEKTA" },
      {
        property: "og:description",
        content: "Serviços técnicos com prestadores ativos em São Tomé e Príncipe.",
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
  const [activeTab, setActiveTab] = useState<"categorias" | "servicos">("categorias");
  const [isUnservedModalOpen, setIsUnservedModalOpen] = useState(false);
  const [unservedInitialName, setUnservedInitialName] = useState("");

  const providers = useStore((s) => s.providers);

  // Apenas categorias que têm prestadores ativos e credenciados
  const activeCategories = useMemo(
    () => getActiveCategories({ providerList: providers }),
    [providers],
  );

  // Todos os serviços individuais oferecidos por prestadores ativos
  const allActiveServices = useMemo(
    () => getAllActiveServices({ providerList: providers }),
    [providers],
  );

  // Filtro de Categorias Ativas
  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activeCategories.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.displayName && c.displayName.toLowerCase().includes(q)) ||
        descriptions[c.slug]?.toLowerCase().includes(q),
    );
  }, [activeCategories, query]);

  // Filtro de Serviços Ativos
  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allActiveServices.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.categoryName.toLowerCase().includes(q) ||
        s.providerName.toLowerCase().includes(q),
    );
  }, [allActiveServices, query]);

  return (
    <AppShell wide={true}>
      <div className="px-4 pt-4 sm:px-6 space-y-5">
        {/* Header de Navegação Limpo */}
        <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Voltar ao Início</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Apenas Serviços com Prestadores Ativos</span>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Especialidades e Serviços Disponíveis
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            A KONEKTA apenas apresenta especialidades e serviços com técnicos credenciados e prontos
            a intervir no terreno em São Tomé e Príncipe, evitando acumulação de opções sem
            resposta.
          </p>
        </div>

        {/* Barra de Pesquisa + Modo de Exibição */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-3 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="busca-categoria"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTab === "categorias"
                  ? "Pesquisar especialidade ativa (eletricidade, canalização, ar condicionado)..."
                  : "Pesquisar serviço específico (bomba de água, pintura anti-salitre, disjuntor)..."
              }
              className="w-full rounded-xl bg-card py-2.5 pl-10 pr-4 text-xs sm:text-sm text-foreground border border-border shadow-2xs placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-1 bg-muted/70 p-1 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("categorias")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer",
                activeTab === "categorias"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Layers size={14} />
              <span>Especialidades ({activeCategories.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("servicos")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer",
                activeTab === "servicos"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Wrench size={14} />
              <span>Todos os Serviços ({allActiveServices.length})</span>
            </button>
          </div>
        </div>

        {/* BANNER REASSURANCE: Pedir serviço sem prestador */}
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-primary" />
              <span>Não encontrou a especialidade ou serviço que procura?</span>
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed max-w-2xl">
              Para não causar confusão, a KONEKTA nunca mostra serviços que ainda não têm
              prestadores ativos. Pode solicitar qualquer serviço não listado (ex: Marceneiro, TV
              Cabo, Serralheiro) e a nossa administração irá recrutar um profissional qualificado
              para si e notificá-lo assim que estiver disponível.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setUnservedInitialName(query);
              setIsUnservedModalOpen(true);
            }}
            className="rounded-xl font-bold text-xs h-9 gap-1.5 shrink-0 shadow-2xs cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Solicitar Serviço à Administração</span>
          </Button>
        </div>

        {/* ABA 1: CATEGORIAS COM PRESTADORES ATIVOS */}
        {activeTab === "categorias" && (
          <div>
            {filteredCategories.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-3">
                <div className="size-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertCircle size={24} />
                </div>
                <h2 className="text-sm font-bold text-foreground">
                  Nenhuma categoria com prestadores ativos para “{query}”
                </h2>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  A KONEKTA nunca lista categorias sem prestadores credenciados disponíveis. Deseja
                  que a administração procure um prestador qualificado para este trabalho?
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setUnservedInitialName(query);
                      setIsUnservedModalOpen(true);
                    }}
                    className="gap-1.5 font-bold text-xs rounded-xl h-9"
                  >
                    <Sparkles size={14} />
                    <span>Solicitar “{query}” ao Administrador</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setQuery("")}
                    className="font-bold text-xs rounded-xl h-9"
                  >
                    Limpar Pesquisa
                  </Button>
                </div>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCategories.map((c) => {
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
                              {c.displayName || c.name}
                            </span>
                            <ChevronRight
                              size={15}
                              className="text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                            />
                          </span>
                          <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                            {descriptions[c.slug] ??
                              "Profissionais credenciados e disponíveis em STP."}
                          </span>
                          <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>
                              {c.count}{" "}
                              {c.count === 1
                                ? "prestador ativo em STP"
                                : "prestadores ativos em STP"}
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
        )}

        {/* ABA 2: TODOS OS SERVIÇOS DISPONÍVEIS NA APP */}
        {activeTab === "servicos" && (
          <div>
            {filteredServices.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-3">
                <div className="size-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertCircle size={24} />
                </div>
                <h2 className="text-sm font-bold text-foreground">
                  Nenhum serviço disponível com prestador ativo para “{query}”
                </h2>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Não mostramos opções sem técnicos aptos a atender. Solicite este serviço à
                  administração para recrutarmos um profissional credenciado para si.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setUnservedInitialName(query);
                      setIsUnservedModalOpen(true);
                    }}
                    className="gap-1.5 font-bold text-xs rounded-xl h-9"
                  >
                    <Sparkles size={14} />
                    <span>Solicitar “{query}” ao Administrador</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setQuery("")}
                    className="font-bold text-xs rounded-xl h-9"
                  >
                    Limpar Pesquisa
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredServices.map((srv, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-border bg-card shadow-2xs hover:border-primary/50 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                          {srv.categoryName}
                        </span>
                        <span className="text-[11px] font-black text-primary">
                          {srv.price ? `${srv.price} STN` : `A partir de ${srv.priceFrom} STN`}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition">
                        {srv.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Oferecido por{" "}
                        <strong className="text-foreground">{srv.providerName}</strong> (★{" "}
                        {srv.rating.toFixed(1)})
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                      <Link
                        to="/prestador/$id"
                        params={{ id: srv.providerId }}
                        className="text-[11px] font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        <span>Ver Perfil</span>
                        <ExternalLink size={12} />
                      </Link>
                      <Link
                        to="/novo-pedido"
                        search={{
                          categoria: srv.categorySlug,
                          titulo: srv.name,
                          orcamento: srv.price ? srv.price.toString() : srv.priceFrom.toString(),
                        }}
                        className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-2xs hover:bg-brand-dark transition inline-flex items-center gap-1"
                      >
                        <span>Pedir Serviço</span>
                        <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Solicitação de Serviço sem Prestador */}
      <RequestUnservedServiceModal
        isOpen={isUnservedModalOpen}
        onClose={() => setIsUnservedModalOpen(false)}
        initialServiceName={unservedInitialName}
      />
    </AppShell>
  );
}
