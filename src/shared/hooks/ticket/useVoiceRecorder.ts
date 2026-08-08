import { useCallback, useEffect, useRef, useState } from "react";

const BAR_COUNT = 24;
const WAVEFORM_INTERVAL_MS = 80;

interface UseVoiceRecorderResult {
  isRecording: boolean;
  elapsedSeconds: number;
  /** BAR_COUNT values 0-1 — real-time mic amplitude, updated every ~80ms */
  waveform: number[];
  start: () => Promise<void>;
  stop: () => Promise<File | null>;
  cancel: () => void;
}

const EXT_BY_MIME: Record<string, string> = {
  "audio/webm": "webm",
  "video/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
};

const SILENT_WAVEFORM = Array<number>(BAR_COUNT).fill(0);

/**
 * Records audio via MediaRecorder. BE (ChatVoiceTranscribeCommand) matches ContentType
 * EXACTLY against a whitelist (audio/webm, audio/mp4, ...) — but MediaRecorder.mimeType
 * usually includes a codec suffix (e.g. "audio/webm;codecs=opus"), which must be stripped before creating the File.
 *
 * The waveform is captured via the Web Audio API (AnalyserNode) on the same mic stream — purely for
 * UI display (like Gemini's speaking wave effect), it doesn't affect the recorded file.
 */
export function useVoiceRecorder(): UseVoiceRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(SILENT_WAVEFORM);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const waveformTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (waveformTimerRef.current) {
      clearInterval(waveformTimerRef.current);
      waveformTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setWaveform(SILENT_WAVEFORM);
  }, []);

  const start = useCallback(async () => {
    if (typeof MediaRecorder === "undefined") {
      throw new Error("This browser doesn't support audio recording.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start();
    recorderRef.current = recorder;
    setIsRecording(true);
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);

    // Waveform display — an error here (e.g. older browser) shouldn't block recording.
    try {
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const chunkSize = Math.max(1, Math.floor(data.length / BAR_COUNT));
      waveformTimerRef.current = setInterval(() => {
        analyser.getByteFrequencyData(data);
        const bars: number[] = [];
        for (let i = 0; i < BAR_COUNT; i++) {
          let sum = 0;
          for (let j = 0; j < chunkSize; j++)
            sum += data[i * chunkSize + j] ?? 0;
          bars.push(Math.min(1, sum / chunkSize / 255));
        }
        setWaveform(bars);
      }, WAVEFORM_INTERVAL_MS);
    } catch {
      // AudioContext not supported — recording still works normally, just no wave effect.
    }
  }, []);

  const stop = useCallback((): Promise<File | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder) {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        cleanup();
        setIsRecording(false);
        if (chunksRef.current.length === 0) {
          resolve(null);
          return;
        }
        const rawMime = recorder.mimeType || "audio/webm";
        const cleanMime = rawMime.split(";")[0].trim();
        const ext = EXT_BY_MIME[cleanMime] ?? "webm";
        const blob = new Blob(chunksRef.current, { type: cleanMime });
        const file = new File([blob], `voice-message.${ext}`, {
          type: cleanMime,
        });
        console.log("[useVoiceRecorder] stop() — recording finished", {
          rawMime,
          cleanMime,
          chunkCount: chunksRef.current.length,
          blobSize: blob.size,
          fileSize: file.size,
        });
        resolve(file);
      };
      recorder.stop();
    });
  }, [cleanup]);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    cleanup();
    setIsRecording(false);
    chunksRef.current = [];
  }, [cleanup]);

  useEffect(() => cleanup, [cleanup]);

  return { isRecording, elapsedSeconds, waveform, start, stop, cancel };
}
