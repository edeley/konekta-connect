import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade — KONEKTA" },
      {
        name: "description",
        content: "Como a KONEKTA recolhe, utiliza e protege os dados pessoais de clientes e prestadores em STP.",
      },
      { property: "og:title", content: "Política de privacidade — KONEKTA" },
      { property: "og:description", content: "Como tratamos e protegemos os seus dados na KONEKTA." },
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
    <PublicLayout crumbs={[{ label: "Início", to: "/" }, { label: "Privacidade" }]}>
      <h1 className="text-3xl font-black tracking-tight text-foreground">Política de privacidade</h1>
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
