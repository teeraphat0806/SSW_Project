import JobOrderDetailClient from "./JobOrderDetailClient";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ await ก่อนใช้
  return <JobOrderDetailClient id={id} />;
}
