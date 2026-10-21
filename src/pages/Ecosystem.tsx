import { useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  CheckCircle2,
  Code2,
  Database,
  FileJson,
  FlaskConical,
  GitBranch,
  Globe2,
  LockKeyhole,
  Network,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { BASINS, EXCHANGES, SOURCES } from "../shared/seed";
import { evaluate } from "../shared/fusion";
import { ROLE_NAMES, type Page, type Role } from "../shared/types";
import { useDemo } from "../lib/store";
import { canVerify } from "../lib/permissions";
import { csvExport, download } from "../lib/export";
import { Empty, Note, PageHead, Panel, pct, Stat } from "../components/UI";
export default function Ecosystem({ page }: { page: Page }) {
  return page === "interop" ? (
    <Interoperability />
  ) : page === "evaluation" ? (
    <Evaluation />
  ) : page === "architecture" ? (
    <Architecture />
  ) : page === "audit" ? (
    <Audit />
  ) : (
    <About />
  );
}
function Interoperability() {
  const { api, state, notify } = useDemo();
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("bmkg");
  const [endpoint, setEndpoint] = useState(
    "/risk?basin=tamiang&scenario=extreme&step=8",
  );
  const [response, setResponse] = useState(
    "Klik “Uji endpoint” untuk melihat respons API yang benar-benar dijalankan.",
  );
  const [busy, setBusy] = useState(false);
  const selected = SOURCES.find((s) => s.id === source)!;
  async function test() {
    setBusy(true);
    try {
      const r = await api(endpoint);
      setResponse(JSON.stringify(r, null, 2));
    } catch (e) {
      setResponse((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHead
        eyebrow="LAPISAN PENGHUBUNG ANTARINSTANSI"
        title="Terhubung, tanpa berpindah tangan."
        description="Satu kontrak pertukaran. Beragam sumber. Kepemilikan dan kewenangan tetap pada instansi."
      >
        <button
          className="btn"
          onClick={async () => {
            try {
              const r = await api("/openapi.json");
              download(
                "simpul-openapi.json",
                JSON.stringify(r, null, 2),
                "application/json",
              );
            } catch (e) {
              notify((e as Error).message);
            }
          }}
        >
          <FileJson size={16} /> Unduh OpenAPI
        </button>
      </PageHead>
      <div className="federation">
        <div className="federation-sources">
          {SOURCES.slice(0, 4).map((s) => (
            <button
              key={s.id}
              style={{ borderLeftColor: s.color }}
              onClick={() => setSource(s.id)}
            >
              <Database size={18} style={{ color: s.color }} />
              <span>
                <strong>{s.short}</strong>
                <small>Data di sumber</small>
              </span>
              <LockKeyhole size={13} />
            </button>
          ))}
        </div>
        <div className="federation-connector">
          <span>API standar</span>
          <ArrowRight size={22} />
          <span>query terarah</span>
        </div>
        <div className="fusion-node">
          <Network size={32} />
          <strong>SIMPUL BENCANA</strong>
          <span>Validasi · selaraskan · padukan</span>
          <small>Cache hasil turunan sesi demo</small>
        </div>
        <div className="federation-connector">
          <span>Risiko + penjelasan</span>
          <ArrowRight size={22} />
        </div>
        <div className="governance-node">
          <ShieldCheck size={30} />
          <strong>BNPB → BPBD</strong>
          <span>Koordinasi & keputusan</span>
          <small>Verifikasi manusia</small>
        </div>
      </div>
      <Note>
        Ini ilustrasi arsitektur federatif. Prototipe memakai fixture lokal;
        tidak melakukan koneksi ke sistem internal instansi atau memindahkan
        data pemerintah.
      </Note>
      <Panel
        title="Status asal data pada prototipe"
        eyebrow="BUKTI KONEKSI · BUKAN KLAIM REAL-TIME"
      >
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Instansi yang diusulkan</th>
                <th>Yang dijalankan hari ini</th>
                <th>Integrasi aktual</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Hujan 24 jam",
                  "BMKG",
                  "Deret angka fixture dengan seed 2026",
                ],
                [
                  "Degradasi tutupan hulu",
                  "Kementerian Kehutanan (sebelumnya KLHK)",
                  "Angka fixture; bukan raster satelit",
                ],
                [
                  "Tinggi muka air",
                  "KemenPU",
                  "Angka fixture; bukan pembacaan pos",
                ],
                [
                  "Lereng / referensi DAS",
                  "BIG",
                  "Lereng fixture; peta dasar Natural Earth",
                ],
                [
                  "Laporan & keputusan",
                  "BPBD / BNPB",
                  "Peran dan log dalam sesi peramban",
                ],
              ].map(([parameter, owner, current]) => (
                <tr key={parameter}>
                  <td>
                    <strong>{parameter}</strong>
                  </td>
                  <td>{owner}</td>
                  <td>{current}</td>
                  <td>
                    <span className="status-pill pending">
                      Belum tersambung
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small-text">
          Endpoint <code>/api/*</code> adalah handler simulasi milik prototipe,
          bukan API BMKG, Kemenhut, KemenPU, BIG, atau BNPB. “Koneksi aktif”
          pada katalog berarti alur fixture internal.
        </p>
      </Panel>
      <Panel
        title="Katalog sumber data"
        eyebrow="KONTRAK & KUALITAS · SELURUH NILAI SIMULASI"
        action={
          <div className="search-control">
            <Search size={14} />
            <input
              aria-label="Cari sumber data"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari instansi…"
            />
          </div>
        }
      >
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Pemilik & parameter</th>
                <th>Format</th>
                <th>Resolusi</th>
                <th>Pembaruan</th>
                <th>Kualitas / metadata</th>
                <th>Koneksi</th>
              </tr>
            </thead>
            <tbody>
              {SOURCES.filter((s) =>
                (s.name + s.short).toLowerCase().includes(search.toLowerCase()),
              ).map((s) => (
                <tr
                  className={s.id === source ? "selected-row" : ""}
                  key={s.id}
                  onClick={() => setSource(s.id)}
                >
                  <td>
                    <button
                      className="source-name"
                      onClick={() => setSource(s.id)}
                    >
                      <i style={{ background: s.color }} />
                      {s.short}
                    </button>
                    <small className="table-sub">{s.kind}</small>
                  </td>
                  <td>{s.format}</td>
                  <td>{s.resolution}</td>
                  <td>
                    {s.frequency}
                    <small className="table-sub">Terakhir: {s.updated}</small>
                  </td>
                  <td>
                    <strong>
                      {s.quality}% / {s.metadata}%
                    </strong>
                    <small className="table-sub">Skor dummy</small>
                  </td>
                  <td>
                    <span className="success-text">
                      <CheckCircle2 size={13} /> Simulasi aktif
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!SOURCES.some((s) =>
          (s.name + s.short).toLowerCase().includes(search.toLowerCase()),
        ) && <Empty>Sumber tidak ditemukan.</Empty>}
      </Panel>
      <div className="two-col">
        <Panel title={selected.name} eyebrow="KONTRAK DATA & TATA KELOLA">
          <div className="definition-list">
            <span>
              Produsen data <strong>{selected.owner}</strong>
            </span>
            <span>
              Parameter <strong>{selected.kind}</strong>
            </span>
            <span>
              Referensi koordinat <strong>EPSG:4326 · WGS 84 (demo)</strong>
            </span>
            <span>
              Identitas observasi{" "}
              <strong>source_id + basin_id + timestamp</strong>
            </span>
            <span>
              Frekuensi <strong>{selected.frequency}</strong>
            </span>
            <span>
              Kebijakan <strong>Data mentah tetap di sumber</strong>
            </span>
          </div>
          <h3 className="spaced-title">Empat prinsip Satu Data Indonesia</h3>
          <div className="principles-grid">
            {[
              "Standar data",
              "Metadata",
              "Interoperabilitas",
              "Kode referensi & data induk",
            ].map((p, i) => (
              <span key={p}>
                <strong>0{i + 1}</strong>
                {p}
              </span>
            ))}
          </div>
          <p className="small-text">
            Penerapan ilustratif; belum dinilai kepatuhannya. Rujukan:{" "}
            <a
              href="https://peraturan.bpk.go.id/Details/108813/perpres-no-39-tahun-2019"
              target="_blank"
              rel="noreferrer"
            >
              Perpres 39 Tahun 2019
            </a>
            .
          </p>
        </Panel>
        <Panel
          title="Coba API publik"
          eyebrow="RESPONS AKTUAL DARI HANDLER SIMULASI"
          action={<Code2 size={18} />}
        >
          <div className="api-tester">
            <span className="method">GET</span>
            <select
              aria-label="Pilih endpoint API"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            >
              {[
                "/health",
                "/basins",
                "/risk?basin=tamiang&scenario=extreme&step=8",
                "/catalog",
                "/exchanges",
                "/evaluation",
                "/cap",
                "/openapi.json",
              ].map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
            <button
              className="btn primary small"
              disabled={busy}
              onClick={test}
            >
              <Play size={13} />
              {busy ? "Menguji…" : "Uji endpoint"}
            </button>
          </div>
          <pre className="code-block api-response" aria-live="polite">
            {response}
          </pre>
          <p className="small-text">
            GET bersifat publik. POST memeriksa X-Demo-Role (simulasi). Respons
            mutasi tidak disimpan di server; UI menyimpan sesi di peramban.
          </p>
          <a
            className="text-btn"
            href="/api/openapi.json"
            target="_blank"
            rel="noreferrer"
          >
            Buka spesifikasi lengkap <ArrowRight size={14} />
          </a>
        </Panel>
      </div>
      <Panel
        title="Log pertukaran API"
        eyebrow="FIXTURE HISTORIS + PANGGILAN AKTUAL SESI DEMO"
        action={<span className="count-pill">Tanpa data pribadi</span>}
      >
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID / waktu simulasi</th>
                <th>Sumber</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th>Durasi</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {state.audit
                .filter((a) => a.action.startsWith("API"))
                .slice(0, 4)
                .map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>Handler sesi</td>
                    <td>
                      <code>{a.action}</code>
                    </td>
                    <td>
                      <span className="status-pill validated">200 · sesi</span>
                    </td>
                    <td>—</td>
                    <td>{a.detail}</td>
                  </tr>
                ))}
              {EXCHANGES.slice(0, 7).map((e) => (
                <tr key={e.id}>
                  <td>
                    {e.id}
                    <small className="table-sub">{e.time} WIB · fixture</small>
                  </td>
                  <td>{e.source}</td>
                  <td>
                    <code>{e.endpoint}</code>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${e.status === 200 ? "validated" : "pending"}`}
                    >
                      {e.status} · dummy
                    </span>
                  </td>
                  <td>{e.latency} ms · simulasi</td>
                  <td>{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
function Evaluation() {
  const { state, setMode } = useDemo();
  const result = evaluate(BASINS[0]);
  return (
    <>
      <PageHead
        eyebrow="TAHAP UJI COBA · BULAN 31–42"
        title="Uji dahulu. Percayakan setelah bukti."
        description="Mode bayangan membandingkan prediksi dengan label sintetis sebelum latihan operasional terbatas."
      />
      <div className="mode-bar">
        <div className="mode-switch">
          <button
            disabled={!canVerify(state.role)}
            className={state.mode === "shadow" ? "active" : ""}
            onClick={() => setMode("shadow")}
          >
            <ShieldCheck size={14} /> Mode bayangan
          </button>
          <button
            disabled={!canVerify(state.role)}
            className={state.mode === "limited" ? "active" : ""}
            onClick={() => setMode("limited")}
          >
            <Activity size={14} /> Operasional terbatas
          </button>
        </div>
        <strong>
          {state.mode === "shadow"
            ? "Diseminasi diblokir"
            : "Diseminasi simulator memerlukan verifikasi"}
        </strong>
      </div>
      <Note tone="warning">
        <strong>
          Seluruh metrik berikut dihitung dari 33 observasi sintetis yang
          berkorelasi dalam 3 replay.
        </strong>{" "}
        Ini bukan evaluasi independen, bukan akurasi nyata, dan tidak dapat
        digeneralisasi ke kejadian bencana.
      </Note>
      <div className="stats-grid">
        <Stat
          label="Precision · simulasi"
          value={pct(result.precision)}
          detail={`TP / (TP + FP) = ${result.tp} / ${result.tp + result.fp}`}
          icon={<CheckCircle2 size={19} />}
          color="blue"
        />
        <Stat
          label="Recall · simulasi"
          value={pct(result.recall)}
          detail={`TP / (TP + FN) = ${result.tp} / ${result.tp + result.fn}`}
          icon={<Search size={19} />}
        />
        <Stat
          label="False alarm rate · simulasi"
          value={pct(result.falseAlarmRate)}
          detail={`FP / (FP + TN) = ${result.fp} / ${result.fp + result.tn}`}
          icon={<Activity size={19} />}
          color="orange"
        />
        <Stat
          label="Lead time · simulasi"
          value={result.leadMinutes}
          unit="menit"
          detail={`Kejadian T+240 − peringatan T+${240 - result.leadMinutes}`}
          icon={<FlaskConical size={19} />}
          color="purple"
        />
      </div>
      <div className="two-col">
        <Panel
          title="Matriks evaluasi sintetis"
          eyebrow="AMBANG PREDIKSI: PROBABILITAS ≥50%"
        >
          <div className="confusion">
            <div />
            <span>Aktual: bahaya</span>
            <span>Aktual: aman</span>
            <span>Prediksi: bahaya</span>
            <div className="confusion-good">
              <strong>{result.tp}</strong>True positive
            </div>
            <div className="confusion-warn">
              <strong>{result.fp}</strong>False positive
            </div>
            <span>Prediksi: aman</span>
            <div className="confusion-warn">
              <strong>{result.fn}</strong>False negative
            </div>
            <div className="confusion-good">
              <strong>{result.tn}</strong>True negative
            </div>
          </div>
          <p className="small-text">
            Label bahaya buatan: skenario ekstrem sejak T+150 menit; kejadian
            sintetis T+240 menit. Baris replay berjarak 30 menit.
            Precision/recall memakai label horizon, lead time memakai penanda
            kejadian.
          </p>
        </Panel>
        <Panel
          title="Gerbang kelayakan sebelum penerapan"
          eyebrow="RENCANA VALIDASI, BUKAN CAPAIAN"
        >
          <ol className="plain-list">
            <li>
              Audit kualitas dan kesepakatan kewenangan data antarinstansi.
            </li>
            <li>
              Uji historis terpisah per DAS, waktu, dan kejadian untuk mencegah
              kebocoran data.
            </li>
            <li>
              Kalibrasi probabilitas, ambang risiko, dan biaya alarm palsu
              bersama BPBD.
            </li>
            <li>
              Uji pemahaman instruksi dan keterjangkauan multikanal bersama
              masyarakat.
            </li>
            <li>
              Evaluasi independen, persetujuan SOP, lalu operasional terbatas.
            </li>
          </ol>
          <Note>
            Nilai ambang kelayakan produksi belum ditetapkan. Semua target
            performa masih hipotesis penelitian.
          </Note>
        </Panel>
      </div>
      <Panel
        title="Observasi pembentuk metrik"
        eyebrow="TRANSPARAN & DAPAT DIULANG"
        action={
          <button
            className="btn small"
            onClick={() =>
              csvExport("evaluasi-bayangan-simulasi.csv", [
                ["PROTOTIPE - DATA SIMULASI"],
                [
                  "Skenario",
                  "Menit",
                  "Probabilitas simulasi",
                  "Prediksi bahaya",
                  "Label sintetis",
                ],
                ...result.observations.map((r) => [
                  r.scenario,
                  r.minute,
                  pct(r.probability),
                  r.fusionAlert ? "1" : "0",
                  r.actual ? "1" : "0",
                ]),
              ])
            }
          >
            <ArrowDownToLine size={14} /> CSV 33 observasi
          </button>
        }
      >
        <div className="table-scroll evaluation-table">
          <table>
            <thead>
              <tr>
                <th>Skenario</th>
                <th>Waktu</th>
                <th>Probabilitas simulasi</th>
                <th>Prediksi</th>
                <th>Label sintetis</th>
              </tr>
            </thead>
            <tbody>
              {result.observations.map((r) => (
                <tr key={`${r.scenario}-${r.step}`}>
                  <td>{r.scenario}</td>
                  <td>T+{r.minute} menit</td>
                  <td>{pct(r.probability)}</td>
                  <td>{r.fusionAlert ? "Bahaya" : "Aman"}</td>
                  <td>{r.actual ? "Bahaya" : "Aman"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
function Architecture() {
  return (
    <>
      <PageHead
        eyebrow="DARI ARSITEKTUR KONSEPTUAL KE PROOF-OF-CONCEPT"
        title="Model yang dapat dijelaskan."
        description="Rancangan penelitian multimodal, diperagakan melalui mesin skor deterministik yang transparan."
      />
      <Note tone="warning">
        Tidak ada LSTM, TCN, CNN, atau attention terlatih pada prototipe ini.
        Probabilitas di antarmuka berasal dari fungsi scoring simulasi, belum
        dikalibrasi secara empiris.
      </Note>
      <Panel
        title="Arsitektur konseptual penelitian"
        eyebrow="SESUAI BAB 2.2 LAPORAN"
      >
        <div className="architecture-flow">
          <div className="architecture-inputs">
            <div>
              <CloudIcon />
              <strong>Hujan & atmosfer</strong>
              <span>BMKG · time-series</span>
              <p>LSTM / TCN</p>
              <small>Ekstraksi pola temporal</small>
            </div>
            <div>
              <Globe2 size={25} />
              <strong>Tutupan lahan & DEM</strong>
              <span>Kemenhut + BIG · raster</span>
              <p>CNN</p>
              <small>Ekstraksi fitur spasial</small>
            </div>
            <div>
              <Activity size={25} />
              <strong>Hidrologi & referensi DAS</strong>
              <span>KemenPU + BIG · titik / vektor</span>
              <p>Penyelarasan fitur</p>
              <small>Ruang, waktu, kualitas data</small>
            </div>
          </div>
          <div className="architecture-fusion">
            <GitBranch size={27} />
            <strong>Late fusion + attention</strong>
            <span>Bobot adaptif per DAS</span>
            <hr />
            <strong>Bayesian updating</strong>
            <span>Pembaruan saat bukti baru masuk</span>
          </div>
          <div className="architecture-output">
            <ShieldCheck size={29} />
            <strong>Klasifikasi risiko</strong>
            <span>Normal · Waspada · Siaga · Awas</span>
            <p>Faktor penyebab + ketidakpastian</p>
            <ArrowRight size={21} />
            <strong>Verifikasi BPBD</strong>
            <span>Diseminasi multikanal</span>
          </div>
        </div>
      </Panel>
      <div className="two-col">
        <Panel
          title="Yang benar-benar dijalankan"
          eyebrow="IMPLEMENTASI PROTOTIPE"
        >
          <div className="definition-list">
            <span>
              Normalisasi{" "}
              <strong>
                Hujan /220; degradasi /80; lereng /50; muka air /500
              </strong>
            </span>
            <span>
              Bobot{" "}
              <strong>Adaptif berbasis aturan profil DAS, dinormalisasi</strong>
            </span>
            <span>
              Skor <strong>Σ bobot × fitur + interaksi − retensi</strong>
            </span>
            <span>
              Bukti <strong>7 × (skor − 0,32) + laporan tervalidasi</strong>
            </span>
            <span>
              Posterior <strong>sigmoid(logit(prior) + bukti)</strong>
            </span>
            <span>
              Ambang{" "}
              <strong>
                Normal &lt;25%; Waspada 25–&lt;50%; Siaga 50–&lt;75%; Awas ≥75%
              </strong>
            </span>
          </div>
          <Note>
            Kontribusi faktor adalah poin skor sebelum sigmoid, bukan atribusi
            kausal atau persentase probabilitas. Data identik menghasilkan
            keluaran identik; replay tidak mengakumulasi bukti yang sama.
          </Note>
        </Panel>
        <Panel
          title="Input → proses → keluaran"
          eyebrow="JAWABAN METODE UNTUK JURI"
        >
          <ol className="plain-list">
            <li>
              <strong>Input:</strong> hujan 24 jam (mm), degradasi hulu (%),
              kemiringan (°), muka air (cm), prior DAS, laporan warga
              tervalidasi. Semua nilai fixture.
            </li>
            <li>
              <strong>Penyelarasan:</strong> satu ID DAS dan waktu replay 30
              menit; unit dibatasi sesuai skala sintetik. Tidak ada resampling
              raster atau pemeriksaan data hilang yang sungguhan.
            </li>
            <li>
              <strong>Fusi:</strong> empat fitur dinormalisasi, bobot aturan
              kontekstual dijumlahkan, interaksi hujan–lahan ditambah dan
              retensi dikurangkan. Bukti menggeser log-odds prior secara analog
              Bayesian.
            </li>
            <li>
              <strong>Keluaran:</strong> skor, probabilitas pedagogis, level
              bertingkat dan kontribusi per faktor; draf EWS menyimpan snapshot
              input agar dapat ditinjau BPBD.
            </li>
          </ol>
          <Note tone="warning">
            Bobot bukan parameter attention terlatih. Rasio bukti bukan
            likelihood yang diestimasi dari data kejadian; probabilitas belum
            dikalibrasi dan tidak boleh dipakai untuk keselamatan.
          </Note>
        </Panel>
      </div>
      <Panel title="Saat beralih ke data nyata" eyebrow="AGENDA PENELITIAN">
        <ol className="plain-list">
          <li>
            Ganti fixture dengan adapter API resmi yang disepakati pemilik data.
          </li>
          <li>
            Validasi CRS, unit, resolusi, waktu observasi, dan kebaruan data.
          </li>
          <li>
            Latih model temporal dan spasial dengan pemisahan data per kejadian
            dan DAS.
          </li>
          <li>
            Kalibrasi prior, likelihood, ambang, serta mekanisme data hilang dan
            bukti berulang.
          </li>
          <li>
            Uji bias wilayah, kalibrasi probabilitas, ketidakpastian, dan
            kegunaan penjelasan.
          </li>
          <li>
            Terapkan identitas, otorisasi, penyimpanan aman, persetujuan SOP,
            dan audit independen.
          </li>
        </ol>
      </Panel>
    </>
  );
}
function CloudIcon() {
  return <Activity size={25} />;
}
function Audit() {
  const { state, reset } = useDemo();
  const [filter, setFilter] = useState("");
  return (
    <>
      <PageHead
        eyebrow="TATA KELOLA & AKUNTABILITAS"
        title="Setiap tindakan memiliki jejak."
        description="Log hanya untuk sesi demo di peramban; bukan audit trail yang tahan manipulasi."
      >
        <button
          className="btn"
          onClick={() =>
            csvExport("audit-simulasi.csv", [
              ["PROTOTIPE - DATA SIMULASI"],
              ["Waktu simulasi", "Peran", "Aksi", "Detail"],
              ...state.audit.map((a) => [
                a.timestamp,
                ROLE_NAMES[a.actor],
                a.action,
                a.detail,
              ]),
            ])
          }
        >
          <ArrowDownToLine size={16} /> Ekspor audit
        </button>
        <button
          className="btn"
          disabled={state.role !== "admin"}
          onClick={() => reset()}
        >
          <RefreshCw size={16} /> Reset seluruh demo
        </button>
      </PageHead>
      <Note>
        Hak akses diperiksa di UI dan handler API, tetapi header peran dapat
        dipalsukan dan penyimpanan lokal dapat diedit. Tidak ada autentikasi,
        enkripsi aplikasi, backup server, atau kontrol keamanan produksi.
      </Note>
      <Panel
        title="Hak akses per peran"
        eyebrow="AUTENTIKASI DEMO TANPA PASSWORD"
      >
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Peran</th>
                <th>Pantau risiko</th>
                <th>Laboratorium & katalog</th>
                <th>Lapor kondisi</th>
                <th>Verifikasi & diseminasi</th>
                <th>Ubah mode</th>
              </tr>
            </thead>
            <tbody>
              {(Object.entries(ROLE_NAMES) as [Role, string][]).map(
                ([role, name]) => (
                  <tr key={role}>
                    <td>
                      <strong>{name}</strong>
                      {role === state.role && (
                        <small className="table-sub">Peran aktif</small>
                      )}
                    </td>
                    <td>✓ Baca</td>
                    <td>{role === "public" ? "—" : "✓ Baca / simulasi"}</td>
                    <td>✓ Data dummy</td>
                    <td>{canVerify(role) ? "✓ Berwenang dalam demo" : "—"}</td>
                    <td>{canVerify(role) ? "✓" : "—"}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel
        title="Log aktivitas"
        eyebrow="WAKTU AUDIT JUGA DISIMULASIKAN"
        action={
          <div className="search-control">
            <Search size={14} />
            <input
              aria-label="Filter log audit"
              placeholder="Cari aktivitas…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        }
      >
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Waktu simulasi</th>
                <th>Peran</th>
                <th>Aktivitas</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {state.audit
                .filter((a) =>
                  (a.action + a.detail)
                    .toLowerCase()
                    .includes(filter.toLowerCase()),
                )
                .map((a) => (
                  <tr key={a.id}>
                    <td>
                      {new Date(a.timestamp).toLocaleTimeString("id-ID", {
                        timeZone: "Asia/Jakarta",
                      })}
                    </td>
                    <td>{ROLE_NAMES[a.actor]}</td>
                    <td>
                      <strong>{a.action}</strong>
                    </td>
                    <td>{a.detail}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
function About() {
  return (
    <>
      <PageHead
        eyebrow="GAGASAN UNTUK INDONESIA TANGGUH"
        title="Bukan menambah sensor. Menyatukan pemahaman."
        description="SIMPUL BENCANA · Sistem Interoperabilitas Multi-Parameter untuk Peringatan Dini Banjir dan Longsor Berbasis Data Silang BMKG–KLHK–BNPB."
      />
      <div className="about-hero">
        <span className="eyebrow">PROPOSAL KIM UNAIR 2026 · BIDANG GFT</span>
        <h2>
          Data yang tersebar,
          <br />
          menjadi keputusan bersama.
        </h2>
        <p>
          Masalah utama dalam gagasan ini adalah fragmentasi. Lapisan
          interoperabilitas menghubungkan atmosfer, lahan, hidrologi, dan
          geospasial untuk membantu BNPB/BPBD mengambil tindakan yang terarah.
        </p>
        <span className="about-label">
          Prototipe akademik independen · Seluruh data operasional simulasi
        </span>
        <Network size={180} className="about-decoration" />
      </div>
      <Panel
        title="Jejak proposal → demonstrasi → bukti"
        eyebrow="MATRIKS KESESUAIAN KONSEP"
      >
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Konsep proposal</th>
                <th>Yang diperagakan</th>
                <th>Bukti dalam prototipe</th>
                <th>Yang belum terbukti</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Interoperabilitas data",
                  "Katalog pemilik, kontrak, query per DAS",
                  "Endpoint /api/catalog, /api/risk dan log pertukaran fixture",
                  "Belum ada perjanjian, adapter, atau API instansi",
                ],
                [
                  "AI Fusion multi-parameter",
                  "Empat input, bobot aturan, prior → bukti → posterior",
                  "Slider, kontribusi dan tes skenario deterministik",
                  "Belum ada model LSTM/CNN terlatih atau kalibrasi",
                ],
                [
                  "Pemetaan risiko",
                  "Peta delapan DAS dengan layer ilustratif",
                  "Status, faktor, kecamatan dan paparan dummy",
                  "Bukan batas DAS resmi atau peta risiko tervalidasi",
                ],
                [
                  "Early Warning System",
                  "Rekomendasi → checklist BPBD → kanal latihan",
                  "Snapshot draf, verifikasi, blok mode bayangan, CAP Test",
                  "Belum mengirim peringatan ke publik",
                ],
              ].map(([concept, feature, evidence, gap]) => (
                <tr key={concept}>
                  <td>
                    <strong>{concept}</strong>
                  </td>
                  <td>{feature}</td>
                  <td>{evidence}</td>
                  <td>{gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel
        title="Roadmap implementasi"
        eyebrow="ACUAN UTAMA: BAB 2.4 · 60 BULAN"
      >
        <div className="roadmap">
          {[
            [
              "01",
              "Persiapan",
              "Bulan 1–12",
              "Konsorsium BNPB, audit data, standar bersama, pemilihan DAS pilot.",
            ],
            [
              "02",
              "Integrasi",
              "Bulan 13–30",
              "API lintas instansi, penyelarasan, model fusi, dasbor dan tata kelola.",
            ],
            [
              "03",
              "Uji coba",
              "Bulan 31–42",
              "Mode bayangan → operasional terbatas, simulasi warga dan multikanal.",
            ],
            [
              "04",
              "Evaluasi & pengembangan",
              "Bulan 43–60",
              "Audit independen, kalibrasi per DAS, perluasan bertahap dan penganggaran.",
            ],
          ].map(([n, title, time, description]) => (
            <div key={n}>
              <span className="roadmap-number">{n}</span>
              <small>{time}</small>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
        <Note>
          Dokumen sumber memuat versi lain pada Bab 3.2 (hingga 120 bulan).
          Antarmuka ini sengaja mengikuti empat tahap Bab 2.4 sesuai arahan
          prototipe.
        </Note>
      </Panel>
      <div className="two-col">
        <Panel title="Koordinasi pentahelix" eyebrow="PEMBAGIAN PERAN">
          <div className="pentahelix">
            {[
              [
                "Pemerintah",
                "BNPB mengoordinasikan; BMKG, Kementerian Kehutanan (sebelumnya KLHK), KemenPU, BIG menyediakan data; BPBD memverifikasi.",
              ],
              [
                "Akademisi",
                "UNAIR, perguruan tinggi dan BRIN: riset, validasi serta evaluasi independen.",
              ],
              [
                "Dunia usaha",
                "Mitra teknologi dan operator telekomunikasi: interoperabilitas dan kanal komunikasi.",
              ],
              [
                "Masyarakat",
                "Relawan dan kelompok siaga: bukti lapangan, kesiapsiagaan, simulasi evakuasi.",
              ],
              [
                "Media",
                "Radio komunitas, penyiaran dan media: instruksi yang mudah dipahami dan menjangkau warga.",
              ],
            ].map(([title, description]) => (
              <div key={title}>
                <Users size={18} />
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="Kebaruan sebagai hipotesis kontribusi"
          eyebrow="MELENGKAPI EKOSISTEM YANG SUDAH ADA"
        >
          <div className="comparison-about">
            <h3>BMKG · sumber cuaca dan peringatan</h3>
            <p>
              BMKG sudah menyediakan informasi dan peringatan cuaca, termasuk
              pendekatan berbasis dampak. SIMPUL mengusulkan agar sinyal ini
              dibaca bersama kondisi hulu dan respons sungai pada tingkat DAS;
              tidak menggantikan kewenangan BMKG.
            </p>
            <h3>InaRISK · pengetahuan risiko wilayah</h3>
            <p>
              InaRISK BNPB menampilkan informasi bahaya/risiko dan rekomendasi
              mitigasi. SIMPUL mengusulkan pelengkap berupa pembaruan
              multi-parameter pada replay, alasan level, dan alur rekomendasi ke
              verifikasi BPBD; ini belum membuktikan keunggulan atas InaRISK.
            </p>
            <h3>IDRIP · penguatan sistem peringatan</h3>
            <p>
              Pengalaman IDRIP pada pemantauan dan diseminasi gempa–tsunami
              menjadi rujukan tata kelola. Proposal ini berfokus pada fusi
              hujan–lahan–lereng–muka air untuk banjir/longsor, dengan evaluasi
              tersendiri yang belum dilakukan.
            </p>
          </div>
          <p className="small-text">
            Kebaruan adalah kombinasi dan alur kerja yang{" "}
            <strong>diusulkan</strong>, bukan klaim fitur tersebut tidak ada di
            sistem lain atau sudah lebih cepat/akurat. Rujukan resmi:{" "}
            <a
              href="https://www.bmkg.go.id/cuaca/potensi-cuaca-ekstrem"
              target="_blank"
              rel="noreferrer"
            >
              BMKG cuaca
            </a>{" "}
            ·{" "}
            <a
              href="https://inarisk.bnpb.go.id/"
              target="_blank"
              rel="noreferrer"
            >
              InaRISK BNPB
            </a>{" "}
            ·{" "}
            <a
              href="https://www.bmkg.go.id/berita/utama/menutup-idrip-peringatan-dini-gempa-tsunami-kini-maksimum-3-menit-akurasi-90"
              target="_blank"
              rel="noreferrer"
            >
              BMKG tentang IDRIP
            </a>
            .
          </p>
          <div className="sdg-row">
            {[
              ["9", "Infrastruktur & inovasi"],
              ["11", "Kota berkelanjutan"],
              ["13", "Penanganan iklim"],
              ["15", "Ekosistem daratan"],
            ].map(([n, title]) => (
              <span key={n}>
                <strong>{n}</strong>SDG<small>{title}</small>
              </span>
            ))}
          </div>
        </Panel>
      </div>
      <Panel
        title="Latar masalah & rujukan proposal"
        eyebrow="BUKAN METRIK KINERJA SIMPUL BENCANA"
      >
        <p className="body-text">
          Proposal mengangkat persoalan fragmentasi data dan kebutuhan
          menerjemahkan informasi menjadi tindakan. Angka kinerja maupun
          kerugian dalam proposal tidak digunakan untuk mengklaim kemampuan
          prototipe ini. Rujukan berikut berasal dari daftar pustaka laporan dan
          memerlukan verifikasi lebih lanjut sebelum publikasi ilmiah.
        </p>
        <ul className="reference-list">
          <li>
            <a
              href="https://aisindo.id/index.php/2025/12/24/sistem-informasi-bencana-terintegrasi-sebagai-solusi-efektif-peringatan-dini-bencana/"
              target="_blank"
              rel="noreferrer"
            >
              Hartomo dkk. (2025). Sistem informasi bencana terintegrasi —
              AISINDO.
            </a>
          </li>
          <li>
            <a
              href="https://www.bmkg.go.id/berita/menutup-idrip-perigatan-dini-gempa-tsunami-kini-maksimum-3-menit-akurasi-90"
              target="_blank"
              rel="noreferrer"
            >
              Endah (2025). Menutup IDRIP — BMKG.
            </a>
          </li>
          <li>
            <a
              href="https://www.bmkg.go.id/berita/perkuat-sistem-peringatan-dini-bencana-bmkg-kemkomdigi-optimalkan-infrastruktur-komunikasi"
              target="_blank"
              rel="noreferrer"
            >
              Cahyo (2025). Penguatan infrastruktur komunikasi — BMKG.
            </a>
          </li>
        </ul>
      </Panel>
      <Note tone="warning">
        <strong>Batasan:</strong> data, layer, batas DAS, rute, populasi,
        kesiapan, performa, dan pengiriman bersifat simulasi. Tidak terhubung ke
        kanal darurat, tidak melatih model ML, tidak layak digunakan untuk
        keputusan keselamatan. Live BMKG dinonaktifkan. Peta dasar Natural Earth
        bukan peta administrasi resmi BIG.
      </Note>
    </>
  );
}
