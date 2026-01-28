import React, { useMemo, useState, useRef, useEffect } from "react";
import { X, Plus, Trash2, Search, ChevronDown, Calculator } from "lucide-react";
import { set } from "zod";
import { createPortal } from "react-dom";
// --- Types ---
type SteelItemApi = {
  id: number;
  codeSteel: string;
  shape: "line" | "square";
  amount: number;
  price: number;
  density: number;
  status: "active" | "inactive" | string;
};

type CalcRow = {
  rowId: string;
  steelId?: number;
  qty: number;
  thickness: number;
  width?: number;
  length: number;
};

// --- Helpers ---
function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function toNum(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// --- Sub-component: Searchable Steel Select ---

function SteelSearchSelect({
  steels,
  value,
  onChange,
}: {
  steels: SteelItemApi[];
  value?: number;
  onChange: (id: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedSteel = steels.find((s) => s.id === value);

  const filtered = useMemo(() => {
    return steels.filter((s) =>
      s.codeSteel.toLowerCase().includes(search.toLowerCase()),
    );
  }, [steels, search]);

  // --- ตำแหน่ง dropdown (fixed) ---
  const [pos, setPos] = useState<{ left: number; top: number; width: number }>({
    left: 0,
    top: 0,
    width: 0,
  });

  const updatePos = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({
      left: rect.left,
      top: rect.bottom + 6, // เว้นระยะจากปุ่ม
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePos();

    const onScroll = () => updatePos();
    const onResize = () => updatePos();

    // capture scroll จากทุก parent ที่ scroll ได้
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ปิดด้วย ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-blue-500 transition-all focus:ring-2 focus:ring-blue-500/20 outline-none"
      >
        <span
          className={
            selectedSteel ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"
          }
        >
          {selectedSteel
            ? `${selectedSteel.codeSteel} (${
                selectedSteel.shape === "square" ? "แผ่น" : "เส้น"
              })`
            : "ค้นหาเหล็ก..."}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-[9999]"
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
            }}
          >
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
              <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-zinc-400" />
                <input
                  autoFocus
                  className="w-full bg-transparent outline-none text-sm p-1 text-zinc-900 dark:text-zinc-100"
                  placeholder="พิมพ์เพื่อค้นหา..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="max-h-60 overflow-y-auto">
                {filtered.length > 0 ? (
                  filtered.map((s) => (
                    <div
                      key={s.id}
                      className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 flex flex-col ${
                        value === s.id
                          ? "bg-blue-50/50 dark:bg-blue-900/10"
                          : ""
                      }`}
                      onClick={() => {
                        onChange(s.id);
                        setIsOpen(false);
                        setSearch("");
                      }}
                    >
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {s.codeSteel} ({s.shape === "square" ? "แผ่น" : "เส้น"})
                      </span>
                      <span className="text-sm text-zinc-500">
                        ความหนาแน่น: {s.density} | ราคาต่อหน่วย: {s.price}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-zinc-400 text-sm">
                    ไม่พบข้อมูล
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

// --- Main Modal ---
export function SteelCalculatorModal({
  open,
  onClose,
  steels,
}: {
  open: boolean;
  onClose: () => void;
  steels: SteelItemApi[];
}) {
  const [rows, setRows] = useState<CalcRow[]>([
    { rowId: uid(), steelId: undefined, qty: 1, thickness: 0, length: 0 },
  ]);

  const getSteel = (id?: number) => steels.find((s) => s.id === id);

  const Reset = () => {
    setRows([
      {
        rowId: uid(),
        steelId: undefined,
        qty: 1,
        thickness: 0,
        length: 0,
      },
    ]);
  };

  const calcWeight = (row: CalcRow) => {
    const s = getSteel(row.steelId);
    if (!s) return 0;
    const { thickness: t, length: l } = row;
    const d = s.density;
    return s.shape === "square"
      ? t * (row.width ?? 0) * l * d * 0.1
      : t * l * l * d * 0.1;
  };

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        const s = getSteel(r.steelId);
        const qty = Math.max(1, r.qty || 1);
        const w = calcWeight(r);
        const p = s ? w * s.price : 0;
        return {
          totalWeight: acc.totalWeight + w * qty,
          totalPrice: acc.totalPrice + p * qty,
        };
      },
      { totalWeight: 0, totalPrice: 0 },
    );
  }, [rows]);

  const updateRow = (rowId: string, patch: Partial<CalcRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)),
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-6xl max-h-[90vh] mx-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                คำนวณราคาและน้ำหนักเหล็ก
              </h2>
              <p className="text-sm text-zinc-500">
                เลือกชนิดเหล็กและกรอกขนาดเพื่อสรุปผลทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Info Bar */}
        <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setRows([
                  ...rows,
                  {
                    rowId: uid(),
                    steelId: undefined,
                    qty: 1,
                    thickness: 0,
                    length: 0,
                  },
                ])
              }
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" /> เพิ่มรายการเหล็ก
            </button>
            <button
              onClick={Reset}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-red-500/20 active:scale-95"
            >
              รีเซ็ตทั้งหมด
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm text-zinc-500 uppercase tracking-wider font-bold">
                น้ำหนักรวมทั้งหมด
              </p>
              <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                {totals.totalWeight.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}{" "}
                <span className="text-sm font-normal text-zinc-400">กก.</span>
              </p>
            </div>
            <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800" />
            <div className="text-right">
              <p className="text-sm text-zinc-500 uppercase tracking-wider font-bold">
                ราคารวมโดยประมาณ
              </p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                ฿
                {totals.totalPrice.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-sm text-zinc-400 font-medium">
                <th className="px-4 pb-2 w-[350px]">ชนิดเหล็ก</th>
                <th className="px-4 pb-2 text-center">จำนวน</th>
                <th className="px-4 pb-2">ขนาด (หนา x กว้าง x ยาว)</th>
                <th className="px-4 pb-2 text-right">น้ำหนัก/ชิ้น</th>
                <th className="px-4 pb-2 text-right">ราคารวมแถว</th>
                <th className="px-4 pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const s = getSteel(r.steelId);
                const w = calcWeight(r);
                const p = s ? w * s.price : 0;
                const qty = Math.max(1, r.qty || 1);

                return (
                  <tr key={r.rowId} className="group">
                    <td className="bg-zinc-50 dark:bg-zinc-900 px-4 py-3 rounded-l-2xl border-y border-l border-zinc-100 dark:border-zinc-800/50">
                      <SteelSearchSelect
                        steels={steels}
                        value={r.steelId}
                        onChange={(id) => {
                          const target = steels.find((x) => x.id === id);
                          updateRow(r.rowId, {
                            steelId: id,
                            width: target?.shape === "square" ? 0 : undefined,
                          });
                        }}
                      />
                    </td>
                    <td className="bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border-y border-zinc-100 dark:border-zinc-800/50">
                      <input
                        type="number"
                        min={1}
                        className="w-16 text-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-1.5 text-sm focus:border-blue-500 outline-none"
                        value={r.qty}
                        onChange={(e) =>
                          updateRow(r.rowId, { qty: toNum(e.target.value) })
                        }
                      />
                    </td>
                    <td className="bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border-y border-zinc-100 dark:border-zinc-800/50">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="หนา"
                          className="w-20 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-sm outline-none"
                          value={r.thickness}
                          onChange={(e) =>
                            updateRow(r.rowId, {
                              thickness: toNum(e.target.value),
                            })
                          }
                        />
                        <span className="text-zinc-400 text-sm">×</span>
                        {s?.shape === "square" ? (
                          <input
                            type="number"
                            placeholder="กว้าง"
                            className="w-20 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-sm outline-none"
                            value={r.width}
                            onChange={(e) =>
                              updateRow(r.rowId, {
                                width: toNum(e.target.value),
                              })
                            }
                          />
                        ) : (
                          <span className="w-20 text-center text-zinc-300 dark:text-zinc-700">
                            —
                          </span>
                        )}
                        <span className="text-zinc-400 text-sm">×</span>
                        <input
                          type="number"
                          placeholder="ยาว"
                          className="w-20 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-sm outline-none"
                          value={r.length}
                          onChange={(e) =>
                            updateRow(r.rowId, {
                              length: toNum(e.target.value),
                            })
                          }
                        />
                      </div>
                    </td>
                    <td className="bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border-y border-zinc-100 dark:border-zinc-800/50 text-right font-mono text-zinc-600 dark:text-zinc-400">
                      {w.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border-y border-zinc-100 dark:border-zinc-800/50 text-right font-bold text-zinc-900 dark:text-zinc-100">
                      {(p * qty).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="bg-zinc-50 dark:bg-zinc-900 px-4 py-3 rounded-r-2xl border-y border-r border-zinc-100 dark:border-zinc-800/50">
                      <button
                        onClick={() =>
                          setRows(rows.filter((item) => item.rowId !== r.rowId))
                        }
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-zinc-400">
                ยังไม่มีรายการเหล็ก กดปุ่ม "เพิ่มรายการเหล็ก" เพื่อเริ่มคำนวณ
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={onClose}
            className="px-8 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          >
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
}
