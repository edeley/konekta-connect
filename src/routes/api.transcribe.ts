import { createFileRoute } from "@tanstack/react-router";
import { geminiEngine } from "../lib/gemini-service";

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(
          JSON.stringify({
            status: "ok",
            endpoint: "/api/transcribe",
            model: "gemini-3.5-transcribe / gemini-3.8-flash",
            hasApiKey: Boolean(process.env.GEMINI_API_KEY),
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            audioBase64?: string;
            mimeType?: string;
            promptContext?: string;
          };

          const { audioBase64, mimeType = "audio/webm", promptContext } = body || {};

          if (!audioBase64 || audioBase64.trim().length === 0) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Nenhum dado de áudio fornecido para transcrição.",
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          // Higienizar o tipo MIME: remover parâmetros adicionais como ;codecs=opus que o Gemini rejeita
          let cleanMime = (mimeType || "audio/webm").split(";")[0].trim().toLowerCase();
          if (cleanMime.includes("webm")) cleanMime = "audio/webm";
          else if (cleanMime.includes("ogg")) cleanMime = "audio/ogg";
          else if (cleanMime.includes("mp4") || cleanMime.includes("m4a")) cleanMime = "audio/mp4";
          else if (cleanMime.includes("wav")) cleanMime = "audio/wav";
          else if (cleanMime.includes("mp3") || cleanMime.includes("mpeg")) cleanMime = "audio/mp3";
          else cleanMime = "audio/webm";

          // Limpar cabeçalhos data:audio/...;base64 e espaços em branco
          let cleanBase64 = audioBase64;
          if (cleanBase64.includes(",")) {
            cleanBase64 = cleanBase64.split(",")[1];
          }
          cleanBase64 = cleanBase64.replace(/\s+/g, "");

          if (!cleanBase64) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Ficheiro de áudio vazio ou corrompido.",
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          let transcribedText = "";
          let failureReason = "";

          if (process.env.GEMINI_API_KEY) {
            try {
              const res = await geminiEngine.transcribeAudio({
                cleanMime,
                cleanBase64,
                promptContext,
              });
              transcribedText = res.text;
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              if (
                msg.includes("503") ||
                msg.includes("high demand") ||
                msg.includes("UNAVAILABLE") ||
                msg.includes("429")
              ) {
                failureReason =
                  "O serviço de voz com IA está com alta procura temporária da Google. Por favor, tente enviar novamente dentro de instantes ou digite a sua mensagem.";
              }
              console.warn("[TranscribeAPI] Estado de transcrição:", msg.slice(0, 160));
            }
          }

          if (transcribedText) {
            return new Response(
              JSON.stringify({
                success: true,
                text: transcribedText,
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          return new Response(
            JSON.stringify({
              success: false,
              error:
                failureReason ||
                "Não foi possível identificar voz no áudio gravado. Fale mais perto do microfone ou digite a sua mensagem.",
              text: "",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (error) {
          console.error("Erro interno ao transcrever áudio:", error);
          return new Response(
            JSON.stringify({
              success: false,
              error:
                "Instabilidade temporária no processamento do áudio. Por favor, tente novamente.",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});
