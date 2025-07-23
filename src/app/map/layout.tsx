// src/app/layout.tsx
import "../globals.css";

export const metadata = {
  title: "My App",
  description: "My App Description",
};

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>{children}</main>
  );
}
