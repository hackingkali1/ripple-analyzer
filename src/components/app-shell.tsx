import {
  Activity,
  GitBranch,
  LayoutGrid,
  Radar,
  Shield,
  CircleDot,
  Waypoints,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRipple } from "@/store/ripple-store";
import type { ViewId } from "@/lib/ripple/types";
import { GraphCanvas } from "@/components/graph-canvas";
import { Inspector } from "@/components/inspector";
import { OverviewStrip } from "@/components/overview-strip";
import { SimulatePanel } from "@/components/simulate-panel";
import { PackageBoard } from "@/components/package-board";
import { AppBoard } from "@/components/app-board";
import { MitigateBoard } from "@/components/mitigate-board";
import { IncidentBoard } from "@/components/incident-board";

const NAV: { id: ViewId; label: string; icon: typeof Radar }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "simulate", label: "Simulate", icon: Radar },
  { id: "packages", label: "Packages", icon: GitBranch },
  { id: "apps", label: "Applications", icon: Waypoints },
  { id: "mitigate", label: "Mitigate", icon: Shield },
  { id: "incidents", label: "Incidents", icon: Activity },
];

export function AppShell() {
  const view = useRipple((s) => s.view);
  const setView = useRipple((s) => s.setView);
  const inspectorOpen = useRipple((s) => s.inspectorOpen);

  const showGraph = view === "overview" || view === "simulate";

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg md:flex-row">
      <aside className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2 md:w-56 md:flex-col md:items-stretch md:border-r md:border-b-0 md:px-4 md:py-5">
        <div className="flex items-center gap-2 md:mb-8">
          <span className="flex size-8 items-center justify-center rounded-sm border border-border">
            <CircleDot className="size-4 text-accent" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg tracking-tight">Ripple</p>
            <p className="hidden font-mono text-[10px] tracking-widest text-subtle uppercase md:block">
              Supply chain intel
            </p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col md:gap-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={cn(
                  "flex h-11 shrink-0 items-center gap-2 rounded-sm px-2.5 text-sm md:h-10 md:w-full md:px-3",
                  active ? "bg-raised text-fg" : "text-muted hover:bg-surface hover:text-fg",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="whitespace-nowrap text-xs md:text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <p className="mt-auto hidden font-mono text-[10px] leading-relaxed text-subtle md:block">
          Simulated public graph. Rank is structural, not a vendor score.
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {showGraph ? (
          <>
            {view === "overview" && <OverviewStrip />}
            {view === "simulate" && <SimulatePanel />}
            <div className="grid min-h-0 flex-1 md:grid-cols-[1fr_320px]">
              <div className="relative min-h-[52vh] border-b border-border md:border-b-0 md:border-r">
                <GraphCanvas />
              </div>
              <div
                className={cn("bg-surface", inspectorOpen ? "block" : "hidden", "md:block")}
              >
                <Inspector />
              </div>
            </div>
          </>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {view === "packages" && <PackageBoard />}
            {view === "apps" && <AppBoard />}
            {view === "mitigate" && <MitigateBoard />}
            {view === "incidents" && <IncidentBoard />}
          </div>
        )}
      </div>
    </div>
  );
}
