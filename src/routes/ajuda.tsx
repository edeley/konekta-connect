import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";

const faqs = [
  {
    q: "A KONEKTA é gratuita para clientes?",
    a: "Sim. Publicar um pedido e receber propostas é gratuito. Só paga o serviço contratado.",
  },
  {
    q: "Como sei que o profissional é de confiança?",
    a: "Os prestadores verificam identidade e recebem avaliações públicas de clientes reais após cada serviço.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "O valor fica retido na carteira KONEKTA e só é libertado ao prestador quando confirma que o serviço foi concluído.",
  },
  {
    q: "Posso cancelar um agendamento?",
    a: "Sim, até à hora marcada. Cancelamentos com menos de 2 horas de antecedência podem ter custo.",
  },
  {
    q: "Como me torno prestador?",
    a: "Crie a sua conta, abra o separador 'Sou profissional' e complete a verificação de identidade e categoria.",
  },
  {
    q: "Em que zonas a KONEKTA está disponível?",
    a: "Em todos os distritos de São Tomé e na Região Autónoma do Príncipe, consoante a disponibilidade dos prestadores.",
  },
];

export const Route = createFileRoute("/ajuda")({
  head: () => ({
    meta: [
      { title: "Ajuda e perguntas frequentes — KONEKTA" },
      {
        name: "description",
        content: "Respostas às dúvidas mais comuns sobre pedidos, pagamentos, cancelamentos e verificação na KONEKTA.",
      },
      { property: "og:title", content: "Ajuda e perguntas frequentes — KONEKTA" },
      { property: "og:description", content: "Centro de ajuda da plataforma KONEKTA em São Tomé e Príncipe." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://konekta-connect.lovable.app/ajuda" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://konekta-connect.lovable.app/ajuda" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: AjudaPage,
});

function AjudaPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <PublicLayout crumbs={[{ label: "Início", to: "/" }, { label: "Ajuda" }]}>
      <h1 className="text-3xl font-black tracking-tight text-foreground">Como podemos ajudar?</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Encontre respostas rápidas ou fale com o assistente KONEKTA a qualquer hora.
      </p>

      <ul className="mt-8 space-y-3">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <li key={f.q} className="overflow-hidden rounded-2xl border border-border bg-card">
              <h2>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="min-w-0 font-medium text-foreground">{f.q}</span>
                  <ChevronDown
                    size={18}
                    aria-hidden="true"
                    className={`shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </h2>
              {isOpen && <p className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</p>}
            </li>
          );
        })}
      </ul>

      <div className="mt-10 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold text-foreground">Não encontrou a resposta?</h2>
        <p className="mt-1 text-sm text-muted-foreground">O assistente KONEKTA responde em português, 24/7.</p>
        <Link
          to="/assistente"
          className="press mt-4 inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
        >
          Falar com o assistente
        </Link>
      </div>
    </PublicLayout>
  );
}
