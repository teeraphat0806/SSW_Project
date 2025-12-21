"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

  const user = session?.user;

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
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <div className="w-full max-w-4xl rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-elevation)] overflow-hidden">
          <div className="p-8 bg-[hsl(var(--primary))]">
            <div className="flex flex-col items-center animate-pulse">
              <div className="w-32 h-32 rounded-full bg-black/10 dark:bg-white/10 mb-4" />
              <div className="h-7 w-52 rounded bg-black/10 dark:bg-white/10 mb-2" />
              <div className="h-4 w-36 rounded bg-black/10 dark:bg-white/10 mb-2" />
              <div className="h-4 w-44 rounded bg-black/10 dark:bg-white/10" />
            </div>
          </div>

          <div className="p-8 animate-pulse">
            <div className="h-6 w-40 rounded bg-[hsl(var(--muted))] mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--aa))] p-4"
                >
                  <div className="h-4 w-24 rounded bg-[hsl(var(--muted))] mb-2" />
                  <div className="h-6 w-32 rounded bg-[hsl(var(--muted))]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (status === "unauthenticated" || !user) return null;

  // Optional data
  const userId = (user as any)?.id as string | undefined; // (ถ้าคุณ extend NextAuth types แล้ว ค่อยถอด any ออก)
  const phone = (user as any)?.phone as string | undefined;
  const companyName = (user as any)?.company?.name as string | undefined;
  const taxId = (user as any)?.company?.taxId as string | undefined;
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
              <h2 className="text-2xl font-semibold">Overview</h2>
              <p className="text-sm text-[hsl(var(--small-detail))]">
                Manage your account info and security
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--aa))] p-4">
                <p className="text-sm font-medium text-[hsl(var(--small-detail))] mb-1">
                  Account Status
                </p>
                <p className="text-lg font-bold">Active</p>
              </div>

              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--aa))] p-4">
                <p className="text-sm font-medium text-[hsl(var(--small-detail))] mb-1">
                  Role
                </p>
                <p className="text-lg font-bold">{userRole}</p>
              </div>

              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--aa))] p-4">
                <p className="text-sm font-medium text-[hsl(var(--small-detail))] mb-1">
                  Last Login
                </p>
                <p className="text-lg font-bold">{formatDate(lastLoginAt)}</p>
              </div>

              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--aa))] p-4">
                <p className="text-sm font-medium text-[hsl(var(--small-detail))] mb-1">
                  Member Since
                </p>
                <p className="text-lg font-bold">{formatDate(createdAt)}</p>
              </div>
            </div>
          </section>

          {/* Details */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Account Details</h2>

            <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden">
              <dl className="divide-y divide-[hsl(var(--border))]">
                {[
                  ["User ID", userId || "-"],
                  ["Full Name", userName],
                  ["Email Address", userEmail],
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
            <h2 className="text-2xl font-semibold mb-4">Security</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 rounded-lg font-medium transition
                  bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]
                  hover:opacity-90
                  focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
              >
                Logout
              </button>

              <button
                onClick={handleCopyEmail}
                className="px-6 py-2.5 rounded-lg font-medium transition
                  bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]
                  hover:bg-[hsl(var(--hover))]
                  focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
              >
                Copy Email
              </button>
            </div>
          </section>

          {/* Actions */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleBackToHome}
                className="px-6 py-2.5 rounded-lg font-medium transition
                  bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]
                  hover:bg-[hsl(var(--primary-hover))]
                  focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
              >
                Back to Home
              </button>

              <button
                onClick={handleEditProfile}
                className="px-6 py-2.5 rounded-lg font-medium transition
                  bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]
                  hover:bg-[hsl(var(--hover))]
                  focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
              >
                Edit Profile
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
