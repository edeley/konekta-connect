import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { KonektaCalculator } from "@/components/konekta/KonektaCalculator";

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
  {
    t: "Criar conta",
    d: "Leva 30 segundos: nome, telefone e código de verificação SMS sem burocracias.",
    num: "1",
  },
  {
    t: "Publicar ou procurar",
    d: "Descreva o que precisa com fotos/áudio ou selecione diretamente no catálogo de especialidades.",
    num: "2",
  },
  {
    t: "Escolher o profissional",
    d: "Compare orçamentos detalhados, avaliações verificadas e tempo de resposta.",
    num: "3",
  },
  {
    t: "Agendamento e Proteção",
    d: "Escolha o dia e hora. O valor fica retido com segurança em garantia (escrow) até a conclusão.",
    num: "4",
  },
  {
    t: "Execução do Serviço",
    d: "O profissional desloca-se até ao local indicado e executa a intervenção técnica.",
    num: "5",
  },
  {
    t: "Validação e Avaliação",
    d: "Confirme a conclusão com o código de validação, libertando o pagamento e avaliando a qualidade.",
    num: "6",
  },
];

function ComoFuncionaPage() {
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
            <ShieldCheck size={13} />
            <span>Processo 100% Protegido</span>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Como funciona a KONEKTA
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Da solicitação à conclusão do serviço: transparência total, sem chamadas invasivas e com
            pagamento retido até sua aprovação.
          </p>
        </div>

        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {passos.map((p) => (
            <li key={p.t} className="flex gap-3.5 rounded-xl border border-border bg-card p-4">
              <span
                className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-black text-primary border border-primary/15"
                aria-hidden="true"
              >
                {p.num}
              </span>
              <div className="min-w-0">
                <h2 className="font-bold text-sm text-foreground">{p.t}</h2>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{p.d}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* Simulador Interativo KONEKTA */}
        <div className="pt-2">
          <h2 className="text-base font-bold text-foreground mb-1">
            Transparência Total nos Preços
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Veja como funciona a divisão do valor pago e a proteção de custódia em São Tomé e
            Príncipe.
          </p>
          <KonektaCalculator
            initialTotal={500}
            editable={true}
            isClientView={true}
            showSubtitle={true}
          />
        </div>

        <div className="pt-2 flex flex-wrap gap-3">
          <Link
            to="/novo-pedido"
            className="press rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-brand-dark transition"
          >
            Solicitar Serviço Agora
          </Link>
          <Link
            to="/ajuda"
            className="press rounded-xl px-4 py-2.5 text-xs font-bold text-foreground border border-border bg-card hover:bg-muted transition"
          >
            Perguntas Frequentes
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
