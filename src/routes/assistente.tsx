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
  Sparkles,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { store, useStore } from "@/lib/store";
import { AuthGate } from "@/components/AuthGate";
import { providers, categories } from "@/lib/konekta-data";

export const Route = createFileRoute("/assistente")({
  head: () => ({
    meta: [
      { title: "Apoio & Concierge · KONEKTA STP" },
      {
        name: "description",
        content: "Atendimento e apoio local para os seus pedidos na KONEKTA São Tomé.",
      },
      { property: "og:title", content: "Apoio KONEKTA STP" },
      {
        property: "og:description",
        content: "Apoio ao cliente, garantia de serviços e mediação em São Tomé e Príncipe.",
      },
    ],
  }),
  component: AssistantPage,
});

const SUGGESTIONS = [
  "Preciso de um eletricista urgente em São Tomé",
  "Como funciona o pagamento protegido?",
  "Como cancelar um pedido e receber reembolso?",
  "Quero falar com um atendente humano",
];

function respond(text: string): string {
  const lower = text.toLowerCase();

  for (const cat of categories) {
    if (lower.includes(cat.name.toLowerCase()) || lower.includes(cat.slug)) {
      const match = providers.filter((p) => p.category === cat.name);
      if (match.length > 0) {
        const names = match.map((p) => `${p.name} (⭐ ${p.rating})`).join(", ");
        return `Encontrei profissionais recomendados e verificados em ${cat.name}: ${names}. Pode contactá-los diretamente através do perfil deles na app ou publicar um pedido aberto com o seu horário desejado.`;
      }
    }
  }

  if (lower.includes("cancelar") || lower.includes("reembolso") || lower.includes("cancelamento")) {
    return "Pode cancelar um pedido com reembolso total antes do início da execução na secção 'Meus Pedidos'. Se o serviço já tiver iniciado e houver desacordo, a nossa equipa de mediação intervém para assegurar a justiça para ambas as partes.";
  }

  if (
    lower.includes("pagamento") ||
    lower.includes("pagar") ||
    lower.includes("dobra") ||
    lower.includes("custodia") ||
    lower.includes("custódia") ||
    lower.includes("carteira")
  ) {
    return "Na KONEKTA, o seu dinheiro está 100% seguro: quando contrata, o valor fica retido na plataforma em custódia. O prestador só recebe quando você confirmar que o serviço foi concluído e aprovado. Aceitamos DobraPay, transferência BISTP/BGFI e dinheiro através de agentes autorizados.";
  }

  if (lower.includes("garantia") || lower.includes("seguranca") || lower.includes("segurança")) {
    return "Todos os prestadores na KONEKTA têm Identidade (BI) e Alvará/NIF verificados. Oferecemos 7 dias de garantia após a conclusão de cada serviço para garantir que não há defeitos ocultos.";
  }

  if (
    lower.includes("humano") ||
    lower.includes("whatsapp") ||
    lower.includes("telefone") ||
    lower.includes("contacto") ||
    lower.includes("falar")
  ) {
    return "A nossa equipa de apoio em São Tomé está disponível diariamente das 07:30 às 20:00. Pode ligar ou enviar mensagem por WhatsApp para o número oficial: +239 994 4747, ou dirigir-se ao nosso ponto de atendimento no centro da cidade de São Tomé.";
  }

  return "Olá! Sou o assistente de apoio KONEKTA em São Tomé. Posso ajudá-lo a encontrar técnicos qualificados, esclarecer dúvidas sobre pagamentos e garantia de serviços, ou encaminhá-lo para a nossa equipa de atendimento.";
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
    setTimeout(
      () => {
        store.sendAssistant(t, reply);
        setTyping(false);
      },
      650 + Math.random() * 350,
    );
  }

  const empty = messages.length === 0;

  return (
    <AuthGate>
      <div className="min-h-screen bg-background flex justify-center">
        <div className="w-full max-w-md min-h-screen flex flex-col">
          <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3 shadow-2xs">
            <button
              onClick={() => navigate({ to: "/" })}
              className="size-9 rounded-full bg-muted grid place-items-center text-foreground hover:bg-muted/80 transition"
              aria-label="Voltar"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-2xs">
                  <Headphones size={15} />
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight text-foreground">
                    Apoio KONEKTA STP
                  </p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold leading-tight flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    Atendimento Local Activo
                  </p>
                </div>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => store.clearAssistant()}
                className="size-9 rounded-full bg-muted grid place-items-center text-muted-foreground hover:text-destructive transition"
                aria-label="Limpar histórico"
                title="Limpar histórico"
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
                  <p className="font-bold text-foreground">Atendimento Humano em STP</p>
                  <p className="text-muted-foreground text-[11px]">
                    Seg–Dom · 07:30 às 20:00 (GMT)
                  </p>
                </div>
              </div>
              <a
                href="tel:+2399944747"
                className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shrink-0 hover:opacity-95 shadow-2xs"
              >
                Ligar (+239)
              </a>
            </div>

            {empty && (
              <div className="text-center py-6">
                <div className="size-14 mx-auto rounded-2xl bg-card border border-border grid place-items-center shadow-xs">
                  <ShieldCheck size={26} className="text-primary" />
                </div>
                <h2 className="mt-3 text-lg font-black text-foreground">
                  Como podemos ajudar, {user?.name?.split(" ")[0] ?? "Cliente"}?
                </h2>
                <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
                  Tire dúvidas sobre orçamentos, segurança de pagamento ou encontre os melhores
                  profissionais para o seu serviço.
                </p>

                <div className="mt-5 space-y-2 text-left">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                    Perguntas Frequentes
                  </p>
                  <div className="space-y-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="w-full rounded-2xl bg-card border border-border/80 p-3 text-left text-xs font-semibold text-foreground hover:border-primary/50 transition-all shadow-2xs"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.from === "me" ? "justify-end" : "justify-start"}`}
              >
                {m.from === "ai" && (
                  <div className="size-7 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0 text-xs font-bold mt-1">
                    K
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-2.5 max-w-[82%] text-xs leading-relaxed ${
                    m.from === "me"
                      ? "bg-primary text-primary-foreground font-medium rounded-tr-xs"
                      : "bg-card border border-border/80 text-foreground font-normal rounded-tl-xs shadow-2xs"
                  }`}
                >
                  <p>{m.text}</p>
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex gap-2.5 items-center text-xs text-muted-foreground">
                <div className="size-7 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0 text-xs font-bold">
                  K
                </div>
                <div className="bg-card border border-border rounded-2xl px-3.5 py-2 rounded-tl-xs flex items-center gap-1 shadow-2xs">
                  <span className="size-1.5 rounded-full bg-primary/60 animate-bounce" />
                  <span className="size-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
                  <span className="size-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

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
              placeholder="Escreva a sua dúvida ou pedido de ajuda..."
              className="flex-1 rounded-xl bg-muted/60 border border-border/80 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={!text.trim() || typing}
              className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center disabled:opacity-50 transition active:scale-95 shadow-2xs"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </AuthGate>
  );
}
