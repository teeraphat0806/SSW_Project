type SteelRow = { steelType: string; weight: number; price: number };

export function SteelTable({ status, rows }: { status: string; rows: SteelRow[] }) {
  const total = rows.reduce((sum, r) => sum + r.weight * r.price, 0);
  let title = "ข้อมูลเหล็ก (จริง)"
  
  if(status ==="pending" || status === "cutting" || status === "weighing"){
    title = "ข้อมูลเหล็ก (คำนวณ)"
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-background p-5 shadow-sm">
      <h3 className="mb-3 text-base font-semibold text-foreground">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="px-3 py-2 text-left front-medium">ประเภทเหล็ก</th>
              <th className="px-3 py-2 text-left front-medium">น้ำหนัก (kg)</th>
              <th className="px-3 py-2 text-left front-medium">ราคา</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${row.steelType}-${index}`}
                className="border-b last:border-0"
              >
                <td className="px-3 py-2">{row.steelType}</td>
                <td className="px-3 py-2 text-left">
                  {formatNumber(row.weight)}
                </td>
                <td className="px-3 py-2 text-left">
                    {formatCurrency(row.weight * row.price)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td className="px-3 py-2 text-left font-semibold" colSpan={2}>
                ราคารวมทั้งหมด
              </td>
              <td className="px-3 py-2 text-left font-semibold text-green-600">
                {formatCurrency(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(n);
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(n);
}