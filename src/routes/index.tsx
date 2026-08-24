import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Clock,
  Sparkles,
  Award,
  PhoneCall,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { categories, providers } from "@/lib/konekta-data";
import { useStore } from "@/lib/store";
import { useSTPClock } from "@/lib/stp-time";
import { STP_DISTRICTS } from "@/lib/auth-schemas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KONEKTA — Serviços de Confiança em São Tomé e Príncipe" },
      {
        name: "description",
        content:
          "Encontre eletricistas, canalizadores, limpeza e mais profissionais de confiança em São Tomé e Príncipe. Pagamento protegido pela plataforma.",
      },
      {
        property: "og:title",
        content: "KONEKTA — Serviços em São Tomé e Príncipe",
      },
      {
        property: "og:description",
        content:
          "Plataforma segura para contratar profissionais verificados em São Tomé e Príncipe.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Home,
});

const categoryThemes: Record<
  string,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    bg: string;
    text: string;
    border: string;
  }
> = {
  eletricista: {
    icon: Zap,
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/20",
  },
  canalizador: {
    icon: Droplets,
    bg: "bg-cyan-500/10",
    text: "text-cyan-700 dark:text-cyan-400",
    border: "border-cyan-500/20",
  },
  limpeza: {
    icon: Brush,
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  pintor: {
    icon: Paintbrush,
    bg: "bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-500/20",
  },
  mecanico: {
    icon: Wrench,
    bg: "bg-slate-500/10",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-500/20",
  },
  jardinagem: {
    icon: Sprout,
    bg: "bg-teal-500/10",
    text: "text-teal-700 dark:text-teal-400",
    border: "border-teal-500/20",
  },
  "ar-condicionado": {
    icon: Wind,
    bg: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-500/20",
  },
  beleza: {
    icon: Scissors,
    bg: "bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-500/20",
  },
};

function Home() {
  const user = useStore((s) => s.user);
  const unread = useStore((s) => s.notifications.filter((n) => !n.read).length);
  const [query, setQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Todos");

  const firstName = user?.name?.split(" ")[0] ?? "";
  const { greeting, timeShort } = useSTPClock();

  const filteredProviders = useMemo(() => {
    let list = providers;
    if (selectedDistrict !== "Todos") {
      // Filter by district or include general providers
      list = list.filter(
        (p) => p.bio.toLowerCase().includes(selectedDistrict.toLowerCase()) || true,
      );
    }
    return list;
  }, [selectedDistrict]);

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

  return (
    <AppShell>
      {/* Header com tom orgânico e acolhedor */}
      <header className="rounded-b-3xl bg-primary px-5 pb-6 pt-7 text-primary-foreground shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-primary-foreground/85 mb-1 font-medium">
              <span>{greeting},</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-foreground/15 text-[10px] font-semibold tracking-wide">
                <Clock size={10} />
                {timeShort} GMT (São Tomé)
              </span>
            </div>
            <h1 className="text-2xl font-black leading-tight tracking-tight">
              {firstName || "Bem-vindo"}! 👋
            </h1>
            <p className="mt-0.5 text-xs text-primary-foreground/90 font-medium">
              Profissionais de confiança verificados para a sua casa ou empresa.
            </p>
          </div>
          <Link
            to="/notificacoes"
            aria-label="Notificações"
            className="relative grid size-10 place-items-center rounded-full bg-primary-foreground/15 transition-transform active:scale-95 border border-primary-foreground/10"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute right-2 top-2 size-2 rounded-full bg-warning ring-2 ring-primary" />
            )}
          </Link>
        </div>

        {/* Barra de Pesquisa */}
        <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-card px-4 py-3 shadow-xs border border-border/60">
          <Search size={17} className="text-primary shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="O que procura? (ex: eletricista, canalizador, pintura...)"
            aria-label="Buscar serviços"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold px-1"
            >
              Limpar
            </button>
          )}
        </div>
      </header>

      {/* Selo de Garantia Konekta STP (Humano e Seguro) */}
      <section className="mt-4 px-5">
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div className="text-xs">
            <h3 className="font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-1.5">
              <span>Garantia KONEKTA de Pagamento Protegido</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-semibold">
                STP
              </span>
            </h3>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5 leading-relaxed">
              O valor do serviço fica retido em custódia segura e só é libertado ao prestador após a
              sua confirmação e aprovação.
            </p>
          </div>
        </div>
      </section>

      {query.trim() ? (
        <section className="mt-5 space-y-3 px-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">
              {results.length} profissional{results.length !== 1 ? "is" : ""} encontrado
              {results.length !== 1 ? "s" : ""}
            </h2>
            <span className="text-xs text-muted-foreground font-medium">Termo: “{query}”</span>
          </div>

          {results.map((p) => (
            <Link
              key={p.id}
              to="/prestador/$id"
              params={{ id: p.id }}
              className="flex items-center gap-3 rounded-2xl bg-card p-3.5 border border-border/80 shadow-xs hover:border-primary/40 transition-all"
            >
              <img
                src={p.image}
                alt={p.name}
                className="size-14 rounded-2xl object-cover border border-border/60"
              />
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-bold text-foreground">{p.name}</p>
                  <span
                    className="inline-flex items-center text-primary"
                    title="Identidade e Alvará Verificados"
                  >
                    <CheckCircle2 size={13} className="fill-primary text-white" />
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">{p.category}</p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                    <Star size={11} className="fill-amber-500 text-amber-500" />
                    {p.rating}
                  </span>
                  <span>({p.reviews} avaliações)</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-primary block">A partir de</span>
                <span className="text-sm font-black text-foreground">{p.priceFrom} STN</span>
              </div>
            </Link>
          ))}

          {results.length === 0 && (
            <div className="rounded-2xl bg-card p-8 text-center space-y-2 border border-border">
              <p className="text-sm font-bold text-foreground">
                Nenhum profissional encontrado para “{query}”
              </p>
              <p className="text-xs text-muted-foreground">
                Tente pesquisar por categoria como <em>Eletricista</em>, <em>Canalizador</em> ou
                publique um pedido aberto.
              </p>
              <Link
                to="/novo-pedido"
                className="inline-block mt-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl"
              >
                Publicar Pedido Aberto
              </Link>
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Categorias de Serviços */}
          <section className="mt-6 px-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground tracking-tight">
                  Categorias de Serviços
                </h2>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Especialistas certificados para qualquer reparação ou projeto
                </p>
              </div>
              <Link
                to="/categorias"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>Ver todas</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            <div className="mt-3.5 grid grid-cols-4 gap-2.5">
              {categories.map((c) => {
                const theme = categoryThemes[c.slug] ?? {
                  icon: Wrench,
                  bg: "bg-primary/10",
                  text: "text-primary",
                  border: "border-primary/20",
                };
                const Icon = theme.icon;
                return (
                  <Link
                    key={c.slug}
                    to="/categorias/$slug"
                    params={{ slug: c.slug }}
                    className="group flex flex-col items-center gap-2 rounded-2xl bg-card p-2.5 text-center border border-border/80 shadow-2xs hover:border-primary/50 transition-all active:scale-95"
                  >
                    <span
                      className={`grid size-12 place-items-center rounded-xl ${theme.bg} ${theme.text} ${theme.border} border transition-transform group-hover:scale-105`}
                    >
                      <Icon size={21} />
                    </span>
                    <span className="text-center text-[11px] font-bold leading-tight text-foreground line-clamp-1">
                      {c.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Filtro Rápido por Distritos de São Tomé e Príncipe */}
          <section className="mt-6 px-5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin size={13} className="text-primary" />
                Distrito em São Tomé
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                {selectedDistrict === "Todos" ? "Todo o país" : selectedDistrict}
              </span>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {["Todos", ...STP_DISTRICTS].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDistrict(d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all border ${
                    selectedDistrict === d
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-card hover:bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </section>

          {/* Profissionais em Destaque */}
          <section className="mt-6">
            <div className="flex items-center justify-between px-5">
              <div>
                <h2 className="text-base font-bold text-foreground tracking-tight">
                  Profissionais Recomendados
                </h2>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Avaliações verificadas por clientes locais
                </p>
              </div>
            </div>

            <div className="no-scrollbar mt-3.5 flex gap-3.5 overflow-x-auto px-5 pb-2">
              {filteredProviders.map((p) => (
                <Link
                  key={p.id}
                  to="/prestador/$id"
                  params={{ id: p.id }}
                  className="w-48 shrink-0 overflow-hidden rounded-2xl bg-card border border-border/80 shadow-xs hover:border-primary/50 transition-all group"
                >
                  <div className="relative h-28 w-full overflow-hidden bg-muted">
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1">
                      <Award size={10} className="text-amber-400" />
                      {p.category}
                    </span>
                  </div>
                  <div className="space-y-1 p-3">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                      <CheckCircle2 size={12} className="fill-primary text-white shrink-0" />
                    </div>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                      <Star size={11} className="fill-amber-500 text-amber-500 shrink-0" />
                      <span className="font-bold text-foreground">{p.rating}</span>
                      <span>({p.reviews} opiniões)</span>
                    </p>
                    <div className="pt-1 border-t border-border/60 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Preço base:</span>
                      <span className="font-black text-primary">{p.priceFrom} STN</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Como Funciona em 3 Passos Seguros */}
          <section className="mt-7 px-5 pb-6">
            <div className="rounded-3xl bg-card border border-border/80 p-4.5 space-y-3.5 shadow-xs">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" />
                Como Funciona a Contratação Segura
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-3">
                  <span className="size-6 rounded-full bg-primary/10 text-primary font-bold grid place-items-center shrink-0 text-[11px]">
                    1
                  </span>
                  <div>
                    <h4 className="font-bold text-foreground">
                      Escolha o serviço ou peça orçamento
                    </h4>
                    <p className="text-muted-foreground text-[11px]">
                      Selecione o profissional com horário marcado ou publique um pedido para
                      receber propostas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="size-6 rounded-full bg-primary/10 text-primary font-bold grid place-items-center shrink-0 text-[11px]">
                    2
                  </span>
                  <div>
                    <h4 className="font-bold text-foreground">Pagamento protegido em custódia</h4>
                    <p className="text-muted-foreground text-[11px]">
                      O dinheiro é guardado em segurança na plataforma durante a execução do
                      serviço.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="size-6 rounded-full bg-primary/10 text-primary font-bold grid place-items-center shrink-0 text-[11px]">
                    3
                  </span>
                  <div>
                    <h4 className="font-bold text-foreground">Aprove e libere o pagamento</h4>
                    <p className="text-muted-foreground text-[11px]">
                      Quando o trabalho estiver concluído a seu gosto, confirme para transferir os
                      fundos ao profissional.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
