import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Printer,
  FileText,
  User,
} from "lucide-react";
import "../../app/globals.css";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils"; // ถ้าไม่มีให้ลบออกและใช้ string ปกติ

interface Customer {
  id: string;
  code: string;
  name: string;
  address: string;
  tel: string;
  email: string;
  taxNumber: string;
  faxNumber: string;
}

export default function CustomerInfoCard({
  customerId,
}: {
  customerId: string | null;
}) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!customerId || customerId.trim() === "") {
      setCustomer(null);
      return;
    }

    const fetchCustomer = async () => {
      setLoading(true);
      setError(false);
      try {
        // จำลอง delay ให้เห็น Loading state (ลบออกได้ตอนใช้จริง)
        // await new Promise(r => setTimeout(r, 800));

        const response = await fetch(`/api/customer/${customerId}`); // แก้ path ให้ถูกต้อง
        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        setCustomer(data);
      } catch (error) {
        console.error("Error fetching customer:", error);
        setCustomer(null);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [customerId]);

  // --- 1. Loading State (Skeleton) ---
  if (loading) {
    return (
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm bg-white dark:bg-zinc-900 w-full space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-3 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-3 pt-2">
          <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-3 w-2/3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // --- 2. Empty / Error State ---
  if (!customer) {
    return (
      <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 w-full bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col items-center justify-center text-center text-zinc-500">
        <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-full mb-3">
          <User className="w-6 h-6 opacity-50" />
        </div>
        <p className="text-sm font-medium">
          {error ? "ไม่สามารถโหลดข้อมูลได้" : "กรุณาเลือกลูกค้า"}
        </p>
      </div>
    );
  }

  // --- 3. Main Content ---
  return (
    <div className="group relative border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-zinc-900 w-full overflow-hidden">
      {/* Decorative Top Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />

      <div className="p-5">
        {/* Header Section */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400">
            <Building2 className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 truncate">
                {customer.name}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 font-mono">
                #{customer.code}
              </span>
            </div>
            {customer.taxNumber && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <FileText className="w-3.5 h-3.5" />
                <span>Tax ID: {customer.taxNumber}</span>
              </div>
            )}
          </div>
        </div>

        <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800 mb-4" />

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
          {/* Contact Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-zinc-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-0.5">
                  เบอร์โทรศัพท์
                </p>
                <p className="text-zinc-700 dark:text-zinc-300 font-medium">
                  {customer.tel || "-"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-zinc-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-0.5">
                  อีเมล
                </p>
                <p className="text-zinc-700 dark:text-zinc-300 break-all">
                  {customer.email || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Address & Fax */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-zinc-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-0.5">
                  ที่อยู่
                </p>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {customer.address || "-"}
                </p>
              </div>
            </div>

            {customer.faxNumber && (
              <div className="flex items-start gap-3">
                <Printer className="w-4 h-4 text-zinc-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-0.5">
                    แฟกซ์
                  </p>
                  <p className="text-zinc-700 dark:text-zinc-300">
                    {customer.faxNumber}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
