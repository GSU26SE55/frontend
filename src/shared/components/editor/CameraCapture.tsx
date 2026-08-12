import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, X } from "lucide-react";

interface CameraCaptureProps {
  /** Receives the captured photo as a File for upload. */
  onCapture: (file: File) => void;
  disabled?: boolean;
}

/**
 * Captures a photo via webcam: getUserMedia → <video> → draw the frame to a canvas → File.
 *
 * The repo previously only had getUserMedia for audio (useVoiceRecorder) — this is
 * the first video path, so it manages its own stream and stops the track on unmount so
 * the camera light doesn't stay on forever.
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

  // Stop the camera on unmount — otherwise the track keeps running and the light stays on
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
      // assign after <video> has rendered
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch (e) {
      const name = (e as DOMException)?.name;
      setError(
        name === "NotAllowedError"
          ? "You denied camera access."
          : name === "NotFoundError"
            ? "No camera found on this device."
            : "Couldn't open the camera.",
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
          Try again
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
        Open camera to capture
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
          Capture
        </Button>
        <Button type="button" variant="outline" onClick={stop}>
          <X className="mr-2 size-4" />
          Close
        </Button>
      </div>
    </div>
  );
}
