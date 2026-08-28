import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Award } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre a KONEKTA — Serviços em STP" },
      {
        name: "description",
        content:
          "A KONEKTA liga clientes a profissionais verificados em São Tomé e Príncipe, com preços transparentes e pagamento protegido.",
      },
      { property: "og:title", content: "Sobre a KONEKTA — Serviços em STP" },
      {
        property: "og:description",
        content:
          "A missão, a visão e os valores da plataforma são-tomense de prestação de serviços.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://konekta-connect.lovable.app/sobre" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://konekta-connect.lovable.app/sobre" }],
  }),
  component: SobrePage,
});

const valores = [
  {
    t: "Confiança",
    d: "Todos os prestadores passam por verificação de identidade antes de receber pedidos.",
  },
  {
    t: "Transparência",
    d: "Preços claros, sem custos escondidos e com recibo digital em cada serviço.",
  },
  {
    t: "Proximidade",
    d: "Feita em São Tomé, para a realidade são-tomense — incluindo redes lentas.",
  },
  {
    t: "Oportunidade",
    d: "Damos visibilidade a profissionais locais e ajudamos a formalizar o trabalho.",
  },
];

function SobrePage() {
  return (
    <AppShell wide={true}>
      <div className="px-4 pt-4 sm:px-6 space-y-5">
        <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Voltar ao Início</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider">
            <Award size={13} />
            <span>Missão São Tomé e Príncipe</span>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Sobre a KONEKTA
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            A KONEKTA nasceu para resolver um problema simples: encontrar um bom profissional em São
            Tomé e Príncipe dependia de boca-a-boca e chamadas sem resposta. Hoje ligamos clientes e
            prestadores num só lugar, com avaliações reais e pagamento protegido pela plataforma.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-bold text-sm text-foreground">Missão</h2>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Tornar a contratação de serviços rápida, segura e acessível em todo o arquipélago.
            </p>
          </section>
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-bold text-sm text-foreground">Visão</h2>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Ser a principal infraestrutura digital de trabalho e serviços de São Tomé e Príncipe.
            </p>
          </section>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground">Os nossos valores</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {valores.map((v) => (
              <li key={v.t} className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-bold text-sm text-foreground">{v.t}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{v.d}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-primary p-5 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold">Pronto para começar?</h2>
            <p className="mt-0.5 text-xs text-white/80">
              Publique um pedido gratuito e receba propostas de profissionais verificados.
            </p>
          </div>
          <Link
            to="/novo-pedido"
            className="press inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-primary hover:bg-slate-100 transition whitespace-nowrap"
          >
            Publicar Pedido
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
