import { NODE_MAP } from "./ecosystem";
import { dependents, getDependents } from "./analyze";
import type { AttackType, EdgeKind, SimPath, SimResult } from "./types";

const ATTACK_BASE: Record<AttackType, number> = {
  "malicious-release": 0.92,
  "account-takeover": 0.88,
  protestware: 0.7,
  "build-backdoor": 0.8,
  typosquat: 0.35,
};

const KIND_W: Record<EdgeKind, number> = {
  runtime: 1,
  optional: 0.4,
  dev: 0.22,
};

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashId(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function simulateCompromise(sourceId: string, attack: AttackType, samples = 360): SimResult {
  const base = ATTACK_BASE[attack];
  const src = NODE_MAP[sourceId];
  if (src?.kind === "library" && src.maintainers === 1 && attack !== "typosquat") {
    /* single-maintainer packages transmit slightly more readily */
  }
  const reachedAcc: Record<string, number> = {};
  const rand = mulberry32(hashId(sourceId) ^ (attack.length * 997));

  for (let s = 0; s < samples; s++) {
    const infected = new Set<string>([sourceId]);
    const q = [sourceId];
    while (q.length) {
      const v = q.shift()!;
      for (const e of dependents[v] ?? []) {
        if (infected.has(e.from)) continue;
        const depthBoost = 1;
        const p = base * KIND_W[e.kind] * depthBoost * (NODE_MAP[e.from].kind === "app" ? 0.9 : 0.95);
        if (rand() < p) {
          infected.add(e.from);
          q.push(e.from);
        }
      }
    }
    for (const id of infected) reachedAcc[id] = (reachedAcc[id] ?? 0) + 1;
  }

  const reached: Record<string, number> = {};
  for (const [id, c] of Object.entries(reachedAcc)) reached[id] = c / samples;

  let expectedApps = 0;
  let expectedPackages = 0;
  let criticalAppsHit = 0;
  for (const [id, p] of Object.entries(reached)) {
    if (id === sourceId) continue;
    const n = NODE_MAP[id];
    if (n.kind === "app") {
      expectedApps += p;
      if (n.domain === "finance" || n.domain === "health" || n.domain === "gov") criticalAppsHit += p;
    } else expectedPackages += p;
  }

  const paths = enumeratePaths(sourceId, reached).slice(0, 8);

  return {
    sourceId,
    attack,
    reached,
    expectedApps: round1(expectedApps),
    expectedPackages: round1(expectedPackages),
    criticalAppsHit: round1(criticalAppsHit),
    paths,
    samples,
  };
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function enumeratePaths(sourceId: string, reached: Record<string, number>): SimPath[] {
  const apps = Object.keys(reached).filter((id) => NODE_MAP[id]?.kind === "app" && reached[id] > 0.05);
  const found: SimPath[] = [];

  for (const app of apps) {
    const path = shortest(sourceId, app);
    if (!path) continue;
    let p = reached[sourceId] ?? 1;
    const kinds: EdgeKind[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const edge = getDependents(path[i]).find((e) => e.from === path[i + 1]);
      if (edge) {
        kinds.push(edge.kind);
        p *= KIND_W[edge.kind] * 0.92;
      }
    }
    found.push({ nodes: path, probability: Math.min(1, p * (reached[app] ?? 0.2) * 1.4), kinds });
  }
  return found.sort((a, b) => b.probability - a.probability);
}

function shortest(from: string, to: string): string[] | null {
  const q = [from];
  const prev: Record<string, string | null> = { [from]: null };
  while (q.length) {
    const v = q.shift()!;
    if (v === to) break;
    for (const e of dependents[v] ?? []) {
      if (e.from in prev) continue;
      prev[e.from] = v;
      q.push(e.from);
    }
  }
  if (!(to in prev)) return null;
  const path = [to];
  let cur: string | null = to;
  while (cur && cur !== from) {
    cur = prev[cur] ?? null;
    if (cur) path.push(cur);
  }
  path.reverse();
  return path;
}

export const ATTACKS: { id: AttackType; label: string; blurb: string }[] = [
  { id: "malicious-release", label: "Malicious release", blurb: "A trusted version ships extra code." },
  { id: "account-takeover", label: "Account takeover", blurb: "Publisher credentials are stolen." },
  { id: "protestware", label: "Protestware", blurb: "Integrity break without a classic CVE." },
  { id: "build-backdoor", label: "Build backdoor", blurb: "Payload hides in test/release scripts." },
  { id: "typosquat", label: "Typosquat", blurb: "Lookalike name; lower transmission." },
];
