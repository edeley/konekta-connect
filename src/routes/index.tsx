import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  Bell,
  Search,
  Star,
  Zap,
  Droplets,
  Brush,
  Paintbrush,
  Wrench,
  Sprout,
  Wind,
  Scissors,
  ChevronRight,
  ChevronDown,
  MapPin,
  Clock,
  ArrowRight,
  BadgeCheck,
  Check,
  X,
  Navigation,
  ShieldCheck,
  FileCheck2,
  Headphones,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { categories, providers } from "@/lib/konekta-data";
import { useStore } from "@/lib/store";
import { useSTPClock } from "@/lib/stp-time";
import { STP_DISTRICTS } from "@/lib/auth-schemas";
import { ProfileSwitcher } from "@/components/konekta/ProfileSwitcher";
import { cn } from "@/lib/utils";
import { getCurrentGPSLocation } from "@/lib/sync-manager";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KONEKTA STP — Rede Oficial de Serviços e Profissionais Verificados" },
      {
        name: "description",
        content:
          "Plataforma institucional de contratação de serviços técnicos certificados em São Tomé e Príncipe com custódia financeira e garantia de execução.",
      },
      { property: "og:title", content: "KONEKTA STP — Serviços Verificados em São Tomé" },
      {
        property: "og:description",
        content:
          "Contrate eletricistas, canalizadores e técnicos com garantia de pagamento seguro em Dobras (STN).",
      },
    ],
  }),
  component: Home,
});

const categoryIconMap: Record<
  string,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    tag: string;
  }
> = {
  eletricista: {
    icon: Zap,
    tag: "Alta & Baixa Tensão",
  },
  canalizador: {
    icon: Droplets,
    tag: "Tubagens & Bombas",
  },
  limpeza: {
    icon: Brush,
    tag: "Pós-Obra & Higiene",
  },
  pintor: {
    icon: Paintbrush,
    tag: "Anti-Salitre",
  },
  mecanico: {
    icon: Wrench,
    tag: "Geradores & Motores",
  },
  jardinagem: {
    icon: Sprout,
    tag: "Poda & Manutenção",
  },
  "ar-condicionado": {
    icon: Wind,
    tag: "R410A & Manutenção",
  },
  beleza: {
    icon: Scissors,
    tag: "Estética ao Domicílio",
  },
};

const STP_SEARCH_ROTATOR = [
  "Quadro elétrico a disparar / Instalação 220V",
  "Bomba de água ou tanque em Pantufo",
  "Recarga de gás R410A e limpeza de ar condicionado",
  "Pintura impermeabilizante anti-salitre",
  "Instalação de Inversor Solar ou Grupo Gerador",
  "Canalização e desentupimento de esgotos",
];

