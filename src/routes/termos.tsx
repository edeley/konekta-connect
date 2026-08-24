import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso — KONEKTA" },
      {
        name: "description",
        content:
          "Condições de utilização da plataforma KONEKTA para clientes e prestadores em São Tomé e Príncipe.",
      },
      { property: "og:title", content: "Termos de uso — KONEKTA" },
      { property: "og:description", content: "Condições de utilização da plataforma KONEKTA." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://konekta-connect.lovable.app/termos" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://konekta-connect.lovable.app/termos" }],
  }),
  component: TermosPage,
});

const seccoes = [
  {
    t: "1. Objeto",
    d: "A KONEKTA é uma plataforma que liga clientes a prestadores de serviços independentes em São Tomé e Príncipe. A KONEKTA não executa os serviços contratados.",
  },
  {
    t: "2. Conta de utilizador",
    d: "Cada pessoa tem uma identidade única, com perfis de cliente e/ou prestador. Deve fornecer informação verdadeira e manter a sua palavra-passe em segredo.",
  },
  {
    t: "3. Pedidos e propostas",
    d: "O cliente publica um pedido e recebe propostas. A aceitação de uma proposta cria um compromisso entre cliente e prestador.",
  },
  {
    t: "4. Pagamentos e comissões",
    d: "Os pagamentos são processados através da carteira KONEKTA. A plataforma retém uma comissão sobre cada serviço concluído, comunicada antes da confirmação.",
  },
  {
    t: "5. Cancelamentos",
    d: "Cancelamentos são permitidos até à hora agendada. Cancelamentos tardios ou repetidos podem originar penalizações.",
  },
  {
    t: "6. Conduta",
    d: "É proibido combinar pagamentos fora da plataforma, publicar conteúdo ilícito ou tratar outros utilizadores de forma abusiva.",
  },
  {
    t: "7. Responsabilidade",
    d: "A KONEKTA disponibiliza mecanismos de verificação e avaliação, mas a execução do serviço é da responsabilidade do prestador.",
  },
  {
    t: "8. Alterações",
    d: "Estes termos podem ser atualizados. As alterações relevantes são comunicadas na aplicação.",
  },
];

function TermosPage() {
  return (
    <PublicLayout crumbs={[{ label: "Início", to: "/" }, { label: "Termos de uso" }]}>
      <h1 className="text-3xl font-black tracking-tight text-foreground">Termos de uso</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última atualização: julho de 2026</p>
      <div className="mt-8 space-y-6">
        {seccoes.map((s) => (
          <section key={s.t}>
            <h2 className="font-semibold text-foreground">{s.t}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
          </section>
        ))}
      </div>
    </PublicLayout>
  );
}
