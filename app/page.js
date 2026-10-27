import AirplaneScrollReveal from "@/components/AirplaneScrollReveal";
import AirplaneTakeoffScroll from "@/components/AirplaneTakeoffScroll";
import DisintegrateLens3D from "@/components/DisintegrateLens3D";
import Home from "@/components/Indexhero";
import Lumora from "@/components/YogaHero";
import TileRing from "@/components/TileRing";

export default function Page() {
  return (
    <main className="relative w-full bg-slate-950">
      {/* 1. Initial 3D Lens Inspection */}
      <Lumora scrollMultiplier={2} maxDistance={6} />
      <Home />
      <TileRing />
      <DisintegrateLens3D scrollMultiplier={3} maxDistance={6} />

      {/* 2. Exploded Airframe Systems & Internal Cutaway */}
      <AirplaneScrollReveal scrollMultiplier={4} />

      {/* 3. Runway Takeoff Sequence */}
      <AirplaneTakeoffScroll />
    </main>
  );
}