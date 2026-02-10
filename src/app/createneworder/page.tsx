"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
import { Separator } from "@/components/ui/separator";
import { ToastContainer, toast } from "react-toastify";
import CustomerForm from "@/components/newJobOrder/CustomerForm";
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

import type { CustomerFormData } from "@/components/newJobOrder/CustomerForm";
import { cn } from "@/lib/utils";
import { CuttingMethod, ShapeSteel } from "@/types";
import {
  OcrResultModal,
  type OcrSummary,
} from "@/components/newJobOrder/OcrResultModel";
import { is } from "date-fns/locale";

type CustomerApiItem = {
  id: number;
  name: string;
};

type CustomerApiResponse = {
  data: CustomerApiItem[];
};

type SteelItem = {
  id: string;
  steelType: string;
  shape: ShapeSteel;
  quantity: number;
  width: number | null;
  length: number;
  thickness: number;
  notes: string;
  cuttingMethod?: CuttingMethod;
  isOD: boolean;
  isServices: boolean;
  job?: number | null;
};

type SteelType = {
  id: string;
  name: string; // ใช้แสดงใน Select
  shape: ShapeSteel;
};

type OcrParseResponse = {
  source: { fileName: string; fileType: string; fileSize: number };
  customerMatch: {
    matched: boolean;
    customerId: number | null;
    matchedBy: "taxNumber" | "tel" | "faxNumber" | "email" | null;
  };
  customerDraft: {
    name: string;
    address: string;
    tel: string;
    taxNumber: string;
    faxNumber: string;
    email: string;
  };
  orderDraft: {
    poNumber: string | null;
    poDate: string | null;
    deliveryDate: string | null;
  };
  items: Array<{
    raw: {
      codeSteel: string | null;
      description: string | null;
      shape: ShapeSteel;
      width: number | null;
      length: number | null;
      thickness: number | null;
      quantity: number | null;
      cuttingMethod: CuttingMethod;
      job: number | null;
      notes: string | null;
      isOD: boolean | null;
      isServices: boolean | null;
      confidence: number | null;
    };
    match: {
      matched: boolean;
      steelTypeId: number | null;
      matchedBy: "codeSteel" | null;
    };
  }>;
  meta: { warnings: string[]; confidence: number | null };
};

