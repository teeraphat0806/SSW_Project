import ReceiptClient from "./ReceiptClient";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ await ก่อนใช้
  return <ReceiptClient id={id} />;
}
