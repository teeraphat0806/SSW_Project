// auth-core-fix.d.ts
// Workaround แก้บั๊ก @auth/core ที่ไม่มี RequestInternal export ออกมาจาก types.js

// 1) กรณีที่ TypeScript มอง module เป็น "@auth/core/types"
declare module "@auth/core/types" {
  // ถ้ามี RequestInternal อยู่แล้ว การประกาศซ้ำจะกลายเป็น merge
  // ถ้าไม่มี มันจะถูกเพิ่มเข้าไปใหม่
  export type RequestInternal = {
    method?: string;
    headers?: Record<string, any>;
    body?: any;
    query?: any;
    cookies?: Record<string, string>;
    url?: string | URL;
  };
}

// 2) กันกรณีที่มันใช้ path แบบ "../../types.js" ตาม error message
declare module "../../types.js" {
  export type RequestInternal = {
    method?: string;
    headers?: Record<string, any>;
    body?: any;
    query?: any;
    cookies?: Record<string, string>;
    url?: string | URL;
  };
}
