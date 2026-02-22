// ไฟล์สำหรับสร้าง JWT Token ให้กับ External Client
// สามารถรันไฟล์นี้เพื่อสร้าง token หรือสร้าง API endpoint สำหรับ issue token

import { SignJWT } from "jose";

export async function generateClientToken(
  clientId: string,
  expiresIn: string = "30d",
) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  const token = await new SignJWT({
    clientId,
    purpose: "external-api-access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn) // เช่น "30d", "7d", "24h"
    .sign(new TextEncoder().encode(secret));

  return token;
}

// ตัวอย่างการใช้งาน (uncomment เพื่อรัน)
// async function main() {
//   const token = await generateClientToken("client-website-001", "30d");
//   console.log("Generated JWT Token:");
//   console.log(token);
// }
//
// main();
