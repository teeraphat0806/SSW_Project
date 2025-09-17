"use client";
import { Building2, User, Mail, Phone, MapPin } from "lucide-react";

type CustomerTabProps = {
  customer: {
    name: string;
    email: string;
    phone: string;
    shippingAddress: string;
  };
};

export function CustomerTab({ customer }: CustomerTabProps) {
  return (
    <div className="px-5 py-4 space-y-4">
      <div className="rounded-xl border border-gray-100 p-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <Building2 className="h-4 w-4" />
              รายละเอียดลูกค้า
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{customer.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.phone}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <MapPin className="h-4 w-4" />
              ที่อยู่จัดส่ง
            </h4>
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              {customer.shippingAddress}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
