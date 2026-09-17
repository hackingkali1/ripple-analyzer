import { useEffect, useRef } from "react";
import { NODE_MAP, EDGES } from "@/lib/ripple/ecosystem";
import { getMetrics } from "@/lib/ripple/analyze";
import { layoutGraph } from "@/lib/ripple/layout";
import type { Pt } from "@/lib/ripple/layout";
import { useRipple } from "@/store/ripple-store";

const C = {
  bg: "#09090b",
  edge: "rgba(200,204,212,0.22)",
  edgeHot: "rgba(196,92,74,0.62)",
  edgePath: "rgba(196,161,90,0.85)",
  node: "#3a3a40",
  app: "#d7dadf",
  fw: "#9aa3ad",
  lib: "#8a8882",
  fg: "#eceae4",
  muted: "#9a9892",
  danger: "#c45c4a",
  warn: "#c4a15a",
};

export function GraphCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<Record<string, Pt>>({});
  const cam = useRef({ x: 0, y: 0, k: 1, drag: false, sx: 0, sy: 0, cx: 0, cy: 0 });
  const select = useRipple((s) => s.select);
  const hover = useRipple((s) => s.hover);
  const wave = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      posRef.current = layoutGraph(rect.width, rect.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const hit = (x: number, y: number) => {
      const { k, x: cx, y: cy } = cam.current;
      const wx = (x - cx) / k;
      const wy = (y - cy) / k;
      let best: string | null = null;
      let bestD = 16;
      for (const p of Object.values(posRef.current)) {
        const d = Math.hypot(p.x - wx, p.y - wy);
        if (d < bestD + p.r) {
          bestD = d;
          best = p.id;
        }
      }
      return best;
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (cam.current.drag) {
        cam.current.x = cam.current.cx + (x - cam.current.sx);
        cam.current.y = cam.current.cy + (y - cam.current.sy);
      } else {
        hover(hit(x, y));
      }
    };
    const onDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      cam.current.drag = true;
      cam.current.sx = e.clientX - rect.left;
      cam.current.sy = e.clientY - rect.top;
      cam.current.cx = cam.current.x;
      cam.current.cy = cam.current.y;
      canvas.setPointerCapture(e.pointerId);
    };
    const onUp = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const moved = Math.hypot(x - cam.current.sx, y - cam.current.sy);
      cam.current.drag = false;
      if (moved < 4) select(hit(x, y));
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const nk = Math.min(2.4, Math.max(0.55, cam.current.k * (e.deltaY < 0 ? 1.08 : 0.92)));
      const wx = (px - cam.current.x) / cam.current.k;
      const wy = (py - cam.current.y) / cam.current.k;
      cam.current.k = nk;
      cam.current.x = px - wx * nk;
      cam.current.y = py - wy * nk;
    };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const draw = () => {
      const rect = wrap.getBoundingClientRect();
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.save();
      ctx.translate(cam.current.x, cam.current.y);
      ctx.scale(cam.current.k, cam.current.k);

      const pos = posRef.current;
      const state = useRipple.getState();
      const pathEdges = new Set<string>();
      if (state.sim) {
        for (const p of state.sim.paths) {
          for (let i = 0; i < p.nodes.length - 1; i++) pathEdges.add(`${p.nodes[i]}>${p.nodes[i + 1]}`);
        }
      }

      for (const e of EDGES) {
        const a = pos[e.from];
        const b = pos[e.to];
        if (!a || !b) continue;
        const hot =
          state.sim &&
          ((state.sim.reached[e.from] ?? 0) > 0.15 || e.to === state.sim.sourceId);
        const onPath = pathEdges.has(`${e.to}>${e.from}`) || pathEdges.has(`${e.from}>${e.to}`);
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(a.x, a.y);
        ctx.strokeStyle = onPath ? C.edgePath : hot ? C.edgeHot : C.edge;
        ctx.lineWidth = onPath ? 2 : hot ? 1.4 : e.kind === "dev" ? 0.7 : 1.15;
        ctx.stroke();
      }

      wave.current += 0.018;
      for (const n of Object.values(pos)) {
        const node = NODE_MAP[n.id];
        const m = getMetrics(n.id);
        const r = n.r + (node.kind === "library" ? m.ripple * 6 : node.kind === "app" ? 2 : 1);
        const isSrc = state.sim?.sourceId === n.id;
        const pHit = state.sim?.reached[n.id] ?? 0;
        const sel = state.selectedId === n.id || state.hoverId === n.id;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        if (isSrc) ctx.fillStyle = C.danger;
        else if (pHit > 0.35) ctx.fillStyle = C.warn;
        else if (node.kind === "app") ctx.fillStyle = C.app;
        else if (node.kind === "framework") ctx.fillStyle = C.fw;
        else ctx.fillStyle = C.lib;
        ctx.fill();
        if (sel) {
          ctx.strokeStyle = C.fg;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
        if (isSrc) {
          ctx.beginPath();
          const wr = r + 8 + Math.sin(wave.current) * 3;
          ctx.arc(n.x, n.y, wr, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(196,92,74,0.55)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      ctx.font = "500 11px 'IBM Plex Sans', sans-serif";
      const labeled = new Set<string>();
      if (state.selectedId) labeled.add(state.selectedId);
      if (state.hoverId) labeled.add(state.hoverId);
      if (state.sim) {
        labeled.add(state.sim.sourceId);
        for (const p of state.sim.paths) {
          const last = p.nodes[p.nodes.length - 1];
          if (last) labeled.add(last);
        }
      }
      if (!state.sim) {
        for (const node of Object.values(NODE_MAP)) {
          if (node.kind === "app") labeled.add(node.id);
        }
      }
      for (const id of labeled) {
        const p = pos[id];
        const node = NODE_MAP[id];
        if (!p || !node) continue;
        ctx.fillStyle = C.fg;
        const label = node.name;
        const tw = ctx.measureText(label).width;
        const lx = node.layer === 3 ? p.x - tw - 12 : p.x + 12;
        ctx.fillText(label, lx, p.y + 4);
      }

      const layers = ["utilities", "libraries", "frameworks", "applications"];
      ctx.fillStyle = "rgba(154,152,146,0.85)";
      ctx.font = "10px 'IBM Plex Mono', monospace";
      for (let i = 0; i < 4; i++) {
        const sample = Object.values(pos).find((p) => NODE_MAP[p.id].layer === i);
        if (!sample) continue;
        ctx.fillText(layers[i], sample.x - 22, 16);
      }

      ctx.restore();

      ctx.fillStyle = C.muted;
      ctx.font = "11px 'IBM Plex Mono', monospace";
      ctx.fillText("leaf → framework → application", 16, rect.height - 16);
      ctx.fillText("drag pan · scroll zoom · click inspect", 16, rect.height - 32);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [hover, select]);

  return (
    <div ref={wrapRef} className="relative h-full min-h-[280px] w-full overflow-hidden rounded-lg bg-bg">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />
    </div>
  );
}
