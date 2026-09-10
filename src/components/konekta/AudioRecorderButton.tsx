import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Square, Loader2, Volume2 } from "lucide-react";
import { toast } from "sonner";

interface AudioRecorderButtonProps {
  onTranscription: (transcribedText: string) => void;
  promptContext?: string;
  className?: string;
  size?: "sm" | "md" | "icon";
  buttonText?: string;
}

export function AudioRecorderButton({
  onTranscription,
  promptContext,
  className = "",
  size = "icon",
  buttonText,
}: AudioRecorderButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("O seu navegador não suporta gravação de áudio direta.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Determinar o formato MIME suportado
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        } else {
          mimeType = ""; // deixar o navegador escolher o padrão
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Desligar tracks do microfone para libertar o hardware
        stream.getTracks().forEach((track) => track.stop());

        const finalMime = mediaRecorder.mimeType || mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });

        if (audioBlob.size < 200) {
          toast.info("Áudio muito curto. Fale um pouco mais.");
          return;
        }

        await handleProcessTranscription(audioBlob, finalMime);
      };

      mediaRecorder.start(250); // fatiar em blocos de 250ms
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = window.setInterval(() => {
        setRecordDuration((prev) => {
          if (prev >= 60) {
            // Limite de segurança de 60 segundos
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

      toast.info("Microfone ligado. Descreva o seu pedido ou dúvida...");
    } catch (err) {
      console.error("Erro ao aceder ao microfone:", err);
      toast.error(
        "Permissão de microfone negada. Ative o acesso ao microfone nas definições do navegador.",
      );
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleProcessTranscription = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    const toastId = toast.loading("A transcrever com Gemini 3.5 Transcribe...");

    try {
      // Converter Blob para Base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);

      reader.onloadend = async () => {
        try {
          const base64Audio = reader.result as string;
          const cleanMime = (mimeType || blob.type || "audio/webm")
            .split(";")[0]
            .trim()
            .toLowerCase();

          const response = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioBase64: base64Audio,
              mimeType: cleanMime,
              promptContext,
            }),
          });

          let data: {
            success: boolean;
            text?: string;
            error?: string;
          };

          const responseText = await response.text();
          try {
            data = JSON.parse(responseText);
          } catch {
            console.warn(
              "Resposta não-JSON do endpoint de transcrição:",
              responseText.slice(0, 120),
            );
            data = {
              success: false,
              error:
                "O serviço de transcrição está temporariamente indisponível. Por favor, tente novamente.",
            };
          }

          if (data.success && data.text) {
            toast.success("Áudio transcrito com sucesso!", { id: toastId });
            onTranscription(data.text);
          } else {
            toast.error(data.error || "Não foi possível transcrever o áudio gravado.", {
              id: toastId,
            });
          }
        } catch (fetchErr) {
          console.error("Erro ao enviar áudio para transcrição:", fetchErr);
          toast.error("Erro de comunicação com o serviço de transcrição.", {
            id: toastId,
          });
        } finally {
          setIsTranscribing(false);
        }
      };

      reader.onerror = () => {
        toast.error("Falha ao ler o ficheiro de áudio.", { id: toastId });
        setIsTranscribing(false);
      };
    } catch (e) {
      console.error(e);
      toast.error("Erro no processamento da gravação.", { id: toastId });
      setIsTranscribing(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (isTranscribing) {
    return (
      <div
        className={`flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 ${className}`}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>A transcrever com Gemini...</span>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div
        className={`flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 ${className}`}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500"></span>
        </span>
        <span className="tabular-nums font-mono">{formatTimer(recordDuration)}</span>
        <button
          type="button"
          onClick={stopRecording}
          className="ml-1 inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2 py-1 text-[11px] text-white transition hover:bg-rose-700"
          title="Parar gravação e transcrever"
        >
          <Square className="h-3 w-3 fill-current" />
          <span>Finalizar</span>
        </button>
      </div>
    );
  }

  if (size === "icon") {
    return (
      <button
        type="button"
        onClick={startRecording}
        disabled={isTranscribing}
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-600 focus:outline-none disabled:opacity-50 dark:hover:text-emerald-400 ${className}`}
        title="Falar por áudio (transcrição inteligente Gemini 3.5 Transcribe)"
      >
        <Mic className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={isTranscribing}
      className={`inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-600 disabled:opacity-50 dark:hover:text-emerald-400 ${className}`}
      title="Gravar áudio com o microfone para preenchimento automático"
    >
      <Mic className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      <span>{buttonText || "Gravar por Voz (Gemini Transcribe)"}</span>
    </button>
  );
}
