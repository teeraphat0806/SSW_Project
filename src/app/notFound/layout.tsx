// src/app/layout.tsx
import "../globals.css";

export const metadata = {
  title: "My App",
  description: "My App Description",
};

export default function NotFoundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>{children}</main>
  );
}
