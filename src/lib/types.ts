export type SortDir = "asc" | "desc";

export interface TestSheet {
  name: string;
  slug: string;
  headers: string[];
  rows: string[][];
}

export interface TestMeta {
  name: string;
  slug: string;
  icon: string;
  colName: string;
  lowerIsBetter: boolean;
  unit: string;
  description: string;
}

export interface Vehicle {
  name: string;
  slug: string;
  type: "car" | "van";
  tests: string[];
}

export interface ChartEntry {
  name: string;
  val: number;
}

export interface Stats {
  count: number;
  best: ChartEntry;
  avg: number;
  unit: string;
  lowerIsBetter: boolean;
  top10: ChartEntry[];
}

export interface MetricConfig {
  key: string;
  label: string;
  testSlug: string;
  colName: string;
  lowerIsBetter: boolean;
  unit: string;
  filterFn?: (row: string[], headers: string[]) => boolean;
}

export interface VehicleTestResult {
  testName: string;
  testSlug: string;
  value: number;
  rank: number;
  totalTested: number;
  unit: string;
}

export interface VehicleProfile {
  name: string;
  slug: string;
  type: "car" | "van";
  results: VehicleTestResult[];
}

export interface ComparisonMetric {
  testName: string;
  testSlug: string;
  unit: string;
  lowerIsBetter: boolean;
  valueA: number | null;
  valueB: number | null;
  winner: "a" | "b" | "tie" | null;
}
