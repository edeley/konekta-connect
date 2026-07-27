import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Search } from "lucide-react";
import manifest from "@/lib/telas-manifest.json";

type Tela = { file: string; group: string; title: string };

export const Route = createFileRoute("/telas")({
  head: () => ({
    meta: [
      { title: "Telas originais KONEKTA · Design completo" },
      { name: "description", content: "Todas as telas originais do KONEKTA STP clonadas sem alterações: autenticação, cliente, prestador, carteira e enterprise." },
      { property: "og:title", content: "Telas originais KONEKTA" },
      { property: "og:description", content: "Galeria completa das telas originais do KONEKTA STP." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TelasPage,
});

function TelasPage() {
  const telas = manifest as Tela[];
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Tela | null>(null);

  const groups = useMemo(() => {
    const filtered = telas.filter((t) => t.title.toLowerCase().includes(q.toLowerCase()) || t.file.toLowerCase().includes(q.toLowerCase()));
    const map = new Map<string, Tela[]>();
    for (const t of filtered) map.set(t.group, [...(map.get(t.group) ?? []), t]);
    return [...map.entries()];
  }, [telas, q]);

  if (active) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setActive(null)} className="size-9 rounded-full bg-muted grid place-items-center" aria-label="Voltar">
            <ArrowLeft size={16} />
          </button>
          <p className="flex-1 text-sm font-semibold truncate">{active.title}</p>
          <a href={`/telas/${active.file}`} target="_blank" rel="noreferrer" className="size-9 rounded-full bg-muted grid place-items-center text-muted-foreground" aria-label="Abrir numa nova aba">
            <ExternalLink size={16} />
          </a>
        </header>
        <iframe title={active.title} src={`/telas/${active.file}`} className="flex-1 w-full border-0 bg-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-semibold tracking-tight">Telas originais KONEKTA</h1>
        <p className="mt-1 text-sm text-muted-foreground">{telas.length} ecrãs clonados exatamente como no design original.</p>

        <div className="mt-5 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Procurar tela..."
            className="w-full pl-9 pr-4 py-3 bg-card ring-1 ring-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
        </div>

        {groups.map(([group, items]) => (
          <section key={group} className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{group}</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((t) => (
                <button key={t.file} onClick={() => setActive(t)} className="text-left bg-card ring-1 ring-border rounded-2xl overflow-hidden hover:ring-terracotta/50 transition">
                  <div className="h-56 bg-white overflow-hidden">
                    <iframe
                      title={t.title}
                      src={`/telas/${t.file}`}
                      loading="lazy"
                      tabIndex={-1}
                      className="w-[390px] h-[844px] origin-top-left scale-[0.42] border-0 pointer-events-none"
                    />
                  </div>
                  <div className="px-4 py-3 border-t border-border">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
