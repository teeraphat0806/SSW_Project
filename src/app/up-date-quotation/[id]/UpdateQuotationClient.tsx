"use client";
// src/app/up-date-quotation/[id]/UpdateQuotationClient.tsx

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { toast, ToastContainer } from "react-toastify";
import {
  ArrowLeft,
  FileText,
  UserPlus,
  User,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import CustomerForm from "@/components/create-new-quotation/CustomerForm";
import type { CustomerFormData } from "@/components/create-new-quotation/CustomerForm";
import HeaderOrder from "@/components/create-new-quotation/HeaderOrder";
import AddItem from "@/components/create-new-quotation/AddItem";
import AddCustomerPopup from "@/components/create-new-quotation/AddCustomerPopup";
import CustomerInfoBox from "@/components/newJobOrder/CustomerInfoBox";
import SelectCustomer from "@/components/SelectCustomer";
import Summary from "@/components/up-date-order/summary";

import type { HeadOrder, SteelItem, SteelType } from "@/types/quotation.types";
import type { ApiQuotation } from "@/app/api/up-date-quotation/[id]/route";
import { ShapeSteel } from "@/types";

import "../../globals.css";

// ────────────────────────────────────────
// Types for customer API
// ────────────────────────────────────────
type CustomerApiItem = { id: number; name: string };
type CustomerApiResponse = { data: CustomerApiItem[] };

const maxItem = 15;

// ────────────────────────────────────────
// Main Client Component
// ────────────────────────────────────────
export default function UpdateQuotationClient({ id }: { id: string }) {
  const router = useRouter();
  const poId = Number(id);

  // ── loading / submit state ───────────────────────────────────────
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingSteel, setLoadingSteel] = useState(false);

  // ── steel types ────────────────────────────────────────────────
  const [steelTypes, setSteelTypes] = useState<SteelType[]>([]);
  const [searchItem, setsearchItem] = useState("");

  // ── customer selection ─────────────────────────────────────────
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // ── form state ──────────────────────────────────────────────────
  const [formData, setFormData] = useState<CustomerFormData>({
    customerName: "",
    companyName: "",
    address: "",
    tel: null,
    fax: null,
  });
  const [headOrder, setheadOrder] = useState<HeadOrder>({
    quotationNo: "",
    credit: null,
    salesName: "J.Sirikarn",
    salesNameId: 1,
    description: null,
    period: null,
    deliveryDate: "",
    createdAt: new Date(),
  });
  const [steelItems, setSteelItems] = useState<SteelItem[]>([]);

  // ─────────────────────────────────────────────────────────────────
  // Fetch quotation data on mount
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (Number.isNaN(poId)) return;
    const ac = new AbortController();
    const fetchQuotation = async () => {
      setLoadingData(true);
      try {
        const res = await fetch(`/api/up-date-quotation/${poId}`, {
          signal: ac.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch quotation");
        const data: ApiQuotation = await res.json();

        setSelectedCustomerId(data.customerId ?? null);
        setShowForm(data.customerId == null);

        setFormData({
          customerName: data.customerName ?? "",
          companyName: data.companyName ?? "",
          address: data.address ?? "",
          tel: data.tel ?? null,
          fax: data.fax ?? null,
        });

        setheadOrder({
          quotationNo: data.quotationNo,
          credit: data.credit ?? null,
          salesName: data.salesName,
          salesNameId: data.salesId,
          description: data.description ?? null,
          period: data.period ?? null,
          deliveryDate: data.deliveryDate,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        });

        setSteelItems(
          data.steelItem.map((item, idx) => ({
            id: uuidv4(),
            SteelId: item.SteelId,
            steelType: item.steelType,
            shape: item.shape as ShapeSteel,
            sequence: item.sequence ?? idx + 1,
            wide: item.wide ?? null,
            length: item.length,
            thickness: item.thickness,
            amount: item.amount,
            detail: item.detail ?? null,
            cuttingMethod: item.cuttingMethod,
            weight: item.weight ?? null,
            price: item.price,
            discount: item.discount ?? null,
            density: item.density,
            surfaceT: item.surfaceT ?? null,
            toleranceT: item.toleranceT ?? null,
            surfaceW: item.surfaceW ?? null,
            toleranceW: item.toleranceW ?? null,
            surfaceL: item.surfaceL ?? null,
            toleranceL: item.toleranceL ?? null,
            isOD: item.isOD,
            isServices: item.isServices,
            isPerAmount: item.isPerAmount,
          })),
        );
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        console.error(err);
        toast.error("โหลดข้อมูลใบเสนอราคาไม่สำเร็จ", { position: "bottom-right" });
      } finally {
        setLoadingData(false);
      }
    };
    fetchQuotation();
    return () => ac.abort();
  }, [poId]);

  // ─────────────────────────────────────────────────────────────────
  // Fetch customer detail when selectedCustomerId changes
  // ─────────────────────────────────────────────────────────────────
  const isMountFetch = useRef(true);
  useEffect(() => {
    if (isMountFetch.current) {
      isMountFetch.current = false;
      return;
    }
    if (!selectedCustomerId) return;
    const ac = new AbortController();
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/customer/${selectedCustomerId}`, {
          signal: ac.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setFormData((prev) => ({
          ...prev,
          companyName: data.name ?? "",
          address: data.address ?? "",
          tel: data.tel?.trim() || null,
          fax: data.faxNumber?.trim() || null,
        }));
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
      }
    };
    fetchDetail();
    return () => ac.abort();
  }, [selectedCustomerId]);

  // ─────────────────────────────────────────────────────────────────
  // Fetch steel types
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let ignore = false;
    const fetchSteels = async () => {
      setLoadingSteel(true);
      try {
        const param = new URLSearchParams();
        if (searchItem.trim()) param.set("search", searchItem.trim());
        param.set("status", "active");
        const res = await fetch(`/api/steelType?${param.toString()}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!ignore)
          setSteelTypes(
            data.map((t: any) => ({
              id: t.id.toString(),
              steelType: t.codeSteel,
              shape: t.shape,
              price: Number(t.price ?? 0),
              density: Number(t.density ?? 0.0000079),
            })),
          );
      } catch {
        if (!ignore) setSteelTypes([]);
      } finally {
        if (!ignore) setLoadingSteel(false);
      }
    };
    fetchSteels();
    return () => { ignore = true; };
  }, [searchItem]);

  // ─────────────────────────────────────────────────────────────────
  // Fetch customer list
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let ignore = false;
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const param = new URLSearchParams();
        if (searchCustomer.trim()) param.set("search", searchCustomer.trim());
        param.set("mode", "select");
        param.set("pageSize", "50");
        const res = await fetch(`/api/customer?${param.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const json: CustomerApiResponse = await res.json();
        if (!ignore) setCustomers(json.data.map((c) => ({ id: c.id, name: c.name })));
      } catch {
        if (!ignore) setCustomers([]);
      } finally {
        if (!ignore) setLoadingCustomers(false);
      }
    };
    fetchCustomers();
    return () => { ignore = true; };
  }, [searchCustomer]);

  // ─────────────────────────────────────────────────────────────────
  // Steel item helpers
  // ─────────────────────────────────────────────────────────────────
  const updateFormData = <K extends keyof CustomerFormData>(
    field: K,
    value: CustomerFormData[K],
  ) => setFormData((prev) => ({ ...prev, [field]: value }));

  const updateSteelItem = <K extends keyof SteelItem>(
    id: SteelItem["id"],
    field: K,
    value: SteelItem[K],
  ) =>
    setSteelItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );

  const addSteelItem = () => {
    const first = steelTypes[0];
    const shape: ShapeSteel = first?.shape ?? "square";
    const nextSeq =
      steelItems.length > 0 ? Math.max(...steelItems.map((i) => i.sequence ?? 0)) + 1 : 1;
    setSteelItems((prev) => [
      ...prev,
      {
        id: uuidv4(),
        SteelId: first ? Number(first.id) : 0,
        steelType: first?.steelType ?? "",
        shape,
        sequence: nextSeq,
        wide: shape === "line" ? null : 0,
        length: 0,
        thickness: 0,
        amount: 0,
        detail: null,
        cuttingMethod: "normal",
        weight: null,
        price: Number(first?.price ?? 0),
        discount: null,
        density: Number(first?.density ?? 0.0000079),
        surfaceT: null, toleranceT: null,
        surfaceW: null, toleranceW: null,
        surfaceL: null, toleranceL: null,
        isOD: false, isServices: false, isPerAmount: false,
      },
    ]);
  };

  const removeSteelItem = (id: SteelItem["id"]) => {
    if (steelItems.length > 1)
      setSteelItems((prev) =>
        prev.filter((i) => i.id !== id).map((i, idx) => ({ ...i, sequence: idx + 1 })),
      );
  };

  // ─────────────────────────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────────────────────────
  const validateForm = () => {
    if (!formData.companyName.trim()) return "กรุณากรอกชื่อบริษัท";
    if (!formData.address.trim()) return "กรุณากรอกที่อยู่";
    if (!headOrder.deliveryDate.trim()) return "กรุณากรอก Delivery Date";
    if (!headOrder.quotationNo.trim()) return "กรุณากรอกเลขที่ใบเสนอราคา";
    if (!headOrder.period) return "กรุณากรอกวันยืนราคา";
    if (!headOrder.salesName.trim() || !headOrder.salesNameId) return "กรุณาเลือกผู้ขาย";
    if (steelItems.length <= 0) return "กรุณาเพิ่มรายการเหล็กอย่างน้อย 1 รายการ";
    if (steelItems.length > maxItem) return `ไม่สามารถเพิ่มรายการเหล็กเกิน ${maxItem} รายการ`;
    if (
      steelItems.some(
        (item) =>
          (item.isOD === false && (!item.length || item.length <= 0)) ||
          !item.thickness ||
          item.thickness <= 0 ||
          (item.shape === "square" && (!item.wide || item.wide <= 0)),
      )
    )
      return "ขนาดของเหล็กต้องมากกว่า 0";
    if (steelItems.some((item) => !item.SteelId || item.SteelId <= 0))
      return "กรุณาเลือกประเภทเหล็ก";
    if (steelItems.some((item) => !item.amount || item.amount <= 0))
      return "จำนวนต้องมากกว่า 0";
    return null;
  };

  // ─────────────────────────────────────────────────────────────────
  // Submit PATCH
  // ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validateForm();
    if (err) {
      toast.error(`ขออภัย มีข้อผิดพลาด: ${err}`, { position: "bottom-right" });
      return;
    }
    setIsSubmitting(true);

    const opt = (v: string | null | undefined) => {
      const s = (v ?? "").trim();
      return s === "" ? undefined : s;
    };
    const optNum = (v: number | null | undefined) =>
      v == null ? undefined : Number.isFinite(v) ? v : undefined;

    try {
      const payload = {
        customerId: selectedCustomerId ?? null,
        customerName: formData.customerName,
        companyName: formData.companyName,
        address: formData.address,
        tel: opt(formData.tel),
        fax: opt(formData.fax),
        credit: optNum(headOrder.credit),
        quotationNo: headOrder.quotationNo,
        salesName: headOrder.salesName,
        description: opt(headOrder.description ?? undefined),
        period: headOrder.period,
        deliveryDate: headOrder.deliveryDate,
        createdAt: headOrder.createdAt ?? new Date(),
        steelItem: steelItems.map((item, idx) => ({
          SteelId: item.SteelId,
          sequence: idx + 1,
          wide: item.wide ?? null,
          length: item.length,
          thickness: item.thickness,
          amount: item.amount,
          detail: opt(item.detail ?? undefined),
          cuttingMethod: item.cuttingMethod ?? "normal",
          weight: item.weight ?? null,
          price: item.price ?? 0,
          discount: item.discount ?? null,
          surfaceT: opt(item.surfaceT ?? undefined),
          toleranceT: opt(item.toleranceT ?? undefined),
          surfaceW: opt(item.surfaceW ?? undefined),
          toleranceW: opt(item.toleranceW ?? undefined),
          surfaceL: opt(item.surfaceL ?? undefined),
          toleranceL: opt(item.toleranceL ?? undefined),
          isOD: item.isOD ?? false,
          isServices: item.isServices ?? false,
          isPerAmount: item.isPerAmount ?? false,
        })),
      };

      const res = await fetch(`/api/up-date-quotation/${poId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      toast.success("บันทึกการแก้ไขสำเร็จ", { position: "bottom-right" });
      setTimeout(() => router.back(), 1200);
    } catch (err) {
      console.error(err);
      toast.error(
        `บันทึกไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`,
        { position: "bottom-right" },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Adapter: SteelItem[] → format that Summary expects
  // ─────────────────────────────────────────────────────────────────
  const summaryJob = {
    steel: steelItems.map((item) => ({
      steelType: item.steelType,
      shape: item.shape,
      amount: item.amount,
      weight: item.weight ?? null,
    })),
  };

  // ─────────────────────────────────────────────────────────────────
  // Loading skeleton
  // ─────────────────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <div className="container mx-auto p-6 space-y-6 animate-pulse">
        <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="h-40 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
        <div className="h-40 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
        <div className="h-64 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <ToastContainer />

      {/* AddCustomerPopup */}
      <AddCustomerPopup
        open={showPopup}
        onClose={() => setShowPopup(false)}
        onCreated={(newId) => {
          if (newId != null) {
            setSelectedCustomerId(newId);
            setShowForm(false);
          }
        }}
        initialData={{
          companyName: formData.companyName,
          address: formData.address,
          tel: formData.tel,
          fax: formData.fax,
        }}
      />

      {/* ── Sticky Navbar (เหมือน UpdateOrderClient) ── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Left: back + title */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">กลับ</span>
            </Button>

            <div className="h-6 w-px bg-border/60" />

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm dark:bg-blue-500 dark:shadow-none">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground leading-tight">
                  แก้ไขใบเสนอราคา
                </h1>
                <p className="text-sm text-muted-foreground font-mono">
                  #{poId}
                </p>
              </div>
            </div>
          </div>

          {/* Right: save button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-none"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  กำลังบันทึก...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  บันทึกข้อมูล
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header order fields */}
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground leading-tight">
              แก้ไขใบเสนอราคา
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              #{poId}
            </p>
          </div>
        </div>

        {/* Customer selector toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Dropdown / status indicator */}
          <div className="min-w-[220px]">
            {showForm ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1.5 rounded-md">
                  <UserPlus className="w-4 h-4" />
                </span>
                {selectedCustomerId
                  ? "ลูกค้าที่เพิ่งเพิ่มเข้าระบบ"
                  : "กำลังกรอกข้อมูลลูกค้าใหม่..."}
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
                loading={loadingCustomers}
              />
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowForm((prev) => !prev)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border",
                showForm
                  ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                  : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-white dark:border-blue-900/50",
              )}
            >
              {showForm ? <User className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {showForm ? "เลือกรายชื่อเดิม" : "ลูกค้าใหม่"}
            </button>

            {showForm && !selectedCustomerId && (
              <button
                type="button"
                onClick={() => setShowPopup(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/50"
              >
                <UserPlus className="w-4 h-4" />
                เพิ่มลูกค้าเข้าระบบ
              </button>
            )}
          </div>
        </div>

        {/* Customer info panel */}
        {showForm ? (
          <CustomerForm formData={formData} updateFormData={updateFormData} />
        ) : selectedCustomerId ? (
          <CustomerInfoBox customerId={String(selectedCustomerId)} />
        ) : (
          <div className="p-4 text-sm text-muted-foreground border rounded-lg">
            กรุณาเลือกลูกค้า
          </div>
        )}

        {/* Header order fields */}
        <HeaderOrder
          headOrder={headOrder}
          setheadOrder={setheadOrder}
          formData={formData}
          setFormData={setFormData}
        />

        {/* Steel items */}
        <AddItem
          SteelItem={steelItems}
          setSteelItems={setSteelItems}
          updateSteelItem={updateSteelItem}
          addSteelItem={addSteelItem}
          removeSteelItem={removeSteelItem}
          steelTypes={steelTypes}
          searchItem={searchItem}
          setsearchItem={setsearchItem}
          loadingSteel={loadingSteel}
        />

        {/* Summary (same as up-date-order) */}
        <Summary job={summaryJob} weightEnabled={false} />
      </main>
    </div>
  );
}
