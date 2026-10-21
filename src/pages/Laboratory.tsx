import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CloudRain,
  FlaskConical,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Waves,
} from "lucide-react";
import { BASINS } from "../shared/seed";
import { fuse, LAST_STEP, replay, scenarioInputs } from "../shared/fusion";
import {
  SCENARIO_NAMES,
  type Inputs,
  type Page,
  type Scenario,
} from "../shared/types";
import { useDemo } from "../lib/store";
import { canVerify } from "../lib/permissions";
import { Badge, Factors, Note, PageHead, Panel, pct } from "../components/UI";
function Curve({
  scenario,
  tick,
  basinId,
}: {
  scenario: Scenario;
  tick: number;
  basinId: string;
}) {
  const data = replay(
    BASINS.find((b) => b.id === basinId)!,
    scenario,
  );
  const points = (get: (i: number) => number) =>
    data.map((_, i) => `${28 + i * 63},${170 - get(i) * 135}`).join(" ");
  return (
    <svg
      className="trend-svg"
      viewBox="0 0 690 210"
      role="img"
      aria-label="Grafik probabilitas risiko dan curah hujan simulasi sepanjang replay"
    >
      <defs>
        <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#26977b" stopOpacity=".22" />
          <stop offset="100%" stopColor="#26977b" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((n) => (
        <g key={n}>
          <line
            x1="28"
            y1={170 - n * 135}
            x2="658"
            y2={170 - n * 135}
            stroke="var(--border)"
            strokeDasharray={n === 0.5 ? "5 5" : "0"}
          />
          <text x="2" y={173 - n * 135}>
            {Math.round(n * 100)}
          </text>
        </g>
      ))}
      <polygon
        points={`28,170 ${points((i) => data[i].probability)} 658,170`}
        fill="url(#chart-fill)"
      />
      <polyline
        points={points((i) => data[i].inputs.rain / 250)}
        fill="none"
        stroke="#729fc1"
        strokeWidth="2"
        strokeDasharray="5 5"
      />
      <polyline
        points={points((i) => data[i].probability)}
        fill="none"
        stroke="#238c76"
        strokeWidth="3"
      />
      <line
        x1={28 + tick * 63}
        x2={28 + tick * 63}
        y1="22"
        y2="175"
        stroke="var(--ink)"
        opacity=".3"
      />
      <circle
        cx={28 + tick * 63}
        cy={170 - data[tick].probability * 135}
        r="5"
        fill="#238c76"
        stroke="white"
        strokeWidth="2"
      />
      {[0, 2, 4, 6, 8, 10].map((n) => (
        <text key={n} x={28 + n * 63} y="197" textAnchor="middle">
          T+{n * 30} menit
        </text>
      ))}
    </svg>
  );
}
function Timeline({
  title,
  type,
  tick,
  scenario,
  basinId,
}: {
  title: string;
  type: "separate" | "fusion";
  tick: number;
  scenario: Scenario;
  basinId: string;
}) {
  const curve = replay(
    BASINS.find((b) => b.id === basinId)!,
    scenario,
  );
  const first = curve.find((r) =>
    type === "fusion" ? r.fusionAlert : r.separateAlert,
  );
  const fired = first !== undefined && tick >= first.step;
  return (
    <div className={`comparison-card comparison-${type}`}>
      <div className="comparison-title">
        <span className="comparison-icon">
          {type === "fusion" ? (
            <FlaskConical size={18} />
          ) : (
            <CloudRain size={18} />
          )}
        </span>
        <div>
          <h3>{title}</h3>
          <small>
            {type === "fusion"
              ? "Hujan + lahan + topografi + hidrologi"
              : "Pembanding hipotetis: ambang hujan & koordinasi manual"}
          </small>
        </div>
      </div>
      <div className="timeline-cells">
        {curve.map((r) => (
          <div
            key={r.step}
            className={`timeline-cell ${r.step <= tick ? "elapsed" : ""} ${(type === "fusion" ? r.fusionAlert : r.separateAlert) && r.step <= tick ? "trigger" : ""} ${r.step === 8 && scenario === "extreme" ? "event" : ""}`}
            title={`T+${r.minute} menit · ${type === "fusion" ? r.level : r.separate}`}
          >
            <span />
            {r.step % 2 === 0 && <small>{r.minute}'</small>}
          </div>
        ))}
      </div>
      <div className="comparison-result">
        <span className={fired ? "trigger-text" : ""}>
          {fired ? (
            <>
              <Check size={14} />{" "}
              {type === "separate" && scenario === "false-alarm"
                ? "Alarm tanpa kejadian sintetis"
                : "Peringatan simulasi muncul"}
            </>
          ) : (
            <>
              <span className="pending-dot" />{" "}
              {type === "fusion"
                ? "Memadukan bukti lintas sumber"
                : "Menunggu ambang hujan"}
            </>
          )}
        </span>
        <strong>{fired ? `T+${first!.minute} menit` : "—"}</strong>
      </div>
      <p>
        {type === "fusion"
          ? scenario === "false-alarm"
            ? "Muka air rendah dan tutupan hulu baik menahan peningkatan risiko."
            : "Kondisi hulu dan respons sungai menambah konteks sebelum hujan mencapai ambang pembanding."
          : "Ini model pembanding buatan untuk demo, bukan pengukuran kinerja sistem instansi saat ini."}
      </p>
    </div>
  );
}
export default function Laboratory({ go }: { go: (p: Page) => void }) {
  const { state, selectBasin, log, addAlert } = useDemo();
  const basin = BASINS.find((b) => b.id === state.selectedBasin)!;
  const [scenario, setScenario] = useState<Scenario>("extreme");
  const [tick, setTick] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [custom, setCustom] = useState<Inputs | null>(null);
  const inputs = custom ?? scenarioInputs(scenario, tick);
  const risk = fuse(basin, inputs, state.reports);
  const curve = useMemo(() => replay(basin, scenario), [basin, scenario]);
  const firstFusion = curve.find((r) => r.fusionAlert),
    firstSeparate = curve.find((r) => r.separateAlert);
  const gain =
    firstFusion && firstSeparate
      ? firstSeparate.minute - firstFusion.minute
      : 0;
  useEffect(() => {
    if (!playing) return;
    const timeout = setTimeout(() => {
      if (tick >= LAST_STEP) {
        setPlaying(false);
        return;
      }
      setTick(tick + 1);
    }, 1600);
    return () => clearTimeout(timeout);
  }, [playing, tick]);
  function preset(s: Scenario) {
    setScenario(s);
    setTick(0);
    setCustom(null);
    setPlaying(false);
    log("Pilih replay", SCENARIO_NAMES[s]);
  }
  function play() {
    if (tick >= LAST_STEP) setTick(0);
    setCustom(null);
    setPlaying(!playing);
    log(
      "Replay fusi",
      `${SCENARIO_NAMES[scenario]} ${playing ? "dijeda" : "dimulai"}`,
    );
  }
  const controls: [keyof Inputs, string, number, string][] = [
    ["rain", "Curah hujan 24 jam", 250, "mm"],
    ["forestLoss", "Degradasi tutupan hulu", 80, "%"],
    ["slope", "Kemiringan lereng", 60, "°"],
    ["water", "Tinggi muka air", 600, "cm"],
  ];
  return (
    <>
      <PageHead
        eyebrow="ADEGAN UTAMA DEMONSTRASI"
        title="Ketika data saling berbicara."
        description="Putar satu skenario. Bandingkan keputusan dari data yang terpisah dan data yang dipadukan."
      >
        <select
          className="select-control"
          aria-label="DAS laboratorium"
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
      <div className="scenario-grid">
        {(["normal", "extreme", "false-alarm"] as Scenario[]).map((s, i) => (
          <button
            key={s}
            className={`scenario-card ${s === scenario ? "active" : ""}`}
            onClick={() => preset(s)}
          >
            <span className="scenario-number">0{i + 1}</span>
            <div>
              <strong>{SCENARIO_NAMES[s]}</strong>
              <small>
                {s === "normal"
                  ? "Hujan ringan, hulu terjaga"
                  : s === "extreme"
                    ? "Terinspirasi konteks Sumatra, Nov 2025"
                    : "Hujan tinggi, respons sungai tetap rendah"}
              </small>
            </div>
            <span className="radio-dot" />
          </button>
        ))}
      </div>
      <Note tone="warning">
        Seluruh timeline, probabilitas, dan selisih waktu adalah{" "}
        <strong>simulasi ilustratif</strong>, bukan rekonstruksi kejadian atau
        hasil validasi model. Skenario ekstrem tidak menggunakan data kejadian
        Sumatra yang sebenarnya.
      </Note>
      <div className="replay-controls">
        <button className="btn primary" onClick={play}>
          {playing ? <Pause size={17} /> : <Play size={17} />}{" "}
          {playing ? "Jeda replay" : "Putar replay"}
        </button>
        <button
          className="icon-btn"
          aria-label="Reset replay"
          onClick={() => {
            setTick(0);
            setPlaying(false);
            setCustom(null);
          }}
        >
          <RotateCcw size={18} />
        </button>
        <div className="replay-slider">
          <div>
            <span>Titik waktu simulasi</span>
            <strong>T+{tick * 30} menit</strong>
          </div>
          <input
            type="range"
            min="0"
            max={LAST_STEP}
            value={tick}
            aria-label="Titik waktu replay"
            onChange={(e) => {
              setTick(Number(e.target.value));
              setPlaying(false);
              setCustom(null);
            }}
          />
        </div>
        <div className="replay-clock">
          <span>WAKTU SKENARIO</span>
          <strong>
            {String(8 + Math.floor(tick / 2)).padStart(2, "0")}.
            {tick % 2 ? "30" : "00"} <small>WIB</small>
          </strong>
        </div>
      </div>
      <div className="comparison-grid">
        <Timeline
          title="Pembanding terpisah (hipotetis)"
          type="separate"
          scenario={scenario}
          tick={tick}
          basinId={basin.id}
        />
        <Timeline
          title="SIMPUL BENCANA"
          type="fusion"
          scenario={scenario}
          tick={tick}
          basinId={basin.id}
        />
      </div>
      <div className="comparison-insight">
        <div>
          <Waves size={20} />
          <span>
            {scenario === "extreme" ? (
              <>
                Penanda kejadian sintetis: <strong>T+240 menit</strong>.{" "}
                {firstFusion
                  ? `Sinyal Siaga pertama T+${firstFusion.minute} menit.`
                  : ""}
              </>
            ) : scenario === "false-alarm" ? (
              "Tidak ada kejadian banjir sintetis dalam skenario ini."
            ) : (
              "Kondisi sintetis tetap normal selama pengamatan."
            )}
          </span>
        </div>
        <strong>
          {scenario === "extreme" && gain > 0
            ? `${gain} menit lebih awal · simulasi`
            : scenario === "false-alarm"
              ? "Konteks mengurangi alarm palsu"
              : "Tidak ada eskalasi"}
        </strong>
      </div>
      <div className="lab-grid">
        <Panel
          title="Parameter masuk"
          eyebrow="UBAH & AMATI"
          action={<SlidersHorizontal size={18} />}
        >
          <div className="slider-controls">
            {controls.map(([key, label, max, unit]) => (
              <label key={key}>
                <div>
                  <span>{label}</span>
                  <strong>
                    {inputs[key]} <small>{unit}</small>
                  </strong>
                </div>
                <input
                  aria-label={label}
                  type="range"
                  min="0"
                  max={max}
                  value={inputs[key]}
                  onChange={(e) => {
                    setCustom({ ...inputs, [key]: Number(e.target.value) });
                    setPlaying(false);
                  }}
                />
                <small>
                  {key === "rain"
                    ? "BMKG · deret waktu"
                    : key === "forestLoss"
                      ? "Kementerian Kehutanan · spasial"
                      : key === "slope"
                        ? "BIG · referensi elevasi"
                        : "KemenPU · pos hidrologi"}
                </small>
              </label>
            ))}
          </div>
          {custom && (
            <button className="text-btn" onClick={() => setCustom(null)}>
              Kembali ke parameter replay <RotateCcw size={13} />
            </button>
          )}
          <div className="ownership-note">
            Parameter sintetis di-query; sumber asli tetap dikelola instansi.
          </div>
        </Panel>
        <Panel
          title="Mengapa risiko berubah?"
          eyebrow="HASIL FUSI YANG DAPAT DIJELASKAN"
          action={<Badge level={risk.level} />}
        >
          <div className="risk-result">
            <div className={`risk-orb level-${risk.level.toLowerCase()}`}>
              <strong>{pct(risk.probability)}</strong>
              <span>simulasi</span>
            </div>
            <div>
              <h3>{risk.dominantHazard}</h3>
              <p>
                {risk.level === "Normal"
                  ? "Bukti gabungan belum melewati ambang kewaspadaan."
                  : `Kombinasi ${risk.factors
                      .slice()
                      .sort((a, b) => b.contribution - a.contribution)
                      .slice(0, 2)
                      .map((f) => f.label.toLowerCase())
                      .join(" dan ")} menaikkan skor.`}
              </p>
            </div>
          </div>
          <Factors risk={risk} />
          <div className="score-details">
            <span>
              Interaksi hujan × degradasi{" "}
              <strong>+{(risk.interaction * 100).toFixed(1)} poin</strong>
            </span>
            <span>
              Retensi hulu / muka air rendah{" "}
              <strong>−{(risk.mitigating * 100).toFixed(1)} poin</strong>
            </span>
            <span>
              Bukti warga tervalidasi{" "}
              <strong>+{risk.reportBoost.toFixed(2)} log-odds</strong>
            </span>
          </div>
          <div className="bayes-row">
            <span>
              Prior struktural <strong>{pct(risk.prior)}</strong>
            </span>
            <ChevronRight size={18} />
            <span>
              Rasio bukti <strong>{risk.likelihoodRatio.toFixed(2)}×</strong>
            </span>
            <ChevronRight size={18} />
            <span>
              Posterior simulasi <strong>{pct(risk.probability)}</strong>
            </span>
          </div>
        </Panel>
      </div>
      <Panel
        title="Perjalanan sinyal risiko"
        eyebrow="KURVA REPLAY · BUKAN HASIL MODEL TERLATIH"
        action={
          <div className="chart-key">
            <span>
              <i />
              Probabilitas risiko
            </span>
            <span>
              <i />
              Hujan / 250 mm
            </span>
          </div>
        }
      >
        <Curve scenario={scenario} tick={tick} basinId={basin.id} />
        {custom && (
          <p className="small-text">
            Kurva menunjukkan preset replay; slider manual hanya mengubah hasil
            fusi di atas.
          </p>
        )}
      </Panel>
      <div className="demo-bottom">
        <FlaskConical size={20} />
        <span>
          Analisis memberi rekomendasi.{" "}
          <strong>BPBD tetap memegang keputusan.</strong>
        </span>
        <button
          className="btn primary"
          disabled={risk.probability < 0.25}
          onClick={() => {
            if (canVerify(state.role)) {
              addAlert(inputs);
              go("bpbd");
            } else go("alerts");
          }}
        >
          Lanjut ke verifikasi BPBD <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}
