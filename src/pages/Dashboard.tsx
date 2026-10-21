import { lazy, Suspense } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CloudRain,
  Gauge,
  Layers3,
  MapPinned,
  Radio,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import { BASINS, SOURCES } from "../shared/seed";
import { fuse } from "../shared/fusion";
import { useDemo } from "../lib/store";
import {
  Badge,
  fmt,
  PageHead,
  Panel,
  pct,
  Signal,
  Stat,
} from "../components/UI";
import { csvExport } from "../lib/export";
import type { Page } from "../shared/types";
const IndonesiaMap = lazy(() => import("../components/IndonesiaMap"));
export default function Dashboard({ go }: { go: (p: Page) => void }) {
  const { state, selectBasin } = useDemo();
  const risks = BASINS.map((b) => ({
    ...b,
    risk: fuse(b, b.inputs, state.reports),
  }));
  const high = risks.filter((b) => ["Awas", "Siaga"].includes(b.risk.level));
  const selected = risks.find((b) => b.id === state.selectedBasin)!;
  return (
    <>
      <PageHead
        eyebrow="PUSAT KENDALI NASIONAL"
        title="Membaca risiko. Menyatukan respons."
        description="Pantau sinyal lintas instansi, pahami penyebabnya, dan siapkan langkah bersama."
      >
        <span className="date-pill">
          <i />
          21 Oktober 2026 <small>08.00 WIB · simulasi</small>
        </span>
        <button
          className="btn"
          onClick={() =>
            csvExport("risiko-das-simulasi.csv", [
              ["PROTOTIPE - DATA SIMULASI"],
              ["DAS", "Provinsi", "Level", "Probabilitas simulasi"],
              ...risks.map((b) => [
                b.name,
                b.province,
                b.risk.level,
                pct(b.risk.probability),
              ]),
            ])
          }
        >
          <ArrowDownToLine size={16} /> Ekspor data
        </button>
      </PageHead>
      <div className="overview-callout">
        <div className="overview-symbol">
          <NetworkIcon />
        </div>
        <div>
          <strong>
            Satu gambaran utuh, dari data yang sebelumnya terpisah.
          </strong>
          <p>
            BMKG, Kementerian Kehutanan, KemenPU, dan BIG terhubung untuk
            mendukung keputusan BNPB/BPBD.
          </p>
        </div>
        <button onClick={() => go("lab")}>
          Jalankan demo fusi <ArrowRight size={16} />
        </button>
      </div>
      <div className="stats-grid">
        <Stat
          label="DAS dipantau"
          value="8"
          unit="DAS"
          detail="1 pilot Sumatra · 7 wilayah pembanding"
          icon={<MapPinned size={19} />}
        />
        <Stat
          label="Wilayah perlu perhatian"
          value={high.length}
          unit="DAS"
          detail="Status Siaga / Awas · data simulasi"
          icon={<TriangleAlert size={19} />}
          color="orange"
        />
        <Stat
          label="Penduduk terpapar"
          value={fmt(high.reduce((n, b) => n + b.population, 0))}
          unit="jiwa"
          detail="Estimasi sintetis pada DAS Siaga / Awas"
          icon={<Users size={19} />}
          color="blue"
        />
        <Stat
          label="Sumber data terhubung"
          value="5/5"
          detail="Konektor simulasi · kepemilikan tetap"
          icon={<Layers3 size={19} />}
          color="purple"
        />
      </div>
      <div className="dashboard-map-grid">
        <Panel
          title="Peta risiko hidrometeorologi"
          eyebrow="GAMBARAN LINTAS WILAYAH"
          action={
            <button className="text-btn" onClick={() => go("map")}>
              Jelajahi peta <ChevronRight size={15} />
            </button>
          }
          className="map-panel"
        >
          <Suspense
            fallback={<div className="map-loading">Memuat peta Indonesia…</div>}
          >
            <IndonesiaMap />
          </Suspense>
          <div className="map-legend">
            {(["Normal", "Waspada", "Siaga", "Awas"] as const).map((l) => (
              <span key={l}>
                <span className={`legend-dot level-${l.toLowerCase()}`} />
                {l}{" "}
                <strong>
                  {risks.filter((b) => b.risk.level === l).length}
                </strong>
              </span>
            ))}
            <small>Seluruh status merupakan simulasi</small>
          </div>
        </Panel>
        <Panel
          title="Prioritas penanganan"
          eyebrow="SINYAL MENJADI TINDAKAN"
          action={<span className="count-pill">{high.length} wilayah</span>}
          className="priority-panel"
        >
          {risks
            .sort((a, b) => b.risk.probability - a.risk.probability)
            .slice(0, 3)
            .map((b, i) => (
              <button
                className={`priority-item ${b.id === selected.id ? "selected" : ""}`}
                key={b.id}
                onClick={() => selectBasin(b.id)}
              >
                <span
                  className={`priority-index index-${b.risk.level.toLowerCase()}`}
                >
                  0{i + 1}
                </span>
                <div>
                  <div className="priority-heading">
                    <strong>DAS {b.name}</strong>
                    <Badge level={b.risk.level} />
                  </div>
                  <small>{b.province}</small>
                  <p>
                    {b.risk.factors
                      .sort((a, b) => b.contribution - a.contribution)
                      .slice(0, 2)
                      .map((f) => f.label)
                      .join(" + ")}
                  </p>
                  <div className="priority-footer">
                    <span>
                      Probabilitas simulasi{" "}
                      <strong>{pct(b.risk.probability)}</strong>
                    </span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </button>
            ))}
          <div className="human-note">
            <ShieldCheck size={18} />
            <span>
              Verifikasi BPBD menjadi penghubung antara analisis dan tindakan.
            </span>
          </div>
          <button
            className="btn full"
            onClick={() => go(state.role === "public" ? "alerts" : "bpbd")}
          >
            Buka pusat respons <ArrowRight size={15} />
          </button>
        </Panel>
      </div>
      <div className="dashboard-bottom-grid">
        <Panel
          title={`Ringkasan DAS ${selected.name}`}
          eyebrow="KONTEKS DI BALIK PERINGATAN"
          action={<Badge level={selected.risk.level} />}
        >
          <div className="basin-metrics">
            <div>
              <CloudRain size={19} />
              <strong>
                {selected.inputs.rain}
                <small> mm/24 jam</small>
              </strong>
              <span>Curah hujan · BMKG</span>
            </div>
            <div>
              <Gauge size={19} />
              <strong>
                {selected.inputs.water}
                <small> cm</small>
              </strong>
              <span>Muka air · KemenPU</span>
            </div>
            <div>
              <ShieldCheck size={19} />
              <strong>
                {selected.readiness}
                <small>%</small>
              </strong>
              <span>Kesiapan daerah · dummy</span>
            </div>
          </div>
          <div className="insight-row">
            <span className="insight-icon">
              <TriangleAlert size={16} />
            </span>
            <p>
              <strong>Risiko dibaca bersama, bukan dari hujan saja.</strong>{" "}
              Degradasi hulu {selected.inputs.forestLoss}% dan lereng{" "}
              {selected.inputs.slope}° memberi konteks pada sinyal meteorologis.
            </p>
          </div>
          <button
            className="text-btn"
            onClick={() => go(state.role === "public" ? "map" : "lab")}
          >
            Lihat bagaimana risiko dihitung <ArrowRight size={15} />
          </button>
        </Panel>
        <Panel
          title="Kesehatan pertukaran data"
          eyebrow="INTEROPERABILITAS"
          action={<Signal />}
        >
          <div className="source-health">
            {SOURCES.map((s) => (
              <div key={s.id}>
                <span
                  className="source-emblem"
                  style={{ color: s.color, background: s.color + "12" }}
                >
                  {s.short.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <strong>{s.short}</strong>
                  <small>{s.kind}</small>
                </div>
                <span className="source-health-quality">
                  {s.quality}% <CheckCircle2 size={13} />
                </span>
              </div>
            ))}
          </div>
          <div className="ownership-note">
            <DatabaseIcon /> Data tetap di instansi. Yang disatukan adalah
            pemahaman.
          </div>
        </Panel>
      </div>
      <div className="demo-bottom">
        <Radio size={18} />
        <span>
          <strong>Siap untuk demonstrasi 5 menit?</strong> Lihat hujan ekstrem
          berubah menjadi peringatan yang dapat dijelaskan.
        </span>
        <button
          className="text-btn"
          onClick={() => go(state.role === "public" ? "about" : "lab")}
        >
          Mulai cerita <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}
function NetworkIcon() {
  return <Layers3 size={22} />;
}
function DatabaseIcon() {
  return <Layers3 size={14} />;
}
