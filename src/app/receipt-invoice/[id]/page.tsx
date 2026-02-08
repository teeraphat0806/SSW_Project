import ReceiptClient from "./ReceiptClient";
import ReceiptCutter from "./ReceiptCutter";
import ReceiptTemporary from "./RecieptTemporary";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cutterKey?: string; isTemporary?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { cutterKey, isTemporary } = await searchParams;

  // Convert string to boolean
  const isCutterMode = cutterKey === "true";
  const isTemporaryMode = isTemporary === "true";

  if (isTemporaryMode) {
    return <ReceiptTemporary id={id} />;
  }

  if (isCutterMode) {
    return <ReceiptCutter id={id} />;
  }

  return <ReceiptClient id={id} />;
}
