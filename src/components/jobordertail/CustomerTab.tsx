"use client";

import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Copy, 
  Check, 
  ExternalLink 
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils"; // หรือ path utils ของคุณ
import { Button } from "@/components/ui/button"; // ถ้ามี Shadcn Button
// ถ้าไม่มี Button component ให้ใช้ <button> ธรรมดาพร้อม tailwind class แทนได้

type CustomerTabProps = {
  customer: {
    name: string;
    email: string;
    code: string;
    phone: string;
    shippingAddress: string;
  };
};

export function CustomerTab({ customer }: CustomerTabProps) {
  // State สำหรับปุ่ม Copy ที่อยู่แยกต่างหาก
  const [isAddressCopied, setIsAddressCopied] = useState(false);

  // Function สำหรับสร้าง Avatar จากชื่อ
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(customer.shippingAddress);
    setIsAddressCopied(true);
    setTimeout(() => setIsAddressCopied(false), 2000);
  };

  const handleOpenGoogleMaps = () => {
    const encodedAddress = encodeURIComponent(customer.shippingAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  return (
    <div className="px-5 py-4 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- Column 1: ข้อมูลส่วนตัว & การติดต่อ (กินพื้นที่ 2 ส่วน) --- */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Card */}
          <div className="flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm ">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary dark:bg-primary/20">
              {getInitials(customer.name)}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">{customer.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
               
                <span># {customer.code}</span>
              </div>
              {/* <div className="mt-2 flex gap-2">
                 <span className="inline-flex items-center rounded-md bg-green-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-inset ring-green-600/20 d">
                    Active
                 </span>
                 <span className="inline-flex items-center rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-inset ring-blue-700/10 ">
                    Verified
                 </span>
              </div> */}
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <ContactItem 
                icon={<Mail className="h-4 w-4" />}
                label="อีเมล"
                value={customer.email}
                actionType="copy"
             />
             <ContactItem 
                icon={<Phone className="h-4 w-4" />}
                label="เบอร์โทรศัพท์"
                value={customer.phone}
                actionType="copy"
             />
          </div>
        </div>

        {/* --- Column 2: ที่อยู่จัดส่ง (กินพื้นที่ 1 ส่วน) --- */}
        <div className="lg:col-span-1">
          <div className="h-full rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col ">
             <div className="border-b bg-background px-4 py-3 ">
                <h4 className="flex items-center gap-2 font-semibold text-foreground">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  ที่อยู่จัดส่งสินค้า
                </h4>
             </div>
             <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                <div className="relative">
                    {/* Decorative map pattern background (optional) */}
                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20 dark:opacity-10 pointer-events-none" />
                    
                    <p className="relative z-10 text-sm leading-relaxed text-foreground">
                        {customer.shippingAddress}
                    </p>
                </div>
                
                <div className="pt-4 border-t ">
                    <Button 
                        variant="outline" 
                        className={cn(
                            "w-full gap-2 text-xs transition-all duration-200",
                            isAddressCopied 
                                ? "hover:bg-primary/5 transition-colors text-blue-500 hover:text-blue-600" 
                                : "hover:border-primary hover:text-primary dark:hover:border-primary"
                        )}
                        onClick={handleCopyAddress}
                    >
                        {isAddressCopied ? (
                            <>
                                <Check className="h-3 w-3" /> คัดลอกแล้ว
                            </>
                        ) : (
                            <>
                                <Copy className="h-3 w-3" /> คัดลอกที่อยู่
                            </>
                        )}
                    </Button>
                    <Button 
                        variant="ghost" 
                        className="w-full gap-2 text-xs mt-2 text-muted-foreground border-1 hover:text-primary hover:bg-primary/5 transition-colors"
                        onClick={handleOpenGoogleMaps}
                    >
                        <ExternalLink className="h-3 w-3" /> เปิดใน Google Maps
                    </Button>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- Sub-Component: Contact Item with Copy Button ---
function ContactItem({ 
    icon, 
    label, 
    value, 
    
}: { 
    icon: React.ReactNode, 
    label: string, 
    value: string, 
    actionType: 'copy' 
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="group relative flex items-start gap-3 rounded-xl border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-sm ">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="truncate text-sm font-medium text-foreground">{value}</p>
            </div>
            <button 
                onClick={handleCopy}
                className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                title="Copy to clipboard"
            >
                {copied ? <Check className="h-3.5 w-3.5 " /> : <Copy className="h-3.5 w-3.5" />}
            </button>
        </div>
    );
}