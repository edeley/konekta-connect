import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { getProvider } from "@/lib/konekta-data";

export default defineTool({
  name: "get_provider",
  title: "Detalhes de um prestador",
  description: "Devolve os detalhes públicos de um prestador do KONEKTA a partir do seu id, por exemplo 'edmilson-varela'.",
  inputSchema: { id: z.string().describe("Id do prestador.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ id }) => {
    const p = getProvider(id.trim());
    if (!p) {
      return { content: [{ type: "text" as const, text: `Prestador '${id}' não encontrado.` }], isError: true };
    }
    const row = {
      id: p.id,
      name: p.name,
      category: p.category,
      rating: p.rating,
      reviews: p.reviews,
      priceFromDb: p.priceFrom,
      bio: p.bio,
      services: p.services,
    };
    return {
      content: [
        {
          type: "text" as const,
          text: `${row.name} — ${row.category}\n★ ${row.rating} (${row.reviews} avaliações)\nA partir de ${row.priceFromDb} Db\n\n${row.bio}\n\nServiços: ${row.services.join(", ")}`,
        },
      ],
      structuredContent: { provider: row },
    };
  },
});
