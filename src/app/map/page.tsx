// src/app/map/page.tsx
"use client";

import dynamic from "next/dynamic";

// dynamic import พร้อม ssr: false
const MapWithGPS = dynamic(() => import("../../components/MapWithGPS"), {
  ssr: false,
});

export default function MapPage() {
  return (
    <div>
      <h1 className="text-xl font-bold p-4">แผนที่ตำแหน่งของฉัน</h1>
      <MapWithGPS />
    </div>
  );
}
