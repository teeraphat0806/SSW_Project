import { randomBytes } from "crypto";

export function generateCode(length = 20) {
  const charset =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";

  const bytes = randomBytes(length);
  let result = "";

  for (let i = 0; i < length; i++) {
    const index = bytes[i]! % charset.length;
    result += charset[index];
  }

  return result;
}
