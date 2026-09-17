import { EDGES, NODE_MAP, NODES } from "./ecosystem";
import type { Metrics, RankedPackage, RippleEdge, RippleNode, Severity } from "./types";

export const APPS = NODES.filter((n) => n.kind === "app");
export const LIBS = NODES.filter((n) => n.kind !== "app");

const dependents: Record<string, RippleEdge[]> = {};
const dependencies: Record<string, RippleEdge[]> = {};
for (const n of NODES) {
  dependents[n.id] = [];
  dependencies[n.id] = [];
}
for (const e of EDGES) {
  dependencies[e.from].push(e);
  dependents[e.to].push(e);
}

export function getDependents(id: string) {
  return dependents[id] ?? [];
}
export function getDependencies(id: string) {
  return dependencies[id] ?? [];
}

function severityWeight(s: Severity) {
  return s === "critical" ? 1 : s === "high" ? 0.7 : s === "medium" ? 0.4 : 0.2;
}

function intrinsicOf(n: RippleNode) {
  const cve = n.cves.reduce((a, c) => Math.max(a, severityWeight(c.severity)), 0);
  const stale = Math.min(1, n.lastPublishDays / 900);
  return Math.min(1, cve * 0.75 + stale * 0.25);
}

function pageRank(): Record<string, number> {
  const ids = NODES.map((n) => n.id);
  const n = ids.length;
  const d = 0.85;
  const pr: Record<string, number> = {};
  for (const id of ids) pr[id] = 1 / n;
  for (let i = 0; i < 40; i++) {
    const next: Record<string, number> = {};
    for (const id of ids) next[id] = (1 - d) / n;
    for (const id of ids) {
      const outs = dependencies[id];
      if (!outs.length) {
        const extra = (d * pr[id]) / n;
        for (const j of ids) next[j] += extra;
      } else {
        const share = (d * pr[id]) / outs.length;
        for (const e of outs) next[e.to] += share;
      }
    }
    Object.assign(pr, next);
  }
  return pr;
}

function betweenness(): Record<string, number> {
  const ids = NODES.map((n) => n.id);
  const bc: Record<string, number> = {};
  for (const id of ids) bc[id] = 0;

  for (const s of ids) {
    const stack: string[] = [];
    const pred: Record<string, string[]> = {};
    const sigma: Record<string, number> = {};
    const dist: Record<string, number> = {};
    for (const v of ids) {
      pred[v] = [];
      sigma[v] = 0;
      dist[v] = -1;
    }
    sigma[s] = 1;
    dist[s] = 0;
    const q = [s];
    while (q.length) {
      const v = q.shift()!;
      stack.push(v);
      for (const e of dependents[v]) {
        const w = e.from;
        if (dist[w] < 0) {
          dist[w] = dist[v] + 1;
          q.push(w);
        }
        if (dist[w] === dist[v] + 1) {
          sigma[w] += sigma[v];
          pred[w].push(v);
        }
      }
    }
    const delta: Record<string, number> = {};
    for (const v of ids) delta[v] = 0;
    while (stack.length) {
      const w = stack.pop()!;
      for (const v of pred[w]) delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      if (w !== s) bc[w] += delta[w];
    }
  }
  const norm = (ids.length - 1) * (ids.length - 2);
  if (norm > 0) for (const id of ids) bc[id] /= norm;
  return bc;
}

function blast(id: string) {
  const seen = new Set<string>([id]);
  const q = [id];
  while (q.length) {
    const v = q.shift()!;
    for (const e of dependents[v]) {
      if (!seen.has(e.from)) {
        seen.add(e.from);
        q.push(e.from);
      }
    }
  }
  seen.delete(id);
  let apps = 0;
  for (const x of seen) if (NODE_MAP[x].kind === "app") apps++;
  return { packages: seen.size, apps };
}

function normalize(values: Record<string, number>) {
  const nums = Object.values(values);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(values)) {
    out[k] = max === min ? 0 : (v - min) / (max - min);
  }
  return out;
}

