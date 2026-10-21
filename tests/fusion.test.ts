import { describe, expect, it } from "vitest";
import { BASINS } from "../src/shared/seed";
import {
  evaluate,
  fuse,
  LAST_STEP,
  replay,
  scenarioInputs,
  toLevel,
} from "../src/shared/fusion";
import type { CitizenReport } from "../src/shared/types";
const basin = BASINS[0];
describe("fusi deterministik", () => {
  it("Hari Normal tetap Normal pada semua langkah", () => {
    for (let step = 0; step <= LAST_STEP; step++)
      expect(fuse(basin, scenarioInputs("normal", step)).level).toBe("Normal");
  });
  it("Ekstrem berkembang dari Waspada ke Awas", () => {
    expect(fuse(basin, scenarioInputs("extreme", 0)).level).toBe("Waspada");
    expect(fuse(basin, scenarioInputs("extreme", 10)).level).toBe("Awas");
  });
  it("Alarm Palsu tidak mencapai Siaga meskipun ambang hujan memicu pembanding", () => {
    const data = replay(basin, "false-alarm");
    expect(data.some((r) => r.separateAlert)).toBe(true);
    expect(data.every((r) => r.level === "Normal")).toBe(true);
  });
  it("bukti yang sama tidak terakumulasi saat rendering / retry", () => {
    const a = fuse(basin);
    for (let i = 0; i < 20; i++) expect(fuse(basin)).toEqual(a);
  });
  it("bobot berjumlah satu dan dekomposisi skor tepat", () => {
    const risk = fuse(basin);
    expect(risk.factors.reduce((n, f) => n + f.weight, 0)).toBeCloseTo(1);
    expect(
      risk.factors.reduce((n, f) => n + f.contribution, 0) +
        risk.interaction -
        risk.mitigating,
    ).toBeCloseTo(risk.score);
  });
  const report: CitizenReport = {
    id: "R-1",
    basinId: basin.id,
    district: "Karang Baru",
    kind: "Muka air naik",
    severity: 3,
    note: "Dummy",
    status: "pending",
    created: "2026-10-21",
  };
  it("laporan pending tidak memengaruhi risiko", () =>
    expect(fuse(basin, basin.inputs, [report]).probability).toBe(
      fuse(basin).probability,
    ));
  it("laporan tervalidasi memperbarui estimasi, duplikat dihitung sekali", () => {
    const valid = { ...report, status: "validated" as const };
    expect(fuse(basin, basin.inputs, [valid]).probability).toBeGreaterThan(
      fuse(basin).probability,
    );
    expect(fuse(basin, basin.inputs, [valid, valid])).toEqual(
      fuse(basin, basin.inputs, [valid]),
    );
  });
  it("laporan DAS lain tidak memengaruhi pilot", () =>
    expect(
      fuse(basin, basin.inputs, [
        { ...report, basinId: "deli", status: "validated" },
      ]),
    ).toEqual(fuse(basin)));
  it("ambang level memiliki batas yang konsisten", () => {
    expect(toLevel(0.24999)).toBe("Normal");
    expect(toLevel(0.25)).toBe("Waspada");
    expect(toLevel(0.5)).toBe("Siaga");
    expect(toLevel(0.75)).toBe("Awas");
  });
  it("bukti warga dibatasi dan posterior selalu 0–1", () => {
    const reports = Array.from({ length: 100 }, (_, i) => ({
      ...report,
      id: `R${i}`,
      status: "validated" as const,
    }));
    const r = fuse(basin, basin.inputs, reports);
    expect(r.reportBoost).toBe(0.42);
    expect(r.probability).toBeGreaterThan(0);
    expect(r.probability).toBeLessThan(1);
  });
  it("metrik dihitung dari 33 observasi dan confusion matrix menjumlah tepat", () => {
    const r = evaluate(basin);
    expect(r.observations).toHaveLength(33);
    expect(r.tp + r.fp + r.tn + r.fn).toBe(33);
    expect(r.precision).toBe(r.tp / (r.tp + r.fp));
  });
});
