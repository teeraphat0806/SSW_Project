"use client";

import {
  Home,
  ClipboardList,
  Users,
  LogOut,
  MessageCircle,
  UserRound,
  Boxes,
  Moon,
  Sun,
  BaggageClaim,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import * as Avatar from "@radix-ui/react-avatar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "../components/Logo";
import type { Session } from "next-auth";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const MENU_ITEMS = [
  {
    category: "ภาพรวม",
    items: [
      { label: "แดชบอร์ด", icon: <Home size={20} />, href: "/dashboard" },
    ],
  },
  {
    category: "บริหารจัดการ",
    items: [
      {
        label: "ลูกค้า",
        icon: <UserRound size={20} />,
        href: "/customer-Dashboard",
      },
      { label: "สินค้า", icon: <Boxes size={20} />, href: "/steel-Dashboard" },
      {
        label: "ยอดขาย",
        icon: <ClipboardList size={20} />,
        href: "/saledashboard2",
      },
      {
        label: "เบิกรายจ่าย",
        icon: <BaggageClaim size={20} />,
        href: "/expenseDashboard",
      },
    ],
  },
  {
    category: "ภายในองค์กร",
    items: [{ label: "พนักงาน", icon: <Users size={20} />, href: "/payroll" }],
  },
  {
    category: "ช่วยเหลือ",
    items: [
      {
        label: "คุยกับบอท",
        icon: <MessageCircle size={20} />,
        href: "/chatbot",
      },
    ],
  },
];

export default function Sidebar() {
  const { data: session, status } = useSession();
  const user = session?.user as Session["user"];
  const [expanded, setExpanded] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  if (status !== "authenticated" || !session?.user) return null;

  const toggleSidebar = () => setExpanded((prev) => !prev);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentTheme = resolvedTheme === "dark" ? "dark" : "light";
    setTheme(currentTheme === "light" ? "dark" : "light");
  };

  return (
    <aside
      onClick={toggleSidebar}
      className={`fixed top-0 left-0 z-50 flex h-screen cursor-pointer flex-col border-r bg-background shadow-md transition-all duration-300 overflow-x-hidden overflow-y-hidden ${
        expanded ? "w-80" : "w-24"
      }`}
    >
      <div className="h-24 shrink-0 overflow-hidden px-4 flex items-center justify-start">
        <div className="min-w-0 flex items-center gap-3">
          <div
            className={`shrink-0 ${expanded ? "[&_svg]:w-16 [&_svg]:h-16" : "[&_svg]:w-14 [&_svg]:h-14"}`}
          >
            <Logo />
          </div>
          <span
            className={`whitespace-nowrap text-lg font-bold transition-opacity duration-300 ${
              expanded ? "opacity-100" : "opacity-0"
            }`}
          >
            SSW Steel Center
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-3 space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
        {MENU_ITEMS.map((group, idx) => (
          <div
            key={group.category}
            className={
              idx < MENU_ITEMS.length - 1
                ? "pb-3 mb-1 border-b border-border/80"
                : ""
            }
          >
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    expanded={expanded}
                    active={isActive}
                  />
                );
              })}

              {idx === MENU_ITEMS.length - 1 && (
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`group relative w-full rounded-lg py-2.5 px-3 flex items-center transition-all duration-200 text-foreground hover:bg-accent hover:text-accent-foreground ${
                    expanded ? "justify-start" : "justify-center"
                  }`}
                  title={`Theme: ${resolvedTheme === "dark" ? "Dark" : "Light"}`}
                >
                  <div className="text-muted-foreground group-hover:text-accent-foreground">
                    {mounted && resolvedTheme === "dark" ? (
                      <Sun size={20} />
                    ) : (
                      <Moon size={20} />
                    )}
                  </div>
                  <span
                    className={`ml-3 overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 ${
                      expanded ? "w-auto opacity-100" : "w-0 hidden opacity-0"
                    }`}
                  >
                    โหมดธีม
                  </span>
                  {expanded && (
                    <span className="ml-auto rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                      {resolvedTheme === "dark" ? "Dark" : "Light"}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t bg-background/50 p-3 backdrop-blur-sm">
        <div
          className={`rounded-lg bg-secondary/20 p-2 flex items-center gap-3 transition-colors hover:bg-secondary/40 ${
            expanded ? "" : "justify-center"
          }`}
        >
          <Avatar.Root className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-gray-200">
            <Avatar.Image
              src={
                user.image ||
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRA1YK7AzLFlNa7rz_sxokNpo7RO-PHrJpvJQ&s"
              }
              alt={user.name ?? "User"}
              className="h-full w-full object-cover"
            />
            <Avatar.Fallback className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-sm">
              {user.name?.slice(0, 2).toUpperCase()}
            </Avatar.Fallback>
          </Avatar.Root>

          {expanded && (
            <div className="min-w-0 flex-1 overflow-hidden">
              <Link
                href="/profile"
                className="block truncate"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="truncate text-sm font-semibold hover:underline">
                  {user.name}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {user.role || "พนักงาน"}
                </p>
              </Link>
            </div>
          )}

          {expanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                signOut({ callbackUrl: "/" });
              }}
              className="p-1 text-muted-foreground transition-colors hover:text-red-500"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  href,
  expanded,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  expanded: boolean;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center rounded-lg py-2.5 px-3 transition-all duration-200 ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-foreground hover:bg-accent hover:text-accent-foreground"
      } ${expanded ? "justify-start" : "justify-center"}`}
    >
      <div
        className={
          active
            ? "text-primary-foreground"
            : "text-muted-foreground group-hover:text-accent-foreground"
        }
      >
        {icon}
      </div>

      <span
        className={`ml-3 overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 ${
          expanded ? "w-auto opacity-100" : "w-0 hidden opacity-0"
        }`}
      >
        {label}
      </span>

      {!expanded && (
        <div className="absolute left-full top-1/2 z-50 ml-4 -translate-y-1/2 invisible whitespace-nowrap rounded border bg-popover px-2 py-1 text-sm text-popover-foreground opacity-0 shadow-md transition-all group-hover:visible group-hover:opacity-100">
          {label}
        </div>
      )}
    </Link>
  );
}
