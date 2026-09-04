import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Send,
  Trash2,
  Headphones,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Wrench,
  AlertTriangle,
  Wallet,
  Calendar,
  X,
  User,
  Star,
  Zap,
} from "lucide-react";
import { store, useStore, type AssistantMessage } from "@/lib/store";
import { AuthGate } from "@/components/AuthGate";
import { providers, categories, getProvider } from "@/lib/konekta-data";
import { findSTPZoneByName, STP_DISTRICTS } from "@/lib/stp-geo";
import { formatDb } from "@/lib/catalog";
import { buildSanitizedUserContext } from "@/lib/chat-specialist-context";
import { generateConciergeResponse } from "@/lib/specialist-ai";

export const Route = createFileRoute("/assistente")({
  head: () => ({
    meta: [
      { title: "Apoio & Concierge · KONEKTA STP" },
      {
        name: "description",
        content:
          "Atendimento e apoio local inteligente para os seus pedidos na KONEKTA São Tomé e Príncipe.",
      },
      { property: "og:title", content: "Apoio KONEKTA STP" },
      {
        name: "og:description",
        content:
          "Apoio ao cliente, garantia de serviços, cancelamentos e mediação em São Tomé e Príncipe.",
      },
    ],
  }),
  component: AssistantPage,
});

interface ActionSuggestion {
  label: string;
  link?: string;
  phone?: string;
  action?: () => void;
}

interface AssistantResponse {
  text: string;
  actions?: ActionSuggestion[];
}

const QUICK_PROMPTS = [
  "Preciso de um eletricista urgente em São Tomé",
  "Como cancelar um serviço e quais são os riscos?",
  "Como funciona o pagamento protegido e o PIN?",
  "Quanto custa reparar um ar condicionado ou fuga?",
  "Prestadores que atendem em Mé-Zóchi ou Trindade",
  "Falar com um atendente humano por telefone",
];

