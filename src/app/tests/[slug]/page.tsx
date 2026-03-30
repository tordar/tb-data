import { getTestBySlug, getTestMeta, getTests } from "@/lib/data/tests";
import { TestSheetView } from "@/components/tests/TestSheetView";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return getTests().map((t) => ({ slug: t.slug }));
}

export default async function TestSheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sheet = getTestBySlug(slug);
  const meta = getTestMeta(slug);
  if (!sheet || !meta) notFound();
  return <TestSheetView sheet={sheet} meta={meta} />;
}
