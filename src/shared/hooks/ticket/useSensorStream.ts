import { useEffect, useRef, useState } from "react";
import { openSse, parseReading, parseStats } from "@/shared/lib/sse";
import { SensorSourceCodeEnum } from "@/shared/enums/battery/telemetry.enum";
import type { SensorStreamState } from "@/shared/types/battery/sensor-stream.types";

// Số lần recreate (đọc lại token) khi stream CLOSED vĩnh viễn — cap để tránh
// reconnect-loop khi 403 (sai quyền vĩnh viễn). Transient (CONNECTING) để EventSource tự reconnect.
const MAX_RECREATE = 3;

const initialState = (scope: string | null): SensorStreamState =>
  scope ? { status: "connecting" } : { status: "closed" };

/**
 * Consume SSE telemetry cho 1 scope. Issue GH-114 chỉ dùng nhánh `reading` (scope asset:{id}).
 * Trả `SensorStreamState`. `scope = null` → đóng stream (status "closed").
 * GH-116 sẽ mở rộng cho nhánh `summary` (scope site:{id}) — KHÔNG sửa hành vi asset này.
 */
export function useSensorStream(scope: string | null): SensorStreamState {
  const [state, setState] = useState<SensorStreamState>(() =>
    initialState(scope),
  );

  // Reset state khi scope đổi — pattern render-phase (React docs), tránh setState trong effect.
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
            // Đa nguồn 1 pin (§5.4): chỉ giữ primary (hoặc không khai) làm headline,
            // bỏ qua redundant / external-temp (số liệu một phần).
            if (
              reading &&
              (reading.sensorSourceCode == null ||
                reading.sensorSourceCode === SensorSourceCodeEnum.PRIMARY)
            ) {
              setState((s) => ({ ...s, status: "live", reading }));
            }
          } else if (event === "stats") {
            // `stats` độc lập với `reading` — không đổi status (stats có thể tới
            // trước reading đầu tiên). BE chưa deploy → không có event này, card trống.
            // Key theo `window`: BE đẩy cả "1h" lẫn "today" qua cùng event.
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
            // Permanent (4xx trước khi mở, hoặc token hết hạn → 401). Recreate đọc token mới, có cap.
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
            // CONNECTING (transient) → EventSource tự reconnect, không can thiệp.
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