function generateIntelligentResponse(text: string): AssistantResponse {
  const lower = text.toLowerCase().trim();

  // 1. Cancelamento e Riscos
  if (
    lower.includes("cancelar") ||
    lower.includes("cancelamento") ||
    lower.includes("desistir") ||
    lower.includes("reembolso") ||
    lower.includes("devolução")
  ) {
    return {
      text: `**Regras e Riscos de Cancelamento KONEKTA STP:**\n\n1. **Antes do início**: Pode cancelar a qualquer momento sem qualquer penalização. O valor retido em custódia volta 100% à sua Carteira Digital KONEKTA.\n2. **Prestador a caminho ou no local**: Se o prestador já iniciou a deslocação, poderá ser aplicada a taxa de deslocação acordada (mínimo 150 STN) para custear o transporte e combustível no distrito.\n3. **Garantia**: Ao cancelar um serviço, a reserva de horário e a garantia técnica de 30 dias deixam de estar ativas.\n\nPara cancelar um pedido ativo, aceda ao separador **Meus Pedidos** ou clique diretamente no botão abaixo.`,
      actions: [
        { label: "Ver Meus Pedidos Ativos", link: "/pedidos" },
        { label: "Falar com Apoio (+239)", phone: "+2399944747" },
      ],
    };
  }

  // 2. Pagamento Protegido, PIN e Custódia
  if (
    lower.includes("pagamento") ||
    lower.includes("pagar") ||
    lower.includes("custodia") ||
    lower.includes("custódia") ||
    lower.includes("seguro") ||
    lower.includes("pin") ||
    lower.includes("codigo") ||
    lower.includes("código") ||
    lower.includes("dobrapay") ||
    lower.includes("bistp") ||
    lower.includes("bgfi")
  ) {
    return {
      text: `**Como Funciona o Pagamento Seguro KONEKTA:**\n\n• **Custódia Garantida (Escrow)**: Quando aceita um orçamento, o montante fica retido em segurança pela plataforma.\n• **Código Secreto PIN de 4 Dígitos**: O prestador só recebe os fundos após terminar o trabalho e quando você validar o seu PIN secreto.\n• **Métodos Aceites em STP**: DobraPay, Transferência Bancária direta (BISTP, BGFI, Afriland, Banco Internacional) e Dinheiro Presencial registado via Agentes KONEKTA.\n• **Sem Riscos de Burlas**: Nunca pague adiantado por fora da app sem comprovativo digital.`,
      actions: [
        { label: "Minha Carteira Digital", link: "/carteira" },
        { label: "Como Funciona o App", link: "/como-funciona" },
      ],
    };
  }

  // 3. Preços e Valores Médios de Referência em São Tomé
  if (
    lower.includes("quanto custa") ||
    lower.includes("preço") ||
    lower.includes("preco") ||
    lower.includes("valor") ||
    lower.includes("tabela") ||
    lower.includes("tarifa")
  ) {
    return {
      text: `**Preços de Referência do Mercado em São Tomé (STN):**\n\n• **Eletricidade**: Reparação de curto-circuito/disjuntor: ~250–500 STN | Instalação completa: ~800–2.000 STN\n• **Canalização**: Desentupimento/Fuga simples: ~200–450 STN | Substituição de bomba de água: ~600–1.200 STN\n• **Climatização / Frio**: Carga de gás e limpeza de AC: ~450–900 STN\n• **Pintura e Obras**: ~350–800 STN/dia ou por metro quadrado\n• **Taxa Mínima de Deslocação / Diagnóstico Presencial**: 150 STN.\n\nPode publicar um pedido aberto gratuitamente para receber várias propostas com orçamentos concorrentes!`,
      actions: [
        { label: "Publicar Novo Pedido", link: "/novo-pedido" },
        { label: "Ver Profissionais", link: "/pro/oportunidades" },
      ],
    };
  }

  // 4. Distritos e Localização em STP (Água Grande, Mé-Zóchi, Lobata, Cantagalo, Lembá, Caué, Príncipe)
  const matchedDistrict = STP_DISTRICTS.find(
    (d) => lower.includes(d.name.toLowerCase()) || lower.includes(d.capital.toLowerCase()),
  );

  if (
    matchedDistrict ||
    lower.includes("trindade") ||
    lower.includes("santana") ||
    lower.includes("neves") ||
    lower.includes("guadalupe") ||
    lower.includes("angolares") ||
    lower.includes("principe") ||
    lower.includes("príncipe")
  ) {
    const distName = matchedDistrict?.name || "São Tomé e Príncipe";
    return {
      text: `**Cobertura KONEKTA em ${distName}:**\n\nTemos dezenas de técnicos verificados com GPS ativo que atendem no Distrito de ${distName} e localidades vizinhas.\n\nO sistema calcula automaticamente a distância do prestador até ao seu local exato para garantir que não há atrasos ou cobranças abusivas de combustível.`,
      actions: [
        { label: `Encontrar Prestadores em ${distName}`, link: "/novo-pedido" },
        { label: "Ver Todos os Serviços", link: "/" },
      ],
    };
  }

  // 5. Profissões / Categorias Específicas
  for (const cat of categories) {
    if (
      lower.includes(cat.name.toLowerCase()) ||
      lower.includes(cat.slug) ||
      (cat.name === "Canalização" &&
        (lower.includes("canalizador") ||
          lower.includes("água") ||
          lower.includes("fuga") ||
          lower.includes("cano"))) ||
      (cat.name === "Eletricidade" &&
        (lower.includes("eletricista") ||
          lower.includes("luz") ||
          lower.includes("quadro") ||
          lower.includes("curto"))) ||
      (cat.name === "Climatização" &&
        (lower.includes("ar condicionado") ||
          lower.includes("ac") ||
          lower.includes("frio") ||
          lower.includes("frigorífico"))) ||
      (cat.name === "Pintura" &&
        (lower.includes("pintor") || lower.includes("tinta") || lower.includes("verniz"))) ||
      (cat.name === "Construção" &&
        (lower.includes("pedreiro") ||
          lower.includes("cimento") ||
          lower.includes("obra") ||
          lower.includes("tijolo"))) ||
      (cat.name === "Carpintaria" &&
        (lower.includes("carpinteiro") ||
          lower.includes("madeira") ||
          lower.includes("porta") ||
          lower.includes("móvel"))) ||
      (cat.name === "Limpeza" &&
        (lower.includes("limpar") || lower.includes("doméstica") || lower.includes("faxina"))) ||
      (cat.name === "Mecânica" &&
        (lower.includes("mecânico") ||
          lower.includes("carro") ||
          lower.includes("motor") ||
          lower.includes("travões")))
    ) {
      const matchingProviders = providers.filter((p) => p.category === cat.name);
      const topPros = matchingProviders.slice(0, 3);
      const prosList = topPros
        .map(
          (p) =>
            `• **${p.name}** (${p.district || "São Tomé"}) · ⭐ ${p.rating} (${p.reviewsCount || p.reviews} avaliações)`,
        )
        .join("\n");

      return {
        text: `**Profissionais Recomendados em ${cat.name}:**\n\n${prosList}\n\nTodos possuem Identidade (BI) validada e garantia KONEKTA. Deseja solicitar um orçamento ou abrir um pedido aberto para receber propostas imediatas?`,
        actions: [
          { label: `Pedir Serviço de ${cat.name}`, link: "/novo-pedido" },
          { label: "Ver Lista de Prestadores", link: "/" },
        ],
      };
    }
  }

  // 6. Falar com Atendimento Humano / Telefone STP
  if (
    lower.includes("humano") ||
    lower.includes("atendente") ||
    lower.includes("pessoa") ||
    lower.includes("telefone") ||
    lower.includes("whatsapp") ||
    lower.includes("contacto") ||
    lower.includes("ligar") ||
    lower.includes("escritorio") ||
    lower.includes("escritório")
  ) {
    return {
      text: `**Centro de Atendimento Oficial KONEKTA São Tomé:**\n\n• **Linha Direta STP**: +239 994 4747\n• **Horário de Apoio**: Segunda a Domingo, das 07:30 às 20:00 (GMT)\n• **WhatsApp de Emergência**: +239 994 4747\n• **Gabinete de Mediação**: Cidade de São Tomé (Água Grande).\n\nPode ligar imediatamente clicando no botão abaixo:`,
      actions: [
        { label: "Ligar Linha STP (+239 994 4747)", phone: "+2399944747" },
        { label: "Ver Perguntas Frequentes", link: "/como-funciona" },
      ],
    };
  }

  // 7. Tornar-se Prestador PRO / Registo de Profissional
  if (
    lower.includes("trabalhar") ||
    lower.includes("tornar prestador") ||
    lower.includes("cadastrar como tecnico") ||
    lower.includes("ganhar dinheiro") ||
    lower.includes("ser prestador") ||
    lower.includes("comissão") ||
    lower.includes("comissao")
  ) {
    return {
      text: `**Como Ser um Prestador Verificado KONEKTA PRO:**\n\n1. Registe-se na app e ative a opção **Modo Prestador**.\n2. Submeta o seu Bilhete de Identidade (BI) e fotos dos seus trabalhos anteriores.\n3. Defina os distritos em que atende e os seus preços base.\n4. Receba pedidos com garantia de pagamento seguro em custódia.\n\nComissão justa de 10% por serviço concluído ou plano mensal sem comissões!`,
      actions: [
        { label: "Tornar-me Prestador Agora", link: "/tornar-prestador" },
        { label: "Ver Painel PRO", link: "/pro" },
      ],
    };
  }

  // 8. Cumprimentos e Saudações
  if (
    lower === "olá" ||
    lower === "ola" ||
    lower === "bom dia" ||
    lower === "boa tarde" ||
    lower === "boa noite" ||
    lower === "oi"
  ) {
    return {
      text: `Olá! Seja bem-vindo ao **Apoio & Concierge KONEKTA São Tomé e Príncipe** 🇸🇹.\n\nComo posso ajudá-lo hoje? Posso:\n• Encontrar eletricistas, canalizadores, mecânicos ou técnicos na sua zona\n• Ajudar a cancelar ou reagendar um pedido ativo\n• Explicar como funciona o pagamento seguro em custódia e o código PIN\n• Conectar com a nossa linha de apoio telefónico oficial`,
      actions: [
        { label: "Publicar Pedido de Serviço", link: "/novo-pedido" },
        { label: "Ver Meus Pedidos", link: "/pedidos" },
        { label: "Ligar para Apoio (+239)", phone: "+2399944747" },
      ],
    };
  }

  // Fallback Inteligente Contextual
  return {
    text: `Compreendo. Na **KONEKTA STP**, garantimos que qualquer contratação de serviço em São Tomé e Príncipe é rápida, segura e com garantia técnica de 30 dias.\n\nPode descrever com mais detalhes o problema que pretende resolver (ex: "torneira a vazar em Água Grande", "disjuntor que disparou", "como funciona a garantia"), ou escolher uma das opções rápidas abaixo:`,
    actions: [
      { label: "Abrir Pedido de Serviço", link: "/novo-pedido" },
      { label: "Ver Pedidos Ativos", link: "/pedidos" },
      { label: "Ligar para o Apoio Local", phone: "+2399944747" },
    ],
  };
}

