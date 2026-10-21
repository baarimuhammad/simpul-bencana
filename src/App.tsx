import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  Building2,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  CloudRain,
  Database,
  ExternalLink,
  FlaskConical,
  GitBranch,
  Globe2,
  Home,
  Layers3,
  LogOut,
  Map,
  Menu,
  MessagesSquare,
  Moon,
  Network,
  Shield,
  ShieldCheck,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useDemo } from "./lib/store";
import { allowed } from "./lib/permissions";
import { ROLE_NAMES, type Page, type Role } from "./shared/types";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const RiskMap = lazy(() => import("./pages/RiskMap"));
const Laboratory = lazy(() => import("./pages/Laboratory"));
const Operations = lazy(() => import("./pages/Operations"));
const Ecosystem = lazy(() => import("./pages/Ecosystem"));
const nav = [
  {
    group: "PEMANTAUAN",
    items: [
      { id: "dashboard", name: "Dasbor nasional", icon: Home },
      { id: "map", name: "Peta risiko", icon: Map },
    ],
  },
  {
    group: "ANALISIS & RESPONS",
    items: [
      { id: "lab", name: "Laboratorium fusi", icon: FlaskConical, tag: "DEMO" },
      { id: "bpbd", name: "Posko BPBD", icon: Building2 },
      { id: "alerts", name: "Peringatan & diseminasi", icon: Bell },
      { id: "reports", name: "Laporan warga", icon: MessagesSquare },
    ],
  },
  {
    group: "EKOSISTEM DATA",
    items: [
      { id: "interop", name: "Interoperabilitas", icon: Network },
      { id: "evaluation", name: "Evaluasi bayangan", icon: Activity },
      { id: "architecture", name: "Arsitektur model", icon: GitBranch },
      { id: "audit", name: "Audit & hak akses", icon: ClipboardList },
      { id: "about", name: "Tentang SIMPUL", icon: CircleHelp },
    ],
  },
];
const currentPage = (): Page => {
  const hash = location.hash.slice(1);
  return nav.flatMap((g) => g.items).some((i) => i.id === hash)
    ? (hash as Page)
    : "dashboard";
};
const pageName = (page: Page) =>
  nav.flatMap((g) => g.items).find((x) => x.id === page)?.name ??
  "Dasbor nasional";
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {}
  render() {
    return this.state.failed ? (
      <div className="panel error-screen">
        <h1>Tampilan perlu dimuat ulang</h1>
        <p>Data sesi simulasi tetap tersimpan di peramban.</p>
        <button className="btn primary" onClick={() => location.reload()}>
          Muat ulang
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function Login() {
  const { setRole } = useDemo();
  const [chosen, setChosen] = useState<Role>("admin");
  return (
    <div className="login">
      <div className="login-story">
        <div className="login-brand">
          <Layers3 size={34} />
          <span>
            SIMPUL<span className="brand-thin"> BENCANA</span>
          </span>
        </div>
        <span className="overline">RISET KIM UNAIR 2026 · GFT</span>
        <h1>
          Data terhubung.
          <br />
          Keputusan terarah.
          <br />
          <em>Masyarakat tangguh.</em>
        </h1>
        <p>
          Satu lapisan interoperabilitas untuk membaca risiko banjir dan
          longsor, bersama lintas instansi.
        </p>
        <div className="login-orbit">
          <span>
            <CloudRain />
            Atmosfer
          </span>
          <span>
            <Database />
            Lahan & topografi
          </span>
          <span>
            <ShieldCheck />
            Kesiapsiagaan
          </span>
          <div>
            <Network size={44} />
            <strong>SIMPUL BENCANA</strong>
            <small>Fusi data, bukan sensor baru</small>
          </div>
        </div>
        <div className="login-foot">
          Prototipe akademik · Bukan produk resmi pemerintah
        </div>
      </div>
      <div className="login-form">
        <div className="login-form-inner">
          <span className="eyebrow">PUSAT KENDALI RISIKO HIDROMETEOROLOGI</span>
          <h2>Selamat datang.</h2>
          <p>
            Jelajahi bagaimana data menjadi keputusan.
            <br />
            Pilih peran untuk memulai simulasi.
          </p>
          <div className="role-options">
            {(Object.entries(ROLE_NAMES) as [Role, string][]).map(
              ([role, name]) => (
                <label className={chosen === role ? "chosen" : ""} key={role}>
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={chosen === role}
                    onChange={() => setChosen(role)}
                  />
                  <div>
                    <strong>{name}</strong>
                    <small>
                      {role === "admin"
                        ? "Pemantauan lintas wilayah & tata kelola"
                        : role === "bpbd"
                          ? "Verifikasi peringatan & respons daerah"
                          : role === "public"
                            ? "Informasi risiko & laporan kondisi lapangan"
                            : "Katalog data & analisis lintas parameter"}
                    </small>
                  </div>
                  {chosen === role && <ShieldCheck size={18} />}
                </label>
              ),
            )}
          </div>
          <button
            className="btn primary login-enter"
            onClick={() => setRole(chosen)}
          >
            Masuk pusat kendali <ArrowRight size={17} />
          </button>
          <p className="small-text">
            Autentikasi disimulasikan, tanpa kata sandi. Seluruh data
            operasional adalah dummy. Jangan masukkan data pribadi.
          </p>
        </div>
      </div>
    </div>
  );
}
export default function App() {
  const { state, setRole, toast, connection, setMode, notify } = useDemo();
  const [page, setPage] = useState<Page>(currentPage);
  const [mobile, setMobile] = useState(false);
  const [dark, setDark] = useState(false);
  const [notifications, setNotifications] = useState(false);
  useEffect(() => {
    const onHash = () => setPage(currentPage());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => {
    document.title = `${pageName(page)} | SIMPUL BENCANA`;
  }, [page]);
  function go(next: Page) {
    setPage(next);
    location.hash = next;
    setMobile(false);
    window.scrollTo(0, 0);
  }
  const verified = state.alerts.filter((a) => a.status !== "sent").length;
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Lewati ke konten utama
      </a>
      <div className="prototype-banner">
        <Shield size={12} />
        <strong>PROTOTIPE - DATA SIMULASI</strong>
        <span>Untuk demonstrasi riset · Bukan peringatan resmi pemerintah</span>
      </div>
      {!state.role ? (
        <Login />
      ) : (
        <div className="app-layout">
          <div
            className={`sidebar-scrim ${mobile ? "open" : ""}`}
            onClick={() => setMobile(false)}
          />
          <aside
            className={`sidebar ${mobile ? "open" : ""}`}
            aria-label="Navigasi utama"
          >
            <a
              className="brand"
              href="#dashboard"
              onClick={() => go("dashboard")}
            >
              <div className="brand-mark">
                <Layers3 size={27} />
              </div>
              <div>
                <strong>
                  SIMPUL<span> BENCANA</span>
                </strong>
                <small>Sistem Interoperabilitas Bencana</small>
              </div>
            </a>
            <button
              className="close-nav icon-btn"
              onClick={() => setMobile(false)}
              aria-label="Tutup navigasi"
            >
              <X />
            </button>
            <div className="workspace-label">
              <span className="red-white" /> RUANG KOMANDO <span>DEMO</span>
            </div>
            <nav>
              {nav.map((group) => (
                <div className="nav-group" key={group.group}>
                  <span className="nav-label">{group.group}</span>
                  {group.items
                    .filter((item) => allowed(state.role, item.id as Page))
                    .map((item) => (
                      <button
                        key={item.id}
                        className={`nav-item ${page === item.id ? "active" : ""}`}
                        onClick={() => go(item.id as Page)}
                      >
                        <item.icon size={18} />
                        <span>{item.name}</span>
                        {"tag" in item && (
                          <small className="nav-tag">{item.tag}</small>
                        )}
                        {item.id === "alerts" && (
                          <small className="nav-count">{verified}</small>
                        )}
                      </button>
                    ))}
                </div>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="research-card">
                <BookOpen size={17} />
                <div>
                  <strong>Dari gagasan, untuk ketangguhan.</strong>
                  <small>Proposal KIM UNAIR 2026</small>
                </div>
              </div>
              <button className="role-switch" onClick={() => setRole(null)}>
                <div className="avatar">
                  {state.role === "admin"
                    ? "AN"
                    : state.role === "bpbd"
                      ? "BP"
                      : "OP"}
                </div>
                <div>
                  <strong>{ROLE_NAMES[state.role]}</strong>
                  <small>Ganti peran demo</small>
                </div>
                <LogOut size={15} />
              </button>
            </div>
          </aside>
          <div className="main-shell">
            <div className="institution-strip">
              <span>
                <span className="red-white" /> INISIATIF RISET KEBENCANAAN
                INDONESIA
              </span>
              <span>
                Universitas Airlangga <ExternalLink size={10} />
              </span>
            </div>
            <header className="topbar">
              <div className="topbar-left">
                <button
                  className="icon-btn hamburger"
                  onClick={() => setMobile(true)}
                  aria-label="Buka navigasi"
                >
                  <Menu />
                </button>
                <div className="breadcrumb">
                  <Globe2 size={15} />
                  <span>Pusat Kendali</span>
                  <ChevronRight size={13} />
                  <strong>{pageName(page)}</strong>
                </div>
              </div>
              <div className="topbar-actions">
                <span
                  className={`connection ${connection === "offline" ? "offline" : ""}`}
                >
                  <i />
                  {connection === "loading"
                    ? "Menghubungkan…"
                    : connection === "ready"
                      ? "API simulasi terhubung"
                      : "Fallback lokal aktif"}
                </span>
                <button
                  className="icon-btn"
                  onClick={() => setDark(!dark)}
                  aria-label={
                    dark ? "Aktifkan mode terang" : "Aktifkan mode gelap"
                  }
                >
                  {dark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <div className="notification-wrap">
                  <button
                    className="icon-btn notification-btn"
                    onClick={() => setNotifications(!notifications)}
                    aria-label="Lihat notifikasi"
                  >
                    <Bell size={18} />
                    <i />
                  </button>
                  {notifications && (
                    <div className="notification-panel">
                      <strong>Notifikasi simulasi</strong>
                      <p>{verified} peringatan menunggu tindak lanjut.</p>
                      <p>1 laporan warga perlu divalidasi BPBD.</p>
                      <button
                        className="text-btn"
                        onClick={() => {
                          go("alerts");
                          setNotifications(false);
                        }}
                      >
                        Buka pusat peringatan <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="header-avatar" title={ROLE_NAMES[state.role]}>
                  <Users size={18} />
                </div>
              </div>
            </header>
            <main id="main" className="content" tabIndex={-1}>
              <Boundary>
                <Suspense
                  fallback={
                    <div className="loading-state">
                      <div className="loading-line" />
                      <p>Menyiapkan ruang kendali simulasi…</p>
                    </div>
                  }
                >
                  {!allowed(state.role, page) ? (
                    <div className="panel">
                      <h1>Akses peran dibatasi</h1>
                      <p>Pilih halaman yang tersedia untuk peran demo Anda.</p>
                      <button
                        className="btn primary"
                        onClick={() => go("dashboard")}
                      >
                        Kembali ke dasbor
                      </button>
                    </div>
                  ) : page === "dashboard" ? (
                    <Dashboard go={go} />
                  ) : page === "map" ? (
                    <RiskMap />
                  ) : page === "lab" ? (
                    <Laboratory go={go} />
                  ) : ["bpbd", "alerts", "reports"].includes(page) ? (
                    <Operations page={page} go={go} />
                  ) : (
                    <Ecosystem page={page} />
                  )}
                </Suspense>
              </Boundary>
            </main>
            <footer>
              <span>
                <Layers3 size={13} /> SIMPUL BENCANA{" "}
                <span className="footer-divider">/</span> Prototipe riset KIM
                UNAIR 2026
              </span>
              <button
                className="footer-mode"
                onClick={() =>
                  setMode(state.mode === "shadow" ? "limited" : "shadow")
                }
              >
                <i />
                {state.mode === "shadow"
                  ? "Mode bayangan"
                  : "Operasional terbatas"}{" "}
                · simulasi
              </button>
              <span>Bukan produk resmi pemerintah</span>
            </footer>
          </div>
        </div>
      )}
      {toast && (
        <div role="status" className="toast">
          <ShieldCheck size={18} />
          {toast}
          <button
            className="icon-btn"
            onClick={() => notify("")}
            aria-label="Tutup notifikasi"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </>
  );
}
