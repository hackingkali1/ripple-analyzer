import { EDGES, NODES } from "./ecosystem";

export interface Pt {
  id: string;
  x: number;
  y: number;
  r: number;
}

export function layoutGraph(width: number, height: number): Record<string, Pt> {
  const padX = 72;
  const padY = 48;
  const byLayer: Record<number, typeof NODES> = { 0: [], 1: [], 2: [], 3: [] };
  for (const n of NODES) byLayer[n.layer].push(n);

  const pos: Record<string, Pt> = {};
  const maxLayer = 3;
  for (let layer = 0; layer <= maxLayer; layer++) {
    const list = byLayer[layer];
    const x = padX + (layer / maxLayer) * (width - padX * 2);
    list.forEach((n, i) => {
      const t = list.length === 1 ? 0.5 : i / (list.length - 1);
      const y = padY + t * (height - padY * 2);
      const r = n.kind === "app" ? 11 : n.kind === "framework" ? 9 : 6.5 + (n.layer === 0 ? 1 : 0);
      pos[n.id] = { id: n.id, x, y, r };
    });
  }

  for (let iter = 0; iter < 80; iter++) {
    const force: Record<string, number> = {};
    for (const n of NODES) force[n.id] = 0;
    for (let layer = 0; layer <= maxLayer; layer++) {
      const list = byLayer[layer];
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = pos[list[i].id];
          const b = pos[list[j].id];
          const dy = a.y - b.y;
          const dist = Math.max(12, Math.abs(dy));
          const minGap = 22;
          if (dist < minGap) {
            const push = ((minGap - dist) / 2) * Math.sign(dy || 1);
            force[a.id] += push;
            force[b.id] -= push;
          }
        }
      }
    }
    for (const e of EDGES) {
      const a = pos[e.from];
      const b = pos[e.to];
      if (!a || !b) continue;
      const dy = b.y - a.y;
      force[e.from] += dy * 0.015;
      force[e.to] -= dy * 0.015;
    }
    for (const n of NODES) {
      const p = pos[n.id];
      p.y = Math.min(height - padY, Math.max(padY, p.y + force[n.id] * 0.65));
    }
  }
  return pos;
}
