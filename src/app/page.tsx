import { DashboardStats } from "@/components/dashboard/DashboardStats";
import dynamic from "next/dynamic";
const DashboardRadar = dynamic(() => import("@/components/dashboard/DashboardRadar").then(m => m.DashboardRadar));

export default function DashboardPage() {
  return (
    <>
      <section>
        <h2 data-page-headline className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>Dashboard</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>Overview of Bjørn Nyland&apos;s EV test results</p>
      </section>
      <DashboardStats />
      <DashboardRadar />
    </>
  );
}
