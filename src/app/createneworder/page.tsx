"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ToastContainer, toast } from "react-toastify";
import CustomerForm from "@/components/CustomerForm";
import CustomerInfoBox from "@/components/CustomerInfoBox";
import AddItem from "@/components/AddItem";
import "../globals.css";

import {
  ArrowLeft,
  FileText,
  Package,
  Ruler,
  Weight,
  Plus,
  Save,
  X,
} from "lucide-react";

interface SteelItem {
  id: string;
  steelType: string;
  quantity: number;
  width: number;
  length: number;
  thickness: number;
  notes?: string;
}

const steelTypes = [
  "Carbon Steel",
  "Stainless Steel",
  "Aluminum",
  "Galvanized Steel",
  "Cold Rolled Steel",
  "Hot Rolled Steel",
  "Mild Steel",
  "Tool Steel",
];

const NewJobOrder = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [UploadFile, setUploadFile] = useState<File[]>([]);
  const [showForm, setShowForm] = useState(false);
  const toggleForm = () => setShowForm(!showForm);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filelist = Array.from(event.target.files);
      setUploadFile((prev) => [...prev, ...filelist]);
    }
  };

  const handRemoveFile = (index: number) => {
    setUploadFile((prev) => prev.filter((_, i) => i !== index));
  };

  // Form state
  const [formData, setFormData] = useState({
    poNumber: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    deliveryAddress: "",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
    deliveryDate: "",
    specialInstructions: "",
  });

  const [steelItems, setSteelItems] = useState<SteelItem[]>([
    {
      id: "1",
      steelType: "",
      quantity: 1,
      width: 0,
      length: 0,
      thickness: 0,
      notes: "",
    },
  ]);

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateSteelItem = (id: string, field: string, value: any) => {
    setSteelItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addSteelItem = () => {
    const newItem: SteelItem = {
      id: Date.now().toString(),
      steelType: "",
      quantity: 1,
      width: 0,
      length: 0,
      thickness: 0,
      notes: "",
    };
    setSteelItems((prev) => [...prev, newItem]);
  };

  const removeSteelItem = (id: string) => {
    if (steelItems.length > 1) {
      setSteelItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const validateForm = () => {
    if (!formData.poNumber.trim()) return "Purchase Order Number is required";
    if (!formData.customerName.trim()) return "Customer Name is required";

    for (let item of steelItems) {
      if (!item.steelType) return "Steel Type is required for all items";
      if (item.quantity <= 0) return "Quantity must be greater than 0";
      if (item.width <= 0) return "Width must be greater than 0";
      if (item.length <= 0) return "Length must be greater than 0";
      if (item.thickness <= 0) return "Thickness must be greater than 0";
    }

    return null;
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const jobOrder = {
        id: `JO-${Date.now()}`,
        ...formData,
        steelItems,
        status: "pending",
        createdAt: new Date(),
        totalItems: steelItems.reduce((sum, item) => sum + item.quantity, 0),
      };

      console.log("New Job Order:", jobOrder);
      toast.success("สร้างออเดอร์สำเร็จ", {
        position: "bottom-right",
      });

      // Navigate back to dashboard
      router.push("/dashboard");
    } catch (error) {
      toast.error(`ขออภัย มีข้อผิดพลาด: ${validationError}`, {
        position: "bottom-right",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-destructive text-destructive-foreground";
      case "high":
        return "bg-warning text-warning-foreground";
      case "normal":
        return "bg-primary text-primary-foreground";
      case "low":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen md:pl-24 ">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับสู่หน้าหลัก
          </Button>

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
          <select className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option>สยาม</option>
            <option>สยามเหล็ก</option>
            <option>สยามเหล็กกล้า</option>
          </select>
          <button
            onClick={toggleForm}
            className="rounded-md bg-blue-500 px-4 py-1.5 text-sm text-white transition hover:bg-blue-600"
          >
            {showForm ? "แสดงข้อมูล" : "เพิ่มข้อมูล"}
          </button>

          <label className="cursor-pointer rounded-md bg-gray-100 px-4 py-1.5 text-sm text-gray-700 border border-gray-300 hover:bg-gray-200 transition">
            อัปโหลดไฟล์
            <input type="file" className="hidden" onChange={handleFileChange} />
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
          {/* <div className="mt-2 space-y-1">
            {UploadFile.map((file, index) => (
              <div
                key={index}
                className="text-sm text-gray-700 flex items-center gap-2"
              >
                <span>{file.name}</span>
                {file.type.startsWith("image/") && (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="h-10 w-10 object-cover border rounded"
                  />
                )}
                {file.type === "application/pdf" && (
                  <a
                    href={URL.createObjectURL(file)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    ดูไฟล์
                  </a>
                )}
              </div>
            ))}
          </div> */}
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
                  ) : (
                    <CustomerInfoBox />
                  )}
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
                            Priority:
                          </span>
                          <Badge
                            className={getPriorityColor(formData.priority)}
                          >
                            {formData.priority.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Deadline:</span>
                        <span className="font-medium">
                          {formData.deliveryDate
                            ? new Date(
                                formData.deliveryDate
                              ).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "ไม่ระบุ"}
                        </span>
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

              <AddItem
                steelItems={steelItems}
                formData={formData}
                updateSteelItem={updateSteelItem}
                addSteelItem={addSteelItem}
                removeSteelItem={removeSteelItem}
                steelTypes={steelTypes}
              />
            </div>
          </div>
        </form>
      </div>

      <ToastContainer />
    </div>
  );
};

export default NewJobOrder;
