import { getTestBySlug, getTestMeta, getTests } from "@/lib/data/tests";
import { TestSheetView } from "@/components/tests/TestSheetView";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { computeStats } from "@/lib/utils/scoring";

export async function generateStaticParams() {
  return getTests().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const sheet = getTestBySlug(slug);
  const meta = getTestMeta(slug);
  if (!sheet || !meta) return {};

  const stats = computeStats(sheet, meta);
  const vehicleCount = stats?.count ?? 0;
  const topName = stats?.best?.name ?? "";
  const topVal = stats?.best?.val ?? 0;
  const unit = meta.unit;

  const title = `${meta.name} Test Results — Real-World EV Data | TB Test Results`;
  const description = `Real-world EV ${meta.name.toLowerCase()} benchmarks from Bjørn Nyland's tests. ${vehicleCount} vehicles tested. Top result: ${topName} at ${topVal} ${unit}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    alternates: {
      canonical: `https://tb-data.tordar.no/tests/${slug}`,
    },
  };
}

export default async function TestSheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sheet = getTestBySlug(slug);
  const meta = getTestMeta(slug);
  if (!sheet || !meta) notFound();
  return <TestSheetView sheet={sheet} meta={meta} />;
}
