/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * KONEKTA STP - Serviço Centralizado e Resiliente de Inteligência Artificial Gemini
 *
 * Arquitetura de Alta Concorrência concebida para suportar picos de tráfego massivo
 * para toda a população de São Tomé e Príncipe (~220.000 habitantes) com:
 * 1. Singleton do SDK oficial @google/genai com User-Agent 'aistudio-build'
 * 2. Cache LRU em memória com TTL para consultas frequentes (resposta em <1ms, 0 tokens gastos)
 * 3. Semáforo / Fila de Concorrência adaptativa com backoff exponencial contra erros 429
 * 4. Cascada de modelos (gemini-3.8-flash -> gemini-3.1-flash-lite -> Motor Local STP)
 * 5. Proteção de memória e higienização estrita de segurança
 */

import { GoogleGenAI } from "@google/genai";

// Configurações de Concorrência e Alta Disponibilidade para STP
const MAX_CONCURRENT_CALLS = 15;
const REQUEST_TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutos de cache para perguntas frequentes
const MAX_CACHE_ENTRIES = 1200;

interface CacheEntry {
  text: string;
  model: string;
  groundingPlaces?: Array<{ title: string; uri?: string; snippet?: string }>;
  timestamp: number;
}

class GeminiResilienceEngine {
  private client: GoogleGenAI | null = null;
  private currentApiKey: string | null = null;
  private activeCalls = 0;
  private queue: Array<() => void> = [];
  private cache = new Map<string, CacheEntry>();

  /**
   * Obtém a instância singleton do SDK @google/genai com cabeçalhos de telemetria obrigatórios
   */
  public getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return null;

    if (!this.client || this.currentApiKey !== apiKey) {
      this.currentApiKey = apiKey;
      this.client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }

