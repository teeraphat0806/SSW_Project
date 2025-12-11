"use client";

import { Home, ClipboardList, Users, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import * as Avatar from "@radix-ui/react-avatar";
import Link from "next/link";
import Logo from "../components/Logo";
import ThemeToggle from "../components/ThemeToggle";

export default function Sidebar() {
  const { data: session, status } = useSession();

  if (status !== "authenticated" || !session?.user) return null;

  return (
    <aside className=" flex flex-col justify-between print:hidden group fixed top-0 left-0 h-full w-24 hover:w-64 bg-background shadow-md transition-all duration-300 z-50 overflow-hidden">
      <div>
        {/* Top - Logo */}
        <div className="flex items-center justify-center h-24 ">
          <Logo />
          <h1 className="hidden group-hover:inline text-lg font-bold ml-2">
            SSW Steel Center
          </h1>
        </div>
        {/* Menu */}
        <nav className="flex flex-col space-y-1 px-2">
          <SidebarItem
            icon={<Home className="text-foreground" />}
            label="Dashboard"
            href="/dashboard"
          />
          <SidebarItem
            icon={<ClipboardList className="text-foreground" />}
            label="Orders"
            href="/orders"
          />
          <SidebarItem
            icon={<Users className="text-foreground" />}
            label="Staffs"
            href="/staff"
          />
          <ThemeToggle />
        </nav>
      </div>

      {/* Bottom - Avatar & Logout */}
      <div className="flex flex-col items-center px-2 py-4 border-t">
        <div className="flex items-center gap-2 group-hover:justify-start w-full">
          <Avatar.Root className="w-17 h-17 rounded-full bg-gray-300 overflow-hidden">
            {session.user.image ? (
              <Avatar.Image
                src={session.user.image}
                alt={session.user.name ?? "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <Avatar.Image
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRA1YK7AzLFlNa7rz_sxokNpo7RO-PHrJpvJQ&s"
                alt={session.user.name ?? "User"}
                className="w-full h-full object-cover"
              />
            )}
          </Avatar.Root>
          <span className="hidden group-hover:inline text-sm font-medium truncate">
            <div className="px-2 py-1 border-b">
              <p className="text-sm">
                <span className="font-bold">ชื่อ:</span> {session.user.name}
              </p>
              <p className="text-xs">
                <span className="font-bold">อีเมล:</span> {session.user.email}
              </p>
              <p className="text-xs">
                <span className="font-bold">ตำเเหน่ง:</span>{" "}
                {session.user?.role}
              </p>
            </div>
          </span>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-3 flex items-center gap-2 text-red-600 hover:bg-red-50 hover:cursor-pointer rounded px-2 py-1 w-full group-hover:justify-start"
        >
          <LogOut size={18} />
          <span className="hidden group-hover:inline text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground hover:bg-gray-400 transition-colors duration-200"
    >
      {icon}
      <span className="hidden group-hover:inline text-sm">{label}</span>
    </Link>
  );
}
