import { defineTool } from "@lovable.dev/mcp-js";

import { categories } from "@/lib/konekta-data";

export default defineTool({
  name: "list_categories",
  title: "Listar categorias de serviços",
  description: "Lista todas as categorias de serviços disponíveis na plataforma KONEKTA em São Tomé e Príncipe.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const rows = categories.map((c) => ({ slug: c.slug, name: c.name }));
    return {
      content: [{ type: "text" as const, text: rows.map((c) => `${c.name} (${c.slug})`).join("\n") }],
      structuredContent: { categories: rows },
    };
  },
});
