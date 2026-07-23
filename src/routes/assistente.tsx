import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Sparkles, Send, Trash2, Zap } from "lucide-react";
import { store, useStore } from "@/lib/store";
import { AuthGate } from "@/components/AuthGate";
import { providers, categories } from "@/lib/konekta-data";

export const Route = createFileRoute("/assistente")({
  head: () => ({
    meta: [
      { title: "Assistente KONEKTA" },
      { name: "description", content: "Ajuda inteligente para os seus pedidos na KONEKTA." },
      { property: "og:title", content: "Assistente KONEKTA" },
      { property: "og:description", content: "Suporte técnico e ajuda com pedidos, 24/7." },
    ],
  }),
  component: AssistantPage,
});

const SUGGESTIONS = [
  "Preciso de um eletricista urgente",
  "Como funciona o pagamento?",
  "Quero cancelar um pedido",
  "Recomendar um canalizador",
];

function respond(prompt: string): string {
  const p = prompt.toLowerCase();

  // Category match
  const cat = categories.find((c) => p.includes(c.name.toLowerCase()) || p.includes(c.slug));
  if (cat) {
    const list = providers.filter((pr) => pr.category === cat.name);
    if (list.length) {
      const top = list.sort((a, b) => b.rating - a.rating)[0];
      return `Encontrei profissionais de ${cat.name} disponíveis.\n\n**${top.name}** ★ ${top.rating} (${top.reviews} avaliações) — a partir de ${top.priceFrom} Db.\n\n${top.bio}\n\nPosso ajudar a agendar já? Basta abrir o perfil do prestador em Início.`;
    }
    return `De momento não há prestadores de ${cat.name} listados. Vou notificar quando estiverem disponíveis.`;
  }

  if (/(pag|pagamento|carteira|dinheiro|dobra)/.test(p))
    return "O pagamento na KONEKTA é 100% seguro: o valor fica retido na sua carteira e o prestador só recebe após confirmar a conclusão do serviço. Pode carregar a carteira via MB WAY, transferência bancária ou dinheiro num agente.";

  if (/(cancel)/.test(p))
    return "Para cancelar um pedido: vá a Pedidos → toque no pedido → 'Cancelar'. Cancelamentos até 1h antes são gratuitos. Depois disso pode haver uma taxa de 10%.";

  if (/(urgen|agora|imediat|rápid)/.test(p))
    return "Pedidos urgentes são marcados com prioridade e enviados aos prestadores mais próximos. Recomendo indicar 'Urgente' ao criar o pedido — a resposta média é de 12 minutos.";

  if (/(preço|custo|quanto|tarifa)/.test(p))
    return "Os preços variam por categoria. Média em São Tomé: Eletricista 300-800 Db · Canalizador 250-700 Db · Limpeza 200-600 Db · Pintor 500-1500 Db. Todos os preços são visíveis antes de confirmar.";

  if (/(olá|oi|bom dia|boa tarde|boa noite)/.test(p))
    return "Olá! Sou o assistente KONEKTA. Posso ajudar a encontrar um profissional, explicar pagamentos, resolver problemas com pedidos ou tirar dúvidas. O que precisa?";

  if (/(obrig)/.test(p)) return "De nada! Estou aqui sempre que precisar. 🌿";

  return "Estou aqui para ajudar com pedidos, prestadores, pagamentos e problemas técnicos. Pode ser mais específico? Por exemplo: 'preciso de um canalizador em Trindade' ou 'como reembolso funciona?'.";
}

function AssistantPage() {
  const messages = useStore((s) => s.assistantMessages);
  const user = useStore((s) => s.user);
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
    const reply = respond(t);
    // simulate stream latency
    setTimeout(() => {
      store.sendAssistant(t, reply);
      setTyping(false);
    }, 700 + Math.random() * 500);
  }

  const empty = messages.length === 0;

  return (
    <AuthGate>
      <div className="min-h-screen bg-surface flex justify-center">
        <div className="w-full max-w-md min-h-screen flex flex-col">
          <header className="sticky top-0 z-10 bg-surface/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => navigate({ to: "/" })}
              className="size-9 rounded-full bg-card ring-1 ring-border grid place-items-center"
              aria-label="Voltar"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-gradient-to-br from-terracotta to-cocoa grid place-items-center">
                  <Sparkles size={14} className="text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">Assistente KONEKTA</p>
                  <p className="text-[11px] text-ocean leading-tight">Sempre disponível</p>
                </div>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => store.clearAssistant()}
                className="size-9 rounded-full bg-card ring-1 ring-border grid place-items-center text-muted-foreground"
                aria-label="Limpar"
              >
                <Trash2 size={14} />
              </button>
            )}
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {empty && (
              <div className="text-center py-8">
                <div className="size-16 mx-auto rounded-2xl bg-gradient-to-br from-terracotta via-terracotta to-cocoa grid place-items-center shadow-lg">
                  <Sparkles size={28} className="text-primary-foreground" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold bg-gradient-to-r from-terracotta to-cocoa bg-clip-text text-transparent">
                  Olá {user?.name?.split(" ")[0] ?? "amigo"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">Como posso ajudar hoje?</p>
              </div>
            )}

            {messages.map((m) =>
              m.from === "me" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-terracotta text-primary-foreground text-sm">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex gap-3">
                  <div className="size-8 rounded-lg bg-gradient-to-br from-terracotta to-cocoa grid place-items-center shrink-0">
                    <Sparkles size={14} className="text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{m.text}</p>
                  </div>
                </div>
              ),
            )}

            {typing && (
              <div className="flex gap-3">
                <div className="size-8 rounded-lg bg-gradient-to-br from-terracotta to-cocoa grid place-items-center shrink-0">
                  <Sparkles size={14} className="text-primary-foreground" />
                </div>
                <div className="flex gap-1 pt-3">
                  <span className="size-2 rounded-full bg-terracotta animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="size-2 rounded-full bg-terracotta animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="size-2 rounded-full bg-terracotta animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {empty && (
            <div className="px-4 pb-3 space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full flex items-center gap-2 bg-card ring-1 ring-border rounded-xl px-3 py-2.5 text-left text-sm hover:ring-terracotta/40 transition"
                >
                  <Zap size={14} className="text-terracotta shrink-0" />
                  <span className="flex-1">{s}</span>
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
            className="sticky bottom-0 bg-surface border-t border-border px-3 py-3 flex gap-2"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Pergunte ao assistente..."
              maxLength={500}
              className="flex-1 py-3 px-4 bg-card ring-1 ring-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40"
            />
            <button
              type="submit"
              disabled={!text.trim() || typing}
              className="size-11 rounded-full bg-gradient-to-br from-terracotta to-cocoa text-primary-foreground grid place-items-center disabled:opacity-40"
              aria-label="Enviar"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </AuthGate>
  );
}
