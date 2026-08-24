import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
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
      { title: "KONEKTA — Serviços em São Tomé e Príncipe" },
      {
        name: "description",
        content: "Plataforma segura para contratar profissionais em São Tomé e Príncipe.",
      },
      { property: "og:title", content: "KONEKTA" },
      { property: "og:description", content: "Serviços de confiança em São Tomé e Príncipe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
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

  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    initAlarmWatcher();
    if (typeof window !== "undefined") {
      const hasSeen = sessionStorage.getItem("konekta_splash_session");
      if (!hasSeen) {
        setShowSplash(true);
        const timer = setTimeout(() => {
          sessionStorage.setItem("konekta_splash_session", "true");
          setShowSplash(false);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {showSplash && (
        <div
          id="konekta-app-splash"
          className="fixed inset-0 z-9999 grid place-items-center bg-[#1D68D8] px-6 text-white select-none pointer-events-auto"
        >
          <div className="flex flex-col items-center gap-4 text-center max-w-xs animate-in fade-in zoom-in-95 duration-400">
            <div className="grid size-24 place-items-center rounded-[28px] bg-white/20 text-4xl font-extrabold text-white shadow-inner backdrop-blur-xs">
              K
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">KONEKTA</h1>
            <p className="text-sm text-white/90 font-medium leading-relaxed max-w-[260px]">
              Serviços de confiança em São Tomé e Príncipe
            </p>
            <div className="mt-6 size-7 animate-spin rounded-full border-[2.5px] border-white/25 border-t-white" />
          </div>
        </div>
      )}
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
