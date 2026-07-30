import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

const navLinks = [
  { to: "/", label: "Início" },
  { to: "/categorias", label: "Categorias" },
  { to: "/como-funciona", label: "Como funciona" },
  { to: "/sobre", label: "Sobre" },
] as const;

export type Crumb = { label: string; to?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Caminho de navegação" className="mx-auto w-full max-w-5xl px-4 pt-4">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.to ? (
              <Link to={item.to} className="hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors ${
        scrolled ? "border-border bg-surface/85 backdrop-blur-md" : "border-transparent bg-surface"
      }`}
    >
      <div className="mx-auto grid w-full max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary text-sm font-black text-primary-foreground">
            K
          </span>
          <span className="truncate text-base font-black tracking-tight text-foreground">KONEKTA</span>
        </Link>

        <div className="flex items-center gap-2">
          <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeProps={{ className: "text-foreground font-semibold" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="rounded-lg px-3 py-2 text-sm hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <Link
            to="/tornar-prestador"
            className="hidden rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:block"
          >
            Sou profissional
          </Link>
          <Link
            to="/auth"
            className="press rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Entrar
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            className="grid size-10 place-items-center rounded-xl ring-1 ring-border md:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Menu móvel" className="border-t border-border bg-card px-4 py-2 md:hidden">
          {[...navLinks, { to: "/tornar-prestador", label: "Sou profissional" } as const].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2 py-3 text-sm font-medium text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

function SiteFooter() {
  const year = new Date().getFullYear();
  const cols = [
    {
      title: "Empresa",
      links: [
        { to: "/sobre", label: "Sobre a KONEKTA" },
        { to: "/como-funciona", label: "Como funciona" },
        { to: "/categorias", label: "Categorias" },
      ],
    },
    {
      title: "Suporte",
      links: [
        { to: "/ajuda", label: "Ajuda e FAQ" },
        { to: "/assistente", label: "Assistente KONEKTA" },
        { to: "/auth", label: "Entrar / Registar" },
      ],
    },
    {
      title: "Legal",
      links: [
        { to: "/termos", label: "Termos de uso" },
        { to: "/privacidade", label: "Política de privacidade" },
      ],
    },
  ] as const;

  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="text-base font-black tracking-tight text-foreground">KONEKTA</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Serviços de confiança em São Tomé e Príncipe, sem chamadas e com pagamento protegido.
          </p>
          <p className="mt-3 inline-flex rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
            🇸🇹 Feito em São Tomé e Príncipe
          </p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="text-sm font-semibold text-foreground">{c.title}</h2>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        © {year} KONEKTA. Todos os direitos reservados.
      </div>
    </footer>
  );
}

export function PublicLayout({ children, crumbs }: { children: ReactNode; crumbs?: Crumb[] }) {
  return (
    <div className="min-h-screen bg-surface">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Saltar para o conteúdo
      </a>
      <SiteHeader />
      {crumbs && <Breadcrumbs items={crumbs} />}
      <main id="conteudo" className="mx-auto w-full max-w-5xl px-4 py-8">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
