import { getVehicleBySlug } from "@/lib/data/vehicles";
import { HeadToHeadView } from "@/components/compare/HeadToHeadView";
import { notFound } from "next/navigation";

export default async function HeadToHeadPage({ params }: { params: Promise<{ slugA: string; slugB: string }> }) {
  const { slugA, slugB } = await params;
  const vehicleA = getVehicleBySlug(slugA);
  const vehicleB = getVehicleBySlug(slugB);
  if (!vehicleA || !vehicleB) notFound();
  return <HeadToHeadView initialA={vehicleA.name} initialB={vehicleB.name} />;
}
