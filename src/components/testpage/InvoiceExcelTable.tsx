// src/components/InvoiceExcelTable.tsx
"use client";

type ExcelRow = Record<string, string | number | null | undefined>;

interface InvoiceExcelTableProps {
  rows: ExcelRow[];
  title?: string;
}

export function InvoiceExcelTable({ rows, title }: InvoiceExcelTableProps) {
  if (!rows || rows.length === 0) return null;

  const columns = Object.keys(rows[0]);

  return (
    <div className="w-full text-xs">
      {title && (
        <h2 className="mb-2 text-base font-semibold text-center">
          {title}
        </h2>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full border border-black border-collapse print:text-[10px]">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="border border-black px-2 py-1 text-left font-semibold"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col) => (
                  <td
                    key={col}
                    className="border border-black px-2 py-1 align-top"
                  >
                    {row[col] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
