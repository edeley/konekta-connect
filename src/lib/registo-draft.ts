import { useEffect, useState } from "react";

/**
 * Rascunho do registo guardado localmente — o utilizador não perde o que já
 * preencheu se a internet cair ou se sair da app sem querer.
 */
const KEY = "konekta:registo-draft";

export function loadDraft<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<T>) } : fallback;
  } catch {
    return fallback;
  }
}

export function saveDraft(value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* armazenamento indisponível */
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

/** Estado persistido automaticamente (com hidratação segura no cliente). */
export function useDraftState<T extends object>(initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(loadDraft(initial));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hydrated) saveDraft(value);
  }, [value, hydrated]);

  return [value, setValue] as const;
}

/** Estado da ligação à internet, para o banner offline. */
export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;
    const update = () => setOnline(navigator.onLine ?? true);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}
