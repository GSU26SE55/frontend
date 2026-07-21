import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, X } from "lucide-react";

interface CameraCaptureProps {
  /** Nhận ảnh đã chụp dưới dạng File để upload. */
  onCapture: (file: File) => void;
  disabled?: boolean;
}

/**
 * Chụp ảnh bằng webcam: getUserMedia → <video> → vẽ frame ra canvas → File.
 *
 * Repo trước đây chỉ có getUserMedia cho audio (useVoiceRecorder) — đây là
 * đường video đầu tiên, nên tự quản lý stream và dừng track khi unmount để
 * đèn camera không sáng mãi.
 */
export function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  // Dừng camera khi unmount — nếu không, track vẫn chạy và đèn vẫn sáng
  useEffect(() => stop, [stop]);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setActive(true);
      // gán sau khi <video> đã render
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch (e) {
      const name = (e as DOMException)?.name;
      setError(
        name === "NotAllowedError"
          ? "Bạn đã từ chối quyền truy cập camera."
          : name === "NotFoundError"
            ? "Không tìm thấy camera trên thiết bị."
            : "Không mở được camera.",
      );
    }
  };

  const shoot = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        onCapture(
          new File([blob], `camera-${stamp}.jpg`, { type: "image/jpeg" }),
        );
        stop();
      },
      "image/jpeg",
      0.9,
    );
  };

  if (error) {
    return (
      <div className="space-y-2 text-center">
        <p className="text-destructive text-sm">{error}</p>
        <Button type="button" variant="outline" size="sm" onClick={start}>
          <RefreshCw className="mr-1 size-4" />
          Thử lại
        </Button>
      </div>
    );
  }

  if (!active) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={start}
        disabled={disabled}
        className="w-full"
      >
        <Camera className="mr-2 size-4" />
        Mở camera để chụp
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="bg-muted max-h-[50vh] w-full rounded-md"
      />
      <div className="flex justify-center gap-2">
        <Button type="button" onClick={shoot}>
          <Camera className="mr-2 size-4" />
          Chụp
        </Button>
        <Button type="button" variant="outline" onClick={stop}>
          <X className="mr-2 size-4" />
          Đóng
        </Button>
      </div>
    </div>
  );
}
