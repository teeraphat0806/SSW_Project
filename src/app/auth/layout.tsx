// src/app/layout.tsx
import "../globals.css";
import { AuthProvider } from "@/contexts/Authcontext";

export const metadata = {
  title: "My App",
  description: "My App Description",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
