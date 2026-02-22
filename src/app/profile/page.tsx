"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "next-auth";
import ProfileHeader from "@/components/profile/ProfileHeader";

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
      2000,
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

  const handleLogout = () => signOut({ callbackUrl: "/" });
  const handleCopyEmail = () => {
    if (!user?.email) return;
    navigator.clipboard.writeText(user.email);
    setToast({ show: true, message: "Email copied to clipboard!" });
  };
  const handleEditProfile = () => router.push("/profile/edit");
  const handleBackToHome = () => router.push("/dashboard");

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
    <div className="min-h-screen mt-12 md:mt-0 lg:mt-0 items-center justify-center  bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <ProfileHeader
        userName={userName}
        userEmail={userEmail}
        userImage={user.image}
        initials={initials}
      />

      <div className="flex md:ml-32 lg:ml-32">
        <div className="w-full max-w-4xl bg-[hsl(var(--card))] shadow-[var(--shadow-elevation)] overflow-hidden">
          {/* Header */}

          {/* Body */}
          <div className="p-8">
            {/* Details */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">รายละเอียดบัญชี</h2>

              <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden">
                <dl className="divide-y divide-[hsl(var(--border))]">
                  {[
                    ["ชื่อเต็ม", userName],
                    ["ที่อยู่อีเมล", userEmail],
                    ["ตำเเหน่ง", userRole],
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

            {/* Security all */}
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
                  onClick={handleBackToHome}
                  className="px-6 py-2.5 rounded-lg font-medium transition
                  bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]
                  hover:bg-[hsl(var(--primary-hover))]
                  focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))] hover:cursor-pointer"
                >
                  กลับไปหน้าหลัก
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
    </div>
  );
}
