import { describe, expect, it } from "vitest";
import { handleApi } from "../server/api";
import { BASINS } from "../src/shared/seed";
import { makeAlert } from "../src/shared/alerts";
const req = (path: string, body?: unknown, role = "admin") =>
  new Request("https://demo.invalid/api" + path, {
    method: body ? "POST" : "GET",
    headers: { "content-type": "application/json", "x-demo-role": role },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const completeReview = {
  dataChecked: true,
  areaChecked: true,
  messageChecked: true,
};
describe("API stateless Netlify", () => {
  for (const path of [
    "/health",
    "/seed",
    "/basins",
    "/catalog",
    "/exchanges",
    "/risk",
    "/evaluation",
    "/cap",
    "/openapi.json",
  ])
    it(`GET ${path}`, async () => {
      const r = await handleApi(req(path));
      expect(r.status).toBe(200);
      expect(r.headers.get("content-type")).toContain("json");
    });
  it("parameter dan DAS yang tidak valid ditolak", async () => {
    expect((await handleApi(req("/risk?basin=unknown"))).status).toBe(404);
    expect((await handleApi(req("/risk?step=-1"))).status).toBe(400);
    expect((await handleApi(req("/risk?scenario=no"))).status).toBe(400);
  });
  it("CAP XML berstatus Test dan memiliki namespace", async () => {
    const r = await handleApi(req("/cap?format=xml"));
    const text = await r.text();
    expect(text).toContain("<status>Test</status>");
    expect(text).toContain("urn:oasis:names:tc:emergency:cap:1.2");
  });
  it("fusi menolak nilai di luar batas", async () =>
    expect(
      (
        await handleApi(
          req("/fuse", {
            basinId: "tamiang",
            inputs: { rain: -2, forestLoss: 30, slope: 20, water: 200 },
          }),
        )
      ).status,
    ).toBe(400));
  for (const role of ["bmkg", "forest", "geo", "public"])
    it(`${role} tidak boleh memverifikasi`, async () =>
      expect(
        (
          await handleApi(
            req(
              "/alerts/verify",
              {
                basinId: "tamiang",
                alert: makeAlert(BASINS[0], "Awas", 0.9),
                review: completeReview,
              },
              role,
            ),
          )
        ).status,
      ).toBe(403));
  it("verifikasi membutuhkan tiga pemeriksaan dan membawa snapshot bukti", async () => {
    const alert = makeAlert(BASINS[0], "Awas", 0.9, 2, {
      rain: 220,
      forestLoss: 61,
      slope: 36,
      water: 500,
    });
    const base = { basinId: "tamiang", alert };
    const incomplete = await handleApi(
      req(
        "/alerts/verify",
        { ...base, review: { ...completeReview, areaChecked: false } },
        "bpbd",
      ),
    );
    expect(incomplete.status).toBe(400);
    const nonBoolean = await handleApi(
      req(
        "/alerts/verify",
        { ...base, review: { ...completeReview, dataChecked: "true" } },
        "bpbd",
      ),
    );
    expect(nonBoolean.status).toBe(400);
    const verified = await handleApi(
      req("/alerts/verify", { ...base, review: completeReview }, "bpbd"),
    );
    expect(verified.status).toBe(200);
    const result = await verified.json();
    expect(result.alert.review).toEqual(completeReview);
    expect(result.alert.evidence.inputs.rain).toBe(220);
    expect(result.alert.evidence.factors).toHaveLength(4);
    expect(result.persisted).toBe(false);
  });
  it("status verified yang dipalsukan tanpa checklist tidak dapat diseminasi", async () => {
    const alert = {
      ...makeAlert(BASINS[0], "Awas", 0.9),
      status: "verified",
      verifiedBy: "bpbd",
    };
    expect(
      (
        await handleApi(
          req(
            "/disseminate",
            { basinId: "tamiang", alert, mode: "limited" },
            "bpbd",
          ),
        )
      ).status,
    ).toBe(400);
  });
  it("mode bayangan memblokir diseminasi meskipun sudah diverifikasi", async () => {
    const alert = {
      ...makeAlert(BASINS[0], "Awas", 0.9),
      status: "verified",
      verifiedBy: "bpbd",
      review: completeReview,
    };
    expect(
      (
        await handleApi(
          req(
            "/disseminate",
            { basinId: "tamiang", alert, mode: "shadow" },
            "bpbd",
          ),
        )
      ).status,
    ).toBe(403);
  });
  it("peringatan tanpa verifikasi ditolak", async () =>
    expect(
      (
        await handleApi(
          req("/disseminate", {
            basinId: "tamiang",
            alert: makeAlert(BASINS[0], "Awas", 0.9),
            mode: "limited",
          }),
        )
      ).status,
    ).toBe(400));
  it("pengiriman 7 kanal dapat dicoba ulang; pesan aktual selalu nol", async () => {
    const alert = {
      ...makeAlert(BASINS[0], "Awas", 0.9),
      status: "verified",
      verifiedBy: "bpbd",
      review: completeReview,
    };
    const r = await handleApi(
      req(
        "/disseminate",
        { basinId: "tamiang", alert, mode: "limited" },
        "bpbd",
      ),
    );
    const d = await r.json();
    expect(d.externalMessagesSent).toBe(0);
    expect(d.alert.channels).toHaveLength(7);
    expect(
      d.alert.channels.filter((c: { status: string }) => c.status === "retry"),
    ).toHaveLength(1);
    const retry = await (
      await handleApi(
        req(
          "/disseminate",
          { basinId: "tamiang", alert, mode: "limited", retry: true },
          "bpbd",
        ),
      )
    ).json();
    expect(
      retry.alert.channels.every(
        (c: { status: string }) => c.status === "sent",
      ),
    ).toBe(true);
  });
  it("public dapat mengirim laporan dan BPBD memvalidasi", async () => {
    const response = await handleApi(
      req(
        "/reports",
        {
          basinId: "tamiang",
          district: "Karang Baru",
          kind: "Muka air naik",
          severity: 2,
          note: "SIMULASI: air naik.",
          sequence: 2,
        },
        "public",
      ),
    );
    expect(response.status).toBe(201);
    const d = await response.json();
    expect(d.report.status).toBe("pending");
    expect(d.persisted).toBe(false);
    const validation = await handleApi(
      req(
        "/reports/validate",
        { basinId: "tamiang", report: d.report },
        "bpbd",
      ),
    );
    expect((await validation.json()).report.status).toBe("validated");
  });
  it("permintaan JSON rusak tidak menyebabkan crash", async () => {
    const request = new Request("https://demo.invalid/api/fuse", {
      method: "POST",
      body: "not-json",
    });
    expect((await handleApi(request)).status).toBe(400);
  });
});

it("PDF dapat diunduh langsung sebagai HTTP attachment tanpa menyimpan dokumen", async () => {
  const response = await handleApi(
    new Request("https://demo.invalid/api/report.pdf", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        payload: JSON.stringify({
          title: "Laporan simulasi",
          lines: ["PROTOTIPE - DATA SIMULASI", "DAS Tamiang: Awas (simulasi)."],
        }),
      }),
    }),
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("application/pdf");
  expect(response.headers.get("content-disposition")).toContain("attachment");
  expect(
    Buffer.from(await response.arrayBuffer()).toString("latin1"),
  ).toContain("%PDF-");
});
