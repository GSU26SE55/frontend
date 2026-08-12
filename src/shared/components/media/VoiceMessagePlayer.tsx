import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFileBlobUrl } from "@/shared/hooks/file/useFileBlobUrl";

const BAR_COUNT = 32;

function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "00:00";
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Static waveform (0.3–1) generated from a seed (fileId) — same file always produces the same
 * waveform shape, no flicker on every render. Zalo/Messenger-style decoration; the real audio
 * amplitude isn't available on the client.
 */
function seededWaveform(seed: string): number[] {
  const bars: number[] = [];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < BAR_COUNT; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    bars.push(0.3 + ((h % 1000) / 1000) * 0.7);
  }
  return bars;
}

interface Props {
  /** FileId of the audio file — loaded via useFileBlobUrl (with Bearer). */
  fileId: string;
  /** Transcript text shown below the player (Zalo-style). Empty means hidden. */
  transcript?: string;
  /** Own message (right side, primary background) — adjust colors to match the background. */
  isOwn?: boolean;
}

/**
 * Zalo-style voice message bubble — play/pause button + waveform filling in as playback
 * progresses + duration + transcript below. Shared across admin/manager/staff (via
 * TicketCommentThread). Audio loads via blob URL (auth Bearer) then plays through a hidden
 * <audio> tag.
 */
export default function VoiceMessagePlayer({
  fileId,
  transcript,
  isOwn,
}: Props) {
  const { data: blobUrl, isError } = useFileBlobUrl(fileId);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  // Transcript hidden by default — expands on button press (like Zalo's show-on-demand transcript).
  const [showTranscript, setShowTranscript] = useState(false);

  const waveform = useMemo(() => seededWaveform(fileId), [fileId]);

  // Sync React state with the <audio> tag's events.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrent(el.currentTime);
    const onLoaded = () => setDuration(el.duration || 0);
    const onEnd = () => {
      setPlaying(false);
      setCurrent(0);
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("durationchange", onLoaded);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("durationchange", onLoaded);
      el.removeEventListener("ended", onEnd);
    };
  }, [blobUrl]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      void el.play();
      setPlaying(true);
    }
  };

  const progress = duration > 0 ? Math.min(current / duration, 1) : 0;
  const playedBars = Math.round(progress * BAR_COUNT);
  const timeLabel =
    duration > 0 ? formatDuration(current > 0 ? current : duration) : "--:--";

  const activeBar = isOwn ? "bg-primary-foreground" : "bg-primary";
  const inactiveBar = isOwn
    ? "bg-primary-foreground/35"
    : "bg-muted-foreground/30";
  const timeText = isOwn
    ? "text-primary-foreground/85"
    : "text-muted-foreground";
  const btnCls = isOwn
    ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
    : "bg-primary/10 text-primary hover:bg-primary/20";

  return (
    <div className="min-w-[200px] max-w-[280px] space-y-2">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={togglePlay}
          disabled={!blobUrl}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50",
            btnCls,
          )}
          aria-label={playing ? "Pause" : "Play"}
        >
          {!blobUrl && !isError ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : playing ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="ml-0.5 h-4 w-4" />
          )}
        </button>

        <div className="flex h-7 flex-1 items-center gap-[2px]">
          {waveform.map((barH, i) => (
            <div
              key={i}
              className={cn(
                "min-w-[2px] flex-1 rounded-full",
                i < playedBars ? activeBar : inactiveBar,
              )}
              style={{ height: `${6 + barH * 18}px` }}
            />
          ))}
        </div>

        <span
          className={cn(
            "min-w-[38px] text-right text-[11px] font-semibold tabular-nums",
            timeText,
          )}
        >
          {timeLabel}
        </span>
      </div>

      {isError && (
        <p className={cn("text-[11px]", timeText)}>Failed to load audio</p>
      )}

      {!!transcript?.trim() && (
        <>
          <button
            type="button"
            onClick={() => setShowTranscript((v) => !v)}
            className={cn(
              "flex items-center gap-0.5 text-[11px] font-medium underline underline-offset-2 hover:opacity-80",
              timeText,
            )}
          >
            {showTranscript ? "Hide transcript" : "View transcript"}
            {showTranscript ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
          {showTranscript && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {transcript.trim()}
            </p>
          )}
        </>
      )}

      {blobUrl && <audio ref={audioRef} src={blobUrl} preload="metadata" />}
    </div>
  );
}
