import { defineMcp } from "@lovable.dev/mcp-js";

import getProviderTool from "./tools/get-provider";
import listCategoriesTool from "./tools/list-categories";
import searchProvidersTool from "./tools/search-providers";

export default defineMcp({
  name: "konekta-mcp",
  title: "KONEKTA STP",
  version: "0.1.0",
  instructions:
    "Ferramentas do catálogo público da KONEKTA, a plataforma de prestação de serviços de São Tomé e Príncipe. Use `list_categories` para ver as categorias, `search_providers` para procurar profissionais por texto ou categoria, e `get_provider` para os detalhes de um prestador. Preços em Dobras (Db).",
  tools: [listCategoriesTool, searchProvidersTool, getProviderTool],
});
