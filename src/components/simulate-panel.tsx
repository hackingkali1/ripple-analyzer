import { ATTACKS } from "@/lib/ripple/simulate";
import { NODE_MAP } from "@/lib/ripple/ecosystem";
import { RANKED } from "@/lib/ripple/analyze";
import { useRipple } from "@/store/ripple-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SimulatePanel() {
  const attack = useRipple((s) => s.attack);
  const setAttack = useRipple((s) => s.setAttack);
  const selectedId = useRipple((s) => s.selectedId);
  const sim = useRipple((s) => s.sim);
  const runSim = useRipple((s) => s.runSim);
  const clearSim = useRipple((s) => s.clearSim);
  const source = selectedId && NODE_MAP[selectedId]?.kind !== "app" ? selectedId : (sim?.sourceId ?? RANKED[0]?.node.id);

  return (
    <header className="border-b border-border px-4 py-4 md:px-6">
      <p className="font-mono text-[11px] tracking-widest text-subtle uppercase">Compromise simulation</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight">Inject a fault, watch the wave</h1>
      <p className="mt-2 max-w-2xl text-sm leading-normal text-muted">
        Transmission is sampled, not assumed. Runtime edges carry more weight than dev or optional. Single-maintainer
        nodes and known attack classes change the odds.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {ATTACKS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAttack(a.id)}
            className={cn(
              "h-10 rounded-sm border px-3 text-sm",
              attack === a.id ? "border-fg bg-raised text-fg" : "border-border text-muted hover:text-fg",
            )}
          >
            {a.label}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={() => runSim(source)} disabled={!source}>
          Run on {source ? NODE_MAP[source]?.name : "selection"}
        </Button>
        <Button variant="ghost" onClick={clearSim}>
          Clear wave
        </Button>
        {sim && (
          <p className="font-mono text-xs text-muted">
            E[apps] {sim.expectedApps} · E[packages] {sim.expectedPackages} · critical-path apps {sim.criticalAppsHit} ·{" "}
            {sim.samples} draws
          </p>
        )}
      </div>
      {sim && sim.paths.length > 0 && (
        <ol className="mt-4 space-y-1 font-mono text-xs text-muted">
          {sim.paths.slice(0, 4).map((p) => (
            <li key={p.nodes.join(">")}>
              <span className="text-warn">{(p.probability * 100).toFixed(0)}%</span>{" "}
              {p.nodes.map((id) => NODE_MAP[id]?.name).join(" → ")}
            </li>
          ))}
        </ol>
      )}
    </header>
  );
}
