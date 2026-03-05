const MONTH_NAMES_TH = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const formatThaiDateLong = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  const day = String(date.getDate());
  const monthName = MONTH_NAMES_TH[date.getMonth()] ?? "";
  const year = date.getFullYear() + 543;

  return `${day} ${monthName} ${year}`;
};

export { MONTH_NAMES_TH, formatThaiDateLong };
