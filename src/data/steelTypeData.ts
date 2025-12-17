import { ShapeSteel } from "@prisma/client";

export const steelTypeData = [
  {
    codeSteel: "SS400",
    detail:
      "เหล็กกล้าคาร์บอนต่ำประเภทหนึ่งตามมาตรฐานญี่ปุ่น JIS G 3101 ที่นิยมใช้ในงานโครงสร้างทั่วไป",
    price: 23,
    amount: 100,
    shape: ShapeSteel.square,
    density: 7860,
  },
  {
    codeSteel: "SUS304",
    detail: "สเตนเลสออสเทนนิติก ทนการกัดกร่อนสูง เหมาะกับงานอาหารและเคมี",
    price: 95,
    amount: 50,
    shape: ShapeSteel.square,
    density: 8000,
  },
  {
    codeSteel: "A36",
    detail:
      "เหล็กโครงสร้างคาร์บอนต่ำ มาตรฐาน ASTM A36 นิยมใช้ทำโครงสร้างเหล็กทั่วไป",
    price: 28,
    amount: 200,
    shape: ShapeSteel.square,
    density: 7850,
  },
  {
    codeSteel: "A572",
    detail:
      "เหล็กโครงสร้างแรงดึงสูง มาตรฐาน ASTM A572 ใช้ในงานโครงสร้างที่ต้องการความแข็งแรงสูง",
    price: 32,
    amount: 150,
    shape: ShapeSteel.square,
    density: 7966,
  },
  {
    codeSteel: "A516",
    detail: "เหล็กแผ่นคาร์บอน มาตรฐาน ASTM A516 ใช้ในงานถังแรงดันและหม้อไอน้ำ",
    price: 30,
    amount: 80,
    shape: ShapeSteel.line,
    density: 7850,
  },
  {
    codeSteel: "AISI 1018",
    detail:
      "เหล็กกล้าคาร์บอนต่ำ มาตรฐาน AISI 1018 ใช้ในงานกลึงและงานเครื่องจักรทั่วไป",
    price: 25,
    amount: 120,
    shape: ShapeSteel.line,
    density: 7870,
  },
];
