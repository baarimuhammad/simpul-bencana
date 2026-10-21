import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileCode2,
  MapPinned,
  MessageSquare,
  Plus,
  Radio,
  Send,
  ShieldCheck,
  Siren,
  Users,
  XCircle,
} from "lucide-react";
import { BASINS } from "../shared/seed";
import { fuse } from "../shared/fusion";
import { capXml, makeCap } from "../shared/alerts";
import { useDemo } from "../lib/store";
import { canVerify } from "../lib/permissions";
import { csvExport, download, pdfExport } from "../lib/export";
import {
  Badge,
  Empty,
  fmt,
  Note,
  PageHead,
  Panel,
  pct,
  Stat,
  Step,
} from "../components/UI";
import {
  ROLE_NAMES,
  type Alert,
  type CitizenReport,
  type Page,
  type ReportKind,
} from "../shared/types";
export default function Operations({
  page,
  go,
}: {
  page: Page;
  go: (page: Page) => void;
}) {
  return page === "bpbd" ? (
    <Regional go={go} />
  ) : page === "alerts" ? (
    <Warnings />
  ) : (
    <Reports />
  );
}
function ModeSwitch() {
  const { state, setMode } = useDemo();
  return (
    <div className="mode-switch" aria-label="Mode uji coba">
      <button
        className={state.mode === "shadow" ? "active" : ""}
        disabled={!canVerify(state.role)}
        onClick={() => setMode("shadow")}
      >
        <ShieldCheck size={14} /> Mode bayangan
      </button>
      <button
        className={state.mode === "limited" ? "active" : ""}
        disabled={!canVerify(state.role)}
        onClick={() => setMode("limited")}
      >
        <Radio size={14} /> Operasional terbatas
      </button>
    </div>
  );
}
function Regional({ go }: { go: (p: Page) => void }) {
  const { state, selectBasin } = useDemo();
  const basin = BASINS.find((b) => b.id === state.selectedBasin)!;
  const risk = fuse(basin, basin.inputs, state.reports);
  return (
    <>
      <PageHead
        eyebrow="PUSAT KENDALI DAERAH"
        title={`Posko BPBD · ${basin.province}`}
        description="Hubungkan analisis risiko dengan kesiapan lapangan dan keputusan manusia."
      >
        <select
          className="select-control"
          aria-label="Wilayah BPBD"
          value={basin.id}
          onChange={(e) => selectBasin(e.target.value)}
        >
          {BASINS.map((b) => (
            <option key={b.id} value={b.id}>
              DAS {b.name}
            </option>
          ))}
        </select>
      </PageHead>
      <div className="mode-bar">
        <ModeSwitch />
        <span>
          {state.mode === "shadow"
            ? "Prediksi diamati; tidak ada diseminasi."
            : "Latihan pengiriman diizinkan setelah verifikasi."}
        </span>
      </div>
      <div className="stats-grid">
        <Stat
          label="Status DAS"
          value={risk.level}
          detail={`Probabilitas simulasi ${pct(risk.probability)}`}
          icon={<Bell size={20} />}
          color="orange"
        />
        <Stat
          label="Paparan penduduk"
          value={fmt(basin.population)}
          unit="jiwa"
          detail="Jumlah sintetis untuk demonstrasi"
          icon={<Users size={20} />}
        />
        <Stat
          label="Kesiapan wilayah"
          value={`${basin.readiness}%`}
          detail="Indeks checklist fiktif, bukan hasil audit"
          icon={<ClipboardCheck size={20} />}
          color="blue"
        />
        <Stat
          label="Ruang evakuasi tersedia"
          value={fmt(
            basin.shelters.reduce((n, s) => n + s.capacity - s.occupied, 0),
          )}
          unit="tempat"
          detail="3 titik kumpul ilustratif"
          icon={<MapPinned size={20} />}
          color="purple"
        />
      </div>
      <div className="two-col">
        <Panel title="Alur keputusan BPBD" eyebrow="HUMAN-IN-THE-LOOP">
          <Step n="01" title="Baca rekomendasi fusi" active>
            Periksa hujan, kondisi hulu, topografi, dan respons muka air.
          </Step>
          <Step n="02" title="Konfirmasi keadaan lapangan" active>
            Validasi laporan relawan dan hubungi petugas kecamatan.
          </Step>
          <Step n="03" title="Verifikasi peringatan">
            Operator BPBD meninjau cakupan dan instruksi; keputusan tidak
            otomatis.
          </Step>
          <Step n="04" title="Aktifkan diseminasi multikanal">
            Hanya latihan pada operasional terbatas. Mode bayangan diblokir.
          </Step>
          <button className="btn primary full" onClick={() => go("alerts")}>
            Tinjau peringatan & verifikasi <ArrowRight size={16} />
          </button>
        </Panel>
        <Panel
          title="Kesiapan kecamatan"
          eyebrow={`DAS ${basin.name.toUpperCase()}`}
        >
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Kecamatan</th>
                  <th>Kesiapan dummy</th>
                  <th>Tindakan yang disarankan</th>
                </tr>
              </thead>
              <tbody>
                {basin.districts.map((d) => (
                  <tr key={d.name}>
                    <td>
                      <strong>{d.name}</strong>
                      <small className="table-sub">
                        {fmt(d.population)} jiwa terpapar · dummy
                      </small>
                    </td>
                    <td>
                      <div className="readiness">
                        <div className="track">
                          <span style={{ width: d.readiness + "%" }} />
                        </div>
                        {d.readiness}%
                      </div>
                    </td>
                    <td>
                      {risk.probability >= 0.5
                        ? "Siapkan rute & bantu kelompok rentan"
                        : "Periksa kontak relawan dan titik kumpul"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="checklist">
            <span>
              <CheckCircle2 size={15} /> Kontak petugas disiapkan
            </span>
            <span>
              <CheckCircle2 size={15} /> Jalur alternatif diilustrasikan
            </span>
            <span>
              <CheckCircle2 size={15} /> Instruksi Bahasa Indonesia
            </span>
          </div>
          <button className="text-btn" onClick={() => go("reports")}>
            Tinjau laporan kondisi lapangan <ArrowRight size={15} />
          </button>
        </Panel>
      </div>
      <Panel
        title="Paparan & rencana evakuasi"
        eyebrow="BUKAN PETUNJUK NAVIGASI AKTUAL"
      >
        <div className="shelters-grid">
          {basin.shelters.map((s, i) => (
            <div className="evac-card" key={s.name}>
              <span className="evac-icon">
                <MapPinned size={21} />
              </span>
              <h3>{s.name}</h3>
              <p>
                Rute E-{i + 1} · {s.distance} dari titik pantau ilustratif
              </p>
              <div className="evac-route">
                <span>Bantaran</span>
                <ArrowRight size={13} />
                <span>Jalan aman</span>
                <ArrowRight size={13} />
                <strong>Titik kumpul</strong>
              </div>
              <small>
                {fmt(s.capacity - s.occupied)} dari {fmt(s.capacity)} tempat
                tersedia · dummy
              </small>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
function Warnings() {
  const { state, api, updateAlert, addAlert, notify, log, connection } =
    useDemo();
  const [chosen, setChosen] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("Pesan");
  const [review, setReview] = useState({
    dataChecked: false,
    areaChecked: false,
    messageChecked: false,
  });
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const pdfLines = state.alerts.flatMap((a) => [
    `${a.id} | DAS ${BASINS.find((b) => b.id === a.basinId)?.name} | ${a.level} | ${a.status}`,
    a.message,
    ...a.channels.map((c) => `${c.name}: ${c.status}`),
  ]);
  useEffect(
    () => () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    },
    [pdfUrl],
  );
  const alert = state.alerts.find((a) => a.id === chosen) ?? state.alerts[0];
  const basin = BASINS.find((b) => b.id === alert?.basinId) ?? BASINS[0];
  const permission = canVerify(state.role);
  const cap = alert
    ? makeCap(basin, alert.level, alert.id, alert.message)
    : null;
  async function act(action: "verify" | "send" | "retry") {
    if (!alert) return;
    setBusy(true);
    try {
      const r = await api<{ alert: Alert }>(
        action === "verify" ? "/alerts/verify" : "/disseminate",
        {
          basinId: basin.id,
          alert: action === "retry" ? { ...alert, status: "verified" } : alert,
          mode: state.mode,
          retry: action === "retry",
          ...(action === "verify" ? { review } : {}),
        },
      );
      updateAlert(r.alert);
      if (action === "verify")
        setReview({
          dataChecked: false,
          areaChecked: false,
          messageChecked: false,
        });
      notify(
        action === "verify"
          ? "Tiga pemeriksaan dicatat; peringatan diverifikasi oleh peran demo."
          : action === "retry"
            ? "Kanal radio berhasil disimulasikan ulang."
            : "Simulasi multikanal selesai. Radio perlu dicoba ulang; kanal lain berhasil.",
      );
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHead
        eyebrow="DARI ANALISIS KE TINDAKAN"
        title="Peringatan & diseminasi"
        description="Setiap peringatan melewati tinjauan BPBD. Tidak ada SMS, sirene, atau pesan aktual yang dikirim."
      >
        <button
          className="btn"
          onClick={async () => {
            try {
              const url = await pdfExport(
                "Laporan peringatan simulasi",
                pdfLines,
              );
              setPdfUrl(url);
              log("Ekspor PDF", "Laporan peringatan simulasi disiapkan");
              notify("PDF simulasi siap. Pilih Unduh PDF untuk menyimpannya.");
            } catch {
              notify(
                "Ekspor PDF belum berhasil. Muat ulang halaman dan coba lagi.",
              );
            }
          }}
        >
          <ArrowDownToLine size={16} /> Ekspor PDF
        </button>
        {pdfUrl && connection !== "offline" ? (
          <form action="/api/report.pdf" method="post">
            <input
              type="hidden"
              name="payload"
              value={JSON.stringify({
                title: "Laporan peringatan simulasi",
                lines: pdfLines,
              })}
            />
            <button className="btn primary" type="submit">
              <ArrowDownToLine size={16} /> Unduh PDF
            </button>
          </form>
        ) : (
          pdfUrl && (
            <a
              className="btn primary"
              href={pdfUrl}
              download="simpul-bencana-laporan-simulasi.pdf"
            >
              <ArrowDownToLine size={16} /> Unduh PDF
            </a>
          )
        )}
        <button
          className="btn primary"
          disabled={!permission}
          onClick={() => addAlert()}
        >
          <Plus size={16} /> Buat draf
        </button>
      </PageHead>
      <div className="mode-bar">
        <ModeSwitch />
        <span>
          {state.mode === "shadow"
            ? "Mode bayangan aktif: tombol diseminasi diblokir."
            : "Operasional terbatas: seluruh pengiriman tetap simulasi."}
        </span>
      </div>
      <div className="alerts-layout">
        <Panel
          title="Antrean peringatan"
          eyebrow="DATA SIMULASI"
          action={<span className="count-pill">{state.alerts.length}</span>}
        >
          {state.alerts.map((a) => (
            <button
              className={`alert-list-item ${a.id === alert?.id ? "selected" : ""}`}
              key={a.id}
              onClick={() => {
                setChosen(a.id);
                setReview({
                  dataChecked: false,
                  areaChecked: false,
                  messageChecked: false,
                });
              }}
            >
              <div>
                <strong>
                  DAS {BASINS.find((b) => b.id === a.basinId)?.name}
                </strong>
                <Badge level={a.level} />
              </div>
              <p>{a.id}</p>
              <small>
                {a.status === "draft"
                  ? "Menunggu verifikasi"
                  : a.status === "verified"
                    ? "Diverifikasi BPBD"
                    : "Diseminasi disimulasikan"}
              </small>
            </button>
          ))}
        </Panel>
        {alert ? (
          <Panel
            title={`Peringatan ${alert.id}`}
            eyebrow={`DAS ${basin.name.toUpperCase()} · ${basin.province}`}
            action={<Badge level={alert.level} />}
          >
            <div className="alert-workflow">
              <span className="done">
                <Check size={13} /> Rekomendasi model
              </span>
              <ChevronArrow />
              <span className={alert.status !== "draft" ? "done" : ""}>
                <ShieldCheck size={13} /> Verifikasi BPBD
              </span>
              <ChevronArrow />
              <span className={alert.status === "sent" ? "done" : ""}>
                <Radio size={13} /> Kanal simulasi → warga
              </span>
            </div>
            <div className="ews-evidence">
              <div>
                <strong>Dasar rekomendasi · snapshot draf</strong>
                <p>
                  {alert.level} ({pct(alert.probability)} simulasi). Input:
                  hujan {alert.evidence.inputs.rain} mm, degradasi hulu{" "}
                  {alert.evidence.inputs.forestLoss}%, lereng{" "}
                  {alert.evidence.inputs.slope}°, muka air{" "}
                  {alert.evidence.inputs.water} cm.
                </p>
                <small>
                  Kontributor skor:{" "}
                  {alert.evidence.factors
                    .slice()
                    .sort((a, b) => b.contribution - a.contribution)
                    .slice(0, 2)
                    .map((f) => f.label)
                    .join(" dan ")}
                  . Seluruhnya fixture; tidak ada telemetri instansi.
                </small>
              </div>
              <span className="count-pill">REKOMENDASI · BELUM KEPUTUSAN</span>
            </div>
            <div className="tab-row">
              {["Pesan", "CAP JSON", "Kanal pengiriman"].map((p) => (
                <button
                  key={p}
                  className={preview === p ? "active" : ""}
                  onClick={() => setPreview(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            {preview === "CAP JSON" ? (
              <div>
                <pre className="code-block">{JSON.stringify(cap, null, 2)}</pre>
                <button
                  className="btn"
                  onClick={() => {
                    download(
                      "simpul-peringatan-test.xml",
                      capXml(cap!),
                      "application/xml",
                    );
                    log(
                      "Ekspor CAP",
                      "Status Test; tidak boleh diperlakukan sebagai peringatan nyata",
                    );
                  }}
                >
                  <FileCode2 size={15} /> Unduh CAP XML
                </button>
              </div>
            ) : preview === "Kanal pengiriman" ? (
              <ChannelList alert={alert} />
            ) : (
              <>
                <div className="message-preview">
                  <div>
                    <MessageSquare size={16} />
                    <strong>PRATINJAU PESAN · BAHASA INDONESIA</strong>
                  </div>
                  <p>{alert.message}</p>
                  <small>
                    CAP status: Test · certainty: Possible · scope: Public
                  </small>
                </div>
                <div className="alert-context">
                  <span>
                    Probabilitas simulasi{" "}
                    <strong>{pct(alert.probability)}</strong>
                  </span>
                  <span>
                    Cakupan{" "}
                    <strong>{basin.districts.length} kecamatan dummy</strong>
                  </span>
                  <span>
                    Keputusan{" "}
                    <strong>
                      {alert.verifiedBy
                        ? `${ROLE_NAMES[alert.verifiedBy]} (demo)`
                        : "Menunggu manusia"}
                    </strong>
                  </span>
                </div>
                <ChannelList alert={alert} />
              </>
            )}
            {!permission && (
              <Note>
                Peran Anda dapat membaca peringatan. Verifikasi dan latihan
                pengiriman memerlukan BPBD atau Admin Nasional.
              </Note>
            )}
            {state.mode === "shadow" && (
              <Note tone="warning">
                <strong>Mode bayangan:</strong> rekomendasi hanya diamati.
                Diseminasi diblokir oleh UI dan API.
              </Note>
            )}
            {alert.status === "draft" && permission && (
              <fieldset className="review-checklist">
                <legend>Catatan verifikasi BPBD · latihan</legend>
                {(
                  [
                    [
                      "dataChecked",
                      "Sumber, satuan, waktu observasi dan kualitas input telah ditinjau (semua fixture simulasi).",
                    ],
                    [
                      "areaChecked",
                      "Cakupan DAS, kecamatan serta kesiapan evakuasi telah ditinjau.",
                    ],
                    [
                      "messageChecked",
                      "Tingkat rekomendasi dan instruksi pesan dipahami; keputusan latihan disetujui manusia.",
                    ],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={review[key]}
                      onChange={(e) =>
                        setReview((r) => ({ ...r, [key]: e.target.checked }))
                      }
                    />
                    <span>{label}</span>
                  </label>
                ))}
                <small>
                  Centang berarti meninjau fixture untuk demo, bukan menyatakan
                  verifikasi data lapangan.
                </small>
              </fieldset>
            )}
            <div className="alert-actions">
              {alert.status === "draft" ? (
                <button
                  className="btn primary"
                  disabled={
                    !permission || busy || !Object.values(review).every(Boolean)
                  }
                  onClick={() => act("verify")}
                >
                  <ShieldCheck size={16} />
                  {busy ? "Memproses…" : "Verifikasi BPBD"}
                </button>
              ) : alert.status === "verified" ? (
                <button
                  className="btn primary"
                  disabled={!permission || busy || state.mode === "shadow"}
                  onClick={() => act("send")}
                >
                  <Send size={16} />
                  {busy ? "Memproses…" : "Simulasikan diseminasi"}
                </button>
              ) : (
                <span className="success-text">
                  <CheckCircle2 size={16} /> Pengiriman disimulasikan; 0 pesan
                  aktual.
                </span>
              )}
              {alert.channels.some((c) => c.status === "retry") && (
                <button
                  className="btn"
                  disabled={!permission || busy || state.mode === "shadow"}
                  onClick={() => act("retry")}
                >
                  <Radio size={15} /> Coba ulang kanal radio
                </button>
              )}
            </div>
          </Panel>
        ) : (
          <Empty>Belum ada draf peringatan.</Empty>
        )}
      </div>
    </>
  );
}
function ChevronArrow() {
  return <ArrowRight size={15} className="workflow-arrow" />;
}
function ChannelList({ alert }: { alert: Alert }) {
  return (
    <div className="channels-grid">
      {alert.channels.map((c, i) => (
        <div className={`channel channel-${c.status}`} key={c.id}>
          <span>
            {i === 3 ? (
              <Siren size={17} />
            ) : i === 4 ? (
              <Radio size={17} />
            ) : (
              <MessageSquare size={17} />
            )}
          </span>
          <div>
            <strong>{c.name}</strong>
            <small>
              {c.status === "pending"
                ? "Menunggu"
                : c.status === "retry"
                  ? "Perlu dicoba ulang"
                  : "Terkirim · simulasi"}
            </small>
          </div>
          {c.status === "sent" ? (
            <CheckCircle2 size={15} />
          ) : c.status === "retry" ? (
            <XCircle size={15} />
          ) : (
            <span className="pending-dot" />
          )}
          <p>{c.detail}</p>
        </div>
      ))}
    </div>
  );
}
function Reports() {
  const { state, api, addReport, updateReport, notify, selectBasin, log } =
    useDemo();
  const basin = BASINS.find((b) => b.id === state.selectedBasin)!;
  const [kind, setKind] = useState<ReportKind>("Muka air naik");
  const [severity, setSeverity] = useState(2);
  const [note, setNote] = useState("");
  const [district, setDistrict] = useState("");
  const [busy, setBusy] = useState(false);
  const permission = canVerify(state.role);
  const before = fuse(basin);
  const after = fuse(basin, basin.inputs, state.reports);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<{ report: CitizenReport }>("/reports", {
        basinId: basin.id,
        district: district || basin.districts[0].name,
        kind,
        severity,
        note,
        sequence: state.reports.length + 1,
      });
      addReport(r.report);
      setNote("");
      notify(
        "Laporan dummy diterima. Estimasi risiko baru diperbarui setelah validasi BPBD.",
      );
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function validate(report: CitizenReport, accept: boolean) {
    try {
      const r = await api<{ report: CitizenReport }>("/reports/validate", {
        basinId: report.basinId,
        report,
        accept,
      });
      updateReport(r.report);
      notify(
        accept
          ? "Laporan tervalidasi. Bukti terbatas ditambahkan pada estimasi risiko."
          : "Laporan ditolak; tidak memengaruhi risiko.",
      );
    } catch (e) {
      notify((e as Error).message);
    }
  }
  return (
    <>
      <PageHead
        eyebrow="BUKTI DARI LAPANGAN"
        title="Laporan warga & relawan"
        description="Hujan, kenaikan muka air, dan tanda gerakan tanah memberi konteks tambahan setelah validasi."
      >
        <button
          className="btn"
          onClick={() => {
            csvExport("laporan-warga-simulasi.csv", [
              ["PROTOTIPE - DATA SIMULASI"],
              ["ID", "DAS", "Kecamatan", "Jenis", "Status"],
              ...state.reports.map((r) => [
                r.id,
                r.basinId,
                r.district,
                r.kind,
                r.status,
              ]),
            ]);
            log("Ekspor CSV", "Laporan warga dummy");
          }}
        >
          <ArrowDownToLine size={16} /> Ekspor CSV
        </button>
      </PageHead>
      <Note tone="warning">
        Form untuk data latihan. Jangan masukkan nama, nomor telepon, alamat
        rumah, atau informasi pribadi. Belum terhubung ke petugas atau layanan
        darurat.
      </Note>
      <div className="two-col">
        <Panel title="Kirim kondisi simulasi" eyebrow="TANPA IDENTITAS PRIBADI">
          <form className="form-stack" onSubmit={submit}>
            <label>
              DAS
              <select
                value={basin.id}
                onChange={(e) => {
                  selectBasin(e.target.value);
                  setDistrict("");
                }}
              >
                {BASINS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Kecamatan
              <select
                value={district || basin.districts[0].name}
                onChange={(e) => setDistrict(e.target.value)}
              >
                {basin.districts.map((d) => (
                  <option key={d.name}>{d.name}</option>
                ))}
              </select>
            </label>
            <div className="form-two">
              <label>
                Jenis pengamatan
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as ReportKind)}
                >
                  {["Hujan lebat", "Muka air naik", "Tanah bergerak"].map(
                    (k) => (
                      <option key={k}>{k}</option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Intensitas
                <select
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                >
                  <option value="1">1 · Ringan</option>
                  <option value="2">2 · Sedang</option>
                  <option value="3">3 · Tinggi</option>
                </select>
              </label>
            </div>
            <label>
              Catatan kondisi dummy
              <textarea
                required
                minLength={5}
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: SIMULASI — air melewati penanda tepi sungai."
              />
              <span className="field-hint">
                5–300 karakter · {note.length}/300
              </span>
            </label>
            <button
              className="btn primary"
              disabled={busy || note.trim().length < 5}
            >
              <Send size={16} />
              {busy ? "Mengirim simulasi…" : "Kirim laporan dummy"}
            </button>
          </form>
        </Panel>
        <Panel
          title="Bagaimana laporan memengaruhi risiko?"
          eyebrow="VALIDASI SEBELUM DIGUNAKAN"
        >
          <div className="report-impact">
            <span>
              Tanpa laporan <strong>{pct(before.probability)}</strong>
            </span>
            <ArrowRight size={22} />
            <span>
              Dengan bukti tervalidasi <strong>{pct(after.probability)}</strong>
            </span>
          </div>
          <Step n="1" title="Diterima sebagai laporan belum terverifikasi">
            Data warga tidak langsung meningkatkan risiko.
          </Step>
          <Step n="2" title="BPBD memeriksa kewajaran">
            Operator menyetujui atau menolak laporan sintetis.
          </Step>
          <Step n="3" title="Pembaruan probabilistik terbatas">
            Laporan unik tervalidasi menaikkan log-odds; total dibatasi 0,42
            agar tidak mendominasi data.
          </Step>
          <Note>
            Persentase adalah keluaran model pedagogis yang belum dikalibrasi.
            Laporan duplikat dengan ID sama dihitung sekali.
          </Note>
        </Panel>
      </div>
      <Panel title="Antrean validasi laporan" eyebrow="JEJAK KEPUTUSAN MANUSIA">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Laporan</th>
                <th>Wilayah</th>
                <th>Kondisi</th>
                <th>Status</th>
                <th>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {state.reports.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.id}</strong>
                    <small className="table-sub">{r.note}</small>
                  </td>
                  <td>
                    {BASINS.find((b) => b.id === r.basinId)?.name}
                    <small className="table-sub">{r.district}</small>
                  </td>
                  <td>
                    {r.kind}
                    <small className="table-sub">
                      Intensitas {r.severity}/3
                    </small>
                  </td>
                  <td>
                    <span className={`status-pill ${r.status}`}>
                      {r.status === "pending"
                        ? "Menunggu"
                        : r.status === "validated"
                          ? "Tervalidasi"
                          : "Ditolak"}
                    </span>
                  </td>
                  <td>
                    {r.status === "pending" && permission ? (
                      <div className="row-actions">
                        <button
                          className="btn small"
                          onClick={() => validate(r, true)}
                        >
                          <Check size={13} /> Validasi
                        </button>
                        <button
                          className="text-btn"
                          onClick={() => validate(r, false)}
                        >
                          Tolak
                        </button>
                      </div>
                    ) : r.status === "pending" ? (
                      "Perlu BPBD"
                    ) : (
                      "Selesai"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
