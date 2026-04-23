"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
import { Separator } from "@/components/ui/separator";
import { ToastContainer, toast } from "react-toastify";
import CustomerForm from "@/components/newJobOrder/CustomerForm";
import CustomerInfoBox from "@/components/newJobOrder/CustomerInfoBox";
import { HeaderSection } from "@/components/newJobOrder/HeaderSection";
import { ItemsSection } from "@/components/newJobOrder/ItemsSection";
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
import { SteelType, SteelItem, HeadOrderType } from "@/types/order.types";
import {
  OcrResultModal,
  type OcrSummary,
} from "@/components/newJobOrder/OcrResultModel";
import { tr } from "date-fns/locale";

type CustomerApiItem = {
  id: number;
  name: string;
  credit: number;
};

type CustomerApiResponse = {
  data: CustomerApiItem[];
};

type OcrParseResponse = {
  source: { fileName: string; fileType: string; fileSize: number };
  customerMatch: {
    matched: boolean;
    customerId: number | null;
    matchedBy: "taxNumber" | "tel" | "faxNumber" | "email" | null;
  };
  customerDraft: {
    code: string | null;
    name: string;
    address: string;
    tel: string;
    taxNumber: string | null;
    faxNumber: string | null;
    email: string | null;
  };
  orderDraft: {
    ponumber: string | null;
    poDate: string | null;
    deliveryDate: string | null;
    yourRef: string | null;
  };
  items: Array<{
    raw: {
      codeSteel: string | null;
      description: string | null;
      shape: ShapeSteel | null;
      width: number | null;
      length: number | null;
      thickness: number | null;
      quantity: number | null;
      cuttingMethod: CuttingMethod | null;
      job: string | null;
      confidence: number | null;
      notes: string | null;
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

  const [open, setOpen] = useState(false); //เปิดหรือปิด SelectCustomer
  const [useJob, setUseJob] = useState(false);
  // ลูกค้า
  const [customers, setCustomers] = useState<
    { id: number; name: string; credit: number }[]
  >([]);
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
  const [ocrSummary, setOcrSummary] = useState<OcrSummary | null>(null);
  const ocrAbortRef = useRef<AbortController | null>(null);
  // เก็บ ID ลูกค้าที่เลือกจาก SelectCustomer
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
  const [headOrder, setheadOrder] = useState<HeadOrderType>({
    poNumber: null,
    credit: 30,
    deliveryDate: new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString().split("T")[0],
  });

  const [steelTypes, setSteelTypes] = useState<SteelType[]>([]);
  const [SteelItem, setSteelItem] = useState<SteelItem[]>([
    {
      id: "",
      SteelId: 0,
      steelType: "",
      shape: "square",
      sequence: 1,
      wide: 0,
      length: 0,
      thickness: 0,
      amount: 0,
      detail: "",
      cuttingMethod: "normal",
      weight: null,
      discount: null,
      density: 0.0000079,
      price: 0,
      isOD: false,
      isServices: false,
      isPerAmount: false,
      requiresDimensions: true,
      requiresAmount: true,
    },
  ]);

  //จำนวนรวมของเหล็ก
  const totalQuantity = SteelItem.reduce((sum, item) => sum + item.amount, 0);
  //จำนวนประเภทเหล็ก
  const totalTypes = new Set(
    SteelItem.filter((item) => item.steelType).map(
      (item) => `${item.steelType}::${item.shape}`,
    ),
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
            data.map(
              (t: {
                id: number;
                codeSteel: string;
                shape: string;
                price: number;
                density: number;
                requiresDimensions: boolean;
                requiresAmount: boolean;
              }) => ({
                id: t.id.toString(),
                steelType: t.codeSteel, // ใช้เป็น value/label ใน Select
                shape: t.shape,
                price: Number(t.price ?? 0),
                density: Number(t.density ?? 0.0000079),
                requiresDimensions: Boolean(t.requiresDimensions),
                requiresAmount: Boolean(t.requiresAmount),
              }),
            ),
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
              credit: c.credit ?? 30,
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

  useEffect(() => {
    if (selectedCustomerId == null) return;
    const selected = customers.find((c) => c.id === selectedCustomerId);
    if (!selected) return;

    setheadOrder((prev) => ({ ...prev, credit: selected.credit }));
  }, [selectedCustomerId]);

  useEffect(() => {
    const firstSteelType = steelTypes[0];
    if (!firstSteelType) return;

    setSteelItem((prev) => {
      if (prev.length !== 1) return prev;

      const first = prev[0]!;
      if (first.SteelId > 0 && first.steelType) return prev;

      const shape: ShapeSteel =
        firstSteelType.shape === "line" ? "line" : "square";

      return [
        {
          ...first,
          id: first.id || uuidv4(),
          SteelId: Number(firstSteelType.id ?? 0),
          steelType: firstSteelType.steelType ?? "",
          shape,
          wide: shape === "line" ? null : (first.wide ?? 1),
          price: Number(firstSteelType.price ?? 0),
          density: Number(firstSteelType.density ?? 0.0000079),
          requiresDimensions: Boolean(firstSteelType.requiresDimensions),
          requiresAmount: Boolean(firstSteelType.requiresAmount),
        },
      ];
    });
  }, [steelTypes]);

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
      const poKeys = await UploadFiles({
        files: UploadFile,
        poNumber: headOrder.poNumber || null,
        customerId: customerId || "",
      });

      const payloadBill = {
        customerId: showForm ? undefined : (customerId ?? undefined), // ถ้าแสดงฟอร์ม แปลว่าเพิ่งสร้างลูกค้าใหม่ ยังไม่มี ID
        companyName: formData.customerName,
        address: formData.deliveryAddress,
        tel: formData.customerPhone || undefined,
        tax: formData.taxNumber,
        fax: formData.faxNumber || undefined,
        email: formData.customerEmail || undefined,
        deliveryDate: new Date(headOrder.deliveryDate).toISOString(),
        createdAt: headOrder.createdAt
          ? new Date(headOrder.createdAt).toISOString()
          : new Date().toISOString(),
        orderPO: {
          poNumber: headOrder.poNumber ?? null,
          credit: headOrder.credit,
          urlPo: poKeys,

          products: SteelItem.map((item, index) => ({
            SteelId: item.SteelId,
            sequence: index + 1,
            steelType: item.steelType,
            shape: item.shape,
            wide: item.wide || null,
            length: item.length || null,
            thickness: item.thickness || null,
            amount: item.amount || 0,

            detail: item.detail || undefined, // optional ส่ง undefined ได้
            job: item.job ?? null,
            cuttingMethod: item.cuttingMethod ?? "normal",

            isOD: item.isOD || false,
            isServices: item.isServices || false,
            isPerAmount: item.isPerAmount || false,
            weight: item.weight ?? null,
            discount: item.discount ?? null,
            price: item.price,
          })),
        },
      };

      //สร้างออเดอร์ใหม่
      const billRes = await fetch(`/api/createNewOrder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadBill),
      });

      const rawText = await billRes.text();

      console.log("Payload Bill:", payloadBill);
      if (!billRes.ok) {
        let parsed: any = null;
        try {
          parsed = rawText ? JSON.parse(rawText) : null;
        } catch {
          parsed = null;
        }

        if (billRes.status === 409 && parsed?.prismaCode === "P2002") {
          const fieldLabel: Record<string, string> = {
            taxNumber: "เลขผู้เสียภาษี",
            email: "อีเมล",
            tel: "เบอร์โทร",
            telSearch: "เบอร์โทร",
            faxNumber: "แฟกซ์",
            faxNumberSearch: "แฟกซ์",
            codeCustomer: "รหัสลูกค้า",
          };

          const fields: string[] = Array.isArray(parsed?.duplicateFields)
            ? parsed.duplicateFields
            : [];
          const labels = fields.map((f) => fieldLabel[f] ?? f);
          const detail = labels.length ? labels.join(", ") : "ข้อมูลในระบบ";

          throw new Error(`ข้อมูลซ้ำ: ${detail}`);
        }

        const serverMessage = parsed?.error ?? rawText;
        throw new Error(
          "เกิดข้อผิดพลาดในการสร้างออเดอร์ใหม่" +
            (serverMessage ? `: ${serverMessage}` : ""),
        );
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
      const message = error instanceof Error ? error.message : String(error);
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
    setSteelItem((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  // Add steel items
  const addSteelItem = () => {
    const firstSteelType = steelTypes[0];
    if (!firstSteelType) {
      toast.error("ไม่พบประเภทเหล็กในระบบ", { position: "bottom-right" });
      return;
    }
    const firstShape: ShapeSteel = firstSteelType?.shape ?? "square";
    const nextSequence =
      SteelItem.length > 0
        ? Math.max(...SteelItem.map((item) => item.sequence ?? 0)) + 1
        : 1;
    const newItem: SteelItem = {
      id: uuidv4(),
      SteelId: Number(firstSteelType?.id ?? 0),
      steelType: firstSteelType?.steelType ?? "",
      amount: 0,
      wide: firstShape === "line" ? null : 0,
      shape: firstShape,
      sequence: nextSequence,
      length: 0,
      thickness: 0,
      detail: "",
      weight: null,
      price: Number(firstSteelType?.price ?? 0),
      discount: null,
      density: Number(firstSteelType?.density ?? 0.0000079),
      cuttingMethod: "normal",
      job: null,
      isOD: false,
      isServices: false,
      isPerAmount: false,
      requiresDimensions: Boolean(firstSteelType?.requiresDimensions),
      requiresAmount: Boolean(firstSteelType?.requiresAmount),
    };
    setSteelItem((prev) => [...prev, newItem]);
  };
  // Remove steel item
  const removeSteelItem = (id: string) => {
    if (SteelItem.length > 1) {
      setSteelItem((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // ฟังก์ชันใส่ข้อมูลจาก OCR ลงในฟอร์ม
  const applyOcrToForm = (data: OcrParseResponse) => {
    // 1) headOrder
    setheadOrder((prev) => ({
      ...prev,
      poNumber: data.orderDraft?.ponumber ?? prev.poNumber,
      deliveryDate: data.orderDraft?.deliveryDate ?? prev.deliveryDate,
    }));

    // 2) customer: match -> select / else -> showForm + fill
    if (data.customerMatch?.matched && data.customerMatch.customerId) {
      setSelectedCustomerId(data.customerMatch.customerId);
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
    const mapped: SteelItem[] = (data.items ?? []).map((x) => {
      const shape: ShapeSteel = x.raw?.shape ?? "square";
      const steelTypeId = x.match?.steelTypeId ?? null;
      const steelTypeName = x.raw?.codeSteel ? String(x.raw.codeSteel) : "";

      const matchedType =
        steelTypeId != null
          ? steelTypes.find((s) => Number(s.id) === steelTypeId) // ถ้า OCR มี ID มาให้ ก็แมตช์ด้วย ID เป็นหลัก
          : steelTypes.find(
              (s) => s.steelType === steelTypeName && s.shape === shape, // ถ้าไม่มี ID ก็แมตช์ด้วยชื่อและรูปทรง
            );

      return {
        id: uuidv4(),
        SteelId: steelTypeId ?? Number(matchedType?.id ?? 0),
        steelType: matchedType?.steelType ?? steelTypeName,
        shape,
        sequence: 0,
        wide: shape === "line" ? null : (x.raw?.width ?? null),
        length: x.raw?.length ?? 0,
        thickness: x.raw?.thickness ?? 0,
        amount: x.raw?.quantity ?? 0,
        detail: x.raw?.notes ?? x.raw?.description ?? "",
        cuttingMethod: x.raw?.cuttingMethod ?? "normal",
        weight: null,
        price: Number(matchedType?.price ?? 0),
        discount: null,
        density: Number(matchedType?.density ?? 0.0000079),
        isOD: false,
        isServices: false,
        isPerAmount: false,
        job: x.raw?.job ? String(x.raw.job) : null,
        requiresDimensions: true,
        requiresAmount: true,
      };
    });
    if (mapped.length) {
      setSteelItem(mapped.map((it, index) => ({ ...it, sequence: index + 1 }))); // กำหนด sequence ใหม่ตามลำดับใน OCR
    }
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
        description: it.raw?.notes ?? it.raw?.description ?? null,
      })),
    });

    setOcrStage("done");
  };
  // ฟังก์ชันดึงข้อมูลประเภทเหล็กสำหรับการแมตช์กับผล OCR
  const handleRunOcr = async () => {
    const firstFile = UploadFile[0];
    if (!firstFile) {
      toast.error("Please attach a file before running OCR", {
        position: "bottom-right",
      });
      return;
    }

    let controller: AbortController | null = null;
    try {
      setOcrLoading(true);
      setOcrModalOpen(true);
      setOcrStage("loading");
      setOcrSummary(null);

      controller = new AbortController();
      ocrAbortRef.current = controller;

      const file = new FormData();
      file.append("files", firstFile);

      const res = await fetch("/api/ocr/parse-po", {
        method: "POST",
        body: file,
        signal: controller.signal,
      });

      const data: OcrParseResponse = await res.json().catch(() => ({}) as any);
      if (!res.ok) throw new Error((data as any)?.error || "OCR parse failed");

      setOcrData(data);
      applyOcrToForm(data);

      toast.success("อ่านข้อมูลจากเอกสารแล้ว กรุณาตรวจสอบข้อมูลทีก่อนบันทึก", {
        position: "bottom-right",
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      console.error(err);
      setOcrModalOpen(false);
      toast.error(`${err instanceof Error ? err.message : String(err)}`, {
        position: "bottom-right",
      });
    } finally {
      if (controller && ocrAbortRef.current === controller) {
        ocrAbortRef.current = null;
      }
      setOcrLoading(false);
    }
  };

  const handleCloseOcrModal = () => {
    if (ocrLoading && ocrStage === "loading") {
      ocrAbortRef.current?.abort();
      toast.info("ยกเลิกการ OCR แล้ว", { position: "bottom-right" });
    }

    setOcrModalOpen(false);
  };

  const resetOcr = () => {
    setOcrData(null);
  };

  // function to validate from data
  const validateForm = () => {
    if (!showForm && !selectedCustomerId) {
      return "กรุณาเลือกลูกค้า หรือเพิ่มลูกค้าใหม่";
    }
    if (showForm) {
      // if (!formData.code.trim()) return "กรุณากรอกรหัสลูกค้า (Code)";
      if (!formData.customerName.trim()) return "กรุณากรอกชื่อลูกค้า";
      if (!formData.deliveryAddress.trim())
        return "กรุณากรอกที่อยู่สำหรับจัดส่ง";
      if (!formData.taxNumber.trim()) return "กรุณากรอกเลข Tax";
    }

    if (!headOrder.deliveryDate) return "กรุณากรอกวันที่ต้องการสินค้า";

    if (useJob == true && SteelItem.some((item) => !item.job?.trim())) {
      return "กรุณากรอกหมายเลข Job ในรายการเหล็กที่เลือก";
    }
    if (SteelItem.length === 0)
      return "กรุณาเพิ่มรายการเหล็กอย่างน้อย 1 รายการ";

    for (const item of SteelItem) {
      if (!item.steelType) return "กรุณาเลือกประเภทเหล็ก";
      if (!item.SteelId || item.SteelId <= 0) return "กรุณาเลือกประเภทเหล็ก";
      if (item.amount <= 0 && item.requiresAmount)
        return "จำนวนชิ้นต้องมากกว่า 0";
    }

    if (
      SteelItem.some(
        (item) =>
          item.requiresDimensions &&
          (item.thickness == null || item.thickness <= 0 ||
            (item.isOD === false && (!item.length || item.length <= 0)) ||
            (item.shape === "square" &&
              (item.wide === null || item.wide <= 0))),
      )
    )
      return "ขนาดของเหล็กต้องมากกว่า 0";

    if (SteelItem.length > 15) return "ไม่สามารถเพิ่มรายการเหล็กเกิน 15 รายการ";
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
              <div className="min-w-55">
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
                      className="shrink-0"
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
                <div className="mb-4 space-y-6">
                  <HeaderSection
                    headOrder={headOrder}
                    setheadOrder={setheadOrder}
                  />

                  <ItemsSection
                    steelItems={SteelItem}
                    setSteelItems={setSteelItem}
                    updateSteelItem={updateSteelItem}
                    addSteelItem={addSteelItem}
                    removeSteelItem={removeSteelItem}
                    steelTypes={steelTypes}
                    useJob={useJob}
                    setUseJob={setUseJob}
                    searchItem={searchItem}
                    setsearchItem={setsearchItem}
                    loadingSteel={loadingSteel}
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
                          className="w-full h-12 text-base font-semibold shadow-md shadow-blue-500/20 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 active:scale-[0.98]"
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
      <OcrResultModal
        open={ocrModalOpen}
        stage={ocrStage}
        summary={ocrSummary}
        onClose={handleCloseOcrModal}
      />
      <ToastContainer />
    </div>
  );
};

export default NewJobOrder;
