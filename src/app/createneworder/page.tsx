"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
import { Separator } from "@/components/ui/separator";
import { ToastContainer, toast } from "react-toastify";
import CustomerForm from "@/components/CustomerForm";
import CustomerInfoBox from "@/components/CustomerInfoBox";
import AddItem from "@/components/AddItem";
import "../globals.css";

import { ArrowLeft, FileText, Save, X } from "lucide-react";
import SelectCustomer from "@/components/SelectCustomer";

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
  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customers, setCustomers] = useState<{id:string,name:string}[]>([]);
  const [search, setSearch] = useState(""); // เก็บค่าที่ค้นหา
  const [loading, setLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() =>{
    let ignore = false;
    const fetchCustomers = async () =>{
      setLoading(true);
      try{
        const url = search.trim() === "" ? "http://localhost:3000/api/customer"
        : `http://localhost:3000/api/customer/name/${encodeURIComponent(search)}`;
        const res = await fetch(url);
        if(!res.ok) throw new Error("Error fetching customers");

        const data = await res.json();
        if(!ignore){
         setCustomers(data.map((customers:{id:string,name:string}) => 
          ({ id: customers.id, name: customers.name })));
        }
      }
    catch (err) {
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
  }, [search]);
  

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
    code: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    deliveryAddress: "",
    taxNumber: "",
    faxNumber: "",
  });

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
    const payload = {
      code: formData.code,
      name: formData.customerName,
      address: formData.deliveryAddress,
      tel: formData.customerPhone,
      taxNumber: formData.taxNumber,
      faxNumber: formData.faxNumber,
      email: formData.customerEmail,
    };

    try{
      const res = await fetch("http://localhost:3000/api/customer", {
        method: "POST",
        headers:{"Content-Type": "application/json"},
        body: JSON.stringify(payload)
    });

      if (!res.ok){
        throw new Error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
      const data = await res.json();
      
      console.log("เพิ่มลูกค้าสำเร็จ:", data)
      toast.success("เพิ่มข้อมูลลูกค้าสำเร็จ", {
        position: "bottom-right",
      });
      router.push("/dashboard");
    } catch (error){
      console.error("Error saving customer:",error);
      
       toast.error(`เพิ่มลูกค้าไม่สำเร็จ: ${error.message}`, {
        position: "bottom-right",
       });
    } finally {
    setIsSubmitting(false);
  }
  }

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

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
      length: 0,
      thickness: 0,
      notes: "",
    };
    setSteelItems((prev) => [...prev, newItem]);
  };
  // Remove steel item
  const removeSteelItem = (id: string) => {
    if (steelItems.length > 1) {
      setSteelItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const validateForm = () => {
    if (!formData.customerName.trim()) return "Customer Name is required";

    for (const item of steelItems) {
      if (!item.steelType) return "Steel Type is required for all items";
      if (item.quantity <= 0) return "Quantity must be greater than 0";
      if (item.width <= 0) return "Width must be greater than 0";
      if (item.length <= 0) return "Length must be greater than 0";
      if (item.thickness <= 0) return "Thickness must be greater than 0";
    }
    return null;
  };

  // SubmitForm function
  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   const validationError = validateForm();
  //   if (validationError) {
  //     toast.error(`ขออภัย มีข้อผิดพลาด: ${validationError}`, {
  //       position: "bottom-right",
  //     });
  //     return;
  //   }
  //   setIsSubmitting(true);
  //   try {
  //     // สร้างข้อมูลลูกค้าตามโครงสร้างที่ API ต้องการ
  //     const customerData = {
  //       code: formData.code,
  //       name: formData.customerName,
  //       address: formData.deliveryAddress,
  //       tel: formData.customerPhone,
  //       taxNumber: formData.taxNumber,
  //       faxNumber: formData.faxNumber,
  //       email: formData.customerEmail,
  //     };

  //     // ส่งข้อมูลไปที่ backend API
  //     const res = await fetch("http://localhost:3000/api/customer", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(customerData),
  //     });

  //     if (!res.ok) {
  //       throw new Error("การส่งข้อมูลไป API ล้มเหลว");
  //     }

  //     const result = await res.json();
  //     console.log("Customer saved:", result);

  //     toast.success("เพิ่มข้อมูลลูกค้าสำเร็จ", {
  //       position: "bottom-right",
  //     });

  //     router.push("/dashboard");
  //   } catch (error) {
  //     console.error("Error saving customer:", error);
  //     toast.error(`ขออภัย ไม่สามารถบันทึกข้อมูลได้: ${error.message}`, {
  //       position: "bottom-right",
  //     });
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

 //-------------------------------------------------------------------
  // const getPriorityColor = (priority: string) => {
  //   switch (priority) {
  //     case "urgent":
  //       return "bg-destructive text-destructive-foreground";
  //     case "high":
  //       return "bg-warning text-warning-foreground";
  //     case "normal":
  //       return "bg-primary text-primary-foreground";
  //     case "low":
  //       return "bg-muted text-muted-foreground";
  //     default:
  //       return "bg-muted text-muted-foreground";
  //   }
  // };
  
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
          {showForm ? (
            <></>
          ) : (
            <SelectCustomer
              open={open}
              setOpen={setOpen}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              customers={customers}
              search = {search}
              setSearch={setSearch}
              loading={loading}
              selectedCustomerId={selectedCustomerId}
              setSelectedCustomerId={setSelectedCustomerId}
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
                    <CustomerInfoBox
                    customerId={selectedCustomer}
                    />
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
                          {/* <Badge
                            className={getPriorityColor(formData.priority)}
                          >
                            {formData.priority.toUpperCase()}
                          </Badge> */}
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Deadline:</span>
                        {/* <span className="font-medium">
                          {formData.deliveryDate
                            ? new Date(
                                formData.deliveryDate
                              ).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "ไม่ระบุ"}
                        </span> */}
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
