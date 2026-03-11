"use client";
//src/app/create-new-quotation/page.tsx
import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { v4 as uuidv4 } from "uuid";
import { Separator } from "@/components/ui/separator";
import { ToastContainer, toast } from "react-toastify";
import CustomerForm from "@/components/create-new-quotation/CustomerForm";
import CustomerInfoBox from "@/components/newJobOrder/CustomerInfoBox";
import AddItem from "@/components/newJobOrder/AddItem";
import "../globals.css";
import {
  ArrowLeft,
  Calendar,
  ClipboardCheck,
  FileText,
  Layers,
  Package,
  Save,
  UploadCloud,
  User,
  UserPlus,
  X,
} from "lucide-react";
import SelectCustomer from "@/components/SelectCustomer";
import type { CustomerFormData } from "@/components/create-new-quotation/CustomerForm";
import { cn } from "@/lib/utils";

import { is } from "date-fns/locale";
import { CuttingMethod, ShapeSteel } from "@/types";
import { Item } from "@radix-ui/react-accordion";

const maxItem = 15;

type CustomerApiItem = {
  id: number;
  name: string;
};

type CustomerApiResponse = {
  data: CustomerApiItem[];
};

type HeadOrder = {
  quotationNo: string;
  credit: number | null;
  salesName: string;
  salesNameId: number;
  description: string | null;
  deliveryDate: string;
  createdAt: Date | null;
};
type SteelSelect = {
  id: number;
  steelType: string;
  shape: ShapeSteel;
  price: number;
  density: number;
};

type SteelItem = {
  id: string;
  SteelId: number;
  steelType: string;
  shape: ShapeSteel;
  sequence: number;
  wide: number | null;
  length: number;
  thickness: number;
  amount: number;
  detail?: string | null;
  cuttingMethod: CuttingMethod;
  weight?: number | null;
  price?: number;
  discount?: number | null;
  surfaceT?: string | null;
  toleranceT?: number | null;
  surfaceW?: string | null;
  toleranceW?: number | null;
  surfaceL?: string | null;
  toleranceL?: number | null;
  isOD: boolean;
  isServices: boolean;
  isPerAmount: boolean;
};

