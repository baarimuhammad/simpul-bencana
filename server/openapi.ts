/** Public contract for the demonstrator. No endpoint connects to a government system. */
const inputSchema = {
  type: "object",
  required: ["rain", "forestLoss", "slope", "water"],
  properties: {
    rain: {
      type: "number",
      minimum: 0,
      maximum: 500,
      description: "mm/24 jam · simulasi",
    },
    forestLoss: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description: "% degradasi hulu · simulasi",
    },
    slope: { type: "number", minimum: 0, maximum: 90, description: "derajat" },
    water: { type: "number", minimum: 0, maximum: 1000, description: "cm" },
  },
};
const reportSchema = {
  type: "object",
  required: [
    "id",
    "basinId",
    "district",
    "kind",
    "severity",
    "note",
    "status",
    "created",
  ],
  properties: {
    id: { type: "string" },
    basinId: { type: "string" },
    district: { type: "string" },
    kind: { enum: ["Hujan lebat", "Muka air naik", "Tanah bergerak"] },
    severity: { type: "integer", minimum: 1, maximum: 3 },
    note: { type: "string", minLength: 5, maxLength: 300 },
    status: { enum: ["pending", "validated", "rejected"] },
    created: { type: "string" },
  },
};
const alertSchema = {
  type: "object",
  required: [
    "id",
    "basinId",
    "level",
    "probability",
    "status",
    "created",
    "message",
    "channels",
  ],
  properties: {
    id: { type: "string" },
    basinId: { type: "string" },
    level: { enum: ["Normal", "Waspada", "Siaga", "Awas"] },
    probability: { type: "number", minimum: 0, maximum: 1 },
    status: { enum: ["draft", "verified", "sent"] },
    verifiedBy: { enum: ["admin", "bpbd"] },
    created: { type: "string" },
    message: { type: "string" },
    channels: { type: "array", items: { type: "object" } },
  },
};
const response = {
  description: "Data simulasi; bentuk respons dijelaskan di docs/API.md",
  content: { "application/json": { schema: { type: "object" } } },
};
const get = (summary: string, parameters: unknown[] = []) => ({
  get: {
    summary,
    parameters,
    responses: {
      "200": response,
      "400": { description: "Parameter tidak valid" },
      "404": { description: "DAS / endpoint tidak ditemukan" },
    },
  },
});
const post = (
  summary: string,
  properties: Record<string, unknown>,
  required: string[],
  roles: string[],
) => ({
  post: {
    summary,
    description:
      "Transformasi stateless. Tidak menyimpan perubahan atau mengirim pesan aktual.",
    parameters: [
      {
        name: "X-Demo-Role",
        in: "header",
        required: true,
        schema: { type: "string", enum: roles },
        description: "Peran simulasi; header ini bukan autentikasi aman.",
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required,
            properties: {
              basinId: { type: "string", example: "tamiang" },
              ...properties,
            },
          },
        },
      },
    },
    responses: {
      "200": response,
      ...(summary.includes("Kirim laporan") ? { "201": response } : {}),
      "400": { description: "Input atau status tidak valid" },
      "403": { description: "Peran demo tidak diizinkan / mode bayangan" },
      "404": { description: "DAS tidak ditemukan" },
      "413": { description: "Payload melebihi 32 KiB" },
    },
  },
});
const basinParam = {
  name: "basin",
  in: "query",
  schema: { type: "string", default: "tamiang" },
};
const allRoles = ["admin", "bmkg", "forest", "geo", "bpbd", "public"];
export const openapi = {
  openapi: "3.1.0",
  info: {
    title: "SIMPUL BENCANA · API Simulasi",
    version: "1.0.0",
    description:
      "Semua data dummy. Koneksi pemerintah dan pengiriman aktual tidak diaktifkan. Mutasi stateless; browser menyimpan sesi. X-Demo-Role dapat dipalsukan dan bukan autentikasi aman.",
  },
  servers: [{ url: "/api" }],
  paths: {
    "/health": get("Status handler dan seed simulasi"),
    "/seed": get("Seed otomatis 2026"),
    "/basins": get("Daftar DAS dan hasil fusi snapshot"),
    "/catalog": get("Katalog kontrak data simulasi"),
    "/exchanges": get("Fixture query federasi sintetis"),
    "/evaluation": get("Metrik dari 33 observasi sintetis", [basinParam]),
    "/openapi.json": get("Spesifikasi kontrak ini"),
    "/risk": get("Risiko DAS dan kontribusi faktor", [
      basinParam,
      {
        name: "scenario",
        in: "query",
        schema: { type: "string", enum: ["normal", "extreme", "false-alarm"] },
      },
      {
        name: "step",
        in: "query",
        schema: { type: "integer", minimum: 0, maximum: 10, default: 10 },
      },
    ]),
    "/cap": get("CAP 1.2 Test sebagai JSON atau XML", [
      basinParam,
      {
        name: "format",
        in: "query",
        schema: { enum: ["json", "xml"], default: "json" },
      },
    ]),
    "/fuse": post(
      "Hitung skor fusi deterministik",
      { inputs: { $ref: "#/components/schemas/Inputs" } },
      ["basinId", "inputs"],
      allRoles,
    ),
    "/reports": post(
      "Kirim laporan dummy (belum tervalidasi)",
      {
        district: { type: "string", example: "Karang Baru" },
        kind: { enum: ["Hujan lebat", "Muka air naik", "Tanah bergerak"] },
        severity: { type: "integer", minimum: 1, maximum: 3 },
        note: { type: "string", minLength: 5, maxLength: 300 },
        sequence: { type: "integer", minimum: 1 },
      },
      ["basinId", "district", "kind", "severity", "note"],
      allRoles,
    ),
    "/reports/validate": post(
      "Validasi / tolak laporan oleh BPBD",
      {
        report: { $ref: "#/components/schemas/CitizenReport" },
        accept: { type: "boolean", default: true },
      },
      ["basinId", "report"],
      ["admin", "bpbd"],
    ),
    "/alerts/verify": post(
      "Verifikasi draf peringatan oleh manusia",
      { alert: { $ref: "#/components/schemas/Alert" } },
      ["basinId", "alert"],
      ["admin", "bpbd"],
    ),
    "/disseminate": post(
      "Simulasikan tujuh kanal; mode bayangan ditolak",
      {
        alert: { $ref: "#/components/schemas/Alert" },
        mode: { enum: ["shadow", "limited"] },
        retry: { type: "boolean", default: false },
      },
      ["basinId", "alert", "mode"],
      ["admin", "bpbd"],
    ),
    "/report.pdf": {
      get: {
        summary: "Unduh ringkasan seed sebagai PDF simulasi",
        responses: {
          "200": {
            description: "PDF attachment, tidak dipersistensikan",
            content: {
              "application/pdf": {
                schema: { type: "string", format: "binary" },
              },
            },
          },
        },
      },
      post: {
        summary: "Ekspor snapshot sesi dummy sebagai PDF",
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["payload"],
                properties: {
                  payload: {
                    type: "string",
                    description:
                      "JSON {title:string, lines:string[]}; maksimal 128 KiB, 400 baris",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "PDF attachment, tidak dipersistensikan",
            content: {
              "application/pdf": {
                schema: { type: "string", format: "binary" },
              },
            },
          },
          "400": { description: "Dokumen tidak valid" },
          "413": { description: "Payload terlalu besar" },
        },
      },
    },
  },
  components: {
    schemas: {
      Inputs: inputSchema,
      CitizenReport: reportSchema,
      Alert: alertSchema,
    },
  },
};
