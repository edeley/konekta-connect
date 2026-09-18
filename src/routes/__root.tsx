import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  type ErrorComponentProps,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useStore } from "@/lib/store";
import { initAlarmWatcher } from "@/lib/sync-manager";
import { AppShield } from "@/components/konekta/AppShield";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const err = error as Error;
  console.error("Root Error caught:", error);
  const router = useRouter();
  useEffect(() => {
    try {
      reportLovableError(error, { boundary: "tanstack_root_error_component" });
    } catch {
      // ignore
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-4 p-6 bg-card rounded-2xl border border-border shadow-sm">
        <div className="size-12 mx-auto rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xl">
          ⚠️
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Não foi possível carregar a página
        </h1>
        <p className="text-sm text-muted-foreground">
          Ocorreu uma pequena instabilidade momentânea na ligação ou no dispositivo. Pode tentar
          recarregar ou regressar ao início.
        </p>

        {err?.message && (
          <div className="p-3 bg-muted rounded-xl text-left text-xs font-mono text-muted-foreground overflow-auto max-h-24">
            {err.message}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              try {
                router.invalidate();
                reset?.();
              } catch {
                window.location.reload();
              }
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-95 cursor-pointer shadow-xs"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent active:scale-95"
          >
            Ir para a Página Inicial
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "Konekta Connect — Serviços em São Tomé e Príncipe" },
      {
        name: "description",
        content:
          "Plataforma de contratação de serviços profissionais verificados e custódia financeira em São Tomé e Príncipe.",
      },
      { property: "og:title", content: "Konekta Connect" },
      {
        property: "og:description",
        content:
          "Plataforma de contratação de serviços profissionais verificados e custódia financeira em São Tomé e Príncipe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('vite:preloadError', function(event) {
                event.preventDefault();
                window.location.reload();
              });
              window.addEventListener('error', function(event) {
                if (event.message && (event.message.indexOf('Failed to fetch dynamically imported module') !== -1 || event.message.indexOf('Failed to load module script') !== -1)) {
                  event.preventDefault();
                  var lastReload = sessionStorage.getItem('konekta_dyn_reload');
                  var now = Date.now();
                  if (!lastReload || now - parseInt(lastReload, 10) > 4000) {
                    sessionStorage.setItem('konekta_dyn_reload', now.toString());
                    window.location.reload();
                  }
                }
              });
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const darkMode = useStore((s) => s.settings?.darkMode || s.settings?.theme === "dark");

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [darkMode]);

  useEffect(() => {
    initAlarmWatcher();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Blindagem de conectividade e renderização KONEKTA */}
      <AppShield>
        <Outlet />
      </AppShield>
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
