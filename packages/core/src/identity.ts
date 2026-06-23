import { IdentityResolver, GUEST_NAME } from "./types";

export function resolveAuthor(resolver?: IdentityResolver): { name: string; id?: string } {
  if (!resolver) return { name: GUEST_NAME };
  try {
    const r = resolver();
    const name = (r?.name ?? "").trim();
    if (!name) return { name: GUEST_NAME };
    return r.id !== undefined ? { name, id: r.id } : { name };
  } catch {
    return { name: GUEST_NAME };
  }
}
