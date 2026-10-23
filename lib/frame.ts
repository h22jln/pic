export type Rect = { x: number; y: number; w: number; h: number };
export type PoseLayout = { photo: Rect; person: Rect };
export type FrameLayout = PoseLayout[];
export type Decoration = { id: string; key: string; rect: Rect };
export type Frame = {
  id: string; title: string; subtitle: string; accent: string; backgroundColor: string;
  published: boolean; showHero: boolean; poses: (string | null)[];
  decoration: string | null; decorations: Decoration[]; hero: string | null; selectionImage: string | null; layout: FrameLayout;
  createdAt: number; updatedAt: number;
};

export const defaultLayout: FrameLayout = Array.from({ length: 4 }, () => ({
  photo: { x: 0.04, y: 0.04, w: 0.92, h: 0.92 },
  person: { x: 0.52, y: 0.10, w: 0.43, h: 0.82 },
}));

export function slotRect(index: number, showHero: boolean): Rect {
  return showHero
    ? { x: 0.05, y: 0.045 + index * 0.23, w: 0.42, h: 0.21 }
    : { x: 0.05 + (index % 2) * 0.46, y: 0.06 + Math.floor(index / 2) * 0.46, w: 0.42, h: 0.42 };
}

export function isRect(value: unknown): value is Rect {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return ["x", "y", "w", "h"].every((key) => typeof v[key] === "number" && Number.isFinite(v[key]) && (v[key] as number) >= 0 && (v[key] as number) <= 1)
    && (v.x as number) + (v.w as number) <= 1.001 && (v.y as number) + (v.h as number) <= 1.001
    && (v.w as number) >= 0.05 && (v.h as number) >= 0.05;
}

export function isLayout(value: unknown): value is FrameLayout {
  return Array.isArray(value) && value.length === 4 && value.every((item) => item && isRect(item.photo) && isPoseRect(item.person));
}

export function isPoseRect(value: unknown): value is Rect {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return ["x", "y", "w", "h"].every((key) => typeof r[key] === "number" && Number.isFinite(r[key]))
    && (r.x as number) >= -1 && (r.x as number) <= 1
    && (r.y as number) >= -1 && (r.y as number) <= 1
    && (r.w as number) >= .05 && (r.w as number) <= 2
    && (r.h as number) >= .05 && (r.h as number) <= 2;
}

export function isDecorations(value: unknown): value is Decoration[] {
  return Array.isArray(value) && value.length <= 20 && value.every((item) => item && typeof item.id === "string" && /^[a-f0-9-]{36}$/.test(item.id) && typeof item.key === "string" && /^[a-f0-9-]{36}\.png$/.test(item.key) && isDecorationRect(item.rect));
}

export function isDecorationRect(value: unknown): value is Rect {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return ["x", "y", "w", "h"].every((key) => typeof r[key] === "number" && Number.isFinite(r[key]))
    && (r.x as number) >= -1 && (r.x as number) <= 1
    && (r.y as number) >= -1 && (r.y as number) <= 1
    && (r.w as number) >= .05 && (r.w as number) <= 1
    && (r.h as number) >= .05 && (r.h as number) <= 1;
}

export function assetUrl(key: string | null): string | null {
  return key ? `/api/assets/${encodeURIComponent(key)}` : null;
}
