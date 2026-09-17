import { rankMitigations } from "@/lib/ripple/mitigate";
import { NODE_MAP } from "@/lib/ripple/ecosystem";
import { useRipple } from "@/store/ripple-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ITEMS = rankMitigations();

export function MitigateBoard() {
  const select = useRipple((s) => s.select);
  const setView = useRipple((s) => s.setView);

  return (
    <div className="px-4 py-5 md:px-6">
      <p className="font-mono text-[11px] tracking-widest text-subtle uppercase">Mitigation planner</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight">Spend effort where the graph pays back</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Ranked by expected risk reduction times applications covered, divided by effort. Patching a leaf that eight
        products share beats chasing a noisy but isolated CVE.
      </p>
      <ol className="mt-5 space-y-3">
        {ITEMS.map((m, i) => {
          const pkg = NODE_MAP[m.packageId];
          const score = (m.riskReduction * m.coverageApps) / m.effort;
          return (
            <li key={m.id} className="rounded-lg border border-border bg-surface p-4 md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-subtle">{String(i + 1).padStart(2, "0")}</span>
                    <h2 className="font-medium">{m.action}</h2>
                    <Badge>effort {m.effort}/5</Badge>
                    <Badge tone="ok">{m.coverageApps} apps</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-normal text-muted">{m.detail}</p>
                  <ul className="mt-3 space-y-1">
                    {m.reasons.map((r) => (
                      <li key={r} className="text-sm text-fg">
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
                  <p className="font-mono text-xs text-subtle">Leverage</p>
                  <p className="font-mono text-2xl tabular-nums">{score.toFixed(2)}</p>
                  <p className="font-mono text-xs text-muted">Δrisk {(m.riskReduction * 100).toFixed(0)}%</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      select(m.packageId);
                      setView("overview");
                    }}
                  >
                    Inspect {pkg?.name ?? m.packageId}
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
