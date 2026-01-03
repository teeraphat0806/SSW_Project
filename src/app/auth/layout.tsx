// src/app/layout.tsx
import "../globals.css";
import { AuthProvider } from "@/contexts/Authcontext";

export const metadata = {
  title: "SSW Steel Center",
  description: "SSW Steel Center - Steel Management System",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
