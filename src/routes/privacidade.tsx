import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade — KONEKTA" },
      {
        name: "description",
        content:
          "Como a KONEKTA recolhe, utiliza e protege os dados pessoais de clientes e prestadores em STP.",
      },
      { property: "og:title", content: "Política de privacidade — KONEKTA" },
      {
        property: "og:description",
        content: "Como tratamos e protegemos os seus dados na KONEKTA.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://konekta-connect.lovable.app/privacidade" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://konekta-connect.lovable.app/privacidade" }],
  }),
  component: PrivacidadePage,
});

const seccoes = [
  {
    t: "Dados que recolhemos",
    d: "Nome, telefone, email, distrito e — no caso dos prestadores — documento de identificação e categoria profissional.",
  },
  {
    t: "Para que usamos",
    d: "Para ligar clientes e prestadores, processar pagamentos, prevenir fraude e melhorar a plataforma.",
  },
  {
    t: "Partilha de dados",
    d: "Partilhamos apenas o necessário com a contraparte do serviço (por exemplo, nome e morada de execução). Não vendemos dados a terceiros.",
  },
  {
    t: "Armazenamento",
    d: "Os dados são guardados enquanto a conta estiver ativa. Pode pedir a eliminação da conta a qualquer momento.",
  },
  {
    t: "Os seus direitos",
    d: "Pode aceder, corrigir, exportar ou apagar os seus dados através das definições do perfil ou contactando o suporte.",
  },
  {
    t: "Cookies e armazenamento local",
    d: "Usamos armazenamento local do dispositivo para manter a sessão e as suas preferências de utilização.",
  },
];

function PrivacidadePage() {
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
            <Lock size={13} />
            <span>Proteção de Dados</span>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Política de privacidade
          </h1>
          <p className="text-xs text-muted-foreground">Última atualização: 2026</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {seccoes.map((s) => (
            <section key={s.t} className="rounded-xl border border-border bg-card p-4">
              <h2 className="font-bold text-sm text-foreground">{s.t}</h2>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.d}</p>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