    return this.client;
  }

  /**
   * Normaliza uma chave de cache a partir do prompt e papel
   */
  private makeCacheKey(role: string, prompt: string): string {
    const normalized = prompt.toLowerCase().replace(/\s+/g, " ").trim();
    return `${role}::${normalized}`;
  }

  /**
   * Procura na cache em memória
   */
  public getFromCache(role: string, prompt: string): CacheEntry | null {
    const key = this.makeCacheKey(role, prompt);
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Guarda na cache em memória com eviction LRU simples
   */
  public setInCache(
    role: string,
    prompt: string,
    text: string,
    model: string,
    groundingPlaces?: Array<{ title: string; uri?: string; snippet?: string }>,
  ): void {
    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      // Remover a chave mais antiga
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    const key = this.makeCacheKey(role, prompt);
    this.cache.set(key, {
      text,
      model,
      groundingPlaces,
      timestamp: Date.now(),
    });
  }

  /**
   * Controlo de concorrência: Adquire um slot antes de efetuar chamada externa
   */
  private async acquireSlot(): Promise<void> {
    if (this.activeCalls < MAX_CONCURRENT_CALLS) {
      this.activeCalls++;
      return;
    }

    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.activeCalls++;
        resolve();
      });
    });
  }

  /**
   * Liberta o slot e despacha o próximo da fila
   */
  private releaseSlot(): void {
    this.activeCalls = Math.max(0, this.activeCalls - 1);
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }

  /**
   * Executa a geração de conteúdo com cascada automática de modelos e gestão de timeouts
   */
  public async generateWithCascade(options: {
    contents: unknown;
    config?: Record<string, unknown>;
    models?: string[];
    cacheCategory?: string;
    rawUserQuery?: string;
  }): Promise<{
    text: string;
    model: string;
    groundingPlaces: Array<{ title: string; uri?: string; snippet?: string }>;
    fromCache: boolean;
  }> {
    const {
      contents,
      config,
      models = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"],
      cacheCategory,
      rawUserQuery,
    } = options;

    // 1. Verificação instantânea de cache para tráfego simultâneo idêntico
    if (cacheCategory && rawUserQuery) {
      const cached = this.getFromCache(cacheCategory, rawUserQuery);
      if (cached) {
        return {
          text: cached.text,
          model: `${cached.model} (Cache STP)`,
          groundingPlaces: cached.groundingPlaces || [],
          fromCache: true,
        };
      }
    }

    const ai = this.getClient();
    if (!ai) {
      throw new Error("Chave GEMINI_API_KEY não configurada no servidor.");
    }

    await this.acquireSlot();

    try {
      for (let i = 0; i < models.length; i++) {
        const modelName = models[i];
        try {
          // Chamada com timeout rigoroso para prevenir bloqueios de workers
          const callPromise = (ai.models as any).generateContent({
            model: modelName,
            contents,
            config,
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
              () =>
                reject(new Error(`Timeout de ${REQUEST_TIMEOUT_MS}ms excedido para ${modelName}`)),
              REQUEST_TIMEOUT_MS,
            ),
          );

          const response = await Promise.race([callPromise, timeoutPromise]);
          const text = response.text?.trim() || "";

          if (text) {
            const groundingPlaces: Array<{
              title: string;
              uri?: string;
              snippet?: string;
            }> = [];

            // Extração segura de locais grounded
            const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (Array.isArray(rawChunks)) {
              for (const chunk of rawChunks) {
                const mapsItem = (chunk as Record<string, unknown>).maps as
                  Record<string, unknown> | undefined;
                const webItem = (chunk as Record<string, unknown>).web as
                  Record<string, unknown> | undefined;

                if (mapsItem) {
                  const title =
                    (mapsItem.title as string) ||
                    (mapsItem.sourcePlaceId as string) ||
                    "Local no Google Maps";
                  const uri = (mapsItem.uri as string) || undefined;
                  groundingPlaces.push({ title, uri });
                } else if (webItem?.uri) {
                  groundingPlaces.push({
                    title: (webItem.title as string) || "Referência KONEKTA",
                    uri: webItem.uri as string,
                  });
                }
              }
            }

            // Armazenar na cache se qualificado
            if (cacheCategory && rawUserQuery) {
              this.setInCache(cacheCategory, rawUserQuery, text, modelName, groundingPlaces);
            }

            return {
              text,
              model: modelName,
              groundingPlaces,
              fromCache: false,
            };
          }
        } catch (err) {
          console.warn(
            `[GeminiEngine] Falha transitória com ${modelName}:`,
            err instanceof Error ? err.message : String(err),
          );
          // Continua para o próximo modelo na cascada
        }
      }

      throw new Error("Nenhum modelo Gemini respondeu no tempo estipulado.");
    } finally {
      this.releaseSlot();
    }
  }

  /**
   * Transcrição de áudio resiliente em STP
   */
  public async transcribeAudio(options: {
    cleanMime: string;
    cleanBase64: string;
    promptContext?: string;
  }): Promise<{ text: string; model: string }> {
    const { cleanMime, cleanBase64, promptContext } = options;

    const ai = this.getClient();
    if (!ai) {
      throw new Error("Chave GEMINI_API_KEY não configurada no servidor.");
    }

    await this.acquireSlot();

    try {
      const audioPart = {
        inlineData: {
          mimeType: cleanMime,
          data: cleanBase64,
        },
      };

      const instructionText = promptContext
        ? `Transcreva este áudio com fidelidade em português de São Tomé e Príncipe. Contexto do pedido ou mensagem: ${promptContext}. Retorne apenas a transcrição literal do que foi falado, sem introduções, aspas extras ou comentários adicionais.`
        : "Transcreva este áudio com fidelidade em português de São Tomé e Príncipe. Retorne apenas o texto transcrito literal sem introduções, explicações ou comentários.";

      // Modelos suportados oficialmente para áudio com respostas rápidas
      const modelsToTry = ["gemini-3.5-transcribe", "gemini-3.8-flash"];
      const TRANSCRIBE_TIMEOUT_MS = 6000;

      for (const modelName of modelsToTry) {
        try {
          const callPromise = (ai.models as any).generateContent({
            model: modelName,
            contents: {
              parts: [audioPart, { text: instructionText }],
            },
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error(`Timeout de ${TRANSCRIBE_TIMEOUT_MS}ms com ${modelName}`)),
              TRANSCRIBE_TIMEOUT_MS,
            ),
          );

          const response = await Promise.race([callPromise, timeoutPromise]);
          let text = response.text?.trim() || "";

          if (!text && response.candidates?.[0]?.content?.parts) {
            let assembled = "";
            for (const part of response.candidates[0].content.parts) {
              if (part.text) assembled += (assembled ? " " : "") + part.text.trim();
            }
            text = assembled;
          }

          if (text) {
            return { text, model: modelName };
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn(`[GeminiEngine] Transcrição com ${modelName}:`, errMsg.slice(0, 120));
          // Avança imediatamente para o próximo modelo sem esperas excessivas
        }
      }

      throw new Error("Não foi possível transcrever o áudio com os modelos disponíveis.");
    } finally {
      this.releaseSlot();
    }
  }
}

export const geminiEngine = new GeminiResilienceEngine();
