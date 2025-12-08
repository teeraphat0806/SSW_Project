"use client";
import { useEffect, useState } from "react";
import { Switch } from "radix-ui";

import { Sun, Moon } from "lucide-react";
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark");
    setTheme(newTheme);
  };

  return (
    <div className="flex px-3 py-2 items-center space-x-3">
      <label className="text-sm" htmlFor="theme-switch">
        {theme === "light" ? <Moon size={30} /> : <Sun size={30} />}
      </label>
      {isMobile ? (
        <Switch.Root
          id="theme-switch"
          checked={theme === "dark"}
          onCheckedChange={toggleTheme}
          className="w-12 h-6 bg-gray-300 rounded-full relative data-[state=checked]:bg-[hsl(var(--primary))] transition-colors"
        >
          <Switch.Thumb className="block w-5 h-5 bg-white rounded-full shadow absolute top-0.5 left-0.5 transition-transform data-[state=checked]:translate-x-6" />
        </Switch.Root>
      ) : (
        <span className="hidden group-hover:inline text-sm font-medium truncate">
          <Switch.Root
            id="theme-switch"
            checked={theme === "dark"}
            onCheckedChange={toggleTheme}
            className="w-12 h-6 bg-gray-300 rounded-full relative data-[state=checked]:bg-[hsl(var(--primary))] transition-colors"
          >
            <Switch.Thumb className="block w-5 h-5 bg-white rounded-full shadow absolute top-0.5 left-0.5 transition-transform data-[state=checked]:translate-x-6" />
          </Switch.Root>
        </span>
      )}
    </div>
    // <button
    //   onClick={toggleTheme}
    //   className="
    //     px-4 py-2 rounded
    //     bg-[hsl(var(--primary))]
    //     text-[hsl(var(--primary-foreground))]
    //     hover:bg-[hsl(var(--primary-hover))]
    //     transition
    //   "
    // >
    //   Switch to {theme === 'light' ? 'Dark' : 'Light'}
    // </button>
  );
}
