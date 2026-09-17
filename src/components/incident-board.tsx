import { INCIDENTS, NODE_MAP } from "@/lib/ripple/ecosystem";
import { getMetrics } from "@/lib/ripple/analyze";
import { useRipple } from "@/store/ripple-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function IncidentBoard() {
  const runSim = useRipple((s) => s.runSim);
  const setAttack = useRipple((s) => s.setAttack);
  const select = useRipple((s) => s.select);

  return (
    <div className="px-4 py-5 md:px-6">
      <p className="font-mono text-[11px] tracking-widest text-subtle uppercase">Incident replay</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight">History as a test suite</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Each card is a public analog mapped onto this ecosystem. Ripple would have ranked the package as structurally
        important before the advisory existed.
      </p>
      <div className="mt-5 space-y-4">
        {INCIDENTS.map((inc) => {
          const n = NODE_MAP[inc.packageId];
          const m = getMetrics(inc.packageId);
          return (
            <article key={inc.id} className="rounded-lg border border-border bg-surface p-4 md:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-subtle">{inc.year}</span>
                <h2 className="font-display text-2xl">{inc.title}</h2>
                <Badge>analog {inc.analog}</Badge>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-normal text-muted">{inc.summary}</p>
              <p className="mt-3 text-sm text-fg">{inc.lesson}</p>
              <p className="mt-3 font-mono text-xs text-muted">
                {n?.name} · ripple {m.ripple.toFixed(2)} · blast {m.blastApps} apps · maintainers {n?.maintainers}
              </p>
              <div className="mt-4">
                <Button
                  onClick={() => {
                    select(inc.packageId);
                    setAttack(inc.attack);
                    runSim(inc.packageId);
                  }}
                >
                  Simulate this incident
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
