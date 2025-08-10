import { Building2, Phone, Mail, MapPin } from "lucide-react";
import "../app/globals.css";

export default function CustomerInfoCard() {
  return (
    <div className="border rounded-2xl p-4 shadow-sm w-full bg-aa text-foreground">
      <div className="flex items-start gap-3 mb-2">
        <Building2 className="text-primary  w-10 h-10 mt-1" />
        <h1 className="mt-3 font-bold text-lg text-foreground">สยามจำกัด</h1>
        {/* <div>
          
          <p className="text-sm text-small-detail">PO : 2024-001</p>
        </div> */}
      </div>
      
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <Phone className="text-primary w-5 h-5" />
        <span className="text-foreground break-words">0655389857</span>
        
        <Mail className="text-primary w-5 h-5" />
        <span className="text-foreground break-words">arm1532arm@gmail.com</span>
      </div>

      <div className="flex items-start gap-3 mb-2">
        <MapPin className="text-blue-500 w-5 h-5 mt-1" />
        <p className="text-foreground break-words" >
          88/9 หมู่ 5 ถนนบางนา-ตราด กม.10 บางพลี สมุทรปราการ 10540
        </p>
      </div>

      <div className="flex justify-between text-xs text-small-detail">
        <span>tax : 10224513158205848</span>
        <span>fax : 10224513158205848</span>
      </div>
    </div>
  );
}