export default function CreateNewQuotationPage() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data customer
  const [formData, setFormData] = useState<CustomerFormData>({
    customerName: "",
    companyName: "",
    address: "",
    tel: "",
    fax: "",
  });
  const [headOrder, setheadOrder] = useState<HeadOrder>({
    quotationNo: "",
    credit: null,
    salesName: "J.Sirikarn",
    salesNameId: 1,
    description: null,
    deliveryDate: "",
    createdAt: new Date(),
  });
  const [showForm, setShowForm] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [searchCustomer, setSearchCustomer] = useState("");
  const [loading, setLoading] = useState(false);

  const [SteelItem, setSteelItem] = useState<SteelItem[]>([
    {
      id: "",
      SteelId: 0,
      steelType: "",
      shape: "square",
      sequence: 1,
      wide: null,
      length: 0,
      thickness: 0,
      amount: 0,
      detail: null,
      cuttingMethod: "normal",
      weight: null,
      price: 0,
      surfaceT: null,
      toleranceT: null,
      surfaceW: null,
      toleranceW: null,
      surfaceL: null,
      toleranceL: null,
      isOD: false,
      isServices: false,
      isPerAmount: false,
    },
  ]);

  const updateFormData = <Key extends keyof CustomerFormData>(
    field: Key,
    value: CustomerFormData[Key],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toDateInputValue = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const todayValue = toDateInputValue(new Date());

  // TODO: Replace with real data from API (id/name).
  const salesOptions = [
    { id: 1, name: "J.Sirikarn" },
    { id: 5, name: "A.Prapaporn" },
  ];

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const headerCustomerName = showForm
    ? formData.customerName
    : (selectedCustomer?.name ?? "");
  useEffect(() => {
    let ignore = false;

    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const param = new URLSearchParams();
        const q = searchCustomer.trim();
        if (q) param.set("search", q);
        param.set("mode", "select"); // โหมดเลือกลูกค้า
        param.set("pageSize", "50"); // ดึงข้อมูลเยอะขึ้นสำหรับการค้นหา
        const urlCustomer = `/api/customer?${param.toString()}`;
        const res = await fetch(urlCustomer, { cache: "no-store" });
        if (!res.ok) throw new Error("Error fetching customers");

        const json: CustomerApiResponse = await res.json();

        if (!ignore) {
          setCustomers(
            json.data.map((c: CustomerApiItem) => ({
              id: c.id,
              name: c.name,
            })),
          );
        }
      } catch (err) {
        console.error(err);
        if (!ignore) setCustomers([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchCustomers();

    return () => {
      ignore = true;
    };
  }, [searchCustomer]);

  // เช้คว่ามีรายการที่ตัดแบบ F/B แต่ไม่ได้กรอกค่า surfaceT หรือ toleranceT หรือไม่
  const hasInvalidFBItem = SteelItem.some((item) => {
    if (item.cuttingMethod !== "FB") return false;
    const emptySurface = [item.surfaceT, item.surfaceW, item.surfaceL].some(
      (val) => val == null,
    );
    const emptyTolerance = [
      item.toleranceT,
      item.toleranceW,
      item.toleranceL,
    ].some((val) => val == null);
    return emptySurface || emptyTolerance;
  });

  const validateForm = () => {
    if (showForm) {
      if (!formData.customerName.trim()) return "กรุณากรอกชื่อลูกค้า";
      if (!formData.companyName.trim()) return "กรุณากรอกชื่อบริษัท";
      if (!formData.address.trim()) return "กรุณากรอกที่อยู่";
    }
    if (!headOrder.salesName.trim() || !headOrder.salesNameId)
      return "กรุณาเลือกผู้ขาย";

    if (SteelItem.length <= 0) return "กรณาเพิ่มรายการเหล็กอย่างน้อย 1 รายการ";
    if (SteelItem.length > maxItem)
      return `ไม่สามารถเพิ่มรายการเหล็กเกิน ${maxItem} รายการ`;

    if (
      SteelItem.some(
        (item) =>
          (item.isOD === false && (!item.length || item.length <= 0)) ||
          !item.thickness ||
          item.thickness <= 0 ||
          (item.shape === "square" && (!item.wide || item.wide <= 0)),
      )
    )
      return "ขนาดของเหล็กต้องมากกว่า 0";
    if (hasInvalidFBItem) {
      return "กรุณากรอกค่า surfaceT และ toleranceT ในออเดอร์ที่ตัดแบบ F/B";
    }

    return null; // ถ้าไม่มีข้อผิดพลาด
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      toast.error(`ขออภัย มีข้อผิดพลาด: ${validationError}`, {
        position: "bottom-right",
      });
      return;
    }
    setIsSubmitting(true);

    try {
      const payload = {
        customerId: selectedCustomerId ?? undefined,
        customerName: formData.customerName,
        companyName: formData.companyName,
        address: formData.address,
        tel: formData.tel ?? null,
        fax: formData.fax ?? null,
        credit: headOrder.credit ?? undefined,
        quotationNo: headOrder.quotationNo,
        salesName: headOrder.salesName,
        salesNameId: headOrder.salesNameId,
        description: headOrder.description ?? null,
        deliveryDate: headOrder.deliveryDate,
        createdAt: headOrder.createdAt ?? new Date(),
        orderPO: {
          customerId: selectedCustomerId ?? undefined,
          products: SteelItem.map((item, index) => ({
            SteelId: item.SteelId,
            steelType: item.steelType,
            shape: item.shape,
            sequence: item.sequence ?? index + 1,
            wide: item.wide ?? undefined,
            length: item.length,
            thickness: item.thickness,
            amount: item.amount,
            detail: item.detail ?? null,
            cuttingMethod: item.cuttingMethod ?? "normal",
            weight: item.weight ?? null,
            price: item.price ?? 0,
            surfaceT: item.surfaceT ?? null,
            toleranceT: item.toleranceT ?? null,
            surfaceW: item.surfaceW ?? null,
            toleranceW: item.toleranceW ?? null,
            surfaceL: item.surfaceL ?? null,
            toleranceL: item.toleranceL ?? null,
            isOD: item.isOD ?? false,
            isServices: item.isServices ?? false,
            isPerAmount: item.isPerAmount ?? false,
          })),
        },
      };
      const response = await fetch("/api/create-new-quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();

      if (!response.ok) {
        toast.error("เกิดข้ผิดพลาดในการสร้างใบเสนอราคาใหม่", {
          position: "bottom-right",
        });
        throw new Error("เกิดข้ผิดพลาดในการสร้างใบเสนอราคาใหม่");
      }
      let resData: any = null;
      try {
        resData = JSON.parse(rawText);
      } catch {
        // ถ้า backend ไม่ได้ส่ง JSON กลับมา ก็ปล่อยเป็น null ไป
        resData = null;
      }

      console.log("สร้างออเดอร์ใหม่สำเร็จ:", resData);
      toast.success("สร้างออเดอร์ใหม่สำเร็จ", {
        position: "bottom-right",
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Error create New Order", error);
      const message = error instanceof Error ? error : new Error(String(error));
      toast.error(`สร้างใบเสนอราคาใหม่ไม่สำเร็จ: ${message}`, {
        position: "bottom-right",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className=" mb-4 border-b ">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับสู่หน้าหลัก
          </Button>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">
            สร้างใบเสนอราคาใหม่
          </h1>
        </div>
        <p className="text-muted-foreground">
          กรอกข้อมูลใบเสนอราคาใหม่สำหรับการตัดเหล็ก
        </p>
      </div>
      <div className="space-y-2">
        {/* --- Zone 1: Toolbar (Customer Select & Actions) --- */}
        <div className="flex flex-col gap-3 p-1">
          {/* Action Row: Customer + Buttons (LEFT ALIGNED) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {/* Customer Selection / Form Status */}
            <div className="min-w-[220px]">
              {showForm ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1.5 rounded-md">
                    <UserPlus className="w-4 h-4" />
                  </span>
                  กำลังเพิ่มข้อมูลลูกค้าใหม่...
                </div>
              ) : (
                <SelectCustomer
                  open={open}
                  setOpen={setOpen}
                  selectedCustomerId={selectedCustomerId}
                  setSelectedCustomer={(id) =>
                    setSelectedCustomerId(id == null ? null : Number(id))
                  }
                  customers={customers}
                  search={searchCustomer}
                  setSearch={setSearchCustomer}
                  loading={loading}
                />
              )}
            </div>

            {/* Buttons Group */}
            <div className="flex items-center gap-2">
              {/* Toggle Form Button */}
              <button
                onClick={() => setShowForm((prev) => !prev)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border",
                  showForm
                    ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                    : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-400 dark:bg-blue-900/20 dark:text-white dark:border-blue-900/50",
                )}
              >
                {showForm ? (
                  <User className="w-4 h-4" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {showForm ? "เลือกรายชื่อเดิม" : "ลูกค้าใหม่"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex flex-col gap-6">
          {/* Customer Information */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="mb-4">
                {showForm ? (
                  <CustomerForm
                    formData={formData}
                    updateFormData={updateFormData}
                  />
                ) : selectedCustomerId ? (
                  <CustomerInfoBox customerId={String(selectedCustomerId)} />
                ) : (
                  <div className="p-4 text-sm text-muted-foreground">
                    กรุณาเลือกลูกค้า
                  </div>
                )}
              </div>
              {/* Header */}
              <div>
                <Card className="shadow-steel">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="h-6 w-6 text-primary" />
                      ข้อมูลหัวบิล
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <Label htmlFor="headerCustomerName">ชื่อลูกค้า</Label>
                        <Input
                          id="headerCustomerName"
                          value={headerCustomerName}
                          placeholder="สมพงษ์ โลหะกิจ"
                          disabled
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="quotationNo">เลขที่ใบเสนอราคา</Label>
                        <Input
                          id="quotationNo"
                          value={headOrder.quotationNo}
                          onChange={(e) =>
                            setheadOrder((prev) => ({
                              ...prev,
                              quotationNo: e.target.value,
                            }))
                          }
                          placeholder="2026/0001"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="credit">Credit</Label>
                        <Input
                          id="credit"
                          type="number"
                          value={headOrder.credit ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value.trim();
                            setheadOrder((prev) => ({
                              ...prev,
                              credit: raw === "" ? null : Number(raw),
                            }));
                          }}
                          placeholder="30"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="salesName">ผู้ขาย</Label>
                        <Select
                          value={
                            headOrder.salesNameId
                              ? String(headOrder.salesNameId)
                              : ""
                          }
                          onValueChange={(value) => {
                            const selected = salesOptions.find(
                              (s) => String(s.id) === value,
                            );
                            setheadOrder((prev) => ({
                              ...prev,
                              salesNameId: selected ? selected.id : 1,
                              salesName: selected
                                ? selected.name
                                : "J.Sirikarn",
                            }));
                          }}
                        >
                          <SelectTrigger id="salesName" className="mt-1">
                            <SelectValue placeholder="เลือก Sales" />
                          </SelectTrigger>
                          <SelectContent>
                            {salesOptions.map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="deliveryDate">Delivery Date</Label>
                        <Input
                          id="deliveryDate"
                          value={headOrder.deliveryDate}
                          onChange={(e) =>
                            setheadOrder((prev) => ({
                              ...prev,
                              deliveryDate: e.target.value,
                            }))
                          }
                          placeholder="4-5 วัน"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="createdAt">วันที่สร้าง</Label>
                        <Input
                          id="createdAt"
                          type="date"
                          value={toDateInputValue(
                            headOrder.createdAt ?? new Date(),
                          )}
                          max={todayValue}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!value) return;
                            setheadOrder((prev) => ({
                              ...prev,
                              createdAt: new Date(`${value}T00:00:00`),
                            }));
                          }}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={headOrder.description ?? ""}
                          onChange={(e) =>
                            setheadOrder((prev) => ({
                              ...prev,
                              description:
                                e.target.value.trim() === ""
                                  ? null
                                  : e.target.value,
                            }))
                          }
                          placeholder="รายละเอียดเพิ่มเติม"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* AddItem */}
              <div className="mb-4">
                {/* <AddItem
                steelItems={steelItems}
                setSteelItems={setSteelItems}
                updateSteelItem={updateSteelItem}
                addSteelItem={addSteelItem}
                removeSteelItem={removeSteelItem}
                steelTypes={steelTypes}
                headOrder={headOrder}
                setheadOrder={setheadOrder}
                searchItem={searchItem}
                setsearchItem={setsearchItem}
                loadingSteel={loadingSteel}
                pofilelength={UploadFile.length}
                useJob={useJob}
                setUseJob={setUseJob}
              /> */}
              </div>

              <div>
                <Card className="border border-zinc-200 dark:border-zinc-800 shadow-lg shadow-black/5 overflow-hidden sticky top-4">
                  {/* Header */}
                  <CardHeader className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg text-zinc-800 dark:text-zinc-100">
                      <ClipboardCheck className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                      สรุปรายการสั่งผลิต
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-6 space-y-6">
                    {/* Stats */}
                    <div className="space-y-4">
                      {/* Total Quantity */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-100/60 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-zinc-900 rounded-md shadow-sm text-zinc-700 dark:text-zinc-300">
                            <Package className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                            จำนวนทั้งหมด
                          </span>
                        </div>

                        <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                          {/* {totalQuantity.toLocaleString()} */}
                          <span className="ml-1 text-xs font-normal text-zinc-500">
                            ชิ้น
                          </span>
                        </span>
                      </div>

                      {/* Details */}
                      <div className="px-1 space-y-3">
                        {/* Steel Types */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                            <Layers className="w-4 h-4" />
                            <span>ประเภทเหล็ก</span>
                          </div>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                            {/* {totalTypes} */}
                            <span className="ml-1 text-xs font-normal text-zinc-400">
                              รายการ
                            </span>
                          </span>
                        </div>

                        {/* Delivery Date */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                            <Calendar className="w-4 h-4" />
                            <span>กำหนดส่งสินค้า</span>
                          </div>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                            {/* {formatDate(headOrder.deliveryDate)} */}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-zinc-200 dark:bg-zinc-800" />

                    {/* CTA */}
                    <div className="space-y-3">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 text-base font-semibold shadow-md shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 active:scale-[0.98]"
                      >
                        {/* || totalTypes === 0 */}{" "}
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            {" "}
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />{" "}
                            <span>กำลังบันทึก...</span>{" "}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-white">
                            {" "}
                            <Save className="w-5 h-5" />{" "}
                            <span>ยืนยันสร้างออเดอร์</span>{" "}
                          </div>
                        )}{" "}
                      </Button>

                      <p className="text-xs text-center text-zinc-400 dark:text-zinc-500">
                        กรุณาตรวจสอบความถูกต้องก่อนยืนยัน
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
