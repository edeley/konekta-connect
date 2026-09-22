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
  Search,
  Navigation,
  Sparkles,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { categoryBySlug, formatDb, searchProviders } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import {
  calculateProviderDistance,
  getSmartQuerySuggestions,
  STP_DISTRICT_LIST,
  type ProviderDistanceInfo,
} from "@/lib/search-engine";
import { getCurrentGPSLocation } from "@/lib/sync-manager";
import type { Provider } from "@/lib/konekta-data";

export const Route = createFileRoute("/categorias/$slug")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: typeof search.q === "string" ? search.q : undefined,
      distrito: typeof search.distrito === "string" ? search.distrito : undefined,
      distancia: typeof search.distancia === "string" ? search.distancia : undefined,
    };
  },
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
    const description = `Profissionais de ${loaderData.category.name.toLowerCase()} verificados em São Tomé e Príncipe. Compare preços, avaliações, proximidade geográfica em km e agende online.`;
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
        <p className="text-xs text-muted-foreground">
          Esta categoria não existe ou foi descontinuada.
        </p>
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

type SortKey = "relevancia" | "distancia-asc" | "preco-asc" | "preco-desc" | "avaliacao";

type ProviderWithDistance = Provider & {
  distanceInfo: ProviderDistanceInfo;
};