function reasons(n: RippleNode, m: Metrics, prN: number, btN: number): string[] {
  const out: string[] = [];
  if (m.blastApps >= 8) {
    out.push(`Compromise reaches ${m.blastApps} of ${APPS.length} applications — a structural chokepoint, not a local CVE.`);
  } else if (m.blastApps >= 4) {
    out.push(`Downstream blast includes ${m.blastApps} applications (${m.blastPackages} packages).`);
  } else if (n.kind === "app") {
    out.push("This is a product node. Risk is inbound: what it consumes, not what depends on it.");
  } else {
    out.push(`Limited direct blast (${m.blastApps} apps) — still relevant if nested under a critical product.`);
  }
  if (btN > 0.7) out.push("High betweenness: many shortest dependency paths travel through this package.");
  else if (prN > 0.7) out.push("High PageRank on the reverse graph — many important dependents point here.");
  if (n.maintainers === 1) out.push("Single maintainer. A takeover or burnout event has no backup.");
  if (n.cves.length) {
    const top = n.cves[0];
    out.push(`Known ${top.severity} issue ${top.id}: ${top.title}.`);
  }
  if (n.lastPublishDays > 500) out.push(`Last publish ${n.lastPublishDays} days ago — slow patch cadence if a release is poisoned.`);
  if (n.kind === "library" && n.weeklyDownloads > 5_000_000) {
    out.push(`Registry gravity: ${Math.round(n.weeklyDownloads / 1_000_000)}M weekly downloads amplify any bad version.`);
  }
  if (n.layer === 0 && m.dependents > 4) {
    out.push("Leaf utility with wide in-degree. Teams rarely review it because it looks trivial.");
  }
  return out.slice(0, 5);
}

const pr = pageRank();
const bt = betweenness();
const prN = normalize(pr);
const btN = normalize(bt);

const metrics: Record<string, Metrics> = {};
const blastAppsMap: Record<string, number> = {};
const blastPkgMap: Record<string, number> = {};
for (const n of NODES) {
  const b = blast(n.id);
  blastAppsMap[n.id] = b.apps;
  blastPkgMap[n.id] = b.packages;
}
const baN = normalize(blastAppsMap);
const _bpN = normalize(blastPkgMap);

for (const n of NODES) {
  const intrinsic = intrinsicOf(n);
  const maintainerRisk = n.maintainers <= 1 ? 1 : n.maintainers === 2 ? 0.45 : 0.15;
  const cveBoost = n.cves.some((c) => c.severity === "critical")
    ? 0.16
    : n.cves.some((c) => c.severity === "high")
      ? 0.09
      : 0;
  const ripple =
    n.kind === "app"
      ? 0.15 * intrinsic + 0.1 * maintainerRisk
      : Math.min(
          1,
          0.22 * prN[n.id] +
            0.2 * btN[n.id] +
            0.28 * baN[n.id] +
            0.14 * intrinsic +
            0.1 * maintainerRisk +
            cveBoost,
        );
  metrics[n.id] = {
    pagerank: pr[n.id],
    betweenness: bt[n.id],
    dependents: dependents[n.id].length,
    blastPackages: blastPkgMap[n.id],
    blastApps: blastAppsMap[n.id],
    intrinsic,
    maintainerRisk,
    ripple,
  };
}

export function getMetrics(id: string) {
  return metrics[id];
}

export const RANKED: RankedPackage[] = LIBS.map((node) => ({
  node,
  metrics: metrics[node.id],
  reasons: reasons(node, metrics[node.id], prN[node.id], btN[node.id]),
})).sort((a, b) => b.metrics.ripple - a.metrics.ripple);

export function explainNode(id: string): string[] {
  const n = NODE_MAP[id];
  const m = metrics[id];
  if (!n || !m) return [];
  return reasons(n, m, prN[id], btN[id]);
}

export function appsForPackage(id: string): RippleNode[] {
  const seen = new Set<string>([id]);
  const q = [id];
  const apps: RippleNode[] = [];
  while (q.length) {
    const v = q.shift()!;
    for (const e of dependents[v]) {
      if (seen.has(e.from)) continue;
      seen.add(e.from);
      q.push(e.from);
      const node = NODE_MAP[e.from];
      if (node.kind === "app") apps.push(node);
    }
  }
  return apps;
}

export { dependents, dependencies };
