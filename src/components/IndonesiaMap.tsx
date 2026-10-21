import { useEffect, useState } from "react";
import { Focus, Layers3, Minus, Plus } from "lucide-react";
import { BASINS } from "../shared/seed";
import { fuse } from "../shared/fusion";
import { useDemo } from "../lib/store";
import { Badge, pct } from "./UI";
interface GeoFeature {
  id: string;
  properties: { name: string };
  geometry: { type: string; coordinates: number[][][] | number[][][][] };
}
const colors = {
  Normal: "#2b9276",
  Waspada: "#bd9221",
  Siaga: "#e47c35",
  Awas: "#db5257",
};
const project = (lon: number, lat: number): [number, number] => [
  ((lon - 93) / 49) * 1000,
  ((9 - lat) / 23) * 470,
];
function geometryPath(feature: GeoFeature) {
  const polygons =
    feature.geometry.type === "Polygon"
      ? [feature.geometry.coordinates as number[][][]]
      : (feature.geometry.coordinates as number[][][][]);
  return polygons
    .flatMap((p) =>
      p.map(
        (ring) =>
          ring
            .map(
              ([lon, lat], i) =>
                `${i ? "L" : "M"}${project(lon, lat)
                  .map((n) => n.toFixed(1))
                  .join(",")}`,
            )
            .join("") + "Z",
      ),
    )
    .join("");
}
export default function IndonesiaMap({ large = false }: { large?: boolean }) {
  const { state, selectBasin } = useDemo();
  const [features, setFeatures] = useState<GeoFeature[]>([]);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [layers, setLayers] = useState<string[]>([]);
  const [layerMenu, setLayerMenu] = useState(large);
  const basin = BASINS.find((b) => b.id === state.selectedBasin)!;
  useEffect(() => {
    let alive = true;
    fetch("/data/archipelago.geojson")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        if (alive) setFeatures(d.features);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  const center = project(basin.lon, basin.lat);
  const width = 1000 / zoom,
    height = 470 / zoom;
  const x =
    zoom === 1 ? 0 : Math.max(0, Math.min(1000 - width, center[0] - width / 2));
  const y =
    zoom === 1
      ? 0
      : Math.max(0, Math.min(470 - height, center[1] - height / 2));
  function toggle(layer: string) {
    setLayers((old) =>
      old.includes(layer) ? old.filter((l) => l !== layer) : [...old, layer],
    );
  }
  return (
    <div className={`map-container ${large ? "map-large" : ""}`}>
      <div className="map-topline">
        <span className="map-live">
          <i /> PEMANTAUAN WILAYAH
        </span>
        <span>8 DAS ilustrasi · GeoJSON lokal</span>
      </div>
      {error && (
        <div className="map-fallback">
          Peta dasar tidak tersedia. Marker DAS tetap dapat digunakan.
        </div>
      )}
      <svg
        className="indonesia-map"
        viewBox={`${x} ${y} ${width} ${height}`}
        role="img"
        aria-label="Peta interaktif Indonesia dengan delapan lokasi DAS simulasi"
      >
        <defs>
          <pattern
            id="map-grid"
            width="45"
            height="45"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M45 0H0V45"
              fill="none"
              stroke="#a9c2c8"
              strokeWidth=".4"
              opacity=".35"
            />
          </pattern>
          <pattern
            id="terrain"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <path d="M0 8L8 0" stroke="#8c729a" strokeWidth="1" opacity=".6" />
          </pattern>
          <radialGradient id="rain-glow">
            <stop offset="0%" stopColor="#4c9ccc" stopOpacity=".42" />
            <stop offset="100%" stopColor="#4c9ccc" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="1000" height="470" fill="url(#map-grid)" />
        {features.map((f) => (
          <path
            key={f.id}
            d={geometryPath(f)}
            fill={f.id === "360" ? "#d4e0d5" : "#e0e8e6"}
            stroke={f.id === "360" ? "#91aaa0" : "#c9d4d2"}
            strokeWidth=".8"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {[
          ["SUMATRA", 100.7, 1.0],
          ["JAWA", 111.2, -8.5],
          ["KALIMANTAN", 113.9, 1.0],
          ["SULAWESI", 122.2, -2],
          ["PAPUA", 138.8, -5.2],
          ["MALUKU", 129, -3.6],
        ].map(([name, lon, lat]) => {
          const [tx, ty] = project(Number(lon), Number(lat));
          return (
            <text
              key={name}
              className="island-label"
              x={tx}
              y={ty}
              textAnchor="middle"
            >
              {name}
            </text>
          );
        })}
        <text className="ocean-label" x="225" y="350">
          SAMUDRA HINDIA
        </text>
        <text className="ocean-label" x="710" y="90">
          SAMUDRA PASIFIK
        </text>
        {BASINS.map((b, i) => {
          const [cx, cy] = project(b.lon, b.lat);
          const risk = fuse(b, b.inputs, state.reports);
          const selected = b.id === basin.id;
          return (
            <g key={b.id}>
              <title>{`DAS ${b.name}: ${risk.level}, probabilitas simulasi ${pct(risk.probability)}`}</title>
              {layers.includes("Hujan") && (
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx={34 + i * 2}
                  ry="23"
                  fill="url(#rain-glow)"
                />
              )}
              {layers.includes("Tutupan lahan") && (
                <circle cx={cx} cy={cy} r="23" fill="#368661" opacity=".35" />
              )}
              {layers.includes("Topografi") && (
                <circle cx={cx} cy={cy} r="27" fill="url(#terrain)" />
              )}
              {layers.includes("Muka air") && (
                <path
                  d={`M${cx - 19} ${cy + 23} Q${cx + 6} ${cy - 3} ${cx + 23} ${cy + 10}`}
                  stroke="#3287b2"
                  strokeWidth="4"
                  fill="none"
                />
              )}
              <g
                role="button"
                tabIndex={0}
                className="map-marker"
                aria-label={`Pilih DAS ${b.name}, ${risk.level}`}
                onClick={() => selectBasin(b.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectBasin(b.id);
                  }
                }}
              >
                {selected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="24"
                    fill={colors[risk.level]}
                    opacity=".12"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={selected ? 15 : 11}
                  fill={colors[risk.level]}
                  opacity=".18"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={selected ? 7 : 5}
                  fill={colors[risk.level]}
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={cx + 12}
                  y={cy + (i === 1 ? 17 : -12)}
                  className="marker-label"
                >
                  {b.name}
                </text>
              </g>
              {selected && (
                <path
                  d={`M${cx + 16} ${cy + 15}l42 25h48`}
                  fill="none"
                  stroke={colors[risk.level]}
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="map-zoom">
        <button
          aria-label="Perbesar peta"
          onClick={() => setZoom(Math.min(3, zoom + 0.5))}
        >
          <Plus size={17} />
        </button>
        <button
          aria-label="Perkecil peta"
          onClick={() => setZoom(Math.max(1, zoom - 0.5))}
        >
          <Minus size={17} />
        </button>
        <button aria-label="Reset cakupan Indonesia" onClick={() => setZoom(1)}>
          <Focus size={17} />
        </button>
      </div>
      <div className="map-layer-button">
        <button className="btn small" onClick={() => setLayerMenu(!layerMenu)}>
          <Layers3 size={15} /> Layer <span>{layers.length}</span>
        </button>
        {layerMenu && (
          <div className="layer-menu">
            <strong>Layer data ilustratif</strong>
            {["Hujan", "Tutupan lahan", "Topografi", "Muka air"].map((l) => (
              <label key={l}>
                <input
                  type="checkbox"
                  checked={layers.includes(l)}
                  onChange={() => toggle(l)}
                />
                {l}
              </label>
            ))}
            <small>Lapisan sintetis, bukan raster instansi.</small>
          </div>
        )}
      </div>
      <div className="map-selection">
        <div>
          <span className="eyebrow">
            DAS TERPILIH {basin.id === "tamiang" ? "· PILOT" : ""}
          </span>
          <strong>
            {basin.name} <small>{basin.province}</small>
          </strong>
        </div>
        <Badge level={fuse(basin, basin.inputs, state.reports).level} />
      </div>
      <div className="map-attribution">
        Natural Earth · batas DAS & lokasi evakuasi ilustratif
      </div>
    </div>
  );
}
