"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Eye,
  Trash2,
  Square,
  Minus,
  ArrowUpDown,
  Loader2,
  AlertCircle,
  Plus,
  X,
  PackageMinus,
  MoreVertical,
  PlusSquare,
  Pencil,
  PackagePlus,
} from "lucide-react";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import { toast } from "react-toastify";
import { z } from "zod";
import CreateSteelTypeModal from "@/components/steel-Dashboard/CreateSteelTypeModal";
import SteelTypeDetailModal from "@/components/steel-Dashboard/steelTypeDetailModal";

// ✅ ถ้าโปรเจคคุณมี Prisma enum จริง ให้ import แบบนี้
// import { ShapeSteel } from "@prisma/client";

// ✅ ถ้า import enum จาก prisma ใน client แล้วมีปัญหา bundling
// ใช้ union แบบนี้แทนก็ได้ (ปลอดภัยสุดสำหรับ client)
const ShapeSteelEnum = z.enum(["line", "square"]);

const SteelTypeSchema = z.object({
  codeSteel: z.string().min(1, "กรุณาระบุรหัสเหล็ก"),
  detail: z.string().optional(),
  shape: ShapeSteelEnum, // line | square
  price: z.number().min(1, "กรุณาระบุราคาต่อหน่วย"),
  density: z.number().min(0.00001, "กรุณาระบุความหนาแน่น"),
});

type SteelTypeForm = z.infer<typeof SteelTypeSchema>;

type SteelItemApi = {
  id: number;
  codeSteel: string;
  shape: "line" | "square" | string;
  amount: number;
  price: number;
  status: "active" | "inactive" | string;
  _count?: { Product?: number };
};

