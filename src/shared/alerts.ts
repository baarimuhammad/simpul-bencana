import { CHANNELS } from "./types.ts";
import { SIM_TIME } from "./seed.ts";
import type { Alert, Basin, Level } from "./types.ts";
export function alertMessage(basin: Basin, level: Level) {
  return `LATIHAN / DATA SIMULASI — ${level.toUpperCase()}: potensi banjir dan longsor di DAS ${basin.name}, ${basin.province}. Warga ${basin.districts[0].name} diminta menjauhi sungai dan lereng, menyiapkan tas siaga, serta mengikuti arahan petugas BPBD menuju ${basin.shelters[0].name}. Bantu kelompok rentan. Jangan melintasi arus air. Ini bukan peringatan bencana aktual.`;
}
export function makeAlert(
  basin: Basin,
  level: Level,
  probability: number,
  index = 1,
): Alert {
  return {
    id: `SB-SIM-${String(index).padStart(3, "0")}`,
    basinId: basin.id,
    level,
    probability,
    status: "draft",
    created: SIM_TIME,
    channels: CHANNELS.map((name, i) => ({
      id: `ch-${i}`,
      name,
      status: "pending",
      detail: "Belum diverifikasi BPBD",
    })),
    message: alertMessage(basin, level),
  };
}
export function makeCap(
  basin: Basin,
  level: Level = "Awas",
  id = "SB-SIM-CAP-001",
  message = alertMessage(basin, level),
) {
  return {
    identifier: id,
    sender: "simulasi@simpul-bencana.invalid",
    sent: SIM_TIME,
    status: "Test",
    msgType: "Alert",
    scope: "Public",
    note: "PROTOTIPE - DATA SIMULASI. Bukan peringatan resmi.",
    info: [
      {
        language: "id-ID",
        category: ["Met"],
        event: `Latihan potensi banjir dan longsor DAS ${basin.name}`,
        responseType: ["Prepare"],
        urgency: level === "Awas" ? "Immediate" : "Expected",
        severity:
          level === "Awas"
            ? "Extreme"
            : level === "Siaga"
              ? "Severe"
              : "Moderate",
        certainty: "Possible",
        effective: SIM_TIME,
        expires: "2026-10-21T07:00:00.000Z",
        senderName: "SIMPUL BENCANA — Prototipe KIM",
        headline: `LATIHAN: ${level} — DAS ${basin.name}`,
        description: "Skenario sintetis; seluruh parameter operasional dummy.",
        instruction: message,
        area: [
          {
            areaDesc: `DAS ${basin.name} — batas wilayah ilustratif`,
            circle: [`${basin.lat},${basin.lon} 12`],
          },
        ],
      },
    ],
  };
}
const escapeXml = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
export function capXml(cap: ReturnType<typeof makeCap>) {
  const i = cap.info[0];
  const tag = (k: string, v: string) => `<${k}>${escapeXml(v)}</${k}>`;
  return `<?xml version="1.0" encoding="UTF-8"?><alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">${["identifier", "sender", "sent", "status", "msgType", "scope", "note"].map((k) => tag(k, String(cap[k as keyof typeof cap]))).join("")}<info>${tag("language", i.language)}${tag("category", "Met")}${tag("event", i.event)}${tag("responseType", "Prepare")}${tag("urgency", i.urgency)}${tag("severity", i.severity)}${tag("certainty", i.certainty)}${tag("effective", i.effective)}${tag("expires", i.expires)}${tag("senderName", i.senderName)}${tag("headline", i.headline)}${tag("description", i.description)}${tag("instruction", i.instruction)}<area>${tag("areaDesc", i.area[0].areaDesc)}${tag("circle", i.area[0].circle[0])}</area></info></alert>`;
}
