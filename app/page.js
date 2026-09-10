import AirplaneScrollReveal from "@/components/AirplaneScrollReveal";
import AirplaneTakeoffScroll from "@/components/AirplaneTakeoffScroll";
import DisintegrateLens3D from "@/components/DisintegrateLens3D";

export default function Page() {
  return (
    <main className="relative w-full bg-slate-950">
      {/* 1. Initial 3D Lens Inspection */}
      <DisintegrateLens3D scrollMultiplier={3} maxDistance={6} />

      {/* 2. Exploded Airframe Systems & Internal Cutaway */}
      <AirplaneScrollReveal scrollMultiplier={4} />

      {/* 3. Runway Takeoff Sequence */}
      <AirplaneTakeoffScroll />
    </main>
  );
}