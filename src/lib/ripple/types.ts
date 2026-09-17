export type Ecosystem = "npm" | "pypi" | "maven" | "crates";
export type Severity = "critical" | "high" | "medium" | "low";
export type EdgeKind = "runtime" | "dev" | "optional";
export type NodeKind = "app" | "framework" | "library";
export type AttackType =
  | "malicious-release"
  | "account-takeover"
  | "protestware"
  | "build-backdoor"
  | "typosquat";
export type ViewId = "overview" | "simulate" | "packages" | "apps" | "mitigate" | "incidents";

export interface Cve {
  id: string;
  severity: Severity;
  title: string;
}

export interface RippleNode {
  id: string;
  name: string;
  kind: NodeKind;
  ecosystem: Ecosystem;
  version: string;
  description: string;
  weeklyDownloads: number;
  maintainers: number;
  lastPublishDays: number;
  cves: Cve[];
  layer: 0 | 1 | 2 | 3;
  org?: string;
  domain?: string;
  alternative?: string;
}

export interface RippleEdge {
  from: string;
  to: string;
  kind: EdgeKind;
}

export interface Incident {
  id: string;
  year: number;
  title: string;
  analog: string;
  packageId: string;
  attack: AttackType;
  summary: string;
  lesson: string;
}

export interface Metrics {
  pagerank: number;
  betweenness: number;
  dependents: number;
  blastPackages: number;
  blastApps: number;
  intrinsic: number;
  maintainerRisk: number;
  ripple: number;
}

export interface RankedPackage {
  node: RippleNode;
  metrics: Metrics;
  reasons: string[];
}

export interface SimPath {
  nodes: string[];
  probability: number;
  kinds: EdgeKind[];
}

export interface SimResult {
  sourceId: string;
  attack: AttackType;
  reached: Record<string, number>;
  expectedApps: number;
  expectedPackages: number;
  criticalAppsHit: number;
  paths: SimPath[];
  samples: number;
}

export interface Mitigation {
  id: string;
  packageId: string;
  action: string;
  detail: string;
  effort: 1 | 2 | 3 | 4 | 5;
  riskReduction: number;
  coverageApps: number;
  reasons: string[];
}