const SteelListPage = () => {
  // State จัดการข้อมูล
  const [steels, setSteels] = useState<SteelItemApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State สำหรับ Filter/Sort
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc" as "asc" | "desc",
  });

  //เบิดปิดสร้างลูกค้า
  const [openCreate, setOpenCreate] = useState(false);

  //เบิดปิดเมนูแต่ละแถว
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  //ทำไว้เผื่อเปิดดูรายละเอียด/สต็อก
  const [selectedSteelId, setSelectedSteelId] = useState<number | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openOut, setOpenOut] = useState(false);

  const confirm = useConfirm();

  // ฟังก์ชันดึงข้อมูลจาก API
  const fetchSteels = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        search,
        sort: sortConfig.key,
        order: sortConfig.direction,
      });

      const response = await fetch(`/api/steelType?${params.toString()}`);

      if (!response.ok) throw new Error("Failed to fetch data");

      const data = await response.json();
      setSteels(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
      setSteels([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, sortConfig]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSteels();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [fetchSteels]);

  // ฟังก์ชันลบข้อมูล
  const handleDelete = async ({
    steeltypeId,
    codeSteel,
  }: {
    steeltypeId: number;
    codeSteel: string;
  }) => {
    const isConfirmed = await confirm({
      title: "ยืนยันการลบข้อมูลเหล็กประเภทนี้หรือไม่?",
      description: `รหัสเหล็ก: ${codeSteel} การลบนี้ไม่สามารถกู้คืนได้และจะลบข้อมูลสต็อกทั้งหมดที่เกี่ยวข้องด้วย`,
      variant: "destructive",
      confirmText: "ลบข้อมูล",
      cancelText: "ยกเลิก",
    });
    if (!isConfirmed) return;

    try {
      const response = await fetch(`/api/steelType/${steeltypeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchSteels();
        toast.success("ลบประเภทเหล็กสำเร็จ", { position: "bottom-right" });
      } else {
        toast.error("ลบประเภทเหล็กไม่สำเร็จ", { position: "bottom-right" });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", {
        position: "bottom-right",
      });
    }
  };

  // ฟังก์ชันเลือก Icon ตาม Shape
  const getShapeIcon = (shape: string) => {
    if (shape === "square") return <Square className="w-5 h-5 text-blue-500" />;
    if (shape === "line") return <Minus className="w-5 h-5 text-green-500 " />;
    return <span className="text-gray-400">-</span>;
  };

  // ฟังก์ชันเปลี่ยน Sort
  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 p-6 font-sans transition-colors duration-300">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">รายการประเภทเหล็ก</h1>
          <p className="text-md text-gray-500 dark:text-zinc-400">
            จัดการข้อมูลและสต็อกสินค้า
          </p>
        </div>

        {/* ✅ Add button */}
        <button
          onClick={() => setOpenCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          เพิ่มประเภทเหล็ก
        </button>
      </div>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900/60 p-4 rounded-xl shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center border border-gray-100 dark:border-zinc-800">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-5 h-5" />
          <input
            type="text"
            placeholder="ค้นหารหัสเหล็ก..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-zinc-950/60 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors text-md"
          />
        </div>

        <div className="text-md text-gray-500 dark:text-zinc-400 flex items-center gap-2">
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          )}
          <span className="hidden sm:inline">
            เรียงตาม:{" "}
            <span className="font-medium text-gray-700 dark:text-zinc-400 capitalize">
              {sortConfig.key}
            </span>
          </span>
          <span className="bg-gray-100 dark:bg-zinc-800/60 px-2 py-1 rounded text-xs">
            ทั้งหมด {steels.length} รายการ
          </span>
        </div>
      </div>

      {/* Table Section */}
      <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900/50 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-zinc-800 min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-100 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-300">
                <th
                  className="p-4 font-semibold text-sm uppercase tracking-wider cursor-pointer group hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  onClick={() => handleSort("codeSteel")}
                >
                  <div className="flex items-center gap-1">
                    รหัสเหล็ก
                    <ArrowUpDown
                      className={`w-3 h-3 ${
                        sortConfig.key === "codeSteel"
                          ? "text-blue-500"
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                </th>

                <th
                  className="p-4 font-semibold text-sm uppercase tracking-wider cursor-pointer group hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  onClick={() => handleSort("shape")}
                >
                  <div className="flex items-center justify-center gap-1">
                    รูปร่าง
                    <ArrowUpDown
                      className={`w-3 h-3 ${
                        sortConfig.key === "shape"
                          ? "text-blue-500"
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                </th>

                <th
                  className="p-4 font-semibold text-sm uppercase tracking-wider cursor-pointer group hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center justify-center gap-1">
                    ปริมาณ (Stock)
                    <ArrowUpDown
                      className={`w-3 h-3 ${
                        sortConfig.key === "amount"
                          ? "text-blue-500"
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                </th>

                <th
                  className="p-4 font-semibold text-sm uppercase tracking-wider cursor-pointer group hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  onClick={() => handleSort("price")}
                >
                  <div className="flex items-center gap-1">
                    ราคา/หน่วย
                    <ArrowUpDown
                      className={`w-3 h-3 ${
                        sortConfig.key === "price"
                          ? "text-blue-500"
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                </th>

                <th className="p-4 font-semibold text-sm uppercase tracking-wider text-center">
                  สถานะ
                </th>
                <th className="p-4 font-semibold text-sm uppercase tracking-wider text-right">
                  จัดการ
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700/50 bg-white dark:bg-zinc-900 relative ">
              {isLoading && steels.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-400">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      <span>กำลังโหลดข้อมูล...</span>
                    </div>
                  </td>
                </tr>
              )}

              {error && !isLoading && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-red-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8" />
                      <span>เกิดข้อผิดพลาด: {error}</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                !error &&
                steels.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50 dark:hover:bg-zinc-800/40 transition-colors duration-150 "
                  >
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-blue-600 dark:text-blue-400 text-base">
                          {item.codeSteel}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          Product: {item._count?.Product || 0}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                          {getShapeIcon(item.shape)}
                        </div>
                        <span className="text-md text-gray-500 dark:text-gray-400 capitalize  xl:block">
                          {item.shape === "square" ? "แผ่น" : "เพลา"}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`font-medium  ${
                          item.amount === 0
                            ? "text-red-500"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {item.amount}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-gray-600 dark:text-gray-300">
                      {Number(item.price).toFixed(2)} ฿
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                      ${
                        item.status === "active"
                          ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                          : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600"
                      }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            item.status === "active"
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        ></span>
                        {item.status === "active" ? "ใช้งาน" : "ไม่ใช้งาน"}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* 1) ดูรายละเอียด/สต็อก */}
                        <button
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                          title="ดูรายละเอียด/สต็อก"
                          onClick={() => {
                            setSelectedSteelId(item.id);
                            setOpenDetail(true);
                          }}
                        >
                          <Eye className="w-5 h-5" />
                        </button>

                        {/* 3) เมนูเพิ่มเติม */}
                        <div className="relative">
                          <button
                            className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition"
                            title="เมนูเพิ่มเติม"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === item.id ? null : item.id,
                              )
                            }
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {openMenuId === item.id && (
                            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden z-20">
                              <button
                                className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800"
                                onClick={() => ({})}
                              >
                                <PackagePlus className="w-5 h-5 text-gray-500" />
                                รับสินค้าเข้าคลัง
                              </button>

                              <button
                                className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800"
                                onClick={() => ({})} // <- เปิด modal เบิกออก (ต้อง fetch list size)
                              >
                                <PackageMinus className="w-5 h-5 text-gray-500" />
                                เบิกออกจากคลัง
                              </button>

                              {item._count?.Product === 0 ? (
                                <button
                                  className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                                  onClick={() =>
                                    handleDelete({
                                      steeltypeId: item.id,
                                      codeSteel: item.codeSteel,
                                    })
                                  }
                                >
                                  <Trash2 className="w-5 h-5" />
                                  ลบประเภทเหล็ก
                                </button>
                              ) : (
                                <div className="px-3 py-2 text-xs text-gray-500 dark:text-zinc-400">
                                  ลบไม่ได้ (มีสินค้าใช้งานอยู่)
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {!isLoading && !error && steels.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <Search className="w-12 h-12 mb-3 opacity-20" />
              <p>ไม่พบข้อมูลเหล็กที่ค้นหา</p>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Create Modal */}
      <CreateSteelTypeModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={() => fetchSteels()}
      />

      <SteelTypeDetailModal
        open={openDetail}
        steelTypeId={selectedSteelId}
        onClose={() => setOpenDetail(false)}
        onUpdated={() => fetchSteels()}
      />
    </div>
  );
};

export default SteelListPage;
