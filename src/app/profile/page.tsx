"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "next-auth";

type ToastState = { show: boolean; message: string };

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [toast, setToast] = useState<ToastState>({ show: false, message: "" });
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [loading, setLoading] = useState(true);

  // Redirect safely (no router.push during render)
  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(
      () => setToast({ show: false, message: "" }),
      2000
    );
    return () => clearTimeout(timer);
  }, [toast.show]);

  // Theme init + sync to <html class="dark">
  useEffect(() => {
    const saved =
      (typeof window !== "undefined" &&
        (localStorage.getItem("theme") as "light" | "dark" | null)) ||
      null;

    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const initial: "light" | "dark" = saved ?? (prefersDark ? "dark" : "light");
    setTheme(initial);

    document.documentElement.classList.toggle("dark", initial === "dark");
    setLoading(false);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
    setToast({
      show: true,
      message: next === "dark" ? "Dark mode enabled" : "Light mode enabled",
    });
  };

  const user = session?.user as Session["user"];

  const userName = user?.name || "-";
  const userEmail = user?.email || "-";
  const userRole = user?.role || "User";

  const initials = useMemo(() => {
    const n = (user?.name || "").trim();
    if (!n) return "U";
    return n.charAt(0).toUpperCase();
  }, [user?.name]);

  const handleCopyEmail = () => {
    if (!user?.email) return;
    navigator.clipboard.writeText(user.email);
    setToast({ show: true, message: "Email copied to clipboard!" });
  };

  const handleLogout = () => signOut({ callbackUrl: "/" });
  const handleEditProfile = () =>
    alert("Edit Profile functionality coming soon!");
  const handleBackToHome = () => router.push("/");

  // Loading skeleton (token-based colors)
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (status === "unauthenticated" || !user) return null;

  // Optional data
  const createdAt = (user as any)?.createdAt as string | undefined;
  const lastLoginAt = (user as any)?.lastLoginAt as string | undefined;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="w-full max-w-4xl rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-elevation)] overflow-hidden">
        {/* Header */}
        <div className="p-8 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-32 h-32 rounded-full border-4 border-white/70 dark:border-white/25 shadow-lg bg-black/10 dark:bg-white/10 flex items-center justify-center">
              <span className="text-5xl font-bold">{initials}</span>
            </div>

            <h1 className="text-3xl font-bold">{userName}</h1>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center rounded-full px-4 py-1 text-sm font-medium bg-black/15 dark:bg-white/15 backdrop-blur">
                {userRole}
              </span>
              <button
                onClick={toggleTheme}
                className="inline-flex items-center rounded-full px-4 py-1 text-sm font-medium bg-black/15 dark:bg-white/15 hover:bg-black/25 dark:hover:bg-white/25 transition focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-transparent"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? "Dark" : "Light"}
              </button>
            </div>

            <p className="opacity-90">{userEmail}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          {/* Overview */}
          <section className="mb-8">
            <div className="flex items-end justify-between gap-4 mb-4">
              <h2 className="text-2xl font-semibold">ภาพรวม</h2>
              <p className="text-sm text-[hsl(var(--small-detail))]">
                จัดการข้อมูลบัญชีและความปลอดภัยของคุณ
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--aa))] p-4">
                <p className="text-sm font-medium text-[hsl(var(--small-detail))] mb-1">
                  สถานะบัญชี
                </p>
                <p className="text-lg font-bold">Active</p>
              </div>

              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--aa))] p-4">
                <p className="text-sm font-medium text-[hsl(var(--small-detail))] mb-1">
                  ตำเเหน่ง
                </p>
                <p className="text-lg font-bold">{userRole}</p>
              </div>

              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--aa))] p-4">
                <p className="text-sm font-medium text-[hsl(var(--small-detail))] mb-1">
                  เข้าสู่ระบบล่าสุด
                </p>
                <p className="text-lg font-bold">{formatDate(lastLoginAt)}</p>
              </div>

              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--aa))] p-4">
                <p className="text-sm font-medium text-[hsl(var(--small-detail))] mb-1">
                  สมาชิกตั้งแต่
                </p>
                <p className="text-lg font-bold">{formatDate(createdAt)}</p>
              </div>
            </div>
          </section>

          {/* Details */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">รายละเอียดบัญชี</h2>

            <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden">
              <dl className="divide-y divide-[hsl(var(--border))]">
                {[
                  ["ชื่อเต็ม", userName],
                  ["ที่อยู่อีเมล", userEmail],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center bg-[hsl(var(--card))]"
                  >
                    <dt className="text-sm font-medium text-[hsl(var(--small-detail))] sm:w-1/3 mb-1 sm:mb-0">
                      {k}
                    </dt>
                    <dd className="text-sm sm:w-2/3">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">ความปลอดภัย</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 rounded-lg font-medium transition
                  bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]
                  hover:opacity-90
                  focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))] hover:cursor-pointer"
              >
                ออกจากระบบ
              </button>

              <button
                onClick={handleCopyEmail}
                className="px-6 py-2.5 rounded-lg font-medium transition
                  bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]
                  hover:bg-[hsl(var(--hover))]
                  focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))] hover:cursor-pointer"
              >
                คัดลอก อีเมล
              </button>
            </div>
          </section>

          {/* Actions */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">การดำเนินการ</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleBackToHome}
                className="px-6 py-2.5 rounded-lg font-medium transition
                  bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]
                  hover:bg-[hsl(var(--primary-hover))]
                  focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))] hover:cursor-pointer"
              >
                กลับไปหน้าหลัก
              </button>

              <button
                onClick={handleEditProfile}
                className="px-6 py-2.5 rounded-lg font-medium transition
                  bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]
                  hover:bg-[hsl(var(--hover))]
                  focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))] hover:cursor-pointer"
              >
                แก้ไขโปรไฟล์
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <div
          className="fixed bottom-6 right-6 rounded-lg shadow-2xl px-5 py-3 flex items-center gap-3
          border border-[hsl(var(--border))]
          bg-[hsl(var(--popover))] text-[hsl(var(--popover-foreground))]
          animate-in slide-in-from-bottom-5 duration-300"
        >
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-full
              bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
            aria-hidden="true"
          >
            ✓
          </span>
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
