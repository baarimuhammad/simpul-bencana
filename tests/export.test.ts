import { expect, it } from "vitest";
import { createReportPdf } from "../src/lib/export";
it("ekspor PDF menghasilkan dokumen lengkap dengan label simulasi pada banyak halaman", async () => {
  const bytes = await createReportPdf(
    "Laporan peringatan simulasi",
    Array.from(
      { length: 110 },
      (_, i) =>
        `Baris ${i + 1}: LATIHAN DAS Tamiang. Data simulasi, bukan peringatan resmi.`,
    ),
  );
  const text = Buffer.from(bytes).toString("latin1");
  expect(text.startsWith("%PDF-")).toBe(true);
  expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
  expect(
    (text.match(/PROTOTIPE - DATA SIMULASI/g) ?? []).length,
  ).toBeGreaterThan(1);
  expect(text).toContain("Baris 110");
});
