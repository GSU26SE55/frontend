import { describe, it, expect } from "vitest";
import { ambientThresholdSchema } from "./ambient.schema";

const valid = {
  siteId: "8f14e45f-ceea-4a67-b3f6-7f2b3c5d1a90",
  highAmbientTempWarning: "35",
  highAmbientTempCritical: "45",
  highHumidityWarning: "80",
  highHumidityCritical: "90",
  comboTempThreshold: "",
  comboHumidityThreshold: "",
  enabled: true,
};

const errorPaths = (input: unknown): string[] => {
  const r = ambientThresholdSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => i.path.join("."));
};

describe("ambientThresholdSchema", () => {
  it("accepts a well-formed config", () => {
    expect(ambientThresholdSchema.safeParse(valid).success).toBe(true);
  });

  it("treats every threshold as optional", () => {
    expect(
      ambientThresholdSchema.safeParse({
        siteId: valid.siteId,
        enabled: false,
      }).success,
    ).toBe(true);
  });

  // Neither layer bounded these before: the BE checks only SiteId and the
  // critical/warning ordering, so an out-of-range percentage reached the database and
  // produced a threshold that could never trip.
  describe("humidity is a percentage", () => {
    it.each([
      ["above 100", "500"],
      ["negative", "-20"],
    ])("rejects a warning %s", (_label, value) => {
      expect(errorPaths({ ...valid, highHumidityWarning: value })).toContain(
        "highHumidityWarning",
      );
    });

    it("rejects an out-of-range critical", () => {
      expect(errorPaths({ ...valid, highHumidityCritical: "150" })).toContain(
        "highHumidityCritical",
      );
    });

    it("rejects an out-of-range combo threshold", () => {
      const paths = errorPaths({
        ...valid,
        comboTempThreshold: "30",
        comboHumidityThreshold: "101",
      });
      expect(paths).toContain("comboHumidityThreshold");
    });

    it("accepts the exact bounds", () => {
      expect(
        ambientThresholdSchema.safeParse({
          ...valid,
          highHumidityWarning: "0",
          highHumidityCritical: "100",
        }).success,
      ).toBe(true);
    });
  });

  describe("temperature stays within a plausible range", () => {
    it("rejects an implausible high value", () => {
      expect(errorPaths({ ...valid, highAmbientTempWarning: "900" })).toContain(
        "highAmbientTempWarning",
      );
    });

    // Unlike humidity, negative temperatures are ordinary.
    it("accepts a sub-zero threshold", () => {
      expect(
        ambientThresholdSchema.safeParse({
          ...valid,
          highAmbientTempWarning: "-10",
          highAmbientTempCritical: "-5",
        }).success,
      ).toBe(true);
    });
  });

  it("still rejects a non-numeric entry", () => {
    expect(errorPaths({ ...valid, highHumidityWarning: "abc" })).toContain(
      "highHumidityWarning",
    );
  });

  // Ambient runs opposite to SOC: heat and damp are dangerous when HIGH, so critical
  // must sit at or above warning.
  it("requires critical to be at least the warning threshold", () => {
    expect(
      errorPaths({
        ...valid,
        highHumidityWarning: "90",
        highHumidityCritical: "80",
      }),
    ).toContain("highHumidityCritical");
  });

  it("requires both halves of the combo rule", () => {
    expect(errorPaths({ ...valid, comboTempThreshold: "30" })).toContain(
      "comboHumidityThreshold",
    );
  });
});
