import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Lock, Phone, MapPin, Send, ShieldAlert, ShieldCheck, Tag } from "lucide-react";
import { getProvider } from "@/lib/konekta-data";
import { store, useStore } from "@/lib/store";
import { AuthGate } from "@/components/AuthGate";
import { QuoteCard } from "@/components/konekta/QuoteCard";
import { QuoteComposer } from "@/components/konekta/QuoteComposer";
import { toast } from "sonner";

export const Route = createFileRoute("/chat/$id")({
  head: ({ params }) => {
    const p = getProvider(params.id);
    return {
      meta: [
        { title: p ? `${p.name} · Conversa · KONEKTA` : "Conversa · KONEKTA" },
        { name: "description", content: "Conversa protegida dentro da plataforma KONEKTA." },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center p-8 text-center">
      <div>
        <h1 className="text-xl font-semibold">Conversa não encontrada</h1>
        <Link to="/chat" className="mt-4 inline-block text-primary font-medium">
          Ver conversas
        </Link>
      </div>
    </div>
  ),
  component: ChatDetail,
});

function ChatDetail() {
  const { id } = Route.useParams();
  const provider = getProvider(id);
  const messages = useStore((s) => s.messages[id] ?? []);
  const balance = useStore((s) => s.balance);
  const role = useStore((s) => s.user?.role ?? "cliente");
  const router = useRouter();
  const [text, setText] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isClient = role !== "prestador";
  const unlocked = useMemo(
    () => messages.some((m) => m.quote && (m.quote.status === "pago" || m.quote.status === "concluido")),
    [messages],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  if (!provider) return null;

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const result = store.sendMessage(id, text);
    if (result === "blocked") {
      toast.error("Mensagem bloqueada", {
        description: "Contactos externos só são liberados após a confirmação do serviço.",
      });
    }
    if (result !== "empty") setText("");
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-surface flex justify-center">
        <div className="w-full max-w-md min-h-screen flex flex-col">
          <header className="sticky top-0 z-10 bg-card/95 backdrop-blur ring-1 ring-border px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => router.history.back()}
              className="size-9 rounded-full bg-muted grid place-items-center"
              aria-label="Voltar"
            >
              <ArrowLeft size={16} />
            </button>
            <img src={provider.image} alt={provider.name} className="size-10 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{provider.name}</p>
              <p className="text-[11px] text-primary">{provider.category}</p>
            </div>
          </header>

          <div className="px-4 mt-3">
            {unlocked ? (
              <div className="rounded-2xl bg-success/10 px-3 py-2.5 text-[11px] text-success space-y-1">
                <p className="flex items-center gap-2 font-semibold">
                  <ShieldCheck size={14} /> Contactos desbloqueados
                </p>
                <p className="flex items-center gap-2 text-foreground/80">
                  <Phone size={12} /> +239 991 22 33
                </p>
                <p className="flex items-center gap-2 text-foreground/80">
                  <MapPin size={12} /> Rua de Angola, Água Grande, São Tomé
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-warning/10 px-3 py-2 flex items-center gap-2 text-[11px] text-warning">
                <Lock size={14} />
                <span>
                  Chat blindado: telefones e links são bloqueados até o pagamento ser reservado.
                </span>
              </div>
            )}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {messages.map((m) => {
              if (m.kind === "quote" && m.quote) {
                return (
                  <div key={m.id} className="py-1">
                    <QuoteCard
                      quote={m.quote}
                      isClient={isClient}
                      balance={balance}
                      onPay={() => {
                        const ok = store.payQuote(id, m.quote!.id);
                        toast[ok ? "success" : "error"](
                          ok ? "Pagamento retido em escrow" : "Saldo insuficiente",
                        );
                      }}
                      onComplete={() => {
                        store.completeQuote(id, m.quote!.id);
                        toast.success("Serviço concluído — valor libertado ao prestador");
                      }}
                      onDecline={() => store.declineQuote(id, m.quote!.id)}
                    />
                  </div>
                );
              }
              if (m.kind === "system") {
                return (
                  <div
                    key={m.id}
                    className="mx-auto flex max-w-[85%] items-start gap-2 rounded-2xl bg-destructive/10 px-3 py-2 text-[11px] text-destructive"
                  >
                    <ShieldAlert size={13} className="mt-0.5 shrink-0" />
                    <span>{m.text}</span>
                  </div>
                );
              }
              return (
                <div
                  key={m.id}
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                    m.from === "me"
                      ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
                      : "mr-auto bg-card ring-1 ring-border rounded-bl-sm"
                  }`}
                >
                  {m.text}
                  <div
                    className={`text-[10px] mt-0.5 ${
                      m.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {new Date(m.at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sticky bottom-0 bg-card ring-1 ring-border px-3 py-3 space-y-2">
            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="press flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent text-xs font-semibold text-accent-foreground"
            >
              <Tag size={14} /> {isClient ? "Pedir orçamento oficial" : "Enviar orçamento oficial"}
            </button>
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escreva uma mensagem..."
                maxLength={500}
                className="flex-1 py-2.5 px-3 bg-surface ring-1 ring-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="size-11 rounded-xl bg-primary text-primary-foreground grid place-items-center disabled:opacity-40"
                aria-label="Enviar"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      <QuoteComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSubmit={(input) => {
          store.sendQuote(id, { ...input, from: isClient ? "them" : "me" });
          toast.success("Orçamento enviado no chat");
        }}
      />
    </AuthGate>
  );
}
