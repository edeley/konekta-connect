import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

// Lidar com recarga graciosa caso ocorra erro transitório de import dinâmico do Vite ou quebra de rede
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    window.location.reload();
  });

  window.addEventListener("unhandledrejection", (event) => {
    // Blindagem contra rejeições de promessas de rede em quedas de sinal 3G/4G
    const message = event.reason?.message || String(event.reason || "");
    if (
      event.reason?.name === "AbortError" ||
      message.includes("Failed to fetch") ||
      message.includes("NetworkError") ||
      message.includes("Load failed")
    ) {
      event.preventDefault();
      console.warn("[KONEKTA Shield] Rejeição de rede suprimida com segurança:", message);
    }
  });
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
  );
});
