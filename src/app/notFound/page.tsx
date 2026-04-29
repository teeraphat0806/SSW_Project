"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        textAlign: "center",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "3rem" }}>404 - Page Not Found</h1>
      <p style={{ margin: "1rem 0" }}>
        หน้าที่คุณกำลังมองหาไม่พบ หรือคุณไม่มีสิทธิ์เข้าถึงหน้านี้
      </p>
      <button
        onClick={() => router.push("/profile")}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        กลับไปที่หน้าหลัก
      </button>
    </div>
  );
}
