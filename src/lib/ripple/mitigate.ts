import { NODE_MAP } from "./ecosystem";
import { RANKED, appsForPackage, getMetrics } from "./analyze";
import type { Mitigation } from "./types";

export function rankMitigations(): Mitigation[] {
  const items: Mitigation[] = [];
  const top = RANKED.slice(0, 14);

  for (const row of top) {
    const n = row.node;
    const m = row.metrics;
    const apps = appsForPackage(n.id);
    const crit = apps.filter((a) => a.domain === "finance" || a.domain === "health" || a.domain === "gov").length;

    if (n.cves.some((c) => c.severity === "critical" || c.severity === "high")) {
      items.push({
        id: `patch-${n.id}`,
        packageId: n.id,
        action: `Patch ${n.name}`,
        detail: `Ship or pin the fixed release for ${n.cves[0].id}. Clears the known issue on every downstream path.`,
        effort: 2,
        riskReduction: Math.min(0.95, 0.45 + m.ripple * 0.5),
        coverageApps: apps.length,
        reasons: [
          `${n.cves[0].id} is already public.`,
          `Touches ${apps.length} applications (${crit} in finance/health/gov).`,
          "Lowest-effort action that still changes the graph.",
        ],
      });
    }

    if (n.alternative) {
      items.push({
        id: `replace-${n.id}`,
        packageId: n.id,
        action: `Replace ${n.name}`,
        detail: `Move to ${n.alternative}. Removes this node from every reverse path.`,
        effort: n.layer === 0 ? 2 : 4,
        riskReduction: Math.min(0.98, 0.55 + m.ripple * 0.4),
        coverageApps: apps.length,
        reasons: [
          `Drop-in path: ${n.alternative}.`,
          `Eliminates single-maintainer and hijack risk on this id.`,
          `Ripple score ${m.ripple.toFixed(2)} makes replacement high leverage.`,
        ],
      });
    }

    if (m.blastApps >= 6 && n.maintainers <= 2) {
      items.push({
        id: `pin-${n.id}`,
        packageId: n.id,
        action: `Pin and gate ${n.name}`,
        detail: "Lock the version in every product lockfile. Require two-person review for upgrades.",
        effort: 1,
        riskReduction: Math.min(0.7, 0.28 + m.ripple * 0.35),
        coverageApps: apps.length,
        reasons: [
          "Stops automatic minor/patch from delivering a poisoned release.",
          "Does not shrink the graph — it slows the wave.",
          `Cheap control covering ${apps.length} apps.`,
        ],
      });
    }

    if (n.id === "compress-xz" || n.id === "tiny-hash" || n.id === "token-core") {
      items.push({
        id: `isolate-${n.id}`,
        packageId: n.id,
        action: `Isolate ${n.name} at runtime`,
        detail: "Run the native/crypto surface in a sandboxed worker with no network and tight seccomp.",
        effort: 4,
        riskReduction: 0.62,
        coverageApps: apps.length,
        reasons: [
          "Build-backdoor and hash/token bugs execute at runtime, not only at install.",
          "Containment is the right control when you cannot yet replace the node.",
        ],
      });
    }
  }

  items.push({
    id: "lockfiles",
    packageId: "aether-web",
    action: "Enforce lockfiles + provenance",
    detail: "Require committed lockfiles, npm provenance / sigstore, and block unsigned publishes in CI.",
    effort: 3,
    riskReduction: 0.4,
    coverageApps: 12,
    reasons: [
      "Cuts typosquat and surprise-version risk across the whole graph.",
      "Does not remove structural chokepoints — pair with replacements.",
    ],
  });

  return items
    .map((x) => ({
      ...x,
      /* score = reduction * apps / effort */
    }))
    .sort((a, b) => b.riskReduction * (b.coverageApps / b.effort) - a.riskReduction * (a.coverageApps / a.effort))
    .slice(0, 12);
}

export function leverage(id: string) {
  const m = getMetrics(id);
  const n = NODE_MAP[id];
  return { m, n };
}
