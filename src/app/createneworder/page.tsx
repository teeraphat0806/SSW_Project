"use client";
import { useEffect, useState } from "react";
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
import { ArrowLeft, FileText, Save, X } from "lucide-react";
import SelectCustomer from "@/components/SelectCustomer";
//import { se } from "date-fns/locale";

type SteelItem = {
  id: string;
  steelType: string;
  shape: "line" | "square" | string;
  quantity: number;
  width: number;
  length: number;
  thickness: number;
  notes: string;
  hasNotes: boolean;
};

type SteelType = {
  id: string;
  name: string; // ใช้แสดงใน Select
  shape: string; // 'line' | 'square' | ...
};

const NewJobOrder = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [UploadFile, setUploadFile] = useState<File[]>([]); //ดึงไฟล์อัปโหลด
  const [showForm, setShowForm] = useState(false); //แสดงหรือซ่อนข้อมุลลูกค้า
  const toggleForm = () => setShowForm(!showForm); //ฟังก์ชั่นแสดงฟอร์มลูกค้า
  const [open, setOpen] = useState(false); //เปิดหรือปิด SelectCustomer
  // ลูกค้า
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>(
    []
  );
  const [searchCustoer, setsearchCustoer] = useState(""); // เก็บค่าที่ค้นหาลูกค้า

  // สินค้า
  const [searchItem, setsearchItem] = useState(""); //เก็บค่าที่ค้นหาสินค้า
  const [loadingSteel, setLoadingSteel] = useState(false);
  const [loading, setLoading] = useState(false); //สถานะโหลดข้อมุล

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  ); // เก็บ ID ลูกค้าที่เลือกจาก SelectCustomer
  const [headOrder, setheadOrder] = useState({
    //เก็บข้อมูล PO
    poNumber: "",
    deliveryDate: "",
    yourRef: "",
  });

  const [steelTypes, setSteelTypes] = useState<SteelType[]>([]);
  const [steelItems, setSteelItems] = useState<SteelItem[]>([
    {
      id: "",
      steelType: "",
      shape: "",
      quantity: 1,
      width: 0,
      length: 0,
      thickness: 0,
      notes: "",
      hasNotes: false,
    },
  ]);

  useEffect(() => {
    let ignore = false;

    const fetchSteelTypes = async () => {
      setLoadingSteel(true);
      try {
        const urlSteelType =
          searchItem.trim() === ""
            ? `${process.env.NEXTAUTH_URL}api/steelType`
            : `${process.env.NEXTAUTH_URL}api/steelType/${encodeURIComponent(
                searchItem
              )}`;

        const res = await fetch(urlSteelType);
        if (!res.ok) throw new Error("Error fetching steel types");

        const data = await res.json();

        if (!ignore) {
          // 👇 ตรงนี้เปลี่ยนเป็น setSteelTypes
          setSteelTypes(
            data.map((t: { id: number; codeSteel: string; shape: string }) => ({
              id: t.id.toString(),
              name: t.codeSteel, // ใช้เป็น value/label ใน Select
              shape: t.shape,
            }))
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
        const urlCustomer =
          searchCustoer.trim() === ""
            ? `${process.env.NEXTAUTH_URL}api/customer`
            : `${
                process.env.NEXTAUTH_URL
              }api/customer/name/${encodeURIComponent(searchCustoer)}`;
        const res = await fetch(urlCustomer);
        if (!res.ok) throw new Error("Error fetching customers");

        const data = await res.json();

        if (!ignore) {
          setCustomers(
            data.map((c: { id: number; name: string }) => ({
              id: c.id.toString(),
              name: c.name,
            }))
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
  }, [searchCustoer, searchItem]);

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
  const [formData, setFormData] = useState({
    code: "",
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
    poNumber: string;
    customerId: string | number;
  }) {
    if (!files?.length) return [];

    const form = new FormData();
    form.append("poNumber", poNumber);
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
          code: formData.code,
          name: formData.customerName,
          address: formData.deliveryAddress,
          tel: formData.customerPhone,
          taxNumber: formData.taxNumber,
          faxNumber: formData.faxNumber,
          email: formData.customerEmail,
        };
        const customerRes = await fetch(
          `${process.env.NEXTAUTH_URL}api/customer`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadNewcustomer),
          }
        );
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
        poNumber: headOrder.poNumber,

        customerId: customerId,
      });

      const payloadBill = {
        customerId: Number(customerId),
        yourRef: "REF108",
        deliveryDate: new Date(headOrder.deliveryDate).toISOString(),
        vat: 7.0,
        orderPOs: [
          {
            poNumber: headOrder.poNumber,
            total: steelItems.reduce((sum, item) => {
              return sum + item.quantity;
            }, 0),
            vat: 7.0,
            urlPo: poKeys,
            products: steelItems.map((item) => {
              return {
                steelType: item.steelType,
                wide: item.width,
                length: item.length,
                amount: item.quantity,
                thickness: item.thickness,
                total: 200,
                detail: item.notes || "",
              };
            }),
          },
        ],
      };
      //สร้างออเดอร์ใหม่
      const billRes = await fetch(`${process.env.NEXTAUTH_URL}api/createNewOrder`, {
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
      let billData: undefined = null;
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

      toast.error(`สร้างออเดอรืใหม่ไม่สำเร็จ: ${error.message}`, {
        position: "bottom-right",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update form data
  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  // Update steel item
  const updateSteelItem = (id: string, field: string, value: string) => {
    setSteelItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Add steel items
  const addSteelItem = () => {
    const newItem: SteelItem = {
      id: uuidv4(),
      steelType: "",
      quantity: 1,
      width: 0,
      shape: "line",
      length: 0,
      thickness: 0,
      notes: "",
      hasNotes: false,
    };
    setSteelItems((prev) => [...prev, newItem]);
  };
  // Remove steel item
  const removeSteelItem = (id: string) => {
    if (steelItems.length > 1) {
      setSteelItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // function to validate from data
  const validateForm = () => {
    if (showForm) {
      if (!formData.code.trim()) return "กรุณากรอกรหัสลูกค้า (Code)";
      if (!formData.customerName.trim()) return "กรุณากรอกชื่อลูกค้า";
      if (!formData.deliveryAddress.trim())
        return "กรุณากรอกที่อยู่สำหรับจัดส่ง";
      if (!formData.customerPhone.trim()) return "กรุณากรอกเบอร์ลูกค้า";
      if (!formData.taxNumber.trim()) return "กรุณากรอกเลข Tax";
      if (!formData.faxNumber.trim()) return "กรุณากรอกเลข Fax";
    }
    if (!UploadFile.length) return "กรุณาอัปโหลดไฟล์ใบ PO";
    if (!headOrder.poNumber.trim()) return "กรุณากรอกหมายเลข PO";
    if (!headOrder.deliveryDate) return "กรุณากรอกวันที่ต้องการสินค้า";
    for (const item of steelItems) {
      if (!item.steelType) return "กรุณาเลือกประเภทเหล็ก";
      if (item.quantity <= 0) return "จำนวนชิ้นต้องมากกว่า 0";
    }
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
        <div className="mb-3 flex items-center gap-3">
          {showForm ? (
            <></>
          ) : (
            <SelectCustomer
              open={open}
              setOpen={setOpen}
              selectedCustomerId={selectedCustomerId}
              setSelectedCustomer={setSelectedCustomerId}
              customers={customers}
              search={searchCustoer}
              setSearch={setsearchCustoer}
              loading={loading}
            />
          )}

          <button
            onClick={toggleForm}
            className="rounded-md bg-blue-500 px-4 py-1.5 text-sm text-white transition hover:bg-blue-600"
          >
            {showForm ? "แสดงข้อมูล" : "เพิ่มข้อมูล"}
          </button>

          <label className="cursor-pointer rounded-md bg-gray-100 px-4 py-1.5 text-sm text-gray-700 border border-gray-300 hover:bg-gray-200 transition">
            อัปโหลดไฟล์
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            {UploadFile.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-1 border rounded bg-aa hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3 text-sm  text-foreground">
                  {/* คลิกชื่อไฟล์เพื่อดู */}
                  {file.type.startsWith("image/") && (
                    <a
                      href={URL.createObjectURL(file)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="h-10 w-10 object-cover rounded border"
                      />
                    </a>
                  )}
                  <a
                    href={URL.createObjectURL(file)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline break-all"
                  >
                    {file.name}
                  </a>
                </div>

                {/* ปุ่มลบไฟล์ */}
                <button
                  onClick={() => handRemoveFile(index)}
                  className="text-red-500 hover:text-red-700"
                  aria-label="ลบไฟล์"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
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
                    <CustomerInfoBox customerId={selectedCustomerId} />
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
                  />
                </div>

                <div>
                  <Card className="shadow-steel">
                    <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Total Items:
                          </span>
                          <span className="font-medium">
                            {steelItems.reduce(
                              (sum, item) => sum + item.quantity,
                              0
                            )}{" "}
                            pieces
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Steel Types:
                          </span>
                          <span className="font-medium">
                            {
                              new Set(
                                steelItems
                                  .filter((item) => item.steelType)
                                  .map((item) => item.steelType)
                              ).size
                            }
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Deadline:
                          </span>
                          {headOrder.deliveryDate}
                        </div>
                      </div>
                      <Separator />
                      <div>
                        {/* Action Buttons */}
                        <div className="space-y-3 mt-6">
                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full"
                            size="lg"
                          >
                            {isSubmitting ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                                Creating Order...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Create Job Order
                              </>
                            )}
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/dashboard")}
                            className="w-full "
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              {/* Steel Items */}
            </div>
          </div>
        </form>
      </div>

      <ToastContainer />
    </div>
  );
};

export default NewJobOrder;
