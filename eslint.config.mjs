import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 👇 บล็อกนี้คือส่วนสำคัญ: บอก ESLint ว่าโฟลเดอร์ไหนไม่ต้องสนใจเลย
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "build/**",
      "src/generated/**",
      "src/generated/prisma/**",
      "src/generated/prisma/runtime/**",
    ],
  },

  // config เดิมของ Next + TypeScript
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
