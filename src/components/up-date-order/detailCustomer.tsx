
import { Building2, FileText, Mail, MapPin, Phone, Printer, User } from "lucide-react";
import { Input } from "@/components/ui/input";

type DetailCustomerProps = {
  job: {
    customerName: string;
    customerCode: string;
    customerTaxId: string;
    customerPhone: string;
    customerEmail: string;
    customerFax: string;
    customerAddress: string;
  };
  setJob: React.Dispatch<React.SetStateAction<any>>;
};

export default function DetailCustomer({ job, setJob }: DetailCustomerProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-800/50">
        <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          <Building2 className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
          ข้อมูลลูกค้า
        </h2>
      </div>

      {/* Form */}
      <div className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Customer Name */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
            <User className="h-5 w-5" /> ชื่อลูกค้า
          </label>
          <Input
            value={job.customerName}
            onChange={(e) =>
              setJob((prev: any) => ({ ...prev, customerName: e.target.value }))
            }
          />
        </div>

        {/* Customer Code */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
            <FileText className="h-5 w-5" /> รหัสลูกค้า (Code)
          </label>
          <Input
            value={job.customerCode}
            onChange={(e) =>
              setJob((prev: any) => ({ ...prev, customerCode: e.target.value }))
            }
          />
        </div>

        {/* Tax ID */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
            <FileText className="h-5 w-5" /> เลขผู้เสียภาษี
          </label>
          <Input
            value={job.customerTaxId}
            onChange={(e) =>
              setJob((prev: any) => ({ ...prev, customerTaxId: e.target.value }))
            }
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
            <Phone className="h-5 w-5" /> เบอร์โทรศัพท์
          </label>
          <Input
            value={job.customerPhone}
            onChange={(e) =>
              setJob((prev: any) => ({ ...prev, customerPhone: e.target.value }))
            }
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
            <Mail className="h-5 w-5" /> อีเมล
          </label>
          <Input
            value={job.customerEmail}
            onChange={(e) =>
              setJob((prev: any) => ({ ...prev, customerEmail: e.target.value }))
            }
          />
        </div>

        {/* Fax */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
            <Printer className="h-5 w-5" /> แฟกซ์
          </label>
          <Input
            value={job.customerFax}
            onChange={(e) =>
              setJob((prev: any) => ({ ...prev, customerFax: e.target.value }))
            }
          />
        </div>

        {/* Address */}
        <div className="space-y-1.5 md:col-span-3">
          <label className="flex items-center gap-2 text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
            <MapPin className="h-5 w-5" /> ที่อยู่จัดส่ง
          </label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            value={job.customerAddress}
            onChange={(e) =>
              setJob((prev: any) => ({
                ...prev,
                customerAddress: e.target.value,
              }))
            }
          />
        </div>
      </div>
    </section>
  );
}
