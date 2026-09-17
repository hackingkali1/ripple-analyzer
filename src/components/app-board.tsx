import { APPS, getDependencies } from "@/lib/ripple/analyze";
import { NODE_MAP } from "@/lib/ripple/ecosystem";
import { getMetrics } from "@/lib/ripple/analyze";
import { useRipple } from "@/store/ripple-store";
import { Badge } from "@/components/ui/badge";

export function AppBoard() {
  const select = useRipple((s) => s.select);
  const setView = useRipple((s) => s.setView);
  const sim = useRipple((s) => s.sim);

  return (
    <div className="px-4 py-5 md:px-6">
      <p className="font-mono text-[11px] tracking-widest text-subtle uppercase">Affected applications</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight">Who sits at the end of the chain</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Each product inherits the worst structural nodes in its tree. After a simulation, probability of reach is
        shown per application.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {APPS.map((app) => {
          const deps = getDependencies(app.id);
          const inherited = deps
            .map((e) => NODE_MAP[e.to])
            .filter(Boolean)
            .sort((a, b) => getMetrics(b.id).ripple - getMetrics(a.id).ripple);
          const p = sim?.reached[app.id];
          return (
            <button
              key={app.id}
              type="button"
              onClick={() => {
                select(app.id);
                setView("overview");
              }}
              className="rounded-lg border border-border bg-surface p-4 text-left hover:border-fg/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{app.name}</p>
                  <p className="font-mono text-[11px] text-subtle">
                    {app.org} · {app.domain}
                  </p>
                </div>
                <Badge
                  tone={
                    app.domain === "finance" || app.domain === "health" || app.domain === "gov" ? "danger" : "neutral"
                  }
                >
                  {app.domain}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted">{app.description}</p>
              {p != null && (
                <p className="mt-2 font-mono text-xs text-warn">P(compromised) {(p * 100).toFixed(0)}%</p>
              )}
              <p className="mt-3 font-mono text-[10px] tracking-widest text-subtle uppercase">Direct frameworks</p>
              <p className="mt-1 font-mono text-xs text-muted">{inherited.map((n) => n.name).join(" · ")}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
