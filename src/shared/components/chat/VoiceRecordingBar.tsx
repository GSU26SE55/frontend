import { Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface VoiceRecordingBarProps {
  elapsedSeconds: number;
  /** Giá trị 0-1 theo từng cột — từ useVoiceRecorder, phản ứng theo âm lượng mic */
  waveform: number[];
  onStop: () => void;
  onCancel: () => void;
}

/** Thanh hiển thị khi đang ghi âm — thay chỗ ô nhập text, có sóng phản ứng theo giọng nói. */
export function VoiceRecordingBar({
  elapsedSeconds,
  waveform,
  onStop,
  onCancel,
}: VoiceRecordingBarProps) {
  return (
    <div className="flex flex-1 items-center gap-2 rounded-xl bg-muted px-3 h-9">
      <span className="size-2 shrink-0 rounded-full bg-destructive animate-pulse" />
      <span className="text-xs font-medium tabular-nums text-muted-foreground shrink-0">
        {formatElapsed(elapsedSeconds)}
      </span>
      <div className="flex flex-1 items-center justify-center gap-[3px] h-5 overflow-hidden">
        {waveform.map((level, i) => (
          <span
            key={i}
            className="w-[3px] shrink-0 rounded-full bg-primary transition-[height] duration-75 ease-out"
            style={{ height: `${Math.max(10, level * 100)}%` }}
          />
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onCancel}
        aria-label="Hủy ghi âm"
      >
        <X size={14} />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        onClick={onStop}
        aria-label="Dừng và gửi ghi âm"
      >
        <Square size={12} />
      </Button>
    </div>
  );
}
