import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ArrowLeft, HelpCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";

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
        content:
          "Respostas às dúvidas mais comuns sobre pedidos, pagamentos, cancelamentos e verificação na KONEKTA.",
      },
      { property: "og:title", content: "Ajuda e perguntas frequentes — KONEKTA" },
      {
        property: "og:description",
        content: "Centro de ajuda da plataforma KONEKTA em São Tomé e Príncipe.",
      },
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
            <HelpCircle size={13} />
            <span>Centro de Ajuda STP</span>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Como podemos ajudar?
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Encontre respostas rápidas sobre pedidos, garantias e pagamentos ou fale com o apoio técnico.
          </p>
        </div>

        <ul className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q} className="overflow-hidden rounded-xl border border-border bg-card">
                <h2>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
                  >
                    <span className="min-w-0 font-bold text-xs sm:text-sm text-foreground">{f.q}</span>
                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className={`shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </h2>
                {isOpen && <p className="px-4 pb-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.a}</p>}
              </li>
            );
          })}
        </ul>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div>
            <h2 className="font-bold text-sm text-foreground">Não encontrou a resposta?</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              A nossa equipa oficial e o assistente KONEKTA estão disponíveis para apoiar todos os
              utilizadores.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-surface border border-border text-xs space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                WhatsApp Oficial KONEKTA
              </p>
              <p className="text-xs font-black text-foreground">+239 9944747</p>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border text-xs space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">E-mail Oficial</p>
              <p className="text-xs font-black text-foreground">edeleydamiao@gmail.com</p>
            </div>
          </div>

          <Link
            to="/assistente"
            className="press inline-flex rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-brand-dark transition"
          >
            Falar com o assistente KONEKTA
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
