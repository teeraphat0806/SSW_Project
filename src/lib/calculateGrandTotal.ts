// src/lib/calculations/pricing.ts
import { ShapeSteel } from "@/types";

export type SteelItem = {
  shape: ShapeSteel;
  amount: number;
  width?: number | null;
  length?: number | null;
  thickness?: number | null;
  density: number;

  price: number;
  weight?: number | null;
  total?: number | null;
  discount?: number | null;

  isOD: boolean;
  isServices: boolean;
  isPerAmount: boolean;
};

const safeNum = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (n: number) =>
  n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const round2 = (n: number) => Math.round(n * 100) / 100;

type WeightDetails = {
  weight: number;
  total: number;
  discount: number;
  isManual: boolean;
};

export function calculateWeightDetails(steel: SteelItem): WeightDetails {
  const amount = safeNum(steel.amount);
  const width = safeNum(steel.width);
  const length = safeNum(steel.length);
  const thickness = safeNum(steel.thickness);

  const density = safeNum(steel.density) || 7860;
  const weight = safeNum(steel.weight);
  const price = safeNum(steel.price);
  const discount = safeNum(steel.discount);

  if (steel.isServices || steel.isPerAmount) {
    return {
      weight,
      total: round2(amount * price),
      discount,
      isManual: true,
    };
  }

  if (amount <= 0 || thickness <= 0)
    return {
      weight: 0,
      total: 0,
      discount,
      isManual: false,
    };

  if (weight > 0) {
    return {
      weight: round2(weight),
      total: round2(weight * price),
      discount,
      isManual: true,
    };
  }
  let weightPerPieceKg = 0;

  if (steel.isOD) {
    if (steel.shape !== "square") {
      return {
        weight: 0,
        total: 0,
        discount,
        isManual: false,
      };
    }
    weightPerPieceKg = (thickness * width * width * density * 3.14) / 4;
    console.log("OD Square weight per piece kg", weightPerPieceKg);
  } else if (steel.shape === "square") {
    weightPerPieceKg = thickness * width * length * density;
    console.log("Square weight per piece kg", weightPerPieceKg);
  } else {
    weightPerPieceKg = (thickness * thickness * length * density * 3.14) / 4;
    console.log("Round weight per piece kg", weightPerPieceKg);
  }

  return {
    //คือนหนักรวมเป็นกิโลกรัมโดย/1000 คือ
    weight: round2(weightPerPieceKg * amount),
    total: round2(weightPerPieceKg * amount * price),
    discount,
    isManual: false,
  };
}

export function calculateBillSummary(steel: SteelItem[], vatRate: number) {
  const subtotal = steel.reduce((sum, steel) => {
    return sum + safeNum(calculateWeightDetails(steel).total);
  }, 0);

  const discount = steel.reduce(
    (sum, steel) => sum + safeNum(steel.discount),
    0,
  );
  const net = Math.max(0, subtotal - discount);
  const vat = net * (safeNum(vatRate) / 100);
  const grandTotal = round2(net + vat);

  return {
    subtotal,
    discount,
    vat,
    grandTotal,
  };
}

export const digitsOnly = (s: string) => s.replace(/\D/g, "");

export function ThaiBaht(numberStr: string) {
  //ตัดสิ่งที่ไม่ต้องการทิ้งลงโถส้วม
  for (var i = 0; i < numberStr.length; i++) {
    numberStr = numberStr.replace(",", ""); //ไม่ต้องการเครื่องหมายคอมมาร์
    numberStr = numberStr.replace(" ", ""); //ไม่ต้องการช่องว่าง
    numberStr = numberStr.replace("บาท", ""); //ไม่ต้องการตัวหนังสือ บาท
    numberStr = numberStr.replace("฿", ""); //ไม่ต้องการสัญลักษณ์สกุลเงินบาท
  }
  //สร้างอะเรย์เก็บค่าที่ต้องการใช้เอาไว้
  var TxtNumArr = new Array(
    "ศูนย์",
    "หนึ่ง",
    "สอง",
    "สาม",
    "สี่",
    "ห้า",
    "หก",
    "เจ็ด",
    "แปด",
    "เก้า",
    "สิบ",
  );
  var TxtDigitArr = new Array("", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน");
  var BahtText = "";
  //ตรวจสอบดูซะหน่อยว่าใช่ตัวเลขที่ถูกต้องหรือเปล่า ด้วย isNaN == true ถ้าเป็นข้อความ == false ถ้าเป็นตัวเลข
  if (isNaN(Number(numberStr))) {
    return "ข้อมูลนำเข้าไม่ถูกต้อง";
  } else {
    //ตรวสอบอีกสักครั้งว่าตัวเลขมากเกินความต้องการหรือเปล่า
    if (Number(numberStr) - 0 > 9999999.9999) {
      return "ข้อมูลนำเข้าเกินขอบเขตที่ตั้งไว้";
    } else {
      //พรากทศนิยม กับจำนวนเต็มออกจากกัน (บาปหรือเปล่าหนอเรา พรากคู่เขา)
      const parts = numberStr.split(".");
      //ขั้นตอนต่อไปนี้เป็นการประมวลผลดูกันเอาเองครับ แบบว่าขี้เกียจจะจิ้มดีดแล้ว อิอิอิ
      if (parts[1] && parts[1].length > 0) {
        parts[1] = parts[1].substring(0, 2);
      }
      var NumberLen = parts[0].length - 0;
      for (var i = 0; i < NumberLen; i++) {
        var tmp = Number(parts[0].substring(i, i + 1)) - 0;
        if (tmp != 0) {
          if (i == NumberLen - 1 && tmp == 1) {
            BahtText += "เอ็ด";
          } else if (i == NumberLen - 2 && tmp == 2) {
            BahtText += "ยี่";
          } else if (i == NumberLen - 2 && tmp == 1) {
            BahtText += "";
          } else {
            BahtText += TxtNumArr[tmp];
          }
          BahtText += TxtDigitArr[NumberLen - i - 1];
        }
      }
      BahtText += "บาท";
      if (parts[1] == "0" || parts[1] == "00") {
        BahtText += "ถ้วน";
      } else {
        var DecimalLen = (parts[1] || "").length - 0;
        for (var i = 0; i < DecimalLen; i++) {
          var tmp = Number((parts[1] || "").substring(i, i + 1)) - 0;
          if (tmp != 0) {
            if (i == DecimalLen - 1 && tmp == 1) {
              BahtText += "เอ็ด";
            } else if (i == DecimalLen - 2 && tmp == 2) {
              BahtText += "ยี่";
            } else if (i == DecimalLen - 2 && tmp == 1) {
              BahtText += "";
            } else {
              BahtText += TxtNumArr[tmp];
            }
            BahtText += TxtDigitArr[DecimalLen - i - 1];
          }
        }
        BahtText += "สตางค์";
      }
      return BahtText;
    }
  }
}
