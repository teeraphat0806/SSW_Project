// src/components/SearchDebounce.tsx
import { Search } from "lucide-react";
import React from "react";
import { useDebounce } from "@uidotdev/usehooks";

interface SearchBoxProps {
  onSearchChange?: (value: string) => void;
  placeholder?: string;
  resetKey?: number;
}

export default function SearchDebounce({
  onSearchChange,
  placeholder,
  resetKey,
}: SearchBoxProps) {
  const [search, setSearch] = React.useState("");

  const debounce = useDebounce(search, 400);

  React.useEffect(() => {
    console.log("Debounced Search Value:", debounce);
    onSearchChange?.(debounce);
  }, [debounce]);

  React.useEffect(() => {
    setSearch("");
  }, [resetKey]);

  return (
    <>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors"
        size={18}
      />
      <input
        type="text"
        placeholder={placeholder || "ค้นหา..."}
        className="w-full pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
        }}
      />
    </>
  );
}