// ฟังก์ชันช่วยแปลงวันที่ให้สวยงาม (ใส่ไว้ใน utils หรือประกาศในไฟล์)
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const NewJobOrder = () => {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [UploadFile, setUploadFile] = useState<File[]>([]); //ดึงไฟล์อัปโหลด
  const [showForm, setShowForm] = useState(false); //แสดงหรือซ่อนข้อมุลลูกค้า
  const toggleForm = () => setShowForm(!showForm); //ฟังก์ชั่นแสดงฟอร์มลูกค้า
  const [open, setOpen] = useState(false); //เปิดหรือปิด SelectCustomer
  const [useJob, setUseJob] = useState(false);
  // ลูกค้า
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [searchCustomer, setSearchCustomer] = useState(""); // เก็บค่าที่ค้นหาลูกค้า

  // สินค้า
  const [searchItem, setsearchItem] = useState(""); //เก็บค่าที่ค้นหาสินค้า
  const [loadingSteel, setLoadingSteel] = useState(false);
  const [loading, setLoading] = useState(false); //สถานะโหลดข้อมุล

  //ocr
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [ocrData, setOcrData] = useState<OcrParseResponse | null>(null);
  const [ocrStage, setOcrStage] = useState<"loading" | "done">("loading");
  const [ocrSummary, setOcrSummary] = useState<{
    customerLine: string;
    items: Array<{
      codeSteel: string;
      thickness: number | null;
      width: number | null;
      length: number | null;
      quantity: number | null;
      description: string | null;
    }>;
  } | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState<
    string | number | null
  >(null);
  // เก็บ ID ลูกค้าที่เลือกจาก SelectCustomer
  const [headOrder, setheadOrder] = useState<{
    poNumber: string | null;
    credit: number;
    deliveryDate: string;
  }>({
    poNumber: null,
    credit: 30,
    deliveryDate: new Date().toISOString().split("T")[0],
  });

  const [steelTypes, setSteelTypes] = useState<SteelType[]>([]);
  const [steelItems, setSteelItems] = useState<SteelItem[]>([
    {
      id: "",
      steelType: "",
      shape: "square",
      quantity: 1,
      width: null,
      length: 1,
      thickness: 1,
      isOD: false,
      isServices: false,
      cuttingMethod: "normal",
      notes: "",
    },
  ]);

  //จำนวนรวมของเหล็ก
  const totalQuantity = steelItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  //จำนวนประเภทเหล็ก
  const totalTypes = new Set(
    steelItems
      .filter((item) => item.steelType)
      .map((item) => `${item.steelType}::${item.shape}`),
  ).size;

  useEffect(() => {
    let ignore = false;

    const fetchSteelTypes = async () => {
      setLoadingSteel(true);
      try {
        const param = new URLSearchParams();
        if (searchItem.trim() !== "") {
          param.set("search", searchItem.trim());
        }
        param.set("status", "active");
        const urlSteelType = `/api/steelType?${param.toString()}`;
        const res = await fetch(urlSteelType);
        if (!res.ok) throw new Error("Error fetching steel types");

        const data = await res.json();

        if (!ignore) {
          setSteelTypes(
            data.map((t: { id: number; codeSteel: string; shape: string }) => ({
              id: t.id.toString(),
              name: t.codeSteel, // ใช้เป็น value/label ใน Select
              shape: t.shape,
            })),
          );
        }
      } catch (e) {
        console.error(e);
        if (!ignore) setSteelTypes([]); // ล้างเฉพาะรายการ "ประเภทเหล็ก"
      } finally {
        if (!ignore) setLoadingSteel(false);
      }
    };

    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const param = new URLSearchParams();
        const q = searchCustomer.trim();
        if (q) param.set("search", q);
        const urlCustomer = `/api/customer?${param.toString()}`;

        const res = await fetch(urlCustomer, { cache: "no-store" });
        if (!res.ok) throw new Error("Error fetching customers");

        const json: CustomerApiResponse = await res.json();

        if (!ignore) {
          setCustomers(
            json.data.map((c: CustomerApiItem) => ({
              id: c.id.toString(),
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

    fetchSteelTypes();
    fetchCustomers();

    return () => {
      ignore = true;
    };
  }, [searchCustomer, searchItem]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filelist = Array.from(event.target.files);
      setUploadFile((prev) => [...prev, ...filelist]);
    }
  };

  const handRemoveFile = (index: number) => {
    setUploadFile((prev) => prev.filter((_, i) => i !== index));
  };

  // Form data customer
  const [formData, setFormData] = useState<CustomerFormData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    deliveryAddress: "",
    taxNumber: "",
    faxNumber: "",
  });

  async function UploadFiles({
    files,
    poNumber,
    customerId,
  }: {
    files: File[];
    poNumber: string | null;
    customerId: string | number;
  }) {
    if (!files?.length) return [];

    const form = new FormData();
    form.append("poNumber", poNumber ?? "");
    form.append("customerId", String(customerId)); // สำคัญ: แปลงเป็น string
    files.forEach((f) => form.append("files", f));

    // ใช้ relative path กัน CORS/timezone/env
    const res = await fetch("/api/upload/po/uploadPo", {
      method: "POST",
      body: form,
    });

    // อ่าน body แค่ครั้งเดียว
    interface UploadResponse {
      error?: string;
      keys?: string[];
    }
    const data: UploadResponse = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Upload error:", data?.error);
      throw new Error(data?.error || "อัปโหลดไฟล์ไม่สำเร็จ");
    }

    return data.keys as string[];
  }

  //Handle form submisstion
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let customerId = selectedCustomerId;
    const validationError = validateForm();
    if (validationError) {
      toast.error(`ขออภัย มีข้อผิดพลาด: ${validationError}`, {
        position: "bottom-right",
      });
      return;
    }
    setIsSubmitting(true);

    try {
      if (showForm) {
        const payloadNewcustomer = {
          name: formData.customerName,
          address: formData.deliveryAddress,
          tel: formData.customerPhone || "",
          taxNumber: formData.taxNumber,
          faxNumber: formData.faxNumber || "",
          email: formData.customerEmail || "",
        };
        const customerRes = await fetch(`api/customer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadNewcustomer),
        });

        if (!customerRes.ok) {
          throw new Error("เกิดข้อผิดพลาดในการบันทึกข้อมูลลูกค้า");
        }
        const customerData = await customerRes.json();
        customerId = customerData.id;

        console.log("เพิ่มลูกค้าสำเร็จ:", customerId);
        toast.success("เพิ่มข้อมูลลูกค้าสำเร็จ", {
          position: "bottom-right",
        });
      }

      const poKeys = await UploadFiles({
        files: UploadFile,
        poNumber: headOrder.poNumber || null,
        customerId: customerId || "",
      });

      const payloadBill = {
        customerId: Number(customerId),
        deliveryDate: new Date(headOrder.deliveryDate).toISOString(),
        orderPO: {
          poNumber: headOrder.poNumber ?? null,
          credit: headOrder.credit,
          urlPo: poKeys,

          products: steelItems.map((item) => ({
            steelType: item.steelType,
            shape: item.shape,
            wide: item.width ?? null,
            length: item.length,
            thickness: item.thickness,
            amount: item.quantity,

            detail: item.notes || undefined, // optional ส่ง undefined ได้
            job: item.job ?? null,
            cuttingMethod: item.cuttingMethod ?? "normal",

            isOD: item.isOD || false,
            isServices: item.isServices || false,
            isPerAmount: item.isServices || false,
          })),
        },
      };

      //สร้างออเดอร์ใหม่
      const billRes = await fetch(`/api/createNewOrder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadBill),
      });

      const rawText = await billRes.text(); // อ่านเป็น text ก่อน
      // console.log("createNewOrder status:", billRes.status);
      // console.log("createNewOrder raw response:", rawText);

      console.log("Payload Bill:", payloadBill);
      if (!billRes.ok) {
        throw new Error("เกิดข้อผิดพลาดในการสร้างออเดอร์ใหม่");
      }
      let billData: any = null;
      try {
        billData = JSON.parse(rawText);
      } catch {
        // ถ้า backend ไม่ได้ส่ง JSON กลับมา ก็ปล่อยเป็น null ไป
        billData = null;
      }

      console.log("สร้างออเดอร์ใหม่สำเร็จ:", billData);
      toast.success("สร้างออเดอร์ใหม่สำเร็จ", {
        position: "bottom-right",
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Error create New Order", error);
      const message = error instanceof Error ? error : new Error(String(error));
      toast.error(`สร้างออเดอร์ใหม่ไม่สำเร็จ: ${message}`, {
        position: "bottom-right",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update form data
  const updateFormData = <key extends keyof CustomerFormData>(
    field: key,
    value: CustomerFormData[key],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  // Update steel item
  const updateSteelItem = <key extends keyof SteelItem>(
    id: SteelItem["id"],
    field: key,
    value: SteelItem[key],
  ) => {
    setSteelItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  // Add steel items
  const addSteelItem = () => {
    const newItem: SteelItem = {
      id: uuidv4(),
      steelType: "",
      quantity: 1,
      width: null,
      shape: "square",
      length: 0,
      thickness: 0,
      notes: "",
      cuttingMethod: "normal",
      job: null,
      isOD: false,
      isServices: false,
    };
    setSteelItems((prev) => [...prev, newItem]);
  };
  // Remove steel item
  const removeSteelItem = (id: string) => {
    if (steelItems.length > 1) {
      setSteelItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const applyOcrToForm = (data: OcrParseResponse) => {
    // 1) headOrder
    setheadOrder((prev) => ({
      ...prev,
      poNumber: data.orderDraft?.poNumber ?? prev.poNumber,
      deliveryDate: data.orderDraft?.deliveryDate ?? prev.deliveryDate,
    }));

    // 2) customer: match -> select / else -> showForm + fill
    if (data.customerMatch?.matched && data.customerMatch.customerId) {
      setSelectedCustomerId(String(data.customerMatch.customerId));
      setShowForm(false);
    } else {
      setSelectedCustomerId(null);
      setShowForm(true);

      const c = data.customerDraft;
      setFormData((prev) => ({
        ...prev,
        customerName: c.name ?? "",
        deliveryAddress: c.address ?? "",
        customerPhone: c.tel ?? "",
        taxNumber: c.taxNumber ?? "",
        faxNumber: c.faxNumber ?? "",
        customerEmail: c.email ?? "",
      }));
    }

    // 3) steelItems จาก steelTypeId ที่ match มาแล้ว
    const mapped: SteelItem[] = (data.items ?? []).map((x) => ({
      id: uuidv4(),
      steelType: x.match?.steelTypeId ? String(x.raw.codeSteel) : "",
      shape: x.raw?.shape ?? "square",
      quantity: x.raw?.quantity ?? 1,
      width: x.raw?.width ?? null,
      length: x.raw?.length ?? 0,
      thickness: x.raw?.thickness ?? 0,
      notes: x.raw?.notes ?? "",
      cuttingMethod: x.raw?.cuttingMethod ?? "normal",
      job: x.raw?.job ?? null,
      isOD: x.raw?.isOD ?? false,
      isServices: x.raw?.isServices ?? false,
    }));
    if (mapped.length) setSteelItems(mapped);
    const customerLine = data.customerMatch?.matched
      ? `${data.customerDraft?.name}: #${data.customerMatch.customerId}`
      : `ไม่พบลูกค้าในระบบ: ${data.customerDraft?.name || "-"}`;

    setOcrSummary({
      customerLine,
      items: (data.items ?? []).map((it) => ({
        codeSteel: it.raw?.codeSteel || "(ไม่พบรหัส)",
        thickness: it.raw?.thickness ?? null,
        width: it.raw?.width ?? null,
        length: it.raw?.length ?? null,
        quantity: it.raw?.quantity ?? null,
        description: it.raw?.description ?? null,
      })),
    });

    setOcrStage("done");
  };

  const handleRunOcr = async () => {
    const firstFile = UploadFile[0];
    if (!firstFile) {
      toast.error("กรุณาแนบไฟล์ก่อนกด OCR", { position: "bottom-right" });
      return;
    }

    try {
      setOcrLoading(true);
      setOcrModalOpen(true);
      setOcrStage("loading");
      setOcrSummary(null);

      const file = new FormData();
      file.append("files", firstFile); // ส่งแค่ไฟล์แรก

      const res = await fetch("/api/ocr/parse-po", {
        method: "POST",
        body: file,
      });

      const data: OcrParseResponse = await res.json().catch(() => ({}) as any);
      if (!res.ok) throw new Error((data as any)?.error || "OCR parse failed");

      setOcrData(data);
      applyOcrToForm(data);

      toast.success("เติมข้อมูลจาก OCR แล้ว กรุณาตรวจสอบก่อนบันทึก", {
        position: "bottom-right",
      });
    } catch (err) {
      console.error(err);
      toast.error(
        `OCR ไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`,
        { position: "bottom-right" },
      );
    } finally {
      setOcrLoading(false);
    }
  };

  const resetOcr = () => {
    setOcrData(null);
  };

  // function to validate from data
  const validateForm = () => {
    if (showForm) {
      // if (!formData.code.trim()) return "กรุณากรอกรหัสลูกค้า (Code)";
      if (!formData.customerName.trim()) return "กรุณากรอกชื่อลูกค้า";
      if (!formData.deliveryAddress.trim())
        return "กรุณากรอกที่อยู่สำหรับจัดส่ง";
      if (!formData.taxNumber.trim()) return "กรุณากรอกเลข Tax";
    }

    if (!headOrder.deliveryDate) return "กรุณากรอกวันที่ต้องการสินค้า";

    if (useJob == true && steelItems.some((item) => !item.job)) {
      return "กรุณากรอกหมายเลข Job ในรายการเหล็กที่เลือก";
    }
    if (steelItems.length === 0)
      return "กรุณาเพิ่มรายการเหล็กอย่างน้อย 1 รายการ";
    for (const item of steelItems) {
      if (!item.steelType) return "กรุณาเลือกประเภทเหล็ก";
      if (item.quantity <= 0) return "จำนวนชิ้นต้องมากกว่า 0";
    }
    if (steelItems.length > 15)
      return "ไม่สามารถเพิ่มรายการเหล็กเกิน 15 รายการ";
    if (
      steelItems.some(
        (item) =>
          item.length <= 0 ||
          item.thickness <= 0 ||
          (item.shape === "square" && (item.width === null || item.width <= 0)),
      )
    )
      return "ขนาดของเหล็กต้องมากกว่า 0";
    return null;
  };

  return (
    <div className="min-h-screen md:pl-24 ">
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
              สร้างออเดอร์ใหม่
            </h1>
          </div>
          <p className="text-muted-foreground">
            กรอกข้อมูลออเดอร์ใหม่สำหรับการตัดเหล็ก
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
                    setSelectedCustomer={setSelectedCustomerId}
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
                  onClick={toggleForm}
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
                  {showForm ? "เลือกรายชื่อเดิม" : "เพิ่มลูกค้าใหม่"}
                </button>

                {/* Upload Button */}
                <label className="cursor-pointer group flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all shadow-sm">
                  <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span>แนบไฟล์</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                <Button
                  type="button"
                  onClick={handleRunOcr}
                  disabled={ocrLoading || UploadFile.length === 0}
                  className="h-10"
                >
                  {ocrLoading ? "กำลัง OCR..." : "ดึงข้อมูลจากไฟล์ (OCR)"}
                </Button>
              </div>
            </div>
          </div>

          {/* --- Zone 2: File Preview Grid --- */}
          {UploadFile.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {UploadFile.map((file: File, index: number) => {
                const isImage = file.type.startsWith("image/");
                const fileUrl = URL.createObjectURL(file);

                return (
                  <div
                    key={index}
                    className="group relative flex items-center gap-3 p-2 border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {/* File Icon / Image Preview */}
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0"
                    >
                      {isImage ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 dark:border-zinc-800">
                          <img
                            src={fileUrl}
                            alt="preview"
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                    </a>

                    {/* File Name */}
                    <div className="flex-1 min-w-0">
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs font-medium text-slate-700 dark:text-slate-200 truncate hover:text-blue-500 transition-colors"
                        title={file.name}
                      >
                        {file.name}
                      </a>
                      <p className="textxs text-slate-400 dark:text-slate-500 uppercase mt-0.5">
                        {file.name.split(".").pop() || "FILE"}
                      </p>
                    </div>

                    {/* Delete Button (Absolute) */}
                    <button
                      onClick={() => handRemoveFile(index)}
                      className="absolute -top-2 -right-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-400 hover:text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:scale-110 z-10"
                      aria-label="ลบไฟล์"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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
                {/* AddItem */}
                <div className="mb-4">
                  <AddItem
                    steelItems={steelItems}
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
                  />
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
                            {totalQuantity.toLocaleString()}
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
                              {totalTypes}
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
                              {formatDate(headOrder.deliveryDate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-zinc-200 dark:bg-zinc-800" />

                      {/* CTA */}
                      <div className="space-y-3">
                        <Button
                          type="submit"
                          disabled={isSubmitting || totalTypes === 0}
                          className="w-full h-12 text-base font-semibold shadow-md shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 active:scale-[0.98]"
                        >
                          {" "}
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
      {ocrModalOpen && (
        <div className="fixed inset-0 z-50">
          {/* overlay กันคลิก */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* modal */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="text-sm font-semibold">
                  {ocrStage === "loading"
                    ? "กำลังอ่านเอกสาร (OCR)..."
                    : "สรุปผล OCR"}
                </div>

                {/* ปิดได้เฉพาะตอน done */}
                <Button
                  type="button"
                  variant="ghost"
                  disabled={ocrStage !== "done"}
                  onClick={() => setOcrModalOpen(false)}
                >
                  ปิด
                </Button>
              </div>

              <div className="p-4 space-y-4">
                <OcrResultModal
                  open={ocrModalOpen}
                  stage={ocrStage}
                  summary={ocrSummary}
                  onClose={() => setOcrModalOpen(false)}
                />
              </div>

              {/* footer */}
              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
                <Button
                  type="button"
                  disabled={ocrStage !== "done"}
                  onClick={() => setOcrModalOpen(false)}
                >
                  เข้าใจแล้ว
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default NewJobOrder;
