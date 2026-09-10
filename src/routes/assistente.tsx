import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
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
  Sparkles,
  Compass,
  Loader2,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";
import { AudioRecorderButton } from "@/components/konekta/AudioRecorderButton";
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
      text: `**Como Ser um Prestador Verificado KONEKTA:**\n\n1. Registe-se na app e ative a opção **Modo Prestador**.\n2. Submeta o seu Bilhete de Identidade (BI) e fotos dos seus trabalhos anteriores.\n3. Defina os distritos em que atende e os seus preços base.\n4. Receba pedidos com garantia de pagamento seguro em custódia.\n\nComissão justa de 10% por serviço concluído ou plano mensal sem comissões!`,
      actions: [
        { label: "Tornar-me Prestador Agora", link: "/tornar-prestador" },
        { label: "Ver Painel do Prestador", link: "/pro" },
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

type AssistantRole = "concierge" | "specialist" | "fast" | "maps";

function FormattedMessageText({ text }: { text: string }) {
  // Renderizador limpo de formatação sem dependências pesadas
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-xs leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Título Markdown (### ou ##)
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-bold text-foreground text-xs pt-1">
              {trimmed.replace("### ", "")}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={idx} className="font-bold text-foreground text-sm pt-1">
              {trimmed.replace("## ", "")}
            </h3>
          );
        }

        // Bullets (• ou - ou *)
        const isBullet =
          trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ");
        const content = isBullet ? trimmed.substring(2) : trimmed;

        // Processa negrito simples **palavra**
        const parts = content.split(/(\*\*.*?\*\*)/g);

        return (
          <div key={idx} className={isBullet ? "flex items-start gap-1.5 pl-1" : ""}>
            {isBullet && <span className="text-primary font-bold">•</span>}
            <span className="flex-1">
              {parts.map((part, pIdx) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return (
                    <strong key={pIdx} className="font-bold text-foreground">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return <span key={pIdx}>{part}</span>;
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function AssistantPage() {
  const messages = useStore((s) => s.assistantMessages);
  const user = useStore((s) => s.user);
  const orders = useStore((s) => s.orders);
  const technicalVisits = useStore((s) => s.technicalVisits);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (navigator.geolocation && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {
          // Fallback silencioso para centro de São Tomé
        },
        { timeout: 8000, enableHighAccuracy: false },
      );
    }
  }, [userLocation]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, typing]);

  async function send(prompt: string) {
    const t = prompt.trim();
    if (!t || typing) return;
    setText("");
    setTyping(true);

    const userContext = buildSanitizedUserContext({
      user,
      orders,
      technicalVisits,
    });

    // Detecção invisível e inteligente da especialidade de acordo com a dúvida do utilizador
    const lower = t.toLowerCase();
    let detectedRole: AssistantRole = "concierge";
    if (
      lower.includes("onde fica") ||
      lower.includes("onde comprar") ||
      lower.includes("loja") ||
      lower.includes("ferragem") ||
      lower.includes("materiais") ||
      lower.includes("oficina") ||
      lower.includes("estaleiro") ||
      lower.includes("mapa") ||
      lower.includes("distrito") ||
      lower.includes("perto de") ||
      lower.includes("localização")
    ) {
      detectedRole = "maps";
    } else if (
      lower.includes("avaria") ||
      lower.includes("disjuntor") ||
      lower.includes("fuga") ||
      lower.includes("bomba") ||
      lower.includes("ar condicionado") ||
      lower.includes("motor") ||
      lower.includes("curto") ||
      lower.includes("quadro") ||
      lower.includes("fio") ||
      lower.includes("cabo") ||
      lower.includes("infiltração") ||
      lower.includes("infiltracao") ||
      lower.includes("diagnostico") ||
      lower.includes("diagnóstico")
    ) {
      detectedRole = "specialist";
    } else if (
      lower.includes("quanto custa") ||
      lower.includes("preço") ||
      lower.includes("preco") ||
      lower.includes("taxa") ||
      lower.includes("tabela") ||
      lower.includes("urgente")
    ) {
      detectedRole = "fast";
    }

    // Constrói histórico multi-turn das últimas 8 mensagens
    const history = messages.slice(-8).map((m) => ({
      role: (m.from === "me" ? "user" : "model") as "user" | "model",
      text: m.text,
    }));

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: t,
          role: detectedRole,
          history,
          userContext,
          userLocation: userLocation || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        store.sendAssistant(t, data.text, {
          role: detectedRole,
          model: data.model,
          groundingPlaces: data.groundingPlaces,
          isMapsGrounded: data.isMapsGrounded,
          actionLink: data.actionLink,
        });
      } else {
        // Fallback para heurísticas locais se offline ou erro do servidor
        const fallback = generateConciergeResponse({ text: t, userContext });
        store.sendAssistant(t, fallback.text, {
          role: detectedRole,
          model: "KONEKTA Motor Local",
          actionLink: fallback.actions?.[0]
            ? {
                label: fallback.actions[0].label,
                url:
                  fallback.actions[0].link ||
                  (fallback.actions[0].phone ? `tel:${fallback.actions[0].phone}` : "/pedidos"),
              }
            : undefined,
        });
      }
    } catch {
      // Fallback local em caso de falha de rede
      const fallback = generateConciergeResponse({ text: t, userContext });
      store.sendAssistant(t, fallback.text, {
        role: detectedRole,
        model: "KONEKTA Motor Local",
        actionLink: fallback.actions?.[0]
          ? {
              label: fallback.actions[0].label,
              url:
                fallback.actions[0].link ||
                (fallback.actions[0].phone ? `tel:${fallback.actions[0].phone}` : "/pedidos"),
            }
          : undefined,
      });
    } finally {
      setTyping(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <AuthGate>
      <div className="min-h-screen bg-background flex justify-center">
        <div className="w-full max-w-lg min-h-screen flex flex-col border-x border-border/50">
          {/* Cabeçalho */}
          <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-4 py-3 shadow-2xs">
            <div className="flex items-center gap-3">
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
                      Apoio ao Cliente & Concierge
                    </p>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold leading-tight flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      Atendimento Oficial · São Tomé e Príncipe
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
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Banner de Linha Telefónica Local */}
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Phone size={14} />
                </div>
                <div>
                  <p className="font-bold text-foreground text-xs">Linha de Apoio Direto KONEKTA</p>
                  <p className="text-muted-foreground text-[10px]">
                    +239 994 4747 · Seg–Dom 07:30–20:00
                  </p>
                </div>
              </div>
              <a
                href="tel:+2399944747"
                className="px-2.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold shrink-0 hover:opacity-95 shadow-2xs transition"
              >
                Ligar
              </a>
            </div>

            {/* Contexto do Perfil e Pedidos Ativos do Utilizador */}
            {userContext.activeOrders && userContext.activeOrders.length > 0 && (
              <div className="rounded-2xl bg-muted/60 border border-border p-2.5 flex items-center justify-between text-xs shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-2 rounded-full bg-primary shrink-0 animate-pulse" />
                  <div className="truncate">
                    <span className="text-[11px] font-bold text-foreground">
                      Pedido Ativo: #{userContext.activeOrders[0].id}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1.5 truncate">
                      {userContext.activeOrders[0].serviceTitle} (
                      {userContext.activeOrders[0].status})
                    </span>
                  </div>
                </div>
                <Link
                  to={`/pedido/${userContext.activeOrders[0].id}`}
                  className="text-[10px] font-bold text-primary shrink-0 hover:underline flex items-center gap-0.5"
                >
                  <span>Acompanhar</span>
                  <ArrowRight size={10} />
                </Link>
              </div>
            )}

            {empty && (
              <div className="text-center py-3 space-y-4">
                <div className="size-14 mx-auto rounded-2xl bg-card border border-border grid place-items-center shadow-xs text-primary">
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <h2 className="text-base font-black text-foreground">
                    Como podemos ajudar hoje?
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                    Esclareça dúvidas sobre agendamentos, segurança de pagamentos em custódia,
                    garantia técnica de 30 dias ou materiais em São Tomé.
                  </p>
                </div>

                <div className="space-y-2 text-left pt-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                    Perguntas Frequentes
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      "Como funciona o pagamento protegido em custódia (escrow)?",
                      "Qual a garantia de 30 dias oferecida pela plataforma?",
                      "Como validar a conclusão do serviço com o código PIN?",
                      "O que fazer se o serviço pretendido não tem prestador ativo?",
                      "Onde encontrar materiais de construção ou ferragens em São Tomé?",
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => send(prompt)}
                        className="w-full rounded-2xl bg-card border border-border/80 p-2.5 text-left text-xs font-semibold text-foreground hover:border-primary/60 hover:bg-muted/40 transition-all shadow-2xs flex items-center justify-between group cursor-pointer"
                      >
                        <span>{prompt}</span>
                        <Sparkles
                          size={12}
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
              const responseData = !isUser ? generateIntelligentResponse(m.text) : null;

              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="size-7 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0 text-xs font-bold mt-1 shadow-2xs">
                      K
                    </div>
                  )}
                  <div className={`space-y-2 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        isUser
                          ? "bg-primary text-primary-foreground font-medium rounded-tr-xs"
                          : "bg-card border border-border/80 text-foreground rounded-tl-xs shadow-2xs"
                      }`}
                    >
                      <FormattedMessageText text={m.text} />

                      {/* Hora do Envio */}
                      {!isUser && (
                        <div className="mt-2 pt-1.5 border-t border-border/40 flex items-center justify-end text-[10px] text-muted-foreground">
                          <span>
                            {new Date(m.at).toLocaleTimeString("pt-PT", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Google Maps Grounding: Locais Encontrados com Links Obrigatórios */}
                    {!isUser && m.groundingPlaces && m.groundingPlaces.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                          <MapPin size={13} className="text-red-500" />
                          <span>Locais encontrados no Google Maps STP:</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {m.groundingPlaces.map((place, pIdx) => (
                            <div
                              key={pIdx}
                              className="rounded-xl bg-card border border-border p-2.5 text-xs shadow-2xs space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-bold text-foreground">{place.title}</p>
                                {place.uri && (
                                  <a
                                    href={place.uri}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 transition shrink-0"
                                  >
                                    <span>Ver no Mapa</span>
                                    <ExternalLink size={10} />
                                  </a>
                                )}
                              </div>
                              {place.snippet && (
                                <p className="text-[11px] text-muted-foreground leading-snug">
                                  {place.snippet}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ação Direta Recomendada pelo Assistente Inteligente */}
                    {!isUser && m.actionLink && (
                      <div className="pt-1">
                        {m.actionLink.url.startsWith("tel:") ? (
                          <a
                            href={m.actionLink.url}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-2xs hover:opacity-95 transition"
                          >
                            <Phone size={13} />
                            <span>{m.actionLink.label}</span>
                          </a>
                        ) : (
                          <Link
                            to={m.actionLink.url}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-2xs hover:opacity-95 transition"
                          >
                            <Sparkles size={13} />
                            <span>{m.actionLink.label}</span>
                            <ArrowRight size={13} />
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Botões de Ação Dinâmica Rápidas */}
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
                                <Phone size={11} />
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
                                <ExternalLink size={11} />
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
                <div className="size-7 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0 text-xs font-bold shadow-2xs">
                  K
                </div>
                <div className="bg-card border border-border rounded-2xl px-3.5 py-2 rounded-tl-xs flex items-center gap-2 shadow-2xs text-xs">
                  <Loader2 size={13} className="animate-spin text-primary" />
                  <span>A preparar resposta...</span>
                </div>
              </div>
            )}
          </div>

          {/* Campo de Entrada de Mensagem com Gravação de Voz via Gemini 3.5 Transcribe */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
            className="p-3 bg-card border-t border-border flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escreva a sua dúvida ou descreva a assistência que precisa..."
                className="w-full rounded-xl bg-muted/60 border border-border/80 pl-3.5 pr-11 py-2.5 text-xs text-foreground outline-none focus:border-primary transition"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                <AudioRecorderButton
                  onTranscription={(transcribed) => {
                    setText((prev) => (prev ? `${prev} ${transcribed}` : transcribed));
                    toast.success("Voz transcrita!");
                  }}
                  promptContext="Pergunta de assistência, orçamento, garantia ou serviços na plataforma KONEKTA em São Tomé e Príncipe"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!text.trim() || typing}
              className="size-10 rounded-xl bg-primary text-primary-foreground grid place-items-center disabled:opacity-50 transition active:scale-95 shadow-2xs cursor-pointer shrink-0"
              title="Enviar mensagem"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </AuthGate>
  );
}
