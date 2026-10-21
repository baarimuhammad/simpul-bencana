import { lazy, Suspense, useState } from "react";
import { Building2, MapPinned, Search, Users } from "lucide-react";
import { BASINS } from "../shared/seed";
import { fuse } from "../shared/fusion";
import { useDemo } from "../lib/store";
import {
  Badge,
  Factors,
  fmt,
  Note,
  PageHead,
  Panel,
  pct,
} from "../components/UI";
const IndonesiaMap = lazy(() => import("../components/IndonesiaMap"));
export default function RiskMap() {
  const { state, selectBasin } = useDemo();
  const [query, setQuery] = useState("");
  const basin = BASINS.find((b) => b.id === state.selectedBasin)!;
  const risk = fuse(basin, basin.inputs, state.reports);
  return (
    <>
      <PageHead
        eyebrow="PEMANTAUAN SPASIAL"
        title="Peta risiko Indonesia"
        description="Dari gambaran nasional hingga kesiapan kecamatan. Pilih marker atau cari DAS."
      />
      <div className="map-page-layout">
        <Panel className="map-panel">
          <div className="map-search">
            <Search size={16} />
            <input
              aria-label="Cari DAS atau provinsi"
              placeholder="Cari DAS atau provinsi…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              aria-label="Pilih daerah aliran sungai"
              value={state.selectedBasin}
              onChange={(e) => selectBasin(e.target.value)}
            >
              {BASINS.filter((b) =>
                (b.name + " " + b.province)
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              ).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} · {b.province}
                </option>
              ))}
            </select>
            {query &&
              !BASINS.some((b) =>
                (b.name + " " + b.province)
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              ) && <span className="small-text">DAS tidak ditemukan</span>}
          </div>
          <Suspense fallback={<p className="empty">Memuat peta…</p>}>
            <IndonesiaMap large />
          </Suspense>
        </Panel>
        <Panel
          title={`DAS ${basin.name}`}
          eyebrow={basin.province}
          action={<Badge level={risk.level} />}
        >
          <div className="risk-big">
            <strong>{pct(risk.probability)}</strong>
            <span>
              Probabilitas risiko · simulasi
              <br />
              {risk.dominantHazard}
            </span>
          </div>
          <Factors risk={risk} />
          <Note>
            {basin.profile}. Data bahaya tidak mengubah kapasitas evakuasi.
          </Note>
        </Panel>
      </div>
      <div className="two-col">
        <Panel title="Drill-down kecamatan" eyebrow="PAPARAN SINTETIS">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Kecamatan</th>
                  <th>Penduduk terpapar</th>
                  <th>Kelompok rentan</th>
                  <th>Kesiapan</th>
                </tr>
              </thead>
              <tbody>
                {basin.districts.map((d) => (
                  <tr key={d.name}>
                    <td>
                      <MapPinned size={13} /> {d.name}
                    </td>
                    <td>{fmt(d.population)} jiwa</td>
                    <td>{fmt(d.vulnerable)} jiwa</td>
                    <td>{d.readiness}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note>
            Lokasi dan jumlah paparan adalah dummy; bukan dasar keputusan
            evakuasi aktual.
          </Note>
        </Panel>
        <Panel
          title="Titik kumpul & akses evakuasi"
          eyebrow="RENCANA ILUSTRATIF"
        >
          <div className="exposure-summary">
            <span>
              <Users size={16} /> {fmt(basin.population)} jiwa
            </span>
            <span>
              <Building2 size={16} /> {basin.facilities} fasilitas
            </span>
          </div>
          {basin.shelters.map((s, i) => (
            <div className="shelter-row" key={s.name}>
              <span className="shelter-number">{i + 1}</span>
              <div>
                <strong>{s.name}</strong>
                <p>
                  Rute E-{i + 1}: hindari bantaran → jalan kolektor → titik
                  kumpul · {s.distance}
                </p>
                <small>
                  Kapasitas {fmt(s.capacity)} · tersisa{" "}
                  {fmt(s.capacity - s.occupied)} tempat · dummy
                </small>
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </>
  );
}
