import { describe, it, expect } from "vitest";
import { upsertThresholdSchema } from "./threshold.schema";

/** A payload that passes every rule; each test bends one field out of shape. */
const valid = {
  voltageMin: 20,
  voltageMax: 29,
  temperatureMin: -10,
  temperatureMax: 55,
  socWarningThreshold: 30,
  socCriticalThreshold: 15,
};

/** Field paths carrying an issue, so a test can assert BOTH ends of a pair report. */
const errorPaths = (input: unknown): string[] => {
  const r = upsertThresholdSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => i.path.join("."));
};

describe("upsertThresholdSchema — cross-field bounds", () => {
  it("accepts a well-formed set of thresholds", () => {
    expect(upsertThresholdSchema.safeParse(valid).success).toBe(true);
  });

  describe("voltage", () => {
    // Reported on the max only: the dialog reddens the min via PAIRED_FIELDS rather
    // than printing the same sentence twice. An empty-message issue cannot do that job —
    // Zod substitutes its own "Invalid input" text for it.
    it("rejects max below min, reporting once on the max", () => {
      const paths = errorPaths({ ...valid, voltageMin: 30, voltageMax: 25 });
      expect(paths).toEqual(["voltageMax"]);
    });

    it("rejects max equal to min", () => {
      expect(
        upsertThresholdSchema.safeParse({
          ...valid,
          voltageMin: 24,
          voltageMax: 24,
        }).success,
      ).toBe(false);
    });

    it("names the fields the way the form labels them", () => {
      const r = upsertThresholdSchema.safeParse({
        ...valid,
        voltageMin: 30,
        voltageMax: 25,
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0]?.message).toBe(
          "Critical voltage must be greater than warning voltage",
        );
      }
    });
  });

  describe("temperature", () => {
    it("rejects max below min, reporting once on the max", () => {
      const paths = errorPaths({
        ...valid,
        temperatureMin: 60,
        temperatureMax: 20,
      });
      expect(paths).toEqual(["temperatureMax"]);
    });

    // Unlike voltage, temperature is legitimately negative — the bound is ordering only.
    it("accepts a negative minimum below a positive maximum", () => {
      expect(
        upsertThresholdSchema.safeParse({
          ...valid,
          temperatureMin: -20,
          temperatureMax: 10,
        }).success,
      ).toBe(true);
    });
  });

  describe("SOC warning vs critical", () => {
    // Critical is the harsher alarm, so it must trip at a LOWER charge than the warning.
    it("rejects critical at or above warning, reporting on critical", () => {
      const paths = errorPaths({
        ...valid,
        socWarningThreshold: 15,
        socCriticalThreshold: 30,
      });
      expect(paths).toEqual(["socCriticalThreshold"]);
    });

    it("rejects the two being equal", () => {
      expect(
        upsertThresholdSchema.safeParse({
          ...valid,
          socWarningThreshold: 20,
          socCriticalThreshold: 20,
        }).success,
      ).toBe(false);
    });
  });

  describe("SOH warning vs critical (both optional)", () => {
    it("skips the comparison when neither is given", () => {
      expect(upsertThresholdSchema.safeParse(valid).success).toBe(true);
    });

    it("skips the comparison when only one is given", () => {
      expect(
        upsertThresholdSchema.safeParse({
          ...valid,
          sohWarningThreshold: 80,
        }).success,
      ).toBe(true);
    });

    it("rejects critical at or above warning once both are given", () => {
      const paths = errorPaths({
        ...valid,
        sohWarningThreshold: 70,
        sohCriticalThreshold: 85,
      });
      expect(paths).toEqual(["sohCriticalThreshold"]);
    });
  });
});
