import { NODE_MAP } from "@/lib/ripple/ecosystem";
import { APPS, appsForPackage, explainNode, getMetrics } from "@/lib/ripple/analyze";
import { useRipple } from "@/store/ripple-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCompact } from "@/lib/utils";
import { X } from "lucide-react";

function toneForRipple(v: number) {
  if (v >= 0.72) return "danger" as const;
  if (v >= 0.45) return "warn" as const;
  return "neutral" as const;
}

export function Inspector() {
  const selectedId = useRipple((s) => s.selectedId);
  const sim = useRipple((s) => s.sim);
  const runSim = useRipple((s) => s.runSim);
  const select = useRipple((s) => s.select);
  const setInspector = useRipple((s) => s.setInspector);

  if (!selectedId) {
    return (
      <div className="flex h-full flex-col justify-between p-5">
        <div>
          <p className="font-mono text-[11px] tracking-widest text-subtle uppercase">Inspector</p>
          <h2 className="mt-3 font-display text-2xl text-fg">Select a node</h2>
          <p className="mt-2 text-sm leading-normal text-muted">
            Click any package or application on the graph. Ripple shows why it matters structurally — not just its
            CVSS.
          </p>
        </div>
        <p className="font-mono text-[11px] text-subtle">
          {APPS.length} applications · reverse-graph PageRank · betweenness · Monte-Carlo spread
        </p>
      </div>
    );
  }

  const n = NODE_MAP[selectedId];
  const m = getMetrics(selectedId);
  if (!n || !m) return null;
  const reasons = explainNode(selectedId);
  const apps = appsForPackage(selectedId);
  const p = sim?.reached[selectedId];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <p className="font-mono text-[11px] tracking-widest text-subtle uppercase">{n.kind}</p>
          <h2 className="mt-1 truncate font-display text-2xl">{n.name}</h2>
          <p className="mt-1 font-mono text-[11px] text-muted">
            {n.ecosystem}@{n.version}
          </p>
        </div>
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-sm text-muted hover:bg-raised hover:text-fg"
          onClick={() => {
            select(null);
            setInspector(false);
          }}
          aria-label="Close inspector"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <p className="text-sm leading-normal text-muted">{n.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label="Ripple" value={m.ripple.toFixed(2)} tone={toneForRipple(m.ripple)} />
          <Stat label="Blast apps" value={String(m.blastApps)} />
          <Stat label="Dependents" value={String(m.dependents)} />
          <Stat
            label="Downloads"
            value={n.kind === "app" ? n.org ?? "—" : formatCompact(n.weeklyDownloads)}
          />
        </div>

        {p != null && sim && (
          <p className="mt-4 rounded-md bg-raised px-3 py-2 font-mono text-xs text-warn">
            P(reached | {sim.attack}) = {(p * 100).toFixed(0)}%
          </p>
        )}

        <h3 className="mt-6 font-mono text-[11px] tracking-widest text-subtle uppercase">Why this rank</h3>
        <ul className="mt-2 space-y-2">
          {reasons.map((r) => (
            <li key={r} className="border-l border-border pl-3 text-sm leading-normal text-fg">
              {r}
            </li>
          ))}
        </ul>

        {n.cves.length > 0 && (
          <div className="mt-5">
            <h3 className="font-mono text-[11px] tracking-widest text-subtle uppercase">Advisories</h3>
            <ul className="mt-2 space-y-2">
              {n.cves.map((c) => (
                <li key={c.id} className="flex items-start gap-2 text-sm">
                  <Badge tone={c.severity === "critical" || c.severity === "high" ? "danger" : "warn"}>
                    {c.severity}
                  </Badge>
                  <span>
                    <span className="font-mono text-xs">{c.id}</span>
                    <span className="block text-muted">{c.title}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {n.kind !== "app" && (
          <div className="mt-5">
            <h3 className="font-mono text-[11px] tracking-widest text-subtle uppercase">
              Downstream applications
            </h3>
            <ul className="mt-2 space-y-1">
              {apps.length === 0 && <li className="text-sm text-muted">No application reaches this node.</li>}
              {apps.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm hover:bg-raised"
                    onClick={() => select(a.id)}
                  >
                    <span>{a.name}</span>
                    <Badge>{a.domain}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-[11px] text-subtle">
          <span>Maintainers {n.maintainers}</span>
          <span>Last publish {n.lastPublishDays}d</span>
        </div>
      </div>

      {n.kind !== "app" && (
        <div className="border-t border-border p-4">
          <Button className="w-full" onClick={() => runSim(n.id)}>
            Simulate compromise
          </Button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "danger" | "warn" | "neutral" }) {
  return (
    <div className="rounded-md bg-raised px-3 py-2">
      <p className="font-mono text-[10px] tracking-widest text-subtle uppercase">{label}</p>
      <p className="mt-1 font-mono text-lg tabular-nums text-fg">
        {tone && tone !== "neutral" ? <Badge tone={tone}>{value}</Badge> : value}
      </p>
    </div>
  );
}
