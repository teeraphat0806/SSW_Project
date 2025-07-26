// src/app/layout.tsx
import "../globals.css";


export const metadata = {
  title: "My App",
  description: "My App Description",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
      
          {children}
        
      </body>
    </html>
  );
}
