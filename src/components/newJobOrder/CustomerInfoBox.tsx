import { Building2, Phone, Mail, MapPin } from "lucide-react";
import "../../app/globals.css";
import { useState, useEffect } from "react";
interface Customer{
  id: string;
  code: string;
  name: string;
  address: string;
  tel: string;
  email: string;
  taxNumber: string;
  faxNumber: string;
}

export default function CustomerInfoCard({customerId}: {customerId:string | null}) {
  const [customer,setcustomer] = useState<Customer| null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    if(!customerId || customerId.trim() === "") return;
    const fetchCustomer = async () =>{
      setLoading(true);

      try{
        console.log("Fetching customer with ID:", customerId);
        const response = await fetch(`http://localhost:3000/api/customer/${customerId}`);
        if(!response.ok) throw new Error("Failed to fetch Customer data");
        const data = await response.json();
        console.log("Customer data received:", data);
        setcustomer(data);
        

      }catch(error){
        console.error("Error fetching customer data:", error);
        setcustomer(null);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomer();
    
  }, [customerId]);

    if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">กำลังโหลดข้อมูลลูกค้า...</div>;
  }

  if (!customer) {
    return <div className="p-4 text-sm text-muted-foreground">ไม่พบข้อมูลลูกค้า</div>;
  }

  return (
    <div className="border rounded-2xl p-4 shadow-sm w-full bg-aa text-foreground">
      <div className="flex items-start gap-3 mb-2">
        <Building2 className="text-primary  w-10 h-10 mt-1" />
       
        <div>
           <h1 className=" font-bold text-lg text-foreground">{customer.name}</h1>
          <p className="text-sm text-small-detail">Code : {customer.code}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <Phone className="text-primary w-5 h-5" />
        <span className="text-foreground break-words">{customer.tel}</span>
        
        <Mail className="text-primary w-5 h-5" />
        <span className="text-foreground break-words">{customer.email}</span>
      </div>

      <div className="flex items-start gap-3 mb-2">
        <MapPin className="text-blue-500 w-5 h-5 mt-1" />
        <p className="text-foreground break-words" >
          {customer.address}
        </p>
      </div>

      <div className="flex justify-between text-xs text-small-detail">
        <span>tax : {customer.taxNumber}</span>
        <span>fax : {customer.faxNumber}</span>
      </div>
    </div>
  );
}
