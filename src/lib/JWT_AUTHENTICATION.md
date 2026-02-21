# การใช้งาน JWT Authentication สำหรับ External API

## การตั้งค่า

### 1. เพิ่ม Environment Variable

ในไฟล์ `.env` หรือ `.env.local`:

```env
JWT_SECRET=your-super-secret-key-at-least-32-characters-long-please-change-this
```

**⚠️ สำคัญ:** ใช้ secret key ที่มีความยาวอย่างน้อย 32 ตัวอักษร และเก็บเป็นความลับ

---

## การสร้าง Token สำหรับ Client

### วิธีที่ 1: ใช้ไฟล์ generate-jwt.ts

1. เปิดไฟล์ `src/lib/generate-jwt.ts`
2. Uncomment ส่วน main function
3. เปลี่ยน clientId ตามต้องการ
4. รัน: `npx ts-node src/lib/generate-jwt.ts`

### วิธีที่ 2: รันคำสั่งนี้ใน Node.js REPL

```javascript
const { SignJWT } = require("jose");

const secret =
  "your-super-secret-key-at-least-32-characters-long-please-change-this";

const token = await new SignJWT({
  clientId: "client-website-001",
  purpose: "external-api-access",
})
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("30d")
  .sign(new TextEncoder().encode(secret));

console.log(token);
```

---

## การเรียกใช้ API จาก External Website

### JavaScript/Fetch API

```javascript
const response = await fetch(
  "https://your-domain.com/api/codeCustomer?codeCustomer=ABC123",
  {
    method: "GET",
    headers: {
      Authorization: "Bearer YOUR_JWT_TOKEN_HERE",
      "Content-Type": "application/json",
    },
  },
);

const data = await response.json();
console.log(data);
```

### cURL

```bash
curl -X GET "https://your-domain.com/api/codeCustomer?codeCustomer=ABC123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Axios

```javascript
import axios from "axios";

const response = await axios.get("https://your-domain.com/api/codeCustomer", {
  params: { codeCustomer: "ABC123" },
  headers: {
    Authorization: "Bearer YOUR_JWT_TOKEN_HERE",
  },
});
```

---

## Response

### ✅ Success (200)

```json
{
  "data": {
    "bill": { ... },
    "orderPO": { ... },
    "customer": { ... }
  }
}
```

### ❌ Unauthorized (401)

```json
{
  "error": "Unauthorized - Missing or invalid token"
}
```

หรือ

```json
{
  "error": "Unauthorized - Invalid or expired token"
}
```

### ❌ Bad Request (400)

```json
{
  "error": "codeCustomer parameter is required"
}
```

### ❌ Not Found (404)

```json
{
  "error": "Bill not found at ABC123"
}
```

---

## ข้อดีของการใช้ JWT

1. **มีวันหมดอายุ**: Token จะหมดอายุตามที่กำหนด (30 วัน, 7 วัน, ฯลฯ)
2. **ปลอดภัยกว่า**: มี signature ป้องกันการปลอมแปลง
3. **มี payload**: สามารถเก็บข้อมูลเพิ่มเติม เช่น clientId, permissions
4. **Stateless**: ไม่ต้องเก็บใน database
5. **มาตรฐาน**: เป็นมาตรฐานที่ใช้กันทั่วไป

---

## การ Revoke Token

หาก token รั่วไหล:

1. เปลี่ยน `JWT_SECRET` ใน environment variable
2. Token เก่าทั้งหมดจะใช้ไม่ได้ทันที
3. สร้าง token ใหม่ให้ client ที่เชื่อถือได้
