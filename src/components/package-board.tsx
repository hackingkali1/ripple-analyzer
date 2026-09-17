import { RANKED } from "@/lib/ripple/analyze";
import { useRipple } from "@/store/ripple-store";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCompact } from "@/lib/utils";

export function PackageBoard() {
  const query = useRipple((s) => s.query);
  const setQuery = useRipple((s) => s.setQuery);
  const select = useRipple((s) => s.select);
  const setView = useRipple((s) => s.setView);
  const q = query.trim().toLowerCase();
  const rows = RANKED.filter(
    (r) =>
      !q ||
      r.node.name.includes(q) ||
      r.node.description.toLowerCase().includes(q) ||
      r.node.id.includes(q),
  );

  return (
    <div className="px-4 py-5 md:px-6">
      <p className="font-mono text-[11px] tracking-widest text-subtle uppercase">Critical dependencies</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight">Ranked by ripple, not by CVE count</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        PageRank on the reverse graph, betweenness, downstream applications, intrinsic advisories, and maintainer
        concentration.
      </p>
      <div className="mt-4 max-w-sm">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter packages"
          aria-label="Filter packages"
        />
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface font-mono text-[10px] tracking-widest text-subtle uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Package</th>
              <th className="px-3 py-2 font-medium">Ripple</th>
              <th className="px-3 py-2 font-medium">Apps</th>
              <th className="px-3 py-2 font-medium">Downloads</th>
              <th className="px-3 py-2 font-medium">Maintainers</th>
              <th className="px-3 py-2 font-medium">Signal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.node.id}
                className="cursor-pointer border-t border-border hover:bg-surface"
                onClick={() => {
                  select(r.node.id);
                  setView("overview");
                }}
              >
                <td className="px-3 py-2 font-mono text-xs tabular-nums text-subtle">{i + 1}</td>
                <td className="px-3 py-2">
                  <div className="font-medium">{r.node.name}</div>
                  <div className="max-w-xs truncate text-xs text-muted">{r.reasons[0]}</div>
                </td>
                <td className="px-3 py-2 font-mono tabular-nums">{r.metrics.ripple.toFixed(2)}</td>
                <td className="px-3 py-2 font-mono tabular-nums">{r.metrics.blastApps}</td>
                <td className="px-3 py-2 font-mono tabular-nums">{formatCompact(r.node.weeklyDownloads)}</td>
                <td className="px-3 py-2 font-mono tabular-nums">{r.node.maintainers}</td>
                <td className="px-3 py-2">
                  {r.node.cves[0] ? (
                    <Badge tone={r.node.cves[0].severity === "low" || r.node.cves[0].severity === "medium" ? "warn" : "danger"}>
                      {r.node.cves[0].severity}
                    </Badge>
                  ) : (
                    <Badge>clean</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
