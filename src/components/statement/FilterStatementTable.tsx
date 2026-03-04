import { X } from "lucide-react";
import SearchDebounce from "@/components/SearchDebounce";

interface FilterStatementTableProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClearFilters: () => void;
}

export default function FilterStatementTable({
  searchTerm,
  onSearchChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
}: FilterStatementTableProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 mb-6">
      {/* เปลี่ยน items-end เป็น items-center หรือ items-end ตามความเหมาะสม แต่ Grid จัดการเรื่องความสูงไว้แล้ว */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Search: หน้าจอ iPad (md) ให้กินพื้นที่ครึ่งจอ (6/12), จอใหญ่ (lg) ให้กิน 5/12 */}
        <div className="md:col-span-6 lg:col-span-4">
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
            ค้นหา
          </label>
          <div className="relative group">
            <SearchDebounce
              placeholder="ชื่อลูกค้า, เลขที่ Statement"
              onSearchChange={onSearchChange}
            />
            {/* <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="ชื่อลูกค้า, เลข PO ,  รหัสออเดอร์"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              /> */}
          </div>
        </div>

        <div className="md:col-span-12 lg:col-span-4 flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
              เริ่มต้น
            </label>
            <input
              /* เทคนิค: ถ้ามีค่าให้เป็น date, ถ้าไม่มีค่าให้เป็น text เพื่อโชว์ placeholder */
              type={dateFrom ? "date" : "text"}
              placeholder="วว/ดด/ปปปป"
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => {
                if (!e.target.value) e.target.type = "text";
              }}
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-400"
              max={new Date().toISOString().split("T")[0]}
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
              สิ้นสุด
            </label>
            <input
              type={dateTo ? "date" : "text"}
              placeholder="วว/ดด/ปปปป"
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => {
                if (!e.target.value) e.target.type = "text";
              }}
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-400"
              min={dateFrom}
              max={new Date().toISOString().split("T")[0]}
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
            />
          </div>

          <button
            onClick={onClearFilters}
            className="h-10 self-end px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950/50 text-red-500 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95 inline-flex shrink-0 items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap"
            title="ล้างตัวกรอง"
          >
            <X size={16} />
            <span>ล้าง</span>
          </button>
        </div>
      </div>
    </div>
  );
}
