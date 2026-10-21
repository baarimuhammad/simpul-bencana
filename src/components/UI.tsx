import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  ChevronRight,
  Info,
  Radio,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import type { FusionResult, Level } from "../shared/types";
export const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);
export const pct = (n: number) => `${Math.round(n * 100)}%`;
export function Badge({ level }: { level: Level }) {
  return (
    <span className={`badge level-${level.toLowerCase()}`}>
      {level === "Normal" ? <Check size={12} /> : <AlertTriangle size={12} />}{" "}
      {level}
    </span>
  );
}
export function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-head">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2>{title}</h2>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function PageHead({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <div className="eyebrow">
          <span className="mini-line" />
          {eyebrow}
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children && <div className="head-actions">{children}</div>}
    </div>
  );
}
export function Note({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "warning" | "success";
}) {
  return (
    <div className={`note ${tone}`}>
      <Info size={16} />
      <div>{children}</div>
    </div>
  );
}
export function Stat({
  label,
  value,
  unit,
  detail,
  icon,
  color = "teal",
}: {
  label: string;
  value: string | number;
  unit?: string;
  detail: string;
  icon: ReactNode;
  color?: string;
}) {
  return (
    <div className={`stat stat-${color}`}>
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-value">
        {value}
        <small>{unit}</small>
      </div>
      <div className="stat-detail">{detail}</div>
    </div>
  );
}
export function Factors({ risk }: { risk: FusionResult }) {
  return (
    <div className="factors">
      {[...risk.factors]
        .sort((a, b) => b.contribution - a.contribution)
        .map((f) => (
          <div className="factor" key={f.key}>
            <div>
              <span>{f.label}</span>
              <strong>
                {f.value} <small>{f.unit}</small>
              </strong>
            </div>
            <div className="track">
              <span
                style={{ width: `${f.contribution * 240}%` }}
                className={`source-${f.key}`}
              />
            </div>
            <div className="factor-meta">
              <span>
                {f.source} · bobot {pct(f.weight)}
              </span>
              <span>+{(f.contribution * 100).toFixed(1)} poin skor</span>
            </div>
          </div>
        ))}
    </div>
  );
}
export function Step({
  n,
  title,
  children,
  active = false,
}: {
  n: string;
  title: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <div className={`process-step ${active ? "active" : ""}`}>
      <span>{n}</span>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
      <ChevronRight size={16} />
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <ShieldCheck size={30} />
      <p>{children}</p>
    </div>
  );
}
export function Signal() {
  return (
    <span className="signal">
      <Radio size={12} /> Jaringan simulasi aktif
    </span>
  );
}
export function LinkArrow() {
  return <ArrowUpRight size={15} />;
}
