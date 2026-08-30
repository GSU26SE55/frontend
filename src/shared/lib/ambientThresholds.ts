import type {
  AmbientReadingDto,
  AmbientThresholdConfigDto,
} from "@/shared/types/ambient/ambient.types";

/**
 * Severity of a single ambient value against the site's configured threshold.
 * `null` means the metric isn't monitored (the field was left blank in the config).
 */
export type AmbientLevel = "critical" | "warning" | "ok" | null;

/**
 * Grades one value against its warning/critical pair.
 *
 * A blank threshold means "not monitored" — the config drawer says so explicitly — so it must
 * return null rather than defaulting to a limit. Inventing a limit would paint rows red using a
 * number nobody configured and that the backend never alerted on.
 */
function grade(
  value: number | null | undefined,
  warning: number | null | undefined,
  critical: number | null | undefined,
): AmbientLevel {
  if (value === null || value === undefined) return null;
  if (critical !== null && critical !== undefined && value >= critical)
    return "critical";
  if (warning !== null && warning !== undefined && value >= warning)
    return "warning";
  // Monitored (at least one bound set) and under it → explicitly OK.
  const monitored =
    (warning !== null && warning !== undefined) ||
    (critical !== null && critical !== undefined);
  return monitored ? "ok" : null;
}

export interface AmbientRowEvaluation {
  temperature: AmbientLevel;
  humidity: AmbientLevel;
  gas: AmbientLevel;
  /** Wet → "critical" (always alerts, no configurable threshold). Dry → "ok". Not reported → null. */
  water: AmbientLevel;
  /**
   * The combo rule: heat plus moisture is worse than either alone, so the site config carries a
   * separate lower pair that only fires when BOTH are exceeded together. It can flag a row whose
   * temperature and humidity are each individually below their own warning line.
   */
  combo: boolean;
  /** Worst level on the row — drives the row highlight. */
  worst: AmbientLevel;
}

/**
 * Evaluates one reading against the site's threshold config — the ambient counterpart of
 * `toWarningRows` for battery readings.
 *
 * Reads the SAME config the backend enforces (`AmbientThresholdConfigDto`, the one edited in
 * the "Alert threshold" drawer) rather than hardcoding limits, so a row is coloured by exactly
 * the numbers that decided whether an alert fired.
 */
export function evaluateAmbientRow(
  reading: Pick<
    AmbientReadingDto,
    "ambientTemperature" | "humidity" | "gasConcentration" | "waterLeakDetected"
  >,
  threshold: AmbientThresholdConfigDto | null | undefined,
): AmbientRowEvaluation {
  // Water has no configurable threshold (3 sensors are independent) — wet always alerts,
  // regardless of whether temp/humidity/gas monitoring is enabled for the site.
  const water: AmbientLevel =
    reading.waterLeakDetected === null || reading.waterLeakDetected === undefined
      ? null
      : reading.waterLeakDetected
        ? "critical"
        : "ok";

  const none: AmbientRowEvaluation = {
    temperature: null,
    humidity: null,
    gas: null,
    water,
    combo: false,
    worst: water === "critical" ? "critical" : null,
  };
  // `enabled: false` means the site opted out of monitoring — grading anyway would show
  // breaches for limits that are not in force.
  if (!threshold || !threshold.enabled) return none;

  const temperature = grade(
    reading.ambientTemperature,
    threshold.highAmbientTempWarning,
    threshold.highAmbientTempCritical,
  );
  const humidity = grade(
    reading.humidity,
    threshold.highHumidityWarning,
    threshold.highHumidityCritical,
  );
  const gas = grade(
    reading.gasConcentration,
    threshold.highGasWarning,
    threshold.highGasCritical,
  );

  // Only active when BOTH combo thresholds have a value — matches the config drawer's own note.
  const combo =
    threshold.comboTempThreshold !== null &&
    threshold.comboTempThreshold !== undefined &&
    threshold.comboHumidityThreshold !== null &&
    threshold.comboHumidityThreshold !== undefined &&
    reading.ambientTemperature !== null &&
    reading.ambientTemperature !== undefined &&
    reading.humidity !== null &&
    reading.humidity !== undefined &&
    reading.ambientTemperature >= threshold.comboTempThreshold &&
    reading.humidity >= threshold.comboHumidityThreshold;

  const levels = [temperature, humidity, gas, water];
  const worst: AmbientLevel = levels.includes("critical")
    ? "critical"
    : levels.includes("warning") || combo
      ? // A combo breach is a real alert condition, so it must not read as "ok" just because
        // neither metric crossed its own line.
        "warning"
      : levels.includes("ok")
        ? "ok"
        : null;

  return { temperature, humidity, gas, water, combo, worst };
}

/** Tailwind text colour for a graded value. `ok`/null stay unstyled — only breaches shout. */
export function ambientLevelTextClass(level: AmbientLevel): string {
  if (level === "critical") return "text-destructive font-semibold";
  if (level === "warning") return "text-amber-600 dark:text-amber-500";
  return "";
}

/** Tailwind row-background for the worst level on a row. */
export function ambientLevelRowClass(level: AmbientLevel): string {
  if (level === "critical") return "bg-destructive/10";
  if (level === "warning") return "bg-amber-500/10";
  return "";
}
