import type { Page, Role } from "../shared/types";
export function canVerify(role: Role | null) {
  return role === "admin" || role === "bpbd";
}
export function allowed(role: Role | null, page: Page) {
  if (!role) return false;
  if (role === "admin") return true;
  if (role === "bpbd") return true;
  if (["bpbd", "audit"].includes(page)) return false;
  if (role === "public" && ["interop", "lab", "evaluation"].includes(page))
    return false;
  return true;
}
