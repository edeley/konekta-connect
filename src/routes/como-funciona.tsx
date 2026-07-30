import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como funciona a KONEKTA — Passo a passo" },
      {
        name: "description",
        content:
          "Em 6 passos: crie conta, publique o pedido, compare propostas, agende, receba o profissional e avalie o serviço.",
      },
      { property: "og:title", content: "Como funciona a KONEKTA — Passo a passo" },
      {
        property: "og:description",
        content: "Guia completo para contratar serviços na KONEKTA em São Tomé e Príncipe.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://konekta-connect.lovable.app/como-funciona" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://konekta-connect.lovable.app/como-funciona" }],
  }),
  component: ComoFuncionaPage,
});

const passos = [
  { t: "Criar conta", d: "Leva 30 segundos: nome, telefone e código de verificação. Sem papelada.", emoji: "📝" },
  { t: "Publicar ou procurar", d: "Descreva o que precisa ou navegue pelas categorias e prestadores.", emoji: "🔍" },
  { t: "Escolher o profissional", d: "Compare avaliações, preços e distância antes de decidir.", emoji: "👤" },
  { t: "Agendar", d: "Escolha o dia e a hora. A confirmação é imediata na aplicação.", emoji: "📅" },
  { t: "Receber o serviço", d: "Acompanhe o estado em tempo real e pague com a carteira protegida.", emoji: "✅" },
  { t: "Avaliar", d: "A sua avaliação ajuda toda a comunidade a escolher melhor.", emoji: "⭐" },
];

function ComoFuncionaPage() {
  return (
    <PublicLayout crumbs={[{ label: "Início", to: "/" }, { label: "Como funciona" }]}>
      <h1 className="text-3xl font-black tracking-tight text-foreground">Simples como 1-2-3</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Da ideia ao serviço feito, sem chamadas e sem surpresas no preço.
      </p>

      <ol className="mt-8 space-y-4">
        {passos.map((p, i) => (
          <li key={p.t} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-xl" aria-hidden="true">
              {p.emoji}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Passo {i + 1}</p>
              <h2 className="mt-0.5 font-semibold text-foreground">{p.t}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{p.d}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          to="/novo-pedido"
          className="press rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          Experimentar agora
        </Link>
        <Link to="/ajuda" className="press rounded-xl px-5 py-3 text-sm font-semibold text-foreground ring-1 ring-border">
          Ver perguntas frequentes
        </Link>
      </div>
    </PublicLayout>
  );
}
