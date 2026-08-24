import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { providers } from "@/lib/konekta-data";

function serialize(p: (typeof providers)[number]) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    rating: p.rating,
    reviews: p.reviews,
    priceFromDb: p.priceFrom,
    bio: p.bio,
    services: p.services,
  };
}

export default defineTool({
  name: "search_providers",
  title: "Procurar prestadores",
  description:
    "Procura prestadores de serviços do KONEKTA por texto livre e/ou categoria, ordenados pela avaliação. Devolve nome, categoria, avaliação, preço inicial em Dobras e serviços.",
  inputSchema: {
    query: z.string().optional().describe("Texto a procurar no nome, categoria, bio ou serviços."),
    category: z
      .string()
      .optional()
      .describe("Nome ou slug da categoria, por exemplo 'eletricista'."),
    limit: z.number().int().optional().describe("Número máximo de resultados (predefinição 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query, category, limit }) => {
    const q = (query ?? "").trim().toLowerCase();
    const cat = (category ?? "").trim().toLowerCase();
    const max = Math.min(Math.max(limit ?? 10, 1), 50);

    const rows = providers
      .filter((p) => {
        const catOk =
          !cat || p.category.toLowerCase().includes(cat) || cat.includes(p.category.toLowerCase());
        const text = `${p.name} ${p.category} ${p.bio} ${p.services.join(" ")}`.toLowerCase();
        return catOk && (!q || text.includes(q));
      })
      .sort((a, b) => b.rating - a.rating)
      .slice(0, max)
      .map(serialize);

    const text = rows.length
      ? rows
          .map(
            (p) =>
              `${p.name} — ${p.category} · ★ ${p.rating} (${p.reviews}) · a partir de ${p.priceFromDb} Db`,
          )
          .join("\n")
      : "Nenhum prestador encontrado com esses critérios.";

    return { content: [{ type: "text" as const, text }], structuredContent: { providers: rows } };
  },
});
