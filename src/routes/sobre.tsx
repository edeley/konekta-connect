import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";

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
        content: "A missão, a visão e os valores da plataforma são-tomense de prestação de serviços.",
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
  { t: "Confiança", d: "Todos os prestadores passam por verificação de identidade antes de receber pedidos." },
  { t: "Transparência", d: "Preços claros, sem custos escondidos e com recibo digital em cada serviço." },
  { t: "Proximidade", d: "Feita em São Tomé, para a realidade são-tomense — incluindo redes lentas." },
  { t: "Oportunidade", d: "Damos visibilidade a profissionais locais e ajudamos a formalizar o trabalho." },
];

function SobrePage() {
  return (
    <PublicLayout crumbs={[{ label: "Início", to: "/" }, { label: "Sobre" }]}>
      <h1 className="text-3xl font-black tracking-tight text-foreground">Sobre a KONEKTA</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        A KONEKTA nasceu para resolver um problema simples: encontrar um bom profissional em São Tomé e Príncipe
        dependia de boca-a-boca e de chamadas sem resposta. Hoje ligamos clientes e prestadores num só lugar, com
        avaliações reais e pagamento protegido pela plataforma.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground">Missão</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tornar a contratação de serviços rápida, segura e acessível em todo o arquipélago.
          </p>
        </section>
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground">Visão</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ser a principal plataforma de trabalho e serviços de São Tomé e Príncipe.
          </p>
        </section>
      </div>

      <h2 className="mt-10 text-xl font-bold text-foreground">Os nossos valores</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {valores.map((v) => (
          <li key={v.t} className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground">{v.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{v.d}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 rounded-2xl bg-primary p-6 text-primary-foreground">
        <h2 className="text-xl font-bold">Pronto para começar?</h2>
        <p className="mt-1 text-sm text-primary-foreground/80">
          Publique um pedido gratuito e receba propostas de profissionais verificados.
        </p>
        <Link
          to="/novo-pedido"
          className="press mt-4 inline-flex rounded-xl bg-primary-foreground px-4 py-3 text-sm font-semibold text-primary"
        >
          Publicar pedido
        </Link>
      </div>
    </PublicLayout>
  );
}
