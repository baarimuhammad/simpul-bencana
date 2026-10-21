export function download(
  name: string,
  body: string | ArrayBuffer,
  type = "text/plain;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
export function csvExport(name: string, rows: (string | number)[][]) {
  const escape = (x: string | number) => {
    let s = String(x);
    if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  };
  download(
    name,
    "\uFEFF" + rows.map((r) => r.map(escape).join(",")).join("\r\n"),
    "text/csv;charset=utf-8",
  );
}
/** Generate bytes separately so PDF validity can be checked without a browser. */
export async function createReportPdf(
  title: string,
  lines: string[],
): Promise<ArrayBuffer> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  let y = 22;
  doc.setFontSize(17);
  doc.text(title, 16, y);
  y += 12;
  doc.setFontSize(10);
  doc.setTextColor(150, 80, 0);
  doc.text("PROTOTIPE - DATA SIMULASI | Bukan peringatan resmi", 16, y);
  y += 12;
  doc.setTextColor(30, 45, 60);
  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line, 176) as string[];
    for (const text of wrapped) {
      if (y > 280) {
        doc.addPage();
        y = 20;
        doc.setTextColor(150, 80, 0);
        doc.text("PROTOTIPE - DATA SIMULASI", 16, y);
        doc.setTextColor(30, 45, 60);
        y += 12;
      }
      doc.text(text, 16, y);
      y += 6;
    }
    y += 3;
  }
  return doc.output("arraybuffer");
}
export async function pdfExport(title: string, lines: string[]) {
  const bytes = await createReportPdf(title, lines);
  // The UI exposes a direct download link after async generation. This also works
  // when a browser blocks automatic downloads outside the initial user gesture.
  return URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
}
