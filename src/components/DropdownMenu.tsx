// ModeDropdown.tsx
"use client";
import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export type Mode = "view" | "createData" | "editData";

export function ModeDropdown({
  value,
  onChange,
  className,
}: {
  value: Mode;
  onChange: (m: Mode) => void;
  className?: string;
}) {
  const label =
    value === "view"
      ? "ดูข้อมูล"
      : value === "createData"
      ? "เพิ่มข้อมูล"
      : "แก้ไขข้อมูล";

  return (
    <div className={className ?? "p-1"}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="inline-flex items-center gap-2 rounded-3xl bg-white px-3 py-2 hover:cursor-pointer text-sm text-gray-900 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700 dark:hover:bg-gray-700"
            aria-label="เลือกโหมด"
          >
            {label}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={6}
            className="min-w-[220px] rounded-md bg-white p-1 shadow-[0_10px_30px_rgba(0,0,0,0.15)] ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800"
          >
            <DropdownMenu.RadioGroup
              value={value}
              onValueChange={(v) => onChange(v as Mode)}
            >
              {[
                { v: "view", label: "ดูข้อมูล" },
                { v: "createData", label: "เพิ่มข้อมูล" },
                { v: "editData", label: "แก้ไขข้อมูล" },
              ].map((o) => (
                <DropdownMenu.RadioItem
                  key={o.v}
                  value={o.v}
                  className="relative flex cursor-pointer select-none items-center rounded-md pl-8 pr-3 py-2 text-sm text-gray-800 outline-none hover:bg-gray-100 data-[highlighted]:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  <DropdownMenu.ItemIndicator className="absolute left-2 inline-flex h-4 w-4 items-center justify-center">
                    <svg
                      viewBox="0 0 20 20"
                      className="h-4 w-4 text-blue-600 dark:text-blue-400"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M7.629 13.233 3.9 9.504l1.4-1.4 2.329 2.328 6.17-6.17 1.4 1.4-7.57 7.57z" />
                    </svg>
                  </DropdownMenu.ItemIndicator>
                  {o.label}
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
            <DropdownMenu.Arrow className="fill-white dark:fill-gray-900" />
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
