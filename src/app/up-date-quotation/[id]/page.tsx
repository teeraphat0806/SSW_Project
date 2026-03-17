// src/app/up-date-quotation/[id]/page.tsx
import UpdateQuotationClient from "./UpdateQuotationClient";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UpdateQuotationClient id={id} />;
}
