import meta from "@/data/tests/meta.json";
import bananaData from "@/data/tests/banana.json";
import weightData from "@/data/tests/weight.json";
import accelerationData from "@/data/tests/acceleration.json";
import noiseData from "@/data/tests/noise.json";
import brakingData from "@/data/tests/braking.json";
import rangeData from "@/data/tests/range.json";
import sundayData from "@/data/tests/sunday.json";
import km1000Data from "@/data/tests/1000-km.json";
import km500Data from "@/data/tests/500-km.json";
import arcticCircleData from "@/data/tests/arctic-circle.json";
import bangkokData from "@/data/tests/bangkok.json";
import degradationData from "@/data/tests/degradation.json";
import geiloData from "@/data/tests/geilo.json";
import zeroMileData from "@/data/tests/zero-mile.json";
import type { TestSheet, TestMeta } from "@/lib/types";

const TEST_DATA: Record<string, TestSheet> = {
  banana: bananaData as TestSheet,
  weight: weightData as TestSheet,
  acceleration: accelerationData as TestSheet,
  noise: noiseData as TestSheet,
  braking: brakingData as TestSheet,
  range: rangeData as TestSheet,
  sunday: sundayData as TestSheet,
  "1000-km": km1000Data as TestSheet,
  "500-km": km500Data as TestSheet,
  "arctic-circle": arcticCircleData as TestSheet,
  bangkok: bangkokData as TestSheet,
  degradation: degradationData as TestSheet,
  geilo: geiloData as TestSheet,
  "zero-mile": zeroMileData as TestSheet,
};

export function getTests(): TestMeta[] {
  return meta as TestMeta[];
}

export function getTestMeta(slug: string): TestMeta | null {
  return (meta as TestMeta[]).find((t) => t.slug === slug) ?? null;
}

export function getTestBySlug(slug: string): TestSheet | null {
  return TEST_DATA[slug] ?? null;
}

export function getAllTestSheets(): TestSheet[] {
  return (meta as TestMeta[])
    .map((m) => getTestBySlug(m.slug))
    .filter((s): s is TestSheet => s !== null);
}