function AssistantPage() {
  const messages = useStore((s) => s.assistantMessages);
  const user = useStore((s) => s.user);
  const orders = useStore((s) => s.orders);
  const technicalVisits = useStore((s) => s.technicalVisits);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, typing]);

  function send(prompt: string) {
    const t = prompt.trim();
    if (!t) return;
    setText("");
    setTyping(true);

    // Constrói contexto seguro do utilizador (todas as informações EXCLUINDO documentos)
    const userContext = buildSanitizedUserContext({
      user,
      orders,
      technicalVisits,
    });

    const response = generateConciergeResponse({ text: t, userContext });

    setTimeout(
      () => {
        store.sendAssistant(t, response.text);
        setTyping(false);
      },
      600 + Math.random() * 400,
    );
  }

  const empty = messages.length === 0;

  return (
    <AuthGate>
      <div className="min-h-screen bg-background flex justify-center">
        <div className="w-full max-w-lg min-h-screen flex flex-col border-x border-border/50">
          {/* Cabeçalho */}
          <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3 shadow-2xs">
            <button
              onClick={() => navigate({ to: "/" })}
              className="size-9 rounded-full bg-muted grid place-items-center text-foreground hover:bg-muted/80 transition cursor-pointer"
              aria-label="Voltar"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-2xs">
                  <Headphones size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight text-foreground">
                    Apoio & Concierge KONEKTA
                  </p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold leading-tight flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    Atendimento Local São Tomé
                  </p>
                </div>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => store.clearAssistant()}
                className="size-9 rounded-full bg-muted grid place-items-center text-muted-foreground hover:text-destructive transition cursor-pointer"
                aria-label="Limpar histórico"
                title="Limpar conversa"
              >
                <Trash2 size={14} />
              </button>
            )}
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {/* Banner de Contacto Direto Humano */}
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="font-bold text-foreground">Linha Oficial São Tomé</p>
                  <p className="text-muted-foreground text-[11px]">
                    +239 994 4747 · Seg–Dom 07:30–20:00
                  </p>
                </div>
              </div>
              <a
                href="tel:+2399944747"
                className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shrink-0 hover:opacity-95 shadow-2xs transition"
              >
                Ligar Agora
              </a>
            </div>

            {empty && (
              <div className="text-center py-4 space-y-4">
                <div className="size-14 mx-auto rounded-2xl bg-card border border-border grid place-items-center shadow-xs text-primary">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-foreground">
                    Olá, {user?.name?.split(" ")[0] ?? "Cliente"}! Como podemos ajudar?
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                    Tire dúvidas sobre orçamentos, cancelamentos com segurança, pagamentos em
                    custódia ou encontre profissionais verificados em todos os distritos de STP.
                  </p>
                </div>

                <div className="space-y-2 text-left pt-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                    Dúvidas Rápidas e Frequentes
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => send(prompt)}
                        className="w-full rounded-2xl bg-card border border-border/80 p-3 text-left text-xs font-semibold text-foreground hover:border-primary/60 hover:bg-muted/40 transition-all shadow-2xs flex items-center justify-between group cursor-pointer"
                      >
                        <span>{prompt}</span>
                        <Zap
                          size={13}
                          className="text-muted-foreground group-hover:text-primary transition shrink-0 ml-2"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mensagens da Conversa */}
            {messages.map((m) => {
              const isUser = m.from === "me";
              // Se for resposta da app, geramos ações contextuais rápidas
              const responseData = !isUser ? generateIntelligentResponse(m.text) : null;

              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="size-8 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0 text-xs font-bold mt-1 shadow-2xs">
                      K
                    </div>
                  )}
                  <div
                    className={`space-y-2.5 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        isUser
                          ? "bg-primary text-primary-foreground font-medium rounded-tr-xs"
                          : "bg-card border border-border/80 text-foreground rounded-tl-xs shadow-2xs whitespace-pre-line"
                      }`}
                    >
                      <p>{m.text}</p>
                    </div>

                    {/* Botões de Ação Dinâmica */}
                    {!isUser && responseData?.actions && responseData.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {responseData.actions.map((act) => {
                          if (act.phone) {
                            return (
                              <a
                                key={act.label}
                                href={`tel:${act.phone}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold shadow-2xs hover:opacity-90 transition"
                              >
                                <Phone size={12} />
                                <span>{act.label}</span>
                              </a>
                            );
                          }
                          if (act.link) {
                            return (
                              <Link
                                key={act.label}
                                to={act.link}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-[11px] font-bold border border-border transition"
                              >
                                <ExternalLink size={12} />
                                <span>{act.label}</span>
                              </Link>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {typing && (
              <div className="flex gap-2.5 items-center text-xs text-muted-foreground">
                <div className="size-8 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0 text-xs font-bold shadow-2xs">
                  K
                </div>
                <div className="bg-card border border-border rounded-2xl px-4 py-2.5 rounded-tl-xs flex items-center gap-1.5 shadow-2xs">
                  <span className="size-2 rounded-full bg-primary/60 animate-bounce" />
                  <span className="size-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
                  <span className="size-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Campo de Entrada de Mensagem */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
            className="p-3 bg-card border-t border-border flex items-center gap-2"
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva a sua dúvida, problema ou pedido..."
              className="flex-1 rounded-xl bg-muted/60 border border-border/80 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary transition"
            />
            <button
              type="submit"
              disabled={!text.trim() || typing}
              className="size-10 rounded-xl bg-primary text-primary-foreground grid place-items-center disabled:opacity-50 transition active:scale-95 shadow-2xs cursor-pointer"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </AuthGate>
  );
}
