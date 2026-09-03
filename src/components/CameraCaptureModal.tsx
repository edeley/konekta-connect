import { useEffect, useRef, useState } from "react";
import {
  Camera,
  RefreshCw,
  X,
  Check,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { triggerDeviceVibration } from "@/lib/sync-manager";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (dataUrl: string) => void;
  onOpenGallery?: () => void;
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  onPhotoCaptured,
  onOpenGallery,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const nativeGalleryInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);

  // Iniciar stream da câmara
  const startCamera = async (mode: "environment" | "user") => {
    setIsStarting(true);
    setCameraError(null);

    // Parar stream anterior se existir
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Acesso direto à câmara não suportado no navegador.");
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      console.warn("Erro ao iniciar câmara ao vivo:", err);
      const errorObj = err as { name?: string };
      setCameraError(
        errorObj?.name === "NotAllowedError" || errorObj?.name === "PermissionDeniedError"
          ? "Permissão da câmara negada no navegador. Utilize a câmara nativa do telemóvel no botão abaixo."
          : "Não foi possível abrir o visor ao vivo. Toque abaixo para abrir a câmara nativa do seu telemóvel.",
      );
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      void startCamera(facingMode);
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, facingMode]);

  const handleSwitchCamera = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    triggerDeviceVibration([30]);
  };

  const handleTakePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Flash animation & tactile feedback
    setFlashEffect(true);
    triggerDeviceVibration([50]);
    setTimeout(() => setFlashEffect(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Se estiver na câmara frontal, inverter horizontalmente para selfie natural
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    setCapturedPhoto(dataUrl);
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      onPhotoCaptured(capturedPhoto);
      setCapturedPhoto(null);
      triggerDeviceVibration([30, 40]);
      toast.success("Foto anexada com sucesso!");
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  // Fallback e acionamento direto para câmara nativa do telemóvel via input capture
  const handleNativeCameraFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        onPhotoCaptured(reader.result as string);
        triggerDeviceVibration([40, 60]);
        toast.success("Foto tirada com a câmara nativa e anexada!");
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNativeGalleryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        onPhotoCaptured(reader.result as string);
        triggerDeviceVibration([30]);
        toast.success("Foto da galeria selecionada e anexada!");
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4 backdrop-blur-md animate-in fade-in duration-200">
      {/* Inputs nativos para acionar a câmara do telemóvel e galeria do sistema */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleNativeCameraFile}
      />
      <input
        ref={nativeGalleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleNativeGalleryFile}
      />

      <canvas ref={canvasRef} className="hidden" />

      {/* Topo do Ecrã da Câmara */}
      <div className="w-full max-w-md flex items-center justify-between pt-2 pb-3 px-2 text-white z-10">
        <button
          type="button"
          onClick={onClose}
          className="size-10 rounded-full bg-white/15 active:scale-95 flex items-center justify-center text-white backdrop-blur-sm transition cursor-pointer"
          aria-label="Fechar câmara"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <h2 className="text-sm font-bold tracking-wide">Fotografar o Problema</h2>
          <p className="text-[11px] text-white/70">Câmara do telemóvel ou galeria</p>
        </div>

        {!capturedPhoto && !cameraError && (
          <button
            type="button"
            onClick={handleSwitchCamera}
            className="size-10 rounded-full bg-white/15 active:scale-95 flex items-center justify-center text-white backdrop-blur-sm transition cursor-pointer"
            aria-label="Trocar de câmara"
          >
            <RefreshCw size={18} />
          </button>
        )}
        {(capturedPhoto || cameraError) && <div className="size-10" />}
      </div>

      {/* Área Central: Visor de Vídeo ou Pré-visualização da Foto */}
      <div className="relative w-full max-w-md flex-1 rounded-3xl overflow-hidden bg-zinc-900 flex items-center justify-center shadow-2xl border border-white/10">
        {flashEffect && (
          <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-200" />
        )}

        {capturedPhoto ? (
          /* Foto Tirada - Pré-visualização */
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <img
              src={capturedPhoto}
              alt="Foto capturada"
              className="w-full h-full object-contain bg-black"
            />
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Foto pronta para envio</span>
            </div>
          </div>
        ) : cameraError ? (
          /* Sugestão e Disparo de Câmara Nativa */
          <div className="p-6 text-center text-white max-w-xs space-y-4">
            <div className="size-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <Camera size={32} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Usar Câmara do Telemóvel</h3>
              <p className="text-xs text-white/70 mt-1.5 leading-relaxed">{cameraError}</p>
            </div>
            <button
              type="button"
              onClick={() => nativeCameraInputRef.current?.click()}
              className="w-full py-3.5 px-4 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 active:scale-95 shadow-lg cursor-pointer"
            >
              <Camera size={16} />
              <span>Abrir Câmara Nativa do Telemóvel</span>
            </button>
            <button
              type="button"
              onClick={() => nativeGalleryInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-2xl bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 border border-white/15 cursor-pointer"
            >
              <ImageIcon size={16} />
              <span>Escolher da Galeria de Fotos</span>
            </button>
          </div>
        ) : (
          /* Visor ao Vivo com Video */
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Grid de enquadramento da câmara */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-20 border border-white/40">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div className="border-r border-white" />
              <div />
            </div>

            {isStarting && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs gap-2">
                <RefreshCw size={18} className="animate-spin" />
                <span>A carregar câmara...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Barra de Ações Inferior */}
      <div className="w-full max-w-md py-4 px-3 z-10">
        {capturedPhoto ? (
          /* Ações após tirar foto: Repetir ou Confirmar */
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRetake}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition hover:bg-white/20 border border-white/15 cursor-pointer"
            >
              <RefreshCw size={15} />
              <span>Tirar Outra</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmPhoto}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition shadow-lg cursor-pointer"
            >
              <Check size={16} />
              <span>Usar Esta Foto</span>
            </button>
          </div>
        ) : (
          /* Disparador Central */
          <div className="flex items-center justify-around">
            {/* Abrir Galeria */}
            <button
              type="button"
              onClick={() => {
                if (onOpenGallery) {
                  onClose();
                  onOpenGallery();
                } else {
                  nativeGalleryInputRef.current?.click();
                }
              }}
              className="flex flex-col items-center gap-1 text-white/80 hover:text-white active:scale-95 transition cursor-pointer"
            >
              <div className="size-11 rounded-full bg-white/15 flex items-center justify-center border border-white/20">
                <ImageIcon size={20} />
              </div>
              <span className="text-[10px] font-semibold">Galeria</span>
            </button>

            {/* Botão de Disparo Principal (Shutter) */}
            <button
              type="button"
              disabled={isStarting}
              onClick={() => {
                if (cameraError) {
                  nativeCameraInputRef.current?.click();
                } else {
                  handleTakePhoto();
                }
              }}
              className="size-18 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-90 transition shadow-2xl group cursor-pointer"
              aria-label="Disparar foto"
            >
              <div className="size-full rounded-full bg-white group-hover:bg-primary transition shadow-inner" />
            </button>

            {/* Abertura da Câmara Nativa Direta */}
            <button
              type="button"
              onClick={() => nativeCameraInputRef.current?.click()}
              className="flex flex-col items-center gap-1 text-white/80 hover:text-white active:scale-95 transition cursor-pointer"
            >
              <div className="size-11 rounded-full bg-white/15 flex items-center justify-center border border-white/20">
                <Camera size={20} />
              </div>
              <span className="text-[10px] font-semibold">Câmara Nativa</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
