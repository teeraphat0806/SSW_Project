"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "unauthenticated") {
    router.push("/");
  }

  // 👇 บังคับให้ TS รู้ว่า user ตัวนี้มี role แน่นอน
  const user = session?.user as Session["user"];

  return (
    status === "authenticated" &&
    user && (
      <div className="flex h-screen items-center justify-center">
        <div className="bg-white p-6 rounded-md shadow-md">
          <p>
            Welcome, <b>{user.name}!</b>
          </p>
          <p>Email: {user.email}</p>
          <p>Role: {user.role}</p>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full bg-blue-500 text-white py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    )
  );
}
