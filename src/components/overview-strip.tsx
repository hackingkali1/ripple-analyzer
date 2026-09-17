import { APPS, RANKED } from "@/lib/ripple/analyze";
import { NODES } from "@/lib/ripple/ecosystem";
import { useRipple } from "@/store/ripple-store";
import { Button } from "@/components/ui/button";

export function OverviewStrip() {
  const runSim = useRipple((s) => s.runSim);
  const select = useRipple((s) => s.select);
  const top = RANKED[0];
  const crit = RANKED.filter((r) => r.metrics.ripple >= 0.7).length;
  const withCve = NODES.filter((n) => n.cves.length > 0).length;

  return (
    <header className="border-b border-border px-4 py-4 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <p className="font-mono text-[11px] tracking-widest text-subtle uppercase">Command center</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight md:text-4xl">The blast radius, not the CVSS</h1>
          <p className="mt-2 text-sm leading-normal text-muted">
            A low-level package can outrank a noisy CVE because of where it sits. Ripple maps the graph, ranks
            structural importance, and shows how a compromise would travel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => runSim("stream-kit")}>Replay stream-kit</Button>
          <Button variant="secondary" onClick={() => runSim("compress-xz")}>
            Replay xz analog
          </Button>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Kpi label="Nodes" value={String(NODES.length)} />
        <Kpi label="Applications" value={String(APPS.length)} />
        <Kpi label="High ripple" value={String(crit)} />
        <Kpi label="Known advisories" value={String(withCve)} />
      </dl>
      {top && (
        <button
          type="button"
          onClick={() => select(top.node.id)}
          className="mt-3 text-left font-mono text-xs text-muted hover:text-fg"
        >
          Highest ripple: {top.node.name} · {top.metrics.ripple.toFixed(2)} · {top.metrics.blastApps} apps
        </button>
      )}
    </header>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-3">
      <dt className="font-mono text-[10px] tracking-widest text-subtle uppercase">{label}</dt>
      <dd className="mt-1 font-mono text-2xl tabular-nums">{value}</dd>
    </div>
  );
}
