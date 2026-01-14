import ReceiptClient from "./ReceiptClient";
import ReceiptCutter from "./ReceiptCutter";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cutterKey?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { cutterKey } = await searchParams;

  // Convert cutterKey string to boolean
  const isCutterMode = cutterKey === "true";

  if (isCutterMode) {
    return <ReceiptCutter id={id} />;
  }
  return <ReceiptClient id={id} />;
}
