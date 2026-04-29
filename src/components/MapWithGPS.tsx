// src/components/MapWithGPS.tsx
'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'

const markerIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
})

function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(position, 16)
  }, [position])
  return null
}

export default function MapWithGPS() {
  const [position, setPosition] = useState<[number, number] | null>(null)

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ไม่รองรับ GPS')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setPosition([latitude, longitude])
      },
      () => alert('ไม่สามารถดึงตำแหน่งได้')
    )
  }

  return (
    <div className="p-4">
      <button
        onClick={getLocation}
        className="bg-green-600 text-white px-4 py-2 rounded mb-4"
      >
        📍 แสดงตำแหน่งของฉัน
      </button>

      <MapContainer
        center={position ?? [13.736717, 100.523186]}
        zoom={13}
        scrollWheelZoom
        style={{ height: '400px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {position && (
          <>
            <Marker position={position} icon={markerIcon} />
            <RecenterMap position={position} />
          </>
        )}
      </MapContainer>
    </div>
  )
}