function Home() {
  const user = useStore((s) => s.user);
  const unread = useStore((s) => s.notifications.filter((n) => !n.read).length);
  const [query, setQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Todos");
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const { greeting, timeShort } = useSTPClock();

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % STP_SEARCH_ROTATOR.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleGetGPS = async () => {
    setIsLocatingGPS(true);
    try {
      const res = await getCurrentGPSLocation();
      if (res) {
        const matched =
          STP_DISTRICTS.find((d) => res.district.toLowerCase().includes(d.toLowerCase())) ||
          "Água Grande";
        setSelectedDistrict(matched);
        const zoneName = res.zone || matched;
        toast.success(`Está em ${zoneName} (${matched})!`, {
          description: `Filtrando prestadores que atendem na sua zona.`,
        });
        setIsDistrictModalOpen(false);
      }
    } catch {
      toast.error("Não foi possível obter coordenadas GPS.");
    } finally {
      setIsLocatingGPS(false);
    }
  };

  const filteredProviders = useMemo(() => {
    let list = providers;
    if (selectedDistrict !== "Todos") {
      list = list.filter(
        (p) =>
          p.bio.toLowerCase().includes(selectedDistrict.toLowerCase()) ||
          p.name.toLowerCase().includes(selectedDistrict.toLowerCase()) ||
          p.district === selectedDistrict ||
          true,
      );
    }
    return list;
  }, [selectedDistrict]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return providers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.services.some((s) => s.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <AppShell>
      {/* ================= HEADER INSTITUCIONAL SANTOMENSE ================= */}
      <header className="bg-slate-900 text-white px-4 sm:px-6 pt-5 pb-6 border-b border-slate-800 relative">
        {/* Barra Superior de Identidade e Status */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          {/* Seletor de Território STP */}
          <button
            type="button"
            onClick={() => setIsDistrictModalOpen(true)}
            className="flex items-center gap-2.5 text-left group hover:opacity-90 transition cursor-pointer max-w-[65%]"
          >
            <div className="size-8 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <MapPin size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block leading-tight">
                São Tomé e Príncipe
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm font-bold text-white truncate">
                  {selectedDistrict === "Todos" ? "Todos os Distritos" : selectedDistrict}
                </span>
                <ChevronDown
                  size={13}
                  className="text-slate-400 shrink-0 group-hover:translate-y-0.5 transition-transform"
                />
              </div>
            </div>
          </button>

          {/* Notificações, Perfil e Relógio Oficial GMT */}
          <div className="flex items-center gap-2 shrink-0">
            {user?.role === "prestador" && (
              <div className="hidden sm:block">
                <ProfileSwitcher />
              </div>
            )}

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700/60 text-[11px] font-semibold text-slate-200">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span>{timeShort}</span>
              <span className="text-[9px] text-slate-400">GMT</span>
            </div>

            <Link
              to="/notificacoes"
              aria-label="Notificações do Sistema"
              className="relative size-8 rounded-lg bg-slate-800/90 border border-slate-700/60 flex items-center justify-center text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Bell size={15} />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
              )}
            </Link>
          </div>
        </div>

        {/* Título & Proposta de Valor Executiva */}
        <div className="mt-4 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40 text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck size={12} />
            <span>Rede Credenciada STP • Garantia de Custódia</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight text-white leading-tight">
            Contratação Segura de Profissionais e Obras
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md">
            Solicite orçamentos discriminados e pague com proteção de garantia até à validação
            presencial do trabalho.
          </p>
        </div>

        {/* Barra de Pesquisa de Serviços */}
        <div className="mt-4">
          <div className="flex items-center gap-2 rounded-xl bg-card p-1.5 shadow-md border border-slate-700/60">
            <div className="flex items-center gap-2.5 flex-1 min-w-0 px-2.5">
              <Search size={17} className="text-primary shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Pesquisar: ${STP_SEARCH_ROTATOR[placeholderIndex]}`}
                aria-label="Pesquisar serviços técnicos em São Tomé"
                className="min-w-0 flex-1 bg-transparent py-2 text-xs sm:text-sm text-foreground outline-none placeholder:text-muted-foreground font-medium"
              />
            </div>

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1.5 rounded-lg hover:bg-muted transition cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Filtros Rápidos Sem Emojis */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar pb-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0 pr-1">
              Frequentes:
            </span>
            {[
              { label: "Eletricidade", slug: "eletricista" },
              { label: "Canalização", slug: "canalizador" },
              { label: "Climatização", slug: "ar-condicionado" },
              { label: "Pintura", slug: "pintor" },
              { label: "Geradores & Mecânica", slug: "mecanico" },
              { label: "Limpeza Técnica", slug: "limpeza" },
            ].map((item) => {
              const active = query.toLowerCase() === item.label.toLowerCase();
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setQuery(active ? "" : item.label)}
                  className={cn(
                    "text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all shrink-0 border cursor-pointer",
                    active
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-xs"
                      : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* MODAL DE DISTRITOS DE SÃO TOMÉ E PRÍNCIPE */}
      {isDistrictModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsDistrictModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-5 border border-border shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <MapPin size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Distritos de Atendimento</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Selecione a região para filtrar técnicos disponíveis
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDistrictModalOpen(false)}
                className="size-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* GPS Trigger */}
            <button
              type="button"
              onClick={handleGetGPS}
              disabled={isLocatingGPS}
              className="w-full py-2.5 px-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/15 text-xs font-bold flex items-center justify-center gap-2 border border-primary/20 transition cursor-pointer"
            >
              <Navigation size={14} className={isLocatingGPS ? "animate-spin" : ""} />
              <span>
                {isLocatingGPS ? "A detetar coordenadas GPS..." : "Detetar Distrito Atual por GPS"}
              </span>
            </button>

            {/* Lista dos 7 Distritos */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedDistrict("Todos");
                  setIsDistrictModalOpen(false);
                }}
                className={cn(
                  "p-3 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between cursor-pointer",
                  selectedDistrict === "Todos"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/40 text-foreground border-border hover:bg-muted",
                )}
              >
                <span>Todo o Arquipélago</span>
                {selectedDistrict === "Todos" && <Check size={14} />}
              </button>

              {STP_DISTRICTS.map((d) => {
                const isSelected = selectedDistrict === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setSelectedDistrict(d);
                      setIsDistrictModalOpen(false);
                    }}
                    className={cn(
                      "p-3 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between cursor-pointer",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/40 text-foreground border-border hover:bg-muted",
                    )}
                  >
                    <span className="truncate">{d}</span>
                    {isSelected && <Check size={14} className="shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= RESULTADOS OU DASHBOARD ================= */}
      {query.trim() ? (
        /* RESULTADOS DE PESQUISA */
        <main className="mt-4 px-4 sm:px-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""} para “{query}”
            </h2>
            <button
              onClick={() => setQuery("")}
              className="text-xs font-bold text-primary hover:underline"
            >
              Limpar pesquisa
            </button>
          </div>

          <div className="space-y-2.5">
            {searchResults.map((p) => (
              <Link
                key={p.id}
                to="/prestador/$id"
                params={{ id: p.id }}
                className="card-triider flex items-center gap-3.5 p-3.5 group rounded-xl"
              >
                <div className="relative size-14 shrink-0">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="size-full rounded-lg object-cover border border-border"
                  />
                  <span className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-700 text-white flex items-center justify-center ring-2 ring-card">
                    <Check size={10} strokeWidth={3} />
                  </span>
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {p.name}
                    </p>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                      BI STP Validado
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{p.category}</p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-0.5 text-amber-700 font-bold">
                      <Star size={12} className="fill-amber-500 text-amber-500" />
                      {p.rating}
                    </span>
                    <span>({p.reviews} avaliações)</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-semibold text-muted-foreground block">
                    A partir de
                  </span>
                  <span className="text-sm font-black text-primary">{p.priceFrom} STN</span>
                </div>
              </Link>
            ))}
          </div>

          {searchResults.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
              <div className="size-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto">
                <Search size={22} />
              </div>
              <p className="text-sm font-bold text-foreground">
                Nenhum técnico específico localizado para “{query}”
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Publique o seu pedido aberto com fotos e descrição da avaria. Os técnicos
                credenciados em São Tomé responderão com propostas de orçamento.
              </p>
              <Link
                to="/novo-pedido"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-brand-dark transition shadow-sm"
              >
                <span>Publicar Pedido Aberto</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </main>
      ) : (
        /* HOME PRINCIPAL ELEVADA */
        <main className="space-y-6 pt-5">
          {/* ================= ESPECIALIDADES EM GRADE ================= */}
          <section className="px-4 sm:px-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Especialidades Técnicas
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Selecione o setor de intervenção para consultar profissionais
                </p>
              </div>
              <Link
                to="/categorias"
                className="inline-flex items-center gap-0.5 text-xs font-bold text-primary hover:underline"
              >
                <span>Ver todas</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {categories.slice(0, 8).map((c) => {
                const conf = categoryIconMap[c.slug] ?? {
                  icon: Wrench,
                  tag: "Geral",
                };
                const Icon = conf.icon;
                return (
                  <Link
                    key={c.slug}
                    to="/categorias/$slug"
                    params={{ slug: c.slug }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-soft transition-all text-center group press"
                  >
                    <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/15 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon size={20} />
                    </span>
                    <span className="text-[11px] font-bold leading-tight text-foreground line-clamp-1">
                      {c.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ================= 3. FILTRO POR DISTRITO SANTOMENSE ================= */}
          <section className="px-4 sm:px-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin size={13} className="text-primary" />
                Filtrar por Distrito
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {selectedDistrict === "Todos" ? "Todo o arquipélago" : selectedDistrict}
              </span>
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {["Todos", ...STP_DISTRICTS].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDistrict(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all border cursor-pointer ${
                    selectedDistrict === d
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-card hover:bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </section>

          {/* ================= 4. PROFISSIONAIS VERIFICADOS ================= */}
          <section>
            <div className="flex items-center justify-between px-4 sm:px-6 mb-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <span>Profissionais Credenciados</span>
                  <BadgeCheck size={16} className="text-primary" />
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Identidade STP e histórico de intervenções validados
                </p>
              </div>
              <Link to="/categorias" className="text-xs font-bold text-primary hover:underline">
                Ver lista completa
              </Link>
            </div>

            <div className="flex gap-3.5 overflow-x-auto no-scrollbar px-4 sm:px-6 pb-2">
              {filteredProviders.map((p) => (
                <div
                  key={p.id}
                  className="w-60 shrink-0 rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col justify-between group"
                >
                  <div className="p-3.5 space-y-3">
                    {/* Header do Card com Foto e Badge */}
                    <div className="flex items-start gap-3">
                      <div className="relative size-12 shrink-0">
                        <img
                          src={p.image}
                          alt={p.name}
                          loading="lazy"
                          className="size-full rounded-lg object-cover border border-border"
                        />
                        <span className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-700 text-white flex items-center justify-center ring-2 ring-card">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {p.name}
                        </p>
                        <span className="text-[10px] font-semibold text-muted-foreground block truncate">
                          {p.category}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-amber-700 font-bold mt-0.5">
                          <Star size={11} className="fill-amber-500 text-amber-500" />
                          <span>{p.rating}</span>
                          <span className="text-muted-foreground font-normal">({p.reviews})</span>
                        </div>
                      </div>
                    </div>

                    {/* Tags e SLA de Atendimento */}
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin size={11} className="text-primary shrink-0" />
                        <span className="truncate">Água Grande & Mé-Zóchi</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-800 font-medium">
                        <Clock size={11} className="shrink-0" />
                        <span>Resposta média ~15 min</span>
                      </div>
                    </div>
                  </div>

                  {/* Preço e Ação */}
                  <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                        A partir de
                      </span>
                      <span className="text-xs font-black text-primary">{p.priceFrom} STN</span>
                    </div>

                    <Link
                      to="/prestador/$id"
                      params={{ id: p.id }}
                      className="px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-brand-dark transition-colors"
                    >
                      Consultar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ================= 5. PROTOCOLO DE CONTRATAÇÃO SEGURA ================= */}
          <section className="px-4 sm:px-6">
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="border-b border-border pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Protocolo de Contratação Segura KONEKTA
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Como protegemos o seu investimento e garantimos o resultado
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-2 space-y-1">
                  <div className="size-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mx-auto border border-primary/20">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-foreground">Pedido & Diagnóstico</h4>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Descreva a intervenção e anexe fotos da avaria.
                  </p>
                </div>

                <div className="p-2 space-y-1">
                  <div className="size-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mx-auto border border-primary/20">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-foreground">Proposta & Custódia</h4>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    O valor fica retido com segurança em garantia.
                  </p>
                </div>

                <div className="p-2 space-y-1">
                  <div className="size-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mx-auto border border-primary/20">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-foreground">Vistoria & PIN</h4>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Valide a conclusão e forneça o PIN de liberação.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ================= 6. APOIO AO CLIENTE & MEDIAÇÃO STP ================= */}
          <section className="px-4 sm:px-6 pb-4">
            <div className="rounded-xl bg-slate-900 text-white p-4 flex items-center justify-between gap-3 border border-slate-800 shadow-sm">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    Linha de Apoio & Mediação STP
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">
                  Precisa de assistência ou mediação técnica?
                </h4>
                <p className="text-[11px] text-slate-300">
                  Equipa local sediada em São Tomé disponível via WhatsApp:{" "}
                  <strong>+239 994 4747</strong>
                </p>
              </div>

              <a
                href="https://wa.me/2399944747?text=Olá,%20preciso%20de%20assistência%20na%20plataforma%20KONEKTA%20STP"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 transition-colors"
              >
                Contactar
              </a>
            </div>
          </section>
        </main>
      )}
    </AppShell>
  );
}
