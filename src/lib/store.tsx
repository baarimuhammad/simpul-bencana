import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { BASINS, INITIAL_REPORTS, SIM_TIME } from "../shared/seed";
import { fuse } from "../shared/fusion";
import { makeAlert } from "../shared/alerts";
import { handleApi } from "../../server/api";
import type {
  Alert,
  CitizenReport,
  DemoState,
  Inputs,
  Mode,
  Role,
} from "../shared/types";
const KEY = "simpul-demo-v1";
const initial = (): DemoState => ({
  version: 1,
  role: null,
  mode: "shadow",
  reports: INITIAL_REPORTS,
  alerts: [makeAlert(BASINS[0], "Awas", fuse(BASINS[0]).probability)],
  audit: [
    {
      id: "A-0",
      timestamp: SIM_TIME,
      actor: "admin",
      action: "Seed simulasi",
      detail: "Dataset deterministik 2026; tidak ada data operasional nyata.",
    },
  ],
  selectedBasin: "tamiang",
});
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (
      s?.version === 1 &&
      Array.isArray(s.reports) &&
      Array.isArray(s.alerts) &&
      Array.isArray(s.audit) &&
      BASINS.some((b) => b.id === s.selectedBasin)
    )
      return s as DemoState;
  } catch {
    /* Reset corrupt or unavailable local state. */
  }
  return initial();
}
interface Context {
  state: DemoState;
  setRole: (role: Role | null) => void;
  setMode: (mode: Mode) => void;
  selectBasin: (id: string) => void;
  connection: "loading" | "ready" | "offline";
  toast: string;
  notify: (message: string) => void;
  log: (action: string, detail: string) => void;
  api: <T>(path: string, body?: unknown) => Promise<T>;
  addReport: (r: CitizenReport) => void;
  updateReport: (r: CitizenReport) => void;
  updateAlert: (a: Alert) => void;
  addAlert: (inputs?: Inputs) => void;
  reset: () => void;
}
const DemoContext = createContext<Context | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(loadState);
  const [connection, setConnection] =
    useState<Context["connection"]>("loading");
  const [toast, setToast] = useState("");
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* Demo remains usable without persistence. */
    }
  }, [state]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    fetch("/api/health", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setConnection(d.simulated ? "ready" : "offline"))
      .catch(() => setConnection("offline"));
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  function log(action: string, detail: string) {
    setState((s) => {
      const next =
        Math.max(0, ...s.audit.map((a) => Number(a.id.slice(2)) || 0)) + 1;
      return {
        ...s,
        audit: [
          {
            id: `A-${next}`,
            timestamp: new Date(
              Date.parse(SIM_TIME) + next * 60000,
            ).toISOString(),
            actor: s.role ?? "public",
            action,
            detail,
          },
          ...s.audit,
        ].slice(0, 120),
      };
    });
  }
  async function api<T>(path: string, body?: unknown): Promise<T> {
    const request = new Request(`${location.origin}/api${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        "content-type": "application/json",
        "x-demo-role": state.role ?? "public",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let response: Response;
    let usedFallback = false;
    try {
      response = await fetch(request.clone(), {
        signal: AbortSignal.timeout(5000),
      });
      if (
        response.status >= 500 ||
        !(response.headers.get("content-type") ?? "").includes(
          "application/json",
        )
      )
        throw new Error("offline");
      setConnection("ready");
    } catch {
      usedFallback = true;
      response = await handleApi(request);
      setConnection("offline");
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Permintaan gagal.");
    log(
      `API ${body ? "POST" : "GET"} /api${path}`,
      usedFallback
        ? "Fallback lokal; respons simulasi"
        : "Respons API simulasi",
    );
    return data as T;
  }
  const value: Context = {
    state,
    connection,
    toast,
    notify: setToast,
    api,
    log,
    setRole(role) {
      setState((s) => ({ ...s, role }));
      if (role) log("Pilih peran demo", role);
    },
    setMode(mode) {
      if (!["admin", "bpbd"].includes(state.role ?? "")) {
        setToast("Perubahan mode memerlukan BPBD atau Admin Nasional.");
        return;
      }
      setState((s) => ({ ...s, mode }));
      log(
        "Ubah mode",
        mode === "shadow"
          ? "Bayangan: diseminasi diblokir"
          : "Operasional terbatas: seluruh kanal tetap simulasi",
      );
    },
    selectBasin(id) {
      setState((s) => ({ ...s, selectedBasin: id }));
    },
    addReport(r) {
      setState((s) => ({ ...s, reports: [r, ...s.reports] }));
      log(
        "Laporan warga masuk",
        `${r.id}: menunggu validasi; belum memengaruhi risiko`,
      );
    },
    updateReport(r) {
      setState((s) => ({
        ...s,
        reports: s.reports.map((old) => (old.id === r.id ? r : old)),
      }));
      log("Validasi laporan", `${r.id}: ${r.status}`);
    },
    updateAlert(a) {
      setState((s) => ({
        ...s,
        alerts: s.alerts.map((old) => (old.id === a.id ? a : old)),
      }));
      log("Status peringatan", `${a.id}: ${a.status}; tidak ada pesan aktual`);
    },
    addAlert(inputs) {
      if (!["admin", "bpbd"].includes(state.role ?? "")) {
        setToast("Draf peringatan memerlukan BPBD atau Admin Nasional.");
        return;
      }
      const basin = BASINS.find((b) => b.id === state.selectedBasin)!;
      const risk = fuse(basin, inputs ?? basin.inputs, state.reports);
      setState((s) => ({
        ...s,
        alerts: [
          makeAlert(basin, risk.level, risk.probability, s.alerts.length + 1),
          ...s.alerts,
        ],
      }));
      log("Draf peringatan", `DAS ${basin.name}; perlu verifikasi manusia`);
      setToast(
        "Draf dibuat. Verifikasi BPBD diperlukan sebelum latihan diseminasi.",
      );
    },
    reset() {
      setState(initial());
      setToast("Sesi direset ke seed 2026.");
    },
  };
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("DemoProvider diperlukan");
  return ctx;
}
