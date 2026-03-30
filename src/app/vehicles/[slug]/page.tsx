import { getVehicles, getVehicleBySlug } from "@/lib/data/vehicles";
import { getVehicleProfile } from "@/lib/data/comparison";
import { VehicleProfileView } from "@/components/vehicles/VehicleProfileView";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return getVehicles().map((v) => ({ slug: v.slug }));
}

export default async function VehiclePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);
  if (!vehicle) notFound();
  const profile = getVehicleProfile(vehicle.name);
  if (!profile) notFound();
  return <VehicleProfileView profile={profile} />;
}
