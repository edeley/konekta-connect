import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, ShieldCheck } from "lucide-react";
import { getProvider } from "@/lib/konekta-data";
import { store, useStore } from "@/lib/store";
import { AuthGate } from "@/components/AuthGate";

export const Route = createFileRoute("/chat/$id")({
  head: ({ params }) => {
    const p = getProvider(params.id);
    return {
      meta: [
        { title: p ? `${p.name} · Conversa · KONEKTA` : "Conversa · KONEKTA" },
        { name: "description", content: "Conversa dentro da plataforma KONEKTA." },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center p-8 text-center">
      <div>
        <h1 className="text-xl font-semibold">Conversa não encontrada</h1>
        <Link to="/chat" className="mt-4 inline-block text-terracotta font-medium">
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
  const router = useRouter();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  if (!provider) return null;

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    store.sendMessage(id, text);
    setText("");
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
              <p className="text-[11px] text-ocean">{provider.category}</p>
            </div>
          </header>

          <div className="px-4 mt-3">
            <div className="bg-ocean/10 rounded-xl px-3 py-2 flex items-center gap-2 text-[11px] text-ocean">
              <ShieldCheck size={14} />
              <span>Não partilhe pagamentos fora da KONEKTA.</span>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                  m.from === "me"
                    ? "ml-auto bg-terracotta text-primary-foreground rounded-br-sm"
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
            ))}
          </div>

          <form
            onSubmit={handleSend}
            className="sticky bottom-0 bg-card ring-1 ring-border px-3 py-3 flex gap-2"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva uma mensagem..."
              maxLength={500}
              className="flex-1 py-2.5 px-3 bg-surface ring-1 ring-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="size-11 rounded-xl bg-terracotta text-primary-foreground grid place-items-center disabled:opacity-40"
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
