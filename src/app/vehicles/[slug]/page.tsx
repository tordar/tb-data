import { getVehicles, getVehicleBySlug } from "@/lib/data/vehicles";
import { getVehicleProfile } from "@/lib/data/comparison";
import { VehicleProfileView } from "@/components/vehicles/VehicleProfileView";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);
  if (!vehicle) return {};
  const profile = getVehicleProfile(vehicle.name);
  if (!profile) return {};
  const title = `${vehicle.name} — EV Test Results | TB Test Results`;
  const description = `Bjørn Nyland's real-world test results for the ${vehicle.name}: range, acceleration, braking, noise, cargo and more across all test categories.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    alternates: {
      canonical: `https://tb-data-xi.vercel.app/vehicles/${slug}`,
    },
  };
}

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
