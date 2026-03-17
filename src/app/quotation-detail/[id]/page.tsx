"use client";
import { ApiQuotation } from "@/app/api/up-date-quotation/[id]/route";
import { LoadingScreen } from "@/components/Loading";
import Logo from "@/components/Logo";
import {
  calculateBillSummary,
  calculateWeightDetails,
  ThaiBaht,
  type SteelItem,
} from "@/lib/calculateGrandTotal";
import { useParams } from "next/navigation";
import * as React from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { tr } from "date-fns/locale";
import { Pencil, Printer } from "lucide-react";

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [Data, setData] = React.useState<ApiQuotation | null>(null);
  const router = useRouter();

  const handlePrint = () => {
    window.print();
  };
  const formatNumber = (num: number) => {
    return num.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const fetchData = React.useCallback(() => {
    if (!id) return;
    fetch(`/api/quotation-detail/${id}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, [id]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const steelItems = Data?.steelItem || [];

  // Normalize api fields to match calculateGrandTotal utility input type.
  const normalizedSteelItems = useMemo<SteelItem[]>(
    () =>
      steelItems.map((item) => ({
        shape: item.shape,
        amount: item.amount,
        width: item.wide,
        length: item.length,
        thickness: item.thickness,
        density: item.density,
        price: item.price,
        weight: item.weight,
        discount: item.discount,
        isOD: item.isOD,
        isServices: item.isServices,
        isPerAmount: item.isPerAmount,
      })),
    [steelItems],
  );

  const calculatedWeightAndTotal = useMemo(
    () =>
      steelItems.map((item) => ({
        item,
        details: calculateWeightDetails({
          shape: item.shape,

          amount: item.amount,
          width: item.wide,
          length: item.length,
          thickness: item.thickness,

          density: item.density,
          weight: item.weight,
          price: item.price,
          discount: null,

          isOD: item.isOD,
          isServices: item.isServices,
          isPerAmount: item.isPerAmount,
        }),
      })),
    [steelItems],
  );

  const vatRate = 7;
  const { subtotal, discount, vat, grandTotal } = useMemo(
    () => calculateBillSummary(normalizedSteelItems, vatRate),
    [normalizedSteelItems, vatRate],
  );

  const headOrder = (
    titleThai: string,
    titleEng?: string,
    value?: string | null,
    alignRight = false,
  ) => {
    return (
      <div className="grid grid-cols-[90px_1fr] items-start gap-x-3 leading-tight">
        <div className={`font-semibold`}>
          <p className="whitespace-nowrap">{titleThai}:</p>
          {titleEng && (
            <p className="text-[11px] whitespace-nowrap">{titleEng}</p>
          )}
        </div>
        <p
          className={`font-medium text-[14px] leading-relaxed wrap-break-word ${alignRight ? "text-right" : ""}`}
        >
          {value || ""}
        </p>
      </div>
    );
  };

  // Helper to get surface marking (e.g. v, vv)
  const getSurfaceFinish = (surface?: string | null) => {
    if (!surface) return "";
    return <span className="text-sm align-super">{surface}</span>;
  };

  // Helper to format tolerance string

  if (!Data)
    return (
      <div>
        <LoadingScreen message="กำลังโหลดใบเสนอราคา..." />
      </div>
    );
  const getTolerance = (tolerance?: string | null) => {
    if (!tolerance) return "";
    // This assumes tolerance field maps to +/- value. In image, it's specific +0.1/-0.1.
    // I will hardcode the tolerance for now, as I don't have the explicit fields for +/-.
    // In a real application, you'd have toleranceMin and toleranceMax.

    return (
      <div className="text-[9px] text-center border-t border-dashed border-gray-300 leading-tight">
        {tolerance}
      </div>
    );
  };

  return (
    <div className="min-h-screen mt-3 md:mt-0 lg:mt-0 bg-muted/40 px-3 py-3 text-black print:p-0 print:m-0 print:bg-white print:absolute print:top-0 print:left-0 print:w-full print:z-50 dark:bg-zinc-900 dark:text-zinc-100">
      {/* Print Button */}
      <div className="mb-4 flex items-center justify-between p-4 print:hidden">
        <h1 className="text-lg font-semibold">ใบเสนอราคา (Quotation)</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push(`/up-date-quotation/${id}`)}
            className="group flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow active:scale-95 dark:bg-blue-500 dark:hover:bg-blue-600 cursor-pointer"
          >
            <Pencil/>
            แก้ไข
          </button>

          <button
            onClick={handlePrint}
            className="group flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-black hover:shadow active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white cursor-pointer"
          >
            <Printer />
            พิมพ์
          </button>
        </div>
      </div>

      {/* A4 Page */}
      <div
        className="mx-auto bg-white text-black shadow-lg print:shadow-none print-a4 print-force-color print-black-borders print:mx-0 font-sans print:overflow-hidden"
        style={{
          width: "210mm",
          minHeight: "297mm",
          height: "297mm",
          padding: "8mm",
        }}
      >
        {/* Header Section */}
        <div className="flex justify-between items-start mb-2">
          <div className="w-1/4 justify-start flex">
            {/* Logo Placeholder */}
            <Logo />
          </div>
          <div className="text-right w-3/4 text-[12px] leading-tight font-light">
            <p className="font-semibold text-[14px]">
              บริษัท เอส.เอส.ดับบลิว. สตีล เซ็นเตอร์ จำกัด
            </p>
            <p className="font-semibold text-[14px]">
              S.S.W.STEEL CENTER CO., LTD.
            </p>
            <p>888/1 หมู่ที่ 9 ต.บางปลา อ.บางพลี จ.สมุทรปราการ 10540</p>
            <p>888/1 Moo.9 T.Bangpla, A.Bangplee, Samutprakarn 10540</p>
            <p>Tel: 0-2181-6700-4 E-mail : ssw.steelcenter@yahoo.com</p>
          </div>
        </div>

        {/* Title Section */}
        <div className="border border-black p-1 text-center mb-1 w-full mx-auto">
          <p className="font-bold text-[16px]">ใบเสนอราคา (Quotation)</p>
        </div>

        {/* Customer & Document Info Box */}
        <div className="border border-gray-800 mb-1 text-[12px] leading-snug">
          <div className="grid grid-cols-10 border-b border-gray-800">
            <div className="col-span-7 px-2 py-1">
              {headOrder("ชื่อบริษัท", "Company Name:", Data.companyName)}
            </div>
            <div className="col-span-3 px-2 py-1 border-l border-gray-800">
              {headOrder(
                "วันที่",
                "Date:",
                new Date(Data.createdAt).toLocaleDateString("th-TH", {
                  year: "2-digit",
                  month: "2-digit",
                  day: "2-digit",
                }),
                true,
              )}
            </div>
          </div>

          <div className="grid grid-cols-10 border-b border-gray-800">
            <div className="col-span-7 px-2 py-1">
              {headOrder("ชื่อผู้ติดต่อ", "Attn.", Data.customerName)}
            </div>
            <div className="col-span-3 px-2 py-1 border-l border-gray-800">
              {headOrder(
                "เลขที่ใบเสนอราคา",
                "Quotation No.",
                Data.quotationNo,
                true,
              )}
            </div>
          </div>

          <div className="grid grid-cols-10  border-gray-800">
            <div className="col-span-7 px-2 py-1">
              {headOrder("ที่อยู่", "Address:", Data.address)}
            </div>
            <div className="col-span-3 px-2 py-1 border-l border-b border-gray-800">
              {headOrder(
                "เงือนไขการชำระ",
                "Cr.Terms:",
                `${Data.credit} Days`,
                true,
              )}
            </div>
          </div>

          <div className="grid grid-cols-10">
            <div className="col-span-7 px-2 py-1">
              <p>
                <span className="font-semibold">Tel.</span>{" "}
                {Data?.tel || ""}{" "}
              </p>
            </div>
            <div className="col-span-3 px-2 py-1 border-l border-gray-800">
              {headOrder("พนักงานขาย", "Sale Rep.", Data.salesName, true)}
            </div>
          </div>
        </div>

        {/* Main Item Table - Modified to remove Chamfer */}
        <div className="border border-gray-800 mb-2 print:break-inside-avoid">
          <table className="w-full table-fixed text-center text-[11px] border-collapse leading-tight">
            <thead>
              <tr className="border-b border-gray-800 font-semibold bg-gray-50">
                {/* 💡 โครงสร้างความกว้างถูกกำหนดไว้ตรงนี้แล้ว (รวมกัน = 100%) */}
                <th className="border-r border-gray-800 p-1 w-[5%]">ลำดับ</th>
                <th className="border-r border-gray-800 p-1 w-[10%]">
                  เกรดเหล็ก
                </th>
                <th className="border-r border-gray-800 p-1 w-[35%]">
                  หนา (T) X กว้าง (W) X ยาว (L)
                </th>
                <th className="border-r border-gray-800 p-1 w-[10%]">
                  หมายเหตุ
                </th>
                <th className="border-r border-gray-800 p-1 w-[10%]">จำนวน</th>
                <th className="border-r border-gray-800 p-1 w-[8%]">หน่วย</th>
                <th className="border-r border-gray-800 p-1 w-[12%]">
                  ราคา/หน่วย
                </th>
                <th className="p-1 w-[10%]">จำนวนเงิน/บาท</th>{" "}
                {/* 💡 ปรับตรงนี้ให้สมดุลกับ 100% (5+10+35+10+10+8+12+10 = 100) */}
              </tr>
            </thead>
            <tbody>
              {(calculatedWeightAndTotal || []).map((entry, index) => (
                <tr
                  key={entry.item.SteelId}
                  className={`${index % 2 !== 0 ? "bg-gray-50" : ""}`}
                >
                  <td className="border-r border-b border-gray-800 px-1 py-0.5 h-[2.1em] align-middle">
                    {index + 1}
                  </td>
                  <td className="border-r border-b border-gray-800 px-1 py-0.5 h-[2.1em] align-middle">
                    {entry.item.steelType}
                  </td>
                  <td className="border-r border-b border-gray-800 px-1 py-0.5 h-[2.1em] align-middle text-center font-light">
                    {/* 💡 1. เติม h-full เพื่อให้กล่องกางเต็มความสูงของช่อง td */}
                    <div className="w-full h-full flex justify-between items-start text-[11px]">
                      {/* --- บล็อกที่ 1: หนา (T) --- */}
                      <div className="flex-1 flex flex-col items-center leading-tight">
                        <div className="flex items-baseline justify-center">
                          <span className="font-semibold text-[12px]">
                            {entry.item.thickness}
                          </span>
                          {getSurfaceFinish(entry.item.surfaceT) && (
                            <span className="ml-1 text-[10px]">
                              {getSurfaceFinish(entry.item.surfaceT)}
                            </span>
                          )}
                        </div>
                        {getTolerance(entry.item.toleranceT) && (
                          <div className="text-[9px] text-gray-600 mt-[1px]">
                            {getTolerance(entry.item.toleranceT)}
                          </div>
                        )}
                      </div>

                      {/* 💡 2. เปลี่ยน mt-[2px] เป็น self-center เพื่อดึง X ลงมากึ่งกลางแนวตั้งเสมอ */}
                      <div className="w-[12px] self-center text-center font-medium text-[10px] text-gray-500">
                        X
                      </div>

                      {/* --- บล็อกที่ 2: กว้าง (W) --- */}
                      <div className="flex-1 flex flex-col items-center leading-tight">
                        <div className="flex items-baseline justify-center">
                          <span className="font-semibold text-[12px]">
                            {entry.item.wide}
                          </span>
                          {getSurfaceFinish(entry.item.surfaceW) && (
                            <span className="ml-1 text-[10px]">
                              {getSurfaceFinish(entry.item.surfaceW)}
                            </span>
                          )}
                        </div>
                        {getTolerance(entry.item.toleranceW) && (
                          <div className="text-[9px] text-gray-600 mt-[1px]">
                            {getTolerance(entry.item.toleranceW)}
                          </div>
                        )}
                      </div>

                      {/* 💡 2. เปลี่ยนเป็น self-center เช่นกัน */}
                      <div className="w-[12px] self-center text-center font-medium text-[10px] text-gray-500">
                        X
                      </div>

                      {/* --- บล็อกที่ 3: ยาว (L) --- */}
                      <div className="flex-1 flex flex-col items-center leading-tight">
                        <div className="flex items-baseline justify-center">
                          <span className="font-semibold text-[12px]">
                            {entry.item.length}
                          </span>
                          {getSurfaceFinish(entry.item.surfaceL) && (
                            <span className="ml-1 text-[10px]">
                              {getSurfaceFinish(entry.item.surfaceL)}
                            </span>
                          )}
                        </div>
                        {getTolerance(entry.item.toleranceL) && (
                          <div className="text-[9px] text-gray-600 mt-[1px]">
                            {getTolerance(entry.item.toleranceL)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="border-r border-b border-gray-800 px-1 py-0.5 h-[2.1em] align-middle text-left font-center">
                    {entry.item.detail || ""}
                  </td>
                  <td className="border-r border-b border-gray-800 px-1 py-0.5 h-[2.1em] align-middle text-center">
                    {entry.item.amount}
                  </td>
                  <td className="border-r border-b border-gray-800 px-1 py-0.5 h-[2.1em] align-middle text-center">
                    {entry.item.isPerAmount ? "Pcs." : "KG."}
                  </td>
                  <td className="border-r border-b border-gray-800 px-1 py-0.5 h-[2.1em] align-middle text-center">
                    {entry.item.price.toFixed(2)}
                  </td>
                  <td className="border-b border-gray-800 px-1 py-0.5 h-[2.1em] align-middle text-right">
                    {entry.details.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {/* --- แถวที่ 1 --- */}
              <tr>
                <td
                  colSpan={5} // กินพื้นที่ 5 คอลัมน์แรก (5% + 10% + 35% + 10% + 10% = 70%)
                  rowSpan={3}
                  className="border-r border-gray-800 px-2 py-0.5 align-top text-[11px]"
                >
                  <div className="flex gap-2 w-full">
                    <div className="flex shrink-0 flex-col font-semibold text-left leading-tight">
                      <span>หมายเหตุ:</span>
                      <span>Remark:</span>
                    </div>
                    <div className="flex-1 min-w-0 whitespace-pre-wrap break-words text-left leading-tight">
                      {Data.description || ""}
                    </div>
                  </div>
                </td>

                {/* 💡 เอา w-[...] ออกให้หมด เหลือแค่ colSpan={2} ซึ่งจะกินพื้นที่ (หน่วย 8% + ราคา 12% = 20%) */}
                <td
                  colSpan={2}
                  className="border-b border-r border-gray-800 px-2 py-0.5 text-left font-medium whitespace-nowrap"
                >
                  จำนวนเงินรวม
                </td>

                {/* 💡 เอา w-[...] ออกให้หมด มันจะพอดีกับคอลัมน์สุดท้ายของ Thead (10%) */}
                <td className="border-b border-gray-800 px-2 py-0.5 text-right whitespace-nowrap">
                  {formatNumber(subtotal)}
                </td>
              </tr>

              {/* --- แถวที่ 2 --- */}
              <tr>
                <td
                  colSpan={2}
                  className="border-b border-r border-gray-800 px-2 py-0.5 text-left font-medium whitespace-nowrap"
                >
                  ส่วนลดรวม
                </td>
                <td className="border-b border-gray-800 px-2 py-0.5 text-right whitespace-nowrap">
                  {discount === 0 ? "" : formatNumber(discount)}
                </td>
              </tr>

              {/* --- แถวที่ 3 --- */}
              <tr>
                <td
                  colSpan={2}
                  className="border-b border-r border-gray-800 px-2 py-0.5 text-left font-medium whitespace-nowrap"
                >
                  ภาษีมูลค่าเพิ่ม 7%
                </td>
                <td className="border-b border-gray-800 px-2 py-0.5 text-right whitespace-nowrap">
                  {formatNumber(vat)}
                </td>
              </tr>

              {/* --- แถวที่ 4 --- */}
              <tr>
                <td
                  colSpan={5}
                  className="border border-gray-800 px-2 py-0.5 text-left align-middle text-[11px] whitespace-normal leading-tight"
                >
                  ({ThaiBaht(grandTotal.toString())})
                </td>
                <td
                  colSpan={2}
                  className="border-b border-r border-gray-800 px-2 py-0.5 text-left font-medium whitespace-nowrap"
                >
                  จำนวนเงินรวมทั้งสิ้น
                </td>
                <td className="border-b border-gray-800 px-2 py-0.5 text-right font-bold whitespace-nowrap">
                  {formatNumber(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Terms and Footer Section */}
        <div className="text-[9px] leading-snug grid grid-cols-[1fr_2fr] gap-x-8 mb-2">
          <div className="space-y-2">
            <p>
              <span className="font-semibold">
                * กำหนดส่งสินค้าหลังได้รับใบสั่งซื้อ:
              </span>{" "}
              {Data.deliveryDate}
            </p>
            <p>
              <span className="font-semibold">* กำหนดยืนราคา:</span>{" "}
              {Data.period ?? ""}
            </p>
          </div>
          <div className="border border-gray-800 grid grid-cols-3 text-center text-[11px] divide-x divide-gray-800">
            <div className="h-[22mm] px-2 py-1 flex flex-col">
              <p className="mt-4 mb-1 text-[12px] leading-none">
                ........................................
              </p>
              <p className="font-medium">ผู้อนุมัติสั่งซื้อ</p>
              <p className="mt-auto font-light">
                วันที่.....................................
              </p>
            </div>

            <div className="h-[22mm] px-2 py-1 flex flex-col">
              <p className="mt-4 mb-1 text-[12px] leading-none">
                .........{Data.salesName}.........
              </p>
              <p className="font-medium">พนักงานขาย</p>
              <p className="mt-auto font-light">
                วันที่....
                {new Date(Data.createdAt).toLocaleDateString("th-TH", {
                  year: "2-digit",
                  month: "2-digit",
                  day: "2-digit",
                })}
                ....
              </p>
            </div>

            <div className="h-[22mm] px-2 py-1 flex flex-col">
              <p className="mt-4 mb-1 text-[12px] leading-none">
                ........................................
              </p>
              <p className="font-medium">ผู้จัดการฝ่ายขาย</p>
              <p className="mt-auto font-light">
                วันที่....
                {new Date(Data.createdAt).toLocaleDateString("th-TH", {
                  year: "2-digit",
                  month: "2-digit",
                  day: "2-digit",
                })}
                ....
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
