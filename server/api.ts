import {
  BASINS,
  EXCHANGES,
  INITIAL_REPORTS,
  SEED,
  SIM_TIME,
  SOURCES,
} from "../src/shared/seed.ts";
import { evaluate, fuse, scenarioInputs } from "../src/shared/fusion.ts";
import { capXml, makeCap } from "../src/shared/alerts.ts";
import { CHANNELS, LEVELS } from "../src/shared/types.ts";
import { createReportPdf } from "../src/lib/export.ts";
import type {
  Alert,
  CitizenReport,
  Inputs,
  Role,
  Scenario,
} from "../src/shared/types.ts";
const ROLES: Role[] = ["admin", "bmkg", "forest", "geo", "bpbd", "public"];
const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-simpul-data": "simulation",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers });
const error = (message: string, status: number) =>
  json({ error: message, simulated: true }, status);
function validInputs(v: unknown): v is Inputs {
  if (!v || typeof v !== "object") return false;
  const d = v as Record<string, unknown>;
  return Object.entries({
    rain: 500,
    forestLoss: 100,
    slope: 90,
    water: 1000,
  }).every(
    ([key, max]) =>
      typeof d[key] === "number" &&
      Number.isFinite(d[key]) &&
      (d[key] as number) >= 0 &&
      (d[key] as number) <= max,
  );
}
import { openapi } from "./openapi.ts";
export { openapi };
export async function handleApi(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, "") || "/health";
  if (req.method === "OPTIONS")
    return new Response(null, {
      status: 204,
      headers: { Allow: "GET, POST, OPTIONS" },
    });
  if (!["GET", "POST"].includes(req.method))
    return error("Metode tidak didukung.", 405);
  try {
    // A direct HTTP attachment avoids browser restrictions on asynchronous blob
    // downloads. No document is retained by the stateless Function.
    if (path === "/report.pdf") {
      let title = "Ringkasan risiko DAS — simulasi";
      let lines = BASINS.map(
        (b) =>
          `DAS ${b.name}: ${fuse(b).level}. Probabilitas simulasi ${Math.round(fuse(b).probability * 100)}%.`,
      );
      if (req.method === "POST") {
        const raw = await req.text();
        if (raw.length > 131072)
          return error("Dokumen melebihi batas 128 KiB.", 413);
        let payload: { title?: unknown; lines?: unknown };
        try {
          payload = JSON.parse(new URLSearchParams(raw).get("payload") ?? "{}");
        } catch {
          return error("Payload laporan tidak valid.", 400);
        }
        if (
          !payload ||
          typeof payload.title !== "string" ||
          payload.title.length > 100 ||
          !Array.isArray(payload.lines) ||
          payload.lines.length > 400 ||
          !payload.lines.every(
            (line) => typeof line === "string" && line.length <= 2000,
          )
        )
          return error("Isi laporan tidak valid.", 400);
        title = payload.title;
        lines = payload.lines;
      }
      const bytes = await createReportPdf(title, lines);
      return new Response(bytes, {
        headers: {
          ...headers,
          "content-type": "application/pdf",
          "content-disposition":
            'attachment; filename="simpul-bencana-laporan-simulasi.pdf"',
        },
      });
    }
    if (req.method === "GET") {
      if (path === "/health")
        return json({
          status: "ok",
          simulated: true,
          seed: SEED,
          time: SIM_TIME,
          persistence: "browser-only",
          liveData: false,
        });
      if (path === "/openapi.json") return json(openapi);
      if (path === "/seed")
        return json({
          basins: BASINS,
          sources: SOURCES,
          reports: INITIAL_REPORTS,
          time: SIM_TIME,
          seed: SEED,
          simulated: true,
        });
      if (path === "/basins")
        return json({
          data: BASINS.map((b) => ({ ...b, risk: fuse(b) })),
          simulated: true,
        });
      if (path === "/catalog")
        return json({
          data: SOURCES,
          ownership: "Data tetap di instansi; query federatif disimulasikan.",
          simulated: true,
        });
      if (path === "/exchanges")
        return json({ data: EXCHANGES, simulated: true });
      const id = url.searchParams.get("basin") ?? "tamiang";
      const basin = BASINS.find((b) => b.id === id);
      if (["/risk", "/evaluation", "/cap"].includes(path) && !basin)
        return error("DAS tidak ditemukan.", 404);
      if (path === "/evaluation")
        return json({ ...evaluate(basin!), simulated: true });
      if (path === "/cap") {
        const cap = makeCap(basin!);
        return url.searchParams.get("format") === "xml"
          ? new Response(capXml(cap), {
              headers: {
                ...headers,
                "content-type": "application/xml; charset=utf-8",
              },
            })
          : json(cap);
      }
      if (path === "/risk") {
        const scenario = url.searchParams.get("scenario");
        const step = Number(url.searchParams.get("step") ?? 10);
        if (
          scenario &&
          !["normal", "extreme", "false-alarm"].includes(scenario)
        )
          return error("Skenario tidak dikenal.", 400);
        if (!Number.isInteger(step) || step < 0 || step > 10)
          return error("step harus bilangan bulat 0–10.", 400);
        const inputs = scenario
          ? scenarioInputs(scenario as Scenario, step)
          : basin!.inputs;
        return json({ basinId: id, inputs, ...fuse(basin!, inputs) });
      }
      return error("Endpoint tidak ditemukan.", 404);
    }
    if (Number(req.headers.get("content-length") ?? 0) > 32768)
      return error("Payload terlalu besar.", 413);
    const raw = await req.text();
    if (raw.length > 32768) return error("Payload terlalu besar.", 413);
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw);
    } catch {
      return error("JSON tidak valid.", 400);
    }
    if (!body || typeof body !== "object" || Array.isArray(body))
      return error("Objek JSON diperlukan.", 400);
    const role = req.headers.get("x-demo-role") as Role;
    if (!ROLES.includes(role))
      return error("Pilih X-Demo-Role yang valid (autentikasi simulasi).", 403);
    const basin = BASINS.find((b) => b.id === body.basinId);
    if (!basin) return error("DAS tidak ditemukan.", 404);
    if (path === "/fuse") {
      if (!validInputs(body.inputs))
        return error("Parameter di luar batas atau tidak lengkap.", 400);
      return json({ basinId: basin.id, ...fuse(basin, body.inputs) });
    }
    if (path === "/reports") {
      if (
        !["Hujan lebat", "Muka air naik", "Tanah bergerak"].includes(
          String(body.kind),
        ) ||
        !Number.isInteger(body.severity) ||
        Number(body.severity) < 1 ||
        Number(body.severity) > 3 ||
        typeof body.note !== "string" ||
        body.note.length < 5 ||
        body.note.length > 300 ||
        !basin.districts.some((d) => d.name === body.district)
      )
        return error(
          "Isi jenis, kecamatan, intensitas 1–3, dan catatan 5–300 karakter.",
          400,
        );
      return json(
        {
          report: {
            id: `W-SIM-${Number(body.sequence) || 1}`,
            basinId: basin.id,
            district: body.district,
            kind: body.kind,
            severity: body.severity,
            note: body.note,
            status: "pending",
            created: SIM_TIME,
          },
          simulated: true,
          persisted: false,
        },
        201,
      );
    }
    if (!["admin", "bpbd"].includes(role))
      return error("Tindakan memerlukan BPBD atau Admin Nasional.", 403);
    if (path === "/reports/validate") {
      const report = body.report as CitizenReport;
      if (
        !report ||
        typeof report.id !== "string" ||
        report.basinId !== basin.id ||
        !Number.isInteger(report.severity) ||
        report.severity < 1 ||
        report.severity > 3 ||
        !["Hujan lebat", "Muka air naik", "Tanah bergerak"].includes(
          report.kind,
        )
      )
        return error("Laporan tidak valid.", 400);
      return json({
        report: {
          ...report,
          status: body.accept === false ? "rejected" : "validated",
        },
        simulated: true,
        persisted: false,
      });
    }
    if (path === "/alerts/verify") {
      const alert = body.alert as Alert;
      const review = body.review as Alert["review"];
      if (
        !alert ||
        alert.basinId !== basin.id ||
        typeof alert.id !== "string" ||
        !LEVELS.includes(alert.level) ||
        alert.status !== "draft" ||
        alert.evidence?.sourceStatus !== "fixture" ||
        !validInputs(alert.evidence.inputs)
      )
        return error("Draf peringatan tidak valid.", 400);
      if (
        review?.dataChecked !== true ||
        review.areaChecked !== true ||
        review.messageChecked !== true
      )
        return error(
          "Tiga pemeriksaan BPBD wajib dicatat sebelum verifikasi.",
          400,
        );
      return json({
        alert: {
          ...alert,
          status: "verified",
          verifiedBy: role,
          review: {
            dataChecked: true,
            areaChecked: true,
            messageChecked: true,
          },
          channels: CHANNELS.map((name, i) => ({
            id: `ch-${i}`,
            name,
            status: "pending",
            detail: "Diverifikasi; menunggu latihan diseminasi",
          })),
        },
        simulated: true,
        persisted: false,
      });
    }
    if (path === "/disseminate") {
      if (body.mode !== "limited")
        return error(
          "Mode bayangan memblokir diseminasi. Aktifkan operasional terbatas untuk latihan.",
          403,
        );
      const alert = body.alert as Alert;
      if (
        !alert ||
        alert.status !== "verified" ||
        !["admin", "bpbd"].includes(alert.verifiedBy ?? "") ||
        alert.review?.dataChecked !== true ||
        alert.review.areaChecked !== true ||
        alert.review.messageChecked !== true ||
        alert.basinId !== basin.id ||
        typeof alert.id !== "string" ||
        !LEVELS.includes(alert.level)
      )
        return error(
          "Peringatan harus diverifikasi BPBD terlebih dahulu.",
          400,
        );
      const retry = body.retry === true;
      return json({
        alert: {
          ...alert,
          status: "sent",
          channels: CHANNELS.map((name, i) => ({
            id: `ch-${i}`,
            name,
            status: i === 4 && !retry ? "retry" : "sent",
            detail:
              i === 4 && !retry
                ? "Simulasi: sambungan radio terputus; kanal lain berhasil"
                : "Terkirim dalam simulator; tidak ada pesan aktual",
          })),
        },
        simulated: true,
        persisted: false,
        externalMessagesSent: 0,
      });
    }
    return error("Endpoint tidak ditemukan.", 404);
  } catch {
    return error(
      "Permintaan tidak dapat diproses; gunakan seed simulasi.",
      500,
    );
  }
}
