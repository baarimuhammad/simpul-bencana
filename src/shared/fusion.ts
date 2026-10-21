import type {
  Basin,
  CitizenReport,
  FusionResult,
  Inputs,
  Level,
  Scenario,
} from "./types.ts";
export const clamp = (n: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, n));
export const toLevel = (p: number): Level =>
  p >= 0.75 ? "Awas" : p >= 0.5 ? "Siaga" : p >= 0.25 ? "Waspada" : "Normal";
const logit = (p: number) => Math.log(p / (1 - p));
/** Pedagogical Bayesian-style score, NOT a trained or calibrated probability model. */
export function fuse(
  basin: Basin,
  inputs: Inputs = basin.inputs,
  reports: CitizenReport[] = [],
): FusionResult {
  const normalized = [
    clamp(inputs.rain / 220),
    clamp(inputs.forestLoss / 80),
    clamp(inputs.slope / 50),
    clamp(inputs.water / 500),
  ];
  const rawWeights = [
    0.34,
    0.22 + (inputs.forestLoss > 45 ? 0.035 : 0),
    0.14 + (basin.inputs.slope > 30 ? 0.035 : 0),
    0.3 + (basin.id === "ciliwung" ? 0.04 : 0),
  ];
  const weights = rawWeights.map(
    (w) => w / rawWeights.reduce((a, b) => a + b, 0),
  );
  const positive = normalized.map((n, i) => n * weights[i]);
  const interaction = 0.15 * normalized[0] * normalized[1];
  const mitigating =
    0.24 * normalized[0] * (1 - normalized[1]) * (1 - normalized[3]);
  // Repeated report IDs do not count twice. Only approved, same-basin evidence contributes.
  const valid = [
    ...new Map(
      reports
        .filter((r) => r.status === "validated" && r.basinId === basin.id)
        .map((r) => [r.id, r]),
    ).values(),
  ];
  const reportBoost = Math.min(
    0.42,
    valid.reduce((n, r) => n + 0.07 * r.severity, 0),
  );
  const score = clamp(
    positive.reduce((a, b) => a + b, 0) + interaction - mitigating,
  );
  const logEvidence = 7 * (score - 0.32) + reportBoost;
  const probability = 1 / (1 + Math.exp(-(logit(basin.prior) + logEvidence)));
  const labels = [
    "Curah hujan 24 jam",
    "Degradasi tutupan hulu",
    "Kemiringan lereng",
    "Tinggi muka air",
  ];
  const units = ["mm", "%", "°", "cm"];
  const descriptions = [
    "Pemicu meteorologis",
    "Kondisi retensi dan infiltrasi",
    "Kerentanan gerakan tanah",
    "Respons hidrologi teramati",
  ];
  return {
    probability,
    prior: basin.prior,
    level: toLevel(probability),
    score,
    likelihoodRatio: Math.exp(logEvidence),
    interaction,
    mitigating,
    reportBoost,
    simulated: true,
    dominantHazard:
      inputs.slope >= 32 && inputs.forestLoss >= 45
        ? "Banjir & longsor"
        : "Banjir",
    factors: normalized.map((_, i) => ({
      key: ["rain", "forestLoss", "slope", "water"][i],
      label: labels[i],
      source: ["BMKG", "Kemenhut", "BIG", "KemenPU"][i],
      value: [inputs.rain, inputs.forestLoss, inputs.slope, inputs.water][i],
      unit: units[i],
      weight: weights[i],
      contribution: positive[i],
      description: descriptions[i],
    })),
  };
}
export const LAST_STEP = 10;
export function scenarioInputs(scenario: Scenario, step: number): Inputs {
  const t = clamp(step, 0, LAST_STEP) / LAST_STEP;
  if (scenario === "normal")
    return {
      rain: Math.round(18 + 16 * t),
      forestLoss: 12,
      slope: 28,
      water: Math.round(100 + 35 * t),
    };
  if (scenario === "false-alarm")
    return {
      rain: Math.round(25 + 180 * Math.sin(Math.PI * t)),
      forestLoss: 8,
      slope: 15,
      water: Math.round(95 + 15 * Math.sin(Math.PI * t)),
    };
  return {
    rain: Math.round(26 + 210 * t),
    forestLoss: 61,
    slope: 36,
    water: Math.round(105 + 420 * t),
  };
}
export function replay(basin: Basin, scenario: Scenario) {
  return Array.from({ length: LAST_STEP + 1 }, (_, step) => {
    const inputs = scenarioInputs(scenario, step);
    const risk = fuse(basin, inputs);
    return {
      step,
      minute: step * 30,
      inputs,
      ...risk,
      separate:
        inputs.rain >= 180
          ? "Peringatan berbasis hujan"
          : "Menunggu data / koordinasi",
      separateAlert: inputs.rain >= 180,
      fusionAlert: risk.probability >= 0.5,
      actual: scenario === "extreme" && step >= 8,
    };
  });
}
export function evaluate(basin: Basin) {
  const observations = (["normal", "extreme", "false-alarm"] as const).flatMap(
    (s) =>
      replay(basin, s).map((r) => ({
        ...r,
        scenario: s,
        actual: s === "extreme" && r.step >= 5,
      })),
  );
  const tp = observations.filter((r) => r.fusionAlert && r.actual).length,
    fp = observations.filter((r) => r.fusionAlert && !r.actual).length,
    tn = observations.filter((r) => !r.fusionAlert && !r.actual).length,
    fn = observations.filter((r) => !r.fusionAlert && r.actual).length;
  const curve = replay(basin, "extreme"),
    first = curve.find((r) => r.fusionAlert)?.minute,
    baseline = curve.find((r) => r.separateAlert)?.minute;
  return {
    tp,
    fp,
    tn,
    fn,
    precision: tp + fp ? tp / (tp + fp) : 0,
    recall: tp + fn ? tp / (tp + fn) : 0,
    falseAlarmRate: fp + tn ? fp / (fp + tn) : 0,
    leadMinutes: first === undefined ? 0 : 240 - first,
    baselineLeadMinutes: baseline === undefined ? 0 : 240 - baseline,
    observations,
  };
}
