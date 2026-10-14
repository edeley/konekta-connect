import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutos de cache em memória
        gcTime: 1000 * 60 * 30, // 30 minutos em garbage collection
        refetchOnWindowFocus: false, // Poupa dados móveis CST/Unitel ao trocar de abas
        retry: (failureCount) => failureCount < 2, // Resiliência para microcortes 3G em STP
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent", // Pré-carrega rotas e módulos ao passar o dedo/cursor
    defaultPreloadDelay: 60, // Evita disparar pré-carregamento em toques acidentais/scroll rápido
    defaultPreloadStaleTime: 60_000, // 60s de validade para evitar downloads duplicados
  });

  return router;
};