function CategoriaPage() {
  const { category } = Route.useLoaderData();
  const searchParams = Route.useSearch();
  const allProviders = useStore((s) => s.providers);

  // Estados de Filtros e Pesquisa Inteligente
  const [query, setQuery] = useState(searchParams.q || "");
  const [clientDistrict, setClientDistrict] = useState<string>(
    searchParams.distrito || "Água Grande",
  );
  const [maxDistance, setMaxDistance] = useState<string>(searchParams.distancia || "qualquer");
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<SortKey>("relevancia");

  // GPS em Tempo Real
  const [clientGps, setClientGps] = useState<{
    latitude: number;
    longitude: number;
    zone?: string;
  } | null>(null);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);

  // Sugestões Semânticas Inteligentes
  const smartSuggestions = useMemo(() => {
    return getSmartQuerySuggestions(query.trim() || category.name);
  }, [query, category.name]);

  const handleGetGPS = async () => {
    setIsLocatingGPS(true);
    try {
      const res = await getCurrentGPSLocation();
      if (res) {
        setClientGps({
          latitude: res.latitude,
          longitude: res.longitude,
          zone: res.zone,
        });

        const matched =
          STP_DISTRICT_LIST.find((d) => res.district.toLowerCase().includes(d.toLowerCase())) ||
          "Água Grande";
        setClientDistrict(matched);

        toast.success(`GPS Ativado: ${res.zone || res.district}!`, {
          description: `As distâncias dos profissionais foram recalculadas para o seu ponto exato.`,
        });
      }
    } catch {
      toast.error("Não foi possível aceder ao GPS do telemóvel.");
    } finally {
      setIsLocatingGPS(false);
    }
  };

  // Processamento e Filtragem dos Prestadores com Distância
  const providers = useMemo(() => {
    // 1. Pesquisa inteligente por texto, sinónimos e categoria
    const rawMatches = searchProviders(query, category.slug, {
      providerList: allProviders,
      onlyActive: true,
    });

    // 2. Calcular distâncias e enriquecer os dados
    const enriched: ProviderWithDistance[] = rawMatches.map((p) => {
      const distanceInfo = calculateProviderDistance(p, {
        district: clientDistrict,
        latitude: clientGps?.latitude,
        longitude: clientGps?.longitude,
      });
      return {
        ...p,
        distanceInfo,
      };
    });

    // 3. Aplicar Filtro de Classificação
    let filtered = enriched.filter((p) => p.rating >= minRating);

    // 4. Aplicar Filtro de Distância
    if (maxDistance === "5km") {
      filtered = filtered.filter((p) => p.distanceInfo.distanceKm <= 5);
    } else if (maxDistance === "10km") {
      filtered = filtered.filter((p) => p.distanceInfo.distanceKm <= 10);
    } else if (maxDistance === "25km") {
      filtered = filtered.filter((p) => p.distanceInfo.distanceKm <= 25);
    } else if (maxDistance === "mesmo-distrito") {
      filtered = filtered.filter((p) => p.distanceInfo.isInSameDistrict);
    }

    // 5. Ordenação
    const sorted = [...filtered];
    if (sort === "distancia-asc") {
      sorted.sort((a, b) => a.distanceInfo.distanceKm - b.distanceInfo.distanceKm);
    } else if (sort === "preco-asc") {
      sorted.sort((a, b) => a.priceFrom - b.priceFrom);
    } else if (sort === "preco-desc") {
      sorted.sort((a, b) => b.priceFrom - a.priceFrom);
    } else if (sort === "avaliacao") {
      sorted.sort((a, b) => b.rating - a.rating);
    }

    return sorted;
  }, [allProviders, category.slug, query, clientDistrict, clientGps, minRating, maxDistance, sort]);

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

        {/* Cabeçalho da Categoria */}
        <div className="flex items-start gap-4">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20"
            aria-hidden="true"
          >
            <Icon size={24} />
          </span>
          <div className="min-w-0 flex-1">
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

        {/* Barra de Pesquisa Inteligente Dentro da Categoria */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-xl bg-card p-1.5 border border-border shadow-xs">
            <div className="flex items-center gap-2.5 flex-1 min-w-0 px-2.5">
              <Search size={16} className="text-primary shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Pesquisar serviços ou termos afins (ex: ${
                  category.slug === "eletricista"
                    ? "eletricidade, tomadas, quadro, curto"
                    : "serviço, termo ou técnico"
                })...`}
                className="min-w-0 flex-1 bg-transparent py-2 text-xs sm:text-sm text-foreground outline-none placeholder:text-muted-foreground font-medium"
              />
            </div>
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition cursor-pointer"
                title="Limpar pesquisa"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Banner de Termos Semelhantes e Sugestões Inteligentes */}
          {smartSuggestions.suggestedTags.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground tracking-wider shrink-0">
                <Sparkles size={12} className="text-primary" />
                Termos semelhantes:
              </span>
              {smartSuggestions.suggestedTags.map((tag) => {
                const isActive = query.toLowerCase() === tag.toLowerCase();
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setQuery(isActive ? "" : tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-surface text-foreground border-border hover:border-primary/40 hover:bg-muted/60"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* BARRA DE FILTROS AVANÇADOS: DISTÂNCIA, LOCALIZAÇÃO & CLASSIFICAÇÃO */}
        <div className="rounded-xl border border-border bg-card p-3 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <SlidersHorizontal size={14} className="text-primary" />
              <span>Filtros de Proximidade e Serviço</span>
            </span>
            {clientGps && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Navigation size={10} className="text-emerald-700" />
                GPS Ativo ({clientGps.zone || clientDistrict})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Sua Localização de Referência com GPS */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="filtro-distrito"
                  className="text-[11px] font-bold text-muted-foreground flex items-center gap-1"
                >
                  <MapPin size={12} className="text-primary" />
                  <span>A sua localização</span>
                </label>
                <button
                  type="button"
                  onClick={handleGetGPS}
                  disabled={isLocatingGPS}
                  className="text-[10px] font-bold text-primary hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                  title="Detetar por GPS"
                >
                  <Navigation
                    size={10}
                    className={isLocatingGPS ? "animate-spin text-primary" : ""}
                  />
                  <span>{isLocatingGPS ? "A detetar..." : "Usar GPS"}</span>
                </button>
              </div>
              <select
                id="filtro-distrito"
                value={clientDistrict}
                onChange={(e) => {
                  setClientDistrict(e.target.value);
                  setClientGps(null);
                }}
                className="w-full rounded-lg bg-surface px-2.5 py-1.5 text-xs text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                {STP_DISTRICT_LIST.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Filtro de Distância Máxima (NOVO) */}
            <div className="space-y-1">
              <label
                htmlFor="filtro-distancia"
                className="text-[11px] font-bold text-muted-foreground block"
              >
                Distância máxima
              </label>
              <select
                id="filtro-distancia"
                value={maxDistance}
                onChange={(e) => setMaxDistance(e.target.value)}
                className="w-full rounded-lg bg-surface px-2.5 py-1.5 text-xs text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                <option value="qualquer">Todas as distâncias</option>
                <option value="5km">Até 5 km (Mais próximos)</option>
                <option value="10km">Até 10 km (Distrito / Arredores)</option>
                <option value="25km">Até 25 km (Raio alargado)</option>
                <option value="mesmo-distrito">Apenas no meu distrito</option>
              </select>
            </div>

            {/* 3. Classificação Mínima */}
            <div className="space-y-1">
              <label
                htmlFor="filtro-avaliacao"
                className="text-[11px] font-bold text-muted-foreground block"
              >
                Classificação
              </label>
              <select
                id="filtro-avaliacao"
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full rounded-lg bg-surface px-2.5 py-1.5 text-xs text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                <option value={0}>Todas as avaliações</option>
                <option value={4}>4+ estrelas</option>
                <option value={4.5}>4.5+ estrelas</option>
              </select>
            </div>

            {/* 4. Ordenação (Incluindo ordenação por menor distância) */}
            <div className="space-y-1">
              <label
                htmlFor="ordenar"
                className="text-[11px] font-bold text-muted-foreground block"
              >
                Ordenar por
              </label>
              <select
                id="ordenar"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="w-full rounded-lg bg-surface px-2.5 py-1.5 text-xs text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                <option value="relevancia">Relevância técnica</option>
                <option value="distancia-asc">📍 Distância: Mais próximos primeiro</option>
                <option value="preco-asc">Preço: menor primeiro</option>
                <option value="preco-desc">Preço: maior primeiro</option>
                <option value="avaliacao">Melhor classificado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Prestadores com Distância e Detalhes */}
        {providers.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center space-y-2">
            <h2 className="text-sm font-bold text-foreground">
              Nenhum profissional encontrado com os filtros atuais
            </h2>
            <p className="text-xs text-muted-foreground">
              Experimente aumentar o raio de distância, limpar termos de pesquisa ou solicitar um
              pedido aberto.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setMaxDistance("qualquer");
                  setMinRating(0);
                }}
                className="px-3.5 py-2 text-xs font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition cursor-pointer"
              >
                Repor filtros
              </button>
              <Link
                to="/novo-pedido"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-brand-dark transition"
              >
                <span>Publicar Pedido de {category.name}</span>
              </Link>
            </div>
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
                        <span
                          className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-700 text-white flex items-center justify-center ring-2 ring-card"
                          title="Profissional Certificado"
                        >
                          <Check size={10} strokeWidth={3} />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h2 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {p.name}
                          </h2>
                          {/* Badge destacada de Proximidade em KM */}
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              p.distanceInfo.distanceKm <= 5
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            📍 {p.distanceInfo.formatted}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{p.category}</p>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 mt-0.5">
                          <Star size={11} className="fill-amber-500 text-amber-500" />
                          <span>{p.rating.toFixed(1)}</span>
                          <span className="text-muted-foreground font-normal">
                            ({p.reviews} intervenções)
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {p.bio}
                    </p>

                    {/* INDICADORES DE LOCALIZAÇÃO, DISTÂNCIA & LOGÍSTICA */}
                    <div className="space-y-1 pt-2 border-t border-border/60">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1 truncate font-medium text-foreground">
                          <MapPin size={12} className="text-primary shrink-0" />
                          <span>
                            {p.district || "São Tomé"}
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              ({p.distanceInfo.formatted} de si)
                            </span>
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-emerald-800 font-medium shrink-0">
                          <Clock size={12} />
                          <span>~{p.distanceInfo.travelTimeEstimateMinutes} min deslocação</span>
                        </span>
                      </div>

                      {p.districts && p.districts.length > 0 && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          Atende também em: {p.districts.slice(0, 3).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        A partir de
                      </span>
                      <span className="text-sm font-black text-primary">
                        {formatDb(p.priceFrom)}
                      </span>
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
