export type Level = "Normal" | "Waspada" | "Siaga" | "Awas";
export type Role = "admin" | "bmkg" | "forest" | "geo" | "bpbd" | "public";
export type Mode = "shadow" | "limited";
export type Scenario = "normal" | "extreme" | "false-alarm";
export type Page =
  | "dashboard"
  | "map"
  | "lab"
  | "bpbd"
  | "alerts"
  | "reports"
  | "interop"
  | "evaluation"
  | "architecture"
  | "about"
  | "audit";
export interface Inputs {
  rain: number;
  forestLoss: number;
  slope: number;
  water: number;
}
export interface District {
  name: string;
  population: number;
  vulnerable: number;
  readiness: number;
}
export interface Shelter {
  name: string;
  capacity: number;
  occupied: number;
  distance: string;
}
export interface Basin {
  id: string;
  name: string;
  province: string;
  lon: number;
  lat: number;
  prior: number;
  inputs: Inputs;
  population: number;
  facilities: number;
  readiness: number;
  districts: District[];
  shelters: Shelter[];
  profile: string;
}
export interface Factor {
  key: string;
  label: string;
  source: string;
  value: number;
  weight: number;
  contribution: number;
  unit: string;
  description: string;
}
export interface FusionResult {
  probability: number;
  prior: number;
  level: Level;
  score: number;
  likelihoodRatio: number;
  factors: Factor[];
  mitigating: number;
  interaction: number;
  reportBoost: number;
  dominantHazard: string;
  simulated: true;
}
export type ReportKind = "Hujan lebat" | "Muka air naik" | "Tanah bergerak";
export interface CitizenReport {
  id: string;
  basinId: string;
  district: string;
  kind: ReportKind;
  severity: number;
  note: string;
  status: "pending" | "validated" | "rejected";
  created: string;
}
export interface Channel {
  id: string;
  name: string;
  status: "pending" | "sent" | "retry";
  detail: string;
}
export interface Alert {
  id: string;
  basinId: string;
  level: Level;
  probability: number;
  status: "draft" | "verified" | "sent";
  created: string;
  verifiedBy?: Role;
  channels: Channel[];
  message: string;
}
export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: Role;
  action: string;
  detail: string;
}
export interface DemoState {
  version: 1;
  role: Role | null;
  mode: Mode;
  reports: CitizenReport[];
  alerts: Alert[];
  audit: AuditEvent[];
  selectedBasin: string;
}
export interface Source {
  id: string;
  short: string;
  name: string;
  kind: string;
  color: string;
  format: string;
  resolution: string;
  frequency: string;
  quality: number;
  metadata: number;
  updated: string;
  owner: string;
}
export const LEVELS: Level[] = ["Normal", "Waspada", "Siaga", "Awas"];
export const ROLE_NAMES: Record<Role, string> = {
  admin: "Admin Nasional BNPB",
  bmkg: "Operator BMKG",
  forest: "Operator Kemenhut/KLHK",
  geo: "Operator KemenPU/BIG",
  bpbd: "BPBD Daerah",
  public: "Publik",
};
export const SCENARIO_NAMES: Record<Scenario, string> = {
  normal: "Hari Normal",
  extreme: "Hujan Ekstrem + Hulu Gundul",
  "false-alarm": "Alarm Palsu",
};
export const CHANNELS = [
  "SMS",
  "Cell broadcast",
  "Aplikasi",
  "Sirene",
  "Radio komunitas",
  "Pengeras suara desa",
  "Media sosial",
];
