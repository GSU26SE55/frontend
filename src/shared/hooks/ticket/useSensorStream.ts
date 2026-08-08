import { useEffect, useRef, useState } from "react";
import { openSse, parseReading, parseStats } from "@/shared/lib/sse";
import { SensorSourceCodeEnum } from "@/shared/enums/battery/telemetry.enum";
import type { SensorStreamState } from "@/shared/types/battery/sensor-stream.types";

// Number of recreates (re-reading the token) when the stream is permanently CLOSED — capped to
// avoid a reconnect loop on 403 (permanent permission failure). Transient (CONNECTING) lets EventSource reconnect itself.
const MAX_RECREATE = 3;

const initialState = (scope: string | null): SensorStreamState =>
  scope ? { status: "connecting" } : { status: "closed" };

/**
 * Consumes SSE telemetry for a scope. Issue GH-114 only uses the `reading` branch (scope asset:{id}).
 * Returns `SensorStreamState`. `scope = null` → closes the stream (status "closed").
 * GH-116 will extend this for the `summary` branch (scope site:{id}) — do NOT change this asset behavior.
 */
export function useSensorStream(scope: string | null): SensorStreamState {
  const [state, setState] = useState<SensorStreamState>(() =>
    initialState(scope),
  );

  // Reset state when scope changes — render-phase pattern (React docs), avoids setState in an effect.
  const [prevScope, setPrevScope] = useState(scope);
  if (scope !== prevScope) {
    setPrevScope(scope);
    setState(initialState(scope));
  }

  const esRef = useRef<EventSource | null>(null);
  const recreateRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!scope) return;

    let cancelled = false;
    recreateRef.current = 0;

    const connect = () => {
      esRef.current = openSse(scope, {
        onOpen: () => {
          if (cancelled) return;
          recreateRef.current = 0;
          setState((s) => ({ ...s, status: s.reading ? "live" : "open-idle" }));
        },
        onEvent: (event, data) => {
          if (cancelled) return;
          if (event === "reading") {
            const reading = parseReading(data);
            // Multi-source per battery (§5.4): only keep primary (or unspecified) as the
            // headline reading, ignore redundant / external-temp (partial readings).
            if (
              reading &&
              (reading.sensorSourceCode == null ||
                reading.sensorSourceCode === SensorSourceCodeEnum.PRIMARY)
            ) {
              setState((s) => ({ ...s, status: "live", reading }));
            }
          } else if (event === "stats") {
            // `stats` is independent of `reading` — doesn't change status (stats can arrive
            // before the first reading). If BE hasn't deployed it yet, this event won't fire, card stays empty.
            // Keyed by `window`: BE pushes both "1h" and "today" through the same event.
            const stats = parseStats(data);
            if (stats) {
              setState((s) => ({
                ...s,
                stats: { ...s.stats, [stats.window]: stats },
              }));
            }
          } else if (event === "ping") {
            setState((s) => ({
              ...s,
              status: s.reading ? "live" : "open-idle",
              lastPingAt: Date.now(),
            }));
          }
        },
        onError: (es) => {
          if (cancelled) return;
          if (es.readyState === EventSource.CLOSED) {
            // Permanent (4xx before opening, or token expired → 401). Recreate reads a fresh token, capped.
            if (recreateRef.current < MAX_RECREATE) {
              recreateRef.current += 1;
              setState((s) => ({ ...s, status: "connecting" }));
              timerRef.current = setTimeout(() => {
                if (cancelled) return;
                esRef.current?.close();
                connect();
              }, 1000 * recreateRef.current);
            } else {
              setState((s) => ({ ...s, status: "error" }));
              es.close();
            }
          } else {
            // CONNECTING (transient) → EventSource reconnects on its own, no intervention needed.
            setState((s) => ({ ...s, status: "connecting" }));
          }
        },
      });
    };

    connect();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      esRef.current?.close();
      esRef.current = null;
    };
  }, [scope]);

  return state;
}
